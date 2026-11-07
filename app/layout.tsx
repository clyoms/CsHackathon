import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Fonts from docs/design/brief.md, loaded by Next itself (no npm package).
const fraunces = Fraunces({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-fraunces", display: "swap" });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  title: "Frame Next",
  description: "Which AI habit to adopt this week, and what it saves before the next deadline.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IE" className={`${fraunces.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}
