"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getAmbient, subscribeAmbient } from "@/lib/ambient";
import { getGuide, subscribeGuide } from "@/lib/guide";
import { getNarration, subscribeNarration } from "@/lib/narration";
import type { Theme } from "@/lib/themes";
import { ease } from "@/lib/ui";
import Icon from "./Icon";

/** Key hints (bottom centre): the key in an ink block, its action beside it. */
export function Hints({ theme }: { theme: Theme }) {
  const narration = useSyncExternalStore(subscribeNarration, getNarration, getNarration);
  const guide = useSyncExternalStore(subscribeGuide, getGuide, getGuide);
  const ambient = useSyncExternalStore(subscribeAmbient, getAmbient, getAmbient);
  const items: [string, string, boolean][] = [
    ["Space", "Hold to drive", true],
    ["N", narration.enabled ? "Narration on" : "Narration off", narration.enabled],
    ["G", guide.enabled ? "Guide on" : "Guide off", guide.enabled],
    ["S", ambient.enabled ? "Music on" : "Music off", ambient.enabled],
  ];
  return (
    <div className="flex select-none flex-wrap justify-center gap-1.5" style={{ fontFamily: theme.mono }}>
      {items.map(([k, l, on]) => (
        <span
          key={k}
          className="flex items-center gap-2"
          style={{
            background: theme.ink,
            color: theme.onInk,
            opacity: on ? 1 : 0.6,
            borderRadius: theme.radiusSm,
            padding: "4px 14px 4px 4px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.01em",
            textTransform: "lowercase",
            lineHeight: 1,
            transition: ease(theme, ["opacity"]),
          }}
        >
          <span
            style={{
              background: on ? theme.accent : theme.onInk,
              color: theme.ink,
              borderRadius: theme.radiusSm,
              padding: "7px 10px",
              transition: ease(theme, ["background-color", "color"]),
            }}
          >
            {k}
          </span>
          {l}
        </span>
      ))}
    </div>
  );
}

export type SelectItem = { id: string; name: string };

/** Navigation bar (top left): ink bar with the way back (to the globe, or to the story's comic) and, unless `items` is left out, the vehicle picker. */
export function TopBar({
  theme,
  onGlobe,
  backLabel = "Globe",
  items,
  value,
  onChange,
}: {
  theme: Theme;
  onGlobe: () => void;
  backLabel?: string;
  items?: SelectItem[];
  value?: string;
  onChange?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = items?.find((i) => i.id === value) ?? items?.[0];

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [open]);

  const cell = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    height: 40,
    padding: "0 14px",
    color: theme.onInk,
    border: 0,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    fontFamily: theme.mono,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.01em",
    textTransform: "lowercase" as const,
    transition: ease(theme, ["background-color"], theme.dur.fast),
  };

  return (
    <div
      ref={root}
      className="relative select-none"
      style={{ background: theme.ink, borderRadius: theme.radiusSm, display: "flex", alignItems: "stretch", fontFamily: theme.mono }}
    >
      <button
        type="button"
        className="ui-nav"
        style={{ ...cell, borderRadius: items ? `${theme.radiusSm}px 0 0 ${theme.radiusSm}px` : theme.radiusSm, paddingLeft: 18, paddingRight: items ? 14 : 20 }}
        onClick={(e) => {
          e.currentTarget.blur();
          onGlobe();
        }}
      >
        <Icon name="arrow-left" size={16} /> {backLabel}
      </button>
      {items && current && onChange && (
        <>
      <span style={{ width: 1, background: theme.onInk, opacity: 0.25, margin: "10px 0" }} />
      <button
        type="button"
        className="ui-nav"
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ ...cell, borderRadius: `0 ${theme.radiusSm}px ${theme.radiusSm}px 0`, paddingRight: 18 }}
        onClick={(e) => {
          setOpen((o) => !o);
          e.currentTarget.blur(); // keep Space/Enter for driving
        }}
      >
        <span style={{ opacity: 0.55 }}>Vehicle</span>
        <span style={{ textTransform: "none", fontSize: 15, letterSpacing: "-0.02em" }}>{current.name}</span>
        <Icon name="chevron-down" size={14} style={{ opacity: 0.55, transform: open ? "rotate(180deg)" : "none", transition: ease(theme, ["transform"], theme.dur.fast) }} />
      </button>

      <ul
        role="listbox"
        className="absolute left-0 top-full mt-2 min-w-full list-none p-1"
        style={{
          background: theme.surface,
          border: `${theme.stroke}px solid ${theme.ink}`,
          borderRadius: theme.radius * 3,
          color: theme.ink,
          opacity: open ? 1 : 0,
          transform: open ? "none" : "translateY(-6px)",
          visibility: open ? "visible" : "hidden",
          pointerEvents: open ? "auto" : "none",
          transition: `${ease(theme, ["opacity", "transform"])}, visibility 0s linear ${open ? 0 : theme.dur.base}ms`,
        }}
      >
        {items.map((it, i) => (
          <li key={it.id}>
            <button
              type="button"
              role="option"
              aria-selected={it.id === value}
              tabIndex={open ? 0 : -1}
              className={`ui-row ${it.id === value ? "is-active" : ""}`}
              onClick={(e) => {
                onChange(it.id);
                setOpen(false);
                e.currentTarget.blur();
              }}
              style={{ fontFamily: theme.font, fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              <span className="flex-1 whitespace-nowrap">{it.name}</span>
              <span style={{ fontFamily: theme.mono, fontSize: 12, opacity: 0.55 }}>{i === 0 ? "M" : ""}</span>
            </button>
          </li>
        ))}
      </ul>
        </>
      )}
    </div>
  );
}
