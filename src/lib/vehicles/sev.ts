import { DARK, Kit, LIGHT, LIT, MID, type Tone, type V3, type VehiclePalette, type VehicleRig } from "./kit";

/** Cross-sections of the cabin, rear to nose: [z, half-width, top, bottom, squareness of the section (2 = ellipse, higher = boxier)]. */
const HULL: [number, number, number, number, number][] = [
  [-5.1, 2.95, 7.35, 4.3, 2.6],
  [-4.6, 3.1, 7.35, 3.7, 2.8],
  [-3.5, 3.25, 7.3, 3.1, 3],
  [-2.0, 3.4, 7.25, 2.95, 3],
  [0.0, 3.5, 7.15, 2.95, 3],
  [2.5, 3.5, 7.05, 2.95, 3],
  [4.2, 3.3, 6.9, 3.0, 2.8],
  [5.2, 2.9, 6.45, 3.25, 2.6],
  [6.1, 2.25, 5.75, 3.6, 2.4],
  [6.8, 1.5, 5.15, 3.95, 2.2],
  [7.2, 0.9, 4.8, 4.2, 2],
];
const SEGMENTS = 72;

/** Section of the hull at z (smooth interpolation of HULL). */
function section(z: number) {
  let k = 0;
  while (k < HULL.length - 2 && z > HULL[k + 1][0]) k++;
  const [a, b] = [HULL[k], HULL[k + 1]];
  const t = Math.min(1, Math.max(0, (z - a[0]) / (b[0] - a[0])));
  const p0 = HULL[Math.max(k - 1, 0)];
  const p3 = HULL[Math.min(k + 2, HULL.length - 1)];
  const cr = (i: number) => {
    const m1 = ((b[i] - p0[i]) / (b[0] - p0[0])) * (b[0] - a[0]);
    const m2 = ((p3[i] - a[i]) / (p3[0] - a[0])) * (b[0] - a[0]);
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a[i] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * b[i] + (t3 - t2) * m2;
  };
  return { half: cr(1), top: cr(2), bottom: cr(3), n: cr(4) };
}

/**
 * Space Exploration Vehicle (the MMSEV of public/models/sev/sev.glb): a pressurised cabin shaped like a barrel that narrows into a glazed nose
 * (two windscreen panes, corner windows and three chin windows to look at the ground), a big round hatch with a domed window on each side,
 * a ribbed radiator along the roof, lights and cameras over the brow, two suit ports at the back, and a truss chassis on six steerable
 * modules of twin wheels.
 */
export function sev(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  const R = 1.0;
  const AXLES = [3.5, 0, -3.5];
  const TRACK = 3.55; // centre of each pair of wheels

  // ---- wheel modules: twin wheels on a steering post ----
  for (const s of [-1, 1]) {
    for (const z of AXLES) {
      b.wheel(s * TRACK, z, R, () => {
        for (const dx of [-0.42, 0.42]) b.at([dx, 0, 0], null, () => b.tyre(R, 0.55, { cleats: 20, spokes: 12, hub: 0.32 }));
        b.cyl(0.2, 0.5, "x", 0, 0, 0, { tone: MID, seg: 10 }); // axle between the pair
      });
      b.box(0.24, 1.75, 0.55, s * TRACK, 1.8, z, { r: 0.08 }); // yoke between the two wheels
      b.cyl(0.36, 0.85, "y", s * TRACK, 2.85, z, { tone: MID, seg: 14 }); // steering post
      for (const dz of [-0.3, 0.3]) b.cyl(0.19, 0.7, "y", s * TRACK, 3.5, z + dz, { seg: 10 }); // actuators
      b.box(1.7, 0.45, 0.9, s * 2.75, 2.7, z, { r: 0.12 }); // outrigger
    }
  }

  // ---- chassis: deck on a truss frame ----
  b.box(4.3, 0.5, 8.7, 0, 2.75, -0.05, { r: 0.12 });
  for (const s of [-1, 1]) {
    b.box(0.28, 0.28, 8.5, s * 1.9, 1.25, -0.05); // lower rails
    for (const [z0, z1] of [[-4.2, -1.75], [-1.75, 0.6], [0.6, 2.4], [2.4, 4.2]]) {
      b.tube([s * 1.9, 1.25, z0], [s * 1.9, 2.5, z1], 0.1, { seg: 6 }); // diagonals
      b.tube([s * 1.9, 1.25, z0], [s * 1.9, 2.5, z0], 0.1, { seg: 6 });
    }
  }
  for (const z of [-4.2, -1.75, 0.6, 2.4, 4.2]) b.box(4.0, 0.26, 0.26, 0, 1.25, z); // cross members
  b.tube([-1.9, 1.25, 4.2], [1.9, 2.5, 4.2], 0.1, { seg: 6 }); // front cross-brace
  b.tube([1.9, 1.25, 4.2], [-1.9, 2.5, 4.2], 0.1, { seg: 6 });
  b.box(3.2, 0.95, 2.0, 0, 1.9, -2.95, { r: 0.1, tone: MID }); // battery packs
  b.box(3.2, 0.95, 1.9, 0, 1.9, 1.5, { r: 0.1 });
  b.box(3.4, 0.14, 1.9, 0, 2.6, 5.05, { tone: MID, rot: [-0.42, 0, 0] }); // skid plate under the nose

  // ---- cabin ----
  const zs: number[] = [];
  for (let z = -5.1; z < 4.2 - 1e-6; z += 0.62) zs.push(z);
  for (let z = 4.2; z <= 7.2 + 1e-6; z += 0.15) zs.push(z);
  const angle = (j: number) => (j / SEGMENTS) * Math.PI * 2;
  const pow = (v: number, e: number) => Math.sign(v) * Math.abs(v) ** e;
  const rings = zs.map((z) => {
    const { half, top, bottom, n } = section(z);
    const ring: V3[] = [];
    for (let j = 0; j < SEGMENTS; j++) {
      const a = angle(j);
      ring.push([half * pow(Math.cos(a), 2 / n), (top + bottom) / 2 + ((top - bottom) / 2) * pow(Math.sin(a), 2 / n), z]);
    }
    return ring;
  });
  // windows, painted on the hull: `side` = angle from the horizontal (π/2 = roof, -π/2 = belly), mirrored left / right
  const glass = (i: number, j: number): Tone => {
    const z = (zs[i] + zs[i + 1]) / 2;
    const a = angle(j + 0.5);
    const side = Math.atan2(Math.sin(a), Math.abs(Math.cos(a)));
    const within = (z0: number, z1: number, s0: number, s1: number) => z > z0 && z < z1 && side > s0 && side < s1;
    if (within(4.6, 6.5, Math.PI / 2 - 0.66, Math.PI / 2 - 0.07)) return DARK; // windscreen (two panes)
    if (within(4.5, 5.95, -0.04, 0.5)) return DARK; // corner windows
    if (within(5.0, 6.75, -Math.PI / 2, -Math.PI / 2 + 0.3)) return DARK; // chin window, centre
    if (within(4.9, 6.5, -Math.PI / 2 + 0.44, -Math.PI / 2 + 1.02)) return DARK; // chin windows, sides
    if (within(2.9, 3.9, 0.02, 0.36)) return DARK; // small side window
    return LIT;
  };
  b.loft(rings, { paint: glass });

  // side hatches with a domed window
  for (const s of [-1, 1]) {
    b.cyl(1.85, 0.7, "x", s * 3.5, 5.0, 0.2, { seg: 32 });
    b.ring(1.62, 0.17, "x", s * 3.87, 5.0, 0.2, { tone: LIGHT, seg: 32 });
    b.ball(1.4, s * 3.8, 5.0, 0.2, { tone: DARK, s: [0.36, 1, 1] });
    b.box(0.2, 0.7, 0.7, s * 4.28, 5.0, 0.2, { tone: MID, r: 0.06 });
    b.box(0.14, 0.2, 2.5, s * 4.2, 5.0, 0.2, { tone: LIGHT });
  }

  // roof: ribbed radiator, brow lights, cameras, antennas and a stowed boom
  b.at([0, 7.24, -0.4], [0.042, 0, 0], () => {
    b.box(2.7, 0.14, 6.6, 0, 0, 0, { tone: MID, r: 0.05 });
    b.box(2.4, 0.05, 6.3, 0, 0.08, 0, { tone: DARK });
    for (let i = -3; i <= 3; i++) b.box(0.17, 0.09, 6.3, i * 0.34, 0.13, 0, { tone: LIGHT });
    b.box(1.4, 0.5, 0.9, 0, 0.25, -3.9, { r: 0.12 }); // comms unit
    b.tube([1.75, 0.12, 4.3], [1.75, 0.12, -1.3], 0.11, { seg: 8 }); // stowed boom
    for (const z of [4.3, -1.3]) b.ball(0.2, 1.75, 0.12, z, { tone: MID });
  });
  b.box(4.4, 0.24, 0.34, 0, 6.72, 4.5, { r: 0.08 });
  for (const x of [-1.75, -1.05, 1.05, 1.75]) b.cyl(0.17, 0.14, "z", x, 6.72, 4.7, { tone: LIGHT, seg: 12 });
  for (const s of [-1, 1]) {
    b.box(0.85, 0.42, 0.7, s * 1.65, 7.1, 3.5, { r: 0.1 }); // camera cluster
    for (const dx of [-0.2, 0.2]) b.cyl(0.13, 0.16, "z", s * 1.65 + dx, 7.12, 3.9, { tone: DARK, seg: 10 });
  }
  b.cyl(0.05, 1.9, "y", -1.65, 8.25, 3.3, { seg: 6 });
  b.tube([1.65, 7.3, 3.2], [1.65, 9.2, 1.9], 0.05, { seg: 6 });

  // rear bulkhead: two suit ports over a small aft deck
  for (const s of [-1, 1]) {
    b.cyl(0.95, 0.22, "z", s * 1.3, 5.75, -5.16, { tone: LIGHT, seg: 24 });
    b.cyl(0.7, 0.26, "z", s * 1.3, 5.75, -5.2, { tone: DARK, seg: 24 });
    b.box(0.5, 0.12, 0.2, s * 1.3, 5.75, -5.34, { tone: MID });
    b.tube([s * 2.2, 3.05, -5.9], [s * 2.2, 4.2, -5.9], 0.07, { seg: 6 }); // handrails
  }
  b.box(4.6, 0.2, 1.5, 0, 3.05, -5.2, { r: 0.06 });
  b.tube([-2.2, 4.2, -5.9], [2.2, 4.2, -5.9], 0.07, { seg: 6 });
  return b.finish();
}
