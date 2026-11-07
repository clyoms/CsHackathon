import styles from "./partner.module.css";

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

export const euro = (n: number) =>
  `€${n.toLocaleString("en-IE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
export const hours = (n: number) => `${n.toLocaleString("en-IE", { maximumFractionDigits: 1 })} h`;
