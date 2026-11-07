import { describe, expect, it } from "vitest";
import { MeterReading } from "@/contract/types";
import sample from "./sample-response.json";
import { Meter, NO_PRICE, euros, loadPrice, priceFor, readingFromUsage, tokensIn } from "./index";

const EUR_PRICE = { inputPerMTok: 2, outputPerMTok: 10 };

describe("meter", () => {
  it("adds up usage from a recorded sample response", () => {
    // 412 input + 0 cache writes + 1,200 cache reads = 1,612 in. 96 out.
    expect(tokensIn(sample.usage)).toBe(1612);
    const r = readingFromUsage("athena-intake", sample.usage, NO_PRICE, false);
    expect(r).toEqual({ task: "athena-intake", tokensIn: 1612, tokensOut: 96, euros: null, finished: false });
    expect(MeterReading.safeParse(r).success).toBe(true);
  });

  it("shows tokens only when a price is null", () => {
    expect(euros(1000, 1000, NO_PRICE)).toBeNull();
    expect(euros(1000, 1000, { inputPerMTok: 2, outputPerMTok: null })).toBeNull();
  });

  it("converts tokens to euros when prices are known", () => {
    // (1,612 x 2 + 96 x 10) / 1,000,000 = 0.004184 euros
    expect(euros(1612, 96, EUR_PRICE)).toBeCloseTo(0.004184, 9);
  });

  it("reads prices.json shapes and never invents a price", () => {
    const filled = { currency: "EUR", models: { "claude-sonnet-5-5": { inputPerMTok: 2, outputPerMTok: 10 } } };
    expect(priceFor("claude-sonnet-5-5", filled)).toEqual(EUR_PRICE);
    const nulls = { models: { "claude-sonnet-5-5": { inputPerMTok: null, outputPerMTok: null } } };
    expect(priceFor("claude-sonnet-5-5", nulls)).toEqual(NO_PRICE);
    // USD converts only with an explicit rate.
    const usd = { currency: "USD", models: { "claude-sonnet-5-5": { inputPerMTok: 2, outputPerMTok: 10 } } };
    expect(priceFor("claude-sonnet-5-5", usd)).toEqual(NO_PRICE);
    const converted = priceFor("claude-sonnet-5-5", { ...usd, usdToEur: 0.9 });
    expect(converted.inputPerMTok).toBeCloseTo(1.8);
    expect(converted.outputPerMTok).toBeCloseTo(9);
    expect(priceFor("other-model", filled)).toEqual(NO_PRICE);
    expect(priceFor("claude-sonnet-5-5", null)).toEqual(NO_PRICE);
    expect(loadPrice("claude-sonnet-5-5", "no/such/prices.json")).toEqual(NO_PRICE);
  });

  it("keeps a running tokens-per-finished-task figure", () => {
    const m = new Meter(EUR_PRICE);
    // Task a: two calls, then finished. 3,224 in + 192 out = 3,416 tokens.
    m.record("a", sample.usage);
    m.record("a", sample.usage);
    m.finish("a");
    // Task b: one call, finished. 1,708 tokens.
    m.record("b", sample.usage);
    m.finish("b");
    // Task c: one call, not finished, so left out of the per-task figure.
    m.record("c", sample.usage);

    expect(m.tokensPerFinishedTask()).toBe((3416 + 1708) / 2); // 2,562
    expect(m.totals()).toMatchObject({ tokensIn: 1612 * 4, tokensOut: 96 * 4 });
    // Average finished task: 2,418 in, 144 out -> (2,418 x 2 + 144 x 10) / 1e6 = 0.006276 euros
    expect(m.eurosPerFinishedTask()).toBeCloseTo(0.006276, 9);
    expect(m.readings().map((r) => r.finished)).toEqual([true, true, false]);
  });

  it("gives null per-task figures before any task finishes or with no price", () => {
    const m = new Meter();
    expect(m.tokensPerFinishedTask()).toBeNull();
    m.record("a", sample.usage);
    m.finish("a");
    expect(m.tokensPerFinishedTask()).toBe(1708);
    expect(m.eurosPerFinishedTask()).toBeNull();
  });
});
