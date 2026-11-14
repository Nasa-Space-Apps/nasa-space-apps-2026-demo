import type { CSSProperties } from "react";
import type { Theme } from "./themes";

/**
 * Shared DOM styles derived from the theme (docs/design.md). Text styles and containers live here; interactive pieces (buttons, links,
 * dropdown rows) are the `.ui-*` classes of `globals.css`, because they need :hover / :focus states.
 */
export function ui(theme: Theme) {
  /** Mono caps label (meta, captions, numbers). */
  const label: CSSProperties = {
    fontFamily: theme.mono,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    lineHeight: 1.35,
    color: theme.muted,
  };
  /** Large heading: tight grotesque, like the reference. */
  const display: CSSProperties = { fontSize: 30, fontWeight: 450, letterSpacing: "-0.04em", lineHeight: 1, color: theme.ink };
  /** Card title. */
  const title: CSSProperties = { fontSize: 22, fontWeight: 450, letterSpacing: "-0.035em", lineHeight: 1.05, color: theme.ink };
  /** Body copy. */
  const text: CSSProperties = { fontSize: 14, fontWeight: 450, letterSpacing: "-0.01em", lineHeight: 1.45, color: theme.ink };
  /** Flat container: solid surface, no border, no shadow. */
  const panel: CSSProperties = { background: theme.surface, borderRadius: theme.radius, padding: 16 };
  /** Mono value (coordinates, speed...). */
  const value: CSSProperties = {
    fontFamily: theme.mono,
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: 1,
    color: theme.ink,
    fontVariantNumeric: "tabular-nums",
  };
  return { label, display, title, text, panel, value };
}

/** CSS `transition` for the given properties, all on the theme's curve. */
export const ease = (theme: Theme, props: string[], ms: number = theme.dur.base, delay = 0) =>
  props.map((p) => `${p} ${ms}ms ${theme.ease} ${delay}ms`).join(", ");
