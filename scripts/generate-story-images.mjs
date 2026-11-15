#!/usr/bin/env node
/**
 * Generates the illustrations of a mission's story with Google's Nano Banana 2.1 on Replicate (https://replicate.com/google/nano-banana-2.1), one image per
 * event, from the prompts in scripts/data/<mission>-image-prompts.mjs (written from each dossier in misiones/<mission>/dossiers/).
 *
 *   npm run story-images -- ingenuity                    generate what is missing
 *   npm run story-images -- ingenuity --dry-run          print the prompts and the plan, call nothing
 *   npm run story-images -- ingenuity --only ing001,ing010
 *   npm run story-images -- ingenuity --force            regenerate everything
 *   flags: --resolution 1K|2K|4K (default 2K, like the Opportunity set) · --aspect 4:5 · --concurrency 3
 *
 * The API key is read from REPLICATE_API_KEY (.env.local or the shell) and is never printed. Every image is saved twice:
 *   ~/Downloads/images/<mission>/<id>.jpg                 the original (full size, NOT in the repo, like the Opportunity set)
 *   public/models/<mission>/images/<id>.jpg         resized to 1040 px wide for the web (what the app will load)
 * plus public/models/<mission>/images/manifest.json (prompt, model, prediction id and date of each image).
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { loadEnv, ROOT } from "./lib/tts.mjs";

loadEnv();
const argv = process.argv.slice(2);
const mission = argv.find((a) => !a.startsWith("--") && argv[argv.indexOf(a) - 1]?.startsWith("--") === false) ?? argv[0];
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : d;
};
const flag = (n) => argv.includes(`--${n}`);
if (!mission || mission.startsWith("--")) {
  console.error("Usage: node scripts/generate-story-images.mjs <mission> [--dry-run] [--only id,id] [--force] [--resolution 2K] [--aspect 4:5] [--concurrency 3]");
  process.exit(1);
}

const MODEL = "google/nano-banana-2.1";
const RESOLUTION = opt("resolution", "2K");
const ASPECT = opt("aspect", "4:5");
const CONCURRENCY = Number(opt("concurrency", 3));
const ONLY = opt("only")?.split(",").map((s) => s.trim()).filter(Boolean);
const RAW_DIR = path.join(os.homedir(), "Downloads/images", mission);
const OUT_DIR = path.join(ROOT, "public/models", mission, "images");
const MANIFEST = path.join(OUT_DIR, "manifest.json");

const { STYLE, ENDING, PROMPTS } = await import(pathToFileURL(path.join(ROOT, `scripts/data/${mission}-image-prompts.mjs`)).href);
const full = (p) => `${STYLE}\n\nScene: ${p.scene}\n\nComposition: ${p.composition} ${ENDING}`;
const items = PROMPTS.filter((p) => !ONLY || ONLY.includes(p.id));
const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, "utf8")) : { model: MODEL, images: {} };
const todo = items.filter((p) => flag("force") || !existsSync(path.join(OUT_DIR, `${p.id}.jpg`)));

console.log(`${mission} · ${MODEL} · ${RESOLUTION} · ${ASPECT} — ${todo.length} to generate, ${items.length - todo.length} already done`);
if (flag("dry-run")) {
  for (const p of todo) console.log(`\n── ${p.id}: ${p.title}\n${full(p)}`);
  process.exit(0);
}
const KEY = process.env.REPLICATE_API_KEY;
if (!KEY) {
  console.error("REPLICATE_API_KEY is not set (put it in .env.local).");
  process.exit(1);
}

const api = (url, init = {}) => fetch(url, { ...init, headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...init.headers } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Run one prediction to the end and return { url, id }. Retries rate limits; throws on a failed prediction. */
async function predict(prompt) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await api(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
      method: "POST",
      headers: { Prefer: "wait=60" },
      body: JSON.stringify({ input: { prompt, aspect_ratio: ASPECT, resolution: RESOLUTION, output_format: "jpg" } }),
    });
    if (res.status === 429) {
      const wait = (Number((await res.json().catch(() => ({}))).retry_after) || 8) * 1000;
      await sleep(wait + 500);
      continue;
    }
    if (!res.ok) throw new Error(`Replicate ${res.status}: ${(await res.text()).slice(0, 300)}`);
    let pred = await res.json();
    while (pred.status === "starting" || pred.status === "processing") {
      await sleep(2500);
      pred = await (await api(pred.urls.get)).json();
    }
    if (pred.status !== "succeeded") throw new Error(`prediction ${pred.status}: ${String(pred.error ?? "").slice(0, 300)}`);
    const out = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    return { url: out, id: pred.id };
  }
  throw new Error("rate limited too many times");
}

async function one(p, k) {
  const t0 = Date.now();
  const { url, id } = await predict(full(p));
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  await mkdir(RAW_DIR, { recursive: true });
  await writeFile(path.join(RAW_DIR, `${p.id}.jpg`), buf);
  const meta = await sharp(buf).metadata();
  await sharp(buf).resize({ width: 1040 }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(OUT_DIR, `${p.id}.jpg`));
  manifest.images[p.id] = { title: p.title, prompt: full(p), prediction: id, resolution: RESOLUTION, aspect: ASPECT, size: `${meta.width}x${meta.height}`, generatedAt: new Date().toISOString() };
  await writeFile(`${MANIFEST}.tmp`, JSON.stringify(manifest, null, 2) + "\n");
  await rename(`${MANIFEST}.tmp`, MANIFEST);
  console.log(`[${k + 1}/${todo.length}] ${p.id} ok (${meta.width}x${meta.height}, ${Math.round((Date.now() - t0) / 1000)} s) — ${p.title}`);
}

await mkdir(OUT_DIR, { recursive: true });
let next = 0;
let failed = 0;
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, todo.length) }, async () => {
    while (next < todo.length) {
      const k = next++;
      try {
        await one(todo[k], k);
      } catch (e) {
        failed++;
        console.error(`[${k + 1}/${todo.length}] ${todo[k].id} FAILED: ${e.message}`);
      }
    }
  }),
);
console.log(failed ? `Done with ${failed} failed (run again: only the missing ones are generated).` : "Done.");
process.exit(failed ? 1 : 0);
