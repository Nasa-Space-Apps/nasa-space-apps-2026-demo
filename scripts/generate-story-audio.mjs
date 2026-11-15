#!/usr/bin/env node
/**
 * Pre-records the narration of the Opportunity story (public/models/opportunity/audio/<id>.mp3 + manifest.json), one clip per beat of
 * public/models/opportunity/story.json (build it first with scripts/build-opportunity-story.mjs). Same voice, model and flags as `npm run narration`;
 * only new or changed clips are recorded.
 *
 *   npm run story-audio                       record what is missing / outdated (spends credits only on that)
 *   npm run story-audio -- --dry-run          show the plan and the character count, call nothing
 *   npm run story-audio -- --only opp021      just these beats
 *   npm run story-audio -- --force            re-record everything
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { generateSet, ROOT } from "./lib/tts.mjs";

const story = JSON.parse(readFileSync(path.join(ROOT, "public/models/opportunity/story.json"), "utf8"));

process.exit(
  await generateSet({
    title: "Opportunity story",
    items: story.beats.map((b) => ({ id: b.id, text: b.narration, file: b.audio })),
    manifest: "public/models/opportunity/audio/manifest.json",
    // the narrator of the other checkpoints: Bill, a mature, measured premade voice (documentary pace), on ElevenLabs' most expressive model
    defaults: { voiceId: "pqHfZKP75CvOlQylNhV4", voiceName: "Bill", modelId: "eleven_v4", format: "mp3_44100_128" },
    envPrefix: "ELEVENLABS_",
    argv: process.argv.slice(2),
  }),
);
