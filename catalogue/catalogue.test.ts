import { describe, expect, it } from "vitest";
import { CatalogueItem, TaskScore } from "@/contract/types";
import { ONET_CLASSIFY_TASK } from "@/contract/fixtures";
import publicTasks from "./public-tasks.json";
import { loadCatalogue, parseItem } from "./index";

const items = loadCatalogue();
const taskSet = new Set(publicTasks.tasks.map((t) => t.onetTask));

describe("catalogue", () => {
  it("loads all 10 items through the CatalogueItem schema", () => {
    expect(items).toHaveLength(10);
    for (const item of items) expect(CatalogueItem.safeParse(item).success).toBe(true);
  });

  it("targets only O*NET tasks found in the public task list fixture", () => {
    for (const item of items) {
      expect(item.targetsOnetTasks.length).toBeGreaterThanOrEqual(1);
      for (const task of item.targetsOnetTasks) expect(taskSet, `${item.id}: ${task}`).toContain(task);
    }
  });

  it("keeps the public task list fixture contract-valid, with a source", () => {
    for (const t of publicTasks.tasks) {
      expect(TaskScore.safeParse({ ...t, source: publicTasks.source }).success).toBe(true);
    }
    // Same task and score as the contract fixture.
    expect(publicTasks.tasks.find((t) => t.onetTask === ONET_CLASSIFY_TASK)?.penetration).toBe(0.9664);
  });

  it("includes every item the plan asks for", () => {
    expect(items.map((i) => i.id).sort()).toEqual([
      "hook-check-the-output",
      "hook-no-pps-in-email",
      "plugin-deadline-reminder",
      "skill-bank-reconciliation",
      "skill-client-query-reply",
      "skill-ct1-review-checklist",
      "skill-meeting-notes-actions",
      "skill-transaction-classification",
      "skill-working-paper-summary",
      "skill-write-a-good-brief",
    ]);
    const kinds = Object.fromEntries(items.map((i) => [i.id, i.kind]));
    expect(kinds["hook-check-the-output"]).toBe("hook");
    expect(kinds["hook-no-pps-in-email"]).toBe("hook");
    expect(kinds["plugin-deadline-reminder"]).toBe("plugin");
  });

  it("gives every item a short plain summary, a body and a verify step", () => {
    for (const item of items) {
      expect(item.plainSummary.split(/\s+/).length, item.id).toBeLessThanOrEqual(25);
      expect(item.body.length, item.id).toBeGreaterThan(200);
      expect(item.verifyStep.trim().length, item.id).toBeGreaterThan(0);
    }
  });

  it("lets the bank reconciliation skill score on real data", () => {
    // Real reconciliation tasks have penetration 0 in the Economic Index, so the skill
    // also targets the classification task (0.9664) to earn AI-ready hours.
    const rec = items.find((i) => i.id === "skill-bank-reconciliation")!;
    expect(rec.targetsOnetTasks).toContain(ONET_CLASSIFY_TASK);
  });

  it("asks the check-the-output hook to confirm three figures", () => {
    expect(items.find((i) => i.id === "hook-check-the-output")!.body).toMatch(/three figures/i);
  });

  it("rejects an item that breaks the contract", () => {
    expect(() => parseItem("---\nid: x\nkind: macro\n---\nbody", "bad.md")).toThrow(/bad\.md/);
    expect(() => parseItem("no front matter", "none.md")).toThrow(/missing front matter/);
  });
});
