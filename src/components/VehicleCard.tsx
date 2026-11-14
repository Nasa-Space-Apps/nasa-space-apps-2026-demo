"use client";

import { useEffect, useRef } from "react";
import type { AbandonedVehicle } from "@/lib/bodies";
import type { Mission } from "@/lib/missions";
import { reducedMotion } from "@/lib/motion";
import type { Theme } from "@/lib/themes";
import { ui } from "@/lib/ui";
import Icon from "./Icon";
import VehicleView from "./VehicleView";

/** Floating card shown when a vehicle is selected on the globe: the vehicle drawn in 3 flat tones, its story and the way back in time. Closes with its X. */
export default function VehicleCard({
  theme,
  mission,
  vehicle,
  bodyName,
  onTravel,
  onClose,
}: {
  theme: Theme;
  mission: Mission;
  vehicle: AbandonedVehicle;
  bodyName: string;
  onTravel: () => void;
  onClose: () => void;
}) {
  const { label, title, text, panel, frame } = ui(theme);

  // the arrow of the main button nudges every few seconds, like a game prompt asking to be pressed (Web Animations API: new @keyframes are not picked up in dev)
  const nudge = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = nudge.current;
    if (!el || reducedMotion()) return;
    const a = el.animate(
      [
        { transform: "translateX(0)", offset: 0 },
        { transform: "translateX(0)", offset: 0.55 },
        { transform: "translateX(7px)", offset: 0.65 },
        { transform: "translateX(0)", offset: 0.75 },
        { transform: "translateX(5px)", offset: 0.85 },
        { transform: "translateX(0)", offset: 1 },
      ],
      { duration: 2600, iterations: Infinity, easing: "ease-out" },
    );
    return () => a.cancel();
  }, []);

  return (
    <div style={{ ...panel, padding: 12, fontFamily: theme.font, rotate: "0.6deg" /* a page floating beside its vehicle */ }} className="w-full select-none">
      <div className="mb-3 flex items-center justify-between pl-1 pt-0.5">
        <span style={label}>abandoned · {bodyName}</span>
        <button type="button" className="ui-fab ui-fab-sm" aria-label="Close" title="Close (Esc)" onClick={onClose}>
          <Icon name="close" size={14} />
        </button>
      </div>

      <div style={frame}>
        <VehicleView config={mission.rover} label={`${vehicle.name}, illustrated`} />
      </div>

      <div className="px-1">
        <div style={{ ...title, marginTop: 16 }}>{vehicle.name}</div>
        <div style={{ ...label, marginTop: 8 }}>{vehicle.place}</div>
        <p style={{ ...text, marginTop: 12, color: theme.muted }}>{vehicle.status}</p>

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3.5">
          {vehicle.facts.map(([k, v]) => (
            <div key={k}>
              <span style={{ ...label, display: "block" }}>{k}</span>
              <span style={{ marginTop: 6, display: "block", fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, color: theme.ink }}>{v}</span>
            </div>
          ))}
        </div>

        <button type="button" className="ui-btn" onClick={onTravel} style={{ marginTop: 18, marginBottom: 4, width: "100%", justifyContent: "space-between" }}>
          Travel to the past
          <span ref={nudge} className="flex">
            <Icon className="ui-arrow" name="arrow-right" size={18} />
          </span>
        </button>
      </div>
    </div>
  );
}
