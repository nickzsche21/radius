import { haversine, smallestEnclosingCircle, widestPair, km } from "./geo";
import { assess, HAZARDS } from "./risk";
import { PLACES, placeOf, type Copy } from "./places";

let pass = 0, fail = 0;
const ok = (label: string, cond: boolean, detail = "") => {
  cond ? pass++ : fail++;
  console.log(`${cond ? "  ok  " : " FAIL "} ${label}${cond || !detail ? "" : `\n         ${detail}`}`);
};
const near = (a: number, b: number, tolPct = 0.01) => Math.abs(a - b) <= Math.abs(b) * tolPct + 1;

const LONDON = { lat: 51.5074, lon: -0.1278 };
const PARIS = { lat: 48.8566, lon: 2.3522 };
const NYC = { lat: 40.7128, lon: -74.006 };
const SYDNEY = { lat: -33.8688, lon: 151.2093 };

console.log("\nDistance against known figures");
ok("London → Paris ≈ 344 km", near(haversine(LONDON, PARIS), 344, 0.02), haversine(LONDON, PARIS).toFixed(0));
ok("London → New York ≈ 5,570 km", near(haversine(LONDON, NYC), 5570, 0.02), haversine(LONDON, NYC).toFixed(0));
ok("New York → Sydney ≈ 15,990 km", near(haversine(NYC, SYDNEY), 15990, 0.02), haversine(NYC, SYDNEY).toFixed(0));
ok("a point is zero from itself", haversine(LONDON, LONDON) === 0);
ok("distance is symmetric", haversine(LONDON, NYC) === haversine(NYC, LONDON));
ok("antipodes ≈ half the circumference", near(haversine({ lat: 0, lon: 0 }, { lat: 0, lon: 180 }), 20015, 0.01));
ok("crossing the date line is not the long way round",
   near(haversine({ lat: 0, lon: 179 }, { lat: 0, lon: -179 }), 222, 0.02),
   haversine({ lat: 0, lon: 179 }, { lat: 0, lon: -179 }).toFixed(0));

console.log("\nThe enclosing circle must actually enclose");
{
  ok("no points is zero", smallestEnclosingCircle([]).radiusKm === 0);
  ok("one point is zero", smallestEnclosingCircle([LONDON]).radiusKm === 0);

  const two = smallestEnclosingCircle([LONDON, PARIS]);
  ok("two points give half their separation", near(two.radiusKm, haversine(LONDON, PARIS) / 2, 0.02), two.radiusKm.toFixed(1));

  // The safety property: the reported radius is a claim that one event of that
  // size reaches everything, so it must never fall short of any point.
  const sets = [
    [LONDON, PARIS, NYC],
    [LONDON, NYC, SYDNEY],
    [SYDNEY, { lat: -33.9, lon: 151.3 }, { lat: -34.0, lon: 151.1 }],
    PLACES.slice(0, 10).map((p) => p.at),
    [{ lat: 0, lon: 179 }, { lat: 0, lon: -179 }, { lat: 1, lon: 180 }],
  ];
  let contains = true, worstOver = 0;
  for (const s of sets) {
    const c = smallestEnclosingCircle(s);
    for (const p of s) {
      const d = haversine(c.centre, p);
      if (d > c.radiusKm + 1e-6) contains = false;
      worstOver = Math.max(worstOver, d - c.radiusKm);
    }
  }
  ok("every point lies inside the circle, in every set", contains, `worst overshoot ${worstOver.toFixed(6)} km`);

  // And it must not be wildly loose, or the verdict overstates the danger.
  const global = smallestEnclosingCircle([LONDON, NYC, SYDNEY]);
  ok("the circle is tight, not merely valid", global.radiusKm < 9000, global.radiusKm.toFixed(0));
  ok("...and still large enough to be global", global.radiusKm > 6000, global.radiusKm.toFixed(0));
}

console.log("\nThe widest pair");
{
  // London is further from Sydney than Paris is — going east, Paris has a head
  // start. Worth asserting explicitly, since the intuition runs the other way.
  const w = widestPair([LONDON, PARIS, SYDNEY]);
  ok("finds the genuinely furthest two", w!.a === 0 && w!.b === 2, JSON.stringify(w));
  ok("reports their distance", near(w!.km, haversine(LONDON, SYDNEY), 0.001));
  ok("...and London really is the further one", haversine(LONDON, SYDNEY) > haversine(PARIS, SYDNEY));
  ok("fewer than two points has no pair", widestPair([LONDON]) === null);
}

console.log("\nFormatting");
ok("sub-kilometre reads in metres", km(0.2) === "200 m", km(0.2));
ok("tens of km keep a decimal", km(43.6) === "43.6 km", km(43.6));
ok("large distances get separators", km(15990) === "15,990 km", km(15990));

const copy = (placeId: string, account: string, immutable = false): Copy =>
  ({ uid: placeId + account, placeId, account, immutable, label: placeId });

console.log("\nThe verdict: multi-AZ is not multi-region");
{
  // Two copies in the same city, which is what "multi-AZ" amounts to here.
  const v = assess([copy("aws-us-east-1", "prod"), copy("gcp-us-east4", "prod2")]);
  ok("the enclosing radius is tiny", v.radiusKm < 1, v.radiusKm.toFixed(3));
  ok("a single building fire reaches everything", v.killedBy?.id === "rack", v.killedBy?.id);
  // "Survives" means hazards too small to reach every copy. Two copies in one
  // city fit inside all of them, so the honest answer is that it survives none.
  ok("it survives none of them", v.survives.length === 0, String(v.survives.length));
  ok("and says so as a critical finding", v.findings.some((f) => f.id === "enclosed" && f.severity === "critical"));
}

console.log("\nZones inside one region are not one point");
{
  const az = (z: string) => ({ uid: "u" + z, placeId: "aws-us-east-1", zone: z, account: "prod", immutable: false, label: z });
  const two = assess([az("us-east-1a"), az("us-east-1b")]);
  ok("two zones are not reported as zero apart", two.radiusKm >= 100, two.radiusKm.toFixed(0));
  ok("the span is flagged as inferred, not measured", two.azInferred);
  ok("a rack fire is no longer blamed for both", two.killedBy?.id !== "rack", two.killedBy?.id);
  ok("the regional hazard is what reaches them", two.killedBy?.id === "az", two.killedBy?.id);

  const same = assess([az("us-east-1a"), { ...az("us-east-1a"), uid: "dup" }]);
  ok("but the same zone twice really is one point", same.radiusKm === 0 && !same.azInferred,
     `${same.radiusKm} / ${same.azInferred}`);
}

console.log("\nNo fake precision");
{
  // Coincident points must come back as exactly zero, not 1.2e-12 km.
  const c = smallestEnclosingCircle([LONDON, LONDON, LONDON]);
  ok("identical points give exactly zero", c.radiusKm === 0, String(c.radiusKm));
  ok("...and a real separation is untouched",
     smallestEnclosingCircle([LONDON, PARIS]).radiusKm > 100);
}

console.log("\nThe verdict: genuinely spread out");
{
  const v = assess([
    copy("aws-us-east-1", "a"), copy("aws-ap-southeast-2", "b"), copy("aws-eu-central-1", "c"),
  ]);
  ok("radius is continental", v.radiusKm > 5000, v.radiusKm.toFixed(0));
  ok("no listed hazard reaches everything", v.killedBy === null);
  ok("it survives every listed hazard", v.survives.length === HAZARDS.length);
  ok("but one provider is still flagged", v.findings.some((f) => f.id === "one-provider"));
  ok("and the widest pair is reported", v.widest !== null && v.widest.km > 10000, String(v.widest?.km.toFixed(0)));
}

console.log("\nDistance does not save you from a shared key");
{
  const shared = assess([copy("aws-us-east-1", "root"), copy("aws-ap-southeast-2", "root")]);
  ok("one credential across continents is critical", shared.findings.some((f) => f.id === "one-key" && f.severity === "critical"));
  ok("...and the message says distance does not help", shared.findings.find((f) => f.id === "one-key")!.detail.includes("Distance does not help"));

  const split = assess([copy("aws-us-east-1", "root"), copy("aws-ap-southeast-2", "other")]);
  ok("two credentials clears it", !split.findings.some((f) => f.id === "one-key"));

  // An offline copy is out of reach of whoever holds the keys.
  const offline = assess([copy("aws-us-east-1", "root"), copy("self-drawer", "root", true)]);
  ok("an immutable copy is not counted as deletable", !offline.findings.some((f) => f.id === "one-key"));
  ok("...and the no-immutable warning goes away", !offline.findings.some((f) => f.id === "no-immutable"));
}

console.log("\nJurisdiction is not distance");
{
  const v = assess([copy("aws-us-east-1", "a"), copy("aws-us-west-2", "b")]);
  ok("two US regions are far apart", v.radiusKm > 1500, v.radiusKm.toFixed(0));
  ok("but share one jurisdiction, and it is flagged", v.findings.some((f) => f.id === "one-jurisdiction"));
  const mixed = assess([copy("aws-us-east-1", "a"), copy("aws-eu-central-1", "b")]);
  ok("across blocs it is not flagged", !mixed.findings.some((f) => f.id === "one-jurisdiction"));
}

console.log("\nThe verdict cannot claim safety while a critical finding stands");
{
  const far = assess([copy("aws-us-east-1", "root"), copy("aws-ap-southeast-2", "root")]);
  ok("no hazard reaches both", far.killedBy === null);
  ok("but the grade is critical, because one key does", far.grade === "critical", far.grade);

  const split = assess([copy("aws-us-east-1", "a"), copy("aws-ap-southeast-2", "b"), copy("self-drawer", "c", true)]);
  ok("separate keys plus an offline copy grades clear", split.grade === "clear", split.grade);
}

console.log("\nCopies you keep yourself go where you say");
{
  const LON = { lat: 51.51, lon: -0.13 };
  const anchored = assess([copy("self-home", "me"), copy("aws-ap-south-1", "cloud")], LON);
  ok("a London laptop is far from Mumbai", anchored.radiusKm > 3000, anchored.radiusKm.toFixed(0));
  const mumbai = assess([copy("self-home", "me"), copy("aws-ap-south-1", "cloud")], { lat: 19.08, lon: 72.88 });
  ok("a Mumbai laptop is not", mumbai.radiusKm < 50, mumbai.radiusKm.toFixed(0));
  ok("and without a home it is not silently placed somewhere",
     assess([copy("self-home", "me")]).places[0].at.lat === 0);
}

console.log("\nGuards");
ok("one copy is called out as not a backup", assess([copy("aws-us-east-1", "a")]).findings.some((f) => f.id === "single"));
ok("no copies does not throw", assess([]).radiusKm === 0);
ok("no copies has no killer", assess([]).killedBy === null);
ok("an unknown place is dropped rather than crashing", assess([copy("nope", "a")]).places.length === 0);
ok("every listed place resolves", PLACES.every((p) => placeOf(p.id) !== null));
ok("hazards ascend by radius", HAZARDS.every((h, i) => i === 0 || HAZARDS[i - 1].radiusKm < h.radiusKm));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
