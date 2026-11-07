// Engagement productivity engine. Pure functions over contract types: no I/O, no Claude calls.
//
// Money lost against budget uses the budgeted rate (fee / budget hours):
//   moneyLost = max(0, actual hours - budget hours) × budgeted rate
// which equals (budgeted rate - effective rate) × actual hours when the job runs over.
import type { Engagement, Staff, TaskScore, TimesheetLine } from "@/contract/types";

/** Share of AI-ready hours we assume a person gets back. Shown in the UI as an assumption. */
export const DEFAULT_HOURS_BACK_FACTOR = 0.3;
export const HOURS_BACK_ASSUMPTION =
  "Assumption: about 30% of AI-ready hours come back as free time. This is an estimate, not a measurement.";

export interface EngagementSummary {
  engagementId: string;
  client: string;
  fee: number;
  budgetHours: number;
  actualHours: number;
  /** Fee / actual hours. Null when no hours are logged yet. */
  effectiveRate: number | null;
  /** Fee / budget hours. */
  budgetRate: number;
  /** Actual hours minus budget hours. Positive means over budget. */
  budgetVarianceHours: number;
  /** Euros of fee eaten by hours over budget, at the budgeted rate. 0 when on or under budget. */
  moneyLost: number;
  hoursByTask: TaskHours[];
  synthetic: boolean;
}

export interface TaskHours {
  onetTask: string;
  hours: number;
}

export interface TaskEstimate {
  onetTask: string;
  hours: number;
  /** Anthropic Economic Index penetration. Null when the task has no score. */
  penetration: number | null;
  /** Source URL of the penetration score. Null when the task has no score. */
  source: string | null;
  aiReadyHours: number;
  hoursBack: number;
  eurosBack: number;
  /** True because hours and charge rates come from synthetic Frame data. */
  synthetic: boolean;
}

function checkFactor(factor: number): void {
  if (!Number.isFinite(factor) || factor < 0 || factor > 1) {
    throw new RangeError(`hours-back factor must be between 0 and 1, got ${factor}`);
  }
}

/** Hours logged against one engagement. */
export function actualHours(engagementId: string, lines: TimesheetLine[]): number {
  return lines.filter((l) => l.engagementId === engagementId).reduce((sum, l) => sum + l.hours, 0);
}

/** Fee / actual hours. Null when no hours are logged. */
export function effectiveRate(fee: number, hours: number): number | null {
  return hours > 0 ? fee / hours : null;
}

/** Actual hours minus budget hours. Positive means over budget. */
export function budgetVariance(budgetHours: number, hours: number): number {
  return hours - budgetHours;
}

/** Euros of fee eaten by hours over budget, at the budgeted rate (fee / budget hours). */
export function moneyLost(fee: number, budgetHours: number, hours: number): number {
  const over = Math.max(0, hours - budgetHours);
  return over * (fee / budgetHours);
}

/** Hours per O*NET task, largest first. */
export function hoursByTask(lines: TimesheetLine[]): TaskHours[] {
  const totals = new Map<string, number>();
  for (const l of lines) totals.set(l.onetTask, (totals.get(l.onetTask) ?? 0) + l.hours);
  return [...totals.entries()]
    .map(([onetTask, hours]) => ({ onetTask, hours }))
    .sort((a, b) => b.hours - a.hours || a.onetTask.localeCompare(b.onetTask));
}

/** AI-ready hours = hours × penetration. */
export function aiReadyHours(hours: number, penetration: number): number {
  return hours * penetration;
}

/** Hours back estimate = AI-ready hours × factor (default 0.3). */
export function hoursBack(aiReady: number, factor: number = DEFAULT_HOURS_BACK_FACTOR): number {
  checkFactor(factor);
  return aiReady * factor;
}

/** Euros back = hours back × the staff charge rate. */
export function eurosBack(hoursBackValue: number, chargeRate: number): number {
  return hoursBackValue * chargeRate;
}

/** Fee, budget, actual hours, effective rate, variance, money lost and hours per task for one engagement. */
export function summariseEngagement(engagement: Engagement, lines: TimesheetLine[]): EngagementSummary {
  const own = lines.filter((l) => l.engagementId === engagement.id);
  const hours = own.reduce((sum, l) => sum + l.hours, 0);
  return {
    engagementId: engagement.id,
    client: engagement.client,
    fee: engagement.fee,
    budgetHours: engagement.budgetHours,
    actualHours: hours,
    effectiveRate: effectiveRate(engagement.fee, hours),
    budgetRate: engagement.fee / engagement.budgetHours,
    budgetVarianceHours: budgetVariance(engagement.budgetHours, hours),
    moneyLost: moneyLost(engagement.fee, engagement.budgetHours, hours),
    hoursByTask: hoursByTask(own),
    synthetic: engagement.synthetic || own.some((l) => l.synthetic),
  };
}

/** Engagements sorted by money lost against budget, largest first. Ties sort by client name. */
export function rankByMoneyLost(engagements: Engagement[], lines: TimesheetLine[]): EngagementSummary[] {
  return engagements
    .map((e) => summariseEngagement(e, lines))
    .sort((a, b) => b.moneyLost - a.moneyLost || a.client.localeCompare(b.client));
}

/**
 * Per O*NET task: hours, AI-ready hours, hours back and euros back.
 * Euros back uses each line's own staff charge rate. Tasks with no score get 0 AI-ready hours.
 * Lines whose staff id is unknown count towards hours but add no euros.
 */
export function estimateTasks(
  lines: TimesheetLine[],
  scores: TaskScore[],
  staff: Staff[],
  factor: number = DEFAULT_HOURS_BACK_FACTOR,
): TaskEstimate[] {
  checkFactor(factor);
  const scoreByTask = new Map(scores.map((s) => [s.onetTask, s]));
  const rateByStaff = new Map(staff.map((s) => [s.id, s.chargeRate]));
  const byTask = new Map<string, TaskEstimate>();

  for (const l of lines) {
    const score = scoreByTask.get(l.onetTask);
    const penetration = score?.penetration ?? null;
    const ready = aiReadyHours(l.hours, penetration ?? 0);
    const back = hoursBack(ready, factor);
    const euros = eurosBack(back, rateByStaff.get(l.staffId) ?? 0);

    const t = byTask.get(l.onetTask) ?? {
      onetTask: l.onetTask,
      hours: 0,
      penetration,
      source: score?.source ?? null,
      aiReadyHours: 0,
      hoursBack: 0,
      eurosBack: 0,
      synthetic: false,
    };
    t.hours += l.hours;
    t.aiReadyHours += ready;
    t.hoursBack += back;
    t.eurosBack += euros;
    t.synthetic = t.synthetic || l.synthetic;
    byTask.set(l.onetTask, t);
  }

  return [...byTask.values()].sort((a, b) => b.aiReadyHours - a.aiReadyHours || a.onetTask.localeCompare(b.onetTask));
}
