// Crunch calendar strip: the next eight weeks side by side, with a tick for each day and a mark on
// each deadline. On narrow screens the strip scrolls inside its own box, never the whole page.
import type { CalendarWeek } from "./data";
import styles from "./partner.module.css";

const DAY = 86_400_000;
const short = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IE", { day: "numeric", month: "short", timeZone: "UTC" });
const days = (start: string) => Array.from({ length: 7 }, (_, i) => new Date(Date.parse(`${start}T00:00:00Z`) + i * DAY).toISOString().slice(0, 10));

export function CrunchCalendar({ weeks, today }: { weeks: CalendarWeek[]; today?: string }) {
  return (
    <div className={styles.strip} role="list" aria-label="Deadlines in the next eight weeks">
      {weeks.map((w) => {
        const dueDays = new Set(w.deadlines.map((d) => d.deadline.date));
        return (
          <div key={w.start} role="listitem" className={`${styles.week} ${w.deadlines.length > 0 ? styles.weekCrunch : ""}`}>
            <div className={styles.weekLabel}>Week of {short(w.start)}</div>
            <div className={styles.ticks} aria-hidden>
              {days(w.start).map((d) => (
                <span key={d} className={`${styles.tick} ${dueDays.has(d) ? styles.tickDue : ""} ${d === today ? styles.tickToday : ""}`} />
              ))}
            </div>
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
        );
      })}
    </div>
  );
}
