import styles from "./partner.module.css";

/**
 * A number on the partner page. A real number shows its source on hover. `detail` adds a hover and
 * focus note that says how the number was worked out.
 */
export function Num({
  children,
  source,
  detail,
}: {
  children: React.ReactNode;
  source?: string | null;
  detail?: string;
}) {
  const value = source ? (
    <span className={styles.sourced} title={`Source: ${source}`}>
      {children}
    </span>
  ) : (
    children
  );
  return (
    <span className={detail ? styles.hasDetail : undefined} tabIndex={detail ? 0 : undefined}>
      {value}
      {detail ? (
        <span className={styles.tip} role="tooltip">
          {detail}
        </span>
      ) : null}
    </span>
  );
}

export const euro = (n: number) =>
  `€${n.toLocaleString("en-IE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
export const hours = (n: number) => `${n.toLocaleString("en-IE", { maximumFractionDigits: 1 })} h`;
