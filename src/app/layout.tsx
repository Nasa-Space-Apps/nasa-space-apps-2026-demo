import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { THEME, cssVars } from "@/lib/themes";
import "./globals.css";

// Stand-in for the reference's grotesque (Onsite Standard, proprietary): same tight, even-weight character; weight 450 is used for text.
const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Left behind",
  description: "Robots that never came home: travel back to see how they ended up abandoned on the Moon and Mars.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`} style={cssVars(THEME) as CSSProperties}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
