"use client";

import type { LiteracyLogEntry } from "@/contract/types";
import { toCsv } from "@/engine/literacy";
import styles from "./ai-lead.module.css";

export const CSV_FILE_NAME = "frame-ai-literacy-log.csv";

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
              <td data-label="Measure">{e.measure}</td>
              <td data-label="Item">{e.itemId}</td>
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
