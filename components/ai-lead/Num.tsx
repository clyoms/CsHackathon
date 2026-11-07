import styles from "./ai-lead.module.css";

/** A number on the AI Lead page. A real number shows its source on hover. */
export function Num({ children, source }: { children: React.ReactNode; source?: string | null }) {
  return (
    <span>
      {source ? (
        <span className={styles.sourced} title={`Source: ${source}`}>
          {children}
        </span>
      ) : (
        children
      )}
    </span>
  );
}

export const pct = (share: number) => `${Math.round(share * 100)}%`;
export const int = (n: number) => Math.round(n).toLocaleString("en-IE");
