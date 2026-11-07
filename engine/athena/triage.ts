// Athena triage: the first step, before any clarifying question or skill.
// Decides whether a request is about the person's accounting work (Claude when the key is set,
// a keyword heuristic offline), declines off-topic requests in one line, and extracts an
// AthenaContext (client, task, goal, riskTolerance, namedDate) for the recommender.
// Types come from engine/contract.ts. The older AthenaContext/AthenaOutcome in ./index are
// a different shape, hence the aliases.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type {
  AthenaContext as WorkContext,
  AthenaOutcome as TriageOutcome,
  Usage,
} from "@/engine/contract";
import type { Engagement } from "@/contract/types";
import { MODEL } from "@/engine/meter";

export const DECLINE_MESSAGE = "Handoff helps with work tasks.";

export const HELP_QUESTIONS = [
  "What task are you working on?",
  "Which client is it for?",
  "What do you want back, and by when?",
];

export type Topic = "work" | "off_topic" | "help";

export interface TriageResult {
  outcome: TriageOutcome;
  context: WorkContext;
  usage: Usage;
  /** Claude's raw token usage, so the meter can split tokens in and out. Null when Claude was not called. */
  rawUsage: Anthropic.Usage | null;
}

export interface TriageOptions {
  /** The person's engagements, so client names count as work words. */
  engagements?: Engagement[];
  /** Answers to earlier clarifying questions, used for context extraction. */
  answers?: string[];
  /** Inject a client for tests. Defaults to a real client when ANTHROPIC_API_KEY is set (read per call). */
  client?: Pick<Anthropic, "messages"> | null;
}

// ---------- Offline heuristic ----------

/** Words that mark a request as accounting or office work. Matched at word starts. */
const WORK_WORDS = [
  "ai", "automat", "skill", "hook", "plugin", "prompt", "claude",
  "client", "deadline", "job", "engagement", "work", "task",
  "tax", "vat", "ct1", "form 11", "ros", "revenue", "irs", "return", "audit", "ledger", "journal",
  "reconcil", "bank", "invoice", "payroll", "accounts", "accounting", "balance", "budget",
  "financial", "statement", "transaction", "classif", "categor", "bookkeep", "working paper",
  "email", "letter", "reply", "query", "report", "spreadsheet", "excel", "memo", "meeting", "minutes",
  "checklist", "summary", "summar", "draft", "review", "fee", "hours", "timesheet",
  // Words for the inbox, commitment, meeting, status, process and messaging skills.
  "inbox", "unread", "commitment", "promis", "transcript", "status report", "process", "workflow",
  "messaging", "positioning", "pitch", "proposal", "seminar", "briefing", "partner",
];

const HELP_ONLY = /^\s*(help|help me|hi|hello|hey|hiya|start|\?+|what can you do\??|what is this\??)\s*[.!?]*\s*$/i;

const RISK_LOW = /\b(don'?t|do not|never) trust\b|\bnot sure about ai\b|\bsafest\b|\bsafe\b|\bcareful\b|\bworried\b|\bnervous\b|\blow[- ]risk\b|\bwary\b|\bsceptical\b|\bskeptical\b/i;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function hasWord(text: string, words: string[]): string | null {
  for (const w of words) if (new RegExp(`\\b${escape(w)}`, "i").test(text)) return w;
  return null;
}

/** Keyword topic decision, used offline and whenever Claude fails. */
export function topicOffline(request: string, engagements: Engagement[] = []): Topic {
  if (HELP_ONLY.test(request)) return "help";
  const clients = engagements.flatMap((e) => [e.client, e.client.split(/\s+/)[0]]).filter((n) => n.length >= 3);
  if (hasWord(request, WORK_WORDS) || hasWord(request, clients)) return "work";
  return "off_topic";
}

// ---------- Context extraction ----------

const TASKS: [RegExp, string][] = [
  // The more specific skills come first, so "summarise this meeting transcript" is not read as plain meeting notes.
  [/\b(inbox|unread (e-?mails?|mail)|triage)\b/i, "inbox triage"],
  [/\b(commitments?|promised|promises)\b|\bwhat (did|have) i (commit|promise)/i, "commitment tracker"],
  [/\btranscript\b|\bsummar(y|ise|ize) (the |this |our |my )?meeting\b|\bmeeting summary\b/i, "meeting summary"],
  [/\bstatus report\b|\bmonthly status\b|\bmonthly report\b/i, "engagement status report"],
  [/\b(automate|automation|ai opportunit|map (my|our|the) process|process map)/i, "AI opportunity finder"],
  [/\b(messaging|positioning|value proposition|pitch|seminar|briefing event)\b/i, "messaging framework"],
  [/\breconcil/i, "reconciliation"],
  [/\b(classif|categori[sz]|cod(e|ing) (the )?(bank )?transactions)/i, "transaction classification"],
  [/\bct1\b|\bcorporation tax\b/i, "CT1 return"],
  [/\bvat\b/i, "VAT return"],
  [/\bform 11\b|\btax return\b/i, "tax return"],
  // "Email Quinn Tech about ..." is a client email, even when an answer later names the CT1.
  [/\bclient (query|email)|\breply\b|\bquery\b|^\s*(e-?mail|write to|chase)\b/i, "client query reply"],
  [/\bmeeting|\bminutes\b/i, "meeting notes"],
  [/\bworking paper/i, "working-paper summary"],
  [/\bpayroll\b/i, "payroll"],
  [/\binvoice/i, "invoicing"],
  [/\baudit\b/i, "audit"],
];

const GOALS: [RegExp, string][] = [
  [/\btable\b|\bspreadsheet\b/i, "a table"],
  [/\bletter\b|\bemail\b|\breply\b/i, "a draft email or letter"],
  [/\bchecklist\b/i, "a checklist"],
  [/\bsummar|\bsummary\b|\bmemo\b/i, "a short summary"],
  [/\breport\b/i, "a report"],
  [/\b(save|free up|get back) (some |more )?(time|hours)\b|\bhours back\b/i, "time back"],
];

const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december";
const NAMED_DATE = new RegExp(
  [
    `\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTHS})\\b`,
    `\\b(?:${MONTHS})\\s+\\d{1,2}(?:st|nd|rd|th)?\\b`,
    `\\b(?:by|before|on|until)\\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight|end of (?:the )?(?:day|week|month)|next week)\\b`,
    `\\b(?:today|tomorrow|this week|next week)\\b`,
  ].join("|"),
  "i",
);

function firstMatch(texts: string[], table: [RegExp, string][]): string | undefined {
  for (const t of texts) for (const [re, label] of table) if (re.test(t)) return label;
  return undefined;
}

/** Client, task, goal, risk tolerance and the date text the person wrote, from the request and answers. */
export function extractContext(request: string, answers: string[] = [], engagements: Engagement[] = []): WorkContext {
  const texts = [request, ...answers];
  const all = texts.join(" \n ");
  const client =
    engagements.find((e) => answers.includes(e.client))?.client ??
    engagements.find((e) => new RegExp(`\\b${escape(e.client)}\\b`, "i").test(all))?.client ??
    engagements.find((e) => {
      const first = e.client.split(/\s+/)[0];
      return first.length >= 4 && new RegExp(`\\b${escape(first)}\\b`, "i").test(all);
    })?.client;
  const date = all.match(NAMED_DATE)?.[0];
  return {
    ...(client ? { client } : {}),
    ...(firstMatch(texts, TASKS) ? { task: firstMatch(texts, TASKS) } : {}),
    ...(firstMatch(texts, GOALS) ? { goal: firstMatch(texts, GOALS) } : {}),
    riskTolerance: RISK_LOW.test(all) ? "low" : "normal",
    ...(date ? { namedDate: date } : {}),
  };
}

// ---------- Claude topic check ----------

const ClaudeTopic = z.object({ topic: z.enum(["work", "off_topic", "help"]) });

const SYSTEM = [
  "You triage requests for Frame Next, a tool for staff at FRAME, an Irish accounting firm.",
  "Answer with one topic. work: anything about their accounting, tax, audit, bookkeeping or office work,",
  "their clients and deadlines, or using AI for that work, including worries about trusting AI.",
  "help: a bare greeting or a request for help with no task in it. off_topic: anything else,",
  "such as weather, sport, news or personal chat.",
].join(" ");

async function topicWithClaude(client: Pick<Anthropic, "messages">, request: string): Promise<{ topic: Topic; tokens: number; raw: Anthropic.Usage }> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 200,
    system: SYSTEM,
    output_config: { effort: "low", format: zodOutputFormat(ClaudeTopic) },
    messages: [{ role: "user", content: request }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`no usable topic (stop_reason: ${response.stop_reason})`);
  }
  const u = response.usage;
  const tokens = u.input_tokens + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + u.output_tokens;
  return { topic: response.parsed_output.topic, tokens, raw: u };
}

// ---------- The step ----------

/**
 * Off-topic: decline in one line, with no questions, no skill and no numbers.
 * A bare "help": clarify with the starter questions.
 * Work: kind "skill" (go on to the recommender), with the extracted context.
 * Never throws on an API problem: it falls back to the heuristic and says why in usage.
 */
export async function triage(request: string, opts: TriageOptions = {}): Promise<TriageResult> {
  const engagements = opts.engagements ?? [];
  const client = opts.client === undefined ? (process.env.ANTHROPIC_API_KEY ? new Anthropic() : null) : opts.client;

  let topic: Topic;
  let usage: Usage;
  let rawUsage: Anthropic.Usage | null = null;
  if (client) {
    try {
      const r = await topicWithClaude(client, request);
      topic = r.topic;
      usage = { offline: false, tokensUsed: r.tokens };
      rawUsage = r.raw;
    } catch (err) {
      const reason = `Claude topic check failed: ${err instanceof Error ? err.message : String(err)}`;
      console.warn(`[athena] triage offline: ${reason}`);
      topic = topicOffline(request, engagements);
      usage = { offline: true, offlineReason: reason, tokensUsed: 0 };
    }
  } else {
    const reason = "no ANTHROPIC_API_KEY on the server";
    console.warn(`[athena] triage offline: ${reason}`);
    topic = topicOffline(request, engagements);
    usage = { offline: true, offlineReason: reason, tokensUsed: 0 };
  }

  if (topic === "off_topic") return { outcome: { kind: "decline", message: DECLINE_MESSAGE }, context: {}, usage, rawUsage };
  if (topic === "help") return { outcome: { kind: "clarify", questions: [...HELP_QUESTIONS] }, context: {}, usage, rawUsage };
  return { outcome: { kind: "skill" }, context: extractContext(request, opts.answers, engagements), usage, rawUsage };
}
