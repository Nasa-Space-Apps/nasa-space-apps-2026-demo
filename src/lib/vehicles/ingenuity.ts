import { DARK, Kit, LIGHT, MID, type V3, type VehiclePalette, type VehicleRig } from "./kit";

const K = 9; // units per metre of the real helicopter (rotor span 1.2 m, height 0.49 m): it is tiny, so it is drawn bigger than the rovers' scale

/**
 * Ingenuity Mars Helicopter. Proportions measured on public/models/ingenuity (a 1 m cube of detail): a small gold-wrapped fuselage hanging from the mast,
 * four long splayed carbon legs, two counter-rotating two-blade rotors (the upper one wider), a solar panel on top and a whip antenna.
 * It does not drive: the rig floats `hover` units above the ground and its rotors turn (see `rig.rotors` in components/Rover.tsx).
 */
export function ingenuity(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  const FOOT = 0.3 * K; // feet at (±FOOT, ±FOOT)
  const BODY = 1.45; // fuselage: a 16 cm cube, wrapped in gold foil
  const Y0 = 1.05; // underside of the fuselage
  const TOP = Y0 + 1.5;

  // ---- legs: from the top corners of the fuselage down to four feet ----
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const top: V3 = [sx * 0.6, TOP - 0.1, sz * 0.6];
      const foot: V3 = [sx * FOOT, 0.12, sz * FOOT];
      b.tube(top, foot, 0.11, { tone: DARK, r2: 0.09, seg: 8 });
      b.ball(0.26, foot[0], 0.1, foot[2], { tone: DARK, s: [1, 0.45, 1] });
      b.ball(0.15, top[0], top[1], top[2], { tone: MID });
    }

  // ---- fuselage (the warm electronics box) ----
  b.box(BODY, 1.5, BODY, 0, Y0 + 0.75, 0, { r: 0.14 });
  b.box(BODY + 0.08, 0.5, BODY + 0.08, 0, Y0 + 0.35, 0, { tone: MID, r: 0.1 }); // foil wrap, lower band
  b.cyl(0.2, 0.18, "y", 0, Y0 - 0.06, 0.2, { tone: DARK, seg: 12 }); // navigation camera, looking down
  b.cyl(0.17, 0.16, "z", 0.35, Y0 + 1.05, BODY / 2 + 0.04, { tone: DARK, seg: 12 }); // colour camera
  b.box(0.7, 0.14, 0.04, -0.2, Y0 + 0.45, BODY / 2 + 0.03, { tone: LIGHT }); // label plate

  // ---- mast, hubs and the two rotors (counter-rotating, the upper one wider) ----
  const hub = TOP + 0.35; // lower rotor
  const upper = hub + 0.95;
  b.cyl(0.2, upper - TOP + 0.4, "y", 0, (TOP + upper) / 2 + 0.2, 0, { tone: MID, seg: 12 });
  const blade = (len: number, chord: number, h: number, tone: 0 | 1 | 2) => {
    const w = chord / 2;
    b.prism([[-len, w * 0.6], [-len, -w * 0.6], [-len * 0.3, -w], [len * 0.3, -w], [len, -w * 0.6], [len, w * 0.6], [len * 0.3, w], [-len * 0.3, w]], 0, h, { tone });
    b.box(len * 0.3, h * 1.4, chord * 0.22, -len * 0.92, h / 2, 0, { tone: LIGHT }); // light tips: the blur of a blade is easier to see
    b.box(len * 0.3, h * 1.4, chord * 0.22, len * 0.92, h / 2, 0, { tone: LIGHT });
  };
  b.rotor([0, hub, 0], 22, () => {
    blade(4.3, 0.95, 0.07, DARK);
    b.cyl(0.42, 0.42, "y", 0, 0.1, 0, { tone: MID, seg: 14 });
  });
  b.rotor([0, upper, 0], -22, () => {
    blade(4.9, 1.0, 0.07, DARK);
    b.cyl(0.42, 0.42, "y", 0, 0.1, 0, { tone: MID, seg: 14 });
    b.box(0.22, 0.4, 0.22, 0, 0.35, 0, { tone: LIGHT, r: 0.05 }); // blade grips
  });

  // ---- solar panel and antenna on top ----
  const PANEL = upper + 0.55;
  b.cyl(0.14, 0.5, "y", 0, upper + 0.45, 0, { tone: MID, seg: 8 });
  b.prism([[-0.78, -2.05], [0.78, -2.05], [0.78, 2.05], [-0.78, 2.05]], PANEL, 0.1, { tone: LIGHT });
  b.prism([[-0.62, -1.9], [0.62, -1.9], [0.62, 1.9], [-0.62, 1.9]], PANEL + 0.1, 0.03, { tone: DARK });
  for (const z of [-0.95, 0, 0.95]) b.box(1.3, 0.035, 0.05, 0, PANEL + 0.13, z, { tone: LIGHT });
  b.tube([0.45, PANEL + 0.1, -1.6], [0.45, PANEL + 1.2, -1.6], 0.04, { seg: 6 }); // whip antenna
  b.ball(0.08, 0.45, PANEL + 1.25, -1.6, { tone: MID });

  return b.finish({ halfLen: 2.2, halfWid: 2.2, hover: 6.4 });
}
