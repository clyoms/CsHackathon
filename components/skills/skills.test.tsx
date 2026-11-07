import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { loadCatalogue, loadRisk } from "@/catalogue";
import { SkillLibrary, type LibraryItem } from "./SkillLibrary";

const risk = loadRisk();
const items: LibraryItem[] = loadCatalogue().map((i) => ({ ...i, risk: risk[i.id] }));

describe("skills library", () => {
  it("shows How this helps on every card", () => {
    const html = renderToStaticMarkup(<SkillLibrary items={items} />);
    expect(html.split("How this helps").length - 1).toBe(items.length);
    for (const item of items) expect(html).toContain(item.howThisHelps.replace(/'/g, "&#x27;"));
    // Card text outside the collapsed full-text bodies.
    const cards = html.replace(/<pre>[\s\S]*?<\/pre>/g, "").toLowerCase();
    expect(cards).not.toContain("synthetic");
    expect(cards).not.toContain("demo data");
  });
});
