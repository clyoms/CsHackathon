import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AthenaResult, MeterReading } from "@/contract/types";
import { engagementFixture, staffFixture } from "@/contract/fixtures";
import sample from "@/engine/meter/sample-response.json";
import { fallbackQuestions, findGaps, namedClient, runAthena, type AthenaContext } from "./index";

const ctx: AthenaContext = {
  staff: staffFixture,
  engagements: [engagementFixture, { ...engagementFixture, id: "e-byrne", client: "Byrne Foods" }],
};

// Every test here runs with no key.
let savedKey: string | undefined;
beforeEach(() => {
  savedKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});
afterEach(() => {
  if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  vi.restoreAllMocks();
});

describe("athena with no key (fallback)", () => {
  it("asks at least one question for a vague request", async () => {
    const out = await runAthena("help with Murphy", ctx);
    expect(out.fallback).toBe(true);
    expect(out.result.needed).toBe(true);
    expect(out.result.questions.length).toBeGreaterThanOrEqual(1);
    expect(out.result.questions.length).toBeLessThanOrEqual(3);
    expect(out.result.tokensUsed).toBe(0);
    expect(AthenaResult.safeParse(out.result).success).toBe(true);
    expect(MeterReading.safeParse(out.meter).success).toBe(true);
  });

  it("asks nothing when the request names the client, the task and the output", async () => {
    const out = await runAthena("Reconcile the Murphy bank account and give me a table of unmatched items", ctx);
    expect(out.result).toEqual({ needed: false, questions: [], tokensUsed: 0 });
    expect(out.meter.tokensIn + out.meter.tokensOut).toBe(0);
  });

  it("asks exactly one question for the demo request", async () => {
    const out = await runAthena("What should I hand to AI before 18 November?", ctx);
    expect(out.result.questions).toHaveLength(1);
    expect(out.result.questions[0].options).toEqual(["Murphy Engineering Ltd", "Byrne Foods"]);
  });
});

describe("gap rules", () => {
  it("finds the client by full name or first word", () => {
    expect(namedClient("help with Murphy", ctx.engagements)?.id).toBe("e-murphy");
    expect(namedClient("byrne foods VAT", ctx.engagements)?.id).toBe("e-byrne");
    expect(namedClient("help with Murphyville", ctx.engagements)).toBeNull();
  });

  it("lists what a vague request leaves out", () => {
    expect(findGaps("help with Murphy", ctx)).toEqual(["task", "output"]);
    expect(findGaps("help", ctx)).toEqual(["client", "task", "output"]);
    expect(findGaps("What should I hand to AI for Murphy?", ctx)).toEqual([]);
  });

  it("writes one valid question per gap, three at most", () => {
    const qs = fallbackQuestions(["client", "task", "output"], ctx);
    expect(qs).toHaveLength(3);
    for (const q of qs) expect(q.options.length).toBeGreaterThanOrEqual(2);
  });
});

describe("athena with a stubbed Claude client", () => {
  const parsed = JSON.parse(sample.content[0].text);

  it("uses Claude's questions and meters its usage", async () => {
    const parse = vi.fn().mockResolvedValue({ stop_reason: "end_turn", parsed_output: parsed, usage: sample.usage });
    const out = await runAthena("help with Murphy", ctx, { client: { messages: { parse } } as never });
    expect(parse).toHaveBeenCalledOnce();
    expect(parse.mock.calls[0][0].model).toBe("claude-sonnet-5-5");
    expect(out.fallback).toBe(false);
    expect(out.result.questions[0].question).toBe("Which part of the Murphy job do you want help with?");
    expect(out.meter).toMatchObject({ tokensIn: 1612, tokensOut: 96, euros: null });
    expect(out.result.tokensUsed).toBe(1708);
  });

  it("falls back to the sample questions when Claude fails", async () => {
    const parse = vi.fn().mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await runAthena("help with Murphy", ctx, { client: { messages: { parse } } as never });
    expect(out.fallback).toBe(true);
    expect(out.result.questions).toHaveLength(2);
  });
});
