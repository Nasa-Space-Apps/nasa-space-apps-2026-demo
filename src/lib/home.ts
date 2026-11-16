import { BODIES } from "./bodies";
import { MISSIONS, type RoverConfig } from "./missions";
import { storyOf } from "./story";
import { HOME } from "./themes";

/**
 * Data and shapes of the home page (`/`, components/Home.tsx): ONE composition, like a poster, where the illustrations of the stories lie around as tilted cards of
 * different sizes and a few of the 3D vehicles stand among them. Everything is laid out on a fixed «stage» of 1700 × 1000 units that is scaled to fit the screen
 * (`stageScale`); cards and clouds are DOM, the vehicles are one transparent 3D canvas positioned from the same stage coordinates.
 */
export const STAGE = { w: 1700, h: 1000 };

/** Pixels per stage unit: the stage is fitted to the screen (on a tall, narrow screen it is cropped at the sides instead, so the middle stays readable). */
export function stageScale(w: number, h: number): number {
  return w / h > 0.9 ? Math.min(w / STAGE.w, h / STAGE.h) : (h / STAGE.h) * 0.95;
}

/** Pointer position, -1…1 from the centre of the screen. Written by the page, read by the 3D vehicles every frame (no re-renders). */
export const pointer = { x: 0, y: 0 };

/** Bursts of sparkles: the sparkle layer registers itself here; the page calls `fx.burst(x, y)` in screen pixels. */
export const fx: { burst: (x: number, y: number) => void } = { burst: () => {} };

// ───────────────────────────── the cards ─────────────────────────────

export type Card = {
  id: string; // mission id: also the slug of its route (/<world>/<id>)
  name: string;
  world: "mars" | "moon";
  image: string; // an AI illustration of one beat of its story (4:5)
  x: number; // centre on the stage
  y: number;
  w: number; // width (the card is 4:5)
  rot: number; // degrees
  amp: number; // how far it floats up and down (units)
  speed: number; // how fast (rad/s)
  phase: number;
  delay: number; // ms before it is dealt onto the table
};

/** Mission, the beat whose illustration is its card, and where it lies: [id, beat, x, y, w, rotation, delay]. Two on each side of the vehicle; they are decoration (they do not open anything). */
const LAYOUT: [string, string, number, number, number, number, number][] = [
  ["beagle-2", "bgl049", 300, 330, 225, 8, 820], // Found on the surface
  ["spirit", "spi037", 330, 700, 260, -9, 700], // The top of Husband Hill
  ["ingenuity", "ing032", 1400, 320, 235, -7, 1020], // Flight 1
  ["surveyor-3", "sur040", 1370, 705, 270, 7, 780], // The Sun hidden by the Earth
];

export const CARDS: Card[] = LAYOUT.map(([id, beat, x, y, w, rot, delay], i) => {
  const body = BODIES.find((b) => b.vehicles.some((v) => v.missionId === id))!;
  return {
    id,
    name: body.vehicles.find((v) => v.missionId === id)!.name,
    world: body.id as "mars" | "moon",
    image: storyOf(id)!.beats.find((b) => b.id === beat)!.image,
    x,
    y,
    w,
    rot,
    amp: 5 + (i % 3) * 2,
    speed: 0.5 + (i % 4) * 0.13,
    phase: i * 1.9,
    delay,
  };
});

// ───────────────────────────── the vehicles ─────────────────────────────

export type Piece = {
  id: string;
  rover: RoverConfig; // the mission's model, with the home colours
  x: number; // stage coordinates: where its nearest wheels touch the ground
  y: number;
  scale: number;
  yaw: number; // radians: which way it faces
  fly: boolean;
  delay: number; // ms
};

/** The vehicle that stands in the composition: [id, x, y, scale, yaw, flies, delay]. Just Opportunity, big, still. `y` is where its nearest wheels touch the ground. */
const STAND: [string, number, number, number, number, boolean, number][] = [["opportunity", 850, 868, 2.9, 0.5, false, 0]];

export const PIECES: Piece[] = STAND.map(([id, x, y, scale, yaw, fly, delay]) => {
  const rover = MISSIONS.find((m) => m.id === id)!.rover;
  const home = HOME.vehicles[id];
  return { id, rover: home ? { ...rover, palette: { ...rover.palette, ...home } } : rover, x, y, scale, yaw, fly, delay };
});
