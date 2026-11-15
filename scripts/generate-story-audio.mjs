#!/usr/bin/env node
/**
 * Pre-records the narration of a mission's story (public/models/<mission>/audio/<id>.mp3 + manifest.json), one clip per beat of
 * public/models/<mission>/story.json (build it first with `npm run story -- <mission>`). Same voice, model and flags as `npm run narration`;
 * only new or changed clips are recorded.
 *
 *   npm run story-audio -- opportunity                      record what is missing / outdated (spends credits only on that)
 *   npm run story-audio -- ingenuity --dry-run              show the plan and the character count, call nothing
 *   npm run story-audio -- ingenuity --only ing021          just these beats
 *   npm run story-audio -- ingenuity --force                re-record everything
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { generateSet, ROOT } from "./lib/tts.mjs";

const argv = process.argv.slice(2);
const mission = argv[0];
if (!mission || mission.startsWith("--")) {
  console.error("Usage: node scripts/generate-story-audio.mjs <mission> [--dry-run] [--only id,id] [--force]");
  process.exit(1);
}
const story = JSON.parse(readFileSync(path.join(ROOT, `public/models/${mission}/story.json`), "utf8"));

process.exit(
  await generateSet({
    title: `${story.name} story`,
    items: story.beats.map((b) => ({ id: b.id, text: b.narration, file: b.audio })),
    manifest: `public/models/${mission}/audio/manifest.json`,
    // the narrator of the other checkpoints: Bill, a mature, measured premade voice (documentary pace), on ElevenLabs' most expressive model
    defaults: { voiceId: "pqHfZKP75CvOlQylNhV4", voiceName: "Bill", modelId: "eleven_v4", format: "mp3_44100_128" },
    envPrefix: "ELEVENLABS_",
    argv: argv.slice(1),
  }),
);
