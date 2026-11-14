/**
 * Shared ElevenLabs text-to-speech batch generator used by generate-narration.mjs and generate-guide.mjs.
 *
 * Records every item once and stores the audio in public/ plus a manifest.json with the metadata of each clip
 * (voice, model, format, hash of text+voice+model+format, size, date). Only new or changed clips are generated
 * (unless --force), so credits are spent once per clip. The API key is read from ELEVENLABS_API_KEY
 * (.env.local or the shell) and is never printed.
 *
 * Flags: --dry-run · --force · --only id,id · --voice <id> · --name <label> · --model <id>
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PUBLIC_DIR = path.join(ROOT, "public");

export function loadEnv() {
  try {
    process.loadEnvFile(path.join(ROOT, ".env.local"));
  } catch {} // fine if the key comes from the shell
}

/**
 * @param {object} cfg
 * @param {string} cfg.title                     label for the log
 * @param {{id: string, text: string, file: string}[]} cfg.items   file = public-relative URL, e.g. "/guide/x.mp3"
 * @param {string} cfg.manifest                  manifest path relative to the repo root
 * @param {{voiceId: string, voiceName: string, modelId: string, format: string}} cfg.defaults
 * @param {string} cfg.envPrefix                 "ELEVENLABS_" → ELEVENLABS_VOICE_ID / _VOICE_NAME / _MODEL_ID
 * @param {string[]} cfg.argv
 */
export async function generateSet(cfg) {
  loadEnv();
  const { argv, items, defaults, envPrefix } = cfg;
  const flag = (n) => argv.includes(`--${n}`);
  const opt = (n) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const VOICE_ID = opt("voice") || process.env[`${envPrefix}VOICE_ID`] || defaults.voiceId;
  const VOICE_NAME = opt("name") || process.env[`${envPrefix}VOICE_NAME`] || (VOICE_ID === defaults.voiceId ? defaults.voiceName : VOICE_ID);
  const MODEL_ID = opt("model") || process.env[`${envPrefix}MODEL_ID`] || defaults.modelId;
  const FORMAT = defaults.format;
  const ONLY = opt("only")?.split(",").map((s) => s.trim()).filter(Boolean);
  const manifestPath = path.join(ROOT, cfg.manifest);

  const hashOf = (it) => createHash("sha256").update(JSON.stringify([it.text, VOICE_ID, MODEL_ID, FORMAT])).digest("hex").slice(0, 16);
  const fileOf = (it) => path.join(PUBLIC_DIR, it.file);

  let manifest = { clips: {} };
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {}

  if (ONLY) {
    const unknown = ONLY.filter((id) => !items.some((c) => c.id === id));
    if (unknown.length) {
      console.error(`Unknown id(s): ${unknown.join(", ")}.`);
      process.exit(1);
    }
  }
  const targets = items.filter((c) => !ONLY || ONLY.includes(c.id));

  const plan = targets.map((it) => {
    const prev = manifest.clips?.[it.id];
    const missing = !prev || !existsSync(fileOf(it));
    const changed = !missing && prev.hash !== hashOf(it);
    return { it, todo: flag("force") || missing || changed, why: missing ? "new" : changed ? "changed" : "up to date" };
  });

  console.log(`${cfg.title} — voice: ${VOICE_NAME} (${VOICE_ID}) · model: ${MODEL_ID} · ${FORMAT}`);
  const verbose = plan.length <= 12 || flag("dry-run");
  for (const { it, todo, why } of plan) {
    if (!verbose && !todo) continue;
    console.log(`  ${todo ? "•" : "✓"} ${it.id.padEnd(26)} ${String(it.text.length).padStart(4)} chars  ${flag("force") && why === "up to date" ? "forced" : why}`);
  }
  const pending = plan.filter((p) => p.todo);
  const chars = pending.reduce((s, p) => s + p.it.text.length, 0);
  console.log(`\n${plan.length - pending.length} up to date · ${pending.length} to generate (${chars} characters).`);
  if (flag("dry-run") || pending.length === 0) return 0;

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    console.error("\nMissing ELEVENLABS_API_KEY (put it in .env.local).");
    return 1;
  }

  async function synthesize(text) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(VOICE_ID)}?output_format=${FORMAT}`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: MODEL_ID }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) {
      let detail = (await res.text().catch(() => "")).slice(0, 300);
      try {
        const d = JSON.parse(detail).detail;
        detail = typeof d === "string" ? d : (d?.message ?? d?.status ?? detail);
      } catch {}
      throw new Error(`ElevenLabs ${res.status}: ${detail}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) throw new Error("empty audio");
    return { buf, cost: res.headers.get("character-cost") };
  }

  await mkdir(path.dirname(manifestPath), { recursive: true });
  let failed = 0;
  let credits = 0;
  let n = 0;
  for (const { it } of pending) {
    n++;
    process.stdout.write(`[${n}/${pending.length}] ${it.id}… `);
    try {
      const { buf, cost } = await synthesize(it.text);
      const file = fileOf(it);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(`${file}.tmp`, buf);
      await rename(`${file}.tmp`, file);
      manifest.clips[it.id] = {
        file: it.file,
        voiceId: VOICE_ID,
        voiceName: VOICE_NAME,
        model: MODEL_ID,
        format: FORMAT,
        hash: hashOf(it),
        chars: it.text.length,
        bytes: buf.length,
        generatedAt: new Date().toISOString(),
      };
      manifest.updatedAt = new Date().toISOString();
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n"); // saved after every clip: a failure keeps the progress
      credits += Number(cost) || 0;
      console.log(`ok (${(buf.length / 1024).toFixed(0)} KB${cost ? `, ${cost} credits` : ""})`);
    } catch (e) {
      failed++;
      console.log(`FAILED — ${e instanceof Error ? e.message : e}`);
      if (/ 401|quota/i.test(String(e))) {
        console.log("Stopping: authentication or quota problem.");
        break;
      }
    }
  }
  console.log(failed ? `\n${failed} clip(s) failed; run again to retry only those.` : `\nDone (${credits} credits). Commit the generated audio to keep it.`);
  return failed ? 1 : 0;
}
