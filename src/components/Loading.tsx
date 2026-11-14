"use client";

import { useEffect, useState } from "react";
import { THEME as theme } from "@/lib/themes";
import { ease } from "@/lib/ui";

/**
 * Loading screen of the demo: the canvas colour, a large title at the bottom left, a mono status line, and a hairline progress bar along the bottom
 * edge (the same ink-on-line bar language as the timeline). Every stage of a trip (route fallback, chunk download, terrain download and build) draws the
 * same thing in the same place, so going from one to the next never shows a different screen: only the text and the bar change, softly.
 *
 * `progress` 0–100 is a determinate bar; without it the bar breathes (indeterminate). `title` / `stage` appear (fade in) only when given.
 */
export function LoadingContent({ title, stage, progress, visible = true }: { title?: string; stage?: string; progress?: number; visible?: boolean }) {
  // indeterminate: a slow breathing of the bar (plain transitions: new @keyframes are not picked up by the dev server)
  const [breath, setBreath] = useState(false);
  useEffect(() => {
    if (progress !== undefined) return;
    const id = window.setInterval(() => setBreath((b) => !b), 900);
    return () => window.clearInterval(id);
  }, [progress]);

  // the text eases in once it is given, instead of popping
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const determinate = progress !== undefined;
  return (
    <div
      className="absolute inset-0 select-none"
      style={{ fontFamily: theme.font, opacity: visible ? 1 : 0, transition: ease(theme, ["opacity"], theme.dur.base) }}
      role="status"
      aria-live="polite"
      aria-label={stage ?? "Loading"}
    >
      <div
        className="absolute left-5 right-5 flex items-end justify-between gap-6"
        style={{
          bottom: process.env.NODE_ENV === "development" ? 60 : 32, // dev only: clear of Next's "N" indicator (bottom-left)
          opacity: title || stage ? (shown ? 1 : 0) : 0, transition: ease(theme, ["opacity"], theme.dur.slow),
        }}
      >
        <div className="min-w-0">
          {title && (
            <div style={{ fontSize: "clamp(40px, 6.5vw, 88px)", fontWeight: 450, letterSpacing: "-0.04em", lineHeight: 0.95, color: theme.ink }}>{title}</div>
          )}
          {stage && (
            <div style={{ marginTop: 14, fontFamily: theme.mono, fontSize: 12, fontWeight: 500, letterSpacing: "0.02em", textTransform: "uppercase", color: theme.muted }}>
              {stage}
            </div>
          )}
        </div>
        {determinate && (
          <div style={{ fontFamily: theme.mono, fontSize: 12, fontWeight: 500, color: theme.ink, fontVariantNumeric: "tabular-nums", paddingBottom: 1 }}>
            {Math.round(progress)}%
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0" style={{ height: 2, background: theme.line }}>
        <div
          style={{
            height: "100%",
            background: theme.ink,
            width: determinate ? `${Math.max(2, Math.min(100, progress))}%` : "38%",
            opacity: determinate ? 1 : breath ? 1 : 0.25,
            transition: determinate ? ease(theme, ["width"], theme.dur.base) : ease(theme, ["opacity"], theme.dur.slow),
          }}
        />
      </div>
    </div>
  );
}

/** Full-screen loading page (route fallbacks and chunk downloads). */
export default function Loading({ title, stage, progress }: { title?: string; stage?: string; progress?: number }) {
  return (
    <div className="fixed inset-0 z-40" style={{ background: theme.canvas }}>
      <LoadingContent title={title} stage={stage} progress={progress} />
    </div>
  );
}
