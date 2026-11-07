import type { Benchmark, CostPanel as Cost, TeamAdoption } from "./data";
import { Num, int, pct } from "./Num";
import styles from "./ai-lead.module.css";

export function Panel({ title, explain, children }: { title: string; explain: string; children: React.ReactNode }) {
  return (
    <section className={styles.panel} aria-label={title}>
      <h2>{title}</h2>
      <p className={styles.explain}>{explain}</p>
      {children}
    </section>
  );
}

export function AdoptionTable({ teams }: { teams: TeamAdoption[] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Team</th>
          <th className={styles.num}>Active users</th>
          <th className={styles.num}>Prompts</th>
          <th className={styles.num}>Checked</th>
        </tr>
      </thead>
      <tbody>
        {teams.map((t) => (
          <tr key={t.team}>
            <td data-label="Team">{t.team}</td>
            <td className={styles.num} data-label="Active users">
              <Num>
                {t.activeUsers} of {t.staff}
              </Num>
            </td>
            <td className={styles.num} data-label="Prompts">
              <Num>{int(t.prompts)}</Num>
            </td>
            <td className={styles.num} data-label="Checked">
              <Num>{t.verifiedRate === null ? "n/a" : pct(t.verifiedRate)}</Num>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function BenchmarkBars({ frameShare, benchmarks }: { frameShare: number; benchmarks: Benchmark[] }) {
  const max = Math.max(frameShare * 100, ...benchmarks.map((b) => b.percent), 1);
  return (
    <div>
      <div className={styles.barRow}>
        <span>Frame: staff who used AI this period</span>
        <span className={styles.num}>
          <Num>{pct(frameShare)}</Num>
        </span>
        <div className={styles.barTrack}>
          <div className={`${styles.barFill} ${styles.barFrame}`} style={{ width: `${(frameShare * 100 * 100) / max}%` }} />
        </div>
      </div>
      {benchmarks.map((b) => (
        <div className={styles.barRow} key={b.label}>
          <span>
            {b.label}, {b.year}
          </span>
          <span className={styles.num}>
            <Num source={b.source}>{b.percent}%</Num>
          </span>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${(b.percent * 100) / max}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CostStats({ cost }: { cost: Cost }) {
  return (
    <div className={styles.stats}>
      <div className={styles.stat}>
        <div className={styles.statValue}>
          <Num>{cost.tokensPerFinishedTask === null ? "n/a" : int(cost.tokensPerFinishedTask)}</Num>
        </div>
        <div className={styles.statLabel}>Tokens per finished task</div>
      </div>
      <div className={styles.stat}>
        <div className={styles.statValue}>
          {cost.eurosPerFinishedTask === null ? "Price not set" : <Num>{`€${cost.eurosPerFinishedTask.toFixed(3)}`}</Num>}
        </div>
        <div className={styles.statLabel}>Euros per finished task</div>
      </div>
      <div className={styles.stat}>
        <div className={styles.statValue}>
          <Num>{cost.topTenShare === null ? "n/a" : pct(cost.topTenShare)}</Num>
        </div>
        <div className={styles.statLabel}>Share of {cost.measuredIn} spent on the top 10% of tasks</div>
      </div>
    </div>
  );
}
