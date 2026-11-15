import { game } from "./game";
import type { Checkpoint } from "./checkpoints";
import { phraseAt, phraseStarts, phrases, type Phrase } from "./transcript";

/**
 * Checkpoint narration: plays the pre-recorded clips of the story (public/models/<mission>/audio, generated once with `npm run story-audio -- <mission>`).
 * No network calls to ElevenLabs happen at runtime. Small external store so the DOM (card, hints) can subscribe with
 * useSyncExternalStore while the 3D scene calls play/stop without going through React.
 *
 * Transcript: while a clip plays, `caption` holds the phrase being spoken (lib/transcript.ts shares the clip's duration among the phrases).
 */

export type NarrationStatus = "idle" | "loading" | "playing" | "error";
export type NarrationState = {
  enabled: boolean; // automatic narration on arrival (key N)
  status: NarrationStatus;
  id: string | null; // checkpoint being narrated / loaded
  error: string | null; // user-facing message
  caption: string; // phrase being spoken right now ("" when silent)
};

const PREF_KEY = "poc-narration";

const MESSAGES = {
  missing: "Audio file missing",
  blocked: "Browser blocked audio: press Listen",
  failed: "Could not play audio",
};

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

let state: NarrationState = { enabled: typeof window === "undefined" ? true : readPref(), status: "idle", id: null, error: null, caption: "" };
const listeners = new Set<() => void>();
function set(patch: Partial<NarrationState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
export const subscribeNarration = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const getNarration = () => state;

// ---- clips: one <audio> per checkpoint, created (and preloaded) on first use ----
const clips = new Map<string, HTMLAudioElement>();
const cuts = new Map<string, { ps: Phrase[]; starts: number[]; duration: number }>();
let raf = 0;
let current: HTMLAudioElement | null = null;
let token = 0; // invalidates in-flight plays when something newer starts or stops

// Each mp3 is downloaded ONCE into memory (a Blob) and played from there. An <audio> that streams a file from the server and then sits idle gets its buffer
// dropped by the browser: coming back to a clip after a while (or the first play of a clip that was only "preloaded") re-requested it, and the narrator stayed
// silent in the "loading" state for seconds. From a Blob there is no network at play time.
const urls = new Map<string, string>(); // clip id → object URL (once downloaded)
const loads = new Map<string, Promise<string | null>>();

/** Download a clip into memory. Resolves with its object URL, or null if it could not be fetched (the play then falls back to the file URL and reports the error). */
export function loadNarration(cp: Checkpoint): Promise<string | null> {
  let p = loads.get(cp.id);
  if (!p) {
    p = fetch(cp.audio)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => {
        const url = URL.createObjectURL(b);
        urls.set(cp.id, url);
        return url;
      })
      .catch(() => null);
    loads.set(cp.id, p);
  }
  return p;
}

function clip(cp: Checkpoint) {
  let a = clips.get(cp.id);
  if (!a) {
    a = new Audio(urls.get(cp.id) ?? cp.audio);
    a.preload = "auto";
    a.addEventListener("ended", () => {
      if (state.id === cp.id && state.status === "playing") set({ status: "idle", caption: "" });
    });
    clips.set(cp.id, a);
  }
  return a;
}

/** Phrase timeline of a clip (rebuilt when its real duration becomes known). */
function timeline(cp: Checkpoint, duration: number) {
  const c = cuts.get(cp.id);
  if (c && c.duration === duration) return c;
  const ps = c?.ps ?? phrases(cp.narration);
  const next = { ps, starts: phraseStarts(ps, duration), duration };
  cuts.set(cp.id, next);
  return next;
}

/** While a clip plays, keep `caption` on the phrase being spoken (updates only when it changes). */
function followCaption(cp: Checkpoint, a: HTMLAudioElement, mine: number) {
  cancelAnimationFrame(raf);
  const tick = () => {
    if (mine !== token || a.paused) return;
    raf = requestAnimationFrame(tick);
    if (!Number.isFinite(a.duration)) return;
    const { ps, starts } = timeline(cp, a.duration);
    const k = phraseAt(starts, a.currentTime);
    const text = k >= 0 ? ps[k].text : "";
    if (text !== state.caption) set({ caption: text });
  };
  raf = requestAnimationFrame(tick);
}

/** Download the clips into memory so the narration begins instantly on arrival. Resolves when all of them are in (or failed); `onEach` fires after every clip. */
export function preloadNarration(cps: Checkpoint[], onEach?: () => void): Promise<void> {
  return Promise.all(cps.map((cp) => loadNarration(cp).then(() => onEach?.()))).then(() => undefined);
}

/** Narrate a checkpoint. `force` ignores the automatic on/off switch (used by the card's button). */
export async function playNarration(cp: Checkpoint, force = false) {
  if (!force && !state.enabled) return;
  const mine = ++token;
  current?.pause();
  set({ id: cp.id, status: urls.has(cp.id) ? "idle" : "loading", error: null, caption: "" });
  await loadNarration(cp); // instant when it is already in memory
  if (mine !== token) return; // something newer started (or it was stopped) while it downloaded
  const a = clip(cp);
  current = a;
  a.currentTime = 0;
  try {
    await a.play();
    if (mine === token) {
      set({ status: "playing" });
      followCaption(cp, a, mine);
    }
  } catch (e) {
    if (mine !== token) return; // superseded or stopped: not an error
    const name = e instanceof DOMException ? e.name : "";
    set({
      status: "error",
      error: name === "NotAllowedError" ? MESSAGES.blocked : name === "NotSupportedError" || a.error ? MESSAGES.missing : MESSAGES.failed,
    });
  }
}

export function stopNarration() {
  token++;
  cancelAnimationFrame(raf);
  current?.pause();
  current = null;
  if (state.status !== "idle" || state.id !== null || state.error !== null || state.caption) set({ status: "idle", id: null, error: null, caption: "" });
}

/** Key N: turn automatic narration on/off. Takes effect immediately if the rover is inside a checkpoint. */
export function toggleNarration() {
  const enabled = !state.enabled;
  try {
    localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
  } catch {}
  set({ enabled });
  if (!enabled) stopNarration();
  else {
    const cp = game.checkpoints.find((c) => c.id === game.active);
    if (cp) void playNarration(cp);
  }
}
