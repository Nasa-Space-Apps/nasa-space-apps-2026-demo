import { DARK, Kit, LIGHT, MID, type V3, type VehiclePalette, type VehicleRig } from "./kit";

const ngon = (n: number, R: number, rot = 0, x = 0, z = 0): [number, number][] =>
  Array.from({ length: n }, (_, i) => [x + Math.cos(rot + (i / n) * Math.PI * 2) * R, z + Math.sin(rot + (i / n) * Math.PI * 2) * R]);

/**
 * InSight (landed configuration of public/models/insight): a hexagonal science deck on three legs, two big twelve-sided solar arrays on booms,
 * the folded instrument arm with its grapple, the seismometer dome, the heat-probe box, the UHF mast and the medium-gain horns.
 * The real lander never moves, so it has no wheels: it stands on three landing legs with round footpads (the 3D scene is a «time» scene, see lib/route.ts).
 * Faces +z (the arm side).
 */
export function insight(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  const DECK = 2.2; // underside of the deck
  const LEGS: V3[] = [[-2.3, 0, -1.7], [2.3, 0, -1.7], [0, 0, 3.2]]; // footpads (rear pair, front centre)

  // ---- three landing legs on round footpads ----
  for (const [x, , z] of LEGS) {
    b.cyl(0.62, 0.16, "y", x, 0.08, z, { tone: MID, seg: 16 }); // footpad
    b.ball(0.26, x, 0.3, z, { tone: MID });
    const a = Math.atan2(z, x);
    const top: V3 = [Math.cos(a) * 1.6, DECK + 0.1, Math.sin(a) * 1.6];
    b.tube([x, 0.3, z], top, 0.17, { tone: MID });
    b.tube([x, 1.1, z], [top[0] * 0.55, DECK - 0.2, top[2] * 0.55], 0.1); // strut
    b.ball(0.2, x, 1.1, z, { tone: MID });
  }

  // ---- body under the deck: tanks and the electronics ----
  b.box(3.0, 1.2, 2.6, 0, DECK - 0.7, 0, { r: 0.2 });
  for (const s of [-1, 1]) b.ball(0.75, s * 1.15, DECK - 0.95, -0.3, { tone: MID });
  b.cyl(0.6, 0.35, "y", 0, DECK - 1.45, 0.2, { tone: DARK, seg: 12 }); // descent engine cluster (shut down)

  // ---- hexagonal deck ----
  b.prism(ngon(6, 2.5, Math.PI / 6), DECK, 0.3);
  b.prism(ngon(6, 2.25, Math.PI / 6), DECK + 0.3, 0.07, { tone: MID });
  const top = DECK + 0.37;

  // ---- solar arrays: two twelve-sided fans on booms ----
  for (const s of [-1, 1]) {
    const cx = s * 5.0;
    const cz = -0.9;
    const y = DECK + 0.7;
    b.tube([s * 2.2, y - 0.1, cz], [cx, y + 0.05, cz], 0.1, { tone: MID }); // boom
    b.tube([s * 2.0, DECK + 0.15, 0.3], [s * 3.1, y - 0.1, cz], 0.09);
    b.prism(ngon(12, 2.55, 0, cx, cz), y, 0.1, { tone: LIGHT });
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2 + 0.06;
      const a1 = ((i + 1) / 12) * Math.PI * 2 - 0.06;
      const c = (a: number, r: number): [number, number] => [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
      b.prism([c(a0, 0.35), c(a0, 2.4), c(a1, 2.4), c(a1, 0.35)], y + 0.1, 0.035, { tone: DARK });
    }
    b.cyl(0.32, 0.3, "y", cx, y + 0.18, cz, { tone: MID, seg: 12 }); // hub
  }

  // ---- instruments and antennas on the deck ----
  b.ball(0.85, 0.95, top + 0.2, 0.1, { s: [1, 0.78, 1] }); // seismometer dome (wind and thermal shield)
  b.cyl(0.9, 0.12, "y", 0.95, top + 0.02, 0.1, { tone: MID, seg: 20 });
  b.prism(ngon(6, 0.62, 0, -0.5, -0.7), top, 0.95, { tone: MID }); // heat-probe box
  b.prism(ngon(6, 0.5, 0, -0.5, -0.7), top + 0.95, 0.07, { tone: LIGHT });
  b.cyl(0.35, 0.9, "y", 0.2, top + 0.45, -1.35, { seg: 14 }); // electronics canister
  b.tube([-0.3, top, 0.6], [-0.3, top + 2.3, 0.6], 0.09, { seg: 8 }); // UHF mast
  b.ball(0.16, -0.3, top + 2.4, 0.6, { tone: MID });
  b.tube([-0.3, top + 2.4, 0.6], [-0.3, top + 3.0, 0.6], 0.04, { seg: 6 });
  for (const s of [-1, 1]) b.cyl(0.22, 0.75, "z", s * 1.35, top + 0.4, -1.75, { r2: 0.5, seg: 12, tone: LIGHT }); // medium-gain horns
  b.box(0.5, 0.42, 0.5, 1.1, top + 0.3, 1.5, { tone: LIGHT, r: 0.08 }); // cameras
  b.cyl(0.12, 0.14, "z", 1.0, top + 0.32, 1.78, { tone: DARK, seg: 10 });
  b.cyl(0.12, 0.14, "z", 1.25, top + 0.32, 1.78, { tone: DARK, seg: 10 });

  // ---- instrument arm: shoulder at the front-left corner, folded up, with the grapple hanging at the end ----
  const sh: V3 = [-1.45, top + 0.25, 1.35];
  b.cyl(0.3, 0.5, "y", ...sh, { tone: MID, seg: 12 });
  const elbow: V3 = [-1.2, top + 2.9, 1.1];
  b.tube([sh[0], sh[1] + 0.2, sh[2]], elbow, 0.12);
  b.ball(0.24, ...elbow, { tone: MID });
  const wrist: V3 = [-2.6, top + 2.55, 2.5];
  b.tube(elbow, wrist, 0.11);
  b.ball(0.2, ...wrist, { tone: MID });
  b.tube(wrist, [wrist[0], wrist[1] - 1.0, wrist[2]], 0.09, { seg: 8 });
  b.box(0.55, 0.45, 0.45, wrist[0], wrist[1] - 1.2, wrist[2], { tone: LIGHT, r: 0.08 }); // grapple
  for (const dx of [-0.2, 0, 0.2]) b.tube([wrist[0] + dx, wrist[1] - 1.4, wrist[2]], [wrist[0] + dx * 1.6, wrist[1] - 1.85, wrist[2]], 0.04, { tone: DARK, seg: 6 });

  return b.finish({ halfLen: 2.5, halfWid: 2.4 }); // no wheels: the footprint is given
}
