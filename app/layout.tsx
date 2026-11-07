import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frame Next",
  description: "Which AI habit to adopt this week, and what it saves before the next deadline.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
