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
          className="flex items-center gap-2 uppercase"
          style={{
            background: theme.surface,
            color: on ? theme.ink : theme.muted,
            borderRadius: theme.radiusSm,
            padding: "4px 10px 4px 4px",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.02em",
            lineHeight: 1,
            transition: ease(theme, ["color"]),
          }}
        >
          <span
            style={{
              background: on ? theme.ink : theme.line,
              color: on ? theme.canvas : theme.muted,
              borderRadius: theme.radiusSm,
              padding: "6px 8px",
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

/** Navigation bar (top left): ink bar with the way back to the globe and the vehicle picker. */
export function TopBar({
  theme,
  onGlobe,
  items,
  value,
  onChange,
}: {
  theme: Theme;
  onGlobe: () => void;
  items: SelectItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = items.find((i) => i.id === value) ?? items[0];

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
    color: theme.canvas,
    border: 0,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    fontFamily: theme.mono,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.02em",
    textTransform: "uppercase" as const,
    transition: ease(theme, ["background-color"], theme.dur.fast),
  };

  return (
    <div
      ref={root}
      className="relative select-none"
      style={{ background: theme.ink, borderRadius: theme.radius, display: "flex", alignItems: "stretch", fontFamily: theme.mono }}
    >
      <button
        type="button"
        className="ui-nav"
        style={{ ...cell, borderRadius: `${theme.radius}px 0 0 ${theme.radius}px` }}
        onClick={(e) => {
          e.currentTarget.blur();
          onGlobe();
        }}
      >
        <Icon name="arrow-left" size={16} /> Globe
      </button>
      <span style={{ width: 1, background: "rgba(249,250,247,0.18)", margin: "10px 0" }} />
      <button
        type="button"
        className="ui-nav"
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ ...cell, borderRadius: `0 ${theme.radius}px ${theme.radius}px 0` }}
        onClick={(e) => {
          setOpen((o) => !o);
          e.currentTarget.blur(); // keep Space/Enter for driving
        }}
      >
        <span style={{ opacity: 0.55 }}>Vehicle</span>
        <span style={{ fontFamily: theme.font, textTransform: "none", fontSize: 14, letterSpacing: "-0.02em" }}>{current.name}</span>
        <Icon name="chevron-down" size={14} style={{ opacity: 0.55, transform: open ? "rotate(180deg)" : "none", transition: ease(theme, ["transform"], theme.dur.fast) }} />
      </button>

      <ul
        role="listbox"
        className="absolute left-0 top-full mt-2 min-w-full list-none p-1"
        style={{
          background: theme.surface,
          borderRadius: theme.radius,
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
              style={{ fontFamily: theme.font, fontSize: 14, letterSpacing: "-0.02em" }}
            >
              <span className="flex-1 whitespace-nowrap">{it.name}</span>
              <span style={{ fontFamily: theme.mono, fontSize: 11, opacity: 0.55 }}>{i === 0 ? "M" : ""}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
