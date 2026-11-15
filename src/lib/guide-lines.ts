/**
 * "Mission control" guidance lines: short spoken hints played along the route (see lib/guide.ts for WHEN each one is used).
 * Audio is pre-recorded with `npm run guide` into public/guide/<id>.mp3. No imports here on purpose: the generation
 * script loads this file directly with Node.
 */
export type GuideKind =
  | "dist-far"
  | "dist-half"
  | "dist-close"
  | "dist-near"
  | "prog-1"
  | "prog-many"
  | "done"
  | "idle"
  | "ready";

export type GuideLine = {
  id: string; // file name: public/guide/<id>.mp3
  kind: GuideKind;
  text: string; // spoken text, also shown as the on-screen caption
  vehicle?: "opportunity"; // only used in that expedition (no vehicle = generic)
};

export const guideAudio = (id: string) => `/guide/${id}.mp3`;

const L = (kind: GuideKind, id: string, text: string, vehicle?: GuideLine["vehicle"]): GuideLine => ({ id, kind, text, vehicle });

/** Generic lines + the ones that only Opportunity says. */
export const STATIC_LINES: GuideLine[] = [
  // ---- distance to the next checkpoint along the route: 25 % / 50 % / 75 % of the way, and very close ----
  L("dist-far", "dist-far-1", "You're making progress, but there's still a long way to go."),
  L("dist-far", "dist-far-2", "Still a lot of terrain to cover."),
  L("dist-far", "dist-far-3", "Plenty left to explore."),
  L("dist-half", "dist-half-1", "You're about halfway there."),
  L("dist-half", "dist-half-2", "Halfway to the checkpoint."),
  L("dist-half", "dist-half-3", "Good progress. Halfway there."),
  L("dist-close", "dist-close-1", "Getting close now."),
  L("dist-close", "dist-close-2", "The checkpoint is just ahead."),
  L("dist-close", "dist-close-3", "Not far now."),
  L("dist-near", "dist-near-1", "Almost there."),

  // ---- after leaving a checkpoint: progress (by checkpoints left) and completion ----
  L("prog-1", "progress-one-left-2", "Almost done. One checkpoint to go."),
  L("prog-1", "progress-one-left-3", "Final stretch. One more checkpoint."),
  L("prog-many", "progress-many-1", "Checkpoint complete. More to explore."),
  L("done", "done-1", "Expedition complete. Outstanding work."),
  L("done", "done-2", "All checkpoints reached. Well done."),
  L("done", "done-3", "Mission accomplished. Take a moment to look around."),
  L("done", "done-4", "You've seen everything here. Press M to try another vehicle."),
  L("done", "done-opportunity-1", "Opportunity completes its traverse across Meridiani Planum.", "opportunity"),
  L("done", "done-opportunity-2", "Every checkpoint reached. Opportunity's journey is complete.", "opportunity"),

  // ---- standing still between checkpoints ----
  L("idle", "idle-1", "Take your time. The next checkpoint is on your map."),
  L("idle", "idle-2", "Need a hint? Look for the diamond on the minimap."),
  L("idle", "idle-3", "Still there? Head for the next checkpoint when you're ready."),
  L("idle", "idle-4", "The minimap shows where to go next."),
  L("idle", "idle-5", "Hold Space to keep following the route."),
  L("idle", "idle-6", "Press and hold Space to drive on."),
  L("idle", "idle-opportunity-1", "Opportunity is idling. Ready to roll when you are.", "opportunity"),

  // ---- inside a checkpoint, once the narration is over ----
  L("ready", "ready-1", "Ready when you are. Head for the next checkpoint."),
  L("ready", "ready-2", "When you've seen enough, move on to the next target."),
  L("ready", "ready-3", "Take a look around, then continue the expedition."),
  L("ready", "ready-4", "Hold Space when you're ready to move on."),
];
