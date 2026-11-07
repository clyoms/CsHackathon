import { describe, expect, it } from "vitest";
import { Deadline, JobExposure, TaskScore } from "@/contract/types";
import { deadlineFixture, taskScoreFixture } from "@/contract/fixtures";
import { priceFor, NO_PRICE } from "@/engine/meter";
import {
  CsoAdoption,
  EurostatAdoption,
  Holiday,
  Prices,
  loadCsoAdoption,
  loadDeadlines,
  loadEurostatAdoption,
  loadHolidays,
  loadJobExposure,
  loadPrices,
  loadPublicData,
  loadTaskScores,
} from "./index";

describe("public data loads through the schemas", () => {
  it("loads every file", () => {
    const d = loadPublicData();
    for (const r of d.jobExposure) expect(JobExposure.safeParse(r).success).toBe(true);
    for (const r of d.taskScores) expect(TaskScore.safeParse(r).success).toBe(true);
    for (const r of d.deadlines) expect(Deadline.safeParse(r).success).toBe(true);
    for (const r of d.holidays) expect(Holiday.safeParse(r).success).toBe(true);
    for (const r of d.csoAdoption) expect(CsoAdoption.safeParse(r).success).toBe(true);
    for (const r of d.eurostatAdoption) expect(EurostatAdoption.safeParse(r).success).toBe(true);
    expect(Prices.safeParse(d.prices).success).toBe(true);
    expect(d.jobExposure.length).toBeGreaterThan(700);
    expect(d.taskScores.length).toBeGreaterThan(300);
    expect(d.csoAdoption.length).toBeGreaterThan(50);
  });
});

describe("job exposure", () => {
  it("has Accountants and Auditors at 0.3478 and Tax Preparers at 0.1283", () => {
    const byTitle = new Map(loadJobExposure().map((j) => [j.title, j]));
    expect(byTitle.get("Accountants and Auditors")?.observedExposure).toBe(0.3478);
    expect(byTitle.get("Tax Preparers")?.observedExposure).toBe(0.1283);
    expect(byTitle.get("Accountants and Auditors")?.occCode).toBe("13-2011");
  });
});

describe("task penetration", () => {
  it("keeps only finance tasks", () => {
    const words = /\b(accounting|accountant|audit|tax|ledger|reconcil|payroll|invoice|financial statement|budget)/i;
    for (const t of loadTaskScores()) expect(t.onetTask).toMatch(words);
  });

  it("matches the contract fixture's real value", () => {
    const t = loadTaskScores().find((s) => s.onetTask === taskScoreFixture.onetTask);
    expect(t?.penetration).toBe(taskScoreFixture.penetration);
    expect(t?.source).toBe(taskScoreFixture.source);
  });
});

describe("deadlines", () => {
  it("has the Revenue dates read from eBrief 034/26 marked checked", () => {
    const byId = new Map(loadDeadlines().map((d) => [d.id, d]));
    expect(byId.get("ie-ros-2026")).toEqual(deadlineFixture);
    expect(byId.get("ie-form11-2026")).toMatchObject({ date: "2026-10-31", checked: true });
  });

  it("covers every jurisdiction in the plan, sorted by date, with unique ids", () => {
    const all = loadDeadlines();
    expect(new Set(all.map((d) => d.jurisdiction))).toEqual(new Set(["IE", "US", "KY"]));
    expect(all.map((d) => d.date)).toEqual([...all.map((d) => d.date)].sort());
    expect(new Set(all.map((d) => d.id)).size).toBe(all.length);
    for (const id of ["us-est-2026-q4", "us-1065-1120s-2026", "us-1040-2026", "ky-far-2026"]) {
      expect(all.some((d) => d.id === id)).toBe(true);
    }
  });

  it("marks only the two eBrief dates checked", () => {
    const checked = loadDeadlines().filter((d) => d.checked).map((d) => d.id);
    expect(checked.sort()).toEqual(["ie-form11-2026", "ie-ros-2026"]);
  });
});

describe("holidays and adoption", () => {
  it("has Irish public holidays for both years", () => {
    const h = loadHolidays();
    expect(h.some((x) => x.date === "2026-12-25")).toBe(true);
    expect(h.some((x) => x.date.startsWith("2027-"))).toBe(true);
  });

  it("reads CSO ICA237 values", () => {
    const all = loadCsoAdoption().find(
      (r) => r.statistic === "Enterprises using Artificial Intelligence" && r.year === 2023 && r.sizeClass === "All Enterprises",
    );
    expect(all?.percent).toBe(8.1);
  });

  it("decodes Eurostat for Ireland and the EU", () => {
    const rows = loadEurostatAdoption();
    expect(new Set(rows.map((r) => r.geo))).toEqual(new Set(["IE", "EU27_2020"]));
    expect(new Set(rows.map((r) => r.nace))).toEqual(new Set(["M69-M71", "C10-S951_X_K"]));
    const eu2021 = rows.find((r) => r.geo === "EU27_2020" && r.nace === "C10-S951_X_K" && r.year === 2021);
    expect(eu2021?.percent).toBe(7.65);
  });
});

describe("prices", () => {
  it("starts with null prices, so the meter shows tokens only", () => {
    const p = loadPrices();
    expect(p.models["claude-sonnet-5-5"]).toEqual({ inputPerMTok: null, outputPerMTok: null });
    expect(priceFor("claude-sonnet-5-5", p)).toEqual(NO_PRICE);
  });
});
