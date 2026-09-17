"use client";

import { haversine, km, type Point } from "@/lib/geo";
import { HAZARDS } from "@/lib/risk";
import type { Place } from "@/lib/places";

/**
 * Your copies, plotted against the things that could reach all of them.
 *
 * The radial axis is logarithmic and labelled as such, because the interesting
 * span runs from a single building (0.2 km) to the other side of the planet
 * (20,000 km) and no linear axis survives five orders of magnitude. Bearings are
 * true; only the distance is compressed.
 */

const SIZE = 520;
const C = SIZE / 2;
const R_MAX = SIZE / 2 - 34;
const MIN_KM = 0.1;
const MAX_KM = 20_000;

const toR = (d: number) => {
  const clamped = Math.max(MIN_KM, Math.min(MAX_KM, d));
  return (R_MAX * (Math.log10(clamped) - Math.log10(MIN_KM))) / (Math.log10(MAX_KM) - Math.log10(MIN_KM));
};

/** Initial bearing from a to b, in degrees clockwise from north. */
function bearing(a: Point, b: Point): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLon = rad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export interface Plotted { place: Place; label: string; immutable: boolean }

export default function Rings({
  centre, radiusKm, items, verdictColour,
}: {
  centre: Point;
  radiusKm: number;
  items: Plotted[];
  verdictColour: string;
}) {
  const enclosing = toR(radiusKm);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full" role="img"
      aria-label={`Your copies plotted against hazard radii. Everything fits within ${km(radiusKm)}.`}>
      {/* hazard rings */}
      {HAZARDS.map((h) => {
        const r = toR(h.radiusKm);
        const reaches = h.radiusKm >= radiusKm && items.length > 0;
        return (
          <g key={h.id}>
            <circle cx={C} cy={C} r={r} fill="none"
              stroke={reaches ? "var(--gone)" : "var(--rule-lit)"}
              strokeWidth={reaches ? 1.2 : 1}
              strokeDasharray={reaches ? "none" : "2 5"}
              opacity={reaches ? 0.55 : 1} />
            <text x={C + 5} y={C - r - 4} className="mono"
              fontSize={9} letterSpacing="0.16em"
              fill={reaches ? "var(--gone)" : "var(--ink-faint)"}>
              {h.radiusKm < 1 ? `${h.radiusKm * 1000}M` : `${h.radiusKm.toLocaleString()}KM`}
            </text>
          </g>
        );
      })}

      {/* the circle that contains everything */}
      {items.length > 1 && (
        <circle cx={C} cy={C} r={enclosing} fill={verdictColour} fillOpacity={0.07}
          stroke={verdictColour} strokeWidth={1.6} />
      )}

      {/* crosshair */}
      <line x1={C} y1={C - R_MAX - 12} x2={C} y2={C + R_MAX + 12} stroke="var(--rule)" strokeWidth={1} />
      <line x1={C - R_MAX - 12} y1={C} x2={C + R_MAX + 12} y2={C} stroke="var(--rule)" strokeWidth={1} />

      {/* the copies */}
      {items.map((it, i) => {
        const d = haversine(centre, it.place.at);
        const r = items.length === 1 ? 0 : toR(d);
        const th = ((bearing(centre, it.place.at) - 90) * Math.PI) / 180;
        const x = C + r * Math.cos(th);
        const y = C + r * Math.sin(th);
        return (
          <g key={`${it.place.id}-${i}`}>
            <line x1={C} y1={C} x2={x} y2={y} stroke="var(--rule-lit)" strokeWidth={1} />
            {it.immutable ? (
              <rect x={x - 4.5} y={y - 4.5} width={9} height={9} fill="var(--held)" />
            ) : (
              <circle cx={x} cy={y} r={4.5} fill="var(--ink)" />
            )}
            <text x={x + 9} y={y + 3.5} className="mono" fontSize={9.5} fill="var(--ink-dim)">
              {it.label.slice(0, 22)}
            </text>
          </g>
        );
      })}

      <circle cx={C} cy={C} r={2} fill="var(--ink-faint)" />
      <text x={C} y={SIZE - 6} textAnchor="middle" className="mono" fontSize={9}
        letterSpacing="0.16em" fill="var(--ink-faint)">
        LOGARITHMIC · BEARINGS TRUE
      </text>
    </svg>
  );
}
