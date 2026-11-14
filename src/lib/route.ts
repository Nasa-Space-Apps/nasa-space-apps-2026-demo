import * as THREE from "three";
import type { Checkpoint } from "./checkpoints";

/**
 * The path a vehicle follows: one smooth curve per leg (checkpoint → next checkpoint, through the leg's `via` waypoints),
 * sampled into a table so that `at(s)` (position + heading at a distance `s` along the route) is cheap to call every frame.
 * Legs are independent curves: the vehicle stops at every checkpoint, so the heading may change abruptly there.
 */
export type Route = {
  length: number;
  stops: number[]; // distance `s` of every checkpoint along the route (stops[0] = 0)
  points: { x: number; z: number }[]; // coarse polyline for the minimap
  at(s: number, out?: RoutePoint): RoutePoint;
};
export type RoutePoint = { x: number; z: number; heading: number }; // heading: travel direction = (sin h, 0, cos h)

const STEP = 0.5; // sample spacing (world units)

export function buildRoute(cps: Checkpoint[]): Route {
  const xs: number[] = [];
  const zs: number[] = [];
  const hs: number[] = [];
  const cum: number[] = [];
  const stops: number[] = [0];
  let total = 0;

  for (let i = 1; i < cps.length; i++) {
    const a = cps[i - 1];
    const b = cps[i];
    const ctrl = [[a.x, a.z], ...(b.via ?? []), [b.x, b.z]].map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(ctrl, false, "centripetal");
    curve.arcLengthDivisions = 1000;
    const len = curve.getLength();
    const n = Math.max(2, Math.ceil(len / STEP));
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      const p = curve.getPointAt(u);
      const t = curve.getTangentAt(u);
      xs.push(p.x);
      zs.push(p.z);
      hs.push(Math.atan2(t.x, t.z));
      cum.push(total + len * u);
    }
    total += len;
    stops.push(total);
  }

  const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  const last = cum.length - 1;
  const points: { x: number; z: number }[] = [];
  for (let i = 0; i <= last; i += 8) points.push({ x: xs[i], z: zs[i] });
  if (last % 8) points.push({ x: xs[last], z: zs[last] });

  return {
    length: total,
    stops,
    points,
    at(s, out = { x: 0, z: 0, heading: 0 }) {
      if (last < 1) return Object.assign(out, { x: cps[0]?.x ?? 0, z: cps[0]?.z ?? 0, heading: 0 });
      const q = Math.min(total, Math.max(0, s));
      // last sample with cum <= q (at a checkpoint this is the first sample of the NEXT leg: the vehicle faces where it is going)
      let lo = 0;
      let hi = last;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (cum[mid] <= q) lo = mid;
        else hi = mid - 1;
      }
      const j = Math.min(lo, last - 1);
      const span = cum[j + 1] - cum[j];
      const f = span > 1e-6 ? Math.min(1, (q - cum[j]) / span) : 0;
      out.x = xs[j] + (xs[j + 1] - xs[j]) * f;
      out.z = zs[j] + (zs[j + 1] - zs[j]) * f;
      out.heading = hs[j] + wrap(hs[j + 1] - hs[j]) * f;
      return out;
    },
  };
}
