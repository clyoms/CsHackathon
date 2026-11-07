// POST /api/ask: run the engine for the asking view, then have Claude write a plain answer
// of at most 80 words that uses only the engine's numbers and names each one's source.
// No-key fallback: with no ANTHROPIC_API_KEY (or on any API problem) the answer is a fixed
// template filled from the same numbers, and the meter reads zero tokens.
import Anthropic from "@anthropic-ai/sdk";
import { AskResponse, type AskRequest } from "@/contract/api";
import type { Recommendation, SourcedNumber } from "@/contract/types";
import { loadRisk } from "@/catalogue";
import type { AthenaOutcome, Deadline } from "@/engine/contract";
import { extractContext } from "@/engine/athena/triage";
import { parseNamedDeadline, pickDeadline, taskTopic } from "@/engine/deadline";
import { MODEL, NO_PRICE, loadPrice, readingFromUsage, type EuroPrice } from "@/engine/meter";
import { estimateTasks, rankByMoneyLost } from "@/engine/productivity";
import { LOW_VERIFY_RATE, daysBetween, recommend, verifiedRate } from "@/engine/recommend";
import { engagementsFor, linesForAnswers, type World } from "./world";

export const MAX_ANSWER_WORDS = 80;
const SYNTHETIC_SOURCE = "Frame data";
/** How each view is named in the prompt Claude reads. */
const VIEW_LABEL: Record<AskRequest["view"], string> = { employee: "Employee", partner: "Partner", harry: "AI Lead" };

export interface AskDeps {
  world: World;
  /** Inject a client for tests. Defaults to a real client when ANTHROPIC_API_KEY is set. */
  client?: Pick<Anthropic, "messages"> | null;
  price?: EuroPrice;
}

/** Thrown for a request the engines cannot answer, such as an unknown person. Maps to HTTP 400. */
export class AskInputError extends Error {}

/** Short name for a source URL, for use in a sentence. */
export function sourceName(url: string | undefined): string {
  if (!url) return SYNTHETIC_SOURCE;
  const known: [RegExp, string][] = [
    [/huggingface\.co\/datasets\/Anthropic\/EconomicIndex/, "Anthropic Economic Index"],
    [/revenue\.ie/, "Revenue"],
    [/irs\.gov/, "IRS"],
    [/cima\.ky/, "CIMA"],
    [/cso\.ie/, "CSO"],
    [/eurostat/, "Eurostat"],
    [/onetcenter\.org/, "O*NET"],
  ];
  return known.find(([re]) => re.test(url))?.[1] ?? new URL(url).hostname;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const euro = (n: number) => `€${n.toLocaleString("en-IE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
/** "18 November" from "2026-11-18". */
const dayMonth = (iso: string) =>
  new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

export interface Findings {
  numbers: SourcedNumber[];
  /** Fixed answer built from the numbers, used with no key. At most 80 words. */
  template: string;
  /** Employee view only: what Athena's answers led to. */
  outcome?: AthenaOutcome;
  /** Employee view only: the chosen item and the deadline to count down to. */
  card?: { recommendation: Recommendation; deadline: Deadline | null };
}

/** Runs the engine that matches the view and returns its numbers. */
export function findings(req: AskRequest, world: World): Findings {
  if (req.view === "employee") return employeeFindings(req, world);
  if (req.view === "partner") return partnerFindings(world);
  return aiLeadFindings(world);
}

function employeeFindings(req: AskRequest, world: World): Findings {
  if (!req.staffId) throw new AskInputError("staffId is required for the employee view");
  const staff = world.staff.find((s) => s.id === req.staffId);
  if (!staff) throw new AskInputError(`unknown staffId: ${req.staffId}`);

  // If Athena asked which client, keep only that client's lines.
  const { chosen, lines } = linesForAnswers(world, staff.id, req.athenaAnswers);

  // What the person asked for: client, task, goal, risk tolerance and any date they named.
  const answers = req.athenaAnswers.map((a) => a.answer);
  const context = extractContext(req.question, answers, engagementsFor(world, staff.id));
  if (chosen && !context.client) context.client = chosen.client;

  // A named task decides the item on its own: the wanted output ("a table") must not pull in an
  // item for a different task. Someone who wants the safest start gets the lowest-risk item, not a task match.
  const recContext =
    context.riskTolerance === "low"
      ? { client: context.client, riskTolerance: context.riskTolerance }
      : context.task
        ? { ...context, goal: undefined }
        : context;
  const rec = recommend({ ...world, staff, lines, context: recContext, risk: loadRisk() });
  // The user's own date wins. A named task with its own deadline (VAT, CT1) comes next.
  const named = parseNamedDeadline([req.question, ...answers].join(" "), world.today);
  // If the person's date is a known filing date (18 November is ROS pay and file), use that deadline and its source.
  const sameDay = named ? world.deadlines.find((d) => d.date === named.dueDate) : undefined;
  const userDeadline: Deadline | null = sameDay
    ? { label: sameDay.label, dueDate: sameDay.date, daysLeft: named!.daysLeft, source: "catalogue" }
    : named;
  const taskText = context.task ?? req.question;

  if (!rec) {
    // Still count down to the date they named, so they know how long they have.
    const what = context.task ? `for ${context.task}` : "for that task";
    const left = userDeadline ? ` ${userDeadline.label}: ${countdownText(userDeadline.daysLeft)}.` : "";
    const message = `There is no matching skill ${what} yet.${left}`;
    return { numbers: [], template: message, outcome: { kind: "no_match", message } };
  }

  // Only a date the question points at: one the person named, or the filing date of a task they named.
  // The skill's own catalogue date is left out, because it has nothing to do with the question.
  const deadline: Deadline | null =
    userDeadline ?? (taskTopic(taskText) ? pickDeadline(null, world.deadlines, taskText, world.today) : null);
  const catalogueDeadline = deadline
    ? world.deadlines.find((d) => d.label === deadline.label && d.date === deadline.dueDate)
    : undefined;

  const scoreSource = world.taskScores.find((t) => rec.item.targetsOnetTasks.includes(t.onetTask))?.source;
  const numbers: SourcedNumber[] = [
    { label: "Hours back before the deadline", value: rec.hoursBackEstimate, unit: "hours", source: scoreSource, synthetic: true },
    { label: "Euros back", value: rec.eurosBack, unit: "EUR", synthetic: true },
    { label: "AI-ready hours", value: rec.aiReadyHours, unit: "hours", source: scoreSource, synthetic: true },
  ];
  // A date the user named has no source page, so it rides on the response as `deadline`, not here.
  if (deadline && catalogueDeadline) {
    numbers.push({ label: `Days to ${deadline.label}`, value: deadline.daysLeft, unit: "days", source: catalogueDeadline.source, synthetic: false });
  }
  const rate = verifiedRate(world.usage, staff.id);
  const check = rate !== null && rate < LOW_VERIFY_RATE && rec.item.verifyStep ? " It includes a step to check the output." : "";
  const client = context.client ? ` for ${context.client}` : "";
  const where = catalogueDeadline ? ` (${sourceName(catalogueDeadline.source)})` : "";
  const days = deadline?.daysLeft ?? 0;
  const before = deadline
    ? ` before ${deadline.label} on ${dayMonth(deadline.dueDate)}, ${days} day${days === 1 ? "" : "s"} away${where}`
    : "";
  const template =
    `Start with the ${rec.item.title} ${rec.item.kind}${client}. ` +
    `It could give you about ${rec.hoursBackEstimate} hour${rec.hoursBackEstimate === 1 ? "" : "s"} back (${euro(rec.eurosBack)}, ${SYNTHETIC_SOURCE})` +
    `${before}.${check}`;
  return { numbers, template, outcome: { kind: "skill" }, card: { recommendation: rec, deadline } };
}

function countdownText(days: number): string {
  if (days <= 0) return "due today";
  return `${days} day${days === 1 ? "" : "s"} to go`;
}

function partnerFindings(world: World): Findings {
  const ranked = rankByMoneyLost(world.engagements, world.timesheets);
  const top = ranked[0];
  if (!top) return { numbers: [], template: "There are no engagements to compare yet." };
  const over = ranked.filter((s) => s.budgetVarianceHours > 0).length;
  const tasks = estimateTasks(
    world.timesheets.filter((l) => l.engagementId === top.engagementId),
    world.taskScores,
    world.staff,
  );
  const task = tasks[0];

  const numbers: SourcedNumber[] = [
    { label: `Money lost on ${top.client}`, value: r2(top.moneyLost), unit: "EUR", synthetic: true },
    { label: `Effective rate on ${top.client}`, value: r2(top.effectiveRate ?? 0), unit: "EUR per hour", synthetic: true },
    { label: `Hours over budget on ${top.client}`, value: r1(top.budgetVarianceHours), unit: "hours", synthetic: true },
    { label: "Engagements over budget", value: over, unit: "engagements", synthetic: true },
  ];
  if (task) {
    numbers.push({ label: "AI-ready hours on the top task", value: r1(task.aiReadyHours), unit: "hours", source: task.source ?? undefined, synthetic: true });
    if (task.penetration !== null && task.source) {
      numbers.push({ label: "AI usage share for that task", value: task.penetration, unit: "share", source: task.source, synthetic: false });
    }
  }
  const lost = top.moneyLost > 0
    ? `${top.client} has lost ${euro(r2(top.moneyLost))} against budget, ${r1(top.budgetVarianceHours)} hours over, at ${euro(r2(top.effectiveRate ?? 0))} an hour (${SYNTHETIC_SOURCE}).`
    : `No engagement is over budget yet. ${top.client} is closest (${SYNTHETIC_SOURCE}).`;
  const why = task
    ? ` Its top AI-ready task has ${r1(task.aiReadyHours)} hours (${sourceName(task.source ?? undefined)} scores, ${SYNTHETIC_SOURCE} hours).`
    : "";
  return { numbers, template: `${over} of ${ranked.length} engagements are over budget. ${lost}${why}` };
}

function aiLeadFindings(world: World): Findings {
  const users = new Set(world.usage.filter((u) => u.prompts > 0).map((u) => u.staffId));
  const prompts = world.usage.reduce((s, u) => s + u.prompts, 0);
  const checked = world.usage.reduce((s, u) => s + u.verified * u.prompts, 0);
  const rate = prompts > 0 ? checked / prompts : 0;

  const byTeam = new Map<string, { prompts: number; checked: number }>();
  for (const u of world.usage) {
    const team = world.staff.find((s) => s.id === u.staffId)?.team ?? "Unknown";
    const t = byTeam.get(team) ?? { prompts: 0, checked: 0 };
    t.prompts += u.prompts;
    t.checked += u.verified * u.prompts;
    byTeam.set(team, t);
  }
  const teams = [...byTeam].filter(([, t]) => t.prompts > 0).map(([team, t]) => ({ team, rate: t.checked / t.prompts }));
  const lowest = teams.sort((a, b) => a.rate - b.rate)[0];

  const numbers: SourcedNumber[] = [
    { label: "Active AI users", value: users.size, unit: "people", synthetic: true },
    { label: "Prompts", value: prompts, unit: "prompts", synthetic: true },
    { label: "Share of outputs checked", value: r2(rate), unit: "share", synthetic: true },
  ];
  if (lowest) numbers.push({ label: `Share checked in ${lowest.team}`, value: r2(lowest.rate), unit: "share", synthetic: true });
  const low = lowest ? ` ${lowest.team} checks the least, ${Math.round(lowest.rate * 100)}%, so start verify training there.` : "";
  return {
    numbers,
    template: `${users.size} people used AI, with ${prompts} prompts. They checked ${Math.round(rate * 100)}% of outputs (${SYNTHETIC_SOURCE}).${low}`,
  };
}

const SYSTEM = [
  "You write short answers for staff at FRAME, an Irish accountancy firm, inside a tool called Frame Next.",
  `Write a plain answer of at most ${MAX_ANSWER_WORDS} words. Use plain words a non-technical reader understands.`,
  "Use only the numbers given. Never add, estimate or round a number differently.",
  "After each number you use, name its source in brackets, using the source name given.",
  "Use the first number in the list, exactly as written. Do not use bullet points or headings.",
].join(" ");

function defaultClient(): Pick<Anthropic, "messages"> | null {
  return process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
}

async function writeWithClaude(
  client: Pick<Anthropic, "messages">,
  req: AskRequest,
  f: Findings,
): Promise<{ answer: string; usage: Anthropic.Usage }> {
  const facts = f.numbers
    .map((n) => `- ${n.label}: ${n.value} ${n.unit} (source: ${n.source && !n.synthetic ? sourceName(n.source) : SYNTHETIC_SOURCE})`)
    .join("\n");
  const answers = req.athenaAnswers.map((a) => `- ${a.question} ${a.answer}`).join("\n");
  const content = [
    `View: ${VIEW_LABEL[req.view]}`,
    `Question: ${req.question}`,
    answers ? `Their answers to clarifying questions:\n${answers}` : "",
    `Numbers:\n${facts}`,
    f.card?.deadline?.source === "user"
      ? `Deadline the person named: ${f.card.deadline.label}, ${dayMonth(f.card.deadline.dueDate)}, ${f.card.deadline.daysLeft} days away (their own date, no source).`
      : "",
    `A correct answer in the right style, for reference:\n${f.template}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: SYSTEM,
    output_config: { effort: "low" },
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined the request");
  const answer = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join(" ")
    .trim();
  if (!answer) throw new Error("empty answer");
  if (words(answer) > MAX_ANSWER_WORDS) throw new Error(`answer is ${words(answer)} words`);
  return { answer, usage: response.usage };
}

/** Matches Usage in engine/contract.ts (T-2). Switch to that import once it is merged. */
export type AskApiResponse = AskResponse & {
  offline: boolean;
  offlineReason?: string;
  tokensUsed: number;
  outcome?: AthenaOutcome;
  card?: { recommendation: Recommendation; deadline: Deadline | null };
};

export async function handleAsk(req: AskRequest, deps: AskDeps): Promise<AskApiResponse> {
  const price = deps.price ?? NO_PRICE;
  const f = findings(req, deps.world);
  const extra = { ...(f.outcome ? { outcome: f.outcome } : {}), ...(f.card ? { card: f.card } : {}) };
  // The key is read per request, never at module load.
  const client = deps.client === undefined ? defaultClient() : deps.client;

  // No matching skill is a plain answer, not a failure: nothing for Claude to write.
  if (f.outcome?.kind === "no_match") {
    const res = AskResponse.parse({ answer: f.template, numbers: [], meter: readingFromUsage("ask", null, price, true), fallback: false });
    return { ...res, ...extra, offline: !client, offlineReason: client ? undefined : "no ANTHROPIC_API_KEY on the server", tokensUsed: 0 };
  }

  let offlineReason: string;
  if (!client) offlineReason = "no ANTHROPIC_API_KEY on the server";
  else if (f.numbers.length === 0) offlineReason = "no engine numbers to write about, so Claude was not called";
  else {
    try {
      const { answer, usage } = await writeWithClaude(client, req, f);
      const meter = readingFromUsage("ask", usage, price, true);
      const res = AskResponse.parse({ answer, numbers: f.numbers, meter, fallback: false });
      return { ...res, ...extra, offline: false, tokensUsed: meter.tokensIn + meter.tokensOut };
    } catch (err) {
      offlineReason = `Claude call failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
  console.warn(`[ask] offline answer: ${offlineReason}`);
  const res = AskResponse.parse({ answer: f.template, numbers: f.numbers, meter: readingFromUsage("ask", null, price, true), fallback: true });
  return { ...res, ...extra, offline: true, offlineReason, tokensUsed: 0 };
}

/** The price the routes use: data/public/prices.json, or unknown. */
export function routePrice(): EuroPrice {
  return loadPrice();
}
