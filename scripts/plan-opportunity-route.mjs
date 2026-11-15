#!/usr/bin/env node
/**
 * Plans the 3D route of the Opportunity story: where the rover stops (one stop per Mars event) and the waypoints (`via`) between stops, on the Meridiani
 * terrain (public/models/terrain.stl). The terrain is a scale model, not a map: the stops follow the path the earlier hand-made route took (landing crater →
 * Eagle → Endurance → Victoria → Perseverance Valley), spread evenly along it, each snapped to a nearby flat spot; the legs between them come from an A*
 * search over the slope map (cost grows with the square of the slope), so the vehicle never climbs a steep wall.
 *
 *   node scripts/plan-opportunity-route.mjs [stops]      prints the plan and writes scripts/data/opportunity-route.json
 *
 * `stops` (default 13) = number of Mars events (see scripts/build-opportunity-story.mjs). Re-run it only if the terrain or the number of stops changes.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadTerrain } from "./lib/terrain-node.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const N = Number(process.argv[2] ?? 13);
const T = loadTerrain(path.join(ROOT, "public/models/terrain.stl"), { fade: 45, res: 1 });

// the previous route, stop and waypoint by waypoint (landing, Eagle, Endurance, Victoria, Perseverance Valley): the line the new stops follow
const OLD = [[0, 0], [-69, -5], [-97, -35], [-90, -70], [97, -91], [205, -170], [173, -43], [177, 95], [219, 159], [275, 175], [60, 205]];
const seg = OLD.slice(1).map((p, i) => Math.hypot(p[0] - OLD[i][0], p[1] - OLD[i][1]));
const total = seg.reduce((a, b) => a + b, 0);
const along = (s) => {
  let d = s;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const t = Math.min(1, d / seg[i]);
      return [OLD[i][0] + (OLD[i + 1][0] - OLD[i][0]) * t, OLD[i][1] + (OLD[i + 1][1] - OLD[i][1]) * t];
    }
    d -= seg[i];
  }
};

/** Flattest spot (lowest mean slope in a 12-unit disc) within `reach` units of a target. */
function snap([tx, tz], prev, reach = 18) {
  let best = [tx, tz], bestScore = Infinity;
  for (let dz = -reach; dz <= reach; dz += 3)
    for (let dx = -reach; dx <= reach; dx += 3) {
      if (Math.hypot(dx, dz) > reach) continue;
      const x = tx + dx, z = tz + dz;
      let s = 0, c = 0;
      for (let rz = -12; rz <= 12; rz += 4)
        for (let rx = -12; rx <= 12; rx += 4) {
          s += T.slopeAt(x + rx, z + rz);
          c++;
        }
      const apart = prev ? Math.hypot(x - prev[0], z - prev[1]) : Infinity;
      const score = s / c + Math.hypot(dx, dz) * 0.04 + (apart < 70 ? 100 - apart : 0); // flat first, close to the target second, and never on top of the previous stop
      if (score < bestScore) { bestScore = score; best = [x, z]; }
    }
  return best.map((v) => Math.round(v));
}

// stops: evenly spaced along the old line; the first one is the landing crater, the last one Perseverance Valley (keep them where they were)
const stops = [];
for (let k = 0; k < N; k++) {
  const p = along((total * k) / (N - 1));
  stops.push(k === 0 || k === N - 1 ? p.map(Math.round) : snap(p, stops[k - 1]));
}

// A* over a 2-unit grid inside the safe area (the border is flattened and the ground plane starts there)
const STEP = 2, B = { x0: -320, x1: 320, z0: -222, z1: 222 };
const GX = Math.floor((B.x1 - B.x0) / STEP) + 1, GZ = Math.floor((B.z1 - B.z0) / STEP) + 1;
const cell = ([x, z]) => [Math.round((x - B.x0) / STEP), Math.round((z - B.z0) / STEP)];
const world = ([i, j]) => [B.x0 + i * STEP, B.z0 + j * STEP];
const slopeCost = new Float32Array(GX * GZ);
for (let j = 0; j < GZ; j++) for (let i = 0; i < GX; i++) slopeCost[j * GX + i] = Math.tan((T.slopeAt(...world([i, j])) * Math.PI) / 180);

function astar(a, b) {
  const [ai, aj] = cell(a), [bi, bj] = cell(b);
  const key = (i, j) => j * GX + i;
  const g = new Map([[key(ai, aj), 0]]), from = new Map(), open = [[0, ai, aj]];
  const h = (i, j) => Math.hypot(i - bi, j - bj) * STEP;
  while (open.length) {
    open.sort((p, q) => p[0] - q[0]);
    const [, i, j] = open.shift();
    if (i === bi && j === bj) break;
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= GX || nj >= GZ) continue;
        const len = Math.hypot(di, dj) * STEP;
        const s = (slopeCost[key(i, j)] + slopeCost[key(ni, nj)]) / 2;
        const cost = g.get(key(i, j)) + len * (1 + 40 * s * s);
        if (cost < (g.get(key(ni, nj)) ?? Infinity)) {
          g.set(key(ni, nj), cost);
          from.set(key(ni, nj), [i, j]);
          open.push([cost + h(ni, nj), ni, nj]);
        }
      }
  }
  const path = [[bi, bj]];
  let cur = key(bi, bj);
  while (from.has(cur)) {
    const [i, j] = from.get(cur);
    path.push([i, j]);
    cur = key(i, j);
  }
  return path.reverse().map(world);
}

/** Douglas–Peucker: keep only the points that bend the path by more than `eps` units. */
function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let worst = 0, at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1);
    if (d > worst) { worst = d; at = i; }
  }
  return worst > eps ? [...simplify(pts.slice(0, at + 1), eps).slice(0, -1), ...simplify(pts.slice(at), eps)] : [a, b];
}

const plan = stops.map((s, k) => {
  if (k === 0) return { x: s[0], z: s[1], slope: Math.round(T.slopeAt(s[0], s[1])) };
  const raw = astar(stops[k - 1], s);
  const via = simplify(raw, 12).slice(1, -1).map((p) => p.map(Math.round));
  let max = 0, len = 0;
  for (let i = 1; i < raw.length; i++) {
    max = Math.max(max, T.slopeAt(...raw[i]));
    len += Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]);
  }
  return { x: s[0], z: s[1], via: via.length ? via : undefined, leg: Math.round(len), maxSlope: Math.round(max), slope: Math.round(T.slopeAt(s[0], s[1])) };
});

console.log(JSON.stringify(plan, null, 1));
console.log(`\n${N} stops · legs ${plan.slice(1).map((p) => p.leg).join(", ")} u · max slope ${Math.max(...plan.slice(1).map((p) => p.maxSlope))}°`);
mkdirSync(path.join(ROOT, "scripts/data"), { recursive: true });
writeFileSync(path.join(ROOT, "scripts/data/opportunity-route.json"), JSON.stringify(plan, null, 2));
