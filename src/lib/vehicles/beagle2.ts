import { DARK, Kit, LIGHT, MID, type VehiclePalette, type VehicleRig } from "./kit";

/**
 * Beagle 2, as in the photos of the full-size replicas (no 3D model of it exists): a flat "flower" with the round dark base and its yellow
 * calibration frame in the middle, the gold lid with the folded sampling arm, and four round solar panels laid out around it like petals.
 * The real lander never moved nor called home, so it has no wheels: it lies on the ground (the 3D scene is a «time» scene, see lib/route.ts).
 * The lid sits behind; the lander faces +z.
 */
export function beagle2(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  const BASE = 2.45; // radius of the central base
  const Y = 0.25; // underside of the petals: the lander lies on the ground

  // ---- central base: dark disc with the yellow calibration frame ----
  b.cyl(BASE, 0.7, "y", 0, Y + 0.35, 0, { seg: 40 });
  b.cyl(BASE - 0.12, 0.06, "y", 0, Y + 0.73, 0, { tone: DARK, seg: 40 });
  const sq = (h: number, d: number, tone: 0 | 2) => b.prism([[-h, -h], [h, -h], [h, h], [-h, h]], Y + 0.76, d, { tone });
  sq(1.35, 0.03, 2);
  sq(1.1, 0.06, 0);
  for (const [x, z] of [[0, 0], [0.55, 0.55], [-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55]]) b.cyl(0.1, 0.1, "y", x, Y + 0.84, z, { tone: LIGHT, seg: 8 }); // calibration dots
  b.cyl(BASE, 0.05, "y", 0, Y + 0.7, 0, { tone: MID, seg: 40 }); // rim

  // ---- the petals: four solar panels and the gold lid, 72° apart, hinged to the base ----
  const polar = (deg: number, d: number): [number, number] => [Math.sin((deg * Math.PI) / 180) * d, Math.cos((deg * Math.PI) / 180) * d];
  const REACH = BASE + 2.15;
  for (const deg of [36, -36, 108, -108]) {
    const [x, z] = polar(deg, REACH);
    const r = deg === 108 || deg === -108 ? 2.0 : 2.15;
    b.cyl(r, 0.14, "y", x, Y + 0.3, z, { tone: LIGHT, seg: 32 }); // panel
    b.cyl(r - 0.12, 0.05, "y", x, Y + 0.4, z, { tone: DARK, seg: 32 }); // cells
    for (let k = -3; k <= 3; k++) {
      const d = k * 0.55;
      const len = 2 * Math.sqrt(Math.max(0, (r - 0.2) ** 2 - d * d));
      b.box(len, 0.03, 0.05, x, Y + 0.43, z + d, { tone: MID }); // cell rows
      b.box(0.05, 0.03, len, x + d, Y + 0.43, z, { tone: MID }); // cell columns
    }
    b.cyl(0.32, 0.06, "y", x, Y + 0.44, z, { tone: LIGHT, seg: 12 }); // centre
    const [hx, hz] = polar(deg, BASE + 0.05);
    b.box(0.6, 0.18, 0.5, hx, Y + 0.32, hz, { tone: MID, r: 0.05, rot: [0, (deg * Math.PI) / 180, 0] }); // hinge
  }
  const [lx, lz] = polar(180, REACH + 0.1);
  b.at([lx, Y + 0.28, lz], null, () => {
    b.lathe([[0, 0], [2.3, 0], [2.4, 0.12], [2.25, 0.42], [2.0, 0.55], [0, 0.55]], 0, 0, 0, { tone: MID, seg: 36 }); // gold shell, open
    b.lathe([[0, 0.42], [2.0, 0.42], [2.1, 0.5], [0, 0.5]], 0, 0.08, 0, { tone: LIGHT, seg: 36 }); // inner foil
    b.box(1.2, 0.3, 0.9, -0.55, 0.65, 0.15, { tone: DARK, r: 0.08 }); // the instrument box
    b.cyl(0.22, 0.5, "y", 0.9, 0.7, 0.3, { tone: DARK, seg: 10 });
    // sampling arm, folded over the lid: shoulder, upper arm, forearm and the sensor head ("PAW")
    b.ball(0.26, 0.3, 0.9, -0.9, { tone: LIGHT });
    b.tube([0.3, 0.9, -0.9], [1.0, 1.9, -0.3], 0.1);
    b.ball(0.2, 1.0, 1.9, -0.3, { tone: LIGHT });
    b.tube([1.0, 1.9, -0.3], [0.2, 2.35, 0.85], 0.09);
    b.box(0.5, 0.34, 0.5, 0.15, 2.3, 0.95, { r: 0.07, tone: LIGHT });
    b.cyl(0.13, 0.24, "y", 0.15, 2.0, 0.95, { tone: DARK, seg: 8 });
  });
  b.box(0.7, 0.2, 0.5, lx, Y + 0.32, lz + 2.55, { tone: MID, r: 0.05 }); // lid hinge
  b.tube([-2.0, Y + 0.95, 1.9], [-2.0, Y + 2.2, 1.9], 0.05, { seg: 6 }); // UHF antenna
  b.ball(0.1, -2.0, Y + 2.25, 1.9, { tone: MID });

  return b.finish({ halfLen: 3.6, halfWid: 3.6 }); // no wheels: the footprint is given
}
