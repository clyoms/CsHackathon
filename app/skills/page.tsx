import type { Metadata } from "next";
import { loadCatalogue, loadRisk } from "@/catalogue";
import { SkillLibrary, type LibraryItem } from "@/components/skills/SkillLibrary";

export const metadata: Metadata = { title: "Handoff: skills library" };

/** Every catalogue item, read from catalogue/items at build time, with Copy and Export. */
export default function SkillsPage() {
  const risk = loadRisk();
  const items: LibraryItem[] = loadCatalogue().map((i) => ({ ...i, risk: risk[i.id] }));
  return <SkillLibrary items={items} />;
}
