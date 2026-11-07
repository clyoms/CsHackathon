import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Space Grotesk headings over Inter body, loaded by Next itself (no npm package).
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-grotesk", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Frame Next",
  description: "Which AI habit to adopt this week, and what it saves before the next deadline.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0d0a1a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IE" className={`${grotesk.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
