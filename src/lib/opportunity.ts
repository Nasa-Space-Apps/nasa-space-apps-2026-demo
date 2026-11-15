import story from "../../public/models/opportunity/story.json";
import type { Checkpoint } from "./checkpoints";

/**
 * The Opportunity story (hito 36): 20 real events of the mission, in chronological order, from the planning of the rover to its legacy. Everything lives in
 * `public/models/opportunity/` (story.json + images + audio), built by scripts/build-opportunity-story.mjs from the research dossiers; this module only types
 * and slices it:
 *
 *   intro   5 beats before the rover reaches Mars → comic pages (components/Comic.tsx)
 *   mars   13 beats on Meridiani Planum → the 3D route: each one is a checkpoint (`OPPORTUNITY_STORY_CHECKPOINTS`)
 *   outro   2 beats after the last signal → comic pages again
 */
export type StoryPart = "intro" | "mars" | "outro";

export type StoryBeat = {
  id: string; // oppNNN: the id of the event in story/data/linea_de_tiempo_opportunity.json
  n: number; // position in the whole story (1…20)
  part: StoryPart;
  date: string; // as shown ("Jan 24, 2004")
  place?: string; // 3D beats only
  title: string;
  summary: string; // the card / page caption (~25 words)
  narration: string; // spoken script (~45 words)
  facts: [label: string, value: string][];
  source: { label: string; title: string; url: string } | null;
  image: string; // AI illustration, 4:5
  imageRatio: string;
  audio: string;
  route?: { x: number; z: number; via?: [number, number][] }; // 3D beats only
};

type StoryFile = { title: string; note: string; parts: { id: StoryPart; title: string; blurb: string; beats: string[] }[]; beats: StoryBeat[] };
const data = story as unknown as StoryFile;

export const STORY_TITLE = data.title;
export const STORY_BEATS: StoryBeat[] = data.beats;
export const STORY_PARTS = data.parts;
export const INTRO_BEATS = STORY_BEATS.filter((b) => b.part === "intro");
export const MARS_BEATS = STORY_BEATS.filter((b) => b.part === "mars");
export const OUTRO_BEATS = STORY_BEATS.filter((b) => b.part === "outro");

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
    ...(b.source ? { source: { label: b.source.label, url: b.source.url } } : {}),
    noGuide: true,
  };
}

/** The 3D route of the story: one stop per Mars beat, in order (the first one is where the rover starts, the last one where it falls silent). */
export const OPPORTUNITY_STORY_CHECKPOINTS: Checkpoint[] = MARS_BEATS.map(beatToCheckpoint);
