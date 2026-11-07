import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { staffFixture } from "@/contract/fixtures";
import { LESSONS, LESSON_IDS } from "@/catalogue/literacy/lessons";
import { LiteracyLog } from "@/components/ai-lead/LiteracyLog";
import { progressText } from "@/components/literacy/LessonCourse";
import { createLessonStore, type LessonStore } from "@/engine/literacy/store";
import { fixtureWorld } from "../ask/world";
import { handleLiteracyGet, handleLiteracyPost } from "./handler";
import { POST } from "./route";

const post = (body: unknown) =>
  new Request("http://localhost/api/literacy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

let dir: string;
let store: LessonStore;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "frame-literacy-api-"));
  store = createLessonStore(join(dir, "literacy-log.json"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("I'll try it", () => {
  it("saves an adopted entry dated today, and rejects an unknown person", () => {
    const world = fixtureWorld();
    const staffId = world.staff[0].id;
    const res = handleLiteracyPost({ staffId, itemId: "skill-bank-reconciliation", measure: "adopted" }, world, store);
    expect(res.status).toBe(200);
    expect(store.read()).toEqual([expect.objectContaining({ staffId, measure: "adopted", adopted: true, date: world.today })]);
    expect(handleLiteracyPost({ staffId: "nobody", itemId: "x", measure: "adopted" }, world, store).status).toBe(400);
  });
});

describe("lessons", () => {
  it("has the four 4D lessons, each with a read and an exercise", () => {
    expect(LESSONS.map((l) => l.id)).toEqual([...LESSON_IDS]);
    for (const l of LESSONS) {
      expect(l.read.length).toBeGreaterThan(0);
      expect(l.exercise.task).not.toBe("");
      expect(l.exercise.answer.length).toBeGreaterThan(0);
    }
    expect(progressText(2)).toBe("2 of 4 done");
  });
});

describe("/api/literacy", () => {
  const world = fixtureWorld("2026-11-07");

  it("saves a lesson entry dated today and lists it on GET", () => {
    const res = handleLiteracyPost({ staffId: staffFixture.id, lessonId: "4d-diligence" }, world, store);
    expect(res).toEqual({
      status: 200,
      body: { staffId: staffFixture.id, date: "2026-11-07", measure: "lesson", itemId: "4d-diligence", adopted: true },
    });
    expect(handleLiteracyGet(store).entries).toEqual([res.body]);
  });

  it("rejects an unknown lesson and an unknown person, and saves nothing", () => {
    expect(handleLiteracyPost({ staffId: staffFixture.id, lessonId: "4d-dancing" }, world, store).status).toBe(400);
    expect(handleLiteracyPost({ staffId: "s-nobody", lessonId: "4d-delegation" }, world, store).status).toBe(400);
    expect(store.read()).toEqual([]);
  });

  it("the route answers 400 for an unknown lesson", async () => {
    const res = await POST(post({ staffId: "s-aoife", lessonId: "not-a-lesson" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/lessonId/);
  });

  it("the route answers 400 for a body that is not JSON", async () => {
    const res = await POST(new Request("http://localhost/api/literacy", { method: "POST", body: "{" }));
    expect(res.status).toBe(400);
  });
});

describe("AI Lead literacy log", () => {
  it("lists a lesson entry with a readable measure and the lesson title", () => {
    const html = renderToStaticMarkup(
      createElement(LiteracyLog, {
        entries: [{ staffId: "s-aoife", date: "2026-11-07", measure: "lesson", itemId: "4d-discernment", adopted: true }],
        names: { "s-aoife": "Aoife" },
      }),
    );
    expect(html).toContain("4D lesson finished");
    expect(html).toContain("4D lesson: Discernment");
    expect(html).toContain("Aoife");
    expect(html).toContain("2026-11-07");
  });
});
