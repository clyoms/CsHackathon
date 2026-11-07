"use client";

import type { LiteracyLogEntry } from "@/contract/types";
import { findLesson } from "@/catalogue/literacy/lessons";
import { toCsv } from "@/engine/literacy";
import styles from "./ai-lead.module.css";

export const CSV_FILE_NAME = "ai-literacy-log.csv";

/** Readable words for each measure. The CSV keeps the raw values. */
export const MEASURE_LABEL: Record<LiteracyLogEntry["measure"], string> = {
  shown: "Recommendation shown",
  adopted: "Said they will try it",
  lesson: "4D lesson finished",
};

/** The lesson title for a lesson entry, the catalogue title when known, otherwise the item id. */
export function itemLabel(e: LiteracyLogEntry, titles: Record<string, string> = {}): string {
  if (e.measure !== "lesson") return titles[e.itemId] ?? e.itemId;
  const lesson = findLesson(e.itemId);
  return lesson ? `4D lesson: ${lesson.title}` : e.itemId;
}

/**
 * The log as a short summary (who tried their pick, who has not) over a simple list,
 * so the AI Lead can see at a glance whom to follow up with.
 */
export function LiteracyLog({
  entries,
  names,
  titles = {},
}: {
  entries: LiteracyLogEntry[];
  names: Record<string, string>;
  titles?: Record<string, string>;
}) {
  const picks = entries.filter((e) => e.measure !== "lesson");
  const tried = picks.filter((e) => e.adopted).length;
  const lessons = entries.filter((e) => e.measure === "lesson").length;

  function exportCsv() {
    const blob = new Blob([toCsv(entries)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = CSV_FILE_NAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <dl className={styles.logSummary}>
        <div>
          <dt>Tried their pick</dt>
          <dd>
            {tried} of {picks.length}
          </dd>
        </div>
        <div>
          <dt>Not yet</dt>
          <dd>{picks.length - tried}</dd>
        </div>
        <div>
          <dt>4D lessons done</dt>
          <dd>{lessons}</dd>
        </div>
      </dl>
      <ul className={styles.logList}>
        {entries.map((e, i) => (
          <li key={`${e.staffId}-${e.date}-${e.itemId}-${i}`} className={styles.logRow}>
            <span className={styles.logWho}>
              <span>{names[e.staffId] ?? e.staffId}</span>
              <span className={styles.logMeta}>
                {MEASURE_LABEL[e.measure]} · {e.date}
              </span>
            </span>
            <span className={styles.logItem}>{itemLabel(e, titles)}</span>
            <span className={`${styles.logStatus} ${e.adopted ? styles.logYes : ""}`}>{e.adopted ? "Yes" : "No"}</span>
          </li>
        ))}
      </ul>
      <button type="button" className={styles.button} onClick={exportCsv}>
        Export CSV
      </button>
    </div>
  );
}
