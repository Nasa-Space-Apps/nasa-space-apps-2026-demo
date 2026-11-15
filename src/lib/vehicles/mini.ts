import { DARK, Kit, LIGHT, MID, type VehiclePalette, type VehicleRig } from "./kit";
import type { VehicleModel } from "../vehicles";

/**
 * Tiny, very low-detail versions of the vehicles for the globe (docs/design.md): a handful of primitives each, ~10 units long, drawn with EXAGGERATED
 * features (big wheels with light hubs, a thick mast, wide panels) so that at ~50 px on screen they still read as "a rover", "a helicopter", "a lander"...
 * `blob.ts` sinks the lower part of each in goo, so what must be recognisable is what sticks out: wheels, panels, masts, rotors. The full models
 * (opportunity.ts, sev.ts...) are far too heavy for six markers. Same Kit, same three-tone material; the caller passes the globe's ink / accent / paper
 * palette. Origin on the ground (y = 0), forward = +z.
 */

/** A wheel seen from the side: a dark tyre with a light hub (the light hub is what reads against the dark goo). */
function wheel(b: Kit, r: number, x: number, z: number) {
  b.cyl(r, 1.1, "x", x, r, z, { tone: DARK, seg: 10 });
  b.cyl(r * 0.55, 1.35, "x", x, r, z, { tone: LIGHT, seg: 10 });
}

/** A six-wheeled rover: big wheels, a small body, a wide pink solar deck and a thick mast with a two-eyed head. */
function rover(p: VehiclePalette, o: { len: number; wheel: number; mast: number; arm?: boolean }): VehicleRig {
  const b = new Kit(p);
  const track = 4.4;
  for (const z of [-3.4, 0, 3.4]) for (const s of [-1, 1]) wheel(b, o.wheel, s * track, z);
  const top = o.wheel * 2 + 0.2;
  b.box(5.2, 1.6, o.len, 0, top, 0, { r: 0.4 });
  b.box(9.6, 0.5, o.len + 1.2, 0, top + 1.1, 0, { tone: MID });
  b.box(9.0, 0.12, o.len + 0.6, 0, top + 1.4, 0, { tone: LIGHT }); // the cells' light frame
  b.tube([0, top + 1.2, 1.8], [0, top + 1.2 + o.mast, 1.8], 0.5, { tone: LIGHT, seg: 6 });
  b.box(2.8, 1.4, 1.3, 0, top + 1.6 + o.mast, 1.8, { tone: DARK });
  for (const s of [-1, 1]) b.cyl(0.4, 0.5, "z", s * 0.8, top + 1.6 + o.mast, 2.55, { tone: LIGHT, seg: 8 }); // the two eyes
  if (o.arm) b.tube([1.8, top + 0.4, o.len / 2], [2.4, top - 0.8, o.len / 2 + 2.6], 0.45, { tone: LIGHT, seg: 6 });
  return b.finish({ halfLen: 3.4, halfWid: track });
}

/** SEV: a tall rounded cabin with a big light windshield on six twin-wheel pods. */
function sev(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  for (const z of [-4, 0, 4]) for (const s of [-1, 1]) wheel(b, 1.6, s * 3.7, z);
  b.box(5.4, 3.4, 9.4, 0, 5, 0, { r: 1 });
  b.box(4.4, 1.7, 1.2, 0, 5.6, 4.7, { tone: LIGHT }); // windshield
  b.box(3.8, 0.7, 4.2, 0, 7, -1, { tone: MID }); // roof radiator
  return b.finish({ halfLen: 4, halfWid: 3.7 });
}

/** Ingenuity: a pink body on four light legs under two crossed light rotors and a solar panel (it stands still here). */
function ingenuity(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.tube([sx * 0.8, 3, sz * 0.8], [sx * 3.4, 0.3, sz * 3.4], 0.35, { tone: LIGHT, seg: 6 });
  b.box(2.6, 2.4, 2.6, 0, 4.2, 0, { tone: MID, r: 0.5 });
  b.cyl(0.45, 2.4, "y", 0, 6.6, 0, { tone: LIGHT, seg: 6 });
  b.box(11, 0.45, 1.5, 0, 7.6, 0, { tone: LIGHT });
  b.box(1.5, 0.45, 11, 0, 8.2, 0, { tone: LIGHT });
  b.box(3.8, 0.3, 2.6, 0, 9, 0, { tone: DARK });
  return b.finish({ halfLen: 3.4, halfWid: 3.4 });
}

/** InSight: a pink hexagonal deck on three light legs between two big round solar fans, with the seismometer dome. */
function insight(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI * 2) / 3 + Math.PI / 6;
    b.tube([Math.cos(a) * 1.6, 3, Math.sin(a) * 1.6], [Math.cos(a) * 4.4, 0.3, Math.sin(a) * 4.4], 0.4, { tone: LIGHT, seg: 6 });
  }
  b.cyl(3.4, 1.1, "y", 0, 3.5, 0, { tone: MID, seg: 6 });
  b.ball(1.5, 0, 4.4, 0, { tone: LIGHT, s: [1, 0.75, 1] });
  for (const s of [-1, 1]) {
    b.cyl(3.7, 0.4, "y", s * 5.6, 4.6, 0, { tone: LIGHT, seg: 14, rot: [0, 0, s * 0.3] });
    b.cyl(2.7, 0.5, "y", s * 5.6, 4.75, 0, { tone: DARK, seg: 14, rot: [0, 0, s * 0.3] });
  }
  return b.finish({ halfLen: 4.4, halfWid: 4.4 });
}

/** Beagle 2: a dark round base with a pink lid and four big round petals opened around it. */
function beagle2(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  b.cyl(3.8, 1.4, "y", 0, 1.7, 0, { tone: DARK, seg: 14 });
  b.cyl(3.1, 0.7, "y", 0, 2.7, 0, { tone: MID, seg: 14 });
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    b.cyl(2.5, 0.4, "y", Math.cos(a) * 4.8, 3, Math.sin(a) * 4.8, { tone: k % 2 ? LIGHT : MID, seg: 10 });
  }
  b.ball(1.2, 0, 3.3, 0, { tone: LIGHT, s: [1, 0.6, 1] });
  return b.finish({ halfLen: 4.4, halfWid: 4.4 });
}

/** The globe marker of a vehicle model: a few primitives in one mesh, one material. `dispose()` when done. */
export function buildMarker(model: VehicleModel, palette: VehiclePalette): VehicleRig {
  if (model === "sev") return sev(palette);
  if (model === "perseverance") return rover(palette, { len: 7.4, wheel: 1.6, mast: 3.8, arm: true });
  if (model === "ingenuity") return ingenuity(palette);
  if (model === "insight") return insight(palette);
  if (model === "beagle2") return beagle2(palette);
  return rover(palette, { len: 6.6, wheel: 1.5, mast: 3.4 }); // opportunity, spirit
}
