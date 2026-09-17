"use client";

import { useEffect, useMemo, useState } from "react";
import { PLACES, PROVIDER_NAME, HOME_CITIES, placeOf, type Copy } from "@/lib/places";
import { PRESETS, withUids } from "@/lib/presets";
import { assess, HAZARDS } from "@/lib/risk";
import { km } from "@/lib/geo";
import Rings from "./Rings";

let seq = 100;

const TONE = {
  critical: "var(--gone)",
  high: "var(--exposed)",
  medium: "var(--ink-dim)",
} as const;

export default function Assess() {
  const [preset, setPreset] = useState(PRESETS[0].id);
  const [copies, setCopies] = useState<Copy[]>(() => withUids(PRESETS[0]));
  const [homeId, setHomeId] = useState<string>(HOME_CITIES[0].id);

  const home = HOME_CITIES.find((c) => c.id === homeId)!.at;
  const v = useMemo(() => assess(copies, home), [copies, home]);

  /**
   * The page takes its colour from the verdict. Red when a single building
   * reaches every copy, amber when something regional does, pale when nothing
   * on the list does. It is a reading, not a theme.
   */
  const colour =
    v.grade === "critical" ? "var(--gone)"
    : v.grade === "high" ? "var(--exposed)"
    : v.grade === "medium" ? "var(--ink-dim)"
    : "var(--held)";

  useEffect(() => {
    document.documentElement.style.setProperty("--verdict", colour);
  }, [colour]);

  const load = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPreset(id);
    setCopies(withUids(p));
  };

  const patch = (uid: string, d: Partial<Copy>) => {
    setPreset("custom");
    setCopies((cs) => cs.map((c) => (c.uid === uid ? { ...c, ...d } : c)));
  };

  const add = () => {
    setPreset("custom");
    setCopies((cs) => [...cs, { uid: `c${++seq}`, placeId: "aws-eu-west-1", account: "", immutable: false, label: `copy ${cs.length + 1}` }]);
  };

  const remove = (uid: string) => {
    setPreset("custom");
    setCopies((cs) => cs.filter((c) => c.uid !== uid));
  };

  const plotted = v.copies
    .map((c) => ({ place: placeOf(c.placeId)!, label: c.label, immutable: c.immutable }))
    .filter((p) => p.place);

  return (
    <div>
      {/* Where "yours" is */}
      <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="mark">[ copies you keep yourself are near ]</span>
        <select value={homeId} onChange={(e) => setHomeId(e.target.value)}
          className="mono cell bg-void px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-rule-lit">
          {HOME_CITIES.map((c) => <option key={c.id} value={c.id} className="bg-void">{c.name}</option>)}
        </select>
        <span className="mark">so a laptop is not silently placed in someone else&rsquo;s country</span>
      </div>

      {/* Presets */}
      <div className="mark mb-3">[ start from ]</div>
      <div className="mb-8 grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => load(p.id)}
            className="bg-void px-4 py-4 text-left transition-colors hover:bg-[#0a0908]"
            style={{ outline: preset === p.id ? "1px solid var(--ink)" : "none", outlineOffset: "-1px" }}>
            <div className="display text-[19px] leading-tight"
              style={{ color: preset === p.id ? "var(--ink)" : "var(--ink-dim)" }}>
              {p.name}
            </div>
            <p className="mt-1.5 text-[12px] leading-[1.5] text-faint">{p.blurb}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_520px] lg:items-start">
        {/* The copies */}
        <div>
          <div className="mark mb-3">[ your copies ]</div>
          <div className="grid gap-px bg-rule">
            {copies.map((c) => {
              const place = placeOf(c.placeId);
              return (
                <div key={c.uid} className="bg-void px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <input value={c.label} onChange={(e) => patch(c.uid, { label: e.target.value })}
                      className="mono min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none" />
                    <button onClick={() => remove(c.uid)}
                      className="mark shrink-0 hover:text-ink">remove</button>
                  </div>

                  <div className="mt-2.5 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <select value={c.placeId} onChange={(e) => patch(c.uid, { placeId: e.target.value })}
                      className="mono w-full cell bg-void px-2.5 py-1.5 text-[12px] text-dim outline-none focus:border-rule-lit">
                      {PLACES.map((p) => (
                        <option key={p.id} value={p.id} className="bg-void">
                          {PROVIDER_NAME[p.provider]} · {p.code} · {p.city}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input value={c.zone ?? ""} placeholder="zone"
                        onChange={(e) => patch(c.uid, { zone: e.target.value })}
                        className="mono w-full cell bg-void px-2.5 py-1.5 text-[12px] text-dim outline-none placeholder:text-faint focus:border-rule-lit sm:w-[92px]" />
                      <input value={c.account} placeholder="whose key?"
                        onChange={(e) => patch(c.uid, { account: e.target.value })}
                        className="mono w-full cell bg-void px-2.5 py-1.5 text-[12px] text-dim outline-none placeholder:text-faint focus:border-rule-lit sm:w-[118px]" />
                      <button onClick={() => patch(c.uid, { immutable: !c.immutable })}
                        aria-pressed={c.immutable}
                        className="mark shrink-0 cell px-2.5 py-1.5"
                        style={{ color: c.immutable ? "var(--held)" : "var(--ink-faint)", borderColor: c.immutable ? "var(--held)" : "var(--rule)" }}>
                        offline
                      </button>
                    </div>
                  </div>

                  {place && (
                    <div className="mark mt-2">{place.city} · {place.country} · {place.jurisdiction}</div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={add} className="mark mt-3 cell w-full py-2.5 hover:text-ink">
            + another copy
          </button>
        </div>

        {/* The reading */}
        <div className="lg:sticky lg:top-6">
          <div className="mark mb-3">[ blast radius ]</div>
          <div className="cell p-3">
            <Rings centre={v.centre} radiusKm={v.radiusKm} items={plotted} verdictColour={colour} />
          </div>
        </div>
      </div>

      {/* The verdict */}
      <div className="mt-12 rule-t pt-8">
        <div className="mark mb-4">[ the verdict ]</div>

        <h2 className="display max-w-[20ch] text-[clamp(30px,5.6vw,58px)] leading-[1.04]" style={{ color: colour }}>
          {copies.length === 0
            ? "There is nothing here to lose."
            : v.killedBy
              ? `One event ${km(v.killedBy.radiusKm)} across takes every copy.`
              : v.singleAccount
                ? "No event reaches all of them. One password does."
                : v.grade === "clear"
                  ? "Nothing on this list reaches all of them."
                  : "No single event reaches all of them — but something else might."}
        </h2>

        <p className="mt-5 max-w-[62ch] text-[15px] leading-[1.7] text-dim">
          {copies.length === 0 ? (
            <>Add a copy to begin.</>
          ) : (
            <>
              Everything you have fits inside a circle{" "}
              <span className="mono text-ink">{v.azInferred ? `up to ${km(v.radiusKm)}` : km(v.radiusKm)}</span>{" "}
              in radius.
              {v.azInferred && (
                <> Copies share a region, and providers do not publish how far apart their zones
                  are — so that figure is AWS&rsquo;s own documented upper bound rather than a
                  measurement.</>
              )}
              {v.widest && v.widest.km > 0 && (
                <> The furthest two copies — {v.widest.a.label} and {v.widest.b.label} — are{" "}
                  <span className="mono text-ink">{km(v.widest.km)}</span> apart.</>
              )}
              {v.killedBy && <> {v.killedBy.note}</>}
            </>
          )}
        </p>

        {v.findings.length > 0 && (
          <div className="mt-8 grid gap-px bg-rule">
            {v.findings.map((f) => (
              <div key={f.id} className="bg-void px-5 py-4">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="mark" style={{ color: TONE[f.severity] }}>{f.severity}</span>
                  <span className="display text-[20px] leading-tight">{f.title}</span>
                </div>
                <p className="mt-2 max-w-[74ch] text-[13.5px] leading-[1.65] text-dim">{f.detail}</p>
              </div>
            ))}
          </div>
        )}

        {/* What it does and does not survive */}
        <div className="mt-8">
          <div className="mark mb-3">[ against each hazard ]</div>
          <div className="grid gap-px bg-rule">
            {HAZARDS.map((h) => {
              const takesAll = copies.length > 0 && h.radiusKm >= v.radiusKm;
              return (
                <div key={h.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 bg-void px-5 py-3">
                  <span className="mono w-[76px] shrink-0 text-[12px] text-faint">
                    {h.radiusKm < 1 ? `${h.radiusKm * 1000} m` : `${h.radiusKm.toLocaleString()} km`}
                  </span>
                  <span className="min-w-0 flex-1 text-[13.5px]">{h.name}</span>
                  <span className="mark shrink-0" style={{ color: takesAll ? "var(--gone)" : "var(--held)" }}>
                    {takesAll ? "takes everything" : "survivable"}
                  </span>
                </div>
              );
            })}
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 bg-void px-5 py-3">
              <span className="mono w-[76px] shrink-0 text-[12px] text-faint">—</span>
              <span className="min-w-0 flex-1 text-[13.5px]">Someone with your credentials</span>
              <span className="mark shrink-0" style={{ color: v.singleAccount ? "var(--gone)" : "var(--held)" }}>
                {v.singleAccount ? "takes everything" : "survivable"}
              </span>
            </div>
          </div>
          <p className="mt-3 max-w-[70ch] text-[12.5px] leading-[1.6] text-faint">
            That last row has no radius, which is the point. Credentials are not geography, and a
            setup spanning continents still dies to one leaked key unless something in it is offline
            or write-once.
          </p>
        </div>
      </div>
    </div>
  );
}
