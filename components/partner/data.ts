// Builds everything the partner page shows from one world. Pure: no I/O.
import type { CatalogueItem, Deadline } from "@/contract/types";
import { estimateTasks, rankByMoneyLost, type TaskEstimate } from "@/engine/productivity";
import type { PartnerWorld } from "./fixtures";

export interface RecommendedItem {
  id: string;
  title: string;
  kind: CatalogueItem["kind"];
  plainSummary: string;
  /** AI-ready hours on this engagement's tasks that the item targets. */
  aiReadyHours: number;
}

export interface PartnerRow {
  engagementId: string;
  client: string;
  type: string;
  fee: number;
  budgetHours: number;
  actualHours: number;
  effectiveRate: number | null;
  budgetRate: number;
  moneyLost: number;
  varianceHours: number;
  tasks: TaskEstimate[];
  topTask: TaskEstimate | null;
  recommended: RecommendedItem | null;
  deadline: Deadline | null;
  synthetic: boolean;
}

export interface CalendarWeek {
  /** Monday, YYYY-MM-DD. */
  start: string;
  /** Sunday, YYYY-MM-DD. */
  end: string;
  deadlines: { deadline: Deadline; clients: string[] }[];
}

export interface PartnerView {
  rows: PartnerRow[];
  weeks: CalendarWeek[];
  today: string;
}

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** The catalogue item with the most AI-ready hours on these tasks, or null when none scores. */
export function recommendForTeam(tasks: TaskEstimate[], catalogue: CatalogueItem[]): RecommendedItem | null {
  let best: RecommendedItem | null = null;
  for (const item of catalogue) {
    const targets = new Set(item.targetsOnetTasks);
    const hours = tasks.filter((t) => targets.has(t.onetTask)).reduce((s, t) => s + t.aiReadyHours, 0);
    if (hours > 0 && (!best || hours > best.aiReadyHours)) {
      best = { id: item.id, title: item.title, kind: item.kind, plainSummary: item.plainSummary, aiReadyHours: hours };
    }
  }
  return best;
}

/** Eight weeks from the Monday of `today`'s week, with each deadline and the clients due on it. */
export function crunchCalendar(world: PartnerWorld, weeks = 8): CalendarWeek[] {
  const t = Date.parse(`${world.today}T00:00:00Z`);
  const dow = (new Date(t).getUTCDay() + 6) % 7; // Monday = 0
  const monday = t - dow * DAY;
  return Array.from({ length: weeks }, (_, i) => {
    const start = iso(monday + i * 7 * DAY);
    const end = iso(monday + (i * 7 + 6) * DAY);
    const due = world.deadlines
      .filter((d) => d.date >= start && d.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((deadline) => ({
        deadline,
        clients: world.engagements.filter((e) => e.deadlineId === deadline.id).map((e) => e.client),
      }));
    return { start, end, deadlines: due };
  });
}

export function buildPartnerView(world: PartnerWorld): PartnerView {
  const deadlines = new Map(world.deadlines.map((d) => [d.id, d]));
  const byId = new Map(world.engagements.map((e) => [e.id, e]));
  const rows = rankByMoneyLost(world.engagements, world.timesheets).map((s): PartnerRow => {
    const tasks = estimateTasks(
      world.timesheets.filter((l) => l.engagementId === s.engagementId),
      world.taskScores,
      world.staff,
    );
    const e = byId.get(s.engagementId)!;
    return {
      engagementId: s.engagementId,
      client: s.client,
      type: e.type,
      fee: s.fee,
      budgetHours: s.budgetHours,
      actualHours: s.actualHours,
      effectiveRate: s.effectiveRate,
      budgetRate: s.budgetRate,
      moneyLost: s.moneyLost,
      varianceHours: s.budgetVarianceHours,
      tasks,
      topTask: tasks.find((t) => t.aiReadyHours > 0) ?? null,
      recommended: recommendForTeam(tasks, world.catalogue),
      deadline: deadlines.get(e.deadlineId) ?? null,
      synthetic: s.synthetic,
    };
  });
  return { rows, weeks: crunchCalendar(world), today: world.today };
}
