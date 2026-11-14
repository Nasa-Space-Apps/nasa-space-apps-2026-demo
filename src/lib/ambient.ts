import { AMBIENT_TRACKS, type AmbientTrack } from "./ambient-tracks";
import { getGuide } from "./guide";
import { getNarration } from "./narration";

/**
 * Background music: one quiet bed per place (/moon, /mars, the timeline scene), pre-recorded with `npm run ambient` (public/ambient).
 * No network calls to ElevenLabs happen at runtime.
 *  - Tries to start as soon as the page opens. If the browser refuses (autoplay policy: no user gesture yet and the site is not allowed to
 *    play sound), it waits and starts on the first click / tap / key press. The policy cannot be bypassed from code; see docs/ambient.md.
 *  - Loops with a crossfade (two <audio> per track overlap at the seam), so there is no gap or click however short the track is.
 *  - Changing place crossfades from the old bed to the new one; leaving every place fades out.
 *  - While a narration clip or a guide line is playing the bed ducks to DUCK of its level, and comes back slowly afterwards.
 * Small external store (`enabled`) so the DOM can show the on/off state; the audio itself runs on a timer, outside React.
 */

export type AmbientState = { enabled: boolean };
const PREF_KEY = "poc-ambient";

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

let state: AmbientState = { enabled: typeof window === "undefined" ? true : readPref() };
const listeners = new Set<() => void>();
export const subscribeAmbient = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const getAmbient = () => state;

const DUCK = 0.2; // level while someone speaks (× the bed's volume)
const HOLD = 0.7; // s to stay low after the voice stops, so short gaps between phrases don't pump the music
const FADE_IN = 2.2; // s time constants of the smoothing (exponential)
const FADE_OUT = 0.9;
const DUCK_DOWN = 0.35;
const DUCK_UP = 1.6;
const XFADE = 4; // s of overlap at the loop seam
const TICK = 50; // ms

type Deck = { el: HTMLAudioElement; on: boolean };
type Bed = { track: AmbientTrack; decks: [Deck, Deck]; lead: 0 | 1; level: number; failed: boolean };

const beds = new Map<string, Bed>();
let wanted: string | null = null;
let claim = 0; // bumped on every setAmbient: a pending release is void if someone claimed since (React strict mode re-runs effects)
let blocked = false; // the browser refused to play without a user gesture: wait for one
let timer = 0;
let duck = 1;
let speakingUntil = 0;
let last = 0;

function bed(id: string): Bed | null {
  let b = beds.get(id);
  if (!b) {
    const track = AMBIENT_TRACKS.find((t) => t.id === id);
    if (!track) return null;
    const made: Bed = { track, decks: [null as unknown as Deck, null as unknown as Deck], lead: 0, level: 0, failed: false };
    const mk = (): Deck => {
      const el = new Audio(track.file);
      el.preload = "auto";
      el.volume = 0;
      const d: Deck = { el, on: false };
      el.addEventListener("ended", () => {
        d.on = false;
      });
      el.addEventListener("error", () => {
        made.failed = true;
      });
      return d;
    };
    made.decks = [mk(), mk()];
    beds.set(id, made);
    b = made;
  }
  return b;
}

const sine = (x: number) => Math.sin((Math.min(1, Math.max(0, x)) * Math.PI) / 2); // equal-power fade shape

function play(d: Deck) {
  d.on = true;
  d.el.play().catch((e: unknown) => {
    d.on = false;
    if (e instanceof DOMException && e.name === "NotAllowedError") blocked = true; // autoplay policy: retry on the next user gesture
  });
}

function step(b: Bed, target: number, dt: number) {
  const k = 1 - Math.exp(-dt / (target > b.level ? FADE_IN : FADE_OUT));
  b.level += (target - b.level) * k;
  const [a0, a1] = b.decks;

  if (b.level <= 0.002 && target === 0) {
    b.level = 0;
    for (const d of b.decks) if (d.on && !d.el.paused) d.el.pause(); // silent: stop decoding (position is kept)
    return;
  }
  // (re)start: resume what was playing, or start the lead from the top
  if (!a0.on && !a1.on) play(b.decks[b.lead]);
  else for (const d of b.decks) if (d.on && d.el.paused && !d.el.ended) play(d);

  // loop seam: when the lead gets close to its end, start the other deck from 0 and make it the lead
  const lead = b.decks[b.lead];
  const dur = lead.el.duration;
  if (lead.on && Number.isFinite(dur) && dur > XFADE * 2 && dur - lead.el.currentTime <= XFADE) {
    const next = b.decks[b.lead === 0 ? 1 : 0];
    if (!next.on) {
      next.el.currentTime = 0;
      play(next);
      b.lead = b.lead === 0 ? 1 : 0;
    }
  }
  for (const d of b.decks) {
    if (!d.on) {
      d.el.volume = 0;
      continue;
    }
    const t = d.el.currentTime;
    const dd = d.el.duration;
    const fin = sine(t / XFADE);
    const fout = Number.isFinite(dd) && dd > XFADE * 2 ? sine((dd - t) / XFADE) : 1;
    d.el.volume = Math.min(1, Math.max(0, b.level * fin * fout));
  }
}

function tick() {
  const t = performance.now();
  const dt = Math.min(0.25, (t - last) / 1000);
  last = t;

  const speaking = getNarration().status === "playing" || getGuide().caption !== null;
  if (speaking) speakingUntil = t + HOLD * 1000;
  const duckTarget = t < speakingUntil ? DUCK : 1;
  duck += (duckTarget - duck) * (1 - Math.exp(-dt / (duckTarget < duck ? DUCK_DOWN : DUCK_UP)));

  let busy = false;
  for (const b of beds.values()) {
    const on = state.enabled && !blocked && wanted === b.track.id && !b.failed;
    step(b, on ? b.track.volume * duck : 0, dt);
    if (on || b.level > 0) busy = true;
  }
  if (!busy && !(state.enabled && !blocked && wanted)) {
    window.clearInterval(timer);
    timer = 0;
  }
}

function wake() {
  if (!timer && typeof window !== "undefined") {
    last = performance.now();
    timer = window.setInterval(tick, TICK);
  }
}

let listening = false;
function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  const unlock = () => {
    if (!blocked) return;
    blocked = false; // a real gesture: playing is allowed now
    if (wanted) wake();
  };
  for (const ev of ["pointerdown", "pointerup", "click", "keydown", "touchstart"]) window.addEventListener(ev, unlock, true);
}

/** The place the user is in: its bed fades in (the previous one fades out). Call `releaseAmbient` when leaving. */
export function setAmbient(id: AmbientTrack["id"]) {
  listen();
  wanted = id;
  claim++;
  bed(id); // start downloading now
  wake();
}

/** Leaving a place: fade out unless another place took over meanwhile. */
export function releaseAmbient(id: AmbientTrack["id"]) {
  const mine = claim;
  window.setTimeout(() => {
    if (wanted === id && claim === mine) wanted = null;
  }, 300);
}

/** Key S / the button: music on or off. */
export function toggleAmbient() {
  const enabled = !state.enabled;
  try {
    localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
  } catch {}
  state = { enabled };
  listeners.forEach((l) => l());
  wake();
}
