"use client";

import { useState, useSyncExternalStore } from "react";
import { getGuide, subscribeGuide } from "@/lib/guide";
import { getNarration, subscribeNarration } from "@/lib/narration";
import type { Theme } from "@/lib/themes";
import { ease } from "@/lib/ui";

/**
 * On-screen transcript of everything the voice says (bottom centre, floating above the dock): the story narrator while a checkpoint
 * clip plays, otherwise the mission-control guide. They never overlap (the guide stays quiet during a narration).
 */
export default function Captions({ theme, wide = false }: { theme: Theme; wide?: boolean }) {
  const guide = useSyncExternalStore(subscribeGuide, getGuide, getGuide);
  const nar = useSyncExternalStore(subscribeNarration, getNarration, getNarration);
  const who = nar.caption ? "Narrator" : "Guide";
  const text = nar.caption || guide.caption;

  // keep the last text so the caption can fade out without going blank first
  const [shown, setShown] = useState({ who, text });
  if (text && (text !== shown.text || who !== shown.who)) setShown({ who, text });

  return (
    <div
      aria-live="polite"
      style={{
        fontFamily: theme.font,
        opacity: text ? 1 : 0,
        transform: `translate(-50%, ${text ? "0" : "10px"})`,
        transition: `${ease(theme, ["opacity"])}, ${ease(theme, ["transform"], theme.dur.slow)}`,
        background: theme.ink,
        borderRadius: 24,
        color: theme.onInk,
      }}
      className={`pointer-events-none absolute bottom-full left-1/2 mb-2.5 flex select-none ${wide ? "w-max max-w-[min(780px,92vw)]" : "max-w-[min(600px,88vw)]"} items-center gap-3 py-2.5 pl-2.5 pr-5 text-[15px] font-semibold leading-snug`}
    >
      <span
        style={{
          background: shown.who === "Narrator" ? theme.onInk : theme.accent,
          color: theme.accentInk,
          borderRadius: theme.radiusSm,
          padding: "6px 10px",
          fontFamily: theme.mono,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.01em",
          textTransform: "lowercase",
          lineHeight: 1,
          whiteSpace: "nowrap",
          transition: ease(theme, ["background-color"]),
        }}
      >
        {shown.who}
      </span>
      <span style={{ letterSpacing: "-0.01em" }}>{shown.text}</span>
    </div>
  );
}
