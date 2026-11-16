"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { CARDS, CLOUD_BACK, CLOUD_FRONT, CLOUD_TILE, STAGE, bandPath, blobPath, over, pointer, stageScale, stageState } from "@/lib/home";
import { reducedMotion } from "@/lib/motion";
import { HOME, cssVars, themeFor } from "@/lib/themes";
import { ease } from "@/lib/ui";
import Ambient, { AmbientButton } from "./Ambient";
import Credits from "./Credits";
import HomeScene from "./HomeScene";
import { LoadingContent } from "./Loading";
import Logo from "./Logo";
import Pop from "./Pop";
import Sparkles from "./Sparkles";

/**
 * The home page (`/`): one composition, like the cover of a game. A big sun-coloured window (an organic blob with wisps of cloud, a moon and a lighter sun disc) sits
 * on the periwinkle field of the reference; the illustrations of the six stories lie around it as tilted cards of different sizes (they float, and straighten and
 * lift when touched; each one opens its story); four of the 3D vehicles stand among them (one canvas, see HomeScene); pink clouds drift in front. Almost no text:
 * the logo, a ring badge and a «start» pill. A click anywhere throws sparkles. Layout: a 1700 × 1000 stage scaled to the screen (`lib/home.ts`).
 * Design notes: docs/design.md («Home»).
 */

const BLOB_VB = "0 0 1000 700";
const BANDS = [
  { top: 205, thick: 46, a: 12, phase: 0.3, fill: HOME.pink, speed: -16 },
  { top: 262, thick: 34, a: 9, phase: 1.7, fill: HOME.orange, speed: 11 },
  { top: 372, thick: 50, a: 14, phase: 2.6, fill: HOME.pink, speed: -9 },
  { top: 452, thick: 32, a: 10, phase: 4.0, fill: HOME.orange, speed: 13 },
];
const CLOUDS = {
  back: { base: 890, speed: 9, depth: 16 },
  front: { base: 945, speed: -15, depth: 34 },
};

const stageStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: STAGE.w,
  height: STAGE.h,
  transform: "translate(-50%, -50%) scale(var(--s, 1))",
  pointerEvents: "none",
};

export default function Home() {
  const router = useRouter();
  const theme = useMemo(() => themeFor("home"), []);
  const [canvasReady, setCanvasReady] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ready = (canvasReady && imagesReady) || timedOut;

  const root = useRef<HTMLDivElement>(null);
  const blobDef = useRef<SVGPathElement>(null);
  const bands = useRef<(SVGGElement | null)[]>([]);
  const clouds = useRef<{ back: HTMLDivElement | null; front: HTMLDivElement | null }>({ back: null, front: null });
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
  useEffect(() => {
    stageState.go = ready;
    return () => {
      stageState.go = false;
    };
  }, [ready]);

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
        if (!n) return;
        const d = 6 + c.w / 22;
        const bob = Math.sin(t * c.speed + c.phase) * c.amp;
        const wob = Math.sin(t * 0.7 + c.phase) * 0.9;
        n.style.transform = `translate(-50%,-50%) translate3d(${(-cx * d).toFixed(2)}px,${(-cy * d * 0.6 + bob).toFixed(2)}px,0) rotate(${(c.rot + wob).toFixed(2)}deg)`;
      });
      blobDef.current?.setAttribute("d", blobPath(t));
      BANDS.forEach((b, i) => bands.current[i]?.setAttribute("transform", `translate(${((((t * b.speed) % 1000) + 1000) % 1000) - 1000} 0)`));
      for (const key of ["back", "front"] as const) {
        const n = clouds.current[key];
        if (n) n.style.transform = `translate3d(${((((t * CLOUDS[key].speed) % CLOUD_TILE) + CLOUD_TILE) % CLOUD_TILE) - CLOUD_TILE}px,0,0)`;
      }
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

  const hoverVehicle = useCallback((on: boolean) => {
    if (root.current) root.current.style.cursor = on ? "pointer" : "";
  }, []);
  const sparkleColors = useMemo(() => ({ paper: theme.surface, accent: HOME.sunGlow, ink: theme.ink }), [theme]);
  const mapped = useMemo(() => ({ ...cssVars(theme), background: theme.canvas }) as CSSProperties, [theme]);

  return (
    <div ref={root} className="fixed inset-0 select-none overflow-hidden" style={{ ...mapped, fontFamily: theme.font }}>
      <Ambient track="mars" />

      {/* behind the vehicles: the window, the back clouds and the cards */}
      <div style={{ ...stageStyle, zIndex: 2 }}>
        <div data-depth="8" style={{ position: "absolute", left: 250, top: 60, width: 1200 }}>
          <Pop theme={theme} show={ready} delay={250} origin="50% 100%" from="scale(0.4) translateY(200px) rotate(-3deg)">
            <svg viewBox={BLOB_VB} width="100%" aria-hidden style={{ display: "block", overflow: "visible" }}>
              <defs>
                <path ref={blobDef} id="home-blob" d={blobPath(0)} />
                <clipPath id="home-clip">
                  <use href="#home-blob" />
                </clipPath>
              </defs>
              <use href="#home-blob" fill={HOME.sun} />
              <g clipPath="url(#home-clip)">
                <circle cx="690" cy="215" r="240" fill={HOME.sunGlow} />
                <g transform="translate(800 118)">
                  <circle r="40" fill={theme.surface} />
                  <circle cx="17" cy="-9" r="35" fill={HOME.sunGlow} />
                </g>
                {BANDS.map((b, i) => (
                  <g key={i} ref={(n) => void (bands.current[i] = n)}>
                    <path d={bandPath(b.top, b.thick, b.a, b.phase)} fill={b.fill} stroke={theme.ink} strokeWidth={2.5} strokeLinejoin="round" />
                  </g>
                ))}
              </g>
              <use href="#home-blob" fill="none" stroke={theme.ink} strokeWidth={5} strokeLinejoin="round" />
            </svg>
          </Pop>
        </div>

        <div data-depth={CLOUDS.back.depth} style={{ position: "absolute", left: -700, top: CLOUDS.back.base - 150, width: CLOUD_TILE * 2, height: 550 }}>
          <Pop theme={theme} show={ready} delay={500} from="translateY(260px)">
            <div ref={(n) => void (clouds.current.back = n)}>
              <svg viewBox={`0 -150 ${CLOUD_TILE * 2} 550`} width={CLOUD_TILE * 2} height={550} aria-hidden style={{ display: "block", overflow: "visible" }}>
                <path d={CLOUD_BACK} fill={HOME.pinkSoft} stroke={theme.ink} strokeWidth={3} strokeLinejoin="round" />
              </svg>
            </div>
          </Pop>
        </div>

        {CARDS.map((c, i) => (
          <div
            key={c.id}
            ref={(n) => void (cards.current[i] = n)}
            className="home-card-wrap"
            style={{ left: c.x, top: c.y, width: c.w, ["--rot" as string]: c.rot, transform: `translate(-50%,-50%) rotate(${c.rot}deg)` }}
          >
            <Pop theme={theme} show={ready} delay={c.delay} origin="50% 100%" from={`translateY(1100px) rotate(${c.rot * 4}deg) scale(0.5)`}>
              <button
                type="button"
                className="home-card"
                aria-label={`${c.name}: open its story`}
                onClick={() => {
                  if (!over.vehicle) go(`/${c.world}/${c.id}`);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- an AI illustration already on the page */}
                <img src={c.image} alt="" draggable={false} />
                <span className="home-card-tag" style={{ background: theme.ink, color: theme.onInk, fontFamily: theme.font }}>
                  {c.name}
                </span>
              </button>
            </Pop>
          </div>
        ))}
      </div>

      {/* the vehicles */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 3 }}>
        <HomeScene source={root} hover={hoverVehicle} onReady={() => setCanvasReady(true)} />
      </div>

      {/* in front of the vehicles: the pink clouds, the pill and the badge */}
      <div style={{ ...stageStyle, zIndex: 4 }}>
        <div data-depth={CLOUDS.front.depth} style={{ position: "absolute", left: -700, top: CLOUDS.front.base - 150, width: CLOUD_TILE * 2, height: 550 }}>
          <Pop theme={theme} show={ready} delay={650} from="translateY(300px)">
            <div ref={(n) => void (clouds.current.front = n)}>
              <svg viewBox={`0 -150 ${CLOUD_TILE * 2} 550`} width={CLOUD_TILE * 2} height={550} aria-hidden style={{ display: "block", overflow: "visible" }}>
                <path d={CLOUD_FRONT} fill={HOME.pink} stroke={theme.ink} strokeWidth={3.5} strokeLinejoin="round" />
              </svg>
            </div>
          </Pop>
        </div>

        <div data-depth="30" style={{ position: "absolute", left: 850, top: 950, transform: "translate(-50%, -50%)", pointerEvents: "auto" }}>
          <Pop theme={theme} show={ready} delay={1900} from="scale(0.4) translateY(40px)">
            <button type="button" className="ui-btn home-start" onClick={openGlobe}>
              start
            </button>
          </Pop>
        </div>

        <div data-depth="24" style={{ position: "absolute", left: 330, top: 96, width: 150, height: 150, pointerEvents: "auto" }}>
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

      <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>
        <Sparkles colors={sparkleColors} />
      </div>

      {/* brand and the usual corner buttons */}
      <div className="home-brand">
        <Pop theme={theme} show={ready} delay={300} from="scale(0.4) translateY(-30px) rotate(-8deg)">
          <Logo theme={theme} size={26} onHome={() => {}} />
        </Pop>
      </div>
      <div className="fixed right-5 top-5 z-20 flex items-start gap-2">
        <Pop theme={theme} show={ready} delay={1500} origin="right center" from="scale(0.5) rotate(-6deg) translateY(-14px)">
          <Credits />
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
