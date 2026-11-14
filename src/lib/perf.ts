/**
 * Rendering budget of the demo. One switch, two profiles, so the lighter behaviour can be undone in one line.
 *
 *  - "light" (default): canvases capped at 1.5× pixel density, no antialiasing in the 3D scene, the idle scene redraws at 30 fps, and a view
 *    that is not the current route releases its WebGL canvas (Next keeps visited routes alive, hidden, and each kept scene held ~350–400 MB of GPU memory).
 *  - "full": the previous behaviour (up to 2× density, MSAA, 60 fps always, hidden views stay mounted).
 *
 * To go back to full quality set `PERF_PROFILE` below to "full", or run `NEXT_PUBLIC_PERF=full npm run dev`. Measurements and method: docs/performance.md.
 */

export type PerfProfile = "light" | "full";

export const PERF_PROFILE: PerfProfile = "light";

const PROFILES = {
  full: {
    dpr: [1, 2] as [number, number], // canvas pixel density range (device pixels per CSS pixel)
    sceneAntialias: true,
    globeAntialias: true,
    idleFps: 60, // redraw rate of the scene while the vehicle is stopped (60 = no throttling)
    releaseHiddenViews: false, // unmount a view's canvas while another route is open
  },
  light: {
    dpr: [1, 1.5] as [number, number],
    sceneAntialias: false,
    globeAntialias: true, // thin wireframe lines look broken without MSAA
    idleFps: 30,
    releaseHiddenViews: true,
  },
};

const chosen: PerfProfile = process.env.NEXT_PUBLIC_PERF === "full" || process.env.NEXT_PUBLIC_PERF === "light" ? process.env.NEXT_PUBLIC_PERF : PERF_PROFILE;

export const PERF = PROFILES[chosen];
