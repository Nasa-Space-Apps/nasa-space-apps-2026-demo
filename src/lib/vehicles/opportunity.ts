import { DARK, Kit, LIGHT, MID, rows, type V3, type VehiclePalette, type VehicleRig } from "./kit";

/**
 * Mars Exploration Rover (Opportunity, MER-B). Proportions measured on public/models/opportunity/opportunity.glb (a low-poly reference), completed with the
 * real rover: the warm electronics box under an arrow-shaped solar deck (centre panel, two swept wings and the rear panel, all covered in rows
 * of cells), six cleated wheels on a rocker-bogie, the camera mast with its wide head (two pancams, two navcams), the low-gain antenna, the
 * steerable high-gain dish, the UHF whip, the sundial and the instrument arm folded under the front of the deck.
 * Spirit (MER-A) is the same machine: `stuckWheel` draws its front-right wheel locked and dragged, which is what ended its mission.
 */
export function mer(p: VehiclePalette, o: { stuckWheel?: boolean } = {}): VehicleRig {
  const b = new Kit(p);
  const R = 0.85; // wheel radius
  const TRACK = 3.9;
  const AXLES = [2.85, -1.0, -3.2]; // front, middle, rear (the rear pair sits on the bogie)
  const DECK = 3.85; // underside of the solar deck

  // ---- wheels and rocker-bogie suspension ----
  for (const s of [-1, 1]) {
    for (const z of AXLES) {
      const tyre = () => b.tyre(R, 0.8, { cleats: 14, spokes: 5, hub: 0.34, curved: true });
      if (o.stuckWheel && s === 1 && z === AXLES[0]) b.at([s * TRACK, R, z], null, tyre); // locked: part of the body, it never turns
      else b.wheel(s * TRACK, z, R, tyre);
      b.cyl(0.13, 0.75, "x", s * 3.3, R, z, { seg: 10 }); // axle stub
      b.box(0.36, 0.5, 0.5, s * 3.12, R + 0.05, z, { r: 0.1 }); // drive motor
    }
    const x = s * 3.12;
    const pivot: V3 = [x, 2.75, 0.5];
    const bogie: V3 = [x, 1.85, -2.1];
    b.cyl(0.34, 0.5, "x", s * 2.95, 2.75, 0.5, { tone: MID }); // rocker pivot on the body
    b.tube(pivot, [x, R + 0.15, AXLES[0]], 0.17); // rocker, forward to the front wheel
    b.tube(pivot, bogie, 0.17); // rocker, back to the bogie
    b.ball(0.27, ...bogie, { tone: MID });
    b.tube(bogie, [x, R + 0.15, AXLES[1]], 0.15); // bogie
    b.tube(bogie, [x, R + 0.15, AXLES[2]], 0.15);
    for (const z of [AXLES[0], AXLES[2]]) b.cyl(0.2, 0.5, "y", x, R + 0.55, z, { tone: MID, seg: 10 }); // steering actuators (front and rear)
  }

  // ---- warm electronics box ----
  b.box(5.6, 1.65, 4.9, 0, 3.02, -0.75, { r: 0.22 });
  b.box(5.0, 0.2, 4.3, 0, 2.15, -0.75, { tone: DARK }); // belly pan
  for (const s of [-1, 1]) {
    b.box(0.14, 0.85, 1.7, s * 2.84, 3.05, -2.0, { tone: MID, r: 0.05 }); // side radiators
    b.tube([s * 2.7, 3.2, -1.2], [s * 4.5, DECK, -2.6], 0.09); // wing braces
    b.tube([s * 2.7, 3.2, 0.2], [s * 3.9, DECK, 0.4], 0.09);
  }
  // hazard cameras, front and rear
  for (const [z, dz] of [[1.75, 1], [-3.25, -1]] as const) {
    b.box(1.5, 0.42, 0.22, 0, 3.35, z, { tone: LIGHT, r: 0.06 });
    for (const s of [-1, 1]) b.cyl(0.13, 0.12, "z", s * 0.42, 3.35, z + dz * 0.14, { tone: DARK, seg: 12 });
  }

  // ---- solar deck: centre + two swept wings + rear panel, as one plate ----
  b.prism(
    [[-3.05, 2.7], [3.05, 2.7], [5.45, -3.8], [3.35, -5.25], [2.65, -3.6], [2.05, -4.9], [-2.05, -4.9], [-2.65, -3.6], [-3.35, -5.25], [-5.45, -3.8]],
    DECK,
    0.2,
  );
  const cells = (poly: [number, number][]) => rows(poly, 0.72, 0.09).forEach((row) => b.prism(row, DECK + 0.2, 0.035, { tone: DARK }));
  for (const s of [-1, 1]) {
    cells([[s * 2.82, 2.45], [s * 3.2, 2.45], [s * 5.18, -3.72], [s * 3.42, -4.92], [s * 2.82, -3.5]]); // wing
    cells([[s * 0.75, -3.75], [s * 1.9, -3.75], [s * 1.9, -4.72], [s * 0.75, -4.72]]); // rear panel
  }
  cells([[-2.6, 2.45], [2.6, 2.45], [2.6, 1.75], [-2.6, 1.75]]); // front of the deck
  cells([[-2.6, 1.6], [-0.85, 1.6], [-0.85, -3.4], [-2.6, -3.4]]); // left of the mast
  cells([[1.55, 1.6], [2.6, 1.6], [2.6, -2.05], [1.55, -2.05]]); // right
  for (const s of [-1, 1]) b.box(0.1, 0.07, 5.9, s * 2.71, DECK + 0.22, -0.55, { tone: LIGHT }); // wing hinges

  // ---- camera mast (pancam mast assembly) ----
  const top = DECK + 0.2;
  b.cyl(0.55, 0.35, "y", 0, top + 0.17, 1.0, { tone: MID, seg: 16 });
  b.cyl(0.27, 3.55, "y", 0, top + 1.95, 1.0, { seg: 14 });
  b.cyl(0.38, 0.6, "y", 0, 5.95, 1.0, { tone: MID, seg: 14 }); // deployment joint
  b.at([0, 8.3, 1.0], null, () => {
    b.cyl(0.42, 0.8, "y", 0, -0.55, 0, { seg: 14 }); // azimuth drive
    b.cyl(0.52, 1.5, "x", 0, 0, 0, { seg: 16 }); // elevation drum
    b.box(3.4, 0.95, 0.95, 0, 0.1, 0.12, { r: 0.2 }); // camera bar
    b.box(3.55, 0.12, 1.2, 0, 0.66, 0.15, { tone: LIGHT, r: 0.04 }); // sun visor
    for (const s of [-1, 1]) {
      b.cyl(0.33, 0.2, "z", s * 1.25, 0.1, 0.62, { tone: LIGHT, seg: 16 }); // pancam bezel
      b.cyl(0.24, 0.24, "z", s * 1.25, 0.1, 0.64, { tone: DARK, seg: 16 }); // pancam lens
      b.cyl(0.22, 0.2, "z", s * 0.55, 0.1, 0.62, { tone: LIGHT, seg: 14 });
      b.cyl(0.15, 0.24, "z", s * 0.55, 0.1, 0.64, { tone: DARK, seg: 14 }); // navcam lens
      b.box(0.16, 1.05, 1.05, s * 1.76, 0.1, 0.12, { tone: MID, r: 0.05 }); // end caps
    }
  });

  // ---- antennas and deck equipment ----
  b.box(0.75, 1.1, 0.75, 1.0, top + 0.55, -1.9, { r: 0.1 }); // low-gain antenna
  b.cyl(0.22, 1.1, "y", 1.0, top + 1.65, -1.9, { tone: MID, seg: 12 });
  b.cyl(0.11, 1.5, "y", 1.0, top + 2.9, -1.9, { seg: 8 });
  b.cyl(0.2, 0.22, "y", 1.0, top + 3.7, -1.9, { tone: LIGHT, seg: 12 });
  b.box(0.7, 0.7, 0.7, 2.25, top + 0.35, -3.0, { r: 0.1 }); // high-gain antenna: gimbal + dish
  b.cyl(0.12, 0.6, "y", 2.25, top + 0.95, -3.0, { seg: 8 });
  b.at([2.25, top + 1.45, -3.0], [-0.95, 0.5, 0], () => {
    b.lathe([[0, -0.2], [0.45, -0.14], [0.86, 0.06]], 0, 0, 0, { tone: MID });
    b.cyl(0.86, 0.07, "y", 0, 0.08, 0, { tone: LIGHT, seg: 24 });
    b.cyl(0.05, 0.4, "y", 0, 0.3, 0, { tone: DARK, seg: 6 });
    b.ball(0.11, 0, 0.52, 0, { tone: DARK });
  });
  b.cyl(0.16, 0.2, "y", -2.2, top + 0.1, -2.9, { tone: MID, seg: 10 }); // UHF whip
  b.cyl(0.06, 1.5, "y", -2.2, top + 0.85, -2.9, { seg: 6 });
  b.box(0.62, 0.06, 0.62, -0.1, top + 0.05, -4.3, { tone: LIGHT }); // sundial (calibration target)
  b.cyl(0.2, 0.05, "y", -0.1, top + 0.1, -4.3, { tone: MID, seg: 14 });
  b.cyl(0.04, 0.34, "y", -0.1, top + 0.25, -4.3, { tone: DARK, seg: 6 });
  b.ball(0.08, -0.1, top + 0.45, -4.3, { tone: DARK });
  b.box(0.9, 0.3, 1.3, -1.0, top + 0.15, -1.6, { tone: LIGHT, r: 0.06 }); // deck electronics
  b.box(0.5, 0.22, 0.5, 0.3, top + 0.11, -0.4, { tone: LIGHT, r: 0.05 });

  // ---- instrument arm, folded under the front of the deck ----
  b.box(0.7, 0.7, 0.5, 0.75, 2.75, 1.9, { r: 0.12 }); // shoulder
  b.tube([0.75, 2.75, 2.2], [-1.95, 2.9, 2.35], 0.15);
  b.ball(0.25, -1.95, 2.9, 2.35, { tone: MID });
  b.tube([-1.95, 2.6, 2.6], [0.95, 2.35, 2.85], 0.13);
  b.cyl(0.14, 0.4, "y", -1.95, 2.75, 2.48, { tone: MID, seg: 8 });
  b.at([1.3, 2.35, 2.9], [0, 0, 0.5], () => {
    b.cyl(0.34, 0.5, "z", 0, 0, 0, { tone: MID, seg: 14 }); // turret
    b.box(0.42, 0.42, 0.6, 0.55, 0, 0.05, { r: 0.08 }); // the four instruments
    b.cyl(0.2, 0.7, "z", -0.55, 0, 0.1, { seg: 10 });
    b.box(0.36, 0.36, 0.5, 0, 0.55, 0.05, { r: 0.07, tone: LIGHT });
    b.cyl(0.17, 0.55, "z", 0, -0.55, 0.05, { tone: DARK, seg: 10 });
  });
  return b.finish();
}

export const opportunity = (p: VehiclePalette) => mer(p);
