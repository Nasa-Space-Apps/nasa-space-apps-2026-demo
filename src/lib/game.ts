import * as THREE from "three";
import type { TerrainData } from "./terrain";
import type { Checkpoint } from "./checkpoints";
import type { Route } from "./route";

/** Mutable game state shared between the 3D scene and the DOM overlays (no React re-renders). */
export const game = {
  terrain: null as TerrainData | null,
  route: null as Route | null, // path of the active mission (see lib/route.ts)
  s: 0, // distance travelled along the route
  travel: null as number | null, // checkpoint index the autopilot is driving to (set from the timeline), null = manual
  x: 0,
  y: 0,
  z: 0,
  heading: -Math.PI * 0.75, // travel direction = (sin h, 0, cos h)
  speed: 0, // signed speed along the route (negative = reversing during an autopilot trip back)
  boost: false, // autopilot trip in progress (more dust, camera shake)
  topSpeed: 42,
  quaternion: new THREE.Quaternion(),
  wheels: [] as THREE.Vector3[],
  checkpoints: [] as Checkpoint[],
  checkpointRadius: 16,
  visited: new Set<string>(), // checkpoint ids already reached
  active: null as string | null, // checkpoint the rover is currently inside
  mission: "", // id of the active mission (vehicle), e.g. "opportunity" | "sev"
  stationary: false, // the vehicle never moves (InSight, Beagle 2): `s` is a cursor on a virtual route, Space steps to the next moment (see `stepForward`)
  hold: false, // the scene waits behind something else (the story's comic pages): no driving, no checkpoint detection, no narration or guide
};

/** `go` = Space held: advance along the route until the next checkpoint. */
export const input = { go: false };

/** Timeline: drive (forward or backward along the route) to checkpoint `index` and stop there. */
export function travelTo(index: number) {
  const route = game.route;
  if (!route || index < 0 || index >= route.stops.length) return;
  if (Math.abs(route.stops[index] - game.s) < 0.5) return; // already there
  game.travel = index;
}

/** Stationary vehicle: go to the next moment of its story (Space). Ignored while the story's comic is on top or the cursor is already moving. */
export function stepForward() {
  const route = game.route;
  if (!route || game.hold || game.travel !== null) return;
  const i = route.stops.findIndex((x) => Math.abs(x - game.s) < 0.6);
  if (i >= 0 && i < route.stops.length - 1) game.travel = i + 1;
}

export function bindKeyboard() {
  const down = (e: KeyboardEvent) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    if (game.stationary) {
      if (!e.repeat) stepForward(); // the vehicle never moves: Space only changes the moment
      return;
    }
    input.go = true;
  };
  const up = (e: KeyboardEvent) => {
    if (e.code === "Space") input.go = false;
  };
  const blur = () => {
    input.go = false;
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
  };
}
