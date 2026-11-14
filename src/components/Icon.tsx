import type { CSSProperties } from "react";

/**
 * The icon set of the demo: one 16×16 grid, one 1.5 px stroke, round caps and joins, no fills (outline icons that inherit `currentColor`).
 * The arrow is the one from the reference: a straight shaft with an open chevron head. Add new icons here, never inline glyphs (→ ▶ ■).
 */
const PATHS = {
  "arrow-right": "M2 8h11.5M9 3.5 13.5 8 9 12.5",
  "arrow-left": "M14 8H2.5M7 3.5 2.5 8 7 12.5",
  "chevron-down": "M3.5 6 8 10.5 12.5 6",
  play: "M5 3.4v9.2L12.6 8 5 3.4Z",
  stop: "M4.25 4.25h7.5v7.5h-7.5Z",
  pause: "M5.5 3.5v9M10.5 3.5v9",
  close: "M3.5 3.5l9 9M12.5 3.5l-9 9",
  user: "M8 7.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM2.75 13.75c.6-2.6 2.7-4 5.25-4s4.65 1.4 5.25 4",
  sound: "M2.5 6.25H5L8.5 3.5v9L5 9.75H2.5ZM10.75 5.75a3.25 3.25 0 0 1 0 4.5M12.75 4a5.75 5.75 0 0 1 0 8",
  "sound-off": "M2.5 6.25H5L8.5 3.5v9L5 9.75H2.5ZM11 6l3 4M14 6l-3 4",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 16, className, style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg
      className={`ui-icon ${className ?? ""}`}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
