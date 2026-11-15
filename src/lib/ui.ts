import type { CSSProperties } from "react";
import type { Theme } from "./themes";

/**
 * Shared DOM styles derived from the theme (docs/design.md). Text styles and containers live here; interactive pieces (buttons, links,
 * dropdown rows) are the `.ui-*` classes of `globals.css`, because they need :hover / :focus states.
 */
export function ui(theme: Theme) {
  /** Label (meta, captions, numbers): bold lowercase, like the reference's navigation. */
  const label: CSSProperties = {
    fontFamily: theme.mono,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.01em",
    textTransform: "lowercase",
    lineHeight: 1.35,
    color: theme.muted,
  };
  /** Large heading: heavy and tight. */
  const display: CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 0.95, color: theme.ink };
  /** Card title. */
  const title: CSSProperties = { fontSize: 22, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1, color: theme.ink };
  /** Body copy. */
  const text: CSSProperties = { fontSize: 14, fontWeight: 500, letterSpacing: "-0.005em", lineHeight: 1.45, color: theme.ink };
  /** A comic page: cream paper inside a thick ink stroke. No shadow. */
  const panel: CSSProperties = { background: theme.surface, border: `${theme.stroke}px solid ${theme.ink}`, borderRadius: theme.radius, padding: 16 };
  /** Number value (coordinates, speed...). */
  const value: CSSProperties = {
    fontFamily: theme.mono,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    lineHeight: 1,
    color: theme.ink,
    fontVariantNumeric: "tabular-nums",
  };
  /** Ink frame for a photo or an illustration inside a panel (a comic panel). */
  const frame: CSSProperties = { border: `${theme.stroke}px solid ${theme.ink}`, borderRadius: theme.radius, overflow: "hidden" };
  return { label, display, title, text, panel, value, frame };
}

/** CSS `transition` for the given properties, all on the theme's curve. */
export const ease = (theme: Theme, props: string[], ms: number = theme.dur.base, delay = 0) =>
  props.map((p) => `${p} ${ms}ms ${theme.ease} ${delay}ms`).join(", ");
