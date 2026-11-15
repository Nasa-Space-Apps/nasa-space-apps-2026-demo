import { THEME } from "./themes";
import type { TerrainStyle } from "./terrain";
import type { Checkpoint } from "./checkpoints";
import { storyOf } from "./story";
import type { VehicleModel, VehiclePalette } from "./vehicles";

export type RoverConfig = {
  model: VehicleModel; // procedural model in lib/vehicles.ts
  palette: VehiclePalette; // 3 tones of one hue + the flat background of its card (flat design: docs/design.md)
  maxSpeed: number;
  boostSpeed: number;
  heading: number; // initial heading (radians)
};

export type DustConfig = {
  color: string;
  drag: number; // exponential drag rate
  lift: number; // vertical acceleration (positive floats, negative falls)
  up: number; // initial upward speed multiplier
  life: number; // lifetime multiplier
  size: number; // size multiplier
  alpha: number; // opacity multiplier
};

export type Mission = {
  id: string;
  name: string; // selector label
  title: string; // minimap title
  terrainUrl: string;
  terrain: TerrainStyle;
  rover: RoverConfig;
  env: {
    sky: string;
    fogNear: number;
    fogFar: number;
    hemi: [string, string, number];
    sun: { color: string; intensity: number; offset: [number, number, number] };
  };
  dust: DustConfig;
  tracks: { color: string; opacity: number };
  checkpoints: Checkpoint[];
  checkpointRadius: number; // trigger radius (also sizes the beacon); ~1.5x the vehicle width
};

// shared by the Mars demo missions below (same values as `opportunity` / `perseverance`)
// ground = cream paper in 3 tones with ink contour lines; sky and fog are the blue field of the theme (docs/design.md)
const MARS_TERRAIN: TerrainStyle = { fade: 45, ...THEME.ground.mars, lines: THEME.ground.lines, step: 1.1 };
const GALE_TERRAIN: TerrainStyle = { fade: 45, ...THEME.ground.mars, lines: THEME.ground.lines, step: 1.6 };
const MOON_TERRAIN: TerrainStyle = { fade: 30, ...THEME.ground.moon, lines: THEME.ground.lines, step: 1.9 };
const MARS_ENV: Mission["env"] = {
  sky: THEME.canvas,
  fogNear: 90,
  fogFar: 330,
  hemi: ["#ffffff", "#B9B4E8", 0.8],
  sun: { color: "#ffffff", intensity: 2.5, offset: [55, 75, 40] },
};
const MARS_DUST: DustConfig = { color: "#F4DDD0", drag: 1.6, lift: 0.3, up: 1, life: 1, size: 1, alpha: 0.6 };
const MARS_TRACKS = { color: "#5B4A4A", opacity: 0.35 };

export const MISSIONS: Mission[] = [
  {
    id: "opportunity",
    name: "Opportunity · Mars",
    title: "MER-B · Opportunity",
    terrainUrl: "/models/terrain.stl",
    terrain: MARS_TERRAIN,
    rover: {
      model: "opportunity",
      palette: { dark: "#E65A4F", mid: "#F9A66C", light: "#FFE4E0", bg: THEME.paperLight }, // coral
      maxSpeed: 24, boostSpeed: 42,
      heading: -Math.PI * 0.75,
    },
    env: MARS_ENV,
    dust: MARS_DUST,
    tracks: MARS_TRACKS,
    checkpoints: storyOf("opportunity")!.checkpoints, // the real story: 13 Mars events (public/models/opportunity/story.json); the 5 before the landing are comic pages
    checkpointRadius: 15, // 13 stops 36–130 u apart
  },
  {
    // The real story (public/models/surveyor3/story.json, lib/story.ts); drives on the same Moon terrain as the SEV.
    id: "surveyor-3",
    name: "Surveyor 3 · Moon",
    title: "Surveyor 3 · Oceanus Procellarum",
    terrainUrl: "/models/moon-terrain.stl",
    terrain: MOON_TERRAIN,
    rover: {
      model: "surveyor3",
      palette: { dark: "#5C7A1F", mid: "#B3CC6A", light: "#F1F7DC", bg: THEME.paperLight }, // olive
      maxSpeed: 14, boostSpeed: 26,
      heading: -Math.PI * 0.75,
    },
    env: {
      sky: THEME.canvas,
      fogNear: 70,
      fogFar: 270,
      hemi: ["#ffffff", "#B9B4E8", 0.8],
      sun: { color: "#ffffff", intensity: 2.5, offset: [55, 75, 40] },
    },
    dust: { color: "#E9E2F8", drag: 0.5, lift: -4, up: 0.8, life: 0.8, size: 0.75, alpha: 0.55 },
    tracks: { color: "#4B4660", opacity: 0.35 },
    checkpoints: storyOf("surveyor-3")!.checkpoints, // 11 stops on the Moon; the 6 events before the landing are comic pages
    checkpointRadius: 14, // 11 stops ~40–60 u apart
  },
  {
    id: "sev",
    name: "SEV · Moon (Apollo 14)",
    title: "SEV · Apollo 14",
    terrainUrl: "/models/moon-terrain.stl",
    terrain: MOON_TERRAIN,
    rover: {
      model: "sev",
      palette: { dark: "#1650B0", mid: "#7FB0E3", light: "#F2F7FC", bg: THEME.paperLight }, // blue
      maxSpeed: 18, boostSpeed: 32,
      heading: -Math.PI * 0.75,
    },
    env: {
      sky: THEME.canvas,
      fogNear: 70,
      fogFar: 270,
      hemi: ["#ffffff", "#B9B4E8", 0.8],
      sun: { color: "#ffffff", intensity: 2.5, offset: [55, 75, 40] },
    },
    dust: { color: "#E9E2F8", drag: 0.5, lift: -4, up: 0.8, life: 0.8, size: 0.75, alpha: 0.55 },
    tracks: { color: "#4B4660", opacity: 0.35 },
    checkpoints: [], // coming soon: no story yet, so no route (and the globe keeps its 3D closed)
    checkpointRadius: 14,
  },
  {
    // Test vehicle: Perseverance's story (Jezero) over the Gale Crater terrain (Curiosity's landing site), the only extra elevation model available.
    id: "perseverance",
    name: "Perseverance · Mars",
    title: "Mars 2020 · Perseverance",
    terrainUrl: "/models/gale-terrain.stl",
    terrain: GALE_TERRAIN,
    rover: {
      model: "perseverance",
      palette: { dark: "#0F7A5C", mid: "#5FC29A", light: "#E6F7EE", bg: THEME.paperLight }, // green
      maxSpeed: 26, boostSpeed: 46,
      heading: -Math.PI * 0.75,
    },
    env: MARS_ENV,
    dust: MARS_DUST,
    tracks: MARS_TRACKS,
    checkpoints: [], // coming soon: no story yet, so no route (and the globe keeps its 3D closed)
    checkpointRadius: 22,
  },
  // ---- vehicles without a story yet («coming soon» on the globe): their 3D models are kept, the fictional demo routes were removed ----
  {
    id: "spirit",
    name: "Spirit · Mars (demo)",
    title: "MER-A · Spirit (demo)",
    terrainUrl: "/models/terrain.stl",
    terrain: MARS_TERRAIN,
    rover: {
      model: "spirit",
      palette: { dark: "#6A3FB5", mid: "#B196E6", light: "#F1ECFB", bg: THEME.paperLight }, // violet
      maxSpeed: 24, boostSpeed: 42,
      heading: -Math.PI * 0.75,
    },
    env: MARS_ENV,
    dust: MARS_DUST,
    tracks: MARS_TRACKS,
    checkpoints: [], // coming soon: no story yet, so no route (and the globe keeps its 3D closed)
    checkpointRadius: 18,
  },
  {
    id: "ingenuity",
    name: "Ingenuity · Mars",
    title: "Ingenuity · Jezero",
    terrainUrl: "/models/gale-terrain.stl",
    terrain: GALE_TERRAIN,
    rover: {
      model: "ingenuity",
      palette: { dark: "#D49A00", mid: "#F7D26A", light: "#FFF6D8", bg: THEME.paperLight }, // amber
      maxSpeed: 28, boostSpeed: 50,
      heading: -Math.PI * 0.75,
    },
    env: MARS_ENV,
    dust: MARS_DUST,
    tracks: MARS_TRACKS,
    checkpoints: storyOf("ingenuity")!.checkpoints, // the real story: 13 Mars events (public/models/ingenuity/story.json); the 5 before the landing are comic pages
    checkpointRadius: 15, // 13 stops 39–70 u apart
  },
  {
    id: "insight",
    name: "InSight · Mars (demo)",
    title: "InSight · Elysium (demo)",
    terrainUrl: "/models/gale-terrain.stl",
    terrain: GALE_TERRAIN,
    rover: {
      model: "insight",
      palette: { dark: "#12808F", mid: "#6CC3CC", light: "#E6F6F7", bg: THEME.paperLight }, // teal
      maxSpeed: 20, boostSpeed: 36,
      heading: -Math.PI * 0.75,
    },
    env: MARS_ENV,
    dust: MARS_DUST,
    tracks: MARS_TRACKS,
    checkpoints: [], // coming soon: no story yet, so no route (and the globe keeps its 3D closed)
    checkpointRadius: 20,
  },
  {
    id: "beagle-2",
    name: "Beagle 2 · Mars (demo)",
    title: "Beagle 2 · Isidis (demo)",
    terrainUrl: "/models/terrain.stl",
    terrain: MARS_TERRAIN,
    rover: {
      model: "beagle2",
      palette: { dark: "#B0306A", mid: "#E88AB4", light: "#FDEAF2", bg: THEME.paperLight }, // berry
      maxSpeed: 20, boostSpeed: 36,
      heading: -Math.PI * 0.75,
    },
    env: MARS_ENV,
    dust: MARS_DUST,
    tracks: MARS_TRACKS,
    checkpoints: [], // coming soon: no story yet, so no route (and the globe keeps its 3D closed)
    checkpointRadius: 20,
  },
];

export const DEFAULT_MISSION = MISSIONS[0].id;
