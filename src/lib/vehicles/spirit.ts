import { mer } from "./opportunity";
import type { VehiclePalette, VehicleRig } from "./kit";

/** Spirit (MER-A): the same rover as Opportunity, with its front-right wheel locked (the dead wheel that dug the "bright soil"). */
export const spirit = (p: VehiclePalette): VehicleRig => mer(p, { stuckWheel: true });
