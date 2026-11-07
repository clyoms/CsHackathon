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
  const lines = input.lines.filter((l) => l.staffId === staff.id);
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
 * The best next automation for one person, or null when no item targets any task they logged
 * with AI-ready hours above zero. Ties go to the item listed first in the catalogue.
 */
export function recommend(input: RecommendInput): Recommendation | null {
  const scores = scoreItems(input);
  let best: ItemScore | null = null;
  for (const s of scores) if (s.score > 0 && (best === null || s.score > best.score)) best = s;
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
