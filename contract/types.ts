// Shared data contract for Frame Next. Every module and view builds against these.
//
// Ground rules from docs/plan/frame-next-build-plan.md section 2:
// - Every synthetic number carries `synthetic: true`, so the UI can show a "synthetic" badge.
// - Every real number carries a `source` URL, so the UI can show it on hover.
// Changing this file after it is frozen needs a new contract task.
import { z } from "zod";

/** ISO calendar date, YYYY-MM-DD. */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
/** URL a real number was read from. */
export const SourceUrl = z.url();

// ---------- Synthetic Frame data ----------

export const Staff = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  /** For example Tax, Audit, Business Finance, Private Wealth. */
  team: z.string().min(1),
  /** Euros per hour. */
  chargeRate: z.number().positive(),
  synthetic: z.boolean(),
});
export type Staff = z.infer<typeof Staff>;

export const Engagement = z.object({
  id: z.string().min(1),
  client: z.string().min(1),
  type: z.string().min(1),
  /** Euros. */
  fee: z.number().nonnegative(),
  budgetHours: z.number().positive(),
  /** Id of a Deadline. */
  deadlineId: z.string().min(1),
  synthetic: z.boolean(),
});
export type Engagement = z.infer<typeof Engagement>;

export const TimesheetLine = z.object({
  staffId: z.string().min(1),
  engagementId: z.string().min(1),
  date: IsoDate,
  hours: z.number().positive(),
  /** What the person typed in the timesheet. */
  taskText: z.string().min(1),
  /** Exact O*NET task statement this line maps to. */
  onetTask: z.string().min(1),
  /** Added beyond the plan's field list: timesheets are made-up Frame data. */
  synthetic: z.boolean(),
});
export type TimesheetLine = z.infer<typeof TimesheetLine>;

export const UsageRecord = z.object({
  staffId: z.string().min(1),
  date: IsoDate,
  prompts: z.number().int().nonnegative(),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  taskCategory: z.string().min(1),
  /** Share of outputs the person checked, 0 to 1. */
  verified: z.number().min(0).max(1),
  synthetic: z.boolean(),
});
export type UsageRecord = z.infer<typeof UsageRecord>;

// ---------- Real public data (each carries a source) ----------

export const TaskScore = z.object({
  onetTask: z.string().min(1),
  /** Anthropic Economic Index task penetration, 0 to 1. */
  penetration: z.number().min(0).max(1),
  source: SourceUrl,
});
export type TaskScore = z.infer<typeof TaskScore>;

export const JobExposure = z.object({
  occCode: z.string().min(1),
  title: z.string().min(1),
  /** Anthropic Economic Index observed exposure, 0 to 1. */
  observedExposure: z.number().min(0).max(1),
  source: SourceUrl,
});
export type JobExposure = z.infer<typeof JobExposure>;

export const Deadline = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  date: IsoDate,
  jurisdiction: z.enum(["IE", "US", "KY"]),
  source: SourceUrl,
  /** False when the date was not read from an official page. Defaults to true. */
  checked: z.boolean().default(true),
});
export type Deadline = z.infer<typeof Deadline>;

// ---------- Catalogue ----------

export const CatalogueItem = z.object({
  id: z.string().min(1),
  kind: z.enum(["skill", "hook", "plugin"]),
  title: z.string().min(1),
  /** One line a non-technical reader understands. */
  plainSummary: z.string().min(1),
  /** Exact O*NET task statements. */
  targetsOnetTasks: z.array(z.string().min(1)).min(1),
  /** Full text a person can copy. */
  body: z.string().min(1),
  /** How to check the output. Empty string when the item has none. */
  verifyStep: z.string(),
  /** One plain sentence on what the item saves and for whom. Empty string when the item has none. */
  howThisHelps: z.string(),
});
export type CatalogueItem = z.infer<typeof CatalogueItem>;

// ---------- Engine outputs ----------

export const Recommendation = z.object({
  staffId: z.string().min(1),
  item: CatalogueItem,
  aiReadyHours: z.number().nonnegative(),
  hoursBackEstimate: z.number().nonnegative(),
  /** Euros. */
  eurosBack: z.number().nonnegative(),
  deadline: Deadline,
  /** Plain English, under 30 words. */
  reason: z.string().min(1).refine((s) => s.trim().split(/\s+/).length < 30, "reason must be under 30 words"),
  /** Added beyond the plan's field list: true when the hours come from synthetic timesheets. */
  synthetic: z.boolean(),
});
export type Recommendation = z.infer<typeof Recommendation>;

export const AthenaQuestion = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  /** One-line reason for asking. */
  why: z.string().min(1),
});
export type AthenaQuestion = z.infer<typeof AthenaQuestion>;

export const AthenaResult = z.object({
  needed: z.boolean(),
  questions: z.array(AthenaQuestion).max(3),
  /** Tokens in plus tokens out for this call. 0 on the no-key fallback. */
  tokensUsed: z.number().int().nonnegative(),
});
export type AthenaResult = z.infer<typeof AthenaResult>;

export const MeterReading = z.object({
  task: z.string().min(1),
  tokensIn: z.number().int().nonnegative(),
  tokensOut: z.number().int().nonnegative(),
  /** Null when data/public/prices.json has no price, so the UI shows tokens only. */
  euros: z.number().nonnegative().nullable(),
  finished: z.boolean(),
});
export type MeterReading = z.infer<typeof MeterReading>;

export const LiteracyLogEntry = z.object({
  staffId: z.string().min(1),
  date: IsoDate,
  /** "lesson": a finished 4D literacy lesson. itemId is then the lesson id and adopted is true. */
  measure: z.enum(["shown", "adopted", "lesson"]),
  itemId: z.string().min(1),
  adopted: z.boolean(),
});
export type LiteracyLogEntry = z.infer<typeof LiteracyLogEntry>;

// ---------- A number shown in an answer ----------

/**
 * Any number an API hands to the UI. It must carry a source URL (real) or synthetic: true (made up),
 * or both when a real rate is applied to synthetic hours.
 */
export const SourcedNumber = z
  .object({
    label: z.string().min(1),
    value: z.number(),
    unit: z.string().min(1),
    source: SourceUrl.optional(),
    synthetic: z.boolean(),
  })
  .refine((n) => n.synthetic || n.source !== undefined, "a real number needs a source URL");
export type SourcedNumber = z.infer<typeof SourcedNumber>;
