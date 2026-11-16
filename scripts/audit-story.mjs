#!/usr/bin/env node
/**
 * Story audit: for every beat of every story (or one: `npm run story-audit -- spirit`) checks that each number in its date, summary and facts, and the month of its
 * date, appear in the beat's research dossier (misiones/<mission>/dossiers/<id>/dossier.json: context, verified facts and quotes). It prints only what does NOT
 * match, so an empty mission means a clean pass. Spelled-out numbers («two», «dos») are not checked: read those by hand. Findings of the audit: docs/audit.md.
 */
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const MISSIONS = { opportunity: "opportunity", ingenuity: "ingenuity", surveyor3: "surveyor3", spirit: "spirit", insight: "insight", beagle2: "beagle2" };
const only = process.argv[2];

const digits = (s) => s.replace(/[^\d]/g, "");
function dossierNumbers(m, id) {
  const f = `${ROOT}misiones/${m}/dossiers/${id}/dossier.json`;
  if (!fs.existsSync(f)) return null;
  const d = JSON.parse(fs.readFileSync(f, "utf8"));
  const text = [d.titulo, d.contexto_ampliado, ...(d.datos_reales ?? []).flatMap((x) => [x.afirmacion, x.cita]), ...(d.datos_no_verificados ?? []).map((x) => x.afirmacion ?? "")].join(" \n ");
  const set = new Set();
  for (const mt of text.matchAll(/\d+(?:[ .,'’]\d+)*/g)) {
    set.add(digits(mt[0]));
    for (const part of mt[0].split(/[ .,'’]/)) if (part) set.add(part);
  }
  return { set, text: text.toLowerCase() };
}
const MON = { jan: "ene enero january", feb: "feb febrero february", mar: "mar marzo march", apr: "abr abril april", may: "may mayo", jun: "jun junio june", jul: "jul julio july", aug: "ago agosto august", sep: "sep sept septiembre september", oct: "oct octubre october", nov: "nov noviembre november", dec: "dic diciembre december" };

for (const [m, folder] of Object.entries(MISSIONS)) {
  if (only && only !== m) continue;
  const story = JSON.parse(fs.readFileSync(`${ROOT}public/models/${folder}/story.json`, "utf8"));
  console.log(`\n===== ${m} (${story.beats.length} beats)`);
  for (const b of story.beats) {
    const dn = dossierNumbers(m, b.id);
    if (!dn) { console.log(`${b.id}: NO DOSSIER`); continue; }
    const claims = [b.date, b.summary, ...b.facts.map((f) => f[1])].join(" | ");
    const miss = [];
    for (const mt of claims.matchAll(/\d+(?:[ .,]\d+)*/g)) {
      const raw = mt[0].replace(/,(?=\d{3}\b)/g, "");
      const tokens = [digits(raw), ...raw.split(/[ .,]/).filter(Boolean)];
      if (!tokens.some((t) => dn.set.has(t))) miss.push(mt[0]);
    }
    // month names of the date
    const mm = /^[A-Za-z]{3}/.exec(b.date)?.[0]?.toLowerCase();
    const monthOk = !mm || !MON[mm] || MON[mm].split(" ").some((w) => dn.text.includes(w));
    if (miss.length || !monthOk) console.log(`${b.id} ${b.date} «${b.title}»: numbers not in the dossier: [${miss.join(", ")}]${monthOk ? "" : "  MONTH?"}`);
  }
}
