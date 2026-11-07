// Adapters from the real world to Harry's panels. Server only: engine/meter reads files.
import type { LiteracyLogEntry, MeterReading, Recommendation, UsageRecord } from "@/contract/types";
import { recordShown, type LiteracyLog } from "@/engine/literacy";
import { euros, type EuroPrice } from "@/engine/meter";

/**
 * One meter reading per usage record: one person's AI work in one task category on one day.
 * Usage records come from synthetic Frame data. Euros use the price from data/public/prices.json,
 * so they stay null until a human fills it.
 */
export function meterFromUsage(usage: UsageRecord[], price: EuroPrice): MeterReading[] {
  return usage
    .filter((u) => u.prompts > 0)
    .map((u) => ({
      task: `${u.staffId} ${u.date} ${u.taskCategory}`,
      tokensIn: u.tokensIn,
      tokensOut: u.tokensOut,
      euros: euros(u.tokensIn, u.tokensOut, price),
      finished: true,
    }));
}

/** A "shown" literacy log entry for each recommendation the engine makes, dated `date`. */
export function literacyFromRecommendations(recs: Recommendation[], date: string): LiteracyLogEntry[] {
  return [...recs.reduce<LiteracyLog>((log, rec) => recordShown(log, rec, date), [])];
}
