import type { Metadata } from "next";
import { getWorld } from "@/app/api/ask/world";
import { LessonCourse } from "@/components/literacy/LessonCourse";
import { AOIFE_ID } from "@/data/frame";
import { lessonsDone } from "@/engine/literacy";
import { getLessonStore } from "@/engine/literacy/store";

export const metadata: Metadata = { title: "Frame Next: AI literacy course" };
// Progress comes from the saved log, so read it on each request.
export const dynamic = "force-dynamic";

/** The 4D course for the employee the employee page shows (Aoife). */
export default function LiteracyPage() {
  const world = getWorld();
  const staff = world.staff.find((s) => s.id === AOIFE_ID);
  if (!staff) throw new Error(`staff ${AOIFE_ID} is missing from data/frame`);
  const done = lessonsDone(getLessonStore().read(), staff.id);
  return <LessonCourse staffId={staff.id} staffName={staff.name} initialDone={done} />;
}
