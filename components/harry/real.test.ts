import { describe, expect, it } from "vitest";
import { recommendationFixture, usageRecordFixture } from "@/contract/fixtures";
import { MeterReading, LiteracyLogEntry } from "@/contract/types";
import { NO_PRICE } from "@/engine/meter";
import { literacyFromRecommendations, meterFromUsage } from "./real";

describe("Harry real-data adapters", () => {
  it("turns each usage record with prompts into one finished meter reading", () => {
    const usage = [usageRecordFixture, { ...usageRecordFixture, prompts: 0 }];
    const readings = meterFromUsage(usage, NO_PRICE);
    expect(readings).toHaveLength(1);
    expect(MeterReading.parse(readings[0])).toMatchObject({ tokensIn: 61000, tokensOut: 18500, euros: null, finished: true });
  });

  it("prices readings only when both prices are known", () => {
    const [r] = meterFromUsage([usageRecordFixture], { inputPerMTok: 2, outputPerMTok: 10 });
    // 61,000 × €2 / 1M + 18,500 × €10 / 1M = €0.122 + €0.185 = €0.307
    expect(r.euros).toBeCloseTo(0.307, 10);
  });

  it("logs one shown entry per recommendation", () => {
    const log = literacyFromRecommendations([recommendationFixture], "2026-11-07");
    expect(log).toHaveLength(1);
    expect(LiteracyLogEntry.parse(log[0])).toEqual({
      staffId: recommendationFixture.staffId,
      date: "2026-11-07",
      measure: "shown",
      itemId: recommendationFixture.item.id,
      adopted: false,
    });
  });
});
