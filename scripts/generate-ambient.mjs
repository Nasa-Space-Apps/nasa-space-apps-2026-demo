#!/usr/bin/env node
/**
 * Pre-records the background music beds (public/ambient/<id>.mp3 + manifest.json) with ElevenLabs Music (instrumental).
 * The tracks live in src/lib/ambient-tracks.ts. Only new or changed tracks are generated (unless --force). The app calls no API at runtime.
 *
 *   npm run ambient                    generate what is missing / outdated
 *   npm run ambient -- --dry-run       show the plan, call nothing
 *   npm run ambient -- --force | --only moon,mars
 *   npm run ambient -- --sfx           use Sound Effects v2 (loop: true, max 30 s) instead of Music
 *
 * The API key is read from ELEVENLABS_API_KEY (.env.local or the shell) and is never printed.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv, ROOT } from "./lib/tts.mjs";

loadEnv();
const { AMBIENT_TRACKS } = await import(pathToFileURL(path.join(ROOT, "src/lib/ambient-tracks.ts")).href);

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const SFX = flag("sfx");
const FORMAT = "mp3_44100_96";
const MODEL = SFX ? "eleven_text_to_sound_v2" : "music_v1";
const ONLY = opt("only")?.split(",").map((s) => s.trim()).filter(Boolean);
const manifestPath = path.join(ROOT, "public/ambient/manifest.json");
const lenOf = (t) => (SFX ? Math.min(30, t.seconds) : t.seconds);
const hashOf = (t) => createHash("sha256").update(JSON.stringify([t.prompt, lenOf(t), MODEL, FORMAT])).digest("hex").slice(0, 16);

let manifest = { tracks: {} };
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch {}

const targets = AMBIENT_TRACKS.filter((t) => !ONLY || ONLY.includes(t.id));
const plan = targets.map((t) => {
  const prev = manifest.tracks?.[t.id];
  const missing = !prev || !existsSync(path.join(ROOT, "public", t.file));
  const changed = !missing && prev.hash !== hashOf(t);
  return { t, todo: flag("force") || missing || changed, why: missing ? "new" : changed ? "changed" : "up to date" };
});
console.log(`Ambient — ${SFX ? "Sound Effects v2 (loop)" : "Music (instrumental)"} · ${MODEL} · ${FORMAT}`);
for (const { t, todo, why } of plan) console.log(`  ${todo ? "•" : "✓"} ${t.id.padEnd(10)} ${String(lenOf(t)).padStart(3)} s  ${flag("force") && why === "up to date" ? "forced" : why}`);
const pending = plan.filter((p) => p.todo);
console.log(`\n${plan.length - pending.length} up to date · ${pending.length} to generate (${pending.reduce((s, p) => s + lenOf(p.t), 0)} s of audio).`);
if (flag("dry-run") || !pending.length) process.exit(0);

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("\nMissing ELEVENLABS_API_KEY (put it in .env.local).");
  process.exit(1);
}

async function compose(t) {
  const url = SFX
    ? `https://api.elevenlabs.io/v1/sound-generation?output_format=${FORMAT}`
    : `https://api.elevenlabs.io/v1/music?output_format=${FORMAT}`;
  const body = SFX
    ? { text: t.prompt, duration_seconds: lenOf(t), loop: true, prompt_influence: 0.5, model_id: MODEL }
    : { prompt: t.prompt, music_length_ms: t.seconds * 1000, force_instrumental: true, model_id: MODEL };
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(300_000),
  });
  if (!res.ok) {
    let detail = (await res.text().catch(() => "")).slice(0, 400);
    try {
      const d = JSON.parse(detail).detail;
      detail = typeof d === "string" ? d : (d?.message ?? d?.status ?? detail);
    } catch {}
    throw new Error(`ElevenLabs ${res.status}: ${detail}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error("empty audio");
  return buf;
}

await mkdir(path.dirname(manifestPath), { recursive: true });
let failed = 0;
let n = 0;
for (const { t } of pending) {
  n++;
  process.stdout.write(`[${n}/${pending.length}] ${t.id}… `);
  try {
    const buf = await compose(t);
    const file = path.join(ROOT, "public", t.file);
    await writeFile(`${file}.tmp`, buf);
    await rename(`${file}.tmp`, file);
    manifest.tracks[t.id] = { file: t.file, kind: SFX ? "sound-effect-loop" : "music", model: MODEL, format: FORMAT, seconds: lenOf(t), hash: hashOf(t), bytes: buf.length, generatedAt: new Date().toISOString() };
    manifest.updatedAt = new Date().toISOString();
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`ok (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    failed++;
    console.log(`FAILED — ${e instanceof Error ? e.message : e}`);
    if (/ 401| 403|quota/i.test(String(e))) {
      console.log("Stopping: authentication, plan or quota problem.");
      break;
    }
  }
}
console.log(failed ? `\n${failed} track(s) failed; run again to retry only those.` : "\nDone. Commit the generated audio to keep it.");
process.exit(failed ? 1 : 0);
