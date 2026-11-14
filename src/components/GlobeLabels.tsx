"use client";

import { BODIES } from "@/lib/bodies";
import type { Theme } from "@/lib/themes";

/** DOM labels of the globe view, keyed `v:<missionId>`. `Globe.tsx` moves them every frame (projected from 3D). */
export const labelEls = new Map<string, HTMLElement>();

const reg = (key: string) => (el: HTMLElement | null) => {
  if (el) labelEls.set(key, el);
  else labelEls.delete(key);
};

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
          <div style={{ transform: "translate(18px,-12px)" }}>
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
