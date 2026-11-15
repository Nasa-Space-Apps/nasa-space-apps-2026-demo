"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getAmbient, releaseAmbient, setAmbient, subscribeAmbient, toggleAmbient } from "@/lib/ambient";
import type { AmbientTrack } from "@/lib/ambient-tracks";
import Icon from "./Icon";

/** Mount it where a place is shown: plays that place's background bed while mounted and listens for the S key. Renders nothing. */
export default function Ambient({ track }: { track: AmbientTrack["id"] }) {
  useEffect(() => {
    setAmbient(track);
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.code === "KeyS") toggleAmbient();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      releaseAmbient(track);
    };
  }, [track]);
  return null;
}

/** Music on/off button for the globe view (the scene uses the `S` key and its chip in the key hints). */
export function AmbientButton() {
  const { enabled } = useSyncExternalStore(subscribeAmbient, getAmbient, getAmbient);
  return (
    <button
      type="button"
      className="ui-fab ui-fab-md"
      aria-pressed={enabled}
      aria-label={enabled ? "Music on: press to mute" : "Music off: press to play"}
      title={enabled ? "Music on (S)" : "Music off (S)"}
      onClick={(e) => {
        e.currentTarget.blur();
        toggleAmbient();
      }}
    >
      <Icon name={enabled ? "sound" : "sound-off"} size={22} />
    </button>
  );
}
