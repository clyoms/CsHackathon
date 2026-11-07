"use client";
// The 4D course: four lessons, each with an exercise and a "Mark lesson complete" button
// that saves to /api/literacy and updates the progress line without a reload.
import { useState } from "react";
import type { LiteracyLogEntry } from "@/contract/types";
import { LESSONS, LITERACY_SOURCE } from "@/catalogue/literacy/lessons";
import skills from "@/components/skills/skills.module.css";
import styles from "./literacy.module.css";

export function progressText(done: number, total: number = LESSONS.length): string {
  return `${done} of ${total} done`;
}

export function LessonCourse({
  staffId,
  staffName,
  initialDone,
}: {
  staffId: string;
  staffName: string;
  initialDone: string[];
}) {
  const [done, setDone] = useState<Set<string>>(() => new Set(initialDone));
  const [status, setStatus] = useState<{ id: string; text: string } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  async function complete(lessonId: string) {
    setSaving(lessonId);
    setStatus(null);
    try {
      const res = await fetch("/api/literacy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ staffId, lessonId }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const entry = (await res.json()) as LiteracyLogEntry;
      setDone((prev) => new Set(prev).add(entry.itemId));
      setStatus({ id: lessonId, text: `Saved to the AI literacy log for ${entry.date}.` });
    } catch {
      setStatus({ id: lessonId, text: "Could not save. Try again." });
    } finally {
      setSaving(null);
    }
  }

  return (
    <main className={skills.page}>
      <p className={skills.kicker}>AI fluency</p>
      <h1 className={skills.title}>AI fluency: the 4Ds</h1>
      <p className={skills.lead}>
        Four short lessons on working well with AI: Delegation, Description, Discernment and Diligence. Each takes about
        two minutes to read and ends with one exercise from accounting work. Based on{" "}
        <a href={LITERACY_SOURCE.url}>{LITERACY_SOURCE.name}</a>, in our own words.
      </p>
      <p className={styles.progress} role="status" aria-live="polite">
        {staffName}: {progressText(done.size)}
      </p>

      <ol className={skills.ledger}>
        {LESSONS.map((lesson, n) => {
          const finished = done.has(lesson.id);
          return (
            <li key={lesson.id} id={lesson.id} className={skills.item}>
              <div className={skills.head}>
                <h2 className={skills.name}>
                  {n + 1}. {lesson.title}
                </h2>
                {finished && <span className={`${skills.risk} ${skills.low}`}>Done</span>}
              </div>
              <p className={skills.summary}>{lesson.summary}</p>
              <div className={styles.read}>
                {lesson.read.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className={styles.exercise}>
                <h3>Exercise</h3>
                <p>{lesson.exercise.scenario}</p>
                <p>
                  <strong>{lesson.exercise.task}</strong>
                </p>
                <details className={skills.body}>
                  <summary>Compare with a worked answer</summary>
                  <ul>
                    {lesson.exercise.answer.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </details>
              </div>
              <div className={skills.actions}>
                <button
                  type="button"
                  className={skills.button}
                  disabled={finished || saving === lesson.id}
                  onClick={() => void complete(lesson.id)}
                >
                  {finished ? "Lesson complete" : saving === lesson.id ? "Saving…" : "Mark lesson complete"}
                </button>
              </div>
              <p className={skills.status} role="status" aria-live="polite">
                {status?.id === lesson.id ? status.text : ""}
              </p>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
