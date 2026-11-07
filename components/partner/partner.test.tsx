import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildPartnerView, crunchCalendar } from "./data";
import { EngagementTable } from "./EngagementTable";
import { TASKS, partnerFixtureWorld } from "./fixtures";

const world = partnerFixtureWorld("2026-11-07");
const view = buildPartnerView(world);

describe("partner view data", () => {
  it("sorts engagements by money lost", () => {
    // Murphy: 25 h over × €100 = €2,500. Walsh: 26 h over × (32,000 / 260) = €3,200. Kelly: under budget.
    expect(view.rows.map((r) => [r.client, Math.round(r.moneyLost)])).toEqual([
      ["Walsh Holdings", 3200],
      ["Murphy Engineering Ltd", 2500],
      ["Kelly Family", 0],
    ]);
  });

  it("shows Murphy's effective rate at €80 an hour", () => {
    const murphy = view.rows.find((r) => r.engagementId === "e-murphy")!;
    expect(murphy).toMatchObject({ fee: 10000, budgetHours: 100, actualHours: 125, effectiveRate: 80 });
  });

  it("picks the top AI-ready task and a recommended item per engagement", () => {
    const murphy = view.rows.find((r) => r.engagementId === "e-murphy")!;
    // Classify: 55 h × 0.9664 = 53.15 AI-ready, more than check forms at 15 × 0.903 = 13.5.
    expect(murphy.topTask?.onetTask).toBe(TASKS.classify);
    expect(murphy.topTask?.aiReadyHours).toBeCloseTo(53.152);
    expect(murphy.recommended?.id).toBe("skill-transaction-classify");
    const kelly = view.rows.find((r) => r.engagementId === "e-kelly")!;
    expect(kelly.recommended?.id).toBe("skill-ct1-review-checklist");
    const walsh = view.rows.find((r) => r.engagementId === "e-walsh")!;
    expect(walsh.recommended?.id).toBe("skill-working-paper-summary");
  });

  it("builds 8 weeks from this Monday with deadlines marked", () => {
    const weeks = crunchCalendar(world);
    expect(weeks).toHaveLength(8);
    expect(weeks[0].start).toBe("2026-11-02");
    expect(weeks[7].end).toBe("2026-12-27");
    const marked = weeks.flatMap((w) => w.deadlines.map((d) => [d.deadline.id, w.start, d.clients]));
    expect(marked).toEqual([
      ["ie-ros-2026", "2026-11-16", ["Kelly Family"]],
      ["ie-ct1-2026-11", "2026-11-23", ["Murphy Engineering Ltd"]],
      ["ie-ct1-2026-12", "2026-12-21", ["Walsh Holdings"]],
    ]);
  });
});

describe("engagement table", () => {
  it("shows rows in money-lost order with no breakdown until a row is opened", () => {
    const html = renderToStaticMarkup(<EngagementTable rows={view.rows} />);
    expect(html.indexOf("Walsh Holdings")).toBeLessThan(html.indexOf("Murphy Engineering Ltd"));
    expect(html.indexOf("Murphy Engineering Ltd")).toBeLessThan(html.indexOf("Kelly Family"));
    expect(html).not.toContain("Task breakdown");
    expect(html).toContain("synthetic");
  });

  it("shows the task breakdown and recommended item for an opened row", () => {
    const html = renderToStaticMarkup(<EngagementTable rows={view.rows} initialOpen="e-murphy" />);
    expect(html).toContain("Task breakdown: Murphy Engineering Ltd");
    expect(html).toContain("Recommended for the team:");
    expect(html).toContain('aria-expanded="true"');
    // Real penetration scores carry their source on hover.
    expect(html).toContain("Source: https://huggingface.co/datasets/Anthropic/EconomicIndex");
  });
});
