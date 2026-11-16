import { BODIES } from "./bodies";
import { MISSIONS, type RoverConfig } from "./missions";
import { storyOf } from "./story";
import { HOME } from "./themes";

/**
 * Data and shapes of the home page (`/`, components/Home.tsx): ONE composition, like a poster, where illustrations of the stories lie around as tilted cards of
 * different sizes and a 3D vehicle stands among them. Everything is laid out on a fixed «stage» that is scaled to fit the screen (`stageScale`); the cards are DOM, the
 * vehicle is a transparent 3D canvas positioned from the same stage coordinates. There are two compositions of the same pieces: a wide one (a landscape screen: the
 * vehicle in the middle, two cards on each side) and a tall one (a phone held upright: the cards stacked in two rows above the vehicle).
 */
export type Layout = {
  name: "wide" | "tall";
  w: number; // stage size
  h: number;
  /** Pixels per stage unit for a screen of this size. */
  fit: (vw: number, vh: number) => number;
  cards: Record<string, [x: number, y: number, w: number, rotation: number]>; // centre on the stage, width (the card is 4:5), degrees
  piece: { x: number; y: number; scale: number; yaw: number }; // y: where its nearest wheels touch the ground
  pill: [x: number, y: number]; // the «start» button
  badge: [x: number, y: number, size: number]; // the ring sticker (its top-left corner)
};

const WIDE: Layout = {
  name: "wide",
  w: 1700,
  h: 1000,
  fit: (vw, vh) => Math.min(vw / 1700, vh / 1000),
  cards: {
    "beagle-2": [300, 330, 225, 8],
    spirit: [330, 700, 260, -9],
    ingenuity: [1400, 320, 235, -7],
    "surveyor-3": [1370, 705, 270, 7],
  },
  piece: { x: 850, y: 868, scale: 2.9, yaw: 0.5 },
  pill: [850, 918],
  badge: [430, 56, 150],
};

/** Tall: the stage is 1000 wide but a phone shows only the middle 860 (the cards keep clear of the cropped edges). */
const TALL: Layout = {
  name: "tall",
  w: 1000,
  h: 1700,
  fit: (vw, vh) => Math.min(vw / 860, vh / 1700),
  cards: {
    ingenuity: [255, 430, 300, -8],
    "surveyor-3": [745, 560, 290, 7],
    "beagle-2": [250, 905, 265, 9],
    spirit: [760, 1010, 270, -7],
  },
  piece: { x: 500, y: 1560, scale: 2.7, yaw: 0.5 },
  pill: [500, 1655],
  badge: [110, 130, 150],
};

/** A landscape screen gets the wide composition, a portrait one the tall one. */
export const layoutFor = (vw: number, vh: number): Layout => (vw / vh > 0.9 ? WIDE : TALL);

/** Pixels per stage unit for a screen of this size. */
export const stageScale = (vw: number, vh: number): number => layoutFor(vw, vh).fit(vw, vh);

/** Pointer position, -1…1 from the centre of the screen. Written by the page, read by the 3D vehicle for the parallax (no re-renders). */
export const pointer = { x: 0, y: 0 };

/** Bursts of sparkles: the sparkle layer registers itself here; the page calls `fx.burst(x, y)` in screen pixels. */
export const fx: { burst: (x: number, y: number) => void } = { burst: () => {} };

// ───────────────────────────── the cards ─────────────────────────────

export type Card = {
  id: string; // mission id
  name: string;
  world: "mars" | "moon";
  image: string; // an AI illustration of one beat of its story (4:5)
  amp: number; // how far it floats up and down (units)
  speed: number; // how fast (rad/s)
  phase: number;
  delay: number; // ms before it is dealt onto the table
};

/** Mission, the beat whose illustration is its card, and when it is dealt: [id, beat, delay]. They are decoration (they do not open anything). */
const DEAL: [string, string, number][] = [
  ["beagle-2", "bgl049", 820], // Found on the surface
  ["spirit", "spi037", 700], // The top of Husband Hill
  ["ingenuity", "ing032", 1020], // Flight 1
  ["surveyor-3", "sur040", 780], // The Sun hidden by the Earth
];

export const CARDS: Card[] = DEAL.map(([id, beat, delay], i) => {
  const body = BODIES.find((b) => b.vehicles.some((v) => v.missionId === id))!;
  return {
    id,
    name: body.vehicles.find((v) => v.missionId === id)!.name,
    world: body.id as "mars" | "moon",
    image: storyOf(id)!.beats.find((b) => b.id === beat)!.image,
    amp: 5 + (i % 3) * 2,
    speed: 0.5 + (i % 4) * 0.13,
    phase: i * 1.9,
    delay,
  };
});

// ───────────────────────────── the vehicle ─────────────────────────────

export type Piece = {
  id: string;
  rover: RoverConfig; // the mission's model, with the home colours
};

/** The vehicle that stands in the composition (just Opportunity, big and still); where, see `Layout.piece`. */
export const PIECES: Piece[] = ["opportunity"].map((id) => {
  const rover = MISSIONS.find((m) => m.id === id)!.rover;
  const home = HOME.vehicles[id];
  return { id, rover: home ? { ...rover, palette: { ...rover.palette, ...home } } : rover };
});
