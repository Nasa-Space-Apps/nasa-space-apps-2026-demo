import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import { THEME, cssVars } from "@/lib/themes";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased`} style={cssVars(THEME) as CSSProperties}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
