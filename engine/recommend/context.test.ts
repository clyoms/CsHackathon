// Athena context and catalogue growth. Every item comes from catalogue/items at run time,
// so no skill is named here and the tests hold for any number of items.
import { describe, expect, it } from "vitest";
import type { CatalogueItem } from "@/contract/types";
import { loadCatalogue, loadRisk } from "@/catalogue";
import { fixtureWorld } from "@/app/api/ask/world";
import { contentWords, itemMatchesTask, pickItem, recommend, scoreItems, type RecommendInput } from "./index";

const catalogue = loadCatalogue();
const risk = loadRisk();
const world = fixtureWorld("2026-11-07");
const staff = world.staff[0];

const base = (over: Partial<RecommendInput> = {}): RecommendInput => ({
  staff,
  lines: world.timesheets,
  engagements: world.engagements,
  deadlines: world.deadlines,
  taskScores: world.taskScores,
  catalogue,
  usage: world.usage,
  today: world.today,
  risk,
  ...over,
});

/** The item recommend picks with no context: the old "default". */
const defaultPick = recommend(base());

describe("recommender with Athena context", () => {
  it("never picks an item that does not fit a VAT task", () => {
    const rec = recommend(base({ context: { task: "VAT return", client: "Byrne Foods" } }));
    if (rec) expect(itemMatchesTask(rec.item, contentWords("VAT"))).toBe(true);
    else expect(rec).toBeNull();
    if (defaultPick && !itemMatchesTask(defaultPick.item, ["vat"])) expect(rec?.item.id).not.toBe(defaultPick.item.id);
  });

  it("returns null when no item fits the task named", () => {
    expect(recommend(base({ context: { task: "zzqx nonsense" } }))).toBeNull();
  });

  it("picks the lowest-risk item with a check step for a low risk tolerance", () => {
    const rec = recommend(base({ context: { riskTolerance: "low" } }));
    expect(rec).not.toBeNull();
    expect(rec!.item.verifyStep.trim()).not.toBe("");
    const rank = { low: 0, medium: 1, high: 2 } as const;
    const lowest = Math.min(...catalogue.filter((i) => i.verifyStep.trim()).map((i) => rank[risk[i.id] ?? "medium"]));
    expect(rank[risk[rec!.item.id] ?? "medium"]).toBe(lowest);
  });

  it("does not return the no-context default for a low risk tolerance when that default is not lowest risk", () => {
    const rec = recommend(base({ context: { riskTolerance: "low" } }));
    if (defaultPick && risk[defaultPick.item.id] !== "low") expect(rec!.item.id).not.toBe(defaultPick.item.id);
  });

  it("picks an item that fits a task the catalogue covers", () => {
    // Use a word from a real item's title, whatever the catalogue holds.
    const item = catalogue.find((i) => contentWords(i.title).some((w) => w.length >= 5))!;
    const word = contentWords(item.title).find((w) => w.length >= 5)!;
    const rec = recommend(base({ context: { task: word } }));
    expect(rec).not.toBeNull();
    expect(itemMatchesTask(rec!.item, [word])).toBe(true);
  });
});

describe("catalogue growth", () => {
  it("still works when a new item is added in memory", () => {
    const extra: CatalogueItem = {
      id: "test-extra-item",
      kind: "skill",
      title: "Payroll journal check",
      plainSummary: "Checks the payroll journal against the payslips.",
      targetsOnetTasks: [catalogue[0].targetsOnetTasks[0]],
      body: "Compare each payroll journal line with the payslip totals and list any differences.",
      verifyStep: "Tick three lines against the payslips.",
    };
    const grown = [...catalogue, extra];
    expect(scoreItems(base({ catalogue: grown }))).toHaveLength(catalogue.length + 1);
    const rec = recommend(base({ catalogue: grown, risk: { ...risk, [extra.id]: "low" }, context: { task: "payroll journal" } }));
    expect(rec?.item.id).toBe(extra.id);
  });

  it("handles an empty catalogue", () => {
    expect(recommend(base({ catalogue: [] }))).toBeNull();
    expect(pickItem([], { riskTolerance: "low" })).toBeNull();
  });
});
