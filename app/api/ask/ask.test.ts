import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AskResponse, AthenaResponse, type AskRequest } from "@/contract/api";
import { askRequestFixture, athenaRequestFixture, staffFixture } from "@/contract/fixtures";
import sample from "@/engine/meter/sample-response.json";
import { POST as askPOST } from "./route";
import { POST as athenaPOST } from "../athena/route";
import { handleAsk, sourceName } from "./handler";
import { recommend } from "@/engine/recommend";
import { fixtureWorld, linesForAnswers, realWorld } from "./world";

const post = (body: unknown) =>
  new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

// Every route test runs with no key, on a fixed date: 11 days before the 18 Nov ROS deadline.
let savedKey: string | undefined;
beforeEach(() => {
  savedKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  process.env.FRAME_TODAY = "2026-11-07";
});
afterEach(() => {
  if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  delete process.env.FRAME_TODAY;
  vi.restoreAllMocks();
});

describe("POST /api/athena with no key", () => {
  it("returns a contract-valid response with questions for a vague request", async () => {
    const res = await athenaPOST(post(athenaRequestFixture));
    expect(res.status).toBe(200);
    const body = AthenaResponse.parse(await res.json());
    expect(body.fallback).toBe(true);
    expect(body.result.needed).toBe(true);
    expect(body.result.questions.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects a bad body and an unknown person with 400", async () => {
    expect((await athenaPOST(post({ request: "x" }))).status).toBe(400);
    expect((await athenaPOST(post({ staffId: "nobody", request: "x" }))).status).toBe(400);
  });
});

describe("POST /api/ask with no key", () => {
  it.each(["employee", "partner", "harry"] as const)("returns a contract-valid %s answer", async (view) => {
    const res = await askPOST(post({ ...askRequestFixture, view }));
    expect(res.status).toBe(200);
    const body = AskResponse.parse(await res.json());
    expect(body.fallback).toBe(true);
    expect(body.numbers.length).toBeGreaterThan(0);
    expect(body.meter).toMatchObject({ task: "ask", tokensIn: 0, tokensOut: 0, finished: true });
    expect(body.answer.split(/\s+/).length).toBeLessThanOrEqual(80);
  });

  it("gives Aoife hours and euros from the engine on real data, and the deadline with its source", async () => {
    // The route runs on the real world. A non-client Athena answer keeps all of Aoife's work.
    const world = realWorld("2026-11-07");
    const aoife = world.staff.find((s) => s.id === askRequestFixture.staffId)!;
    const expected = recommend({ ...world, staff: aoife, lines: world.timesheets })!;
    const body = AskResponse.parse(await (await askPOST(post(askRequestFixture))).json());
    const hours = body.numbers.find((n) => n.label === "Hours back before the deadline")!;
    expect(hours.value).toBe(expected.hoursBackEstimate);
    expect(body.numbers.find((n) => n.label === "Euros back")?.value).toBe(expected.eurosBack);
    expect(body.answer).toContain(`about ${hours.value} hours back`);
    expect(body.answer).toContain(expected.item.title);
    const days = body.numbers.find((n) => n.unit === "days")!;
    expect(days).toMatchObject({ value: 11, synthetic: false, source: "https://www.revenue.ie/en/tax-professionals/ebrief/2026/no-0342026.aspx" });
    expect(body.answer).toContain("(Revenue)");
    expect(body.answer).toContain("18 November");
  });

  it("narrows to the client Aoife picks, using the same lines as the employee page", async () => {
    const world = realWorld("2026-11-07");
    const answers = [{ question: "Which client is this for?", answer: "Murphy Engineering Ltd" }];
    const { chosen, lines } = linesForAnswers(world, "s-aoife", answers);
    expect(chosen?.id).toBe("e-murphy");
    expect(lines.every((l) => l.engagementId === "e-murphy")).toBe(true);
    const all = linesForAnswers(world, "s-aoife", [{ question: "Which client is this for?", answer: "All my clients" }]);
    expect(all.chosen).toBeUndefined();
    expect(all.lines).toHaveLength(world.timesheets.length);
  });

  it("marks every number synthetic or gives it a source", async () => {
    for (const view of ["employee", "partner", "harry"] as const) {
      const body = AskResponse.parse(await (await askPOST(post({ ...askRequestFixture, view }))).json());
      for (const n of body.numbers) expect(n.synthetic || Boolean(n.source)).toBe(true);
    }
  });

  it("rejects a bad body, a missing staffId and an unknown person with 400", async () => {
    expect((await askPOST(post({ view: "employee" }))).status).toBe(400);
    expect((await askPOST(post({ question: "q", view: "employee" }))).status).toBe(400);
    expect((await askPOST(post({ question: "q", view: "employee", staffId: "nobody" }))).status).toBe(400);
  });
});

describe("ask with a stubbed Claude client", () => {
  const req: AskRequest = { ...askRequestFixture };
  const world = fixtureWorld("2026-11-07");

  it("returns Claude's answer and meters its usage", async () => {
    const text = "Start with the transaction classification skill. It could give you about 1 hours back (synthetic Frame data).";
    const create = vi.fn().mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text }], usage: sample.usage });
    const body = await handleAsk(req, { world, client: { messages: { create } } as never });
    expect(create.mock.calls[0][0].model).toBe("claude-sonnet-5-5");
    expect(create.mock.calls[0][0].messages[0].content).toContain("Hours back before the deadline: 1 hours");
    expect(body).toMatchObject({ answer: text, fallback: false });
    expect(body.meter).toMatchObject({ tokensIn: 1612, tokensOut: 96, finished: true });
  });

  it("falls back to the template when Claude's answer is over 80 words", async () => {
    const long = Array(81).fill("word").join(" ");
    const create = vi.fn().mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: long }], usage: sample.usage });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const body = await handleAsk(req, { world, client: { messages: { create } } as never });
    expect(body.fallback).toBe(true);
    expect(body.answer).not.toBe(long);
  });

  it("uses the client chosen in Athena's answer", async () => {
    const body = await handleAsk(
      { ...req, athenaAnswers: [{ question: "Which client is this for?", answer: "Murphy Engineering Ltd" }] },
      { world, client: null },
    );
    expect(body.answer).toContain("for Murphy Engineering Ltd");
    expect(staffFixture.id).toBe(req.staffId);
  });
});

describe("sourceName", () => {
  it("names known sources", () => {
    expect(sourceName("https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main/x.csv")).toBe("Anthropic Economic Index");
    expect(sourceName("https://www.irs.gov/filing")).toBe("IRS");
    expect(sourceName(undefined)).toBe("synthetic Frame data");
  });
});
