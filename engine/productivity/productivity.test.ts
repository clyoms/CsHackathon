import { describe, expect, it } from "vitest";
import type { Engagement, Staff, TaskScore, TimesheetLine } from "@/contract/types";
import { engagementFixture, staffFixture, taskScoreFixture, timesheetLineFixture } from "@/contract/fixtures";
import {
  DEFAULT_HOURS_BACK_FACTOR,
  actualHours,
  aiReadyHours,
  budgetVariance,
  effectiveRate,
  estimateTasks,
  eurosBack,
  hoursBack,
  hoursByTask,
  moneyLost,
  rankByMoneyLost,
  summariseEngagement,
} from "./index";

// Hand-worked test world, built from the contract fixtures.
const CLASSIFY = taskScoreFixture.onetTask;
const OTHER = "Advise clients in areas such as compensation, employee health care benefits, the design of accounting or data processing systems, or long-range tax or estate plans.";

const aoife: Staff = staffFixture; // charge rate €85
const senior: Staff = { ...staffFixture, id: "s-senior", name: "Senior", role: "Tax Manager", chargeRate: 150 };

const murphy: Engagement = engagementFixture; // fee €10,000, budget 100 h
const byrne: Engagement = { ...engagementFixture, id: "e-byrne", client: "Byrne Foods", fee: 6000, budgetHours: 40 };
const walsh: Engagement = { ...engagementFixture, id: "e-walsh", client: "Walsh Holdings", fee: 20000, budgetHours: 100 };

const line = (staffId: string, engagementId: string, onetTask: string, hours: number): TimesheetLine => ({
  ...timesheetLineFixture,
  staffId,
  engagementId,
  onetTask,
  hours,
});

// Murphy: 50 + 30 + 45 = 125 h. Byrne: 30 h. Walsh: 110 h.
const lines: TimesheetLine[] = [
  line(aoife.id, murphy.id, CLASSIFY, 50),
  line(senior.id, murphy.id, CLASSIFY, 30),
  line(senior.id, murphy.id, OTHER, 45),
  line(aoife.id, byrne.id, CLASSIFY, 30),
  line(senior.id, walsh.id, OTHER, 110),
];

// A round penetration so the sums can be worked by hand.
const score08: TaskScore = { ...taskScoreFixture, penetration: 0.8 };

describe("engagement figures", () => {
  it("sums actual hours per engagement", () => {
    expect(actualHours(murphy.id, lines)).toBe(125);
    expect(actualHours(byrne.id, lines)).toBe(30);
    expect(actualHours("e-none", lines)).toBe(0);
  });

  it("gives €80 an hour for fee €10,000 at 125 actual hours", () => {
    expect(effectiveRate(10000, 125)).toBe(80);
    expect(effectiveRate(10000, 0)).toBeNull();
  });

  it("computes budget variance as actual minus budget", () => {
    expect(budgetVariance(100, 125)).toBe(25);
    expect(budgetVariance(40, 30)).toBe(-10);
  });

  it("prices money lost at the budgeted rate", () => {
    // 25 h over × (€10,000 / 100 h) = €2,500
    expect(moneyLost(10000, 100, 125)).toBe(2500);
    // Same as (budget rate − effective rate) × actual hours = (100 − 80) × 125
    expect(moneyLost(10000, 100, 125)).toBe((100 - 80) * 125);
    expect(moneyLost(6000, 40, 30)).toBe(0);
  });

  it("groups hours per O*NET task, largest first", () => {
    const murphyLines = lines.filter((l) => l.engagementId === murphy.id);
    expect(hoursByTask(murphyLines)).toEqual([
      { onetTask: CLASSIFY, hours: 80 },
      { onetTask: OTHER, hours: 45 },
    ]);
  });

  it("summarises the Murphy engagement", () => {
    const s = summariseEngagement(murphy, lines);
    expect(s).toMatchObject({
      engagementId: "e-murphy",
      fee: 10000,
      budgetHours: 100,
      actualHours: 125,
      effectiveRate: 80,
      budgetRate: 100,
      budgetVarianceHours: 25,
      moneyLost: 2500,
      synthetic: true,
    });
    expect(s.hoursByTask).toHaveLength(2);
  });

  it("ranks engagements by money lost: Murphy €2,500, Walsh €2,000, Byrne €0", () => {
    const ranked = rankByMoneyLost([byrne, walsh, murphy], lines);
    expect(ranked.map((r) => [r.client, r.moneyLost])).toEqual([
      ["Murphy Engineering Ltd", 2500],
      ["Walsh Holdings", 2000], // 10 h over × €200
      ["Byrne Foods", 0],
    ]);
  });
});

describe("task estimates", () => {
  it("computes AI-ready hours, hours back and euros back", () => {
    expect(aiReadyHours(10, 0.8)).toBeCloseTo(8);
    expect(DEFAULT_HOURS_BACK_FACTOR).toBe(0.3);
    expect(hoursBack(8)).toBeCloseTo(2.4);
    expect(hoursBack(8, 0.5)).toBeCloseTo(4);
    expect(eurosBack(2.4, 85)).toBeCloseTo(204);
  });

  it("rejects a factor outside 0 to 1", () => {
    expect(() => hoursBack(8, 1.5)).toThrow(RangeError);
    expect(() => hoursBack(8, -0.1)).toThrow(RangeError);
  });

  it("uses each person's own charge rate per task", () => {
    const murphyLines = lines.filter((l) => l.engagementId === murphy.id);
    const [classify, other] = estimateTasks(murphyLines, [score08], [aoife, senior]);
    // Aoife: 50 × 0.8 = 40 ready, × 0.3 = 12 back, × €85 = €1,020
    // Senior: 30 × 0.8 = 24 ready, × 0.3 = 7.2 back, × €150 = €1,080
    expect(classify.onetTask).toBe(CLASSIFY);
    expect(classify.hours).toBe(80);
    expect(classify.penetration).toBe(0.8);
    expect(classify.source).toBe(taskScoreFixture.source);
    expect(classify.aiReadyHours).toBeCloseTo(64);
    expect(classify.hoursBack).toBeCloseTo(19.2);
    expect(classify.eurosBack).toBeCloseTo(2100);
    expect(classify.synthetic).toBe(true);
    // A task with no score keeps its hours but gets no AI-ready hours and no source.
    expect(other).toMatchObject({ onetTask: OTHER, hours: 45, penetration: null, source: null, aiReadyHours: 0, eurosBack: 0 });
  });

  it("applies the real fixture penetration of 0.9664", () => {
    const [t] = estimateTasks([line(aoife.id, murphy.id, CLASSIFY, 10)], [taskScoreFixture], [aoife]);
    // 10 × 0.9664 = 9.664 ready, × 0.3 = 2.8992 back, × €85 = €246.432
    expect(t.aiReadyHours).toBeCloseTo(9.664);
    expect(t.hoursBack).toBeCloseTo(2.8992);
    expect(t.eurosBack).toBeCloseTo(246.432);
  });

  it("takes an adjusted factor", () => {
    const [t] = estimateTasks([line(aoife.id, murphy.id, CLASSIFY, 10)], [score08], [aoife], 0.5);
    // 10 × 0.8 × 0.5 = 4 h back, × €85 = €340
    expect(t.hoursBack).toBeCloseTo(4);
    expect(t.eurosBack).toBeCloseTo(340);
  });
});
