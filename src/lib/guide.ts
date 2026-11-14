import { game, input } from "./game";
import type { Checkpoint } from "./checkpoints";
import { checkpointLineText, guideAudio, STATIC_LINES, type GuideKind, type GuideLine } from "./guide-lines";
import { getNarration } from "./narration";

/**
 * Voice guide ("mission control"): short pre-recorded hints (public/guide/*.mp3, lines in lib/guide-lines.ts) played while
 * the vehicle follows its route. There is no steering any more, so it only reports progress along the route:
 * how far the next checkpoint is, what comes next after leaving one, and a nudge when the player stops for a while.
 * It is deliberately sparse:
 *  - one voice at a time, never while a checkpoint narration plays or while the vehicle is inside a checkpoint;
 *  - 6 s of silence after any line, plus a cooldown per category and variants that do not repeat back to back;
 *  - nothing is said before the first key press / click (browsers need a user gesture to play audio);
 *  - silent during an autopilot trip started from the timeline.
 * `updateGuide()` runs every frame from <Guide/> but only evaluates ~5 times per second.
 */

const PREF_KEY = "poc-guide";
const QUIET = 6; // seconds of silence after a line
const TICK = 0.2; // seconds between evaluations

export type GuideState = { enabled: boolean; caption: string | null };

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

let state: GuideState = { enabled: typeof window === "undefined" ? true : readPref(), caption: null };
const listeners = new Set<() => void>();
function set(patch: Partial<GuideState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
export const subscribeGuide = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const getGuide = () => state;

// ---------- per-expedition engine state ----------
const now = () => performance.now() / 1000;
const BANDS = () => ({ far: false, half: false, close: false, near: false });

let interactedGlobal = false;
let listening = false;

function fresh() {
  const t = now();
  return {
    interacted: interactedGlobal,
    interactedAt: t,
    queue: [] as GuideLine[],
    current: null as HTMLAudioElement | null,
    endedAt: 0,
    quietUntil: 0,
    cooldown: {} as Record<string, number>,
    recent: {} as Record<string, string[]>,
    targetId: null as string | null, // first unvisited checkpoint, in list order
    d0: 0, // route distance to the target when it became the target
    bands: BANDS(),
    idleSince: t,
    lastTick: 0,
    prevActive: null as string | null,
    enteredAt: 0,
    leftAt: 0,
    readyDone: false,
    after: null as { from: number } | null, // pending "progress + next target" sequence after leaving checkpoint #from
  };
}
let S = fresh();

function attachListeners() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  const mark = () => {
    if (interactedGlobal) return;
    interactedGlobal = true;
    S.interacted = true;
    S.interactedAt = now();
  };
  window.addEventListener("keydown", mark, true);
  window.addEventListener("pointerdown", mark, true);
}

/** Call when an expedition (re)starts. */
export function resetGuide() {
  stopGuide();
  S = fresh();
  attachListeners();
}

// ---------- playback ----------
const clips = new Map<string, HTMLAudioElement>();

function speak(line: GuideLine) {
  if (!state.enabled) return;
  let a = clips.get(line.id);
  if (!a) {
    a = new Audio(guideAudio(line.id));
    clips.set(line.id, a);
  }
  S.current = a;
  a.volume = 0.9;
  a.currentTime = 0;
  const end = () => {
    if (S.current !== a) return;
    S.current = null;
    S.endedAt = now();
    S.quietUntil = S.endedAt + (S.queue.length ? 0 : QUIET);
    set({ caption: null });
  };
  a.onplaying = () => {
    if (S.current === a) set({ caption: line.text });
  };
  a.onended = end;
  a.onerror = end;
  a.play().catch(end);
}

export function stopGuide() {
  S.queue = [];
  const a = S.current;
  S.current = null;
  if (a) a.pause();
  if (state.caption !== null) set({ caption: null });
}

/** Key G: guide on/off. */
export function toggleGuide() {
  const enabled = !state.enabled;
  try {
    localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
  } catch {}
  set({ enabled });
  if (!enabled) stopGuide();
}

// ---------- choosing lines ----------
function pick(kind: GuideKind): GuideLine | null {
  const pool = STATIC_LINES.filter((l) => l.kind === kind && (!l.vehicle || l.vehicle === game.mission));
  if (!pool.length) return null;
  const recent = (S.recent[kind] ??= []);
  const fresh = pool.filter((l) => !recent.includes(l.id));
  const options = fresh.length ? fresh : pool;
  const choice = options[Math.floor(Math.random() * options.length)];
  recent.push(choice.id);
  if (recent.length > Math.min(3, pool.length - 1)) recent.shift();
  return choice;
}

// demo checkpoints have no recorded guide lines: say nothing about them
const cpLine = (kind: "next" | "remind", cp: Checkpoint): GuideLine | null =>
  cp.demo ? null : { id: `${kind}-${cp.id}`, kind, text: checkpointLineText(kind, cp.name), cp: cp.id };

const say = (line: GuideLine | null) => {
  if (line) speak(line);
};
const enqueue = (...lines: (GuideLine | null)[]) => {
  S.queue.push(...lines.filter((l): l is GuideLine => !!l));
};
const cool = (kind: string, seconds: number) => {
  const t = now();
  if (t < (S.cooldown[kind] ?? 0)) return false;
  S.cooldown[kind] = t + seconds;
  return true;
};

// ---------- the director ----------
export function updateGuide() {
  const t = now();
  if (t - S.lastTick < TICK) return;
  S.lastTick = t;
  const route = game.route;
  const cps = game.checkpoints;
  if (!game.terrain || !route || cps.length === 0) return;

  const moving = Math.abs(game.speed) > 1.5;
  if (moving || input.go || game.travel !== null) S.idleSince = t;

  // entering / leaving a checkpoint
  if (game.active !== S.prevActive) {
    if (game.active) {
      stopGuide();
      S.after = null;
      S.readyDone = false;
      S.enteredAt = t;
    } else if (S.prevActive) {
      S.leftAt = t;
      S.after = { from: cps.findIndex((c) => c.id === S.prevActive) };
    }
    S.prevActive = game.active;
  }

  // current target = first unvisited checkpoint, in list order; distance = along the route
  const targetIdx = cps.findIndex((c) => !game.visited.has(c.id));
  const target = targetIdx >= 0 ? cps[targetIdx] : null;
  const dist = () => (target ? Math.abs(route.stops[targetIdx] - game.s) : 0);
  if ((target?.id ?? null) !== S.targetId) {
    S.targetId = target?.id ?? null;
    S.d0 = dist();
    S.bands = BANDS();
  }

  if (!state.enabled || !S.interacted || game.travel !== null) return;
  const narration = getNarration();
  const busy = S.current !== null || narration.status === "playing" || narration.status === "loading";

  // inside a checkpoint: only a gentle nudge, once, after the narration is over and the player has been still for a while
  if (game.active) {
    if (!busy && !S.readyDone && !moving && t - S.idleSince > 10 && t - S.enteredAt > 6) {
      S.readyDone = true;
      say(target ? pick("ready") : pick("done"));
    }
    return;
  }
  if (busy) return;

  // queued lines (progress + next target) play back to back
  if (S.queue.length) {
    if (t - S.endedAt > 0.5) speak(S.queue.shift()!);
    return;
  }

  // after leaving a checkpoint: progress (or completion) + next target. Leaving the start only announces the next target.
  if (S.after) {
    if (t - S.leftAt > 2.5) {
      const remaining = cps.filter((c) => !game.visited.has(c.id));
      if (remaining.length === 0) enqueue(pick("done"));
      else enqueue(S.after.from === 0 ? null : pick(remaining.length === 1 ? "prog-1" : "prog-many"), cpLine("next", remaining[0]));
      S.after = null;
    }
    return;
  }

  if (t < S.quietUntil) return;
  if (!target) return;

  // how far along the way to the target (25 % / 50 % / 75 %, then "almost there")
  const r = game.checkpointRadius;
  const d = dist();
  if (moving && game.speed > 0) {
    const p = S.d0 > 0 ? 1 - d / S.d0 : 0;
    if (d < r * 3 && !S.bands.near) {
      S.bands = { far: true, half: true, close: true, near: true };
      return say(pick("dist-near"));
    }
    if (S.d0 > r * 8) {
      if (p > 0.75 && !S.bands.close) {
        S.bands.far = S.bands.half = S.bands.close = true;
        return say(pick("dist-close"));
      }
      if (p > 0.5 && !S.bands.half) {
        S.bands.far = S.bands.half = true;
        return say(pick("dist-half"));
      }
      if (p > 0.25 && !S.bands.far) {
        S.bands.far = true;
        return say(pick("dist-far"));
      }
    }
  }

  // standing still between checkpoints
  if (!moving && t - S.idleSince > 12 && cool("idle", 30)) {
    return say(Math.random() < 0.5 ? cpLine("remind", target) : pick("idle"));
  }
}
