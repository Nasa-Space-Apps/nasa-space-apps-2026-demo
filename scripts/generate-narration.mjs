#!/usr/bin/env node
/**
 * Pre-records the checkpoint narrations (public/narration/<id>.mp3 + manifest.json). See scripts/lib/tts.mjs for the flags.
 *
 *   npm run narration                       generate what is missing / outdated
 *   npm run narration -- --dry-run          show the plan and the character count, call nothing
 *   npm run narration -- --force            regenerate everything
 *   npm run narration -- --only eagle,cone  just these checkpoints
 *   npm run narration -- --voice <id> --name "<label>" --model <id>   override voice / model for this run
 *
 * Env (optional): ELEVENLABS_VOICE_ID, ELEVENLABS_VOICE_NAME, ELEVENLABS_MODEL_ID.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { generateSet, ROOT } from "./lib/tts.mjs";

const { ALL_CHECKPOINTS } = await import(pathToFileURL(path.join(ROOT, "src/lib/checkpoints.ts")).href);

process.exit(
  await generateSet({
    title: "Narration",
    items: ALL_CHECKPOINTS.map((cp) => ({ id: cp.id, text: cp.narration, file: cp.audio })),
    manifest: "public/narration/manifest.json",
    // Bill: mature, measured premade voice (a documentary pace). Model: ElevenLabs' most expressive one.
    defaults: { voiceId: "pqHfZKP75CvOlQylNhV4", voiceName: "Bill", modelId: "eleven_v4", format: "mp3_44100_128" },
    envPrefix: "ELEVENLABS_",
    argv: process.argv.slice(2),
  }),
);
