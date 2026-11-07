// /api/literacy logic, kept apart from the route so tests can pass their own world and store.
import { z } from "zod";
import type { ApiError } from "@/contract/api";
import type { LiteracyLogEntry } from "@/contract/types";
import { isLessonId } from "@/catalogue/literacy/lessons";
import { lessonEntries, recordAdopted, recordLesson } from "@/engine/literacy";
import type { LessonStore } from "@/engine/literacy/store";
import type { World } from "../ask/world";

export const LessonRequest = z.object({ staffId: z.string().min(1), lessonId: z.string().min(1) });
/** "I'll try it" on the employee page: the person says they will adopt a recommended item. */
export const AdoptRequest = z.object({ staffId: z.string().min(1), itemId: z.string().min(1), measure: z.literal("adopted") });

type Result<T> = { status: 200; body: T } | { status: 400; body: ApiError };

export function handleLiteracyGet(store: LessonStore): { entries: LiteracyLogEntry[] } {
  return { entries: lessonEntries(store.read()) };
}

export function handleLiteracyPost(
  body: unknown,
  world: Pick<World, "staff" | "today">,
  store: LessonStore,
): Result<LiteracyLogEntry> {
  const adopt = AdoptRequest.safeParse(body);
  if (adopt.success) {
    const { staffId, itemId } = adopt.data;
    if (!world.staff.some((s) => s.id === staffId)) return { status: 400, body: { error: `unknown staffId: ${staffId}` } };
    const [entry] = recordAdopted([], staffId, itemId, world.today);
    return { status: 200, body: store.add(entry) };
  }
  const parsed = LessonRequest.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    return { status: 400, body: { error } };
  }
  const { staffId, lessonId } = parsed.data;
  if (!world.staff.some((s) => s.id === staffId)) return { status: 400, body: { error: `unknown staffId: ${staffId}` } };
  if (!isLessonId(lessonId)) return { status: 400, body: { error: `unknown lessonId: ${lessonId}` } };
  const [entry] = recordLesson([], staffId, lessonId, world.today);
  return { status: 200, body: store.add(entry) };
}
