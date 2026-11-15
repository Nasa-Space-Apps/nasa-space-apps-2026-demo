"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cssVars, themeFor, worldOfPath } from "@/lib/themes";

/**
 * Publishes the colours of the current world (Mars / the Moon) as CSS variables on <html>, so `globals.css` and the DOM follow the route (including the globe's
 * pushState switch between /mars and /moon). The first paint is covered by the inline script of app/layout.tsx; this keeps it in sync afterwards.
 */
export default function WorldVars() {
  const world = worldOfPath(usePathname());
  useEffect(() => {
    const root = document.documentElement.style;
    for (const [k, v] of Object.entries(cssVars(themeFor(world)))) root.setProperty(k, v);
  }, [world]);
  return null;
}
