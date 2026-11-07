"use client";
// The skills library: every catalogue item as a ledger line, with Copy (the text) and Export (a Claude skill file).
import { useState } from "react";
import type { CatalogueItem } from "@/contract/types";
import type { Risk } from "@/catalogue";
import { UPLOAD_HINT, copyText, downloadSkill } from "@/components/employee/exportSkill";
import styles from "./skills.module.css";

export type LibraryItem = CatalogueItem & { risk: Risk };

const KIND_ORDER: CatalogueItem["kind"][] = ["skill", "hook", "plugin"];
const KIND_HEADING: Record<CatalogueItem["kind"], string> = {
  skill: "Skills",
  hook: "Hooks",
  plugin: "Plugins",
};

type Status = { id: string; text: string } | null;

export function SkillLibrary({ items }: { items: LibraryItem[] }) {
  const [status, setStatus] = useState<Status>(null);

  async function copy(item: LibraryItem) {
    const ok = await copyText(item.body);
    setStatus({ id: item.id, text: ok ? "Copied. Paste it into Claude." : "Could not copy. Open the full text and select it." });
  }

  function exportItem(item: LibraryItem) {
    const file = downloadSkill(item);
    setStatus({ id: item.id, text: `Saved ${file}. ${UPLOAD_HINT}` });
  }

  return (
    <main className={styles.page}>
      <p className={styles.kicker}>
        Library
      </p>
      <h1 className={styles.title}>Skills library</h1>
      <p className={styles.lead}>
        Every skill, hook and plugin Handoff can recommend. Copy the text into Claude, or export it as a skill file.
        Check the output every time: each item says how.
      </p>

      {KIND_ORDER.map((kind) => {
        const group = items.filter((i) => i.kind === kind);
        if (group.length === 0) return null;
        return (
          <section key={kind} aria-labelledby={`h-${kind}`}>
            <h2 id={`h-${kind}`} className={styles.heading}>
              {KIND_HEADING[kind]} <span className={styles.count}>{group.length}</span>
            </h2>
            <ul className={styles.ledger}>
              {group.map((item) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.head}>
                    <h3 className={styles.name}>{item.title}</h3>
                    <span className={`${styles.risk} ${styles[item.risk]}`}>{item.risk} risk</span>
                  </div>
                  <p className={styles.summary}>{item.plainSummary}</p>
                  {item.howThisHelps && (
                    <p className={styles.helps}>
                      <strong>How this helps:</strong> {item.howThisHelps}
                    </p>
                  )}
                  {item.verifyStep && (
                    <p className={styles.verify}>
                      <strong>Check:</strong> {item.verifyStep}
                    </p>
                  )}
                  <div className={styles.actions}>
                    <button type="button" className={styles.button} onClick={() => void copy(item)}>
                      Copy
                    </button>
                    <button type="button" className={styles.button} onClick={() => exportItem(item)}>
                      Export
                    </button>
                  </div>
                  <p className={styles.status} role="status" aria-live="polite">
                    {status?.id === item.id ? status.text : ""}
                  </p>
                  <details className={styles.body}>
                    <summary>Full text</summary>
                    <pre>{item.body}</pre>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
