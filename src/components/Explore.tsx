"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BODIES } from "@/lib/bodies";
import { MISSIONS } from "@/lib/missions";
import { PERF } from "@/lib/perf";
import { storyOf } from "@/lib/story";
import { useTheme } from "@/lib/use-theme";
import { useViewport } from "@/lib/viewport";
import { ease } from "@/lib/ui";
import Ambient, { AmbientButton } from "./Ambient";
import Credits from "./Credits";
import Globe, { globeShift } from "./Globe";
import GlobeLabels, { floating } from "./GlobeLabels";
import Logo from "./Logo";
import Pop from "./Pop";
import VehicleCard from "./VehicleCard";

/**
 * The globe view (/moon, /mars): the menu before the story. Just the globe with a tiny vehicle standing at each abandoned site, a text switch for the
 * world (Mars / Moon) and a one-line hint. Clicking a vehicle opens its card, floating beside it, and locks the globe: the card closes with its X, a
 * click anywhere outside it, or Esc. Everything pops in and out with the game-like `pop` curve.
 * The body lives in the URL (`pushState`, no remount); the selected vehicle in the hash (/moon#sev) so "back from the trip" reopens its card.
 */
export default function Explore({ initialBodyId }: { initialBodyId: string }) {
  const pathname = usePathname();
  // Next keeps this view alive (hidden) while a scene is open; the light perf profile releases the globe's WebGL canvas meanwhile (lib/perf.ts)
  const active = BODIES.some((b) => pathname === `/${b.id}`);
  if (PERF.releaseHiddenViews && !active) return null;
  return <ExploreView initialBodyId={initialBodyId} />;
}

/** Ref callback of the floating card's element: the globe moves it every frame (no React renders per frame). */
const regFloat = (el: HTMLElement | null) => {
  floating.el = el;
  floating.placed = false;
};

function ExploreView({ initialBodyId }: { initialBodyId: string }) {
  const theme = useTheme();
  const vp = useViewport();
  const router = useRouter();
  const pathname = usePathname();

  const body = BODIES.find((b) => pathname === `/${b.id}`) ?? BODIES.find((b) => b.id === initialBodyId) ?? BODIES[0];
  const [picked, setPicked] = useState<string | null>(null); // vehicle whose card is open
  const [facing, setFacing] = useState<string | null>(null); // vehicle the globe turns towards on arrival (coming back from the trip); never set by a click
  const [cardId, setCardId] = useState<string | null>(null); // card kept mounted a moment after closing, so it can pop out
  const [leaving, setLeaving] = useState(false); // fade to the canvas colour before travelling
  const timer = useRef(0);
  const closeTimer = useRef(0);
  const openedAt = useRef(0);
  useEffect(() => {
    // coming back from the trip (/mars#opportunity): Next updates the URL after this component first renders, so read the hash once mounted.
    // Next also keeps this view alive (with its state) while the scene is open and re-runs this effect when it comes back: the travel fade
    // must be released then, or the page stays covered (blank) after "← Globe" or the browser's Back button.
    const id = window.location.hash.slice(1);
    /* eslint-disable react-hooks/set-state-in-effect -- sync from the URL / reset after coming back */
    if (id) {
      setPicked(id);
      setFacing(id);
      setCardId(id);
    }
    setLeaving(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(closeTimer.current);
    };
  }, []);
  // a sheet covers the lower part of a phone held upright (or the right side of one held sideways): the globe moves out of its way while a card is open
  useEffect(() => {
    const open = picked !== null && vp.compact;
    globeShift.tx = open && vp.short ? -vp.w * 0.2 : 0;
    globeShift.ty = open && !vp.short ? Math.min(vp.h * 0.2, 170) : 0;
    return () => {
      globeShift.tx = 0;
      globeShift.ty = 0;
    };
  }, [picked, vp.compact, vp.short, vp.w, vp.h]);
  // on a small screen the card is a sheet (CSS), not a page floating beside its vehicle: the globe must not move it
  useEffect(() => {
    if (vp.compact) floating.el = null;
  }, [vp.compact]);
  const cardVehicle = body.vehicles.find((v) => v.missionId === cardId) ?? null;
  const cardMission = MISSIONS.find((m) => m.id === cardVehicle?.missionId) ?? null;

  const select = (id: string | null) => {
    window.clearTimeout(closeTimer.current);
    setPicked(id);
    if (id) {
      openedAt.current = performance.now();
      setCardId(id);
    } else {
      closeTimer.current = window.setTimeout(() => setCardId(null), theme.dur.base); // let the card pop out first
    }
    window.history.replaceState(null, "", `/${body.id}${id ? `#${id}` : ""}`);
  };
  const switchBody = (id: string) => {
    if (id === body.id) return;
    window.clearTimeout(closeTimer.current);
    setPicked(null);
    setCardId(null);
    setFacing(null);
    window.history.pushState(null, "", `/${id}`); // Next syncs usePathname with the History API
  };
  const travel = () => {
    if (!cardMission || leaving || !storyOf(cardMission.id)) return; // vehicles without a story are «coming soon»: no way into their demo 3D
    setLeaving(true);
    timer.current = window.setTimeout(() => router.push(`/${body.id}/${cardMission.id}`), theme.dur.base + 150);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.code === "Escape") select(null);
    };
    // a click anywhere outside the open card closes it (the click that opened it, on a vehicle, is ignored; clicking another vehicle just switches)
    const onClick = (e: MouseEvent) => {
      if (picked === null || performance.now() - openedAt.current < 150) return;
      if (floating.el?.contains(e.target as Node)) return;
      select(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  });

  return (
    <div className="fixed inset-0 select-none" style={{ background: theme.globe.bg }}>
      <Globe body={body} selectedId={picked} faceId={facing} theme={theme} onSelect={select} />
      <GlobeLabels theme={theme} />
      <Ambient track={body.id === "mars" ? "mars" : "moon"} />

      {/* the world switch, just text; the current world wears a highlighter. Top left on wide screens; at the bottom, in reach of the thumb, on compact ones */}
      <div
        className="fixed z-10 flex items-center gap-1"
        role="tablist"
        aria-label="World"
        style={{
          fontFamily: theme.font,
          ...(vp.compact
            ? { left: 0, right: 0, margin: "0 auto", width: "fit-content", bottom: "calc(max(14px, env(safe-area-inset-bottom)) + 46px)", pointerEvents: picked === null ? "auto" : "none" }
            : { left: 20, top: 20 }),
        }}
      >
        {BODIES.map((b, i) => (
          <Pop key={b.id} theme={theme} show={!vp.compact || picked === null} delay={i * 90} origin={vp.compact ? "center bottom" : "left center"} from={vp.compact ? "scale(0.4) translateY(20px)" : "scale(0.4) rotate(-10deg) translateY(-16px)"}>
            <button
              type="button"
              role="tab"
              aria-selected={b.id === body.id}
              className={`ui-world ${b.id === body.id ? "is-active" : ""}`}
              style={vp.compact ? { fontSize: 26, padding: "6px 18px 8px" } : undefined}
              onClick={(e) => {
                e.currentTarget.blur();
                switchBody(b.id);
              }}
            >
              {b.name}
            </button>
          </Pop>
        ))}
      </div>

      {/* top centre: the brand mark, back to the home page */}
      <div
        className="fixed z-10"
        style={vp.compact ? { left: "max(12px, env(safe-area-inset-left))", top: "max(12px, env(safe-area-inset-top))" } : { left: 0, right: 0, top: 16, margin: "0 auto", width: "fit-content" }}
      >
        <Pop theme={theme} delay={150} origin="center top" from="scale(0.4) translateY(-24px) rotate(-8deg)">
          <Logo theme={theme} size={vp.compact ? 18 : 20} />
        </Pop>
      </div>

      <div className="fixed z-10 flex items-center gap-2" style={{ fontFamily: theme.font, right: vp.compact ? "max(12px, env(safe-area-inset-right))" : 20, top: vp.compact ? "max(12px, env(safe-area-inset-top))" : 20 }}>
        <Pop theme={theme} delay={300} origin="right center" from="scale(0.5) rotate(-6deg) translateY(-14px)">
          <Credits iconOnly={vp.phone} />
        </Pop>
        <Pop theme={theme} delay={220} origin="right center" from="scale(0.5) rotate(6deg) translateY(-14px)">
          <AmbientButton />
        </Pop>
      </div>

      {/* bottom centre: what to do (it hops away while a card is open and back when it closes) */}
      <div className="pointer-events-none fixed left-1/2 z-10" style={{ transform: "translateX(-50%)", bottom: vp.compact ? "max(14px, env(safe-area-inset-bottom))" : 24, maxWidth: "96vw" }}>
        <Pop theme={theme} show={picked === null} delay={350} from="scale(0.5) translateY(40px)" to="scale(0.7) translateY(30px)">
          <span
            className="flex items-center gap-2 whitespace-nowrap"
            style={{
              background: theme.ink,
              color: theme.onInk,
              borderRadius: theme.radiusSm,
              padding: vp.phone ? "10px 16px" : "11px 22px",
              fontFamily: theme.font,
              fontSize: vp.phone ? 12.5 : 14,
              fontWeight: 700,
              letterSpacing: "0.01em",
              textTransform: "lowercase",
            }}
          >
            <span style={{ color: theme.accent }}>{body.name}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            drag to spin
            <span style={{ opacity: 0.4 }}>·</span>
            {vp.touch ? "pinch to zoom" : "scroll to zoom"}
            <span style={{ opacity: 0.4 }}>·</span>
            {vp.touch ? "tap a vehicle" : "click a vehicle"}
          </span>
        </Pop>
      </div>

      {/* the vehicle's card, floating beside it: the globe positions this wrapper (it never follows the pointer), the card inside pops in and out */}
      {cardVehicle && cardMission && (
        <div
          ref={vp.compact ? undefined : regFloat}
          className={`pointer-events-none fixed z-20 ${vp.compact ? "" : "left-0 top-0 w-[clamp(280px,26vw,360px)]"}`}
          style={
            vp.compact
              ? vp.short
                ? { right: "max(12px, env(safe-area-inset-right))", top: 12, bottom: 12, width: "min(390px, 46vw)", overflowY: "auto", fontFamily: theme.font }
                : { left: 0, right: 0, bottom: 0, margin: "0 auto", width: "min(470px, calc(100vw - 20px))", padding: "0 0 max(10px, env(safe-area-inset-bottom))", fontFamily: theme.font }
              : { opacity: 0, willChange: "transform", transition: ease(theme, ["opacity"]), fontFamily: theme.font }
          }
        >
          <Pop
            theme={theme}
            key={`card-${cardVehicle.missionId}`}
            show={picked !== null}
            origin={vp.compact && !vp.short ? "center bottom" : "left center"}
            from={vp.compact ? (vp.short ? "scale(0.6) translateX(40px)" : "scale(0.7) translateY(80px)") : "scale(0.3) rotate(-8deg) translateX(-30px)"}
            to={vp.compact ? (vp.short ? "scale(0.6) translateX(40px)" : "scale(0.8) translateY(60px)") : "scale(0.6) rotate(5deg) translateX(-20px)"}
            style={{ pointerEvents: picked !== null ? "auto" : "none" }}
          >
            <VehicleCard theme={theme} mission={cardMission} vehicle={cardVehicle} bodyName={body.name} soon={!storyOf(cardMission.id)} compact={vp.compact} onTravel={travel} onClose={() => select(null)} />
          </Pop>
        </div>
      )}

      {/* travelling: the view melts into the canvas colour, the scene fades in from the same colour */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30"
        style={{ background: theme.canvas, opacity: leaving ? 1 : 0, transition: ease(theme, ["opacity"], theme.dur.base + 100) }}
      />
    </div>
  );
}
