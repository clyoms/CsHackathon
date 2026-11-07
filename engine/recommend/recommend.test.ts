import { describe, expect, it } from "vitest";
import { Recommendation, type CatalogueItem, type TaskScore, type TimesheetLine } from "@/contract/types";
import {
  catalogueItemFixture,
  deadlineFixture,
  engagementFixture,
  staffFixture,
  usageRecordFixture,
} from "@/contract/fixtures";
import {
  NO_DEADLINE_WEIGHT,
  daysBetween,
  deadlineWeight,
  recommend,
  scoreItems,
  verifiedRate,
  type RecommendInput,
} from "./index";

// Real O*NET task statements. The penetration values below are TEST VALUES chosen for hand-worked
// arithmetic, not read from the Economic Index. Real values come from data/public (task T-3).
const RECONCILE = "Compare previously prepared bank statements with canceled checks and reconcile discrepancies.";
const CLASSIFY = catalogueItemFixture.targetsOnetTasks[0];
const MEMO = "Prepare, examine, or analyze accounting records, financial statements, or other financial reports.";
const TEST_SOURCE = "https://example.com/test-only-values";
const scores: TaskScore[] = [
  { onetTask: RECONCILE, penetration: 0.5, source: TEST_SOURCE },
  { onetTask: CLASSIFY, penetration: 0.5, source: TEST_SOURCE },
  { onetTask: MEMO, penetration: 0.5, source: TEST_SOURCE },
];

const reconSkill: CatalogueItem = {
  id: "test-item-a",
  kind: "skill",
  title: "Test item A",
  plainSummary: "Matches the bank statement to the ledger and lists what does not match.",
  targetsOnetTasks: [RECONCILE],
  body: "Match each bank line to a ledger line and list the differences.",
  verifyStep: "",
  howThisHelps: "",
};
const memoSkill: CatalogueItem = {
  id: "test-item-b",
  kind: "skill",
  title: "Test item B",
  plainSummary: "Turns a working paper into a short summary for the reviewer.",
  targetsOnetTasks: [MEMO],
  body: "Summarise this working paper in five bullets.",
  verifyStep: "",
  howThisHelps: "",
};
const checkedClassify: CatalogueItem = { ...catalogueItemFixture }; // has a verify step

const TODAY = "2026-11-07"; // deadlineFixture is 2026-11-18, 11 days later

function line(onetTask: string, hours: number, staffId = staffFixture.id): TimesheetLine {
  return {
    staffId,
    engagementId: engagementFixture.id,
    date: "2026-11-02",
    hours,
    taskText: "test line",
    onetTask,
    synthetic: true,
  };
}

function input(overrides: Partial<RecommendInput>): RecommendInput {
  return {
    staff: staffFixture,
    lines: [],
    engagements: [engagementFixture],
    deadlines: [deadlineFixture],
    taskScores: scores,
    catalogue: [memoSkill, reconSkill, checkedClassify],
    usage: [{ ...usageRecordFixture, verified: 0.9 }],
    today: TODAY,
    ...overrides,
  };
}

describe("helpers", () => {
  it("counts days between dates", () => {
    expect(daysBetween(TODAY, deadlineFixture.date)).toBe(11);
    expect(daysBetween("2026-11-18", "2026-11-07")).toBe(-11);
  });

  it("weighs closer deadlines more", () => {
    expect(deadlineWeight(0)).toBe(1);
    expect(deadlineWeight(7)).toBe(0.5);
    expect(deadlineWeight(3)).toBeGreaterThan(deadlineWeight(11));
    expect(deadlineWeight(null)).toBe(NO_DEADLINE_WEIGHT);
    expect(deadlineWeight(-1)).toBe(NO_DEADLINE_WEIGHT);
  });

  it("weights the verified rate by prompts", () => {
    const usage = [
      { ...usageRecordFixture, prompts: 30, verified: 0.1 },
      { ...usageRecordFixture, prompts: 10, verified: 0.9 },
      { ...usageRecordFixture, staffId: "someone-else", prompts: 100, verified: 1 },
    ];
    expect(verifiedRate(usage, staffFixture.id)).toBeCloseTo(0.3, 10);
    expect(verifiedRate([], staffFixture.id)).toBeNull();
  });
});

describe("recommend", () => {
  it("gives a person with 10 reconciliation hours and a deadline in 11 days the reconciliation skill", () => {
    const rec = recommend(input({ lines: [line(RECONCILE, 10), line(MEMO, 2)] }));
    expect(rec).not.toBeNull();
    expect(rec!.item.id).toBe(reconSkill.id);
    // 10 h × 0.5 = 5 AI-ready hours; × 0.3 = 1.5 h back; × €85 = €127.50.
    expect(rec!.aiReadyHours).toBe(5);
    expect(rec!.hoursBackEstimate).toBe(1.5);
    expect(rec!.eurosBack).toBe(127.5);
    expect(rec!.deadline.id).toBe(deadlineFixture.id);
    expect(rec!.reason).toContain("11 days away");
    expect(rec!.synthetic).toBe(true);
    expect(Recommendation.safeParse(rec).success).toBe(true);
  });

  it("gives a low-verify person an item with a verify step, even with fewer hours on it", () => {
    const lines = [line(RECONCILE, 10), line(CLASSIFY, 6)];
    const lowVerify = [{ ...usageRecordFixture, verified: 0.2 }];
    const rec = recommend(input({ lines, usage: lowVerify }));
    expect(rec!.item.id).toBe(checkedClassify.id);
    expect(rec!.item.verifyStep).not.toBe("");
    expect(rec!.reason).toContain("check the output");

    // The same hours with a high verified rate pick reconciliation, so the bonus made the difference.
    expect(recommend(input({ lines }))!.item.id).toBe(reconSkill.id);
  });

  it("uses the adjustable hours-back factor", () => {
    const rec = recommend(input({ lines: [line(RECONCILE, 10)], hoursBackFactor: 0.5 }));
    expect(rec!.hoursBackEstimate).toBe(2.5);
    expect(rec!.eurosBack).toBe(212.5);
  });

  it("ignores other people's lines and returns null with no matching work", () => {
    expect(recommend(input({ lines: [line(RECONCILE, 10, "s-other")] }))).toBeNull();
    expect(recommend(input({ lines: [] }))).toBeNull();
  });

  it("scores past deadlines with the low weight", () => {
    const [, recon] = scoreItems(input({ lines: [line(RECONCILE, 10)], today: "2026-12-01" }));
    expect(recon.deadline).toBeNull();
    expect(recon.deadlineWeight).toBe(NO_DEADLINE_WEIGHT);
  });

  it("keeps every reason under 30 words", () => {
    const longClient = { ...engagementFixture, client: Array(20).fill("Long").join(" ") };
    const rec = recommend(input({ lines: [line(RECONCILE, 10)], engagements: [longClient], usage: [] }));
    expect(rec!.reason.trim().split(/\s+/).length).toBeLessThan(30);
    expect(Recommendation.safeParse(rec).success).toBe(true);
  });
});
