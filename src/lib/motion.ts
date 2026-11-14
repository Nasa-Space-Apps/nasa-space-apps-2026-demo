/**
 * Playful motion helpers (docs/design.md, «Movimiento»): a spring that overshoots and wobbles into place, for the game-like pops of the globe menu.
 * Plain functions, no React: they are stepped from `useFrame`. DOM pops use the theme's `pop` curve with transitions (components/Pop.tsx).
 */

export type Spring = { x: number; v: number };

/** Advance a spring towards `target` by `dt` seconds (semi-implicit Euler in small steps, stable for any frame time). Returns the new value. */
export function springStep(s: Spring, target: number, dt: number, stiffness = 220, damping = 13): number {
  const n = Math.max(1, Math.ceil(dt / 0.008));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    s.v += (stiffness * (target - s.x) - damping * s.v) * h;
    s.x += s.v * h;
  }
  return s.x;
}

/** `prefers-reduced-motion: reduce`: the idle hops and wiggles are skipped (the pops still settle, without overshoot being a loop). */
export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
