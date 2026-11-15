"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { beatToCheckpoint, type StoryBeat } from "@/lib/story";
import { playNarration, preloadNarration, stopNarration, toggleNarration } from "@/lib/narration";
import { THEME as theme } from "@/lib/themes";
import { ease, ui } from "@/lib/ui";
import Captions from "./Captions";
import Icon from "./Icon";

/** Tilt of each page on the table (degrees): the active one straightens up. */
const TILT = [-1.4, 1.1, -0.7, 1.5, -1.1, 0.8];

/** Flat organic blobs behind the pages (the reference's pink-on-blue spots); they glide to a new place with every page. */
function Blobs({ at }: { at: number }) {
  const spots = [
    { fill: theme.accent, d: "M120 20C190 -10 280 20 300 90s-30 150-110 170S40 240 20 160 50 50 120 20Z", x: -6, y: 8, s: 1.5, r: 12 },
    { fill: theme.globe.line, d: "M100 30c60-30 150-10 170 60s-20 130-100 150S10 220 20 140 40 60 100 30Z", x: 66, y: -18, s: 1.3, r: -20 },
    { fill: theme.accent, d: "M110 10c80-20 170 30 170 110S210 260 120 250 10 180 20 110 60 20 110 10Z", x: 84, y: 62, s: 1.1, r: 30 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {spots.map((b, k) => (
        <svg
          key={k}
          viewBox="0 0 320 270"
          className="absolute"
          style={{
            width: "38vmax",
            left: `${b.x - at * (6 + k * 3)}%`,
            top: `${b.y + Math.sin(at * 1.7 + k) * 10}%`,
            transform: `translate(-50%,-50%) rotate(${b.r + at * (14 + k * 8)}deg) scale(${b.s + (at % 2) * 0.12})`,
            transition: `left ${theme.dur.slow * 1.6}ms ${theme.ease}, top ${theme.dur.slow * 1.6}ms ${theme.ease}, transform ${theme.dur.slow * 1.6}ms ${theme.ease}`,
          }}
        >
          <path d={b.d} fill={b.fill} />
        </svg>
      ))}
    </div>
  );
}

/**
 * Comic pages of a mission's story (the events before the 3D, and the legacy after it): paper pages with an ink-framed illustration, a date sticker and a
 * caption, laid out in a row like ponpon-mania.com/chapter/3. The active page is centred, the others peek at its sides. Next: Space / → / click / swipe /
 * wheel; back: ← . Each page narrates itself when it arrives (subtitled). Everything springs in and out with the theme's `pop` curve.
 */
export default function Comic({
  name,
  beats,
  label,
  doneLabel,
  skipLabel = "skip the comic",
  end,
  onDone,
  onBack,
  onSkip,
  onPage,
  onLeave,
  onBackPast,
  startAt = 0,
}: {
  name: string; // the mission («Opportunity»)
  beats: StoryBeat[];
  label: string; // part name in the progress pill ("earth")
  doneLabel: string; // the button of the last page ("land on mars")
  skipLabel?: string; // the top-right button that jumps over the comic ("skip to mars"), shown with `onSkip`
  end?: ReactNode; // an extra last page (the closing card)
  onDone: () => void;
  onBack: () => void;
  onSkip?: () => void;
  onPage?: (i: number) => void; // the page that is now in front (the parent warms the terrain download a few pages before the end)
  onLeave?: () => void; // the way forward has started (the pages are dropping away): the parent mounts what comes next behind the dissolving blue
  onBackPast?: () => void; // ← on the first page: go back to what came before (the 3D route, from the epilogue)
  startAt?: number; // page to open on
}) {
  const { frame } = ui(theme);
  const total = beats.length + (end ? 1 : 0);
  const [i, setI] = useState(startAt);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const drag = useRef({ x: 0, moved: false, down: false });
  const wheelAt = useRef(0);
  const timer = useRef(0);

  useEffect(() => {
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
      window.clearTimeout(timer.current);
    };
  }, []);

  // warm the clips and the pictures
  useEffect(() => {
    preloadNarration(beats.map(beatToCheckpoint));
    beats.forEach((b) => {
      const img = new Image();
      img.src = b.image;
    });
  }, [beats]);

  useEffect(() => {
    onPage?.(i);
  }, [i, onPage]);

  // each page tells its story when it arrives
  useEffect(() => {
    if (!entered || leaving) return;
    const b = beats[i];
    if (b) void playNarration(beatToCheckpoint(b));
    else stopNarration();
  }, [i, entered, leaving, beats]);
  useEffect(() => () => stopNarration(), []);

  /** The pages drop away and the blue dissolves, then `next` swaps the view. */
  const leave = (next: () => void, forward: boolean) => {
    if (leaving) return;
    setLeaving(true);
    stopNarration();
    if (forward) onLeave?.();
    timer.current = window.setTimeout(next, theme.dur.slow + 500);
  };
  const go = (n: number) => {
    if (leaving) return;
    if (n >= total) leave(onDone, true);
    else if (n < 0) {
      if (onBackPast) leave(onBackPast, false);
    } else setI(n);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.code === "ArrowRight" || e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        go(i + 1);
      } else if (e.code === "ArrowLeft" || e.code === "Backspace") go(i - 1);
      else if (e.code === "KeyN") toggleNarration();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const paper: CSSProperties = { background: theme.surface, border: `${theme.stroke}px solid ${theme.ink}`, borderRadius: theme.radius };
  const progress = ((i + 1) / total) * 100;
  const last = i === total - 1;

  return (
    <div
      className="fixed inset-0 z-40 select-none overflow-hidden"
      role="region"
      aria-label={`${name}, the story`}
      style={
        {
          "--pw": "min(44vw, 50vh)", // width of a page: its 4:5 picture sets the height (the subtitles sit under it)
          background: theme.canvas,
          fontFamily: theme.font,
          opacity: entered && !leaving ? 1 : 0,
          transition: ease(theme, ["opacity"], leaving ? theme.dur.slow : theme.dur.base + 100, leaving ? 320 : 0),
          touchAction: "pan-y",
        } as CSSProperties
      }
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, moved: false, down: true };
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        if (!d.down) return;
        d.down = false;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 70) {
          d.moved = true;
          go(dx < 0 ? i + 1 : i - 1);
        }
      }}
      onWheel={(e) => {
        const t = performance.now();
        if (t - wheelAt.current < 600 || Math.abs(e.deltaX) + Math.abs(e.deltaY) < 24) return;
        wheelAt.current = t;
        go((e.deltaX || e.deltaY) > 0 ? i + 1 : i - 1);
      }}
    >
      <Blobs at={i} />

      {/* top bar: the way back, the title, the way to skip the comic */}
      <div className="absolute left-5 right-5 top-5 z-10 flex items-start justify-between">
        <button type="button" className="ui-btn is-ghost" onClick={(e) => (e.currentTarget.blur(), onBack())}>
          <Icon name="arrow-left" size={16} /> globe
        </button>
        <div className="pointer-events-none text-center" style={{ transform: entered ? "none" : "translateY(-30px)", transition: `transform ${theme.dur.base}ms ${theme.pop}` }}>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 0.9, color: theme.ink }}>{name.toLowerCase()}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.ink, marginTop: 4 }}>the story · {label}</div>
        </div>
        {onSkip ? (
          <button type="button" className="ui-btn is-ghost" onClick={(e) => (e.currentTarget.blur(), onSkip())}>
            {skipLabel} <Icon className="ui-arrow" name="arrow-right" size={16} />
          </button>
        ) : (
          <span style={{ width: 96 }} />
        )}
      </div>

      {/* the pages */}
      {Array.from({ length: total }, (_, k) => {
        const b = beats[k];
        const d = k - i;
        const active = d === 0;
        const far = Math.abs(d) > 2;
        const rot = TILT[k % TILT.length];
        const x = `calc(-50% + var(--pw) * ${d * 1.12})`;
        const transform = leaving
          ? active
            ? `translate(-50%, calc(-50% + 120vh)) rotate(${rot * 7}deg)`
            : `translate(${x}, -50%) rotate(${rot}deg) scale(0.6)`
          : !entered
            ? `translate(${x}, calc(-50% + 70vh)) rotate(${rot * 4}deg) scale(0.8)`
            : `translate(${x}, calc(-50% - ${active ? 1 : 0}vh)) rotate(${active ? rot * 0.45 : rot * 1.6}deg) scale(${active ? 1 : 0.8})`;
        return (
          <div
            key={k}
            role="group"
            aria-roledescription="page"
            aria-label={b ? `${k + 1} of ${total}: ${b.title}` : "The end"}
            aria-hidden={!active}
            onClick={() => {
              if (drag.current.moved) {
                drag.current.moved = false;
                return;
              }
              if (!b || !active || k < total - 1) go(active ? k + 1 : k); // the closing card does not advance on click (it has buttons)
            }}
            style={{
              position: "absolute",
              left: "50%",
              top: "49%",
              width: "var(--pw)",
              zIndex: 10 - Math.abs(d),
              cursor: "pointer",
              pointerEvents: far || leaving ? "none" : "auto",
              opacity: far || (!entered && !active) ? 0 : leaving ? (active ? 1 : 0) : active ? 1 : 0.6,
              transform,
              transition: `transform ${theme.dur.slow}ms ${theme.pop}, opacity ${theme.dur.base}ms ${theme.ease}`,
            }}
          >
            <div style={{ ...paper, padding: 12, background: theme.surface }}>
              {b ? (
                <div className="relative overflow-hidden" style={{ ...frame, aspectRatio: b.imageRatio }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a local, pre-sized illustration */}
                  <img
                    src={b.image}
                    alt={b.title}
                    draggable={false}
                    className="block h-full w-full object-cover"
                    style={{ transform: active ? "scale(1)" : "scale(1.12)", transition: `transform 2200ms ${theme.ease}` }}
                  />
                  {/* the date, stamped on the corner */}
                  <div
                    style={{
                      ...paper,
                      position: "absolute",
                      left: 12,
                      top: 12,
                      padding: "5px 11px",
                      fontSize: 15,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                      color: theme.ink,
                      rotate: "-3deg",
                      transform: active ? "scale(1)" : "scale(0.3)",
                      transition: `transform ${theme.dur.base}ms ${theme.pop} 150ms`,
                    }}
                  >
                    {b.date}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 12,
                      background: theme.ink,
                      color: theme.onInk,
                      borderRadius: theme.radiusSm,
                      padding: "5px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {k + 1}/{total}
                  </div>
                  {/* the caption box */}
                  <div
                    style={{
                      ...paper,
                      position: "absolute",
                      left: 12,
                      right: 12,
                      bottom: 12,
                      padding: "11px 15px 13px",
                      rotate: "0.5deg",
                      opacity: active ? 1 : 0,
                      transform: active ? "none" : "translateY(28px) rotate(2deg)",
                      transition: `transform ${theme.dur.base}ms ${theme.pop} 260ms, opacity ${theme.dur.fast}ms ${theme.ease} 260ms`,
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1, color: theme.ink }}>{b.title}</div>
                    <p style={{ marginTop: 7, fontSize: 14, fontWeight: 500, lineHeight: 1.35, letterSpacing: "-0.005em", color: theme.ink }}>{b.summary}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center" style={{ ...frame, aspectRatio: "4 / 5", background: theme.canvas, padding: 24 }}>
                  {end}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* subtitles of the narration */}
      <div className="pointer-events-none fixed bottom-20 left-1/2 z-50 h-0 w-[min(780px,92vw)] -translate-x-1/2">
        <Captions theme={theme} wide />
      </div>

      {/* the dock: back, progress, next */}
      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5" style={{ opacity: leaving ? 0 : 1, transition: ease(theme, ["opacity"]) }}>
        <button type="button" className="ui-fab ui-fab-sm" aria-label={i === 0 && onBackPast ? "Back to the 3D route" : "Previous page"} title={i === 0 && onBackPast ? "Back to the 3D route" : undefined} disabled={i === 0 && !onBackPast} style={{ opacity: i === 0 && !onBackPast ? 0.4 : 1 }} onClick={(e) => (e.currentTarget.blur(), go(i - 1))}>
          <Icon name="arrow-left" size={14} />
        </button>
        <div
          className="flex items-center gap-4"
          style={{ background: theme.ink, color: theme.onInk, borderRadius: theme.radiusSm, padding: "10px 22px", minWidth: "min(300px, 60vw)", transform: entered ? "none" : "translateY(50px)", transition: `transform ${theme.dur.base}ms ${theme.pop} 200ms` }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
            {String(i + 1).padStart(2, "0")}.{beats[i]?.title.toLowerCase() ?? "the end"}
          </span>
          <span className="flex-1 overflow-hidden" style={{ height: 5, borderRadius: 999, background: theme.inkSoft, minWidth: 60 }}>
            <span className="block h-full" style={{ width: `${progress}%`, background: theme.accent, borderRadius: 999, transition: ease(theme, ["width"]) }} />
          </span>
        </div>
        {last && !end ? (
          <button type="button" className="ui-btn" onClick={(e) => (e.currentTarget.blur(), go(i + 1))}>
            {doneLabel} <Icon className="ui-arrow" name="arrow-right" size={16} />
          </button>
        ) : (
          <button type="button" className="ui-fab ui-fab-sm" aria-label="Next page" disabled={last} style={{ opacity: last ? 0.4 : 1 }} onClick={(e) => (e.currentTarget.blur(), go(i + 1))}>
            <Icon name="arrow-right" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
