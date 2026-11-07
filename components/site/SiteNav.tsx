"use client";
// The top bar on every page: the product name and one tab per view, plus the 4D AI fluency course.
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Overview" },
  { href: "/employee", label: "Employee" },
  { href: "/partner", label: "Partner" },
  { href: "/ai-lead", label: "AI Lead" },
  { href: "/literacy", label: "AI fluency", tag: "4Ds" },
  { href: "/skills", label: "Skills library" },
];

export const PRODUCT_NAME = "Handoff";

export function SiteNav() {
  const path = usePathname() ?? "/";
  return (
    <header className="site-nav">
      <Link href="/" className="site-brand">
        <span className="site-mark" aria-hidden="true">
          H
        </span>
        {PRODUCT_NAME}
      </Link>
      <nav aria-label="Main" className="site-tabs">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}>
            {t.label}
            {t.tag && <span className="site-tag">{t.tag}</span>}
          </Link>
        ))}
      </nav>
    </header>
  );
}
