import styles from "./employee.module.css";

/** Shown beside every real number. Hover shows where it came from; click opens it. */
export function SourceLink({ href }: { href: string }) {
  return (
    <a className={styles.source} href={href} title={href} target="_blank" rel="noreferrer">
      source
    </a>
  );
}
