import { describe, expect, it } from "vitest";
import { CatalogueItem, TaskScore } from "@/contract/types";
import { ONET_CLASSIFY_TASK } from "@/contract/fixtures";
import publicTasks from "./public-tasks.json";
import { readdirSync } from "node:fs";
import { ITEMS_DIR, loadCatalogue, loadRisk, parseItem, parseRisk } from "./index";

const items = loadCatalogue();
const taskSet = new Set(publicTasks.tasks.map((t) => t.onetTask));

describe("catalogue", () => {
  it("loads every item through the CatalogueItem schema", () => {
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

  it("loads one item per file, whatever the number of files", () => {
    const files = readdirSync(ITEMS_DIR).filter((f) => f.endsWith(".md"));
    expect(items).toHaveLength(files.length);
    expect(items.length).toBeGreaterThan(0);
    // File names start with the item's kind, so a reader can sort the folder.
    for (const i of items) expect(files).toContain(`${i.id}.md`);
    for (const i of items) expect(i.id.startsWith(`${i.kind}-`), i.id).toBe(true);
  });

  it("gives every item a valid risk", () => {
    const risk = loadRisk();
    expect(Object.keys(risk).sort()).toEqual(items.map((i) => i.id).sort());
    for (const r of Object.values(risk)) expect(["low", "medium", "high"]).toContain(r);
    expect(() => parseRisk("---\nid: x\nrisk: extreme\n---\n", "bad.md")).toThrow(/bad\.md/);
    expect(parseRisk("---\nid: x\n---\n")).toBe("medium");
  });

  it("reads howThisHelps from the front matter, and defaults it to empty", () => {
    const head = (extra: string) =>
      `---\nid: skill-x\nkind: skill\ntitle: X\nplainSummary: Does x.\ntargetsOnetTasks:\n  - ${ONET_CLASSIFY_TASK}\nverifyStep: Check x.\n${extra}---\nBody text.\n`;
    expect(parseItem(head("howThisHelps: Saves a tax assistant an hour.\n")).howThisHelps).toBe("Saves a tax assistant an hour.");
    expect(parseItem(head("")).howThisHelps).toBe("");
    for (const item of items) expect(typeof item.howThisHelps, item.id).toBe("string");
  });

  it("gives every item a short plain summary, a body and a verify step", () => {
    for (const item of items) {
      expect(item.plainSummary.split(/\s+/).length, item.id).toBeLessThanOrEqual(25);
      expect(item.body.length, item.id).toBeGreaterThan(200);
      expect(item.verifyStep.trim().length, item.id).toBeGreaterThan(0);
    }
  });

  it("lets at least one item earn AI-ready hours on real data", () => {
    // Items score only on tasks with penetration above 0 in the Economic Index.
    const scored = new Set(publicTasks.tasks.filter((t) => t.penetration > 0).map((t) => t.onetTask));
    expect(items.some((i) => i.targetsOnetTasks.some((t) => scored.has(t)))).toBe(true);
    expect(scored).toContain(ONET_CLASSIFY_TASK);
  });

  it("rejects an item that breaks the contract", () => {
    expect(() => parseItem("---\nid: x\nkind: macro\n---\nbody", "bad.md")).toThrow(/bad\.md/);
    expect(() => parseItem("no front matter", "none.md")).toThrow(/missing front matter/);
  });
});
