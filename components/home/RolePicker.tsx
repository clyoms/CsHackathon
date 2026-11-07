// "Who are you today?": three role cards, each one link with its live number.
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
  /** Colour family for the avatar and the number: violet, orchid or indigo. */
  tone: "violet" | "orchid" | "indigo";
}

function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" />
      <path d="M14 20h12M21 15l5 5-5 5" />
    </svg>
  );
}

export function RolePicker({ roles }: { roles: Role[] }) {
  return (
    <ol className={styles.roles}>
      {roles.map((r) => (
        <li key={r.href}>
          <Link href={r.href} className={`${styles.card} ${styles[r.tone]}`}>
            <span className={styles.head}>
              <span className={styles.avatar} aria-hidden="true">
                {r.monogram}
              </span>
              <span className={styles.who}>
                <span className={styles.name}>{r.name}</span>
                <span className={styles.role}>{r.role}</span>
              </span>
            </span>
            <span className={styles.promise}>{r.promise}</span>
            <span className={styles.foot}>
              {r.number ? (
                <span className={styles.figure}>
                  <span className={styles.value}>{r.number.value}</span>
                  <span className={styles.caption}>
                    {r.number.caption}{" "}
                    {r.number.synthetic && (
                      <span className={styles.badge} title="Made-up number for the demo, from synthetic Frame data">
                        synthetic
                      </span>
                    )}
                  </span>
                </span>
              ) : (
                <span className={styles.caption}>Open the view</span>
              )}
              <Arrow />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
