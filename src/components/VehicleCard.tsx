"use client";

import type { AbandonedVehicle } from "@/lib/bodies";
import type { Mission } from "@/lib/missions";
import type { Theme } from "@/lib/themes";
import { ui } from "@/lib/ui";
import Icon from "./Icon";
import VehicleView from "./VehicleView";

/** Left card shown when a vehicle is selected on the globe: the vehicle drawn in 3 flat tones (still isometric view), its story and the way back in time. */
export default function VehicleCard({
  theme,
  mission,
  vehicle,
  bodyName,
  onTravel,
  onBack,
}: {
  theme: Theme;
  mission: Mission;
  vehicle: AbandonedVehicle;
  bodyName: string;
  onTravel: () => void;
  onBack: () => void;
}) {
  const { label, title, text, panel, frame } = ui(theme);

  return (
    <div style={{ ...panel, padding: 12, fontFamily: theme.font }} className="w-full select-none">
      <div className="mb-3 flex items-center justify-between px-1 pt-1">
        <button type="button" className="ui-link is-back" onClick={onBack}>
          <Icon className="ui-arrow" name="arrow-left" size={14} />
          Back
        </button>
        <span style={label}>Abandoned · {bodyName}</span>
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
          <Icon className="ui-arrow" name="arrow-right" size={18} />
        </button>
      </div>
    </div>
  );
}
