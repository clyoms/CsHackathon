// Sample prompts shown under the question box. Each button fills the box; the person still presses Ask.
import type { SamplePrompt } from "./prompts";
import styles from "./employee.module.css";

export interface PromptLibraryProps {
  prompts: readonly SamplePrompt[];
  onPick: (prompt: SamplePrompt) => void;
}

export function PromptLibrary({ prompts, onPick }: PromptLibraryProps) {
  return (
    <section className={styles.prompts} aria-labelledby="prompt-library-heading">
      <h2 id="prompt-library-heading" className={styles.promptsHeading}>
        Not sure what to ask? Try one of these
      </h2>
      <ul className={styles.promptList}>
        {prompts.map((p) => (
          <li key={p.label} className={styles.promptItem}>
            <span className={styles.promptLabel}>{p.label}</span>
            <span className={styles.promptText}>{p.text}</span>
            <button
              type="button"
              className={styles.secondary}
              aria-label={`Try this prompt: ${p.label}`}
              onClick={() => onPick(p)}
            >
              Try this prompt
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
