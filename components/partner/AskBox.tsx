"use client";

import { useState } from "react";
import { AskResponse, type ApiError } from "@/contract/api";
import { Num } from "./Num";
import styles from "./partner.module.css";

const QUESTION = "Which jobs are losing money, and why?";

export function AskBox() {
  const [question, setQuestion] = useState(QUESTION);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, view: "partner" }),
      });
      const body: unknown = await res.json();
      if (!res.ok) throw new Error((body as ApiError).error ?? `HTTP ${res.status}`);
      setResult(AskResponse.parse(body));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form className={styles.ask} onSubmit={ask}>
        <input id="partner-question" aria-label="Question" value={question} placeholder={QUESTION} onChange={(e) => setQuestion(e.target.value)} />
        <button type="submit" disabled={busy || question.trim() === ""}>
          {busy ? "Asking…" : "Ask"}
        </button>
      </form>
      {error ? <p className={styles.error}>{error}</p> : null}
      {result ? (
        <div className={styles.answer} aria-live="polite">
          <p style={{ margin: 0 }}>{result.answer}</p>
          <ul className={styles.numbers}>
            {result.numbers.map((n) => (
              <li key={n.label}>
                {n.label}:{" "}
                <Num synthetic={n.synthetic} source={n.synthetic ? null : n.source}>
                  {n.value} {n.unit}
                </Num>
              </li>
            ))}
          </ul>
          <div className={styles.meter}>
            Tokens: {result.meter.tokensIn} in, {result.meter.tokensOut} out
            {result.meter.euros === null ? "" : `, €${result.meter.euros.toFixed(4)}`}
            {result.fallback ? " · sample answer (no API key)" : ""}
          </div>
        </div>
      ) : null}
    </div>
  );
}
