import ingenuity from "../../public/models/ingenuity/story.json";
import opportunity from "../../public/models/opportunity/story.json";
import surveyor3 from "../../public/models/surveyor3/story.json";
import type { Checkpoint } from "./checkpoints";

/**
 * The stories of the missions that have one (hito 36 Opportunity, hito 40 Ingenuity): real events in chronological order, from the idea to the legacy.
 * Everything of a mission lives in `public/models/<mission>/` (story.json + images + audio), built by scripts/build-story.mjs from the research dossiers
 * (copy in scripts/data/<mission>-story.mjs); this module only types and slices it:
 *
 *   intro  beats before the vehicle is on Mars → comic pages (components/Comic.tsx)
 *   mars   beats on the Martian surface → the 3D route: each one is a checkpoint (`Story.checkpoints`)
 *   outro  beats after the last signal → comic pages again
 */
export type StoryPart = "intro" | "mars" | "outro";

export type StoryBeat = {
  id: string; // oppNNN / ingNNN: the id of the event in the research dossiers of the mission (misiones/<mission>/dossiers)
  n: number; // position in the whole story (1…20)
  part: StoryPart;
  date: string; // as shown ("Jan 24, 2004")
  place?: string; // 3D beats only
  title: string;
  summary: string; // the card / page caption (~25 words)
  narration: string; // spoken script (~45 words)
  facts: [label: string, value: string][];
  sources: { type: "official" | "scientific" | "press"; host: string; url: string }[]; // where the facts come from (the card links to them)
  image: string; // AI illustration, 4:5
  imageRatio: string;
  audio: string;
  route?: { x: number; z: number; via?: [number, number][] }; // 3D beats only
};

type StoryFile = {
  mission: string;
  name: string;
  title: string;
  note: string;
  closing: { title: string; text: string };
  parts: { id: StoryPart; title: string; blurb: string; beats: string[] }[];
  beats: StoryBeat[];
};

export const ILLUSTRATION_CREDIT = "AI-generated illustration";

/** A beat as a checkpoint: the narration store, the card, the timeline and the minimap all work on `Checkpoint`s. Beats without a 3D stop sit at the origin. */
export function beatToCheckpoint(b: StoryBeat): Checkpoint {
  return {
    id: b.id,
    name: b.title,
    place: b.place ? `${b.date} · ${b.place}` : b.date,
    x: b.route?.x ?? 0,
    z: b.route?.z ?? 0,
    ...(b.route?.via ? { via: b.route.via } : {}),
    image: b.image,
    imageRatio: b.imageRatio,
    credit: ILLUSTRATION_CREDIT,
    text: b.summary,
    narration: b.narration,
    audio: b.audio,
    facts: b.facts.slice(0, 3),
    ...(b.sources.length ? { sources: b.sources } : {}),
    noGuide: true,
  };
}

export type Story = {
  mission: string;
  name: string; // «Opportunity»
  title: string;
  closing: { title: string; text: string }; // the card after the last comic page
  parts: StoryFile["parts"];
  beats: StoryBeat[];
  intro: StoryBeat[];
  mars: StoryBeat[]; // the beats with a 3D stop (on Mars, or on the Moon for Surveyor 3)
  outro: StoryBeat[];
  /** The 3D route of the story: one stop per Mars beat, in order (the first one is where the vehicle starts, the last one where it falls silent). */
  checkpoints: Checkpoint[];
};

function build(data: StoryFile): Story {
  const mars = data.beats.filter((b) => b.part === "mars");
  return {
    mission: data.mission,
    name: data.name,
    title: data.title,
    closing: data.closing,
    parts: data.parts,
    beats: data.beats,
    intro: data.beats.filter((b) => b.part === "intro"),
    mars,
    outro: data.beats.filter((b) => b.part === "outro"),
    checkpoints: mars.map(beatToCheckpoint),
  };
}

const STORIES: Record<string, Story> = {
  opportunity: build(opportunity as unknown as StoryFile),
  ingenuity: build(ingenuity as unknown as StoryFile),
  "surveyor-3": build(surveyor3 as unknown as StoryFile), // the mission id has a hyphen, the folder public/models/surveyor3 does not
};

/** The story of a mission, or undefined if it has none (those missions open straight in the 3D scene). */
export const storyOf = (missionId: string): Story | undefined => STORIES[missionId];
