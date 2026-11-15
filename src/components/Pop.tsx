"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Theme } from "@/lib/themes";

/**
 * Game-like pop: the child springs in (scale + a little tilt + rise) with the theme's overshooting `pop` curve, and springs out when `show` turns false.
 * Plain transitions, no keyframes (they are not picked up by the dev server). `delay` staggers siblings; `origin` is where it grows from.
 */
export default function Pop({
  theme,
  show = true,
  delay = 0,
  origin = "center",
  from = "scale(0.55) rotate(-6deg) translateY(18px)",
  to = "scale(0.85) rotate(3deg) translateY(10px)",
  className,
  style,
  children,
}: {
  theme: Theme;
  show?: boolean;
  delay?: number;
  origin?: string;
  from?: string; // hidden transform when entering
  to?: string; // hidden transform when leaving
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setMounted(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, []);
  const on = mounted && show;
  return (
    <div
      className={className}
      style={{
        ...style,
        transformOrigin: origin,
        opacity: on ? 1 : 0,
        transform: on ? "none" : mounted ? to : from,
        transition: on
          ? `opacity ${theme.dur.fast}ms ${theme.ease} ${delay}ms, transform ${theme.dur.base}ms ${theme.pop} ${delay}ms`
          : `opacity ${theme.dur.fast}ms ${theme.ease}, transform ${theme.dur.fast + 50}ms ${theme.ease}`,
      }}
    >
      {children}
    </div>
  );
}
