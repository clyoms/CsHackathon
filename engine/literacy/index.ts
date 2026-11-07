// Literacy log: one entry each time a recommendation is shown or adopted. Exports as CSV.
// Pure functions: each returns a new log and never changes the one passed in.
import Papa from "papaparse";
import { LiteracyLogEntry, type Recommendation } from "@/contract/types";

export type LiteracyLog = readonly LiteracyLogEntry[];

export const CSV_COLUMNS = ["staffId", "date", "measure", "itemId", "adopted"] as const;

/** Validate an entry against the contract and append it. */
export function appendEntry(log: LiteracyLog, entry: LiteracyLogEntry): LiteracyLog {
  return [...log, LiteracyLogEntry.parse(entry)];
}

/** Record that a recommendation was shown to its person on `date` (YYYY-MM-DD). */
export function recordShown(log: LiteracyLog, rec: Recommendation, date: string): LiteracyLog {
  return appendEntry(log, { staffId: rec.staffId, date, measure: "shown", itemId: rec.item.id, adopted: false });
}

/** Record that a person said they will try an item ("I'll try it"). */
export function recordAdopted(log: LiteracyLog, staffId: string, itemId: string, date: string): LiteracyLog {
  return appendEntry(log, { staffId, date, measure: "adopted", itemId, adopted: true });
}

/** One header row, then one row per entry, in log order. */
export function toCsv(log: LiteracyLog): string {
  return Papa.unparse(
    { fields: [...CSV_COLUMNS], data: log.map((e) => CSV_COLUMNS.map((c) => e[c])) },
    { newline: "\n" },
  ).replace(/\n$/, ""); // Papa leaves a trailing newline when there are no rows
}

/** Record that a person finished a 4D literacy lesson. itemId is the lesson id. */
export function recordLesson(log: LiteracyLog, staffId: string, lessonId: string, date: string): LiteracyLog {
  return appendEntry(log, { staffId, date, measure: "lesson", itemId: lessonId, adopted: true });
}

/** Only the lesson entries, in log order. */
export function lessonEntries(log: LiteracyLog): LiteracyLogEntry[] {
  return log.filter((e) => e.measure === "lesson");
}

/** A new log sorted newest date first. Entries on the same date keep their order, later ones first. */
export function newestFirst(log: LiteracyLog): LiteracyLogEntry[] {
  return log
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.date === b.e.date ? b.i - a.i : a.e.date < b.e.date ? 1 : -1))
    .map(({ e }) => e);
}

/** The lesson ids a person has finished, once each. */
export function lessonsDone(log: LiteracyLog, staffId: string): string[] {
  return [...new Set(lessonEntries(log).filter((e) => e.staffId === staffId).map((e) => e.itemId))];
}
