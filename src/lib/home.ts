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

/** Bursts of sparkles: the sparkle layer registers itself here; the page and the vehicles call `fx.burst(x, y)` in screen pixels. */
export const fx: { burst: (x: number, y: number) => void } = { burst: () => {} };

/** True while the pointer is over a 3D vehicle: a card under it must not take the click. Set by the 3D scene. */
export const over = { vehicle: false };

/** Set by the page when its loading screen lifts: the vehicles spring in from then on. */
export const stageState = { go: false };

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

/** Mission, the beat whose illustration is its card, and where it lies: [id, beat, x, y, w, rotation, delay]. */
const LAYOUT: [string, string, number, number, number, number, number][] = [
  ["spirit", "spi037", 290, 520, 250, -8, 700], // The top of Husband Hill
  ["beagle-2", "bgl049", 585, 300, 210, 9, 820], // Found on the surface
  ["opportunity", "opp072", 850, 470, 340, -3, 600], // The last signal
  ["insight", "ins072", 1115, 400, 255, 6, 900], // «My power's really low»
  ["ingenuity", "ing032", 1440, 300, 225, -8, 1020], // Flight 1
  ["surveyor-3", "sur040", 1450, 650, 265, 7, 780], // The Sun hidden by the Earth
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
  x: number; // stage coordinates: where its feet are (or, for the helicopter, its centre)
  y: number;
  scale: number;
  yaw: number; // radians: which way it faces
  fly: boolean;
  delay: number; // ms
};

/** Which vehicles stand in the composition: [id, x, y, scale, yaw, flies, delay]. Opportunity is the star; the rest keep it company. */
const STAND: [string, number, number, number, number, boolean, number][] = [
  ["opportunity", 850, 925, 2.0, 0.5, false, 1100],
  ["insight", 500, 925, 1.85, 0.35, false, 1300],
  ["surveyor-3", 1215, 925, 1.65, 0.2, false, 1450],
  ["ingenuity", 1385, 300, 1.55, 0.6, true, 1650],
];

export const PIECES: Piece[] = STAND.map(([id, x, y, scale, yaw, fly, delay]) => {
  const rover = MISSIONS.find((m) => m.id === id)!.rover;
  const home = HOME.vehicles[id];
  return { id, rover: home ? { ...rover, palette: { ...rover.palette, ...home } } : rover, x, y, scale, yaw, fly, delay };
});

// ───────────────────────────── the sun window ─────────────────────────────

/** Anchors of the window in a 1000 × 700 box: an arch with two wings, its foot hidden below the bottom edge (the clouds cover it). */
const ANCHORS: [number, number][] = [
  [35, 790],
  [18, 600],
  [40, 450],
  [8, 372],
  [60, 306],
  [200, 292],
  [292, 262],
  [326, 150],
  [410, 58],
  [500, 34],
  [590, 58],
  [674, 150],
  [708, 262],
  [800, 292],
  [940, 306],
  [992, 372],
  [960, 450],
  [982, 600],
  [965, 790],
];

/** The window's outline at time `t` (s): every free anchor drifts a little, so the shape breathes. */
export function blobPath(t: number): string {
  const amp = 7;
  const p = ANCHORS.map(([x, y], i) => {
    if (i === 0 || i === ANCHORS.length - 1) return [x, y] as [number, number];
    return [x + Math.sin(t * (0.55 + i * 0.11) + i * 1.7) * amp, y + Math.cos(t * (0.45 + i * 0.09) + i * 2.3) * amp] as [number, number];
  });
  // Catmull-Rom through the anchors → cubic Béziers
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

/**
 * A wavy band (a wisp of cloud in the sky of the window): two tiles of `W` units, so the second continues the first and the band can drift forever.
 * `top` and `thick` in units of the window box; `a` is the wave height.
 */
export function bandPath(top: number, thick: number, a: number, phase: number): string {
  const W = 1000;
  const N = 60;
  const up: string[] = [];
  const down: string[] = [];
  for (let i = 0; i <= N * 2; i++) {
    const x = (i * W) / N;
    const y1 = top - a * Math.sin((2 * Math.PI * x) / W + phase) - a * 0.45 * Math.sin((4 * Math.PI * x) / W + phase * 2);
    const y2 = top + thick + a * 0.7 * Math.sin((2 * Math.PI * x) / W + phase + 1.2) + a * 0.3 * Math.sin((6 * Math.PI * x) / W + phase);
    up.push(`${x.toFixed(1)},${y1.toFixed(1)}`);
    down.unshift(`${x.toFixed(1)},${y2.toFixed(1)}`);
  }
  return `M${up.join("L")}L${down.join("L")}Z`;
}

// ───────────────────────────── the clouds in front ─────────────────────────────

/**
 * A row of puffy clouds, two tiles wide (the second continues the first, so it can drift forever): half-ellipse bumps of the given `widths` / `heights` along a
 * baseline `base`, filled down to `bottom`. The widths are rescaled so one tile is exactly `tile` units.
 */
export function cloudPath(tile: number, widths: number[], heights: number[], base: number, bottom: number): string {
  const sum = widths.reduce((a, b) => a + b, 0);
  let d = `M0,${bottom}L0,${base}`;
  let x = 0;
  for (let rep = 0; rep < 2; rep++) {
    widths.forEach((w, i) => {
      const ww = (w * tile) / sum;
      d += `A${(ww / 2).toFixed(1)},${heights[i]} 0 0 1 ${(x + ww).toFixed(1)},${base}`;
      x += ww;
    });
  }
  return `${d}L${x.toFixed(1)},${bottom}Z`;
}

export const CLOUD_TILE = 1500;
/** Front row: big, slow, ink-outlined pink. Back row: paler, smaller, offset. */
export const CLOUD_FRONT = cloudPath(CLOUD_TILE, [260, 190, 300, 220, 170, 280], [72, 96, 80, 104, 68, 88], 0, 400);
export const CLOUD_BACK = cloudPath(CLOUD_TILE, [180, 240, 150, 260, 200, 170, 220], [62, 80, 58, 84, 68, 60, 76], 0, 400);
