import { DARK, Kit, LIGHT, MID, type VehiclePalette, type VehicleRig } from "./kit";
import type { VehicleModel } from "../vehicles";

/**
 * Tiny, very low-detail versions of the vehicles for the globe (docs/design.md): a handful of primitives each, ~10 units long, so that at ~17 px on
 * screen they still read as "a rover", "a helicopter", "a lander"... The full models (opportunity.ts, sev.ts...) are far too heavy for six markers.
 * Same Kit, same three-tone material; the caller passes the globe's ink / accent / paper palette. Origin on the ground (y = 0), forward = +z.
 */

/** A six-wheeled rover: wheels, body, a solar deck wider than the body and a mast with its head. */
function rover(p: VehiclePalette, o: { len: number; wheel: number; mast: number; arm?: boolean }): VehicleRig {
  const b = new Kit(p);
  const track = 3.9;
  for (const z of [-3.2, 0, 3.2]) for (const s of [-1, 1]) b.cyl(o.wheel, 1, "x", s * track, o.wheel, z, { tone: DARK, seg: 8 });
  const top = o.wheel + 1.6;
  b.box(5.4, 2, o.len, 0, top, 0, { r: 0.4 });
  b.box(8.6, 0.5, o.len + 1, 0, top + 1.2, 0, { tone: MID });
  b.tube([0, top + 1.2, 1.6], [0, top + 1.2 + o.mast, 1.6], 0.35, { tone: DARK, seg: 6 });
  b.box(2, 1, 0.9, 0, top + 1.2 + o.mast + 0.5, 1.6, { tone: LIGHT });
  if (o.arm) b.tube([1.6, top + 0.2, o.len / 2], [2, top - 0.6, o.len / 2 + 2.2], 0.3, { tone: DARK, seg: 6 });
  return b.finish({ halfLen: 3.2, halfWid: track });
}

/** SEV: a boxy cabin with a glass nose on six twin-wheel pods. */
function sev(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  for (const z of [-4, 0, 4]) for (const s of [-1, 1]) b.cyl(1.5, 1.4, "x", s * 3.4, 1.5, z, { tone: DARK, seg: 8 });
  b.box(5.2, 3, 9, 0, 4, 0, { r: 0.9 });
  b.box(4.2, 1.4, 1, 0, 4.8, 4.4, { tone: LIGHT });
  b.box(3.6, 0.5, 3.8, 0, 5.9, -1, { tone: MID });
  return b.finish({ halfLen: 4, halfWid: 3.4 });
}

/** Ingenuity: a small body on four splayed legs under two crossed rotors and a solar panel (it stands still here). */
function ingenuity(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.tube([sx * 0.7, 2.6, sz * 0.7], [sx * 3, 0.3, sz * 3], 0.25, { tone: DARK, seg: 5 });
  b.box(2.2, 2, 2.2, 0, 3.6, 0, { r: 0.4 });
  b.cyl(0.3, 2, "y", 0, 5.6, 0, { tone: MID, seg: 6 });
  b.box(10, 0.25, 1.1, 0, 6.3, 0, { tone: LIGHT });
  b.box(1.1, 0.25, 10, 0, 6.7, 0, { tone: LIGHT });
  b.box(3.6, 0.2, 2.4, 0, 7.1, 0, { tone: DARK });
  return b.finish({ halfLen: 3, halfWid: 3 });
}

/** InSight: a hexagonal deck on three legs between two round solar fans, with the seismometer dome. */
function insight(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI * 2) / 3 + Math.PI / 6;
    b.tube([Math.cos(a) * 1.5, 2.6, Math.sin(a) * 1.5], [Math.cos(a) * 4, 0.3, Math.sin(a) * 4], 0.3, { tone: DARK, seg: 5 });
  }
  b.cyl(3.2, 0.9, "y", 0, 2.9, 0, { tone: MID, seg: 6 });
  b.ball(1.3, 0, 3.4, 0, { tone: DARK, s: [1, 0.7, 1] });
  for (const s of [-1, 1]) {
    b.cyl(3.4, 0.3, "y", s * 5.2, 3.6, 0, { tone: LIGHT, seg: 14, rot: [0, 0, s * 0.3] });
    b.cyl(2.5, 0.35, "y", s * 5.2, 3.7, 0, { tone: DARK, seg: 14, rot: [0, 0, s * 0.3] });
  }
  return b.finish({ halfLen: 4, halfWid: 4 });
}

/** Beagle 2: a round base with its lid and four round panels opened like petals. */
function beagle2(p: VehiclePalette): VehicleRig {
  const b = new Kit(p);
  b.cyl(3.8, 1, "y", 0, 1.5, 0, { tone: DARK, seg: 14 });
  b.cyl(3, 0.5, "y", 0, 2.3, 0, { tone: MID, seg: 14 });
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    b.cyl(2.3, 0.25, "y", Math.cos(a) * 4.6, 2.5, Math.sin(a) * 4.6, { tone: k % 2 ? LIGHT : MID, seg: 10 });
  }
  b.ball(1, 0, 2.7, 0, { tone: LIGHT, s: [1, 0.6, 1] });
  return b.finish({ halfLen: 4, halfWid: 4 });
}

/** The globe marker of a vehicle model: a few primitives in one mesh, one material. `dispose()` when done. */
export function buildMarker(model: VehicleModel, palette: VehiclePalette): VehicleRig {
  if (model === "sev") return sev(palette);
  if (model === "perseverance") return rover(palette, { len: 7.2, wheel: 1.35, mast: 3, arm: true });
  if (model === "ingenuity") return ingenuity(palette);
  if (model === "insight") return insight(palette);
  if (model === "beagle2") return beagle2(palette);
  return rover(palette, { len: 6.4, wheel: 1.2, mast: 2.4 }); // opportunity, spirit
}
