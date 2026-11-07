import styles from "./harry.module.css";

/** A synthetic number gets a "synthetic" badge. A real number shows its source on hover. */
export function Num({ children, synthetic, source }: { children: React.ReactNode; synthetic?: boolean; source?: string | null }) {
  return (
    <span>
      {source ? (
        <span className={styles.sourced} title={`Source: ${source}`}>
          {children}
        </span>
      ) : (
        children
      )}
      {synthetic ? <span className={styles.badge}>synthetic</span> : null}
    </span>
  );
}

export const pct = (share: number) => `${Math.round(share * 100)}%`;
export const int = (n: number) => Math.round(n).toLocaleString("en-IE");
