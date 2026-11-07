// Grading rules for the logic prompt bank. Pure functions, no I/O, so the unit tests can feed
// hand-made responses. Each rule returns { rule, pass, detail }, or null when it does not apply.
//
// A "run" is what the runner saw for one prompt:
//   athena: the /api/athena response body (outcome, result.questions, ...)
//   ask:    the /api/ask response body, or null when /api/ask was not called
//   error:  a string when a call failed

/** Words in a skill's id or title that fit each task type. */
export const TASK_SKILL_KEYWORDS = {
  vat: ["vat", "transaction-classification", "bank-reconciliation", "deadline-reminder", "check-the-output"],
  ct1: ["ct1"],
  payroll: ["payroll"],
  "bank-rec": ["reconciliation"],
  classification: ["classification"],
  "client-email": ["client-query", "no-pps"],
  "meeting-summary": ["meeting-summary", "transcript"],
  "meeting-notes": ["meeting-notes", "meeting-summary"],
  inbox: ["inbox"],
  commitments: ["commitment"],
  "status-report": ["status-report"],
  "working-paper": ["working-paper"],
  automation: ["opportunity"],
  messaging: ["messaging"],
  invoicing: ["invoice"],
};

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const MONTH_RE = `(${MONTHS.join("|")})`;

const COUNTDOWN_TEXT = /\b\d+\s+days?\s+(to go|away|left)\b|\bdue today\b/i;
const DEADLINE_PHRASE = /\bbefore (the|your) deadline\b/i;

const result = (rule, pass, detail = "") => ({ rule, pass, detail });

/** The date the person named in a prompt, as far as plain text allows. Null when nothing is recognised. */
export function namedDateIn(prompt) {
  const t = prompt.toLowerCase();
  const dm = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s+${MONTH_RE}\\b`));
  if (dm) return { kind: "dayMonth", day: Number(dm[1]), month: MONTHS.indexOf(dm[2]) };
  const md = t.match(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
  if (md) return { kind: "dayMonth", day: Number(md[2]), month: MONTHS.indexOf(md[1]) };
  const wd = WEEKDAYS.find((w) => new RegExp(`\\b${w}\\b`).test(t));
  if (wd) return { kind: "weekday", weekday: WEEKDAYS.indexOf(wd) };
  if (/\btomorrow\b/.test(t)) return { kind: "offset", days: 1 };
  if (/\b(today|tonight)\b/.test(t)) return { kind: "offset", days: 0 };
  return null;
}

/** The deadline the employee page would count down to, or null. */
export function shownDeadline(ask) {
  return ask?.card?.deadline ?? null;
}

/** True when the page shows a countdown: a card deadline, or countdown text in a no-match line. */
export function showsCountdown(ask) {
  if (shownDeadline(ask)) return true;
  return ask?.outcome?.kind === "no_match" && COUNTDOWN_TEXT.test(ask.answer ?? "");
}

/** Rule 1: decline when expected, and only then. */
export function gradeOutcome(expected, run) {
  const declined = run.athena?.outcome?.kind === "decline";
  if (expected.outcome === "decline") {
    return result("decline-when-expected", declined, declined ? "" : `expected a decline, got ${run.athena?.outcome?.kind ?? "no outcome"}`);
  }
  if (declined) return result("answer-when-expected", false, `expected an answer, got a decline: "${run.athena.outcome.message ?? ""}"`);
  const answered = typeof run.ask?.answer === "string" && run.ask.answer.trim() !== "";
  return result("answer-when-expected", answered, answered ? "" : "no written answer from /api/ask");
}

/** Rule 2: a decline carries no numbers: no digits or euro sign, no questions, no skill, no /api/ask call. */
export function gradeNoNumbersOnDecline(run) {
  if (run.athena?.outcome?.kind !== "decline") return null;
  const problems = [];
  const message = run.athena.outcome.message ?? "";
  if (/[\d€]/.test(message)) problems.push(`decline line has a number: "${message}"`);
  if ((run.athena.result?.questions ?? []).length > 0) problems.push("decline also asked questions");
  if (run.ask) problems.push("/api/ask was called after a decline");
  if (run.ask?.card) problems.push("decline shows a skill card");
  return result("no-numbers-on-decline", problems.length === 0, problems.join("; "));
}

/** Rule 3: Athena asks clarifying questions when expected (vague prompts such as "help"). */
export function gradeClarify(expected, run) {
  if (expected.clarify === undefined) return null;
  const asked = Boolean(run.athena?.result?.needed) && (run.athena?.result?.questions ?? []).length > 0;
  return result("clarify-when-vague", asked === expected.clarify, asked === expected.clarify ? "" : `expected clarify=${expected.clarify}, got ${asked}`);
}

/** Rule 4: the countdown matches a named date, and no user date appears when none was named. */
export function gradeNamedDate(prompt, expected, run) {
  if (expected.namedDate === undefined || expected.outcome === "decline") return null;
  const deadline = shownDeadline(run.ask);
  if (expected.namedDate === false) {
    const bad = deadline?.source === "user";
    return result("countdown-matches-named-date", !bad, bad ? `no date was named, but the countdown is "${deadline.label}" (${deadline.dueDate})` : "");
  }
  if (!deadline) {
    const ok = showsCountdown(run.ask);
    return result("countdown-matches-named-date", ok, ok ? "" : "a date was named but no countdown shows");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline.dueDate ?? "")) return result("countdown-matches-named-date", false, `bad dueDate "${deadline.dueDate}"`);
  if (typeof deadline.daysLeft !== "number" || deadline.daysLeft < 0) {
    return result("countdown-matches-named-date", false, `daysLeft is ${deadline.daysLeft}`);
  }
  const due = new Date(`${deadline.dueDate}T00:00:00Z`);
  const named = namedDateIn(prompt);
  if (!named) return result("countdown-matches-named-date", true, "date in prompt not machine-readable; countdown present");
  if (named.kind === "dayMonth") {
    const ok = due.getUTCDate() === named.day && due.getUTCMonth() === named.month;
    return result("countdown-matches-named-date", ok, ok ? "" : `named ${named.day} ${MONTHS[named.month]}, countdown is to ${deadline.dueDate}`);
  }
  if (named.kind === "weekday") {
    const ok = due.getUTCDay() === named.weekday && deadline.daysLeft <= 6;
    return result("countdown-matches-named-date", ok, ok ? "" : `named ${WEEKDAYS[named.weekday]}, countdown is to ${deadline.dueDate} (${deadline.daysLeft} days)`);
  }
  const ok = deadline.daysLeft === named.days;
  return result("countdown-matches-named-date", ok, ok ? "" : `expected ${named.days} days left, got ${deadline.daysLeft}`);
}

/** True when a skill's id or title fits the task type. Unknown task types fit anything. */
export function skillFitsTask(item, taskType) {
  const keywords = TASK_SKILL_KEYWORDS[taskType];
  if (!keywords) return true;
  const hay = `${item?.id ?? ""} ${(item?.title ?? "").toLowerCase().replace(/\s+/g, "-")}`.toLowerCase();
  return keywords.some((k) => hay.includes(k));
}

/** Rule 5: the skill fits the task type; "none" means a plain no-matching-skill line. */
export function gradeSkill(expected, run) {
  if (expected.outcome === "decline") return null;
  if (expected.skill === undefined && !expected.taskType) return null;
  const item = run.ask?.card?.recommendation?.item ?? null;
  const noMatch = run.ask?.outcome?.kind === "no_match";
  if (expected.skill === "none") {
    const ok = noMatch && !item;
    return result("skill-fits-task", ok, ok ? "" : `expected no matching skill, got ${item ? item.id : run.ask?.outcome?.kind ?? "nothing"}`);
  }
  if (expected.skill === "match" && !item) {
    return result("skill-fits-task", false, `expected a skill, got ${noMatch ? "no matching skill" : "no card"}`);
  }
  if (!item) return result("skill-fits-task", noMatch, noMatch ? "plain no matching skill" : "no card and no no-match line");
  if (!expected.taskType) return result("skill-fits-task", true, item.id);
  const ok = skillFitsTask(item, expected.taskType);
  return result("skill-fits-task", ok, ok ? item.id : `${item.id} does not fit task type ${expected.taskType}`);
}

/** Rule 6: the prose never says "before the deadline" when no countdown shows. */
export function gradeDeadlinePhrase(run) {
  if (!run.ask || typeof run.ask.answer !== "string") return null;
  if (showsCountdown(run.ask)) return result("no-phantom-deadline", true);
  const bad = DEADLINE_PHRASE.test(run.ask.answer);
  return result("no-phantom-deadline", !bad, bad ? `answer mentions a deadline with no countdown: "${run.ask.answer}"` : "");
}

/** Rule 7: someone asking for the safest start gets a low-risk item with a check step. */
export function gradeLowRisk(expected, run) {
  if (!expected.lowRisk) return null;
  const item = run.ask?.card?.recommendation?.item;
  if (!item) return result("low-risk-when-asked", false, "no skill shown");
  const ok = item.risk === "low" && typeof item.verifyStep === "string" && item.verifyStep.trim() !== "";
  return result("low-risk-when-asked", ok, ok ? item.id : `${item.id} has risk ${item.risk}${item.verifyStep ? "" : " and no check step"}`);
}

/** Grades one prompt. A failed call fails the prompt outright. */
export function gradeCase(entry, run) {
  if (run.error) {
    const checks = [result("request-succeeded", false, run.error)];
    return { id: entry.id, pass: false, checks };
  }
  const { expected } = entry;
  const checks = [
    gradeOutcome(expected, run),
    gradeNoNumbersOnDecline(run),
    gradeClarify(expected, run),
    gradeNamedDate(entry.prompt, expected, run),
    gradeSkill(expected, run),
    gradeDeadlinePhrase(run),
    gradeLowRisk(expected, run),
  ].filter((c) => c !== null);
  return { id: entry.id, pass: checks.every((c) => c.pass), checks };
}
