import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { toon, type VehiclePalette, type VehicleRig } from "./kit";

/**
 * Globe vehicles as ONE mesh sunk in a puddle of goo (docs/design.md): the low-detail vehicle of `mini.ts` keeps its real shape (deck, mast, rotors, fans...)
 * but its lower half is swallowed by a smooth mass that spreads over the ground in a flared skirt and a few creeping tendrils, like a symbiote clinging to the
 * globe. The goo comes from a top-down height map of the vehicle (gaps closed, blurred, capped well below the top), so the wheels and the base merge into the
 * ground while everything above stays crisp and recognisable. Vehicle and goo are merged into a single geometry with the same three-tone toon material.
 * Built once per vehicle on the CPU (a 56×56 grid).
 *
 * Model frame like the vehicles': +y up, forward +z, origin on the ground. The goo patch is flat (height 0) away from the vehicle: put it below the surface
 * and the invisible ground sphere of the globe hides that part, so only the vehicle and the goo that rises around it show.
 */

export type Blob = { mesh: THREE.Mesh; dispose: () => void };

const N = 56; // grid points per side
const MELT = 1.5; // blur radius of the goo (grid cells): how much it flows over the lower part of the vehicle
const LEAN = 0.5; // radians the vehicle rears back (nose up, tail sunk in the goo): from the globe's centre we look down on a surface, so a flat vehicle would show only its top
const RIM = 8; // model units the outer rim of the goo patch dips below the ground (see step 4)
const CLIMB = 0.26; // how high the goo climbs, as a fraction of the vehicle's height (wheels half sunk; the rest stays crisp)

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Separable gaussian blur of an N×N field. */
function blur(src: Float32Array, sigma: number): Float32Array {
  const r = Math.max(1, Math.ceil(sigma * 3));
  const k: number[] = [];
  let sum = 0;
  for (let i = -r; i <= r; i++) {
    const w = Math.exp(-(i * i) / (2 * sigma * sigma));
    k.push(w);
    sum += w;
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const tmp = new Float32Array(N * N);
  const out = new Float32Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let a = 0;
      for (let i = -r; i <= r; i++) a += k[i + r] * src[y * N + Math.min(N - 1, Math.max(0, x + i))];
      tmp[y * N + x] = a;
    }
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let a = 0;
      for (let i = -r; i <= r; i++) a += k[i + r] * tmp[Math.min(N - 1, Math.max(0, y + i)) * N + x];
      out[y * N + x] = a;
    }
  return out;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Build the vehicle-in-goo mesh of a (low-detail) vehicle rig. The rig is only read: dispose it yourself afterwards.
 * `sphereR` is the radius of the sphere it sits on, in model units: the goo patch bends with it, so its flat base stays below the curved ground instead of
 * showing as a square at the corners.
 */
export function blobFrom(rig: VehicleRig, palette: VehiclePalette, seed: string, sphereR: number): Blob {
  const rand = rng([...seed].reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  rig.root.updateMatrixWorld(true);
  const half = (Math.max(rig.size.x, rig.size.z) / 2) * 1.4; // room around the vehicle for the skirt and the tendrils
  const cx = rig.center.x;
  const cz = rig.center.z;
  const x0 = cx - half;
  const z0 = cz - half;
  const cell = (2 * half) / (N - 1);

  // the vehicle leans back around the middle of its base: the nose lifts towards the viewer, the tail sinks into the goo
  const lean = new THREE.Matrix4()
    .makeTranslation(cx, 0, cz)
    .multiply(new THREE.Matrix4().makeRotationX(-LEAN))
    .multiply(new THREE.Matrix4().makeTranslation(-cx, 0, -cz));

  // 1. top-down height map of the triangles (the tallest surface above each cell), and the vehicle's own geometry for the final mesh
  let H: Float32Array<ArrayBufferLike> = new Float32Array(N * N);
  const parts: THREE.BufferGeometry[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  rig.root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld).applyMatrix4(lean); // the vehicle in the model frame, leaning back
    const flat = g.index ? g.toNonIndexed() : g;
    parts.push(flat);
    const pos = flat.attributes.position;
    for (let i = 0; i + 2 < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i);
      b.fromBufferAttribute(pos, i + 1);
      c.fromBufferAttribute(pos, i + 2);
      const d = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
      if (Math.abs(d) < 1e-9) continue;
      const ix0 = Math.max(0, Math.floor((Math.min(a.x, b.x, c.x) - x0) / cell));
      const ix1 = Math.min(N - 1, Math.ceil((Math.max(a.x, b.x, c.x) - x0) / cell));
      const iz0 = Math.max(0, Math.floor((Math.min(a.z, b.z, c.z) - z0) / cell));
      const iz1 = Math.min(N - 1, Math.ceil((Math.max(a.z, b.z, c.z) - z0) / cell));
      for (let iz = iz0; iz <= iz1; iz++)
        for (let ix = ix0; ix <= ix1; ix++) {
          const px = x0 + ix * cell;
          const pz = z0 + iz * cell;
          const l1 = ((b.z - c.z) * (px - c.x) + (c.x - b.x) * (pz - c.z)) / d;
          const l2 = ((c.z - a.z) * (px - c.x) + (a.x - c.x) * (pz - c.z)) / d;
          const l3 = 1 - l1 - l2;
          const e = -0.03;
          if (l1 < e || l2 < e || l3 < e) continue;
          const y = l1 * a.y + l2 * b.y + l3 * c.y;
          if (y > H[iz * N + ix]) H[iz * N + ix] = y;
        }
    }
    if (flat !== g) g.dispose();
  });

  // 2. close the gaps between parts (one 3×3 dilation), so the goo is one mass under wheels, body and arms
  const dil = new Float32Array(N * N);
  let M0 = 0;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let mx = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < N && yy < N) mx = Math.max(mx, H[yy * N + xx]);
        }
      dil[y * N + x] = mx;
      M0 = Math.max(M0, mx);
    }
  H = dil;
  if (M0 <= 0) M0 = 1;

  // 3. the goo: the blurred height map capped at CLIMB of the vehicle's height (so it swallows the wheels and the base, not the top), plus a flared skirt
  //    from a strongly blurred footprint, and tendrils creeping out of it
  const goo = blur(H, MELT);
  for (let i = 0; i < N * N; i++) goo[i] = Math.min(goo[i] * 0.9, CLIMB * M0);
  const mask = new Float32Array(N * N);
  let area = 0;
  for (let i = 0; i < N * N; i++) {
    mask[i] = H[i] > 0.08 * M0 ? 1 : 0;
    area += mask[i];
  }
  const skirt = blur(mask, 3.2);
  for (let i = 0; i < N * N; i++) goo[i] = Math.max(goo[i], 0.16 * M0 * smooth(0.06, 0.55, skirt[i]));
  const rFoot = Math.sqrt(area / Math.PI); // footprint radius in cells
  const mid = (N - 1) / 2; // the grid is centred on the vehicle's box
  for (let t = 0; t < 6; t++) {
    const th = rand() * Math.PI * 2;
    const len = (0.3 + rand() * 0.35) * (N / 2 - rFoot - 2);
    const phi = rand() * 6.28;
    for (let s = 0; s <= 24; s++) {
      const u = s / 24;
      const ang = th + Math.sin(u * 5 + phi) * 0.3;
      const rr = rFoot * 0.85 + u * (len + rFoot * 0.3);
      const px = mid + Math.cos(ang) * rr;
      const pz = mid + Math.sin(ang) * rr;
      const rs = Math.max(1.2, (1 - u) * 2.8);
      const ht = Math.pow(1 - u, 0.8) * 0.13 * M0;
      for (let dz = -Math.ceil(rs); dz <= Math.ceil(rs); dz++)
        for (let dx = -Math.ceil(rs); dx <= Math.ceil(rs); dx++) {
          const ix = Math.round(px) + dx;
          const iz = Math.round(pz) + dz;
          if (ix < 0 || iz < 0 || ix >= N || iz >= N) continue;
          const d = Math.hypot(ix - px, iz - pz);
          if (d > rs) continue;
          goo[iz * N + ix] = Math.max(goo[iz * N + ix], ht * (1 - d / rs));
        }
    }
  }
  const soft = blur(goo, 0.9); // a last light blur so the skirt and tendrils are smooth
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const edge = Math.min(x, y, N - 1 - x, N - 1 - y) / (N * 0.12);
      soft[y * N + x] *= smooth(0, 1, edge); // flat at the border of the patch
    }

  // 4. the goo as one smooth patch that bends with the globe
  const pos = new Float32Array(N * N * 3);
  for (let iz = 0; iz < N; iz++)
    for (let ix = 0; ix < N; ix++) {
      const i = iz * N + ix;
      const px = x0 + ix * cell;
      const pz = z0 + iz * cell;
      const r2 = (px - cx) * (px - cx) + (pz - cz) * (pz - cz);
      pos[i * 3] = px;
      // follow the curvature of the globe, and dip the outer rim well below the ground: the patch is bent for the globe's resting size, but the marker grows
      // (hover, selection, spring overshoot) and the globe pops, so a flat corner of a wide model (InSight) would otherwise poke out of the ground as black shards
      const rim = smooth(0.8, 1.05, Math.sqrt(r2) / half);
      pos[i * 3 + 1] = soft[i] - r2 / (2 * sphereR) - RIM * rim;
      pos[i * 3 + 2] = pz;
    }
  const index: number[] = [];
  for (let iz = 0; iz < N - 1; iz++)
    for (let ix = 0; ix < N - 1; ix++) {
      const i = iz * N + ix;
      index.push(i, i + N, i + 1, i + 1, i + N, i + N + 1);
    }
  const gooGeo = new THREE.BufferGeometry();
  gooGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  gooGeo.setIndex(index);
  gooGeo.computeVertexNormals();
  const gooFlat = gooGeo.toNonIndexed(); // same layout as the vehicle's geometry, so they can be merged
  gooGeo.dispose();
  gooFlat.setAttribute("tone", new THREE.BufferAttribute(new Float32Array(gooFlat.attributes.position.count).fill(-1), 1)); // lit: the toon shader picks the tone by angle

  // 5. vehicle + goo = one geometry, one mesh, one material
  const geo = mergeGeometries([...parts, gooFlat]);
  parts.forEach((g) => g.dispose());
  gooFlat.dispose();
  const material = toon(palette);
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  return {
    mesh,
    dispose: () => {
      geo.dispose();
      material.dispose();
    },
  };
}
