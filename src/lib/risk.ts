/**
 * What takes every copy at once.
 *
 * Distance is only one axis. A setup can span ten thousand kilometres and still
 * die to a single leaked root key, because credentials are not geographic. So
 * the verdict is the *narrowest* thing that reaches everything — whichever of
 * geography, provider, account or jurisdiction closes first.
 */

import { haversine, smallestEnclosingCircle, widestPair, type Point } from "./geo";
import { placeOf, type Copy, type Place } from "./places";

/**
 * Reference events, by the radius over which they destroy or deny access.
 *
 * The 100 km figure is not ours: AWS documents availability zones as "meaningfully
 * distant from each other, up to 60 miles (~100 km)… but close enough to use
 * synchronous replication". That sentence is the whole reason this tool exists.
 */
export interface Hazard {
  id: string;
  name: string;
  radiusKm: number;
  note: string;
}

/** AWS's documented upper bound on availability-zone separation, in km. */
export const AZ_SPAN_KM = 100;

export const HAZARDS: Hazard[] = [
  { id: "rack", name: "A rack, a fire, a bad deploy", radiusKm: 0.2, note: "One building. The failure everybody actually plans for." },
  { id: "metro", name: "Flood, storm, metro power loss", radiusKm: 40, note: "A city and its outskirts lose power or get water in the basement." },
  { id: "az", name: "Everything inside one cloud region", radiusKm: 100, note: "AWS places availability zones up to ~100 km apart. Multi-AZ is not multi-region." },
  { id: "regional", name: "Hurricane, earthquake, grid collapse", radiusKm: 500, note: "A weather system or a synchronised grid covers this comfortably." },
  { id: "national", name: "War, sanctions, a national outage", radiusKm: 1500, note: "The scale at which a country stops being a place you can retrieve data from." },
];

export type Severity = "gone" | "exposed" | "survives";

export interface Finding {
  id: string;
  severity: "critical" | "high" | "medium";
  title: string;
  detail: string;
}

export interface Verdict {
  copies: Copy[];
  places: Place[];
  /** Smallest circle containing every copy. */
  radiusKm: number;
  centre: Point;
  /** The two furthest-apart copies. */
  widest: { a: Copy; b: Copy; km: number } | null;
  /** The first hazard whose radius swallows everything. */
  killedBy: Hazard | null;
  /** Hazards this setup does survive. */
  survives: Hazard[];
  findings: Finding[];
  /**
   * True when the span is not measured but inferred from the provider's own
   * documented zone separation, because copies share a region.
   */
  azInferred: boolean;
  /** Worst severity anywhere — geography is only one way to lose everything. */
  grade: "critical" | "high" | "medium" | "clear";
  /** Distinct credential sets that can reach the copies. */
  accounts: string[];
  /** True when one account can delete every mutable copy. */
  singleAccount: boolean;
  jurisdictions: string[];
}

export function assess(copies: Copy[], home?: Point): Verdict {
  const places = copies
    .map((c) => placeOf(c.placeId))
    .filter((p): p is Place => !!p)
    // Copies you keep yourself sit wherever the reader says they are.
    .map((p) => (p.provider === "self" && home ? { ...p, at: home } : p));
  const pts = places.map((p) => p.at);

  const { centre, radiusKm: measured } = smallestEnclosingCircle(pts);

  // Copies sharing a region but sitting in different zones are separated by a
  // distance the provider does not publish. Reporting 0 would be wrong in the
  // dangerous direction, so fall back to the documented upper bound: it is the
  // provider's own figure, and either way the event that reaches both is
  // regional rather than a single building.
  const byRegion = new Map<string, Set<string>>();
  for (const c of copies) {
    const zones = byRegion.get(c.placeId) ?? new Set<string>();
    zones.add((c.zone ?? "").trim().toLowerCase());
    byRegion.set(c.placeId, zones);
  }
  const azInferred = [...byRegion.values()].some((z) => z.size > 1);
  const radiusKm = azInferred ? Math.max(measured, AZ_SPAN_KM) : measured;
  const wide = widestPair(pts);
  const widest = wide && copies[wide.a] && copies[wide.b]
    ? { a: copies[wide.a], b: copies[wide.b], km: wide.km }
    : null;

  // A hazard takes everything when its radius reaches every copy from one point.
  // Using the enclosing radius is the honest test: it is the smallest circle that
  // contains them, so anything larger certainly does.
  const killedBy = copies.length ? HAZARDS.find((h) => h.radiusKm >= radiusKm) ?? null : null;
  const survives = HAZARDS.filter((h) => h.radiusKm < radiusKm);

  const mutable = copies.filter((c) => !c.immutable);
  const accounts = [...new Set(copies.map((c) => c.account.trim().toLowerCase()).filter(Boolean))];
  const mutableAccounts = [...new Set(mutable.map((c) => c.account.trim().toLowerCase()).filter(Boolean))];
  const singleAccount = mutable.length > 1 && mutableAccounts.length === 1;

  const providers = [...new Set(places.map((p) => p.provider))];
  const jurisdictions = [...new Set(places.map((p) => p.jurisdiction))];

  const findings: Finding[] = [];

  if (copies.length === 1) {
    findings.push({
      id: "single", severity: "critical",
      title: "There is one copy",
      detail: "A single copy is not a backup, it is the original. Everything below is about how many ways there are to lose it.",
    });
  }

  if (killedBy) {
    findings.push({
      id: "enclosed", severity: killedBy.radiusKm <= 100 ? "critical" : "high",
      title: `Every copy fits inside ${Math.round(killedBy.radiusKm).toLocaleString()} km`,
      detail: `${killedBy.name} reaches all of them at once. ${killedBy.note}`,
    });
  }

  if (singleAccount) {
    findings.push({
      id: "one-key", severity: "critical",
      title: "One set of credentials can delete all of them",
      detail: `Every deletable copy sits under “${mutable[0].account}”. Distance does not help here — whoever holds that key reaches ${Math.round(radiusKm).toLocaleString()} km in one command, and ransomware does it faster than a hurricane.`,
    });
  }

  if (providers.length === 1 && providers[0] !== "self" && copies.length > 1) {
    findings.push({
      id: "one-provider", severity: "high",
      title: "One provider holds everything",
      detail: "A billing dispute, a suspended account or a control-plane failure is not geographic, and none of your copies are outside it.",
    });
  }

  if (jurisdictions.length === 1 && copies.length > 1 && jurisdictions[0] !== "local") {
    findings.push({
      id: "one-jurisdiction", severity: "medium",
      title: `Everything is under one jurisdiction (${jurisdictions[0]})`,
      detail: "Copies can be thousands of kilometres apart and still answer to the same legal order, seizure or sanction.",
    });
  }

  if (mutable.length === copies.length && copies.length > 0) {
    findings.push({
      id: "no-immutable", severity: "high",
      title: "Nothing is offline or write-once",
      detail: "Every copy can be reached and overwritten by something with the right access. One immutable or offline copy is what turns a bad night into an inconvenience.",
    });
  }

  const grade: Verdict["grade"] =
    findings.some((f) => f.severity === "critical") ? "critical"
    : findings.some((f) => f.severity === "high") ? "high"
    : findings.some((f) => f.severity === "medium") ? "medium"
    : "clear";

  return {
    copies, places, radiusKm, centre, widest, killedBy, survives,
    azInferred, grade, findings, accounts, singleAccount, jurisdictions,
  };
}

/** Does this specific hazard, centred on this copy, reach the others? */
export function reachFrom(from: Place, others: Place[], hazard: Hazard): number {
  return others.filter((p) => haversine(from.at, p.at) <= hazard.radiusKm).length;
}
