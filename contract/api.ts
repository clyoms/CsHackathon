// Request and response shapes for the two API routes.
// Both routes work with no ANTHROPIC_API_KEY: they return a fixed sample answer and set `fallback: true`.
import { z } from "zod";
import { AthenaQuestion, AthenaResult, MeterReading, SourcedNumber } from "./types";

export const View = z.enum(["employee", "partner", "harry"]);
export type View = z.infer<typeof View>;

// ---------- POST /api/athena ----------

export const AthenaRequest = z.object({
  /** Who is asking. Engines look up their context (role, engagements, deadlines). */
  staffId: z.string().min(1),
  /** What the person typed, for example "What should I hand to AI before 18 November?". */
  request: z.string().min(1),
});
export type AthenaRequest = z.infer<typeof AthenaRequest>;

export const AthenaResponse = z.object({
  result: AthenaResult,
  meter: MeterReading,
  /** True when no API key was set and a fixed sample answer was returned. */
  fallback: z.boolean(),
});
export type AthenaResponse = z.infer<typeof AthenaResponse>;

// ---------- POST /api/ask ----------

export const AthenaAnswer = z.object({
  question: AthenaQuestion.shape.question,
  answer: z.string().min(1),
});
export type AthenaAnswer = z.infer<typeof AthenaAnswer>;

export const AskRequest = z.object({
  question: z.string().min(1),
  view: View,
  /** Required for the employee view. Optional for partner and harry. */
  staffId: z.string().min(1).optional(),
  /** Answers to Athena's questions, if any were asked. */
  athenaAnswers: z.array(AthenaAnswer).default([]),
});
export type AskRequest = z.infer<typeof AskRequest>;

export const AskResponse = z.object({
  /** Plain answer of at most 80 words that uses only the numbers below. */
  answer: z
    .string()
    .min(1)
    .refine((s) => s.trim().split(/\s+/).length <= 80, "answer must be at most 80 words"),
  /** Every number the answer uses, each with a source URL or synthetic: true. */
  numbers: z.array(SourcedNumber),
  meter: MeterReading,
  /** True when no API key was set and a fixed sample answer was returned. */
  fallback: z.boolean(),
});
export type AskResponse = z.infer<typeof AskResponse>;

/** Error body for both routes. */
export const ApiError = z.object({ error: z.string().min(1) });
export type ApiError = z.infer<typeof ApiError>;
