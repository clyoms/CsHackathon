import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AskResponse, AthenaResponse, type AskRequest } from "@/contract/api";
import { askRequestFixture, athenaRequestFixture, staffFixture } from "@/contract/fixtures";
import sample from "@/engine/meter/sample-response.json";
import { POST as askPOST } from "./route";
import { POST as athenaPOST } from "../athena/route";
import { handleAsk, sourceName } from "./handler";
import { recommend } from "@/engine/recommend";
import { engagementsFor, fixtureWorld, linesForAnswers, realWorld } from "./world";
import { extractContext } from "@/engine/athena/triage";
import { loadRisk } from "@/catalogue";

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
    // The route now passes Athena's context (task, client, risk) to the recommender, so the test does too.
    const context = extractContext(
      askRequestFixture.question,
      askRequestFixture.athenaAnswers.map((a) => a.answer),
      engagementsFor(world, aoife.id),
    );
    const expected = recommend({ ...world, staff: aoife, lines: world.timesheets, context, risk: loadRisk() })!;
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
    // Live Claude adds the work type to the name.
    const live = linesForAnswers(world, "s-aoife", [{ question: "Which client is this for?", answer: "Murphy Engineering Ltd (CT1)" }]);
    expect(live.chosen?.id).toBe("e-murphy");
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
    const text = "Start with the transaction classification skill. It could give you about 1 hours back (Frame data).";
    const create = vi.fn().mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text }], usage: sample.usage });
    const body = await handleAsk(req, { world, client: { messages: { create } } as never });
    expect(create.mock.calls[0][0].model).toBe("claude-sonnet-5-5");
    expect(create.mock.calls[0][0].messages[0].content).toContain("Hours back before the deadline: 1 hours");
    expect(create.mock.calls[0][0].messages[0].content).toContain("View: Employee");
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

  it("never tells Claude about a deadline when no countdown shows", async () => {
    const create = vi.fn().mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: "Short answer." }], usage: sample.usage });
    const body = await handleAsk(
      { question: "Summarise the working papers on the Lee Clinics audit file", view: "employee", staffId: "s-sinead", athenaAnswers: [] },
      { world: realWorld("2026-11-07"), client: { messages: { create } } as never },
    );
    expect(body.card?.deadline).toBeNull();
    const content: string = create.mock.calls[0][0].messages[0].content;
    expect(content).not.toMatch(/before the deadline/i);
    expect(content).toContain("Hours back:");
    expect(content).toContain("Deadline: none. Do not mention a deadline.");
    expect(create.mock.calls[0][0].system).toMatch(/Mention a deadline only when one is given/);
  });

  it("puts the item's risk on the card", async () => {
    const body = await handleAsk(
      { question: "I'm worried AI will get the numbers wrong. What's a safe first step?", view: "employee", staffId: "s-niamh", athenaAnswers: [] },
      { world: realWorld("2026-11-07"), client: null },
    );
    const item = body.card!.recommendation.item;
    expect(item.risk).toBe(loadRisk()[item.id]);
    expect(item.risk).toBe("low");
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

describe("offline label (A1)", () => {
  it("marks both routes offline with a reason and logs it when no key is set", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const a = await (await athenaPOST(post(athenaRequestFixture))).json();
    expect(a.offline).toBe(true);
    expect(a.offlineReason).toMatch(/ANTHROPIC_API_KEY/);
    expect(a.tokensUsed).toBe(0);
    const b = await (await askPOST(post(askRequestFixture))).json();
    expect(b.offline).toBe(true);
    expect(b.offlineReason).toMatch(/ANTHROPIC_API_KEY/);
    expect(warn.mock.calls.flat().join(" ")).toMatch(/\[ask\] offline answer/);
  });

  it("marks Athena offline with no key even when no questions are needed", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const body = { ...athenaRequestFixture, request: "Reconcile the Murphy bank account and give me a table of unmatched items" };
    const a = await (await athenaPOST(post(body))).json();
    expect(a.offline).toBe(true);
    expect(a.offlineReason).toMatch(/ANTHROPIC_API_KEY/);
    expect(warn).toHaveBeenCalled();
  });

  it("reports offline=false and real tokens when Claude answers", async () => {
    const create = vi.fn().mockResolvedValue({ stop_reason: "end_turn", content: [{ type: "text", text: "Short answer." }], usage: sample.usage });
    const world = fixtureWorld();
    const body = await handleAsk(askRequestFixture as AskRequest, { world, client: { messages: { create } } as never });
    expect(body.offline).toBe(false);
    expect(body.tokensUsed).toBeGreaterThan(0);
  });
});

describe("employee acceptance prompts with no key (T-14)", () => {
  const ask = async (question: string, answers: { question: string; answer: string }[] = []) =>
    (await askPOST(post({ question, view: "employee", staffId: "s-aoife", athenaAnswers: answers }))).json();

  it("declines the weather in one line with no numbers", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const a = await (await athenaPOST(post({ staffId: "s-aoife", request: "What's the weather in Cork?" }))).json();
    expect(a.outcome).toEqual({ kind: "decline", message: "Frame Next helps with work tasks." });
    expect(a.result.questions).toHaveLength(0);
  });

  it("counts down to Friday for a VAT return and never picks an item that is not about VAT", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const body = await ask("Can AI do my VAT return for Byrne Foods by Friday?", [
      { question: "What do you want back?", answer: "A table I can paste" },
    ]);
    if (body.outcome?.kind === "no_match") {
      expect(body.outcome.message).toMatch(/no matching skill/);
      expect(body.outcome.message).toMatch(/6 days to go/);
      expect(body.numbers).toHaveLength(0);
    } else {
      expect(body.card.deadline).toMatchObject({ dueDate: "2026-11-13", daysLeft: 6 });
      expect(`${body.card.recommendation.item.title} ${body.card.recommendation.item.plainSummary}`).toMatch(/vat/i);
    }
  });

  it("gives the lowest-risk item with a check step to someone who does not trust AI", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const risk = loadRisk();
    const body = await ask("I don't trust AI, what's the safest thing to start with?", [
      { question: "Which client is this for?", answer: "All my clients" },
    ]);
    const item = body.card.recommendation.item;
    expect(item.verifyStep.trim()).not.toBe("");
    expect(risk[item.id]).toBe("low");
  });

  it("keeps the estimate line out of the answer", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const body = await ask("What should I hand to AI before 18 November?", [
      { question: "Which client is this for?", answer: "All my clients" },
    ]);
    expect(body.answer).not.toMatch(/30%|estimate assumes/i);
    expect(body.card.deadline).toMatchObject({ dueDate: "2026-11-18", daysLeft: 11 });
  });

  it("shows no countdown when the question names no date or filing task", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const body = await ask("I don't trust AI, what's the safest thing to start with?", [
      { question: "Which client is this for?", answer: "All my clients" },
    ]);
    expect(body.card.deadline).toBeNull();
  });
});

describe("sourceName", () => {
  it("names known sources", () => {
    expect(sourceName("https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main/x.csv")).toBe("Anthropic Economic Index");
    expect(sourceName("https://www.irs.gov/filing")).toBe("IRS");
    expect(sourceName(undefined)).toBe("Frame data");
  });
});
