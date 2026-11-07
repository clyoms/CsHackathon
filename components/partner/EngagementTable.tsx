"use client";

import { Fragment, useState } from "react";
import type { PartnerRow } from "./data";
import { Num, euro, hours } from "./Num";
import styles from "./partner.module.css";

/** Shortens a long O*NET task statement for a table cell. The full text shows on hover. */
function short(task: string, max = 70): string {
  return task.length > max ? `${task.slice(0, max - 1).trimEnd()}…` : task;
}

export function EngagementTable({ rows, initialOpen = null }: { rows: PartnerRow[]; initialOpen?: string | null }) {
  const [open, setOpen] = useState<string | null>(initialOpen);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Client</th>
            <th className={styles.num}>Fee</th>
            <th className={styles.num}>Budget vs actual</th>
            <th className={styles.num}>Effective rate</th>
            <th className={styles.num}>Money lost</th>
            <th>Top AI-ready task</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isOpen = open === r.engagementId;
            const used = r.budgetHours > 0 ? Math.min(1, r.actualHours / r.budgetHours) : 0;
            const over = r.actualHours > r.budgetHours;
            return (
              <Fragment key={r.engagementId}>
                <tr className={isOpen ? styles.open : undefined} data-engagement={r.engagementId}>
                  <td>
                    <button
                      type="button"
                      className={styles.rowButton}
                      aria-expanded={isOpen}
                      aria-controls={`tasks-${r.engagementId}`}
                      onClick={() => setOpen(isOpen ? null : r.engagementId)}
                    >
                      {isOpen ? "▾" : "▸"} {r.client}
                    </button>
                    <div className={styles.explain}>{r.type}</div>
                  </td>
                  <td className={styles.num} data-label="Fee">
                    <Num synthetic={r.synthetic}>{euro(r.fee)}</Num>
                  </td>
                  <td className={styles.num} data-label="Budget vs actual">
                    <Num
                      synthetic={r.synthetic}
                      detail={`${hours(r.budgetHours)} budgeted, ${hours(r.actualHours)} logged: ${
                        over ? `${hours(r.varianceHours)} over` : `${hours(-r.varianceHours)} left`
                      }.`}
                    >
                      {hours(r.budgetHours)} / {hours(r.actualHours)}
                    </Num>
                    <div className={styles.bar} aria-hidden>
                      <div className={`${styles.barFill} ${over ? styles.barOver : ""}`} style={{ width: `${used * 100}%` }} />
                    </div>
                  </td>
                  <td className={styles.num} data-label="Effective rate">
                    <Num
                      synthetic={r.synthetic}
                      detail={
                        r.effectiveRate === null
                          ? "No hours logged yet."
                          : `${euro(r.fee)} fee ÷ ${hours(r.actualHours)} logged. Budgeted rate was ${euro(r.budgetRate)}/h.`
                      }
                    >
                      {r.effectiveRate === null ? "n/a" : `${euro(r.effectiveRate)}/h`}
                    </Num>
                  </td>
                  <td className={`${styles.num} ${r.moneyLost > 0 ? styles.loss : ""}`} data-label="Money lost">
                    <Num
                      synthetic={r.synthetic}
                      detail={
                        r.moneyLost > 0
                          ? `${hours(r.varianceHours)} over budget × ${euro(r.budgetRate)}/h budgeted rate.`
                          : "On or under budget, so nothing lost yet."
                      }
                    >
                      {euro(r.moneyLost)}
                    </Num>
                  </td>
                  <td data-label="Top AI-ready task">
                    {r.topTask ? (
                      <>
                        <span title={r.topTask.onetTask}>{short(r.topTask.onetTask, 60)}</span>{" "}
                        <Num synthetic>{hours(r.topTask.aiReadyHours)}</Num>
                      </>
                    ) : (
                      <span className={styles.explain}>None scored</span>
                    )}
                  </td>
                </tr>
                {isOpen ? (
                  <tr className={styles.detail} id={`tasks-${r.engagementId}`}>
                    <td colSpan={6}>
                      <h3>Task breakdown: {r.client}</h3>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>O*NET task</th>
                            <th className={styles.num}>Hours</th>
                            <th className={styles.num}>AI usage share</th>
                            <th className={styles.num}>AI-ready hours</th>
                            <th className={styles.num}>Hours back</th>
                            <th className={styles.num}>Euros back</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.tasks.map((t) => (
                            <tr key={t.onetTask}>
                              <td title={t.onetTask}>{short(t.onetTask)}</td>
                              <td className={styles.num} data-label="Hours">
                                <Num synthetic>{hours(t.hours)}</Num>
                              </td>
                              <td className={styles.num} data-label="AI usage share">
                                {t.penetration === null ? (
                                  <span className={styles.explain}>no score</span>
                                ) : (
                                  <Num source={t.source}>{t.penetration.toFixed(2)}</Num>
                                )}
                              </td>
                              <td className={styles.num} data-label="AI-ready hours">
                                <Num synthetic>{hours(t.aiReadyHours)}</Num>
                              </td>
                              <td className={styles.num} data-label="Hours back">
                                <Num synthetic>{hours(t.hoursBack)}</Num>
                              </td>
                              <td className={styles.num} data-label="Euros back">
                                <Num synthetic>{euro(t.eurosBack)}</Num>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {r.recommended ? (
                        <div className={styles.rec}>
                          <strong>Recommended for the team:</strong> {r.recommended.title} ({r.recommended.kind}).{" "}
                          {r.recommended.plainSummary} It covers <Num synthetic>{hours(r.recommended.aiReadyHours)}</Num> of
                          AI-ready work on this job.
                        </div>
                      ) : (
                        <div className={styles.rec}>No catalogue item covers this job&apos;s AI-ready tasks yet.</div>
                      )}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
