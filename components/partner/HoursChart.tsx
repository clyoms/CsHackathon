// Hours against budget for each engagement, drawn with plain SVG (no chart library).
// Each bar: the budget as a pale track, hours used inside budget in green, hours over budget in the
// accent. The text sits outside the SVG so it never stretches at narrow widths.
import type { PartnerRow } from "./data";
import { Num, euro, hours } from "./Num";
import styles from "./partner.module.css";

export function HoursChart({ rows }: { rows: PartnerRow[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.actualHours, r.budgetHours)));
  const pct = (h: number) => (h / max) * 100;

  return (
    <figure className={styles.chart} aria-label="Hours used against budget, by engagement">
      <ul className={styles.chartRows}>
        {rows.map((r) => {
          const inBudget = Math.min(r.actualHours, r.budgetHours);
          const over = Math.max(0, r.actualHours - r.budgetHours);
          const detail =
            over > 0
              ? `${hours(r.actualHours)} used of ${hours(r.budgetHours)} budgeted: ${hours(over)} over, ${euro(r.moneyLost)} of fee lost at ${euro(r.budgetRate)}/h.`
              : `${hours(r.actualHours)} used of ${hours(r.budgetHours)} budgeted: ${hours(r.budgetHours - r.actualHours)} left.`;
          return (
            <li key={r.engagementId} className={styles.chartRow}>
              <div className={styles.chartLabel}>
                <span className={styles.chartClient}>{r.client}</span>
                <Num detail={detail}>
                  {hours(r.actualHours)} / {hours(r.budgetHours)}
                </Num>
              </div>
              <svg className={styles.chartSvg} viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label={detail}>
                <title>{detail}</title>
                <rect className={styles.chartTrack} x="0" y="2" width={pct(r.budgetHours)} height="6" />
                <rect className={`${styles.chartGrow} ${styles.chartUsed}`} x="0" y="2" width={pct(inBudget)} height="6" />
                {over > 0 ? (
                  <rect
                    className={`${styles.chartGrow} ${styles.chartOver}`}
                    x={pct(r.budgetHours)}
                    y="2"
                    width={pct(over)}
                    height="6"
                  />
                ) : null}
                <line className={styles.chartBudget} x1={pct(r.budgetHours)} x2={pct(r.budgetHours)} y1="0" y2="10" />
              </svg>
            </li>
          );
        })}
      </ul>
      <figcaption className={styles.explain}>
        <span className={styles.keyUsed} aria-hidden /> hours inside budget <span className={styles.keyOver} aria-hidden /> hours over budget{" "}
        <span className={styles.keyBudget} aria-hidden /> budget line. All hours are Frame data.
      </figcaption>
    </figure>
  );
}
