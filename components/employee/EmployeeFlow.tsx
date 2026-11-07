"use client";
// Aoife's page: ask a question, answer Athena's questions, get one thing to hand to AI.
// Questions come from POST /api/athena and the written answer from POST /api/ask.
// The engine's recommendation for each possible client answer arrives as props from the server.
import { useEffect, useState, type FormEvent } from "react";
import type { AskResponse, AthenaAnswer, AthenaResponse } from "@/contract/api";
import type { AthenaQuestion, LiteracyLogEntry, MeterReading, Recommendation, Staff } from "@/contract/types";
import { recordAdopted } from "@/engine/literacy";
import { ALL_CLIENTS, type Choices } from "./choices";
import { SourceLink, SyntheticBadge } from "./Tags";
import styles from "./employee.module.css";

export interface EmployeeFlowProps {
  staff: Staff;
  choices: Choices;
  /** Share of AI-ready hours we assume come back. Shown as an assumption. */
  hoursBackFactor: number;
}

type Step = "ask" | "thinking" | "questions" | "answer";

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

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return (await res.json()) as T;
}

/** Adds "All my clients" to a question whose options are the person's client names. */
function withAllClients(q: AthenaQuestion, clients: string[]): AthenaQuestion {
  const isClientQuestion = q.options.some((o) => clients.includes(o));
  if (!isClientQuestion || q.options.includes(ALL_CLIENTS)) return q;
  return { ...q, options: [...q.options, ALL_CLIENTS] };
}

function addReadings(a: MeterReading | null, b: MeterReading | null): { tokens: number; euros: number | null } {
  const readings = [a, b].filter((r): r is MeterReading => r !== null);
  const tokens = readings.reduce((s, r) => s + r.tokensIn + r.tokensOut, 0);
  const euros = readings.length > 0 && readings.every((r) => r.euros !== null) ? readings.reduce((s, r) => s + (r.euros ?? 0), 0) : null;
  return { tokens, euros };
}

export function EmployeeFlow({ staff, choices, hoursBackFactor }: EmployeeFlowProps) {
  const clients = Object.keys(choices).filter((c) => c !== ALL_CLIENTS);
  const [step, setStep] = useState<Step>("ask");
  const [request, setRequest] = useState("");
  const [questions, setQuestions] = useState<AthenaQuestion[]>([]);
  const [answers, setAnswers] = useState<AthenaAnswer[]>([]);
  const [written, setWritten] = useState<AskResponse | null>(null);
  const [athenaMeter, setAthenaMeter] = useState<MeterReading | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const [log, setLog] = useState<readonly LiteracyLogEntry[]>([]);
  // The countdown depends on today's date, so it is worked out in the browser after load.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayIso()), []);

  const chosenClient = answers.map((a) => a.answer).find((a) => clients.includes(a));
  const recommendation = (chosenClient && choices[chosenClient]) || choices[ALL_CLIENTS];

  async function finish(withAnswers: AthenaAnswer[]) {
    setAnswers(withAnswers);
    setStep("thinking");
    try {
      setWritten(
        await postJson<AskResponse>("/api/ask", { question: request, view: "employee", staffId: staff.id, athenaAnswers: withAnswers }),
      );
    } catch {
      setWritten(null);
      setProblem("The written answer is not available right now. The numbers below come straight from the engine.");
    }
    setStep("answer");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (request.trim() === "") return;
    setProblem(null);
    setWritten(null);
    setAnswers([]);
    setCopied("idle");
    setStep("thinking");
    try {
      const athena = await postJson<AthenaResponse>("/api/athena", { staffId: staff.id, request });
      setAthenaMeter(athena.meter);
      const qs = athena.result.needed ? athena.result.questions.map((q) => withAllClients(q, clients)) : [];
      setQuestions(qs);
      if (qs.length > 0) setStep("questions");
      else await finish([]);
    } catch {
      setProblem("Athena is not available right now, so here is the best match for all your work.");
      setQuestions([]);
      await finish([]);
    }
  }

  function choose(option: string) {
    const q = questions[answers.length];
    const next = [...answers, { question: q.question, answer: option }];
    if (next.length >= questions.length) void finish(next);
    else setAnswers(next);
  }

  async function copySkill() {
    if (!recommendation) return;
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
    if (!recommendation) return;
    setLog((l) => recordAdopted(l, staff.id, recommendation.item.id, todayIso()));
  }

  const current = step === "questions" ? questions[answers.length] : undefined;
  const adopted = recommendation ? log.some((e) => e.adopted && e.itemId === recommendation.item.id) : false;
  const meter = addReadings(athenaMeter, written?.meter ?? null);

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
        <button className={styles.primary} type="submit" disabled={request.trim() === "" || step === "thinking"}>
          Ask
        </button>
      </form>

      {step === "thinking" && (
        <p className={styles.muted} aria-live="polite">
          Thinking…
        </p>
      )}

      {problem && (
        <p className={styles.small} role="status">
          {problem}
        </p>
      )}

      {current && (
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

      {step === "answer" && !recommendation && (
        <section className={styles.card} aria-live="polite">
          <h2>Nothing to hand over yet</h2>
          <p>{written?.answer ?? "None of your logged work matches a skill in the catalogue yet."}</p>
        </section>
      )}

      {step === "answer" && recommendation && (
        <AnswerCard
          recommendation={recommendation}
          written={written}
          answers={answers}
          today={today}
          hoursBackFactor={hoursBackFactor}
          copied={copied}
          adopted={adopted}
          onCopy={copySkill}
          onTry={tryIt}
        />
      )}

      <footer className={styles.meter} aria-label="AI use for this task">
        <span>AI used for this task:</span> <span>{meter.tokens.toLocaleString("en-IE")} tokens</span>
        {" · "}
        <span>{meter.euros === null ? "cost not set yet" : euro.format(meter.euros)}</span>
      </footer>
    </main>
  );
}

interface AnswerCardProps {
  recommendation: Recommendation;
  written: AskResponse | null;
  answers: AthenaAnswer[];
  today: string | null;
  hoursBackFactor: number;
  copied: "idle" | "done" | "failed";
  adopted: boolean;
  onCopy: () => void;
  onTry: () => void;
}

function AnswerCard({ recommendation, written, answers, today, hoursBackFactor, copied, adopted, onCopy, onTry }: AnswerCardProps) {
  const { item, deadline } = recommendation;
  const days = today === null ? null : daysUntil(deadline.date, today);
  const dateText = longDate.format(new Date(`${deadline.date}T00:00:00Z`));

  return (
    <section className={styles.card} aria-live="polite">
      {answers.length > 0 && <p className={styles.muted}>You said: {answers.map((a) => a.answer).join(", ")}</p>}
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
            {days === null ? dateText : countdown(days)} <SourceLink href={deadline.source} />
          </dd>
          <dd className={styles.small}>
            {dateText}
            {!deadline.checked && " · date not yet confirmed"}
          </dd>
        </div>
      </dl>

      <p>{written?.answer ?? recommendation.reason}</p>
      <p className={styles.small}>
        The time is an estimate: it assumes about {Math.round(hoursBackFactor * 100)}% of the {recommendation.aiReadyHours} hours
        AI could help with come back to you.
      </p>

      {item.verifyStep && (
        <p className={styles.verify}>
          <strong>Before you use the result:</strong> {item.verifyStep}
        </p>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onCopy}>
          {copied === "done" ? "Copied" : "Copy skill"}
        </button>
        <button type="button" className={styles.secondary} onClick={onTry} disabled={adopted}>
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
  );
}
