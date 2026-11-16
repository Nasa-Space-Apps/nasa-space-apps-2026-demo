"use client";

import { useEffect, useRef, useState } from "react";
import { portraitOf, TEAM } from "@/lib/team";
import { useTheme } from "@/lib/use-theme";
import { ease, ui } from "@/lib/ui";
import FadeImg from "./FadeImg";
import Icon from "./Icon";

/**
 * «Credits» button (top right of the globe) and its floating card: a comic page with one panel per person of `lib/team.ts` (portrait in an ink frame, name,
 * role and a LinkedIn button). It springs in under the button with the theme's `pop` curve; Escape, the X or a click outside closes it.
 */
export default function Credits() {
  const theme = useTheme();
  const { label, title, panel, frame } = ui(theme);
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // stays mounted while it animates out
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let a = 0;
    let b = 0;
    let t = 0;
    /* eslint-disable react-hooks/set-state-in-effect -- sequencing mount → pop in / pop out → unmount */
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
        className={`ui-btn ui-btn-bar ${open ? "is-active" : "is-ghost"}`}
        aria-expanded={open}
        aria-controls="credits-card"
        onClick={(e) => {
          e.currentTarget.blur();
          setOpen((o) => !o);
        }}
      >
        <Icon name="user" size={18} /> Credits
      </button>

      {mounted && (
        <div
          id="credits-card"
          role="dialog"
          aria-label="Created by"
          className="absolute right-0 top-full z-20 mt-3"
          style={{
            ...panel,
            padding: 14,
            width: "min(640px, calc(100vw - 40px))",
            transformOrigin: "top right",
            rotate: "0.6deg", // a page laid on the table
            opacity: shown ? 1 : 0,
            transform: shown ? "none" : "scale(0.88) translateY(-10px)",
            transition: `opacity ${theme.dur.base}ms ${theme.ease}, transform ${theme.dur.base}ms ${theme.pop}`,
          }}
        >
          <div className="flex items-center justify-between" style={{ padding: "0 2px 12px" }}>
            <div style={{ ...title, fontSize: 24 }}>created by</div>
            <button type="button" aria-label="Close" className="ui-fab ui-fab-sm" onClick={(e) => (e.currentTarget.blur(), setOpen(false))}>
              <Icon name="close" size={14} />
            </button>
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-3.5 p-0">
            {TEAM.map((p, i) => (
              <li key={p.id} className="min-w-0 flex-1" style={{ flexBasis: 250 }}>
                <div className="relative" style={{ ...frame, aspectRatio: "4 / 5", background: theme.line, rotate: i % 2 ? "0.9deg" : "-0.9deg" }}>
                  <FadeImg src={portraitOf(p)} alt={`Portrait of ${p.name}`} theme={theme} />
                </div>
                <div style={{ ...title, marginTop: 16, fontSize: 26 }}>{p.name}</div>
                <div style={{ ...label, marginTop: 6, fontSize: 14, color: theme.ink }}>{p.role}</div>
                <a
                  href={p.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-btn"
                  style={{ marginTop: 16, transition: ease(theme, ["background-size", "color"]) }}
                >
                  LinkedIn <Icon className="ui-arrow" name="arrow-right" size={14} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** A small «made by» line for the closing card of a story: round portraits in an ink ring, names and roles, each linking to LinkedIn. */
export function CreatedBy() {
  const theme = useTheme();
  const { label } = ui(theme);
  return (
    <div className="mt-6" style={{ borderTop: `2px solid ${theme.ink}`, paddingTop: 12 }}>
      <div style={{ ...label, fontSize: 12, color: theme.ink }}>created by</div>
      <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
        {TEAM.map((p) => (
          <li key={p.id}>
            <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="ui-link" style={{ gap: 10, textTransform: "none", letterSpacing: 0 }}>
              <span className="relative block flex-none overflow-hidden" style={{ width: 52, height: 52, borderRadius: 999, border: `3px solid ${theme.ink}`, background: theme.line }}>
                <FadeImg src={portraitOf(p)} alt={`Portrait of ${p.name}`} theme={theme} />
              </span>
              <span className="min-w-0" style={{ lineHeight: 1.15 }}>
                <span className="block" style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.025em", color: theme.ink }}>
                  {p.name}
                </span>
                <span className="block" style={{ ...label, fontSize: 12, marginTop: 2, color: theme.ink }}>
                  {p.role}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
