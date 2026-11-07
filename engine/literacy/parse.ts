// Pure parsing for the stored lesson log. Bad JSON throws; entries that break the contract are dropped.
import { LiteracyLogEntry } from "@/contract/types";

export function parseLog(text: string): LiteracyLogEntry[] {
  if (text.trim() === "") return [];
  const raw: unknown = JSON.parse(text);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r) => {
    const parsed = LiteracyLogEntry.safeParse(r);
    return parsed.success ? [parsed.data] : [];
  });
}
