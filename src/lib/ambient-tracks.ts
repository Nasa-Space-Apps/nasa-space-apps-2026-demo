// Background music beds. No imports: scripts/generate-ambient.mjs loads this file from Node too.
// Change a prompt or a length, run `npm run ambient`, and only that track is re-recorded.

export type AmbientTrack = {
  id: "moon" | "mars" | "timeline";
  file: string; // public-relative URL
  seconds: number; // length asked from ElevenLabs Music (it is looped with a crossfade, so it never needs to be long)
  volume: number; // 0–1 level of the bed (it is lowered further while someone speaks)
  prompt: string;
};

const BASE = "instrumental ambient, no vocals, no drums, no percussion, no sudden changes, steady quiet dynamics, seamless and loopable, soft and cozy";

export const AMBIENT_TRACKS: AmbientTrack[] = [
  {
    id: "moon",
    file: "/ambient/moon.mp3",
    seconds: 60,
    volume: 0.5,
    prompt: `Lunar calm. A very slow warm synth pad, a low gentle hum and a few sparse, glassy bell tones that fade into long soft reverb. Quiet, spacious, a little cold but tender, like looking at the Earth from far away. ${BASE}.`,
  },
  {
    id: "mars",
    file: "/ambient/mars.mp3",
    seconds: 60,
    volume: 0.5,
    prompt: `Martian desert. A warm, airy pad with a faint breeze-like texture, a slow evolving drone and a few distant soft music-box notes. Open, dusty and warm, quietly nostalgic, like a long afternoon alone. ${BASE}.`,
  },
  {
    id: "timeline",
    file: "/ambient/timeline.mp3",
    seconds: 75,
    volume: 0.4,
    prompt: `Light and gentle background for a journey told through time. Sparse soft felt piano notes over a warm quiet pad, a very slow subtle pulse, hopeful and nostalgic, unobtrusive so a narrator can speak over it. ${BASE}.`,
  },
];
