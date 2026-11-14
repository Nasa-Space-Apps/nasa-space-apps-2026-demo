"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Theme } from "@/lib/themes";

/**
 * Soft entrance: fades in and rises a few pixels on mount (two animation frames after, so the browser paints the hidden state first).
 * `delay` staggers siblings. Plain transitions, no keyframes (they are not picked up by the dev server).
 */
export default function Reveal({
  theme,
  delay = 0,
  rise = 14,
  className,
  style,
  children,
}: {
  theme: Theme;
  delay?: number;
  rise?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setOn(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, []);
  return (
    <div
      className={className}
      style={{
        ...style,
        opacity: on ? 1 : 0,
        transform: on ? "none" : `translateY(${rise}px)`,
        transition: `opacity ${theme.dur.base}ms ${theme.ease} ${delay}ms, transform ${theme.dur.slow}ms ${theme.ease} ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
