// Two lines under a chart or table: what the numbers say, and the one thing to do about it.
export function Insight({ tells, next }: { tells: React.ReactNode; next: React.ReactNode }) {
  return (
    <div className="insight">
      <p>
        <span className="insight-label">What it tells you</span> {tells}
      </p>
      <p className="insight-next">
        <span className="insight-label">Next step</span> {next}
      </p>
    </div>
  );
}
