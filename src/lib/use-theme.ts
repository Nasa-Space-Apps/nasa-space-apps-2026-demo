import { usePathname } from "next/navigation";
import { themeFor, worldOfPath, type Theme } from "./themes";

/** The theme of the world of the current route (/mars… → Mars, /moon… → the Moon). It follows `history.pushState` switches of the globe (Next syncs the pathname). */
export function useTheme(): Theme {
  return themeFor(worldOfPath(usePathname()));
}
