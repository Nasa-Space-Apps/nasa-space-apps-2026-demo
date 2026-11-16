"use client";

import { useSyncExternalStore } from "react";

/**
 * The size class of the screen, for the layout decisions that CSS alone cannot make (which HUD to mount, which controls to show). Everything here is a plain
 * breakpoint on the window; the purely visual adjustments live in CSS (`clamp`, media queries).
 *
 *   compact  the desktop HUD (cards beside the dock, minimap, key chips) does not fit: phones, tablets, small windows. The HUD stacks at the bottom instead.
 *   phone    narrower than 640 px: the tightest layouts (icon-only buttons, no minimap, one-line captions).
 *   short    lower than 520 px: a phone held sideways. The HUD gives up vertical room (the card shows only its peek, captions are two lines).
 *   touch    the primary pointer is a finger (or the window is compact): keys are replaced by on-screen buttons.
 */
export type Viewport = { w: number; h: number; compact: boolean; phone: boolean; short: boolean; portrait: boolean; touch: boolean };

const cache = new Map<string, Viewport>();

function read(): Viewport {
  if (typeof window === "undefined") return { w: 1280, h: 800, compact: false, phone: false, short: false, portrait: false, touch: false };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const key = `${w}x${h}${coarse ? "c" : ""}`;
  let v = cache.get(key);
  if (!v) {
    const compact = w < 1100 || h < 600;
    v = { w, h, compact, phone: w < 640, short: h < 520, portrait: h > w, touch: coarse || compact };
    if (cache.size > 40) cache.clear();
    cache.set(key, v);
  }
  return v;
}

let last = read();
const listeners = new Set<() => void>();
function onResize() {
  const next = read();
  if (next !== last) {
    last = next;
    listeners.forEach((l) => l());
  }
}
function subscribe(l: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    last = read();
  }
  listeners.add(l);
  return () => {
    listeners.delete(l);
    if (listeners.size === 0) {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    }
  };
}

/** The current size class; re-renders only when the window crosses to another size (not on every pixel: same-size reads share one object). */
export function useViewport(): Viewport {
  return useSyncExternalStore(subscribe, () => last, () => read());
}
