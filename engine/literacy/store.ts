// The lesson log on disk: data/runtime/literacy-log.json, a JSON array of LiteracyLogEntry.
// Server only (reads and writes files). If the file cannot be written, entries are kept in
// memory for the life of the process and a warning is logged.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { LiteracyLogEntry } from "@/contract/types";
import { parseLog } from "./parse";

export { parseLog };

export interface LessonStore {
  /** Every saved entry, in the order saved. */
  read(): LiteracyLogEntry[];
  /** Validate and save one entry, then return it. */
  add(entry: LiteracyLogEntry): LiteracyLogEntry;
}

export function defaultLogPath(): string {
  return join(process.cwd(), "data", "runtime", "literacy-log.json");
}

function readFromDisk(file: string): LiteracyLogEntry[] {
  if (!existsSync(file)) return [];
  try {
    return parseLog(readFileSync(file, "utf8"));
  } catch (err) {
    console.warn(`literacy log: could not read ${file}, starting empty`, err);
    return [];
  }
}

export function createLessonStore(file: string = defaultLogPath()): LessonStore {
  let memory: LiteracyLogEntry[] | null = null; // set once a write fails
  const read = () => (memory ? [...memory] : readFromDisk(file));
  return {
    read,
    add(entry) {
      const saved = LiteracyLogEntry.parse(entry);
      const next = [...read(), saved];
      try {
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, JSON.stringify(next, null, 2) + "\n", "utf8");
        memory = null;
      } catch (err) {
        console.warn(`literacy log: could not write ${file}, keeping entries in memory`, err);
        memory = next;
      }
      return saved;
    },
  };
}

let shared: LessonStore | null = null;

/** The one store the route and the pages share. */
export function getLessonStore(): LessonStore {
  shared ??= createLessonStore();
  return shared;
}
