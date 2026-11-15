"use client";

import { useEffect, useRef, useState } from "react";
import { TEAM } from "@/lib/team";
import { useTheme } from "@/lib/use-theme";
import { ease, ui } from "@/lib/ui";
import Icon from "./Icon";
import Portrait from "./Portrait";

/**
 * "Created by" button (small, top right of the globe) and its floating card: one card per person in `lib/team.ts`, laid out like the Primer
 * interview cards (portrait, name, role, a link button). Opens and closes with a soft fade; Escape or a click outside closes it.
 */
export default function Credits() {
  const theme = useTheme();
  const { label, title, text } = ui(theme);
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // stays mounted while it fades out
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let a = 0;
    let b = 0;
    let t = 0;
    /* eslint-disable react-hooks/set-state-in-effect -- sequencing mount → fade in / fade out → unmount */
    if (open) {
      setMounted(true);
      a = requestAnimationFrame(() => {
        b = requestAnimationFrame(() => setShown(true));
      });
    } else {
      setShown(false);
      t = window.setTimeout(() => setMounted(false), theme.dur.base);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
      window.clearTimeout(t);
    };
  }, [open, theme.dur.base]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.code === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={root} className="relative" style={{ fontFamily: theme.font }}>
      <button
        type="button"
        className={`ui-btn ${open ? "is-active" : "is-ghost"}`}
        aria-expanded={open}
        aria-controls="credits-card"
        onClick={(e) => {
          e.currentTarget.blur();
          setOpen((o) => !o);
        }}
      >
        <Icon name="user" size={16} /> Credits
      </button>

      {mounted && (
        <div
          id="credits-card"
          role="dialog"
          aria-label="Created by"
          className="absolute right-0 top-full z-20 mt-2"
          style={{
            background: theme.canvas,
            borderRadius: theme.radius,
            padding: 12,
            boxShadow: `inset 0 0 0 1px ${theme.line}`, // a 1px outline, not a shadow
            opacity: shown ? 1 : 0,
            transform: shown ? "none" : "translateY(8px)",
            transition: `opacity ${theme.dur.base}ms ${theme.ease}, transform ${theme.dur.slow}ms ${theme.ease}`,
          }}
        >
          <div style={{ ...label, padding: "2px 2px 12px" }}>Created by</div>
          <ul className="flex list-none gap-3 p-0">
            {TEAM.map((p) => (
              <li key={p.id} style={{ width: 236, background: theme.surface, borderRadius: theme.radius, padding: 12 }}>
                <Portrait id={p.id} theme={theme} label={`Portrait of ${p.name}`} />
                <div style={{ ...title, marginTop: 18 }}>{p.name}</div>
                <div style={{ ...text, marginTop: 6, fontSize: 15, letterSpacing: "-0.02em" }}>{p.role}</div>
                <a
                  href={p.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-btn"
                  style={{ marginTop: 18, transition: ease(theme, ["background-size", "color"]) }}
                >
                  LinkedIn <Icon className="ui-arrow" name="arrow-right" size={16} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
