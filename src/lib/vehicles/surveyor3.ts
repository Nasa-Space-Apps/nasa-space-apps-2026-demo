import { DARK, Kit, LIGHT, MID, type V3, type VehiclePalette, type VehicleRig } from "./kit";

const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/**
 * Surveyor 3 (NASA's 1967 Moon lander, the one Apollo 12 walked to), drawn from the photos of the Apollo 12 visit (AS12-48-7133) and of the engineering
 * model at the National Air and Space Museum: a light aluminium tripod (three legs on a triangular frame), a tall central mast with a big tilted solar panel
 * and the flat square high-gain antenna, the TV camera looking up at its mirror, two thermal compartments on the frame, the omnidirectional antenna booms,
 * the three vernier engines and the surface-sampler arm reaching out to the front. About 3 m tall and 4.3 m between footpads in real life; here 2.2 units
 * per metre (≈ 9 wide, ≈ 7 tall) so it sits with the rest of the vehicles.
 * The real lander never moved (after its two bounces it sat on a slope inside the crater for the rest of its life), so it has no wheels: each leg ends in a
 * crushable footpad. The 3D scene is a «time» scene (lib/route.ts). Faces +z (the sampler-arm side): one leg in front, two behind.
 */
export function surveyor3(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  const R = 0; // the footpads touch the ground at y = 0
  const RL = 4.6; // distance of each footpad from the centre line
  const FY = 3.0; // height of the frame corners
  const RC = 2.0; // radius of the frame corners
  const ANG = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]; // front, then the two rear legs (angle measured from +z towards +x)
  const dir = (a: number): [number, number] => [Math.sin(a), Math.cos(a)];

  const corners: V3[] = [];
  const wheels: V3[] = [];
  for (const a of ANG) {
    const [sx, cz] = dir(a);
    corners.push([sx * RC, FY, cz * RC]);
    wheels.push([sx * RL, R, cz * RL]);
  }

  // ---- legs: main strut, the stabilising strut from the inner frame, the crushable shock absorber and a footpad under each ----
  wheels.forEach((w, k) => {
    const c = corners[k];
    const hub: V3 = [w[0], R + 0.8, w[2]];
    b.cyl(0.85, 0.16, "y", w[0], 0.08, w[2], { tone: MID, seg: 20 }); // footpad
    b.cyl(0.3, 0.3, "y", w[0], 0.3, w[2], { tone: LIGHT, seg: 12 }); // its socket
    b.tube(c, hub, 0.17, { tone: MID }); // main strut
    const shock = [lerp(c, hub, 0.42), lerp(c, hub, 0.8)];
    b.tube(shock[0], shock[1], 0.27, { tone: LIGHT, seg: 12 }); // crushable shock absorber
    const inner: V3 = [corners[k][0] * 0.55, 1.9, corners[k][2] * 0.55];
    b.tube(inner, lerp(c, hub, 0.5), 0.1); // stabiliser
    b.ball(0.26, hub[0], hub[1], hub[2], { tone: MID });
    b.ball(0.24, c[0], c[1], c[2], { tone: MID });
    // vernier engine hanging inside each corner
    const vx = c[0] * 0.78;
    const vz = c[2] * 0.78;
    b.cyl(0.2, 0.7, "y", vx, FY - 0.45, vz, { tone: DARK, seg: 10 });
    b.cyl(0.2, 0.34, "y", vx, FY - 0.98, vz, { tone: DARK, r2: 0.4, seg: 10 }); // nozzle
  });

  // ---- the triangular frame: upper ring, inner lower ring, spokes to the centre ----
  corners.forEach((c, k) => {
    const n = corners[(k + 1) % 3];
    b.tube(c, n, 0.13);
    const ci: V3 = [c[0] * 0.55, 1.9, c[2] * 0.55];
    const ni: V3 = [n[0] * 0.55, 1.9, n[2] * 0.55];
    b.tube(ci, ni, 0.1);
    b.tube(ci, c, 0.1);
    b.tube(ci, [0, FY + 0.15, 0], 0.09, { seg: 8 });
  });
  b.cyl(0.55, 0.28, "y", 0, FY + 0.1, 0, { tone: MID, seg: 14 }); // hub where the mast starts

  // ---- two thermal compartments (the warm electronics boxes) ----
  b.box(1.6, 0.95, 1.3, -1.8, FY + 0.15, -1.0, { r: 0.12 }); // A
  b.box(1.65, 0.16, 1.35, -1.8, FY + 0.68, -1.0, { tone: MID, r: 0.06 }); // its radiator lid
  b.box(1.45, 0.85, 1.2, 1.8, FY + 0.1, -1.05, { tone: MID, r: 0.12 }); // B
  b.box(1.5, 0.15, 1.25, 1.8, FY + 0.6, -1.05, { tone: LIGHT, r: 0.06 });
  b.box(0.8, 0.5, 0.5, 0.05, FY - 0.25, -0.6, { tone: DARK, r: 0.08 }); // radar / altimeter electronics under the frame

  // ---- central mast with its braces, the camera and its mirror, the planar antenna and the solar panel ----
  const TOP = 6.6;
  b.tube([0, FY + 0.2, 0], [0, TOP, 0], 0.17, { tone: LIGHT });
  corners.forEach((c) => b.tube(c, [0, FY + 2.1, 0], 0.07, { seg: 8 })); // mast braces
  b.ball(0.2, 0, FY + 2.1, 0, { tone: MID });
  // TV camera: a short cylinder with its lens, under a tilted mirror that can look all round
  b.at([0.0, 5.2, 0.05], null, () => {
    b.cyl(0.38, 0.8, "y", 0, 0, 0, { tone: LIGHT, seg: 14 });
    b.cyl(0.16, 0.3, "z", 0, 0.05, 0.42, { tone: DARK, seg: 10 }); // lens
    b.box(0.75, 0.08, 0.75, 0, 0.95, 0, { tone: MID, rot: [0.55, 0, 0] }); // mirror
    b.tube([-0.3, 0.4, 0], [-0.3, 0.9, 0], 0.05, { tone: DARK, seg: 6 });
  });
  // high-gain antenna: a flat square array on a short arm, beside the mast
  b.tube([0, 5.7, 0], [1.05, 5.85, -0.1], 0.07, { seg: 8 });
  b.at([1.35, 5.95, -0.12], [0.1, 0, -0.18], () => {
    b.box(1.05, 1.05, 0.12, 0, 0, 0, { tone: MID, r: 0.04 });
    b.box(0.85, 0.85, 0.14, 0, 0, 0, { tone: DARK, r: 0.03 });
    for (const k of [-0.28, 0, 0.28]) b.box(0.05, 0.85, 0.16, k, 0, 0, { tone: MID }); // the antenna's slots
  });
  // solar panel: tilted towards the back so it looks at the sun, with rows of cells
  b.at([0, TOP + 0.15, -0.1], [-0.38, 0, 0], () => {
    b.box(3.2, 0.16, 2.7, 0, 0, 0, { tone: LIGHT, r: 0.05 });
    b.box(3.0, 0.07, 2.5, 0, 0.09, 0, { tone: DARK });
    for (let i = -2; i <= 2; i++) b.box(0.05, 0.08, 2.5, i * 0.6, 0.11, 0, { tone: MID });
    for (let j = -2; j <= 2; j++) b.box(3.0, 0.08, 0.05, 0, 0.11, j * 0.5, { tone: MID });
    b.tube([0, -0.1, 0.9], [0, -0.45, 0], 0.07, { seg: 6 }); // the panel's own boom
  });

  // ---- omnidirectional antenna booms, one on each rear leg, ending in a small cone ----
  for (const k of [1, 2]) {
    const c = corners[k];
    const out: V3 = [c[0] * 2.3, FY + 0.5, c[2] * 2.1 - 0.4];
    b.tube([c[0], FY + 0.1, c[2]], out, 0.07, { seg: 8 });
    b.cyl(0.07, 0.55, "y", out[0], out[1] + 0.25, out[2], { r2: 0.25, tone: LIGHT, seg: 10 });
  }

  // ---- surface-sampler arm: a pantograph reaching out to the front-right, with the scoop on its end ----
  const s0: V3 = [0.75, FY + 0.05, 1.55];
  const s1: V3 = [2.0, FY - 0.35, 3.9];
  b.tube(s0, s1, 0.07, { tone: LIGHT, seg: 8 });
  b.tube([s0[0], s0[1] + 0.42, s0[2]], [s1[0], s1[1] + 0.3, s1[2]], 0.07, { tone: LIGHT, seg: 8 });
  for (const t of [0.15, 0.5, 0.85]) b.tube(lerp(s0, s1, t), [lerp(s0, s1, t)[0], lerp(s0, s1, t)[1] + 0.4, lerp(s0, s1, t)[2]], 0.045, { tone: MID, seg: 6 }); // pantograph links
  b.cyl(0.2, 0.4, "y", s0[0], s0[1] + 0.2, s0[2], { tone: MID, seg: 10 }); // shoulder motor
  b.box(0.42, 0.3, 0.6, s1[0], s1[1] - 0.15, s1[2] + 0.18, { tone: DARK, r: 0.06, rot: [0.25, 0, 0] }); // the scoop
  b.box(0.3, 0.05, 0.3, s1[0], s1[1] - 0.32, s1[2] + 0.5, { tone: LIGHT, rot: [0.25, 0, 0] }); // its little footpad

  return b.finish({ halfLen: 4.2, halfWid: 4.0 }); // no wheels: the footprint is given
}
