import type { CalendarWeek } from "./data";
import styles from "./partner.module.css";

const short = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IE", { day: "numeric", month: "short", timeZone: "UTC" });

export function CrunchCalendar({ weeks }: { weeks: CalendarWeek[] }) {
  return (
    <div className={styles.calendar}>
      {weeks.map((w) => (
        <div key={w.start} className={`${styles.week} ${w.deadlines.length > 0 ? styles.weekCrunch : ""}`}>
          <div className={styles.weekLabel}>Week of {short(w.start)}</div>
          {w.deadlines.length === 0 ? <span className={styles.explain}>No deadlines</span> : null}
          {w.deadlines.map(({ deadline, clients }) => (
            <div key={deadline.id} className={styles.due}>
              <a href={deadline.source} target="_blank" rel="noreferrer" title={`Source: ${deadline.source}`}>
                {short(deadline.date)}
              </a>{" "}
              {deadline.label}
              {deadline.checked ? null : (
                <span className={`${styles.badge} ${styles.badgeUnchecked}`} title="Worked out from a rule, not read as a date on the official page">
                  unconfirmed
                </span>
              )}
              {clients.length > 0 ? <div className={styles.explain}>{clients.join(", ")}</div> : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
