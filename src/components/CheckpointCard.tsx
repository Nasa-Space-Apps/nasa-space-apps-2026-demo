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
  const story = !!shown?.cp.imageRatio; // the Opportunity story's card: wide, with the illustration beside the title, and links to the sources

  const dots = shown && (
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
  );

  const listen = (tight = false) =>
    shown &&
    (() => {
      const mine = nar.id === shown.cp.id;
      const busy = mine && (nar.status === "loading" || nar.status === "playing");
      const note = mine && nar.error ? nar.error : !nar.enabled ? "Narration off (N)" : "";
      return (
        <div className={`${tight ? "" : "mt-3"} flex flex-wrap items-center gap-x-3 gap-y-1.5`} style={{ pointerEvents: "auto" }}>
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
    })();

  return (
    <div
      aria-live="polite"
      aria-hidden={!open}
      style={{
        fontFamily: theme.font,
        // the story's card takes all the room between the left edge and the dock (whose width is clamp(440px, 100vw - 900px, 560px), see Scene.tsx), so the
        // illustration can be big; the old cards keep their narrow column
        width: story ? "clamp(340px, calc((100vw - clamp(440px, 100vw - 900px, 560px)) / 2 - 40px), 520px)" : "clamp(250px, 24vw, 340px)",
        opacity: open ? 1 : 0,
        transform: open ? "none" : "translateY(18px)",
        visibility: open ? "visible" : "hidden",
        transition: `${ease(theme, ["opacity"], theme.dur.base)}, ${ease(theme, ["transform"], theme.dur.slow)}, visibility 0s linear ${open ? 0 : theme.dur.slow}ms`,
      }}
      // same baseline as the timeline and the minimap (bottom-5); Next's dev "N" indicator may overlap its corner, that is fine
      className="pointer-events-none fixed bottom-5 left-5 z-10 select-none"
    >
      {shown && story && (
        <div style={{ ...panel, padding: 12, rotate: "-0.7deg" /* a page laid on the table, not a UI box */ }}>
          {/* the illustration spans the whole card (its 4:5 shape, as tall as the screen allows: on a short screen it is trimmed a little at top and bottom);
              the story (title, place, progress, listen, summary, facts, sources) runs below it */}
          <div
            className="relative w-full"
            style={{ ...frame, aspectRatio: shown.cp.imageRatio, maxHeight: "max(220px, calc(100vh - 415px))", background: theme.line }}
          >
            <FadeImg src={shown.cp.image} alt={shown.cp.name} theme={theme} />
          </div>

          <div style={{ ...title, marginTop: 12, fontSize: 22 }}>{shown.cp.name}</div>
          <div style={{ ...label, marginTop: 6, color: theme.ink }}>
            {place} {shown.index + 1}/{shown.total} <span style={{ opacity: 0.45 }}>·</span> {shown.cp.place}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            {dots}
            {listen(true)}
          </div>

          <p style={{ ...text, marginTop: 10, fontSize: 13, lineHeight: 1.4, color: theme.muted }}>{shown.cp.text}</p>

          <div className="mt-3 grid grid-cols-3 gap-x-3" style={{ borderTop: `2px solid ${theme.ink}`, paddingTop: 6 }}>
            {shown.cp.facts.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <span style={{ ...label, display: "block", fontSize: 11 }}>{k}</span>
                <span style={{ marginTop: 3, display: "block", fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{v}</span>
              </div>
            ))}
          </div>

          {shown.cp.sources && (
            // one line of links (two on a narrow card); the kind of source (official / scientific / press) is in the tooltip
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-0.5" style={{ pointerEvents: "auto", borderTop: `2px solid ${theme.ink}`, paddingTop: 6 }}>
              <span style={{ ...label, fontSize: 11 }}>sources</span>
              {shown.cp.sources.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${s.type} source`}
                  className="ui-link"
                  style={{ minWidth: 0, fontSize: 12, textTransform: "none", letterSpacing: 0, gap: 5, padding: "2px 0" }}
                  onClick={(e) => e.currentTarget.blur()} // keep Space for driving
                >
                  <span className="truncate">{s.host}</span>
                  <Icon name="arrow-right" size={12} style={{ flex: "none", transform: "rotate(-45deg)" }} />
                </a>
              ))}
            </div>
          )}
          <div style={{ ...label, marginTop: 6, fontSize: 10.5, textTransform: "none", fontWeight: 500 }}>{shown.cp.credit} · facts from NASA and the sources above</div>
        </div>
      )}

      {shown && !story && (
        <div style={{ ...panel, padding: 10, rotate: "-0.7deg" }}>
          <div className="relative w-full" style={{ ...frame, aspectRatio: "16 / 10", background: theme.line }}>
            <FadeImg src={shown.cp.image} alt={shown.cp.name} theme={theme} />
          </div>

          <div className="px-1.5 pb-1">
            <div style={{ ...label, marginTop: 8, fontSize: 10.5, textTransform: "none", fontWeight: 500 }}>{shown.cp.credit}</div>
            <div style={{ ...title, marginTop: 14, fontSize: 21 }}>{shown.cp.name}</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span style={label}>
                {place} {shown.index + 1}/{shown.total} · {shown.cp.place}
              </span>
              {dots}
            </div>
            {listen()}
            <p style={{ ...text, marginTop: 12, fontSize: 13, color: theme.muted }}>{shown.cp.text}</p>
            <div className="mt-3.5 grid grid-cols-3 gap-2">
              {shown.cp.facts.map(([k, v]) => (
                <div key={k}>
                  <span style={{ ...label, display: "block", fontSize: 11 }}>{k}</span>
                  <span style={{ marginTop: 6, display: "block", fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
