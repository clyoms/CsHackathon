// Plain SVG charts for the AI Lead page. No chart library. Each bar is focusable, and hovering or
// focusing it shows its detail line, so the numbers work with a mouse, a keyboard or a screen reader.
import type { Benchmark, TeamAdoption } from "./data";
import { pct } from "./Num";
import styles from "./ai-lead.module.css";

const ROW = 46;
const LABEL_W = 132;
const W = 560;
const BAR_W = W - LABEL_W - 64;

/** Share of AI output each team checked, one ledger line per team. */
export function CheckedChart({ teams }: { teams: TeamAdoption[] }) {
  const rows = teams.filter((t) => t.verifiedRate !== null);
  const h = rows.length * ROW + 28;
  return (
    <figure className={styles.figure}>
      <svg viewBox={`0 0 ${W} ${h}`} className={styles.chart} role="img" aria-label="Share of AI output checked, by team">
        {/* Half-way mark: below this, more output goes unchecked than checked. */}
        <line x1={LABEL_W + BAR_W / 2} x2={LABEL_W + BAR_W / 2} y1={4} y2={h - 22} className={styles.guide} />
        <text x={LABEL_W + BAR_W / 2} y={h - 6} className={styles.axis} textAnchor="middle">
          half checked
        </text>
        {rows.map((t, i) => {
          const rate = t.verifiedRate ?? 0;
          const y = i * ROW + 8;
          const low = rate < 0.5;
          return (
            <g key={t.team} className={styles.bar} tabIndex={0} aria-label={`${t.team}: ${pct(rate)} checked, ${t.activeUsers} of ${t.staff} people use AI, ${t.prompts} prompts`}>
              <title>{`${t.team}: ${pct(rate)} of AI output checked (usage records)`}</title>
              <line x1={0} x2={W} y1={y + ROW - 4} y2={y + ROW - 4} className={styles.rule} />
              <text x={0} y={y + 20} className={styles.label}>
                {t.team}
              </text>
              <rect x={LABEL_W} y={y + 6} width={BAR_W} height={16} className={styles.track} rx={2} />
              <rect x={LABEL_W} y={y + 6} width={Math.max(2, BAR_W * rate)} height={16} className={`${low ? styles.fillLow : styles.fill} ${styles.grow}`} rx={2} />
              <text x={LABEL_W + BAR_W + 8} y={y + 20} className={styles.value}>
                {pct(rate)}
              </text>
              <text x={LABEL_W} y={y + 38} className={styles.detail}>
                {t.activeUsers} of {t.staff} use AI · {t.prompts.toLocaleString("en-IE")} prompts
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className={styles.caption}>
        Accent bars sit below half checked. Hover or tab to a team for its detail.
      </figcaption>
    </figure>
  );
}

/** Frame's share of staff using AI against the real Irish and EU enterprise shares. */
export function BenchmarkChart({ frameShare, benchmarks }: { frameShare: number; benchmarks: Benchmark[] }) {
  const rows = [
    { label: "Frame staff using AI", percent: Math.round(frameShare * 100), source: null as string | null, frame: true, year: "now" },
    ...benchmarks.map((b) => ({ label: b.label, percent: b.percent, source: b.source, frame: false, year: String(b.year) })),
  ];
  const max = Math.max(...rows.map((r) => r.percent), 1);
  const h = rows.length * ROW + 8;
  return (
    <figure className={styles.figure}>
      <svg viewBox={`0 0 ${W} ${h}`} className={styles.chart} role="img" aria-label="Your firm against Ireland and the EU">
        {rows.map((r, i) => {
          const y = i * ROW + 8;
          const w = Math.max(2, (BAR_W * r.percent) / max);
          return (
            <g key={r.label} className={styles.bar} tabIndex={0} aria-label={`${r.label}, ${r.year}: ${r.percent}%`}>
              <title>{r.source ? `Source: ${r.source}` : "Your usage data"}</title>
              <line x1={0} x2={W} y1={y + ROW - 4} y2={y + ROW - 4} className={styles.rule} />
              <text x={0} y={y + 20} className={styles.label}>
                {r.label.length > 20 ? `${r.label.slice(0, 19)}…` : r.label}
              </text>
              <rect x={LABEL_W} y={y + 6} width={w} height={16} className={`${r.frame ? styles.fillLow : styles.fill} ${styles.grow}`} rx={2} />
              <text x={LABEL_W + w + 8} y={y + 20} className={styles.value}>
                {r.percent}%
              </text>
              <text x={LABEL_W} y={y + 38} className={styles.detail}>
                {r.frame
                  ? "Staff who used AI this period"
                  : // Short form so it fits a phone: the source name in brackets at the end of the label, and the year.
                    `${r.label.match(/\(([^)]+)\)\s*$/)?.[1] ?? r.label.slice(0, 20)} ${r.year} · hover for source`}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
