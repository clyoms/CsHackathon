// Athena intake. Before a request goes to AI, decide whether one to three
// multiple-choice questions would change the result, and if so, ask them.
//
// The skip rule is deterministic: no questions when the request names the client,
// the task and the output. Claude only writes the questions.
// No-key fallback: with no ANTHROPIC_API_KEY (or on any API error) Athena returns
// fixed sample questions and zero tokens. Tests and CI never need a key.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { AthenaQuestion, type AthenaResult, type Engagement, type MeterReading, type Staff } from "@/contract/types";
import { MODEL, NO_PRICE, readingFromUsage, type EuroPrice } from "@/engine/meter";

export interface AthenaContext {
  staff: Staff;
  /** The engagements this person works on. */
  engagements: Engagement[];
}

export interface AthenaOptions {
  /** Inject a client for tests. Defaults to a real client when ANTHROPIC_API_KEY is set. */
  client?: Pick<Anthropic, "messages"> | null;
  /** Euro price for the meter. Defaults to unknown, so the meter shows tokens only. */
  price?: EuroPrice;
}

export interface AthenaOutcome {
  result: AthenaResult;
  meter: MeterReading;
  /** True when the fixed sample questions were used. */
  fallback: boolean;
}

export type Gap = "client" | "task" | "output";

const TASK_WORDS = [
  "reconcil", "classif", "categoris", "categoriz", "code the", "coding", "bank", "ledger", "journal",
  "ct1", "vat", "payroll", "invoice", "financial statement", "working paper", "accounts",
  "client query", "query", "meeting notes", "minutes", "review", "audit", "tax return", "form 11",
];
const OUTPUT_WORDS = [
  "table", "letter", "email", "e-mail", "reply", "summary", "summarise", "summarize", "checklist",
  "list", "draft", "report", "schedule", "spreadsheet", "memo", "notes",
];
/** Requests that ask the engine what to automate. The engine picks the task and the output. */
const RECOMMEND_PATTERN = /(hand (it |this )?to ai|what should i|which .*(ai|automat)|what can ai|automate)/i;

function mentions(text: string, words: string[]): boolean {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w));
}

/** Client names a request could use: the full name and its first word ("Murphy" for "Murphy Engineering Ltd"). */
function clientNames(e: Engagement): string[] {
  const first = e.client.split(/\s+/)[0];
  return [e.client, first].filter((n) => n.length >= 3).map((n) => n.toLowerCase());
}

export function namedClient(request: string, engagements: Engagement[]): Engagement | null {
  const t = request.toLowerCase();
  return engagements.find((e) => clientNames(e).some((n) => new RegExp(`\\b${escape(n)}\\b`).test(t))) ?? null;
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * What the request leaves out. Empty means no questions are needed.
 * A "what should I hand to AI" request leaves the task and output to the engine,
 * so only the client can be missing.
 */
export function findGaps(request: string, ctx: AthenaContext): Gap[] {
  const gaps: Gap[] = [];
  if (!namedClient(request, ctx.engagements)) gaps.push("client");
  if (RECOMMEND_PATTERN.test(request)) return gaps;
  if (!mentions(request, TASK_WORDS)) gaps.push("task");
  if (!mentions(request, OUTPUT_WORDS)) gaps.push("output");
  return gaps;
}

/** Fixed sample questions, one per gap. Used with no key and when Claude fails. */
export function fallbackQuestions(gaps: Gap[], ctx: AthenaContext): AthenaQuestion[] {
  const clients = ctx.engagements.map((e) => e.client).slice(0, 4);
  const clientOptions = clients.length >= 2 ? clients : [...clients, "Not client work"];
  const bank: Record<Gap, AthenaQuestion> = {
    client: {
      question: "Which client is this for?",
      options: clientOptions.length >= 2 ? clientOptions : ["One client", "Several clients"],
      why: "Each client has its own deadline and its own hours.",
    },
    task: {
      question: "Which part of the job do you want help with?",
      options: ["Coding bank transactions", "Reconciling accounts", "Drafting the client query letter", "Checking the CT1 figures"],
      why: "Each part needs a different skill.",
    },
    output: {
      question: "What do you want back?",
      options: ["A table I can paste", "A draft email or letter", "A checklist", "A short summary"],
      why: "The output decides how the answer is laid out and checked.",
    },
  };
  return gaps.slice(0, 3).map((g) => bank[g]);
}

function defaultClient(): Pick<Anthropic, "messages"> | null {
  return process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
}

const ClaudeQuestions = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()),
        why: z.string(),
      }),
    )
    .min(1)
    .max(3),
});

const SYSTEM = [
  "You are Athena, the intake step of Handoff, a tool for staff at FRAME, an Irish accountancy firm.",
  "Before a request goes to AI, you ask one to three short multiple-choice questions that fill the gaps in it.",
  "Ask only about the gaps you are given. Each question has two to four short options and a one-line reason.",
  "Use plain words a non-technical tax assistant understands. No jargon.",
].join(" ");

async function askClaude(
  client: Pick<Anthropic, "messages">,
  request: string,
  gaps: Gap[],
  ctx: AthenaContext,
): Promise<{ questions: AthenaQuestion[]; usage: Anthropic.Usage }> {
  const context = [
    `Person: ${ctx.staff.name}, ${ctx.staff.role}, ${ctx.staff.team} team.`,
    `Their clients: ${ctx.engagements.map((e) => `${e.client} (${e.type})`).join("; ") || "none listed"}.`,
    `Request: "${request}"`,
    `Gaps to ask about: ${gaps.join(", ")}. Ask at most ${gaps.length} question(s).`,
  ].join("\n");

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    output_config: { effort: "low", format: zodOutputFormat(ClaudeQuestions) },
    messages: [{ role: "user", content: context }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Athena got no usable questions (stop_reason: ${response.stop_reason})`);
  }
  const questions = response.parsed_output.questions
    .slice(0, gaps.length)
    .map((q) => AthenaQuestion.parse({ ...q, options: q.options.slice(0, 4) }));
  return { questions, usage: response.usage };
}

/** Runs Athena on one request. Never throws on an API problem: it falls back to the fixed questions. */
export async function runAthena(request: string, ctx: AthenaContext, opts: AthenaOptions = {}): Promise<AthenaOutcome> {
  const price = opts.price ?? NO_PRICE;
  const gaps = findGaps(request, ctx);

  if (gaps.length === 0) {
    return {
      result: { needed: false, questions: [], tokensUsed: 0 },
      meter: readingFromUsage("athena-intake", null, price, true),
      fallback: false,
    };
  }

  const client = opts.client === undefined ? defaultClient() : opts.client;
  if (client) {
    try {
      const { questions, usage } = await askClaude(client, request, gaps, ctx);
      const meter = readingFromUsage("athena-intake", usage, price, false);
      return {
        result: { needed: true, questions, tokensUsed: meter.tokensIn + meter.tokensOut },
        meter,
        fallback: false,
      };
    } catch (err) {
      console.warn("Athena fell back to sample questions:", err instanceof Error ? err.message : err);
    }
  }

  return {
    result: { needed: true, questions: fallbackQuestions(gaps, ctx), tokensUsed: 0 },
    meter: readingFromUsage("athena-intake", null, price, false),
    fallback: true,
  };
}
