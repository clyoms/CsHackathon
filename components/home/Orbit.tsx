// Hero graphic: the three people circling the next deadline, each tagged with their live number.
import styles from "./home.module.css";

const PEOPLE = [
  { letter: "A", cx: 384, cy: 190, fill: "#7c3aed", tag: { x: 410, y: 168, w: 128 } },
  { letter: "P", cx: 170, cy: 86, fill: "#a21caf", tag: { x: 196, y: 40, w: 128 } },
  { letter: "H", cx: 200, cy: 318, fill: "#4338ca", tag: { x: 226, y: 296, w: 128 } },
];

export function Orbit({ numbers }: { numbers: (string | undefined)[] }) {
  return (
    <div className={styles.orbit}>
      <svg viewBox="0 0 560 380" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Aoife, the partner and the AI Lead circling the next filing deadline">
        <defs>
          <radialGradient id="orbit-core" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#f0abfc" />
            <stop offset="0.45" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className={styles.grid}>
          <path d="M0 76H560M0 152H560M0 228H560M0 304H560M112 0V380M224 0V380M336 0V380M448 0V380" />
        </g>
        <circle cx="280" cy="190" r="150" className={styles.ringDashed} />
        <circle cx="280" cy="190" r="104" className={styles.ring} />
        <circle cx="280" cy="190" r="58" className={styles.ringInner} />
        <circle cx="280" cy="190" r="72" fill="url(#orbit-core)" className={styles.core} />
        <text x="280" y="186" textAnchor="middle" className={styles.coreTop}>NEXT</text>
        <text x="280" y="206" textAnchor="middle" className={styles.coreBottom}>deadline</text>
        <g className={styles.spin}>
          {PEOPLE.map((p, i) => (
            <g key={p.letter}>
              <circle cx={p.cx} cy={p.cy} r="20" fill={p.fill} />
              <text x={p.cx} y={p.cy + 6} textAnchor="middle" className={styles.letter}>
                {p.letter}
              </text>
              {numbers[i] && (
                <g>
                  <rect x={p.tag.x} y={p.tag.y} width={p.tag.w} height="44" rx="12" className={styles.tag} />
                  <text x={p.tag.x + 16} y={p.tag.y + 28} className={styles.tagText}>
                    {numbers[i]}
                  </text>
                </g>
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
