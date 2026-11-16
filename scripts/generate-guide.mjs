#!/usr/bin/env node
/**
 * Pre-records the "mission control" guidance lines (public/guide/<id>.mp3 + manifest.json) and keeps the phrase catalog
 * in docs/guide.md up to date. The lines live in src/lib/guide-lines.ts. See scripts/lib/tts.mjs for the flags.
 *
 *   npm run guide                           generate what is missing / outdated
 *   npm run guide -- --dry-run              show the plan and the character count, call nothing
 *   npm run guide -- --docs                 rewrite the phrase catalog inside docs/guide.md (no API calls)
 *   npm run guide -- --force | --only id,id | --voice <id> --name "<label>" --model <id>
 *
 * Env (optional): ELEVENLABS_GUIDE_VOICE_ID, ELEVENLABS_GUIDE_VOICE_NAME, ELEVENLABS_GUIDE_MODEL_ID.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { generateSet, ROOT } from "./lib/tts.mjs";

const href = (rel) => pathToFileURL(path.join(ROOT, rel)).href;
const { STATIC_LINES, guideAudio } = await import(href("src/lib/guide-lines.ts"));
const lines = STATIC_LINES;

const argv = process.argv.slice(2);

if (argv.includes("--docs")) {
  const KIND_TITLES = [
    ["dist-far", "Distance: 25 % of the way"],
    ["dist-half", "Distance: 50 % of the way"],
    ["dist-close", "Distance: 75 % of the way"],
    ["dist-near", "Distance: very close (< 3 radii)"],
    ["prog-1", "Progress: one left"],
    ["prog-many", "Progress: several left"],
    ["done", "Expedition complete"],
    ["idle", "Stopped between checkpoints"],
    ["ready", "Stopped inside a checkpoint, after the narration"],
  ];
  const NAMES = { opportunity: "Opportunity (Mars)" };
  const tag = (l) => NAMES[l.vehicle] ?? "all";
  const count = (kind, v) => lines.filter((l) => l.kind === kind && (v === "generic" ? !l.vehicle : l.vehicle === v)).length;
  let md = `Total: **${lines.length} phrases** (${lines.filter((l) => !l.vehicle).length} generic, ${lines.filter((l) => l.vehicle === "opportunity").length} Opportunity only).\n`;
  md += "\n#### Summary: phrases available per category\n\n| Category | Generic | Opportunity only | Opportunity pool |\n| --- | --: | --: | --: |\n";
  for (const [kind] of KIND_TITLES) {
    const g = count(kind, "generic");
    const o = count(kind, "opportunity");
    if (g + o) md += `| \`${kind}\` | ${g} | ${o} | ${g + o} |\n`;
  }
  for (const [kind, title] of KIND_TITLES) {
    const group = lines.filter((l) => l.kind === kind);
    if (!group.length) continue;
    md += `\n#### ${title} — \`${kind}\` (${group.length})\n\n| id | Phrase | Vehicle |\n| --- | --- | --- |\n`;
    for (const l of group) md += `| \`${l.id}\` | ${l.text} | ${tag(l)} |\n`;
  }
  const file = path.join(ROOT, "docs/guide.md");
  let doc = await readFile(file, "utf8");
  const crlf = doc.includes("\r\n");
  doc = doc.replace(/\r\n/g, "\n");
  const a = "<!-- phrases:start -->";
  const b = "<!-- phrases:end -->";
  if (!doc.includes(a) || !doc.includes(b)) throw new Error("docs/guide.md has no phrase markers");
  doc = doc.slice(0, doc.indexOf(a) + a.length) + "\n" + md + doc.slice(doc.indexOf(b));
  await writeFile(file, crlf ? doc.replace(/\n/g, "\r\n") : doc);
  console.log(`docs/guide.md updated (${lines.length} phrases).`);
  process.exit(0);
}

process.exit(
  await generateSet({
    title: "Guide",
    items: lines.map((l) => ({ id: l.id, text: l.text, file: guideAudio(l.id) })),
    manifest: "public/guide/manifest.json",
    // Daniel: steady, broadcaster-style premade voice ("mission control"), distinct from the story narrator (Bill).
    // Flash v2.5: fast and half the price per character, plenty for short spoken hints.
    defaults: { voiceId: "onwK4e9ZLuTAKqWW03F9", voiceName: "Daniel", modelId: "eleven_flash_v2_5", format: "mp3_44100_64" },
    envPrefix: "ELEVENLABS_GUIDE_",
    argv,
  }),
);
