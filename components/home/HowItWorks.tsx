// Hero panel: how the employee view works, in three steps.
import styles from "./home.module.css";

const STEPS = [
  { title: "Ask what's eating your week", detail: "One plain question about your work." },
  { title: "Answer two quick questions", detail: "Which client, and when it is due." },
  { title: "Get one skill and the hours back", detail: "Copy it into Claude and check the output." },
];

export function HowItWorks() {
  return (
    <section className={styles.steps} aria-labelledby="how-heading">
      <h2 id="how-heading" className={styles.stepsHeading}>
        <span aria-hidden="true" className={styles.liveDot} />
        How it works
      </h2>
      <ol className={styles.stepList}>
        {STEPS.map((s, i) => (
          <li key={s.title} className={styles.step}>
            <span className={`${styles.stepNum} ${i === 0 ? styles.stepNumFirst : ""} ${i === STEPS.length - 1 ? styles.stepNumLast : ""}`} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.stepText}>
              <span className={styles.stepTitle}>{s.title}</span>
              <span className={styles.stepDetail}>{s.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
