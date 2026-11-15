"use client";

import { BODIES } from "@/lib/bodies";
import type { Theme } from "@/lib/themes";

/** DOM labels of the globe view, keyed `v:<missionId>`. `Globe.tsx` moves them every frame (projected from 3D). */
export const labelEls = new Map<string, HTMLElement>();

const reg = (key: string) => (el: HTMLElement | null) => {
  if (el) labelEls.set(key, el);
  else labelEls.delete(key);
};

/**
 * The floating vehicle card (Explore registers its element). While a vehicle is selected, `Globe` calls `placeFloating` every frame with the
 * vehicle's screen position: the card floats beside it (right, or left near the edge), eases to the spot and hides while the vehicle is on the
 * far side. On narrow screens it docks to the bottom centre instead. Imperative on purpose: no React renders per frame.
 */
export const floating: { el: HTMLElement | null; x: number; y: number; placed: boolean } = { el: null, x: 0, y: 0, placed: false };

export function placeFloating(px: number, py: number, front: boolean, W: number, H: number, dt: number) {
  const el = floating.el;
  if (!el) return;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const M = 16; // margin to the screen edge
  const GAP = 40; // room around the vehicle
  let tx: number;
  let ty: number;
  if (W < 760) {
    tx = (W - w) / 2;
    ty = H - h - M;
  } else {
    tx = px + GAP + w + M > W ? px - GAP - w : px + GAP;
    tx = Math.min(Math.max(M, tx), W - w - M);
    ty = Math.min(Math.max(M, py - h * 0.5), Math.max(M, H - h - M));
  }
  if (!floating.placed) {
    floating.x = tx;
    floating.y = ty;
    floating.placed = true;
  } else {
    const k = 1 - Math.exp(-9 * dt);
    floating.x += (tx - floating.x) * k;
    floating.y += (ty - floating.y) * k;
  }
  el.style.transform = `translate3d(${floating.x.toFixed(1)}px,${floating.y.toFixed(1)}px,0)`;
  el.style.opacity = front ? "1" : "0";
  el.style.visibility = front ? "visible" : "hidden";
}

export default function GlobeLabels({ theme }: { theme: Theme }) {
  const g = theme.globe;
  const base = {
    position: "absolute" as const,
    left: 0,
    top: 0,
    opacity: 0,
    willChange: "transform",
    whiteSpace: "nowrap" as const,
    fontFamily: theme.font,
    color: g.ink,
  };
  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      {BODIES.flatMap((b) => b.vehicles).map((v) => (
        <div key={v.missionId} style={{ ...base, transition: `opacity ${theme.dur.base}ms ${theme.ease}` }} ref={reg(`v:${v.missionId}`)}>
          <div style={{ transform: "translate(36px,-20px)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{v.name}</div>
            <div
              style={{
                marginTop: 6,
                display: "inline-block",
                background: g.tag,
                color: g.tagText,
                fontFamily: theme.mono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.01em",
                textTransform: "lowercase",
                lineHeight: 1,
                padding: "7px 11px",
                borderRadius: theme.radiusSm,
              }}
            >
              {v.tag}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
