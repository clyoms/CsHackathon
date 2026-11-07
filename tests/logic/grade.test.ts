import { describe, expect, it } from "vitest";
import {
  gradeCase,
  gradeClarify,
  gradeDeadlinePhrase,
  gradeLowRisk,
  gradeNamedDate,
  gradeNoNumbersOnDecline,
  gradeOutcome,
  gradeSkill,
  namedDateIn,
  skillFitsTask,
  type PromptEntry,
} from "../../scripts/logic-check/grade.mjs";
import prompts from "./prompts.json";

const decline = (message = "Frame Next helps with work tasks.") => ({
  outcome: { kind: "decline", message },
  result: { needed: false, questions: [] },
});
const athenaSkill = { outcome: { kind: "skill" }, result: { needed: false, questions: [] } };
const item = (id: string, risk = "medium", verifyStep = "Check three lines.") => ({ id, title: id, risk, verifyStep });
const askCard = (id: string, deadline: unknown = null, answer = "Start with the skill.", risk?: string) => ({
  answer,
  outcome: { kind: "skill" },
  card: { recommendation: { item: item(id, risk) }, deadline },
});
const askNoMatch = (answer = "There is no matching skill for payroll yet.") => ({ answer, outcome: { kind: "no_match", message: answer } });
// 2026-11-13 is a Friday.
const friday = { label: "Your deadline, Friday", dueDate: "2026-11-13", daysLeft: 6, source: "user" };

describe("prompt bank", () => {
  it("has 30 prompts with unique ids and the fields the runner needs", () => {
    const bank = prompts as PromptEntry[];
    expect(bank).toHaveLength(30);
    expect(new Set(bank.map((p) => p.id)).size).toBe(30);
    for (const p of bank) {
      expect(p.staffId).toMatch(/^s-/);
      expect(p.prompt.length).toBeGreaterThan(0);
      expect(["decline", "answer"]).toContain(p.expected.outcome);
    }
  });
});

describe("gradeOutcome", () => {
  it("passes a decline that was expected", () => {
    expect(gradeOutcome({ outcome: "decline" }, { athena: decline() }).pass).toBe(true);
  });
  it("fails when a decline was expected but Athena went on", () => {
    expect(gradeOutcome({ outcome: "decline" }, { athena: athenaSkill, ask: askCard("skill-bank-reconciliation") }).pass).toBe(false);
  });
  it("fails a decline when an answer was expected", () => {
    expect(gradeOutcome({ outcome: "answer" }, { athena: decline() }).pass).toBe(false);
  });
  it("passes a written answer when one was expected", () => {
    expect(gradeOutcome({ outcome: "answer" }, { athena: athenaSkill, ask: askCard("skill-ct1-review-checklist") }).pass).toBe(true);
  });
});

describe("gradeNoNumbersOnDecline", () => {
  it("does not apply when there is no decline", () => {
    expect(gradeNoNumbersOnDecline({ athena: athenaSkill })).toBeNull();
  });
  it("passes a plain one-line decline", () => {
    expect(gradeNoNumbersOnDecline({ athena: decline(), ask: null })?.pass).toBe(true);
  });
  it("fails a decline with a number in it", () => {
    expect(gradeNoNumbersOnDecline({ athena: decline("It is 14 degrees, €0 saved.") })?.pass).toBe(false);
  });
  it("fails a decline followed by a skill card", () => {
    expect(gradeNoNumbersOnDecline({ athena: decline(), ask: askCard("skill-bank-reconciliation") })?.pass).toBe(false);
  });
});

describe("gradeClarify", () => {
  const questions = { outcome: { kind: "clarify" }, result: { needed: true, questions: [{ question: "Which client?", options: ["A", "B"] }] } };
  it("passes when a vague prompt gets questions", () => {
    expect(gradeClarify({ outcome: "answer", clarify: true }, { athena: questions })?.pass).toBe(true);
  });
  it("fails when a vague prompt gets no questions", () => {
    expect(gradeClarify({ outcome: "answer", clarify: true }, { athena: athenaSkill })?.pass).toBe(false);
  });
});

describe("gradeNamedDate", () => {
  const exp = { outcome: "answer" as const, namedDate: true };
  it("passes a countdown to the named weekday", () => {
    expect(gradeNamedDate("VAT for Byrne Foods by Friday", exp, { ask: askCard("x", friday) })?.pass).toBe(true);
  });
  it("fails a countdown to a filing date instead of the named weekday", () => {
    const ros = { label: "ROS pay and file", dueDate: "2026-11-18", daysLeft: 11, source: "catalogue" };
    expect(gradeNamedDate("VAT for Byrne Foods by Friday", exp, { ask: askCard("x", ros) })?.pass).toBe(false);
  });
  it("passes a catalogue deadline on the named day and month", () => {
    const ros = { label: "ROS pay and file", dueDate: "2026-11-18", daysLeft: 11, source: "catalogue" };
    expect(gradeNamedDate("What should I hand to AI before 18 November?", exp, { ask: askCard("x", ros) })?.pass).toBe(true);
  });
  it("fails when a date was named but no countdown shows", () => {
    expect(gradeNamedDate("by Friday", exp, { ask: askCard("x", null) })?.pass).toBe(false);
  });
  it("passes a no-match line that still counts down", () => {
    expect(gradeNamedDate("payroll by Friday", exp, { ask: askNoMatch("There is no matching skill for payroll yet. Your deadline, Friday: 6 days to go.") })?.pass).toBe(true);
  });
  it("fails a user countdown when no date was named", () => {
    expect(gradeNamedDate("reconcile Byrne Foods", { outcome: "answer", namedDate: false }, { ask: askCard("x", friday) })?.pass).toBe(false);
  });
  it("passes a filing-date countdown when no date was named", () => {
    const ct1 = { label: "CT1 return and balance", dueDate: "2026-11-23", daysLeft: 16, source: "catalogue" };
    expect(gradeNamedDate("CT1 for Murphy", { outcome: "answer", namedDate: false }, { ask: askCard("x", ct1) })?.pass).toBe(true);
  });
  it("checks tomorrow by days left", () => {
    const tomorrow = { label: "Your deadline, tomorrow", dueDate: "2026-11-08", daysLeft: 1, source: "user" };
    expect(gradeNamedDate("send it by tomorrow", exp, { ask: askCard("x", tomorrow) })?.pass).toBe(true);
    expect(gradeNamedDate("send it by tomorrow", exp, { ask: askCard("x", { ...tomorrow, daysLeft: 3 }) })?.pass).toBe(false);
  });
  it("reads dates out of prompt text", () => {
    expect(namedDateIn("before 18 November")).toEqual({ kind: "dayMonth", day: 18, month: 10 });
    expect(namedDateIn("by Friday")).toEqual({ kind: "weekday", weekday: 5 });
    expect(namedDateIn("no date here")).toBeNull();
  });
});

describe("gradeSkill", () => {
  it("passes a skill that fits the task type", () => {
    expect(gradeSkill({ outcome: "answer", taskType: "ct1", skill: "match" }, { ask: askCard("skill-ct1-review-checklist") })?.pass).toBe(true);
  });
  it("fails a skill that does not fit the task type", () => {
    expect(gradeSkill({ outcome: "answer", taskType: "ct1", skill: "match" }, { ask: askCard("skill-bank-reconciliation") })?.pass).toBe(false);
  });
  it("passes a plain no-match when none is expected", () => {
    expect(gradeSkill({ outcome: "answer", taskType: "payroll", skill: "none" }, { ask: askNoMatch() })?.pass).toBe(true);
  });
  it("fails a skill card when none is expected", () => {
    expect(gradeSkill({ outcome: "answer", taskType: "payroll", skill: "none" }, { ask: askCard("skill-bank-reconciliation") })?.pass).toBe(false);
  });
  it("fails a no-match when a skill is expected", () => {
    expect(gradeSkill({ outcome: "answer", skill: "match" }, { ask: askNoMatch() })?.pass).toBe(false);
  });
  it("accepts either a fitting skill or no-match when skill is left open", () => {
    expect(gradeSkill({ outcome: "answer", taskType: "vat" }, { ask: askNoMatch() })?.pass).toBe(true);
    expect(gradeSkill({ outcome: "answer", taskType: "vat" }, { ask: askCard("skill-transaction-classification") })?.pass).toBe(true);
    expect(gradeSkill({ outcome: "answer", taskType: "vat" }, { ask: askCard("skill-meeting-summary") })?.pass).toBe(false);
  });
  it("matches on title as well as id", () => {
    expect(skillFitsTask({ id: "custom-1", title: "Inbox triage" }, "inbox")).toBe(true);
  });
});

describe("gradeDeadlinePhrase", () => {
  it("fails 'before the deadline' with no countdown", () => {
    expect(gradeDeadlinePhrase({ ask: askCard("x", null, "Use it to save time before the deadline.") })?.pass).toBe(false);
  });
  it("passes 'before the deadline' when a countdown shows", () => {
    expect(gradeDeadlinePhrase({ ask: askCard("x", friday, "Use it to save time before the deadline.") })?.pass).toBe(true);
  });
  it("passes plain prose with no countdown", () => {
    expect(gradeDeadlinePhrase({ ask: askCard("x", null, "It could give you 3 hours back.") })?.pass).toBe(true);
  });
});

describe("gradeLowRisk", () => {
  it("passes a low-risk item with a check step", () => {
    expect(gradeLowRisk({ outcome: "answer", lowRisk: true }, { ask: askCard("hook-check-the-output", null, "ok", "low") })?.pass).toBe(true);
  });
  it("fails the medium-risk default", () => {
    expect(gradeLowRisk({ outcome: "answer", lowRisk: true }, { ask: askCard("skill-bank-reconciliation") })?.pass).toBe(false);
  });
  it("does not apply when low risk was not asked for", () => {
    expect(gradeLowRisk({ outcome: "answer" }, { ask: askCard("skill-bank-reconciliation") })).toBeNull();
  });
});

describe("gradeCase", () => {
  const entry: PromptEntry = { id: "t", staffId: "s-aoife", prompt: "What's the weather in Cork?", expected: { outcome: "decline" } };
  it("passes a clean decline", () => {
    expect(gradeCase(entry, { athena: decline(), ask: null }).pass).toBe(true);
  });
  it("fails a request error", () => {
    const r = gradeCase(entry, { error: "/api/athena answered 500" });
    expect(r.pass).toBe(false);
    expect(r.checks[0].rule).toBe("request-succeeded");
  });
});
