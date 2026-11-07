"use client";
// Aoife's page: ask a question, answer Athena's questions, get one thing to hand to AI.
// Questions come from POST /api/athena and the written answer from POST /api/ask.
// The engine's recommendation for each possible client answer arrives as props from the server.
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AskResponse, AthenaAnswer, AthenaResponse } from "@/contract/api";
import type { AthenaQuestion, LiteracyLogEntry, MeterReading, Recommendation, Staff } from "@/contract/types";
import { recordAdopted } from "@/engine/literacy";
import type { AthenaOutcome, Usage } from "@/engine/contract";
import { ALL_CLIENTS, namesClient, type Choices } from "./choices";
import { UPLOAD_HINT, copyText, downloadSkill } from "./exportSkill";
import { PromptLibrary } from "./PromptLibrary";
import { SAMPLE_PROMPTS, fillQuestionBox, type SamplePrompt } from "./prompts";
import { SourceLink } from "./Tags";
import styles from "./employee.module.css";

export interface EmployeeFlowProps {
  staff: Staff;
  choices: Choices;
  /** Share of AI-ready hours we assume come back. No longer shown on the page. */
  hoursBackFactor?: number;
}

/** Fields the routes may add on top of the base response: the offline label and Athena's outcome. */
type Extra = Partial<Usage> & {
  outcome?: AthenaOutcome;
  /** From /api/ask: the item picked from Athena's answers and the deadline to count down to. */
  card?: { recommendation: Recommendation; deadline: CardDeadline | null };
};

/** Deadline from engine/contract.ts as the API sends it. */
interface CardDeadline {
  label: string;
  dueDate: string;
  daysLeft: number;
  source: "user" | "catalogue";
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
  const isClientQuestion = q.options.some((o) => clients.some((c) => namesClient(o, c)));
  if (!isClientQuestion || q.options.includes(ALL_CLIENTS)) return q;
  return { ...q, options: [...q.options, ALL_CLIENTS] };
}

function addReadings(a: MeterReading | null, b: MeterReading | null): { tokens: number; euros: number | null } {
  const readings = [a, b].filter((r): r is MeterReading => r !== null);
  const tokens = readings.reduce((s, r) => s + r.tokensIn + r.tokensOut, 0);
  const euros = readings.length > 0 && readings.every((r) => r.euros !== null) ? readings.reduce((s, r) => s + (r.euros ?? 0), 0) : null;
  return { tokens, euros };
}

export function EmployeeFlow({ staff, choices }: EmployeeFlowProps) {
  const clients = Object.keys(choices).filter((c) => c !== ALL_CLIENTS);
  const [step, setStep] = useState<Step>("ask");
  const [request, setRequest] = useState("");
  const askRef = useRef<HTMLInputElement>(null);
  const [questions, setQuestions] = useState<AthenaQuestion[]>([]);
  const [answers, setAnswers] = useState<AthenaAnswer[]>([]);
  const [written, setWritten] = useState<(AskResponse & Extra) | null>(null);
  const [athenaMeter, setAthenaMeter] = useState<MeterReading | null>(null);
  const [athenaOffline, setAthenaOffline] = useState(false);
  const [outcome, setOutcome] = useState<AthenaOutcome | null>(null);
  const [exported, setExported] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const [log, setLog] = useState<readonly LiteracyLogEntry[]>([]);
  // The countdown depends on today's date, so it is worked out in the browser after load.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayIso()), []);

  const chosenClient = clients.find((c) => answers.some((a) => namesClient(a.answer, c)));
  // The API's card follows Athena's answers (task, risk, named date). The page's own choice is
  // only a fallback for when the API gives none.
  const recommendation = written?.card?.recommendation ?? ((chosenClient && choices[chosenClient]) || choices[ALL_CLIENTS]);
  const cardDeadline = written?.card?.deadline ?? null;

  async function finish(withAnswers: AthenaAnswer[]) {
    setAnswers(withAnswers);
    setStep("thinking");
    try {
      const res = await postJson<AskResponse & Extra>("/api/ask", {
        question: request,
        view: "employee",
        staffId: staff.id,
        athenaAnswers: withAnswers,
      });
      setWritten(res);
      if (res.outcome && res.outcome.kind !== "skill" && res.outcome.kind !== "clarify") setOutcome(res.outcome);
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
    setExported(null);
    setOutcome(null);
    setAthenaOffline(false);
    setStep("thinking");
    try {
      const athena = await postJson<AthenaResponse & Extra>("/api/athena", { staffId: staff.id, request });
      setAthenaMeter(athena.meter);
      setAthenaOffline(athena.offline ?? athena.fallback);
      // Off-topic question: one line, no skill, no numbers.
      if (athena.outcome?.kind === "decline") {
        setOutcome(athena.outcome);
        setQuestions([]);
        setStep("answer");
        return;
      }
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
    setCopied((await copyText(recommendation.item.body)) ? "done" : "failed");
  }

  function exportSkill() {
    if (!recommendation) return;
    setExported(downloadSkill(recommendation.item));
  }

  function pickPrompt(prompt: SamplePrompt) {
    fillQuestionBox(prompt, { setText: setRequest, focus: () => askRef.current?.focus() });
  }

  function tryIt() {
    if (!recommendation) return;
    setLog((l) => recordAdopted(l, staff.id, recommendation.item.id, todayIso()));
  }

  const current = step === "questions" ? questions[answers.length] : undefined;
  const adopted = recommendation ? log.some((e) => e.adopted && e.itemId === recommendation.item.id) : false;
  const meter = addReadings(athenaMeter, written?.meter ?? null);
  const offline = step === "answer" && (athenaOffline || (written ? (written.offline ?? written.fallback) : false));

  return (
    <main className={styles.page}>
      <p className={styles.back}>
        <Link href="/">← Who are you today?</Link>
      </p>
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
          ref={askRef}
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

      {step === "ask" && <PromptLibrary prompts={SAMPLE_PROMPTS} onPick={pickPrompt} />}

      <p className={styles.literacyLink}>
        <Link href="/literacy">Learn the 4D basics</Link>
      </p>

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

      {step === "answer" && outcome?.kind === "decline" && (
        <p className={styles.card} aria-live="polite">
          {outcome.message ?? "Frame Next helps with work tasks."}
        </p>
      )}

      {step === "answer" && outcome?.kind === "no_match" && (
        <p className={styles.card} aria-live="polite">
          {outcome.message ?? "There is no matching skill for that task yet."}
        </p>
      )}

      {step === "answer" && !outcome && !recommendation && (
        <p className={styles.card} aria-live="polite">
          There is no matching skill for your logged work yet.
        </p>
      )}

      {step === "answer" && !outcome && recommendation && (
        <AnswerCard
          recommendation={recommendation}
          cardDeadline={cardDeadline}
          written={written}
          today={today}
          copied={copied}
          exported={exported}
          adopted={adopted}
          onCopy={copySkill}
          onExport={exportSkill}
          onTry={tryIt}
        />
      )}

      <footer className={styles.meter} aria-label="AI use for this task">
        {offline && (
          <span className={styles.badge} title="Claude was not reached, so this is a fixed answer. The server log says why.">
            offline answer
          </span>
        )}{" "}
        <span>AI used for this task:</span> <span>{meter.tokens.toLocaleString("en-IE")} tokens</span>
        {" · "}
        <span>{meter.euros === null ? "Cost: not priced yet" : `Cost: ${euro.format(meter.euros)}`}</span>
      </footer>
    </main>
  );
}

interface AnswerCardProps {
  recommendation: Recommendation;
  cardDeadline: CardDeadline | null;
  written: AskResponse | null;
  today: string | null;
  copied: "idle" | "done" | "failed";
  exported: string | null;
  adopted: boolean;
  onCopy: () => void;
  onExport: () => void;
  onTry: () => void;
}

function AnswerCard({ recommendation, cardDeadline, written, today, copied, exported, adopted, onCopy, onExport, onTry }: AnswerCardProps) {
  const { item } = recommendation;
  // The countdown shows only when the question points at a date (the API sends none otherwise).
  // A date the person named has no source page. A catalogue date keeps its source link.
  const deadline = cardDeadline
    ? { label: cardDeadline.label, date: cardDeadline.dueDate, source: undefined as string | undefined, checked: true }
    : null;
  if (deadline && cardDeadline?.source === "catalogue" && cardDeadline.dueDate === recommendation.deadline.date) {
    deadline.source = recommendation.deadline.source;
    deadline.checked = recommendation.deadline.checked;
  }
  const days = deadline && today !== null ? daysUntil(deadline.date, today) : null;
  const dateText = deadline ? longDate.format(new Date(`${deadline.date}T00:00:00Z`)) : "";

  return (
    <section className={styles.card} aria-live="polite">
      <p className={styles.step}>Try this {item.kind}</p>
      <h2>{item.title}</h2>
      <p className={styles.summary}>{item.plainSummary}</p>

      <dl className={styles.figures}>
        {recommendation.hoursBackEstimate > 0 ? (
          <>
            <div>
              <dt>Time back</dt>
              <dd>
                About {recommendation.hoursBackEstimate} hours
              </dd>
            </div>
            <div>
              <dt>Worth</dt>
              <dd>
                {euro.format(recommendation.eurosBack)}
              </dd>
            </div>
          </>
        ) : (
          // No logged hours on the tasks this item covers, or those tasks score 0 in the Economic Index:
          // say so instead of showing "0 hours · €0".
          <div>
            <dt>Time back</dt>
            <dd className={styles.small}>
              Not estimated: none of your logged hours are on work that AI is measured to help with for this {item.kind}.
            </dd>
          </div>
        )}
        {deadline && (
          <div>
            <dt>{deadline.label}</dt>
            <dd>
              {days === null ? dateText : countdown(days)} {deadline.source && <SourceLink href={deadline.source} />}
            </dd>
            <dd className={styles.small}>
              {dateText}
              {!deadline.checked && " · date not yet confirmed"}
            </dd>
          </div>
        )}
      </dl>

      {written && !written.fallback && <p>{written.answer}</p>}
      <p className={styles.verify}>Check what AI gives you before you rely on it: you delegate the work, you do not hand it off.</p>

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onCopy}>
          {copied === "done" ? "Copied" : "Copy skill"}
        </button>
        <button type="button" className={styles.secondary} onClick={onExport}>
          Export skill
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
      {exported && (
        <p className={styles.small} role="status">
          Saved {exported}. {UPLOAD_HINT}
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
