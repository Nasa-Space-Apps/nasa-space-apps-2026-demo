"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BODIES } from "@/lib/bodies";
import { MISSIONS } from "@/lib/missions";
import { PERF } from "@/lib/perf";
import { THEME as theme } from "@/lib/themes";
import { ease, ui } from "@/lib/ui";
import Ambient, { AmbientButton } from "./Ambient";
import Globe from "./Globe";
import Icon from "./Icon";
import GlobeLabels from "./GlobeLabels";
import Reveal from "./Reveal";
import VehicleCard from "./VehicleCard";

/**
 * The globe view (/moon, /mars): one globe, a body selector on the left, and — when a vehicle is picked (marker or list) — its card.
 * The body lives in the URL (`pushState`, no remount); the selected vehicle in the hash (/moon#sev) so "back from the trip" reopens its card.
 */
export default function Explore({ initialBodyId }: { initialBodyId: string }) {
  const pathname = usePathname();
  // Next keeps this view alive (hidden) while a scene is open; the light perf profile releases the globe's WebGL canvas meanwhile (lib/perf.ts)
  const active = BODIES.some((b) => pathname === `/${b.id}`);
  if (PERF.releaseHiddenViews && !active) return null;
  return <ExploreView initialBodyId={initialBodyId} />;
}

function ExploreView({ initialBodyId }: { initialBodyId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { label, display, text, panel, title } = ui(theme);

  const body = BODIES.find((b) => pathname === `/${b.id}`) ?? BODIES.find((b) => b.id === initialBodyId) ?? BODIES[0];
  const [picked, setPicked] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false); // fade to the canvas colour before travelling
  const timer = useRef(0);
  useEffect(() => {
    // coming back from the trip (/mars#opportunity): Next updates the URL after this component first renders, so read the hash once mounted.
    // Next also keeps this view alive (with its state) while the scene is open and re-runs this effect when it comes back: the travel fade
    // must be released then, or the page stays covered (blank) after "← Globe" or the browser's Back button.
    const id = window.location.hash.slice(1);
    /* eslint-disable react-hooks/set-state-in-effect -- sync from the URL / reset after coming back */
    if (id) setPicked(id);
    setLeaving(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => window.clearTimeout(timer.current);
  }, []);
  const vehicle = body.vehicles.find((v) => v.missionId === picked) ?? null;
  const mission = MISSIONS.find((m) => m.id === vehicle?.missionId) ?? null;

  const select = (id: string | null) => {
    setPicked(id);
    window.history.replaceState(null, "", `/${body.id}${id ? `#${id}` : ""}`);
  };
  const switchBody = (id: string) => {
    if (id === body.id) return;
    setPicked(null);
    window.history.pushState(null, "", `/${id}`); // Next syncs usePathname with the History API
  };
  const travel = () => {
    if (!mission || leaving) return;
    setLeaving(true);
    timer.current = window.setTimeout(() => router.push(`/${body.id}/${mission.id}`), theme.dur.base + 150);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.code === "Escape") select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="fixed inset-0 select-none" style={{ background: theme.globe.bg }}>
      <Globe body={body} selectedId={vehicle?.missionId ?? null} theme={theme} onSelect={select} />
      <GlobeLabels theme={theme} />
      <Ambient track={body.id === "mars" ? "mars" : "moon"} />
      <div className="fixed right-5 top-5 z-10 flex items-start gap-2" style={{ fontFamily: theme.font }}>
        <AmbientButton />
      </div>

      <div
        className="fixed left-5 top-5 z-10 flex max-h-[calc(100vh-40px)] w-[clamp(300px,28vw,400px)] flex-col gap-2 overflow-y-auto"
        style={{ fontFamily: theme.font }}
      >
        <Reveal theme={theme} style={panel}>
          <div style={display}>Left behind</div>
          <p
            style={{
              ...text,
              marginTop: vehicle ? 0 : 10,
              color: theme.muted,
              maxHeight: vehicle ? 0 : 90,
              opacity: vehicle ? 0 : 1,
              overflow: "hidden",
              transition: ease(theme, ["max-height", "opacity", "margin-top"]),
            }}
          >
            Robots that never came home. Pick a world, then a vehicle, and travel back to see how it got there.
          </p>
          <div role="tablist" aria-label="World" className="mt-4 flex gap-2">
            {BODIES.map((b) => {
              const active = b.id === body.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`ui-btn ${active ? "is-active" : "is-ghost"}`}
                  style={{ flex: 1 }}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    switchBody(b.id);
                  }}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </Reveal>

        {vehicle && mission ? (
          <Reveal theme={theme} key={`card-${vehicle.missionId}`}>
            <VehicleCard theme={theme} mission={mission} vehicle={vehicle} bodyName={body.name} onTravel={travel} onBack={() => select(null)} />
          </Reveal>
        ) : (
          <Reveal theme={theme} key={`body-${body.id}`} delay={90} style={panel}>
            <div className="flex items-baseline justify-between gap-3">
              <span style={title}>{body.name}</span>
              <span style={label}>{body.facts.map(([l, v]) => `${l} ${v}`).join(" · ")}</span>
            </div>
            <p style={{ ...text, marginTop: 10, color: theme.muted }}>{body.blurb}</p>
            <div style={{ ...label, marginTop: 18 }}>Abandoned here · drag to rotate</div>
            <ul className="mt-2.5 flex list-none flex-col gap-2 p-0">
              {body.vehicles.map((v) => (
                <li key={v.missionId}>
                  <button
                    type="button"
                    className="ui-btn"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      select(v.missionId);
                    }}
                    style={{ width: "100%", justifyContent: "space-between", textAlign: "left", padding: "14px 16px", textTransform: "none", fontFamily: theme.font }}
                  >
                    <span>
                      <span style={{ display: "block", fontSize: 18, fontWeight: 450, letterSpacing: "-0.03em" }}>{v.name}</span>
                      <span style={{ display: "block", marginTop: 6, fontFamily: theme.mono, fontSize: 11, letterSpacing: "0.02em", textTransform: "uppercase", opacity: 0.65 }}>
                        {v.place}
                      </span>
                    </span>
                    <Icon className="ui-arrow" name="arrow-right" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>

      {/* travelling: the view melts into the canvas colour, the scene fades in from the same colour */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30"
        style={{ background: theme.canvas, opacity: leaving ? 1 : 0, transition: ease(theme, ["opacity"], theme.dur.base + 100) }}
      />
    </div>
  );
}
