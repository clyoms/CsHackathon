// "Who are you today?": three role cards laid like lines in a ledger.
import Link from "next/link";
import type { RoleNumber } from "./numbers";
import styles from "./home.module.css";

export interface Role {
  href: string;
  monogram: string;
  name: string;
  role: string;
  promise: string;
  number: RoleNumber | null;
}

function Monogram({ letter }: { letter: string }) {
  return (
    <svg className={styles.face} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <text x="32" y="43" textAnchor="middle" fontSize="30" fontFamily="var(--font-head)" fontWeight="700" fill="currentColor">
        {letter}
      </text>
    </svg>
  );
}

export function RolePicker({ roles }: { roles: Role[] }) {
  return (
    <ol className={styles.ledger}>
      {roles.map((r, i) => (
        <li key={r.href}>
          <Link href={r.href} className={styles.card}>
            <span className={styles.folio} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <Monogram letter={r.monogram} />
            <span className={styles.who}>
              <span className={styles.name}>{r.name}</span>
              <span className={styles.role}>{r.role}</span>
              <span className={styles.promise}>{r.promise}</span>
            </span>
            {r.number && (
              <span className={styles.figure}>
                <span className={`${styles.value} total`}>{r.number.value}</span>
                <span className={styles.caption}>
                  {r.number.caption}{" "}
                  {r.number.synthetic && (
                    <span className={styles.badge} title="Made-up number for the demo, from synthetic Frame data">
                      synthetic
                    </span>
                  )}
                </span>
              </span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
