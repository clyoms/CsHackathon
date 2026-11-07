"use client";
// Aoife's page: ask a question, answer Athena's questions, get one thing to hand to AI.
// Data comes in as props so the page can switch from fixtures to the real API later.
import { useEffect, useState, type FormEvent } from "react";
import type { AthenaResult, LiteracyLogEntry, MeterReading, Recommendation, Staff } from "@/contract/types";
import { recordAdopted } from "@/engine/literacy";
import { SourceLink, SyntheticBadge } from "./Tags";
import styles from "./employee.module.css";

export interface EmployeeFlowProps {
  staff: Staff;
  athena: AthenaResult;
  recommendation: Recommendation;
  meter: MeterReading;
  /** Share of AI-ready hours we assume come back. Shown as an assumption. */
  hoursBackFactor: number;
}

type Step = "ask" | "questions" | "answer";

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const longDate = new Intl.DateTimeFormat("en-IE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysUntil(date: string, from: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function countdown(days: number): string {
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} ago`;
  if (days === 0) return "today";
  return `${days} day${days === 1 ? "" : "s"} to go`;
}

export function EmployeeFlow({ staff, athena, recommendation, meter, hoursBackFactor }: EmployeeFlowProps) {
  const [step, setStep] = useState<Step>("ask");
  const [request, setRequest] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const [log, setLog] = useState<readonly LiteracyLogEntry[]>([]);
  // The countdown depends on today's date, so it is worked out in the browser after load.
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    setDays(daysUntil(recommendation.deadline.date, todayIso()));
  }, [recommendation.deadline.date]);

  const questions = athena.needed ? athena.questions : [];
  const current = questions[answers.length];

  function submit(e: FormEvent) {
    e.preventDefault();
    if (request.trim() === "") return;
    setAnswers([]);
    setStep(questions.length > 0 ? "questions" : "answer");
  }

  function choose(option: string) {
    const next = [...answers, option];
    setAnswers(next);
    if (next.length >= questions.length) setStep("answer");
  }

  async function copySkill() {
    const text = recommendation.item.body;
    try {
      await navigator.clipboard.writeText(text);
      setCopied("done");
      return;
    } catch {
      // Some browsers block the clipboard API. Fall back to a hidden text box and the copy command.
    }
    const box = document.createElement("textarea");
    box.value = text;
    box.setAttribute("readonly", "");
    box.style.position = "fixed";
    box.style.opacity = "0";
    document.body.appendChild(box);
    box.select();
    const ok = document.execCommand("copy");
    box.remove();
    setCopied(ok ? "done" : "failed");
  }

  function tryIt() {
    setLog((l) => recordAdopted(l, staff.id, recommendation.item.id, todayIso()));
  }

  const adopted = log.some((e) => e.adopted && e.itemId === recommendation.item.id);
  const { item, deadline } = recommendation;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.hello}>Hi {staff.name}</p>
        <h1>What should you hand to AI this week?</h1>
      </header>

      <form className={styles.ask} onSubmit={submit}>
        <label htmlFor="ask" className={styles.srOnly}>
          Your question
        </label>
        <input
          id="ask"
          className={styles.input}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder="What should I hand to AI before my next deadline?"
          autoComplete="off"
        />
        <button className={styles.primary} type="submit" disabled={request.trim() === ""}>
          Ask
        </button>
      </form>

      {step === "questions" && current && (
        <section className={styles.card} aria-live="polite">
          <p className={styles.step}>
            Quick question {answers.length + 1} of {questions.length}
          </p>
          <h2>{current.question}</h2>
          <p className={styles.muted}>{current.why}</p>
          <div className={styles.options}>
            {current.options.map((o) => (
              <button key={o} type="button" className={styles.option} onClick={() => choose(o)}>
                {o}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "answer" && (
        <section className={styles.card} aria-live="polite">
          {answers.length > 0 && (
            <p className={styles.muted}>
              You said: {answers.join(", ")}
            </p>
          )}
          <p className={styles.step}>Try this {item.kind}</p>
          <h2>{item.title}</h2>
          <p className={styles.summary}>{item.plainSummary}</p>

          <dl className={styles.figures}>
            <div>
              <dt>Time back</dt>
              <dd>
                About {recommendation.hoursBackEstimate} hours {recommendation.synthetic && <SyntheticBadge />}
              </dd>
            </div>
            <div>
              <dt>Worth</dt>
              <dd>
                {euro.format(recommendation.eurosBack)} {recommendation.synthetic && <SyntheticBadge />}
              </dd>
            </div>
            <div>
              <dt>{deadline.label}</dt>
              <dd>
                {days === null ? longDate.format(new Date(`${deadline.date}T00:00:00Z`)) : countdown(days)}{" "}
                <SourceLink href={deadline.source} />
              </dd>
              <dd className={styles.small}>
                {longDate.format(new Date(`${deadline.date}T00:00:00Z`))}
                {!deadline.checked && " · date not yet confirmed"}
              </dd>
            </div>
          </dl>

          <p>{recommendation.reason}</p>
          <p className={styles.small}>
            The time is an estimate: it assumes about {Math.round(hoursBackFactor * 100)}% of the{" "}
            {recommendation.aiReadyHours} hours AI could help with come back to you.
          </p>

          {item.verifyStep && (
            <p className={styles.verify}>
              <strong>Before you use the result:</strong> {item.verifyStep}
            </p>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={copySkill}>
              {copied === "done" ? "Copied" : "Copy skill"}
            </button>
            <button type="button" className={styles.secondary} onClick={tryIt} disabled={adopted}>
              {adopted ? "Noted, thanks" : "I'll try it"}
            </button>
          </div>
          {copied === "failed" && (
            <p className={styles.small} role="alert">
              Your browser blocked copying. Open the skill below and copy it by hand.
            </p>
          )}
          {adopted && <p className={styles.small}>We'll ask how it went next week.</p>}

          <details className={styles.body}>
            <summary>See the skill</summary>
            <pre>{item.body}</pre>
          </details>
        </section>
      )}

      <footer className={styles.meter} aria-label="AI use for this task">
        <span>AI used for this task:</span>{" "}
        <span>
          {(meter.tokensIn + meter.tokensOut).toLocaleString("en-IE")} tokens
        </span>
        {" · "}
        <span>{meter.euros === null ? "cost not set yet" : euro.format(meter.euros)}</span>
      </footer>
    </main>
  );
}
