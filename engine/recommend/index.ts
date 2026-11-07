// Next-automation engine: picks one catalogue item per person.
//
// score(item) = AI-ready hours on the tasks it targets × deadline weight × verify bonus
//   AI-ready hours  = Σ timesheet hours × task penetration, over the person's lines whose
//                     O*NET task the item targets.
//   deadline weight = 7 / (7 + days to the nearest upcoming deadline of those lines' engagements).
//                     Due today weighs 1, a week away 0.5, no upcoming deadline 0.1.
//   verify bonus    = VERIFY_BONUS for items with a verify step when the person's verified rate
//                     is below LOW_VERIFY_RATE, otherwise 1.
// Pure functions over contract types. No I/O and no Claude calls.
import type {
  CatalogueItem,
  Deadline,
  Engagement,
  Recommendation,
  Staff,
  TaskScore,
  TimesheetLine,
  UsageRecord,
} from "@/contract/types";
import type { AthenaContext } from "@/engine/contract";

/** Assumption shown in the UI: share of AI-ready hours a person actually gets back. */
export const DEFAULT_HOURS_BACK_FACTOR = 0.3;
/** Below this verified rate, prefer items that include a verify step. */
export const LOW_VERIFY_RATE = 0.5;
export const VERIFY_BONUS = 3;
/** Weight when none of the matched work has an upcoming deadline. */
export const NO_DEADLINE_WEIGHT = 0.1;
const MAX_REASON_WORDS = 29;

export interface RecommendInput {
  staff: Staff;
  /** Timesheet lines. Lines for other staff are ignored. */
  lines: TimesheetLine[];
  engagements: Engagement[];
  deadlines: Deadline[];
  taskScores: TaskScore[];
  catalogue: CatalogueItem[];
  /** Usage records. Records for other staff are ignored. */
  usage: UsageRecord[];
  /** Today's date, YYYY-MM-DD. Passed in so results are repeatable. */
  today: string;
  hoursBackFactor?: number;
  /** What Athena learned: client, task, goal, risk tolerance. Optional. */
  context?: AthenaContext;
  /** Risk of each item by id (from catalogue loadRisk). Missing items count as "medium". */
  risk?: Record<string, ItemRisk>;
}

export type ItemRisk = "low" | "medium" | "high";
const RISK_RANK: Record<ItemRisk, number> = { low: 0, medium: 1, high: 2 };

// Words that say nothing about which item fits, so they never count as a match.
const STOPWORDS = new Set(
  "the and for with from this that what which should can could would will into onto about my our your their his her its ai help me do get make work task tasks job jobs thing things start safest safe first client clients all some any return before after by on in of to a an is it be i".split(
    " ",
  ),
);

/** Content words of a phrase, lower case. */
export function contentWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

/** How many task words match a word of the item (same first five letters, or the whole short word). */
export function taskMatchCount(item: CatalogueItem, taskWords: string[]): number {
  const hay = contentWords([item.id, item.title, item.plainSummary, ...item.targetsOnetTasks].join(" "));
  const stem = (w: string) => w.slice(0, 5);
  return taskWords.filter((t) => hay.some((h) => (t.length < 5 ? h === t : stem(h) === stem(t)))).length;
}

export function itemMatchesTask(item: CatalogueItem, taskWords: string[]): boolean {
  return taskMatchCount(item, taskWords) > 0;
}

export interface ItemScore {
  item: CatalogueItem;
  aiReadyHours: number;
  /** Hours logged on the targeted tasks, before penetration. */
  loggedHours: number;
  deadline: Deadline | null;
  daysLeft: number | null;
  deadlineWeight: number;
  verifyBonus: number;
  score: number;
  /** Client with the most matched hours. */
  topClient: string | null;
  synthetic: boolean;
}

const DAY_MS = 86_400_000;

/** Whole days from `from` to `to`, both YYYY-MM-DD. Negative when `to` is in the past. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

export function deadlineWeight(daysLeft: number | null): number {
  if (daysLeft === null || daysLeft < 0) return NO_DEADLINE_WEIGHT;
  return 7 / (7 + daysLeft);
}

/** Share of outputs checked, weighted by prompts. Null when the person has no usage. */
export function verifiedRate(usage: UsageRecord[], staffId: string): number | null {
  const mine = usage.filter((u) => u.staffId === staffId);
  const prompts = mine.reduce((sum, u) => sum + u.prompts, 0);
  if (prompts === 0) return null;
  return mine.reduce((sum, u) => sum + u.verified * u.prompts, 0) / prompts;
}

export function scoreItems(input: RecommendInput): ItemScore[] {
  const { staff, today } = input;
  const penetration = new Map(input.taskScores.map((t) => [t.onetTask, t.penetration]));
  const engagements = new Map(input.engagements.map((e) => [e.id, e]));
  const deadlines = new Map(input.deadlines.map((d) => [d.id, d]));
  let lines = input.lines.filter((l) => l.staffId === staff.id);
  // If Athena named a client, keep only that client's lines (when there are any).
  const client = input.context?.client?.trim().toLowerCase();
  if (client) {
    const forClient = lines.filter((l) => engagements.get(l.engagementId)?.client.toLowerCase().includes(client));
    if (forClient.length > 0) lines = forClient;
  }
  const rate = verifiedRate(input.usage, staff.id);
  const lowVerify = rate !== null && rate < LOW_VERIFY_RATE;

  return input.catalogue.map((item) => {
    const targets = new Set(item.targetsOnetTasks);
    const matched = lines.filter((l) => targets.has(l.onetTask));

    let aiReadyHours = 0;
    let loggedHours = 0;
    const hoursByClient = new Map<string, number>();
    let nearest: { deadline: Deadline; days: number } | null = null;

    for (const line of matched) {
      loggedHours += line.hours;
      aiReadyHours += line.hours * (penetration.get(line.onetTask) ?? 0);
      const engagement = engagements.get(line.engagementId);
      if (!engagement) continue;
      hoursByClient.set(engagement.client, (hoursByClient.get(engagement.client) ?? 0) + line.hours);
      const deadline = deadlines.get(engagement.deadlineId);
      if (!deadline) continue;
      const days = daysBetween(today, deadline.date);
      if (days >= 0 && (nearest === null || days < nearest.days)) nearest = { deadline, days };
    }

    const daysLeft = nearest?.days ?? null;
    const weight = deadlineWeight(daysLeft);
    const verifyBonus = lowVerify && item.verifyStep.trim() !== "" ? VERIFY_BONUS : 1;
    const topClient = [...hoursByClient].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      item,
      aiReadyHours,
      loggedHours,
      deadline: nearest?.deadline ?? null,
      daysLeft,
      deadlineWeight: weight,
      verifyBonus,
      score: aiReadyHours * weight * verifyBonus,
      topClient,
      synthetic: staff.synthetic || matched.some((l) => l.synthetic),
    };
  });
}

const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;

function wordCount(s: string): number {
  return s.trim().split(/\s+/).length;
}

/** Plain-English reason, always under 30 words. */
export function reasonFor(s: ItemScore, lowVerify: boolean): string {
  const hours = round(s.loggedHours, 1);
  const forClient = s.topClient ? ` for ${s.topClient}` : "";
  const when =
    s.deadline && s.daysLeft !== null
      ? `, and ${s.deadline.label} is ${s.daysLeft === 0 ? "today" : `${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"} away`}`
      : "";
  const check = lowVerify && s.verifyBonus > 1 ? " It includes a step to check the output." : "";
  const candidates = [
    `You logged ${hours} hours on work this ${s.item.kind} handles${forClient}${when}.${check}`,
    `You logged ${hours} hours on work this ${s.item.kind} handles${when}.${check}`,
    `You logged ${hours} hours on work this ${s.item.kind} handles.${check}`,
    `You logged ${hours} hours on work this ${s.item.kind} handles.`,
  ];
  return candidates.find((c) => wordCount(c) <= MAX_REASON_WORDS) ?? candidates[candidates.length - 1];
}

/**
 * Picks the item to recommend from the scores and Athena's context. No item is preferred by name.
 * - A named task keeps only items that fit it. None fit: null, so the caller says "no matching skill".
 * - Low risk tolerance keeps items with a check step and takes the lowest risk, then the best score.
 * - Otherwise the best score above zero wins. Ties go to the item listed first.
 */
export function pickItem(scores: ItemScore[], context: AthenaContext | undefined, risk: Record<string, ItemRisk> = {}): ItemScore | null {
  let pool = scores;
  const taskWords = contentWords([context?.task ?? "", context?.goal ?? ""].join(" "));
  if (taskWords.length > 0) {
    // Keep the items that match the most task words.
    const counts = pool.map((s) => taskMatchCount(s.item, taskWords));
    const most = Math.max(0, ...counts);
    if (most === 0) return null;
    pool = pool.filter((_, i) => counts[i] === most);
  }
  if (context?.riskTolerance === "low") {
    const checked = pool.filter((s) => s.item.verifyStep.trim() !== "");
    if (checked.length === 0) return null;
    const rank = (s: ItemScore) => RISK_RANK[risk[s.item.id] ?? "medium"];
    return checked.reduce((best, s) => (rank(s) < rank(best) || (rank(s) === rank(best) && s.score > best.score) ? s : best));
  }
  let best: ItemScore | null = null;
  for (const s of pool) if (s.score > 0 && (best === null || s.score > best.score)) best = s;
  // A named task with matching items but no logged hours still gets its best fit.
  if (!best && taskWords.length > 0) best = pool[0] ?? null;
  return best;
}

/**
 * The best next automation for one person, or null when nothing fits: no item targets their
 * logged work, or no item fits the task Athena named.
 */
export function recommend(input: RecommendInput): Recommendation | null {
  const best = pickItem(scoreItems(input), input.context, input.risk);
  if (!best) return null;

  // A recommendation must name a deadline. Fall back to the person's nearest upcoming one.
  const deadline = best.deadline ?? nearestDeadline(input);
  if (!deadline) return null;

  const factor = input.hoursBackFactor ?? DEFAULT_HOURS_BACK_FACTOR;
  const hoursBack = best.aiReadyHours * factor;
  const rate = verifiedRate(input.usage, input.staff.id);
  return {
    staffId: input.staff.id,
    item: best.item,
    aiReadyHours: round(best.aiReadyHours, 1),
    hoursBackEstimate: round(hoursBack, 1),
    eurosBack: round(hoursBack * input.staff.chargeRate, 2),
    deadline,
    reason: reasonFor(best, rate !== null && rate < LOW_VERIFY_RATE),
    synthetic: best.synthetic,
  };
}

function nearestDeadline(input: RecommendInput): Deadline | null {
  const upcoming = input.deadlines
    .map((d) => ({ d, days: daysBetween(input.today, d.date) }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days);
  return upcoming[0]?.d ?? null;
}
