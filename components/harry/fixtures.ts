// Harry view test world, built from contract/fixtures.ts plus more synthetic rows.
// Every row here is made up. The final task swaps this for data/frame and the live literacy log.
import { literacyLogEntryFixture, staffFixture, usageRecordFixture } from "@/contract/fixtures";
import type { LiteracyLogEntry, MeterReading, Staff, UsageRecord } from "@/contract/types";

export interface HarryWorld {
  staff: Staff[];
  usage: UsageRecord[];
  /** One reading per task run through the meter. */
  meter: MeterReading[];
  literacyLog: LiteracyLogEntry[];
}

const staff: Staff[] = [
  staffFixture,
  { id: "s-harry", name: "Harry", role: "AI and Automation Analyst", team: "Business Finance", chargeRate: 120, synthetic: true },
  { id: "s-niamh", name: "Niamh", role: "Tax Senior", team: "Tax", chargeRate: 130, synthetic: true },
  { id: "s-conor", name: "Conor", role: "Tax Manager", team: "Tax", chargeRate: 175, synthetic: true },
  { id: "s-eoin", name: "Eoin", role: "Audit Assistant", team: "Audit", chargeRate: 80, synthetic: true },
  { id: "s-maeve", name: "Maeve", role: "Audit Manager", team: "Audit", chargeRate: 170, synthetic: true },
  { id: "s-rachel", name: "Rachel", role: "Bookkeeper", team: "Business Finance", chargeRate: 70, synthetic: true },
  { id: "s-keisha", name: "Keisha", role: "Private Wealth Associate", team: "Private Wealth", chargeRate: 140, synthetic: true },
  { id: "s-tom", name: "Tom", role: "Private Wealth Manager", team: "Private Wealth", chargeRate: 190, synthetic: true },
];

const u = (staffId: string, date: string, prompts: number, verified: number, taskCategory: string): UsageRecord => ({
  ...usageRecordFixture,
  staffId,
  date,
  prompts,
  tokensIn: prompts * 1400,
  tokensOut: prompts * 420,
  verified,
  taskCategory,
});

// Conor and Maeve have no usage, so they are not active users.
const usage: UsageRecord[] = [
  usageRecordFixture, // Aoife, 42 prompts, 20% checked
  u("s-aoife", "2026-11-04", 51, 0.15, "reconciliation"),
  u("s-aoife", "2026-11-05", 38, 0.25, "client email"),
  u("s-harry", "2026-11-03", 35, 0.9, "spreadsheet formulas"),
  u("s-harry", "2026-11-05", 40, 0.85, "report drafting"),
  u("s-niamh", "2026-11-03", 12, 0.75, "tax research"),
  u("s-niamh", "2026-11-05", 14, 0.7, "client email"),
  u("s-eoin", "2026-11-04", 22, 0.45, "data classification"),
  u("s-eoin", "2026-11-05", 18, 0.5, "report drafting"),
  u("s-rachel", "2026-11-04", 9, 0.55, "data classification"),
  u("s-keisha", "2026-11-03", 10, 0.7, "meeting notes"),
  u("s-tom", "2026-11-05", 3, 0.9, "client email"),
];

/** 40 task readings with a long tail: a few unclear tasks use far more tokens. Deterministic. */
function meterReadings(): MeterReading[] {
  const out: MeterReading[] = [];
  for (let i = 0; i < 40; i++) {
    const heavy = i % 10 === 3; // 4 of 40 tasks run long
    const tokensIn = heavy ? 52000 + i * 900 : 6000 + ((i * 1373) % 5000);
    const tokensOut = heavy ? 14000 + i * 200 : 1200 + ((i * 611) % 1500);
    out.push({ task: `task-${String(i + 1).padStart(2, "0")}`, tokensIn, tokensOut, euros: null, finished: i % 13 !== 7 });
  }
  return out;
}

const literacyLog: LiteracyLogEntry[] = [
  { ...literacyLogEntryFixture, date: "2026-11-02" },
  { staffId: "s-aoife", date: "2026-11-03", measure: "adopted", itemId: "skill-transaction-classify", adopted: true },
  { staffId: "s-eoin", date: "2026-11-03", measure: "shown", itemId: "hook-check-the-output", adopted: false },
  { staffId: "s-niamh", date: "2026-11-04", measure: "shown", itemId: "skill-client-query-reply", adopted: false },
  { staffId: "s-niamh", date: "2026-11-05", measure: "adopted", itemId: "skill-client-query-reply", adopted: true },
  { staffId: "s-rachel", date: "2026-11-05", measure: "shown", itemId: "skill-bank-reconciliation", adopted: false },
];

export function harryFixtureWorld(): HarryWorld {
  return { staff, usage, meter: meterReadings(), literacyLog };
}
