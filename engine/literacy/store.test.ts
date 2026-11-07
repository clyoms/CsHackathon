import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lessonLogEntryFixture, staffFixture } from "@/contract/fixtures";
import { lessonEntries, lessonsDone, newestFirst, recordLesson } from "./index";
import { createLessonStore, parseLog } from "./store";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "frame-literacy-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("lesson store", () => {
  it("round-trips an entry through the file, creating the folder", () => {
    const file = join(dir, "runtime", "literacy-log.json");
    const store = createLessonStore(file);
    expect(store.read()).toEqual([]);
    store.add(lessonLogEntryFixture);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual([lessonLogEntryFixture]);
    // A fresh store on the same file reads it back.
    expect(createLessonStore(file).read()).toEqual([lessonLogEntryFixture]);
  });

  it("keeps entries in memory and warns when the file cannot be written", () => {
    const blocker = join(dir, "not-a-folder");
    writeFileSync(blocker, "x");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = createLessonStore(join(blocker, "literacy-log.json"));
    store.add(lessonLogEntryFixture);
    expect(warn).toHaveBeenCalled();
    expect(store.read()).toEqual([lessonLogEntryFixture]);
  });

  it("rejects an entry that breaks the contract", () => {
    const store = createLessonStore(join(dir, "log.json"));
    expect(() => store.add({ ...lessonLogEntryFixture, date: "7 Nov" })).toThrow();
  });

  it("drops bad rows and reads an empty file as empty", () => {
    expect(parseLog("")).toEqual([]);
    expect(parseLog(JSON.stringify([lessonLogEntryFixture, { staffId: 1 }]))).toEqual([lessonLogEntryFixture]);
  });
});

describe("lesson log helpers", () => {
  it("records a lesson as adopted, lists done lessons once, and sorts newest first", () => {
    let log = recordLesson([], staffFixture.id, "4d-delegation", "2026-11-05");
    log = recordLesson(log, staffFixture.id, "4d-description", "2026-11-07");
    log = recordLesson(log, staffFixture.id, "4d-delegation", "2026-11-07");
    log = [...log, { staffId: staffFixture.id, date: "2026-11-08", measure: "shown", itemId: "i", adopted: false }];
    expect(lessonEntries(log)).toHaveLength(3);
    expect(lessonEntries(log).every((e) => e.adopted)).toBe(true);
    expect(lessonsDone(log, staffFixture.id)).toEqual(["4d-delegation", "4d-description"]);
    expect(newestFirst(log).map((e) => [e.date, e.itemId])).toEqual([
      ["2026-11-08", "i"],
      ["2026-11-07", "4d-delegation"],
      ["2026-11-07", "4d-description"],
      ["2026-11-05", "4d-delegation"],
    ]);
  });
});
