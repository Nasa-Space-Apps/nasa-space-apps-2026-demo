import { DARK, Kit, LIGHT, MID, type V3, type VehiclePalette, type VehicleRig } from "./kit";

/**
 * Mars 2020 Perseverance. Proportions measured on public/models/perseverance/perseverance.glb (1 m = 4.4 units), with the mast raised instead of stowed:
 * the boxy body with its belly pan and deck, six big wheels with curved spokes on a rocker-bogie (steering actuators on the four corners, the
 * differential bar across the deck), the nuclear generator tilted up at the back between its two heat-exchanger plates, the camera mast with
 * the big SuperCam eye over the Mastcam-Z pair, the robotic arm folded across the front with its heavy turret and drill, the hexagonal
 * high-gain dish, the dark UHF can, the low-gain antenna and the deck equipment.
 */
export function perseverance(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  const R = 1.15;
  const WIDTH = 1.5; // of a wheel
  const FRONT = 4.75;
  const MIDDLE = -0.35;
  const REAR = -5.15;
  const DECK = 5.05; // top of the body

  // ---- wheels and rocker-bogie ----
  for (const s of [-1, 1]) {
    for (const [x, z] of [[4.8, FRONT], [5.2, MIDDLE], [4.8, REAR]]) {
      b.wheel(s * x, z, R, () => b.tyre(R, WIDTH, { cleats: 24, spokes: 6, hub: 0.3, curved: true }));
    }
    const arm = s * 3.75;
    const pivot: V3 = [arm, 4.2, 1.0];
    const bogie: V3 = [arm, 3.0, -2.3];
    b.cyl(0.55, 0.9, "x", s * 3.5, 4.2, 1.0, { tone: MID, seg: 18 }); // rocker pivot
    b.cyl(0.3, 0.3, "x", s * 4.05, 4.2, 1.0, { tone: LIGHT, seg: 12 });
    b.tube(pivot, [s * 4.5, 3.5, FRONT - 0.5], 0.24); // rocker, forward
    b.tube(pivot, bogie, 0.24); // rocker, back to the bogie pivot
    b.cyl(0.42, 0.7, "x", arm, 3.0, -2.3, { tone: MID, seg: 14 });
    b.tube(bogie, [s * 4.2, 1.9, MIDDLE - 0.2], 0.2); // bogie, forward to the middle wheel
    b.tube(bogie, [s * 4.5, 3.5, REAR + 0.5], 0.2); // bogie, back to the rear wheel
    // middle wheel: fixed strut to the hub
    b.tube([s * 4.2, 1.9, MIDDLE - 0.2], [s * 4.25, R, MIDDLE], 0.2);
    b.cyl(0.24, 0.5, "x", s * 4.4, R, MIDDLE, { seg: 10 });
    // corner wheels: steering actuator above the wheel and a strut down to the hub on the inner side
    for (const z of [FRONT, REAR]) {
      const dz = z > 0 ? -0.5 : 0.5;
      b.cyl(0.42, 0.95, "y", s * 4.55, 3.15, z + dz * 0.2, { tone: MID, seg: 14 });
      b.cyl(0.3, 0.3, "y", s * 4.55, 3.75, z + dz * 0.2, { tone: LIGHT, seg: 12 });
      b.tube([s * 4.4, 2.75, z], [s * 3.85, 2.3, z], 0.2);
      b.tube([s * 3.85, 2.3, z], [s * 3.85, R, z], 0.2);
      b.cyl(0.24, 0.5, "x", s * 3.95, R, z, { seg: 10 });
    }
    b.tube([s * 3.3, DECK + 0.25, 0.8], [0, DECK + 0.3, 0.55], 0.13); // differential bar
  }
  b.cyl(0.4, 0.3, "y", 0, DECK + 0.25, 0.55, { tone: MID, seg: 14 });

  // ---- body ----
  b.box(6.4, 1.9, 8.0, 0, 4.1, 0, { r: 0.16 });
  b.box(5.7, 0.26, 7.3, 0, 3.05, 0, { tone: DARK }); // belly pan
  b.box(6.6, 0.14, 8.2, 0, DECK, 0, { r: 0.05 }); // deck plate
  for (const s of [-1, 1]) {
    b.box(0.1, 0.95, 2.3, s * 3.22, 4.15, -2.2, { tone: MID, r: 0.04 }); // side access panels
    b.box(0.1, 0.6, 1.3, s * 3.22, 4.4, 2.9, { tone: LIGHT, r: 0.04 });
  }
  for (const z of [-1.1, 1.9]) b.box(6.2, 0.03, 0.07, 0, DECK + 0.08, z, { tone: DARK }); // deck seams

  // ---- back: tower and the nuclear generator, tilted up between its heat-exchanger plates ----
  b.slab([[-2.9, DECK], [-4.0, 6.55], [-4.5, 6.55], [-4.5, 3.6], [-4.0, 3.15], [-2.9, 3.15]], 0, 4.6);
  b.at([0, 5.35, -4.3], [0.47, 0, 0], () => {
    b.cyl(0.78, 3.3, "z", 0, 0, -1.75, { seg: 16 });
    for (let k = 0; k < 8; k++) b.box(0.1, 3.0, 2.9, 0, 0, -1.75, { tone: LIGHT, rot: [0, 0, (k * Math.PI) / 8] }); // fins
    b.cyl(0.95, 0.3, "z", 0, 0, -3.5, { tone: MID, seg: 16 });
    for (const s of [-1, 1]) b.box(0.16, 2.5, 3.5, s * 1.72, 0.1, -1.75, { r: 0.05 }); // heat exchangers
    b.box(3.6, 0.16, 0.5, 0, 1.3, -0.3, { tone: MID });
  });
  b.box(1.5, 0.4, 0.3, 0, 3.75, -4.6, { tone: LIGHT, r: 0.06 }); // rear hazcams
  for (const s of [-1, 1]) b.cyl(0.14, 0.12, "z", s * 0.4, 3.75, -4.78, { tone: DARK, seg: 10 });

  // ---- antennas ----
  b.box(0.8, 0.5, 0.8, -2.3, 6.5, -4.3, { r: 0.08 }); // UHF: the dark can at the rear
  b.cyl(0.46, 1.45, "y", -2.3, 7.45, -4.3, { tone: DARK, seg: 16 });
  b.cyl(0.5, 0.14, "y", -2.3, 6.78, -4.3, { tone: LIGHT, seg: 16 });
  b.box(0.7, 0.6, 0.7, 2.1, DECK + 0.35, -2.2, { r: 0.1 }); // high-gain antenna: gimbal + hexagonal dish
  b.cyl(0.14, 0.8, "y", 2.1, DECK + 1.0, -2.2, { seg: 8 });
  b.ball(0.26, 2.1, DECK + 1.45, -2.2, { tone: MID });
  b.at([2.1, DECK + 1.55, -2.2], [-1.0, 0.45, 0], () => {
    b.cyl(1.3, 0.12, "y", 0, 0.18, 0, { tone: LIGHT, seg: 6 });
    b.cyl(1.05, 0.14, "y", 0, 0.08, 0, { tone: MID, seg: 6 });
    b.cyl(0.06, 0.4, "y", 0, 0.44, 0, { tone: DARK, seg: 6 });
    b.ball(0.13, 0, 0.68, 0, { tone: DARK });
  });
  b.cyl(0.17, 0.9, "y", 0.5, DECK + 0.5, -2.9, { seg: 10 }); // low-gain antenna
  b.cyl(0.26, 0.3, "y", 0.5, DECK + 1.05, -2.9, { tone: LIGHT, r2: 0.12, seg: 10 });

  // ---- deck equipment ----
  b.box(1.5, 0.55, 1.9, -1.9, DECK + 0.32, -2.3, { r: 0.1 });
  b.box(1.1, 0.12, 1.4, -1.9, DECK + 0.62, -2.3, { tone: MID });
  b.box(1.0, 0.36, 1.0, 1.7, DECK + 0.22, 0.2, { tone: LIGHT, r: 0.07 });
  b.box(0.8, 0.07, 0.8, -0.3, DECK + 0.1, 2.5, { tone: LIGHT }); // calibration target
  for (const [x, z] of [[-0.5, 2.3], [-0.1, 2.3], [-0.5, 2.7], [-0.1, 2.7]]) b.cyl(0.1, 0.05, "y", x, DECK + 0.15, z, { tone: DARK, seg: 8 });
  b.cyl(0.08, 1.3, "y", 2.6, DECK + 0.7, 2.6, { seg: 6 }); // weather boom
  b.tube([2.6, DECK + 1.2, 2.6], [3.6, DECK + 1.2, 2.6], 0.06, { seg: 6 });
  b.box(1.3, 0.3, 0.9, 0.2, DECK + 0.2, -0.3, { r: 0.07 });

  // ---- camera mast, raised ----
  const mast = { x: -2.3, z: 3.0 };
  b.box(1.0, 0.5, 1.0, mast.x, DECK + 0.3, mast.z, { r: 0.1 });
  b.cyl(0.42, 0.5, "y", mast.x, DECK + 0.75, mast.z, { tone: MID, seg: 14 });
  b.cyl(0.29, 2.9, "y", mast.x, DECK + 2.3, mast.z, { seg: 14 });
  b.cyl(0.4, 0.45, "y", mast.x, DECK + 3.65, mast.z, { tone: MID, seg: 14 });
  b.at([mast.x, DECK + 4.6, mast.z + 0.15], null, () => {
    b.box(2.1, 1.5, 1.5, 0, 0, 0, { r: 0.22 }); // head
    b.box(1.0, 0.75, 0.5, 0, 1.0, -0.3, { r: 0.1 }); // SuperCam electronics on top
    b.cyl(0.52, 0.3, "z", -0.35, 0.22, 0.72, { tone: LIGHT, seg: 20 }); // SuperCam: the big eye
    b.cyl(0.4, 0.34, "z", -0.35, 0.22, 0.74, { tone: DARK, seg: 20 });
    for (const x of [-0.35, 0.3]) {
      b.box(0.44, 0.4, 0.3, x, -0.45, 0.72, { tone: LIGHT, r: 0.06 }); // Mastcam-Z pair
      b.box(0.28, 0.25, 0.34, x, -0.45, 0.74, { tone: DARK });
    }
    for (const x of [-0.85, 0.82]) b.cyl(0.13, 0.3, "z", x, -0.45, 0.72, { tone: DARK, seg: 10 }); // navcams
    b.cyl(0.2, 0.3, "z", 0.6, 0.3, 0.72, { tone: MID, seg: 12 });
  });

  // ---- front: hazcams, sample handling and the arm folded across, with its turret ----
  b.box(2.6, 0.45, 0.3, 0.3, 3.45, 4.1, { tone: LIGHT, r: 0.07 });
  for (const x of [-0.6, -0.15, 0.75, 1.2]) b.cyl(0.15, 0.14, "z", x, 3.45, 4.27, { tone: DARK, seg: 10 });
  b.cyl(0.85, 0.5, "z", 1.9, 4.25, 4.2, { tone: MID, seg: 18 }); // bit carousel
  b.cyl(0.5, 0.56, "z", 1.9, 4.25, 4.22, { tone: DARK, seg: 14 });
  b.cyl(0.6, 0.75, "z", -2.3, 4.3, 4.3, { tone: MID, seg: 16 }); // shoulder
  b.tube([-2.3, 4.3, 4.85], [1.1, 3.55, 4.85], 0.26); // upper arm
  b.cyl(0.52, 0.8, "z", 1.1, 3.55, 4.95, { tone: MID, seg: 16 }); // elbow
  b.tube([1.1, 3.55, 5.4], [-1.2, 4.75, 5.4], 0.22); // forearm, folded back
  b.cyl(0.42, 0.6, "z", -1.2, 4.75, 5.4, { tone: MID, seg: 14 }); // wrist
  b.at([-0.2, 5.0, 6.0], [0, 0, 0.35], () => {
    b.cyl(1.0, 1.0, "z", 0, 0, 0, { seg: 20 }); // turret
    b.cyl(0.62, 1.06, "z", 0, 0, 0, { tone: MID, seg: 16 });
    b.cyl(0.36, 1.9, "y", 1.15, -0.2, 0.1, { tone: DARK, seg: 12 }); // coring drill
    b.cyl(0.5, 0.5, "y", 1.15, 0.5, 0.1, { seg: 12 });
    b.box(0.95, 0.85, 0.9, -1.1, 0.25, 0.1, { tone: LIGHT, r: 0.14 }); // PIXL
    b.box(0.8, 0.7, 0.8, 0, 1.15, 0.05, { r: 0.12 }); // SHERLOC
    b.cyl(0.18, 0.2, "z", 0, 1.15, 0.5, { tone: DARK, seg: 10 });
  });
  return b.finish();
}
