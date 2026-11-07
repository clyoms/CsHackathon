import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Engagement, Staff, TimesheetLine, UsageRecord } from "@/contract/types";
import { DEADLINE_IDS, DEFAULT_SEED, OFFICES, ONET, PERIOD, TEAMS, generate, toJson } from "@/scripts/make-frame-data/generate";
import { AOIFE_ID, HARRY_ID, loadFrameData } from "./index";

const data = loadFrameData();
const hoursOn = (engagementId: string) =>
  data.timesheets.filter((l) => l.engagementId === engagementId).reduce((s, l) => s + l.hours, 0);

describe("synthetic Frame data", () => {
  it("validates every record against the contract", () => {
    for (const s of data.staff) expect(Staff.safeParse(s).success).toBe(true);
    for (const e of data.engagements) expect(Engagement.safeParse(e).success).toBe(true);
    for (const l of data.timesheets) expect(TimesheetLine.safeParse(l).success).toBe(true);
    for (const u of data.usage) expect(UsageRecord.safeParse(u).success).toBe(true);
  });

  it("marks every record synthetic", () => {
    const all = [...data.staff, ...data.engagements, ...data.timesheets, ...data.usage];
    expect(all.every((r) => r.synthetic === true)).toBe(true);
  });

  it("gives the same files for the same seed", () => {
    const fresh = generate(DEFAULT_SEED);
    for (const name of ["staff", "engagements", "timesheets", "usage"] as const) {
      const committed = readFileSync(path.join(__dirname, `${name}.json`), "utf8").replace(/\r\n/g, "\n");
      expect(toJson(fresh[name])).toBe(committed);
    }
    expect(generate(DEFAULT_SEED)).toEqual(fresh);
    expect(generate(DEFAULT_SEED + 1).timesheets).not.toEqual(fresh.timesheets);
  });

  it("has exactly three engagements over budget hours", () => {
    const over = data.engagements.filter((e) => hoursOn(e.id) > e.budgetHours);
    expect(over.map((e) => e.id).sort()).toEqual(["e-byrne", "e-murphy", "e-walsh"]);
  });

  it("puts most of the overrun on reconciliation and classification", () => {
    const recOrClassify = new Set<string>([ONET.recBank.task, ONET.recAccounts.task, ONET.classify.task]);
    for (const id of ["e-murphy", "e-byrne", "e-walsh"]) {
      const lines = data.timesheets.filter((l) => l.engagementId === id);
      const share = lines.filter((l) => recOrClassify.has(l.onetTask)).reduce((s, l) => s + l.hours, 0) / hoursOn(id);
      expect(share).toBeGreaterThan(0.4);
    }
  });

  it("has 12 staff across four teams and four offices, including Aoife and Harry", () => {
    expect(data.staff).toHaveLength(12);
    expect(new Set(data.staff.map((s) => s.team))).toEqual(new Set(TEAMS));
    expect(new Set(data.staff.map((s) => s.office))).toEqual(new Set(OFFICES));
    expect(data.staff.find((s) => s.id === AOIFE_ID)).toMatchObject({ name: "Aoife", team: "Tax", office: "Cork" });
    expect(data.staff.find((s) => s.id === HARRY_ID)).toMatchObject({ name: "Harry", role: "AI and Automation Analyst" });
  });

  it("has 10 engagements with fees from 8,000 to 60,000 euros and known deadline ids", () => {
    expect(data.engagements).toHaveLength(10);
    for (const e of data.engagements) {
      expect(e.fee).toBeGreaterThanOrEqual(8000);
      expect(e.fee).toBeLessThanOrEqual(60000);
      expect(DEADLINE_IDS).toContain(e.deadlineId);
    }
  });

  it("covers 8 weeks of weekdays with exact O*NET task statements", () => {
    const tasks = new Set<string>(Object.values(ONET).map((t) => t.task));
    const codes = new Set(Object.values(ONET).map((t) => t.code));
    expect(codes).toEqual(new Set(["13-2011.00", "13-2082.00", "43-3031.00"]));
    const engagementIds = new Set(data.engagements.map((e) => e.id));
    const staffIds = new Set(data.staff.map((s) => s.id));
    for (const l of data.timesheets) {
      expect(tasks.has(l.onetTask)).toBe(true);
      expect(engagementIds.has(l.engagementId)).toBe(true);
      expect(staffIds.has(l.staffId)).toBe(true);
      expect(l.date >= PERIOD.start && l.date <= PERIOD.end).toBe(true);
      expect([0, 6]).not.toContain(new Date(`${l.date}T00:00:00Z`).getUTCDay());
    }
    const weeks = new Set(data.timesheets.map((l) => Math.floor((Date.parse(l.date) - Date.parse(PERIOD.start)) / (7 * 86_400_000))));
    expect(weeks.size).toBe(8);
  });

  it("keeps each person to at most 8 logged hours a day", () => {
    const perDay = new Map<string, number>();
    for (const l of data.timesheets) perDay.set(l.staffId + l.date, (perDay.get(l.staffId + l.date) ?? 0) + l.hours);
    expect(Math.max(...perDay.values())).toBeLessThanOrEqual(8);
  });

  it("makes Aoife the heaviest AI user with the lowest verified rate", () => {
    const byStaff = new Map<string, { prompts: number; checked: number }>();
    for (const u of data.usage) {
      const s = byStaff.get(u.staffId) ?? { prompts: 0, checked: 0 };
      s.prompts += u.prompts;
      s.checked += u.verified * u.prompts;
      byStaff.set(u.staffId, s);
    }
    const rows = [...byStaff].map(([id, s]) => ({ id, prompts: s.prompts, rate: s.checked / s.prompts }));
    const aoife = rows.find((r) => r.id === AOIFE_ID)!;
    expect(Math.max(...rows.map((r) => r.prompts))).toBe(aoife.prompts);
    expect(Math.min(...rows.map((r) => r.rate))).toBe(aoife.rate);
    expect(aoife.rate).toBeLessThan(0.3);
  });
});
