"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { game } from "@/lib/game";
import { getNarration, playNarration, stopNarration, subscribeNarration } from "@/lib/narration";
import type { Checkpoint } from "@/lib/checkpoints";
import type { Theme } from "@/lib/themes";
import { ease, ui } from "@/lib/ui";
import FadeImg from "./FadeImg";
import Icon from "./Icon";

type Shown = { cp: Checkpoint; index: number; total: number };

/** Info card (bottom left) shown while the rover is inside a checkpoint. State is polled from `game`, no per-frame renders. */
export default function CheckpointCard({ theme }: { theme: Theme }) {
  const [shown, setShown] = useState<Shown | null>(null);
  const [open, setOpen] = useState(false);
  const [reached, setReached] = useState<string[]>([]);
  const nar = useSyncExternalStore(subscribeNarration, getNarration, getNarration);

  useEffect(() => {
    let raf = 0;
    let lastActive: string | null = null;
    let lastCount = -1;
    let lastList = game.checkpoints;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (game.checkpoints !== lastList) {
        lastList = game.checkpoints;
        lastCount = -1;
        lastActive = null;
        setOpen(false);
        lastList.forEach((c) => {
          const img = new Image(); // warm the cache so the card opens without a pop-in
          img.src = c.image;
        });
      }
      if (game.active !== lastActive) {
        lastActive = game.active;
        const cp = game.checkpoints.find((c) => c.id === game.active);
        if (cp) setShown({ cp, index: game.checkpoints.indexOf(cp), total: game.checkpoints.length });
        setOpen(!!cp);
      }
      if (game.visited.size !== lastCount) {
        lastCount = game.visited.size;
        setReached([...game.visited]);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { label, title, text, panel, frame } = ui(theme);
  const place = shown ? (shown.index === 0 ? "Start" : shown.index === shown.total - 1 ? "End" : "Stop") : "";

  return (
    <div
      aria-live="polite"
      aria-hidden={!open}
      style={{
        fontFamily: theme.font,
        // the story's illustrations are portrait (4:5): the card is narrower and taller, sized by the screen height so it never reaches the timeline
        width: shown?.cp.imageRatio ? "clamp(210px, 31vh, 290px)" : "clamp(250px, 24vw, 340px)",
        opacity: open ? 1 : 0,
        transform: open ? "none" : "translateY(18px)",
        visibility: open ? "visible" : "hidden",
        transition: `${ease(theme, ["opacity"], theme.dur.base)}, ${ease(theme, ["transform"], theme.dur.slow)}, visibility 0s linear ${open ? 0 : theme.dur.slow}ms`,
      }}
      // dev only: lift the card above Next's "N" indicator (bottom-left)
      className={`pointer-events-none fixed left-5 z-10 select-none ${
        process.env.NODE_ENV === "development" ? "bottom-14" : "bottom-5"
      }`}
    >
      {shown && (
        <div style={{ ...panel, padding: 10, rotate: "-0.7deg" /* a page laid on the table, not a UI box */ }}>
          <div className="relative w-full" style={{ ...frame, aspectRatio: shown.cp.imageRatio ?? "16 / 10", background: theme.line }}>
            <FadeImg src={shown.cp.image} alt={shown.cp.name} theme={theme} />
          </div>

          <div className="px-1.5 pb-1">
            <div style={{ ...label, marginTop: 8, fontSize: 10.5, textTransform: "none", fontWeight: 500 }}>{shown.cp.credit}
              {shown.cp.source ? ` · facts: ${shown.cp.source.label}` : ""}
            </div>
            <div style={{ ...title, marginTop: 14, fontSize: 21 }}>{shown.cp.name}</div>
            <div className={`mt-2 flex ${shown.cp.imageRatio ? "flex-col gap-2" : "items-center justify-between gap-3"}`}>
              <span style={label}>
                {place} {shown.index + 1}/{shown.total} · {shown.cp.place}
              </span>
              <span className="flex flex-none flex-wrap gap-1" role="img" aria-label={`${reached.length} of ${shown.total} visited`}>
                {game.checkpoints.map((c, i) => (
                  <span
                    key={c.id}
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 999,
                      border: `2px solid ${theme.ink}`,
                      background: i === shown.index ? theme.accent : reached.includes(c.id) ? theme.ink : theme.line,
                      transition: ease(theme, ["background-color"]),
                    }}
                  />
                ))}
              </span>
            </div>

            {(() => {
              const mine = nar.id === shown.cp.id;
              const busy = mine && (nar.status === "loading" || nar.status === "playing");
              const note = mine && nar.error ? nar.error : !nar.enabled ? "Narration off (N)" : "";
              return (
                <div className="mt-3 flex items-center gap-3" style={{ pointerEvents: "auto" }}>
                  <button
                    type="button"
                    className="ui-btn is-ghost"
                    style={{ padding: "9px 12px", gap: 8 }}
                    onClick={(e) => {
                      e.currentTarget.blur(); // keep Space for driving
                      if (busy) stopNarration();
                      else void playNarration(shown.cp, true);
                    }}
                  >
                    {mine && nar.status === "loading" ? "Loading…" : mine && nar.status === "playing" ? "Stop" : "Listen"}
                    <Icon name={mine && nar.status === "playing" ? "stop" : "play"} size={14} />
                  </button>
                  <span style={label}>{note}</span>
                </div>
              );
            })()}

            <p style={{ ...text, marginTop: 12, fontSize: 13, color: theme.muted }}>{shown.cp.text}</p>

            {/* the narrow story card lists its facts as rows (label left, value right); the old wide cards keep three columns */}
            <div className={shown.cp.imageRatio ? "mt-3 flex flex-col gap-1.5" : "mt-3.5 grid grid-cols-3 gap-2"}>
              {shown.cp.facts.map(([k, v]) =>
                shown.cp.imageRatio ? (
                  <div key={k} className="flex items-baseline justify-between gap-3" style={{ borderTop: `2px solid ${theme.ink}`, paddingTop: 5 }}>
                    <span style={{ ...label, fontSize: 11 }}>{k}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, textAlign: "right" }}>{v}</span>
                  </div>
                ) : (
                  <div key={k}>
                    <span style={{ ...label, display: "block", fontSize: 11 }}>{k}</span>
                    <span style={{ marginTop: 6, display: "block", fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{v}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
