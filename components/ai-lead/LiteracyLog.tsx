"use client";

import type { LiteracyLogEntry } from "@/contract/types";
import { findLesson } from "@/catalogue/literacy/lessons";
import { toCsv } from "@/engine/literacy";
import styles from "./ai-lead.module.css";

export const CSV_FILE_NAME = "frame-ai-literacy-log.csv";

/** Readable words for each measure. The CSV keeps the raw values. */
export const MEASURE_LABEL: Record<LiteracyLogEntry["measure"], string> = {
  shown: "Recommendation shown",
  adopted: "Said they will try it",
  lesson: "4D lesson finished",
};

/** The lesson title for a lesson entry, otherwise the item id. */
export function itemLabel(e: LiteracyLogEntry): string {
  if (e.measure !== "lesson") return e.itemId;
  const lesson = findLesson(e.itemId);
  return lesson ? `4D lesson: ${lesson.title}` : e.itemId;
}

export function LiteracyLog({ entries, names }: { entries: LiteracyLogEntry[]; names: Record<string, string> }) {
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
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Person</th>
            <th>Measure</th>
            <th>Item</th>
            <th>Adopted</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={`${e.staffId}-${e.date}-${e.itemId}-${i}`}>
              <td data-label="Date">{e.date}</td>
              <td data-label="Person">{names[e.staffId] ?? e.staffId}</td>
              <td data-label="Measure">{MEASURE_LABEL[e.measure]}</td>
              <td data-label="Item">{itemLabel(e)}</td>
              <td data-label="Adopted">{e.adopted ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className={styles.button} onClick={exportCsv}>
        Export CSV
      </button>
    </div>
  );
}
