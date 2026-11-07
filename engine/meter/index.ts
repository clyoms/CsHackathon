// Token meter. Records tokens in and out from each Claude response's `usage` field,
// converts them to euros from data/public/prices.json, and keeps a running
// "tokens per finished task" figure.
//
// Prices: agents never invent a price. A human fills data/public/prices.json.
// If a price is null or missing, euros are null and the UI shows tokens only.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { MeterReading } from "@/contract/types";

/** The model the app calls (build plan, section 2). */
export const MODEL = "claude-sonnet-5-5";

/** The fields the meter reads from a Claude response's `usage`. Matches the SDK's Usage type. */
export interface UsageLike {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

/** Euro prices per million tokens for one model. Null means unknown. */
export interface EuroPrice {
  inputPerMTok: number | null;
  outputPerMTok: number | null;
}

export const NO_PRICE: EuroPrice = { inputPerMTok: null, outputPerMTok: null };

/**
 * Reads one model's euro price from the parsed prices.json.
 * Accepted shape:
 *   { "currency": "EUR" | "USD", "usdToEur"?: number,
 *     "models": { "<model>": { "inputPerMTok": number | null, "outputPerMTok": number | null } } }
 * USD prices convert only when `usdToEur` is a number. Anything unreadable gives NO_PRICE.
 */
export function priceFor(model: string, prices: unknown): EuroPrice {
  if (!prices || typeof prices !== "object") return NO_PRICE;
  const p = prices as { currency?: unknown; usdToEur?: unknown; models?: Record<string, unknown> };
  const entry = p.models?.[model] as { inputPerMTok?: unknown; outputPerMTok?: unknown } | undefined;
  if (!entry) return NO_PRICE;

  const currency = typeof p.currency === "string" ? p.currency.toUpperCase() : "EUR";
  let factor: number | null;
  if (currency === "EUR") factor = 1;
  else if (currency === "USD" && typeof p.usdToEur === "number" && p.usdToEur > 0) factor = p.usdToEur;
  else factor = null;

  const convert = (v: unknown): number | null =>
    factor !== null && typeof v === "number" && Number.isFinite(v) && v >= 0 ? v * factor : null;
  return { inputPerMTok: convert(entry.inputPerMTok), outputPerMTok: convert(entry.outputPerMTok) };
}

/** Loads the price for `model` from data/public/prices.json. Returns NO_PRICE when the file is absent. */
export function loadPrice(model: string = MODEL, file = path.join(process.cwd(), "data", "public", "prices.json")): EuroPrice {
  if (!existsSync(file)) return NO_PRICE;
  try {
    return priceFor(model, JSON.parse(readFileSync(file, "utf8")));
  } catch {
    return NO_PRICE;
  }
}

/** All input tokens, including cache writes and cache reads. */
export function tokensIn(usage: UsageLike): number {
  return usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
}

/**
 * Euros for a token count. Null when either price is unknown.
 * Cache reads are priced at the full input rate, so this slightly overstates cached calls.
 */
export function euros(tokensInCount: number, tokensOutCount: number, price: EuroPrice): number | null {
  if (price.inputPerMTok === null || price.outputPerMTok === null) return null;
  return (tokensInCount * price.inputPerMTok + tokensOutCount * price.outputPerMTok) / 1_000_000;
}

/** One reading from one response. Use zero usage for a no-key fallback answer. */
export function readingFromUsage(task: string, usage: UsageLike | null, price: EuroPrice, finished: boolean): MeterReading {
  const inCount = usage ? tokensIn(usage) : 0;
  const outCount = usage ? usage.output_tokens : 0;
  return { task, tokensIn: inCount, tokensOut: outCount, euros: euros(inCount, outCount, price), finished };
}

/** Running totals across calls. A task can take several calls before it finishes. */
export class Meter {
  private readonly tasks = new Map<string, MeterReading>();

  constructor(private readonly price: EuroPrice = NO_PRICE) {}

  /** Adds one response's usage to a task. Returns the task's running reading. */
  record(task: string, usage: UsageLike | null): MeterReading {
    const prev = this.tasks.get(task) ?? { task, tokensIn: 0, tokensOut: 0, euros: null, finished: false };
    const inCount = prev.tokensIn + (usage ? tokensIn(usage) : 0);
    const outCount = prev.tokensOut + (usage ? usage.output_tokens : 0);
    const next: MeterReading = {
      task,
      tokensIn: inCount,
      tokensOut: outCount,
      euros: euros(inCount, outCount, this.price),
      finished: prev.finished,
    };
    this.tasks.set(task, next);
    return next;
  }

  /** Marks a task finished. Unknown tasks are added with zero tokens. */
  finish(task: string): MeterReading {
    const reading = { ...this.record(task, null), finished: true };
    this.tasks.set(task, reading);
    return reading;
  }

  readings(): MeterReading[] {
    return [...this.tasks.values()];
  }

  totals(): { tokensIn: number; tokensOut: number; euros: number | null } {
    const all = this.readings();
    const inCount = all.reduce((s, r) => s + r.tokensIn, 0);
    const outCount = all.reduce((s, r) => s + r.tokensOut, 0);
    return { tokensIn: inCount, tokensOut: outCount, euros: euros(inCount, outCount, this.price) };
  }

  /** Tokens (in plus out) per finished task, across finished tasks only. Null when none finished. */
  tokensPerFinishedTask(): number | null {
    const done = this.readings().filter((r) => r.finished);
    if (done.length === 0) return null;
    return done.reduce((s, r) => s + r.tokensIn + r.tokensOut, 0) / done.length;
  }

  /** Euros per finished task. Null when none finished or the price is unknown. */
  eurosPerFinishedTask(): number | null {
    const done = this.readings().filter((r) => r.finished);
    if (done.length === 0) return null;
    const perTask = this.tokensPerFinishedTask();
    if (perTask === null) return null;
    const inCount = done.reduce((s, r) => s + r.tokensIn, 0) / done.length;
    const outCount = done.reduce((s, r) => s + r.tokensOut, 0) / done.length;
    return euros(inCount, outCount, this.price);
  }
}
