"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CARDS, layoutFor, pointer, stageScale, type Layout } from "@/lib/home";
import { reducedMotion } from "@/lib/motion";
import { PERF } from "@/lib/perf";
import { HOME, cssVars, themeFor } from "@/lib/themes";
import { ease } from "@/lib/ui";
import { useViewport } from "@/lib/viewport";
import Ambient, { AmbientButton } from "./Ambient";
import Credits from "./Credits";
import HomeScene from "./HomeScene";
import { LoadingContent } from "./Loading";
import Logo from "./Logo";
import Pop from "./Pop";
import Sparkles from "./Sparkles";

/**
 * The home page (`/`): one composition, like the cover of a game, on the periwinkle field of the reference: the illustrations of the six stories lie around as tilted
 * cards of different sizes (they float, and straighten and lift when touched; each one opens its story) and Opportunity, in 3D and still, stands big in front of them
 * (one canvas, see HomeScene). Almost no text: the logo, a ring badge and a «start» pill. A click anywhere throws sparkles. Layout: a 1700 × 1000 stage scaled to the
 * screen (`lib/home.ts`).
 * Design notes: docs/design.md («Home»).
 */

/** The stage: fixed units (see `Layout`) scaled by `--s` (set from the window size) and centred. */
const stageStyle = (l: Layout): CSSProperties => ({
  position: "absolute",
  left: "50%",
  top: "50%",
  width: l.w,
  height: l.h,
  transform: "translate(-50%, -50%) scale(var(--s, 1))",
  pointerEvents: "none",
});

/** A control on the stage that never gets smaller than `min` of its natural size on screen (the stage shrinks with the screen; a button must stay tappable). */
const keepSize = (min: number): CSSProperties => ({ scale: `max(1, calc(${min} / var(--s, 1)))` });

/**
 * Next keeps a visited route alive (hidden, with its state) while another one is open. The light perf profile releases this view's WebGL canvas then (lib/perf.ts), and
 * coming back (the brand mark of the globe) mounts it fresh: otherwise it would still wear the fade of its last trip («start») and show a blank screen.
 */
export default function Home() {
  const pathname = usePathname();
  if (PERF.releaseHiddenViews && pathname !== "/") return null;
  return <HomeView />;
}

function HomeView() {
  const router = useRouter();
  const vp = useViewport();
  const layout = layoutFor(vp.w, vp.h);
  const layoutRef = useRef(layout);
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);
  const theme = useMemo(() => themeFor("home"), []);
  const [canvasReady, setCanvasReady] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ready = (canvasReady && imagesReady) || timedOut;
  // the full perf profile keeps the view mounted and re-runs its effects when it comes back: lift the fade of the trip that left it
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset after coming back from a trip
    setLeaving(false);
  }, []);

  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const badge = useRef<SVGGElement>(null);
  const badgeHot = useRef(false);

  // the page is shown when the illustrations are decoded and the 3D canvas exists
  useEffect(() => {
    let alive = true;
    Promise.all(
      CARDS.map((c) => {
        const img = new Image();
        img.src = c.image;
        return img.decode().catch(() => {});
      }),
    ).then(() => alive && setImagesReady(true));
    const t = window.setTimeout(() => alive && setTimedOut(true), 8000);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, []);

  const go = useCallback(
    (path: string) => {
      if (leaving) return;
      setLeaving(true);
      window.setTimeout(() => router.push(path), theme.dur.base + 150);
    },
    [leaving, router, theme.dur.base],
  );
  const openGlobe = () => go("/mars");

  // the one animation loop: the stage scale, parallax, the floating cards, the breathing window, the drifting wisps and clouds, the spinning badge
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const calm = reducedMotion();
    const fit = () => el.style.setProperty("--s", String(stageScale(window.innerWidth, window.innerHeight)));
    fit();
    window.addEventListener("resize", fit);
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    const depths = [...el.querySelectorAll<HTMLElement>("[data-depth]")];
    let cx = 0;
    let cy = 0;
    let spin = 0;
    let spinRate = 22;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = calm ? 0 : now / 1000;
      const k = 1 - Math.exp(-4 * dt);
      cx += (pointer.x - cx) * k;
      cy += (pointer.y - cy) * k;
      if (!calm) for (const n of depths) n.style.transform = `translate3d(${(-cx * Number(n.dataset.depth)).toFixed(2)}px,${(-cy * Number(n.dataset.depth) * 0.6).toFixed(2)}px,0)`;
      CARDS.forEach((c, i) => {
        const n = cards.current[i];
        const at = layoutRef.current.cards[c.id];
        if (!n || !at) return;
        const d = 6 + at[2] / 22;
        const bob = Math.sin(t * c.speed + c.phase) * c.amp;
        const wob = Math.sin(t * 0.7 + c.phase) * 0.9;
        n.style.transform = `translate(-50%,-50%) translate3d(${(-cx * d).toFixed(2)}px,${(-cy * d * 0.6 + bob).toFixed(2)}px,0) rotate(${(at[3] + wob).toFixed(2)}deg)`;
      });
      spinRate += ((badgeHot.current ? 170 : 22) - spinRate) * (1 - Math.exp(-3 * dt));
      spin = (spin + (calm ? 0 : spinRate) * dt) % 360;
      badge.current?.setAttribute("transform", `rotate(${spin.toFixed(2)} 100 100)`);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const sparkleColors = useMemo(() => ({ paper: theme.surface, accent: HOME.butter, ink: theme.ink }), [theme]);
  const mapped = useMemo(() => ({ ...cssVars(theme), background: theme.canvas }) as CSSProperties, [theme]);

  return (
    <div ref={root} className="fixed inset-0 select-none overflow-hidden" style={{ ...mapped, fontFamily: theme.font }}>
      <Ambient track="mars" />

      {/* behind the vehicle: the cards */}
      <div style={{ ...stageStyle(layout), zIndex: 2 }}>
        {CARDS.map((c, i) => {
          const [x, y, w, rot] = layout.cards[c.id];
          return (
          <div
            key={c.id}
            ref={(n) => void (cards.current[i] = n)}
            className="home-card-wrap"
            style={{ left: x, top: y, width: w, ["--rot" as string]: rot, transform: `translate(-50%,-50%) rotate(${rot}deg)` }}
          >
            <Pop theme={theme} show={ready} delay={c.delay} origin="50% 100%" from={`translateY(1100px) rotate(${rot * 4}deg) scale(0.5)`}>
              <div className="home-card" role="img" aria-label={c.name}>
                {/* eslint-disable-next-line @next/next/no-img-element -- an AI illustration already on the page */}
                <img src={c.image} alt="" draggable={false} />
                <span className="home-card-tag" style={{ background: theme.ink, color: theme.onInk, fontFamily: theme.font }}>
                  {c.name}
                </span>
              </div>
            </Pop>
          </div>
          );
        })}
      </div>

      {/* the vehicle: still, it just fades in with the page */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 3, opacity: ready ? 1 : 0, transition: ease(theme, ["opacity"], theme.dur.slow) }}>
        <HomeScene show={ready} onReady={() => setCanvasReady(true)} />
      </div>

      {/* in front of the vehicle: the pill and the badge */}
      <div style={{ ...stageStyle(layout), zIndex: 4 }}>
        <div data-depth="30" style={{ position: "absolute", left: layout.pill[0], top: layout.pill[1], transform: "translate(-50%, -50%)", pointerEvents: "auto" }}>
          <div style={keepSize(0.85)}>
            <Pop theme={theme} show={ready} delay={1900} from="scale(0.4) translateY(40px)">
              <button type="button" className="ui-btn home-start" onClick={openGlobe}>
                start
              </button>
            </Pop>
          </div>
        </div>

        <div data-depth="24" style={{ position: "absolute", left: layout.badge[0], top: layout.badge[1], width: layout.badge[2], height: layout.badge[2], pointerEvents: "auto" }}>
          <div style={{ ...keepSize(0.58), width: "100%", height: "100%" }}>
          <Pop theme={theme} show={ready} delay={1750} from="scale(0.2) rotate(-90deg)">
            <button
              type="button"
              className="home-badge-btn"
              aria-label="Open the globe"
              onClick={openGlobe}
              onPointerEnter={() => (badgeHot.current = true)}
              onPointerLeave={() => (badgeHot.current = false)}
            >
              <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden>
                <defs>
                  <path id="home-ring" d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0" />
                </defs>
                <circle cx="100" cy="100" r="97" style={{ fill: theme.ink }} />
                <g ref={badge}>
                  <text style={{ fill: theme.surface, fontFamily: theme.font, fontWeight: 800, fontSize: 17, textTransform: "uppercase" }}>
                    <textPath href="#home-ring" textLength="436" lengthAdjust="spacing">
                      6 true stories · play the comic · tap to start ·
                    </textPath>
                  </text>
                </g>
                <circle cx="100" cy="100" r="36" style={{ fill: HOME.butter }} stroke={theme.surface} strokeWidth={3} />
                <path d="M84 100h30M104 88l12 12-12 12" fill="none" stroke={theme.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </Pop>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>
        <Sparkles colors={sparkleColors} />
      </div>

      {/* brand and the usual corner buttons */}
      <div className="home-brand" style={vp.compact ? { top: "max(12px, env(safe-area-inset-top))" } : undefined}>
        <Pop theme={theme} show={ready} delay={300} from="scale(0.4) translateY(-30px) rotate(-8deg)">
          <Logo theme={theme} size={vp.short ? 17 : vp.phone ? 21 : 26} onHome={() => {}} />
        </Pop>
      </div>
      <div className="fixed z-20 flex items-center gap-2" style={{ right: vp.compact ? "max(12px, env(safe-area-inset-right))" : 20, top: vp.compact ? "max(12px, env(safe-area-inset-top))" : 20 }}>
        <Pop theme={theme} show={ready} delay={1500} origin="right center" from="scale(0.5) rotate(-6deg) translateY(-14px)">
          <Credits iconOnly={vp.phone} />
        </Pop>
        <Pop theme={theme} show={ready} delay={1420} origin="right center" from="scale(0.5) rotate(6deg) translateY(-14px)">
          <AmbientButton />
        </Pop>
      </div>

      {/* loading: the same screen as the route's fallback, then it lifts */}
      <div
        className="absolute inset-0 z-40"
        style={{ background: theme.canvas, opacity: ready ? 0 : 1, pointerEvents: ready ? "none" : "auto", transition: ease(theme, ["opacity"], theme.dur.slow) }}
      >
        <LoadingContent title="Left behind" stage="Waking up the rovers" />
      </div>

      {/* travelling: the page melts into the field colour, the next one comes in from it */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-50"
        style={{ background: theme.canvas, opacity: leaving ? 1 : 0, transition: ease(theme, ["opacity"], theme.dur.base + 100) }}
      />
    </div>
  );
}
