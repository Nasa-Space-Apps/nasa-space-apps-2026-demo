#!/usr/bin/env node
/**
 * Builds everything the story of a mission consumes into public/models/<mission>/ (the app imports story.json and serves images and audio from there):
 *
 *   story.json      the beats in chronological order: English copy (title, short summary, spoken narration, 3 facts), sources, image, audio and — for the
 *                   Mars beats — the 3D stop (x, z, via) from scripts/data/<mission>-route.json
 *   images/<id>.jpg the AI illustrations (4:5), resized for the web (same place for every mission)
 *   audio/          narration clips + manifest.json (recorded with scripts/generate-story-audio.mjs, not here)
 *
 * The facts and sources come from the research dossiers of the mission; the copy lives in scripts/data/<mission>-story.mjs (editorial English written from the
 * verified facts, see docs/story.md). Run:
 *
 *   npm run story -- <mission>                 e.g. opportunity, ingenuity
 *
 * If the data module has `sourceImage(id)` (art kept outside the repo) the images are resized from there; otherwise they must already be in
 * public/models/<mission>/images (what `npm run story-images` writes). If you change a `narration`, run `npm run story-audio -- <mission>` to re-record it.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { ROOT } from "./lib/tts.mjs";

const mission = process.argv[2];
if (!mission || mission.startsWith("--")) {
  console.error("Usage: node scripts/build-story.mjs <mission>   (data in scripts/data/<mission>-story.mjs)");
  process.exit(1);
}
const D = await import(pathToFileURL(path.join(ROOT, `scripts/data/${mission}-story.mjs`)).href);
const OUT = path.join(ROOT, "public/models", mission);
const DOSSIERS = path.join(ROOT, D.DOSSIERS);

/** Up to 3 sources of a dossier, official NASA/JPL first, then scientific, then press (community sources are left out). The card shows them as links. */
const KINDS = { "oficial NASA/JPL": "official", "científica": "scientific", "prensa": "press" };
function sourcesOf(id) {
  const file = path.join(DOSSIERS, id, "dossier.json");
  if (!existsSync(file)) return [];
  const list = (JSON.parse(readFileSync(file, "utf8")).fuentes_nuevas ?? []).filter((f) => KINDS[f.tipo] && f.url.startsWith("http"));
  const order = Object.keys(KINDS);
  list.sort((a, b) => order.indexOf(a.tipo) - order.indexOf(b.tipo));
  const seen = new Set(); // one link per site: three « science.nasa.gov » in a row would say nothing
  return list
    .map((f) => ({ type: KINDS[f.tipo], host: new URL(f.url).hostname.replace("www.", ""), url: f.url }))
    .filter((f) => !seen.has(f.host) && seen.add(f.host))
    .slice(0, 3);
}

const routeFile = path.join(ROOT, `scripts/data/${mission}-route.json`);
if (!existsSync(routeFile)) throw new Error(`No route yet: run npm run story-route -- ${mission}`);
const route = JSON.parse(readFileSync(routeFile, "utf8"));
const marsBeats = D.BEATS.filter((b) => b.part === "mars");
if (route.length !== marsBeats.length) throw new Error(`The route has ${route.length} stops but there are ${marsBeats.length} Mars beats: run npm run story-route -- ${mission}`);

mkdirSync(path.join(OUT, "images"), { recursive: true });
mkdirSync(path.join(OUT, "audio"), { recursive: true });

let n = 0;
let stop = 0;
const beats = [];
for (const b of D.BEATS) {
  n++;
  const dest = path.join(OUT, "images", `${b.id}.jpg`);
  const src = D.sourceImage?.(b.id);
  if (src) {
    if (!existsSync(src)) throw new Error(`Missing illustration ${src}`);
    await sharp(src).resize({ width: 1040 }).jpeg({ quality: 80, mozjpeg: true }).toFile(dest);
  } else if (!existsSync(dest)) throw new Error(`Missing illustration ${dest}: run npm run story-images -- ${mission}`);
  const beat = {
    id: b.id, n, part: b.part, date: b.date, ...(b.place ? { place: b.place } : {}), title: b.title, summary: b.summary, narration: b.narration, facts: b.facts,
    sources: sourcesOf(b.id), image: `/models/${mission}/images/${b.id}.jpg`, imageRatio: "4 / 5", audio: `/models/${mission}/audio/${b.id}.mp3`,
  };
  if (b.part === "mars") {
    const r = route[stop++];
    beat.route = { x: r.x, z: r.z, ...(r.via ? { via: r.via } : {}) };
  }
  beats.push(beat);
}

const story = {
  version: 1,
  mission,
  name: D.NAME,
  language: "en",
  title: D.TITLE,
  note: `Illustrations are AI-generated artwork based on the verified events; every fact and its source come from the research dossiers. Narration is written for short, clear audio (~50 words).`,
  closing: D.CLOSING,
  stationary: Boolean(D.STATIONARY), // the vehicle never moves (InSight, Beagle 2): in the 3D, Space goes to the next moment instead of driving
  parts: D.PARTS.map((p) => ({ ...p, beats: beats.filter((b) => b.part === p.id).map((b) => b.id) })),
  beats,
};
writeFileSync(path.join(OUT, "story.json"), JSON.stringify(story, null, 2) + "\n");
const words = beats.map((b) => b.narration.split(/\s+/).length);
console.log(`${mission}: ${beats.length} beats → public/models/${mission}/story.json (narration ${Math.min(...words)}–${Math.max(...words)} words, ${words.reduce((a, b) => a + b, 0)} total)`);
