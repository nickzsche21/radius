/**
 * Distance, and the smallest circle that swallows everything.
 *
 * The question this whole tool answers is geometric: if every copy of your data
 * fits inside one circle, then any event with at least that radius takes all of
 * them at once. "Multi-AZ" sounds like redundancy until you notice AWS's own
 * documentation puts availability zones within about 100 km of each other.
 */

export interface Point { lat: number; lon: number }

const R_EARTH_KM = 6371.0088;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function haversine(a: Point, b: Point): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

export interface Enclosing { centre: Point; radiusKm: number }

/**
 * Smallest enclosing circle, on the sphere.
 *
 * Welzl's algorithm is the textbook answer but it is planar, and these points
 * can be continents apart — projecting them flat would understate the radius by
 * a lot at that scale. Instead: seed at the centroid of the 3D unit vectors and
 * walk toward whichever point is currently furthest. It converges quickly and
 * never reports a circle that fails to contain every point, which is the
 * property that matters when the number is a safety claim.
 */
export function smallestEnclosingCircle(points: Point[]): Enclosing {
  if (points.length === 0) return { centre: { lat: 0, lon: 0 }, radiusKm: 0 };
  if (points.length === 1) return { centre: points[0], radiusKm: 0 };

  const vec = (p: Point) => {
    const la = rad(p.lat), lo = rad(p.lon);
    return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)] as const;
  };
  const toPoint = (v: readonly [number, number, number]): Point => {
    const n = Math.hypot(v[0], v[1], v[2]) || 1;
    const [x, y, z] = [v[0] / n, v[1] / n, v[2] / n];
    return { lat: (Math.asin(z) * 180) / Math.PI, lon: (Math.atan2(y, x) * 180) / Math.PI };
  };

  let c: [number, number, number] = [0, 0, 0];
  for (const p of points) { const v = vec(p); c = [c[0] + v[0], c[1] + v[1], c[2] + v[2]]; }
  let centre = toPoint(c);

  // Move a shrinking fraction of the way toward the current furthest point.
  let step = 0.5;
  for (let iter = 0; iter < 240; iter++) {
    let worst = points[0], worstD = -1;
    for (const p of points) {
      const d = haversine(centre, p);
      if (d > worstD) { worstD = d; worst = p; }
    }
    const cv = vec(centre), wv = vec(worst);
    centre = toPoint([
      cv[0] + (wv[0] - cv[0]) * step,
      cv[1] + (wv[1] - cv[1]) * step,
      cv[2] + (wv[2] - cv[2]) * step,
    ]);
    step *= 0.97;
  }

  const raw = points.reduce((m, p) => Math.max(m, haversine(centre, p)), 0);
  // Coincident points leave floating-point residue on the order of a picometre.
  // Everything here is city-level to begin with, so anything under a metre is
  // noise and reporting it would be fake precision.
  const radiusKm = raw < 1e-3 ? 0 : raw;
  return { centre, radiusKm };
}

/** The two copies that are furthest apart — the span the setup actually achieves. */
export function widestPair(points: Point[]): { a: number; b: number; km: number } | null {
  if (points.length < 2) return null;
  let best = { a: 0, b: 1, km: -1 };
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const km = haversine(points[i], points[j]);
      if (km > best.km) best = { a: i, b: j, km };
    }
  }
  return best;
}

export const km = (n: number) =>
  n < 1 ? `${Math.round(n * 1000)} m` : n < 100 ? `${n.toFixed(1)} km` : `${Math.round(n).toLocaleString()} km`;
