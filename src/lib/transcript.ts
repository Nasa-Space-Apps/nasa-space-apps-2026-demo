/**
 * Transcript of a narration clip: the spoken script cut into short phrases, each with the time it starts.
 *
 * Only the audio comes from ElevenLabs; the timing is computed here: the clip's real duration (read from the <audio> element) is shared out
 * among the phrases by characters, with a longer pause weight after sentence and clause ends. It lands within about half a second of the
 * voice, which reads as perfectly synchronised. This is the documented recipe for any new narration: see docs/narration.md.
 */

export type Phrase = { text: string; start: number }; // start = character index in the script

const MAX = 105; // longest phrase shown at once (characters)

/** Cut at the comma / semicolon / dash closest to the middle, recursively, until every piece fits. */
function splitLong(text: string, start: number): Phrase[] {
  if (text.length <= MAX) return [{ text, start }];
  const mid = text.length / 2;
  let best = -1;
  for (const m of text.matchAll(/[,;:—–]\s+|\s+—\s+| (?:and|but|so|while|as|which|then) /g)) {
    const at = m.index + (/^[,;:—–]/.test(m[0]) ? 1 : 0);
    if (at > 18 && at < text.length - 18 && (best < 0 || Math.abs(at - mid) < Math.abs(best - mid))) best = at;
  }
  if (best < 0) {
    // no punctuation to cut at: break at the space closest to the middle
    for (let k = 0; k < text.length; k++) if (text[k] === " " && (best < 0 || Math.abs(k - mid) < Math.abs(best - mid))) best = k;
  }
  if (best < 0) return [{ text, start }];
  const a = text.slice(0, best);
  const b = text.slice(best);
  const lead = b.length - b.trimStart().length;
  return [...splitLong(a.trimEnd(), start), ...splitLong(b.trimStart(), start + best + lead)];
}

/** The script as phrases: sentences, split further when they are long. */
export function phrases(script: string): Phrase[] {
  const out: Phrase[] = [];
  for (const m of script.matchAll(/[^.!?…]+(?:[.!?…]+["')\]]*)?\s*/g)) {
    const raw = m[0];
    const text = raw.trim();
    if (!text) continue;
    const start = m.index + (raw.length - raw.trimStart().length);
    out.push(...splitLong(text, start));
  }
  return out;
}

/** Estimated start time of each phrase for a clip of `duration` seconds. */
function estimate(ps: Phrase[], duration: number) {
  const weight = (p: Phrase) => {
    const end = p.text.trimEnd().slice(-1);
    return p.text.length + (/[.!?…]/.test(end) ? 14 : /[,;:—–]/.test(end) ? 6 : 0);
  };
  const total = ps.reduce((s, p) => s + weight(p), 0) || 1;
  const lead = Math.min(0.25, duration * 0.02); // the clips open with a breath of silence
  let acc = 0;
  return ps.map((p) => {
    const t = lead + (acc / total) * (duration - lead);
    acc += weight(p);
    return t;
  });
}

/** Start time (seconds) of each phrase for a clip of `duration` seconds. */
export function phraseStarts(ps: Phrase[], duration: number): number[] {
  return estimate(ps, duration);
}

/** Index of the phrase being spoken at time `t` (-1 before the first). */
export function phraseAt(starts: number[], t: number) {
  let k = -1;
  for (let i = 0; i < starts.length && starts[i] <= t; i++) k = i;
  return k;
}
