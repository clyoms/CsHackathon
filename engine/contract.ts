// Shared result types for Athena, the deadline parser and the recommender.
// Types only, no logic. Changing this file after it is frozen needs a new contract task.
// Note: engine/athena/index.ts has older types with the same names. Import from here in new code.

export type AthenaOutcomeKind = "decline" | "skill" | "no_match" | "clarify";

export interface AthenaOutcome {
  kind: AthenaOutcomeKind;
  /** One-line text, for example the decline or no-match line. */
  message?: string;
  /** Clarifying questions, only when kind is "clarify". */
  questions?: string[];
}

export interface AthenaContext {
  client?: string;
  task?: string;
  goal?: string;
  riskTolerance?: "low" | "normal";
  /** The date or day as the user wrote it, for example "by Friday". */
  namedDate?: string;
}

export interface Deadline {
  label: string;
  /** ISO date, YYYY-MM-DD. */
  dueDate: string;
  daysLeft: number;
  source: "user" | "catalogue";
}

export interface Source {
  label: string;
  url?: string;
}

export interface Recommendation {
  skillId: string;
  skillName: string;
  hoursBack: number;
  worthEur: number;
  deadline: Deadline | null;
  sources: Source[];
  synthetic: boolean;
}

export interface Usage {
  offline: boolean;
  offlineReason?: string;
  tokensUsed: number;
}
