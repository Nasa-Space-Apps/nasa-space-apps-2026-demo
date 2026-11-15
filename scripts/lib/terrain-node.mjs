/**
 * Terrain height field in plain Node (no three.js), built the same way as src/lib/terrain.ts: the STL (Z-up) is rotated to Y-up, centred on X/Z, its borders
 * are flattened with a smoothstep over `fade` units, and every triangle is rasterised on a grid keeping the highest value. Used by the route planner
 * (scripts/plan-story-route.mjs) to put checkpoints on flat ground and to find paths that avoid steep slopes. Not used by the app.
 */
import { readFileSync } from "node:fs";

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Binary STL → triangles in world coordinates (X = x − cx, Y = z, Z = −(y − cy)), with the border flattened like buildTerrain. */
export function loadTerrain(file, { fade = 45, res = 1 } = {}) {
  const buf = readFileSync(file);
  const n = buf.readUInt32LE(80);
  const tris = new Float32Array(n * 9);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity;
  for (let t = 0; t < n; t++) {
    const o = 84 + t * 50 + 12; // skip the normal
    for (let v = 0; v < 3; v++) {
      const x = buf.readFloatLE(o + v * 12);
      const y = buf.readFloatLE(o + v * 12 + 4);
      const z = buf.readFloatLE(o + v * 12 + 8);
      tris[t * 9 + v * 3] = x;
      tris[t * 9 + v * 3 + 1] = z; // height
      tris[t * 9 + v * 3 + 2] = -y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (-y < minY) minY = -y;
      if (-y > maxY) maxY = -y;
      if (z < minZ) minZ = z;
    }
  }
  const cx = (minX + maxX) / 2;
  const cz = (minY + maxY) / 2;
  const x0 = minX - cx, x1 = maxX - cx, z0 = minY - cz, z1 = maxY - cz;
  const base = minZ;
  for (let i = 0; i < n * 3; i++) {
    const x = tris[i * 3] - cx;
    const z = tris[i * 3 + 2] - cz;
    tris[i * 3] = x;
    tris[i * 3 + 2] = z;
    const d = Math.min(x - x0, x1 - x, z - z0, z1 - z);
    tris[i * 3 + 1] = base + (tris[i * 3 + 1] - base) * smooth(0, fade, d);
  }
  const nx = Math.ceil((x1 - x0) / res) + 1;
  const nz = Math.ceil((z1 - z0) / res) + 1;
  const grid = new Float32Array(nx * nz).fill(NaN);
  for (let t = 0; t < n; t++) {
    const [ax, ay, az, bx, by, bz, cx2, cy, cz2] = tris.subarray(t * 9, t * 9 + 9);
    const det = (bz - cz2) * (ax - cx2) + (cx2 - bx) * (az - cz2);
    if (Math.abs(det) < 1e-9) continue;
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx2) - x0) / res));
    const i1 = Math.min(nx - 1, Math.ceil((Math.max(ax, bx, cx2) - x0) / res));
    const j0 = Math.max(0, Math.floor((Math.min(az, bz, cz2) - z0) / res));
    const j1 = Math.min(nz - 1, Math.ceil((Math.max(az, bz, cz2) - z0) / res));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const px = x0 + i * res, pz = z0 + j * res;
        const l1 = ((bz - cz2) * (px - cx2) + (cx2 - bx) * (pz - cz2)) / det;
        const l2 = ((cz2 - az) * (px - cx2) + (ax - cx2) * (pz - cz2)) / det;
        const l3 = 1 - l1 - l2;
        if (l1 < -1e-4 || l2 < -1e-4 || l3 < -1e-4) continue;
        const h = l1 * ay + l2 * by + l3 * cy;
        const k = j * nx + i;
        if (!(grid[k] >= h)) grid[k] = h;
      }
  }
  for (let pass = 0; pass < 24; pass++) {
    let holes = 0;
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        if (!Number.isNaN(grid[k])) continue;
        let s = 0, c = 0;
        if (i > 0 && !Number.isNaN(grid[k - 1])) { s += grid[k - 1]; c++; }
        if (i < nx - 1 && !Number.isNaN(grid[k + 1])) { s += grid[k + 1]; c++; }
        if (j > 0 && !Number.isNaN(grid[k - nx])) { s += grid[k - nx]; c++; }
        if (j < nz - 1 && !Number.isNaN(grid[k + nx])) { s += grid[k + nx]; c++; }
        if (c) grid[k] = s / c; else holes++;
      }
    if (!holes) break;
  }
  for (let k = 0; k < grid.length; k++) if (Number.isNaN(grid[k])) grid[k] = base;

  const heightAt = (x, z) => {
    const fx = Math.min(nx - 1.001, Math.max(0, (x - x0) / res));
    const fz = Math.min(nz - 1.001, Math.max(0, (z - z0) / res));
    const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j, k = j * nx + i;
    return (grid[k] * (1 - tx) + grid[k + 1] * tx) * (1 - tz) + (grid[k + nx] * (1 - tx) + grid[k + nx + 1] * tx) * tz;
  };
  /** Slope in degrees at a point (central differences over ±2 units). */
  const slopeAt = (x, z) => {
    const gx = (heightAt(x + 2, z) - heightAt(x - 2, z)) / 4;
    const gz = (heightAt(x, z + 2) - heightAt(x, z - 2)) / 4;
    return (Math.atan(Math.hypot(gx, gz)) * 180) / Math.PI;
  };
  return { heightAt, slopeAt, bounds: { x0, x1, z0, z1 } };
}
