import type { TerrainStyle } from "./terrain";
import { OPPORTUNITY_CHECKPOINTS, PERSEVERANCE_CHECKPOINTS, SEV_CHECKPOINTS, type Checkpoint } from "./checkpoints";
import { BEAGLE2_CHECKPOINTS, INGENUITY_CHECKPOINTS, INSIGHT_CHECKPOINTS, SPIRIT_CHECKPOINTS } from "./checkpoints-demo";
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
const MARS_TERRAIN: TerrainStyle = { fade: 45, lo: "#A5967F", hi: "#DDD0BC", edge: "#C4B8A6", lines: "#5E4F3C", step: 1.1 };
const GALE_TERRAIN: TerrainStyle = { fade: 45, lo: "#A58C76", hi: "#E0CBB3", edge: "#C4B29E", lines: "#5B4636", step: 1.6 };
const MARS_ENV: Mission["env"] = {
  sky: "#EFEBE5",
  fogNear: 90,
  fogFar: 330,
  hemi: ["#ffffff", "#b9b2a9", 0.7],
  sun: { color: "#ffffff", intensity: 2.5, offset: [55, 75, 40] },
};
const MARS_DUST: DustConfig = { color: "#BDB4A9", drag: 1.6, lift: 0.3, up: 1, life: 1, size: 1, alpha: 0.55 };

export const MISSIONS: Mission[] = [
  {
    id: "opportunity",
    name: "Opportunity · Mars",
    title: "MER-B · Opportunity",
    terrainUrl: "/models/terrain.stl",
    terrain: { fade: 45, lo: "#A5967F", hi: "#DDD0BC", edge: "#C4B8A6", lines: "#5E4F3C", step: 1.1 },
    rover: {
      model: "opportunity",
      palette: { dark: "#E65A4F", mid: "#F9A66C", light: "#FFE4E0", bg: "#D9D9D9" }, // coral
      maxSpeed: 24, boostSpeed: 42,
      heading: -Math.PI * 0.75,
    },
    env: {
      sky: "#EFEBE5",
      fogNear: 90,
      fogFar: 330,
      hemi: ["#ffffff", "#b9b2a9", 0.7],
      sun: { color: "#ffffff", intensity: 2.5, offset: [55, 75, 40] },
    },
    dust: { color: "#BDB4A9", drag: 1.6, lift: 0.3, up: 1, life: 1, size: 1, alpha: 0.55 },
    tracks: { color: "#8E877F", opacity: 0.4 },
    checkpoints: OPPORTUNITY_CHECKPOINTS,
    checkpointRadius: 18,
  },
  {
    id: "sev",
    name: "SEV · Moon (Apollo 14)",
    title: "SEV · Apollo 14",
    terrainUrl: "/models/moon-terrain.stl",
    terrain: { fade: 30, lo: "#98A0AD", hi: "#D6DBE3", edge: "#B9C0CB", lines: "#4E5663", step: 1.9 },
    rover: {
      model: "sev",
      palette: { dark: "#1650B0", mid: "#7FB0E3", light: "#F2F7FC", bg: "#D9D9D9" }, // blue
      maxSpeed: 18, boostSpeed: 32,
      heading: -Math.PI * 0.75,
    },
    env: {
      sky: "#EAEDF1",
      fogNear: 70,
      fogFar: 270,
      hemi: ["#ffffff", "#aeb3bb", 0.7],
      sun: { color: "#ffffff", intensity: 2.5, offset: [55, 75, 40] },
    },
    dust: { color: "#B2B7BF", drag: 0.5, lift: -4, up: 0.8, life: 0.8, size: 0.75, alpha: 0.5 },
    tracks: { color: "#8A9098", opacity: 0.4 },
    checkpoints: SEV_CHECKPOINTS,
    checkpointRadius: 14,
  },
  {
    // Test vehicle: Perseverance's story (Jezero) over the Gale Crater terrain (Curiosity's landing site), the only extra elevation model available.
    id: "perseverance",
    name: "Perseverance · Mars",
    title: "Mars 2020 · Perseverance",
    terrainUrl: "/models/gale-terrain.stl",
    terrain: { fade: 45, lo: "#A58C76", hi: "#E0CBB3", edge: "#C4B29E", lines: "#5B4636", step: 1.6 },
    rover: {
      model: "perseverance",
      palette: { dark: "#0F7A5C", mid: "#5FC29A", light: "#E6F7EE", bg: "#D9D9D9" }, // green
      maxSpeed: 26, boostSpeed: 46,
      heading: -Math.PI * 0.75,
    },
    env: {
      sky: "#EFEBE5",
      fogNear: 90,
      fogFar: 330,
      hemi: ["#ffffff", "#b9b2a9", 0.7],
      sun: { color: "#ffffff", intensity: 2.5, offset: [55, 75, 40] },
    },
    dust: { color: "#BDB4A9", drag: 1.6, lift: 0.3, up: 1, life: 1, size: 1, alpha: 0.55 },
    tracks: { color: "#8E877F", opacity: 0.4 },
    checkpoints: PERSEVERANCE_CHECKPOINTS,
    checkpointRadius: 22,
  },
  // ---- FICTIONAL demo vehicles (lib/checkpoints-demo.ts): made to try their 3D models on the two Mars terrains we already have ----
  {
    id: "spirit",
    name: "Spirit · Mars (demo)",
    title: "MER-A · Spirit (demo)",
    terrainUrl: "/models/terrain.stl",
    terrain: MARS_TERRAIN,
    rover: {
      model: "spirit",
      palette: { dark: "#6A3FB5", mid: "#B196E6", light: "#F1ECFB", bg: "#D9D9D9" }, // violet
      maxSpeed: 24, boostSpeed: 42,
      heading: -Math.PI * 0.75,
    },
    env: MARS_ENV,
    dust: MARS_DUST,
    tracks: { color: "#8E877F", opacity: 0.4 },
    checkpoints: SPIRIT_CHECKPOINTS,
    checkpointRadius: 18,
  },
  {
    id: "ingenuity",
    name: "Ingenuity · Mars (demo)",
    title: "Ingenuity · Jezero (demo)",
    terrainUrl: "/models/gale-terrain.stl",
    terrain: GALE_TERRAIN,
    rover: {
      model: "ingenuity",
      palette: { dark: "#D49A00", mid: "#F7D26A", light: "#FFF6D8", bg: "#D9D9D9" }, // amber
      maxSpeed: 28, boostSpeed: 50,
      heading: -Math.PI * 0.75,
    },
    env: MARS_ENV,
    dust: MARS_DUST,
    tracks: { color: "#8E877F", opacity: 0.4 },
    checkpoints: INGENUITY_CHECKPOINTS,
    checkpointRadius: 16,
  },
  {
    id: "insight",
    name: "InSight · Mars (demo)",
    title: "InSight · Elysium (demo)",
    terrainUrl: "/models/gale-terrain.stl",
    terrain: GALE_TERRAIN,
    rover: {
      model: "insight",
      palette: { dark: "#12808F", mid: "#6CC3CC", light: "#E6F6F7", bg: "#D9D9D9" }, // teal
      maxSpeed: 20, boostSpeed: 36,
      heading: -Math.PI * 0.75,
    },
    env: MARS_ENV,
    dust: MARS_DUST,
    tracks: { color: "#8E877F", opacity: 0.4 },
    checkpoints: INSIGHT_CHECKPOINTS,
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
      palette: { dark: "#B0306A", mid: "#E88AB4", light: "#FDEAF2", bg: "#D9D9D9" }, // berry
      maxSpeed: 20, boostSpeed: 36,
      heading: -Math.PI * 0.75,
    },
    env: MARS_ENV,
    dust: MARS_DUST,
    tracks: { color: "#8E877F", opacity: 0.4 },
    checkpoints: BEAGLE2_CHECKPOINTS,
    checkpointRadius: 20,
  },
];

export const DEFAULT_MISSION = MISSIONS[0].id;
