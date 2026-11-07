// Logic check: send every prompt in tests/logic/prompts.json to a running Handoff server,
// follow the employee page's flow, grade each reply and write logic-report.json and logic-report.md.
// Usage: npm run logic   (base URL from LOGIC_BASE_URL, default http://localhost:3000)
// Exit codes: 0 all passed, 1 at least one failure, 2 server not reachable.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { gradeCase } from "./grade.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE_URL = (process.env.LOGIC_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const TIMEOUT_MS = 120_000;

async function postJson(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${path} answered ${res.status} with non-JSON: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`${path} answered ${res.status}: ${json?.error ?? text.slice(0, 200)}`);
  return json;
}

/** True when anything answers at the base URL. */
async function reachable() {
  try {
    await fetch(BASE_URL, { signal: AbortSignal.timeout(5_000) });
    return true;
  } catch {
    return false;
  }
}

/** One prompt through the same steps as the employee page: Athena, its questions, then /api/ask. */
async function runOne(entry) {
  const run = { athena: null, ask: null, answers: [] };
  try {
    run.athena = await postJson("/api/athena", { staffId: entry.staffId, request: entry.prompt });
    if (run.athena?.outcome?.kind === "decline") return run;
    const questions = run.athena?.result?.needed ? run.athena.result.questions ?? [] : [];
    run.answers = questions.map((q, i) => ({ question: q.question, answer: entry.answerWith?.[i] ?? q.options[0] }));
    run.ask = await postJson("/api/ask", {
      question: entry.prompt,
      view: "employee",
      staffId: entry.staffId,
      athenaAnswers: run.answers,
    });
  } catch (err) {
    run.error = err instanceof Error ? err.message : String(err);
  }
  return run;
}

function cell(s) {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function markdown(report) {
  const lines = [
    "# Logic check report",
    "",
    `Server: ${report.baseUrl}  `,
    `Run at: ${report.ranAt}  `,
    `Result: **${report.passed}/${report.total} passed**`,
    "",
    "| Result | ID | Prompt | Outcome | Skill | Countdown | Failed rules |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of report.results) {
    const failed = r.checks.filter((c) => !c.pass).map((c) => `${c.rule}: ${c.detail}`).join("; ");
    const outcome = r.athenaOutcome === "decline" ? "decline" : r.askOutcome ?? r.athenaOutcome ?? "";
    const countdown = r.deadline ? `${r.deadline.label} (${r.deadline.dueDate}, ${r.deadline.daysLeft}d)` : "";
    lines.push(`| ${r.pass ? "pass" : "FAIL"} | ${cell(r.id)} | ${cell(r.prompt)} | ${cell(outcome)} | ${cell(r.skillId)} | ${cell(countdown)} | ${cell(failed)} |`);
  }
  const failures = report.results.filter((r) => !r.pass);
  if (failures.length > 0) {
    lines.push("", "## Failures in detail", "");
    for (const r of failures) {
      lines.push(`### ${r.id}`, "", `Prompt: ${r.prompt}`, "");
      if (r.answers.length > 0) lines.push(`Answers given: ${r.answers.map((a) => `${a.question} -> ${a.answer}`).join("; ")}`, "");
      if (r.answer) lines.push(`Written answer: ${r.answer}`, "");
      for (const c of r.checks.filter((x) => !x.pass)) lines.push(`- ${c.rule}: ${c.detail}`);
      lines.push("");
    }
  }
  return lines.join("\n") + "\n";
}

async function main() {
  if (!(await reachable())) {
    console.error(`Logic check: no server is answering at ${BASE_URL}.`);
    console.error("Start the app first (npm run build, then npm start), or set LOGIC_BASE_URL to where it runs.");
    process.exit(2);
  }

  const prompts = JSON.parse(await readFile(join(ROOT, "tests", "logic", "prompts.json"), "utf8"));
  const results = [];
  for (const entry of prompts) {
    const run = await runOne(entry);
    const graded = gradeCase(entry, run);
    results.push({
      ...graded,
      prompt: entry.prompt,
      staffId: entry.staffId,
      expected: entry.expected,
      answers: run.answers,
      athenaOutcome: run.athena?.outcome?.kind ?? null,
      askOutcome: run.ask?.outcome?.kind ?? null,
      skillId: run.ask?.card?.recommendation?.item?.id ?? null,
      deadline: run.ask?.card?.deadline ?? null,
      answer: run.ask?.answer ?? run.athena?.outcome?.message ?? null,
      offline: Boolean(run.athena?.offline || run.ask?.offline),
      error: run.error ?? null,
    });
    console.log(`${graded.pass ? "pass" : "FAIL"}  ${entry.id}`);
  }

  const passed = results.filter((r) => r.pass).length;
  const report = { baseUrl: BASE_URL, ranAt: new Date().toISOString(), total: results.length, passed, results };
  await writeFile(join(ROOT, "logic-report.json"), JSON.stringify(report, null, 2) + "\n");
  await writeFile(join(ROOT, "logic-report.md"), markdown(report));
  console.log(`${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((err) => {
  console.error("Logic check crashed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
