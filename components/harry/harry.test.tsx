import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { toCsv } from "@/engine/literacy";
import { loadCsoAdoption, loadEurostatAdoption } from "@/data/public";
import HarryPage from "@/app/harry/page";
import { adoptionByTeam, benchmarks, costPanel, frameActiveShare } from "./data";
import { harryFixtureWorld } from "./fixtures";

const world = harryFixtureWorld();

describe("harry view data", () => {
  it("counts active users, prompts and verified rate per team", () => {
    const tax = adoptionByTeam(world.staff, world.usage).find((t) => t.team === "Tax")!;
    // Tax: Aoife (42 + 51 + 38 prompts) and Niamh (12 + 14); Conor has none.
    expect(tax).toMatchObject({ staff: 3, activeUsers: 2, prompts: 157 });
    // Checked = (42×0.2 + 51×0.15 + 38×0.25 + 12×0.75 + 14×0.7) / 157 = 44.35 / 157
    expect(tax.verifiedRate).toBeCloseTo(44.35 / 157, 6);
  });

  it("gives Frame's active share as staff who used AI", () => {
    // 9 staff, Conor and Maeve unused.
    expect(frameActiveShare(world.staff, world.usage)).toBeCloseTo(7 / 9);
  });

  it("computes tokens per finished task and the top 10% share", () => {
    const cost = costPanel(world.meter);
    const done = world.meter.filter((r) => r.finished);
    expect(cost.finishedTasks).toBe(done.length);
    expect(cost.eurosPerFinishedTask).toBeNull();
    expect(cost.measuredIn).toBe("tokens");
    const sizes = done.map((r) => r.tokensIn + r.tokensOut).sort((a, b) => b - a);
    const top = sizes.slice(0, Math.ceil(done.length * 0.1)).reduce((s, n) => s + n, 0);
    expect(cost.topTenShare).toBeCloseTo(top / sizes.reduce((s, n) => s + n, 0));
    expect(cost.topTenShare!).toBeGreaterThan(0.3);
  });

  it("uses euros when every finished task is priced", () => {
    const cost = costPanel([
      { task: "a", tokensIn: 10, tokensOut: 0, euros: 0.9, finished: true },
      ...Array.from({ length: 9 }, (_, i) => ({ task: `b${i}`, tokensIn: 10, tokensOut: 0, euros: 0.1, finished: true })),
    ]);
    expect(cost).toMatchObject({ measuredIn: "euros", finishedTasks: 10 });
    expect(cost.eurosPerFinishedTask).toBeCloseTo(0.18);
    expect(cost.topTenShare).toBeCloseTo(0.5);
  });

  it("reads real CSO and Eurostat benchmarks with sources", () => {
    const marks = benchmarks(loadCsoAdoption(), loadEurostatAdoption());
    expect(marks.length).toBe(3);
    for (const m of marks) {
      expect(m.source).toMatch(/^https:\/\//);
      expect(m.percent).toBeGreaterThan(0);
    }
    expect(marks[0].label).toContain("CSO");
  });

  it("exports the literacy log as CSV with a header and one row per entry", () => {
    const csv = toCsv(world.literacyLog).split("\n");
    expect(csv[0]).toBe("staffId,date,measure,itemId,adopted");
    expect(csv).toHaveLength(world.literacyLog.length + 1);
  });
});

describe("harry page", () => {
  it("renders all four panels, the export button and the question box", () => {
    const html = renderToStaticMarkup(<HarryPage />);
    for (const title of ["Adoption by team", "Frame against Ireland and the EU", "Cost per task", "AI literacy log"]) {
      expect(html).toContain(`aria-label="${title}"`);
    }
    expect(html).toContain("Export CSV");
    expect(html).toContain("Which teams improve when they adopt a skill?");
    expect(html).toContain("synthetic");
    expect(html).toContain("Source: https://");
  });
});
