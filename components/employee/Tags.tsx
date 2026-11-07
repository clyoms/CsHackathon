import styles from "./employee.module.css";

/** Shown beside every made-up number. */
export function SyntheticBadge() {
  return (
    <span className={styles.badge} title="Made-up number for the demo, from synthetic Frame data">
      synthetic
    </span>
  );
}

/** Shown beside every real number. Hover shows where it came from; click opens it. */
export function SourceLink({ href }: { href: string }) {
  return (
    <a className={styles.source} href={href} title={href} target="_blank" rel="noreferrer">
      source
    </a>
  );
}
