// Types for grade.mjs, so TypeScript tests can import it (the project has allowJs off).

export interface Expected {
  outcome: "decline" | "answer";
  taskType?: string;
  namedDate?: boolean;
  skill?: "match" | "none";
  lowRisk?: boolean;
  clarify?: boolean;
}

export interface PromptEntry {
  id: string;
  staffId: string;
  prompt: string;
  answerWith?: string[];
  expected: Expected;
}

export interface Run {
  athena?: any;
  ask?: any;
  error?: string;
}

export interface Check {
  rule: string;
  pass: boolean;
  detail: string;
}

export interface CaseResult {
  id: string;
  pass: boolean;
  checks: Check[];
}

export type NamedDate =
  | { kind: "dayMonth"; day: number; month: number }
  | { kind: "weekday"; weekday: number }
  | { kind: "offset"; days: number };

export const TASK_SKILL_KEYWORDS: Record<string, string[]>;
export function namedDateIn(prompt: string): NamedDate | null;
export function shownDeadline(ask: any): { label: string; dueDate: string; daysLeft: number; source: string } | null;
export function showsCountdown(ask: any): boolean;
export function gradeOutcome(expected: Expected, run: Run): Check;
export function gradeNoNumbersOnDecline(run: Run): Check | null;
export function gradeClarify(expected: Expected, run: Run): Check | null;
export function gradeNamedDate(prompt: string, expected: Expected, run: Run): Check | null;
export function skillFitsTask(item: { id?: string; title?: string } | null | undefined, taskType: string): boolean;
export function gradeSkill(expected: Expected, run: Run): Check | null;
export function gradeDeadlinePhrase(run: Run): Check | null;
export function gradeLowRisk(expected: Expected, run: Run): Check | null;
export function gradeCase(entry: PromptEntry, run: Run): CaseResult;
