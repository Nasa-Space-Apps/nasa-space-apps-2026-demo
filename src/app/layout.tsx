import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import { THEME, cssVars, themeFor } from "@/lib/themes";
import WorldVars from "@/components/WorldVars";
import "./globals.css";

// The reference's own typeface (ponpon-mania.com): one family for everything, heavy for titles, bold lowercase for labels.
const sans = Libre_Franklin({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Left behind",
  description: "Robots that never came home: travel back to see how they ended up abandoned on the Moon and Mars.",
};

// Before the first paint, set the variables of the world of the URL (/mars… → Mars, otherwise the Moon) so the page never flashes the wrong field colour;
// components/WorldVars.tsx keeps them in sync after hydration. Same source as the components: lib/themes.ts.
const WORLD_SCRIPT = `(function(){var w=${JSON.stringify({ mars: cssVars(themeFor("mars")), moon: cssVars(themeFor("moon")) })};var v=w[location.pathname.split("/")[1]==="mars"?"mars":"moon"],s=document.documentElement.style;for(var k in v)s.setProperty(k,v[k]);})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased`} style={cssVars(THEME) as CSSProperties} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: WORLD_SCRIPT }} />
      </head>
      <body className="h-full overflow-hidden">
        <WorldVars />
        {children}
      </body>
    </html>
  );
}
