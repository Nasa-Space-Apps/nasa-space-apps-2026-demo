/**
 * The one theme of the demo: "Ink & Paper" (reference: ponpon-mania.com/chapter/2, an interactive comic). A flat periwinkle blue field (with a fine grain),
 * cream paper cards, thick black ink strokes, a single pink accent, pill-shaped buttons, and one grotesque (Libre Franklin) in bold lowercase for labels.
 * Flat: no shadows, no gradients. See docs/design.md.
 *
 * This object is the single source of truth: `app/layout.tsx` publishes it as CSS variables (`cssVars`) for `globals.css`, and canvas / WebGL code
 * (minimap, globe, scene sky) reads it directly.
 */

export type Theme = {
  id: string;
  name: string;
  font: string; // text
  mono: string; // labels, buttons, numbers (same family as `font`, set bold and lowercase: there is no mono in this theme)
  canvas: string; // the field behind everything: page, globe, scene sky and fog, loading screen
  surface: string; // paper: cards and panels
  onInk: string; // text and icons on ink (same cream as the paper)
  ink: string; // strokes, main text and primary buttons
  inkSoft: string; // pressed ink
  muted: string; // secondary text
  line: string; // hairlines, tracks and dividers on paper
  accent: string; // the main colour: current position, route, pins
  accentInk: string; // text on the accent
  accentSoft: string; // links on hover
  hover: string; // fill that sweeps across a button on hover
  radius: number; // paper cards and panels
  radiusSm: number; // buttons, chips and pills (fully round)
  stroke: number; // width of the ink stroke around panels, photos and illustrations (px)
  grain: number; // opacity of the fine grain laid over the whole screen (0 = off)
  ease: string; // every transition uses this curve
  pop: string; // the playful curve (overshoots, then settles) for game-like pops: world switch, buttons, cards
  dur: { fast: number; base: number; slow: number }; // ms
  /** Minimap: topographic contours. */
  map: { bg: string; minor: string; major: string; minorW: number; majorW: number; every: number };
  trail: { color: string; width: number; dash: number[] };
  marker: { dot: string; ring: string; arrow: string };
  checkpoint: { pin: string; done: string; ring: string }; // minimap squares: pending fill / reached fill / outline
  /** 3D beacons of the checkpoints in the scene. */
  beacon: { pending: string; active: string; done: string };
  /** Ground of each world in the scene (3 cream tones + the ink of the contour lines); sky, fog and the vehicle card use `canvas` / `paperLight`. */
  ground: { mars: { lo: string; hi: string; edge: string }; moon: { lo: string; hi: string; edge: string }; lines: string };
  /** Light paper: the flat field behind a vehicle on its card. */
  paperLight: string;
  /** Wireframe globe view. */
  globe: {
    bg: string;
    line: string;
    star: string;
    ink: string;
    tag: string;
    tagText: string;
    pin: string; // pulsing ring under each vehicle
    /** The little vehicles standing on the globe: ink + accent + paper, so they stand out from the blue field whatever their mission colour. */
    vehicle: { dark: string; mid: string; light: string };
  };
};


const INK = "#171717"; // measured on the reference (body and pill)
const PAPER = "#FEECE3"; // measured: the comic pages
const BLUE = "#7E7EFF"; // the field of the reference (ponpon-mania.com); each world now has its own (see WORLDS)
const PINK = "#F892C0"; // the accent of the reference; each world now has its own (see WORLDS)

/** The shared base: everything but the colours that belong to a world (canvas, accent, beacon, globe, marker). `themeFor(world)` completes it. */
const BASE: Theme = {
  id: "ink-paper",
  name: "Ink & Paper",
  font: "var(--font-sans), 'Helvetica Neue', Arial, sans-serif",
  mono: "var(--font-sans), 'Helvetica Neue', Arial, sans-serif",
  canvas: BLUE,
  surface: PAPER,
  onInk: PAPER,
  ink: INK,
  inkSoft: "#3A3A3A",
  muted: "#675651",
  line: "#E8CFC2",
  accent: PINK,
  accentInk: INK,
  accentSoft: "#4747E0",
  hover: PINK,
  radius: 6,
  radiusSm: 999,
  stroke: 3,
  grain: 0.08,
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  pop: "cubic-bezier(0.34, 1.7, 0.5, 1)",
  dur: { fast: 250, base: 600, slow: 1000 },
  map: { bg: PAPER, minor: "#EBD2C5", major: "#BB9A8B", minorW: 0.8, majorW: 1.3, every: 4 },
  trail: { color: INK, width: 2.5, dash: [5, 4] },
  marker: { dot: PINK, ring: PAPER, arrow: INK },
  checkpoint: { pin: PAPER, done: INK, ring: INK },
  beacon: { pending: INK, active: PINK, done: "#B9A59D" },
  ground: {
    mars: { lo: "#EEBE95", hi: "#FFF1DF", edge: "#F7D8BC" }, // warm sand
    moon: { lo: "#CDD3DA", hi: "#F5F6F8", edge: "#E2E6EA" }, // cool silver
    lines: INK,
  },
  paperLight: "#FFF6F0", // measured: the reference's loading screen
  globe: { bg: BLUE, line: "#A9A9FF", star: INK, ink: INK, tag: INK, tagText: PAPER, pin: PAPER, vehicle: { dark: INK, mid: PINK, light: PAPER } },
};

/**
 * The colours of each world. Ink and paper (the comic itself) stay the same everywhere; what changes is the field behind it, the single accent and what
 * hangs from them (globe grid, beacon, marker, the little vehicles on the globe, the ground). Mars is rust and butterscotch; the Moon is steel blue and mint.
 */
export type WorldId = "mars" | "moon" | "home";
type World = {
  canvas: string; // the field: page, globe, scene sky and fog, loading screen
  canvasAlt: string; // a lighter tint of the field: the globe grid and the comic's background blobs
  accent: string; // the single accent: position, route, pins, pills (ink text on it)
  accentSoft: string; // links on hover, on paper
  beacon: string; // the active beacon in the 3D scene (a deeper tone of the accent, to read on the pale ground)
};
export const WORLDS: Record<WorldId, World> = {
  mars: { canvas: "#E2603A", canvasAlt: "#F49A6D", accent: "#FFC247", accentSoft: "#B33A16", beacon: "#F08A00" },
  moon: { canvas: "#4B7DB8", canvasAlt: "#86AFDA", accent: "#6BE3C3", accentSoft: "#1F5C8E", beacon: "#16B38F" },
  // the home page only: the colours of the reference itself (ponpon-mania.com): periwinkle field, pink accent (docs/design.md, «Home»)
  home: { canvas: BLUE, canvasAlt: "#A9A9FF", accent: PINK, accentSoft: "#4747E0", beacon: PINK },
};

/**
 * Extra colours of the home page (the collage of cards and the vehicle): the butter of the badge's centre and Opportunity, recoloured green so that it reads against
 * periwinkle (the mission colours of `missions.ts` are for its own scene).
 */
export const HOME = {
  butter: "#FFC247", // the badge's centre (the butter of Mars)
  vehicles: {
    opportunity: { dark: "#1E7A5A", mid: "#58C79A", light: "#E9FBF1" }, // green
  } as Record<string, { dark: string; mid: string; light: string }>,
};

const themes = new Map<WorldId, Theme>();
/** The full theme of a world (cached: components compare themes by identity). */
export function themeFor(id: WorldId): Theme {
  let t = themes.get(id);
  if (!t) {
    const w = WORLDS[id];
    t = {
      ...BASE,
      canvas: w.canvas,
      accent: w.accent,
      accentSoft: w.accentSoft,
      hover: w.accent,
      marker: { ...BASE.marker, dot: w.accent },
      beacon: { ...BASE.beacon, active: w.beacon },
      globe: { ...BASE.globe, bg: w.canvas, line: w.canvasAlt, vehicle: { ...BASE.globe.vehicle, mid: w.accent } },
    };
    themes.set(id, t);
  }
  return t;
}

/** The world of a route: / is the home page, /moon… the Moon, everything else (/mars…) Mars. */
export const worldOfPath = (path: string): WorldId => {
  const first = path.split("/")[1];
  return first === "moon" ? "moon" : first === "" || first === undefined ? "home" : "mars";
};

/** The default theme (the Moon). Components pick the one of their world with `useTheme()` (lib/use-theme.ts). */
export const THEME: Theme = themeFor("moon");

/** The theme as CSS custom properties (set on <html> so `globals.css` classes can use them). */
export function cssVars(t: Theme): Record<string, string> {
  return {
    "--canvas": t.canvas,
    "--surface": t.surface,
    "--on-ink": t.onInk,
    "--ink": t.ink,
    "--ink-soft": t.inkSoft,
    "--muted": t.muted,
    "--line": t.line,
    "--accent": t.accent,
    "--accent-ink": t.accentInk,
    "--accent-soft": t.accentSoft,
    "--hover": t.hover,
    "--radius": `${t.radius}px`,
    "--radius-sm": `${t.radiusSm}px`,
    "--stroke": `${t.stroke}px`,
    "--grain": String(t.grain),
    "--ease": t.ease,
    "--pop": t.pop,
    "--dur-fast": `${t.dur.fast}ms`,
    "--dur-base": `${t.dur.base}ms`,
    "--dur-slow": `${t.dur.slow}ms`,
  };
}
