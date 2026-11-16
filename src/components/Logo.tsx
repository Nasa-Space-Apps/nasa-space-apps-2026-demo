"use client";

import { useRouter } from "next/navigation";
import type { Theme } from "@/lib/themes";

/** Per-letter tilt and lift: a hand-lettered feel (the reference's logo is drawn by hand; this is the same heavy grotesque with each letter knocked off the line). */
const JIGGLE: [number, number][] = [
  [-4, 1],
  [3, -2],
  [-2, 2],
  [5, -1],
  [-3, 1],
  [2, -2],
  [-5, 2],
];

/**
 * The brand mark: «left / behind» stacked in a cream sticker with an ink stroke. Used on the home page and at the top of the globe, where it leads back home.
 * It wiggles under the pointer (the letters spring apart) and goes home on click.
 */
export default function Logo({ theme, size = 24, onHome }: { theme: Theme; size?: number; onHome?: () => void }) {
  const router = useRouter();
  const line = (word: string, o: number) => (
    <span className="home-logo-line" style={{ display: "block" }}>
      {[...word].map((c, i) => {
        const [r, y] = JIGGLE[(i + o) % JIGGLE.length];
        return (
          <span key={i} className="home-logo-ch" style={{ display: "inline-block", transform: `translateY(${y}px) rotate(${r}deg)` }}>
            {c}
          </span>
        );
      })}
    </span>
  );
  return (
    <button
      type="button"
      className="home-logo"
      aria-label="Left behind: home"
      onClick={() => (onHome ? onHome() : router.push("/"))}
      style={{
        background: theme.surface,
        color: theme.ink,
        border: `${theme.stroke}px solid ${theme.ink}`,
        borderRadius: 18,
        padding: `${size * 0.28}px ${size * 0.62}px ${size * 0.36}px`,
        fontFamily: theme.font,
        fontSize: size,
        fontWeight: 800,
        letterSpacing: "-0.05em",
        lineHeight: 0.86,
        textAlign: "center",
        textTransform: "lowercase",
        cursor: "pointer",
      }}
    >
      {line("left", 0)}
      {line("behind", 2)}
    </button>
  );
}
