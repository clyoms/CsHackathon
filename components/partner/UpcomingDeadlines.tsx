// Upcoming deadlines: one plain row per filing date in the next eight weeks, soonest first,
// with the days left and the clients due on it.
import type { CalendarWeek } from "./data";
import styles from "./partner.module.css";

const DAY = 86_400_000;
const short = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IE", { day: "numeric", month: "short", timeZone: "UTC" });

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
}

export function UpcomingDeadlines({ weeks, today }: { weeks: CalendarWeek[]; today: string }) {
  const items = weeks.flatMap((w) => w.deadlines);
  if (items.length === 0) return <p className={styles.explain}>No filing deadlines in the next eight weeks.</p>;
  return (
    <ol className={styles.deadlines}>
      {items.map(({ deadline, clients }) => {
        const left = daysBetween(today, deadline.date);
        return (
          <li key={deadline.id} className={`${styles.deadline} ${left <= 14 ? styles.deadlineSoon : ""}`}>
            <a className={styles.deadlineDate} href={deadline.source} target="_blank" rel="noreferrer" title={`Source: ${deadline.source}`}>
              {short(deadline.date)}
            </a>
            <span className={styles.deadlineWhat}>
              <span>{deadline.label}</span>
              <span className={styles.deadlineClients}>{clients.length > 0 ? clients.join(", ") : "No clients due"}</span>
            </span>
            <span className={styles.deadlineLeft}>
              {left <= 0 ? "Today" : `${left} day${left === 1 ? "" : "s"}`}
              {!deadline.checked && <span className={styles.deadlineUnconfirmed} title="Worked out from a rule, not read as a date on the official page">unconfirmed</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
