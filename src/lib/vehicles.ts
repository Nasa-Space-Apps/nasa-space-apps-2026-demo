import type { VehiclePalette, VehicleRig } from "./vehicles/kit";
import { beagle2 } from "./vehicles/beagle2";
import { ingenuity } from "./vehicles/ingenuity";
import { insight } from "./vehicles/insight";
import { opportunity } from "./vehicles/opportunity";
import { perseverance } from "./vehicles/perseverance";
import { sev } from "./vehicles/sev";
import { spirit } from "./vehicles/spirit";

/**
 * Procedural vehicles in the flat illustration style (see docs/design.md): every surface is one of THREE tones of one hue (dark / mid / light),
 * no outlines, no textures, no gradients, no GLB. Each model lives in `vehicles/<id>.ts` and is drawn with the primitives of `vehicles/kit.ts`,
 * with proportions measured on the reference GLBs of public/models.
 */
export type { VehiclePalette, VehicleRig };
export type VehicleModel = "opportunity" | "sev" | "perseverance" | "spirit" | "ingenuity" | "insight" | "beagle2";

export function buildVehicle(model: VehicleModel, palette: VehiclePalette): VehicleRig {
  if (model === "sev") return sev(palette);
  if (model === "perseverance") return perseverance(palette);
  if (model === "spirit") return spirit(palette);
  if (model === "ingenuity") return ingenuity(palette);
  if (model === "insight") return insight(palette);
  if (model === "beagle2") return beagle2(palette);
  return opportunity(palette);
}
