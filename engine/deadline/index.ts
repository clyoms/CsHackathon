// Deadlines the user names ("by Friday", "before 18 November") and picking a catalogue deadline
// that fits the task named. Pure functions: today is always passed in as an ISO date (YYYY-MM-DD).
import type { Deadline } from "@/engine/contract";

/** A catalogue deadline, as in contract/types.ts. Only the fields used here. */
export interface CatalogueDeadline {
  label: string;
  date: string;
  source?: string;
}

const DAY_MS = 86_400_000;
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

const utc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function daysBetween(from: string, to: string): number {
  return Math.round((utc(to) - utc(from)) / DAY_MS);
}

const monthIndex = (word: string) => MONTHS.findIndex((m) => m.startsWith(word.toLowerCase().slice(0, 3)));

/** Next date on or after today with this month and day. */
function nextMonthDay(today: string, month: number, day: number): string | null {
  const year = Number(today.slice(0, 4));
  for (const y of [year, year + 1]) {
    const d = new Date(Date.UTC(y, month, day));
    if (d.getUTCMonth() !== month) return null; // e.g. 31 February
    if (d.getTime() >= utc(today)) return iso(d.getTime());
  }
  return null;
}

/** Next date on or after today with this day of the month. */
function nextDayOfMonth(today: string, day: number): string | null {
  const t = new Date(utc(today));
  for (let i = 0; i < 13; i++) {
    const d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + i, day));
    if (d.getUTCDate() !== day) continue;
    if (d.getTime() >= utc(today)) return iso(d.getTime());
  }
  return null;
}

const MONTH_RE = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

/** Finds a date or weekday in the text. Returns null when none is named. */
export function parseNamedDeadline(text: string, today: string): Deadline | null {
  const t = text.toLowerCase();
  let date: string | null = null;
  let label = "";

  const isoMatch = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  const dayMonth = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s+${MONTH_RE}\\b`));
  const monthDay = t.match(new RegExp(`\\b${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
  const weekday = t.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  const ordinal = t.match(/\b(?:the\s+)?(\d{1,2})(st|nd|rd|th)\b/);

  if (isoMatch) {
    date = isoMatch[0];
  } else if (dayMonth) {
    date = nextMonthDay(today, monthIndex(dayMonth[2]), Number(dayMonth[1]));
  } else if (monthDay) {
    date = nextMonthDay(today, monthIndex(monthDay[1]), Number(monthDay[2]));
  } else if (weekday) {
    const target = WEEKDAYS.indexOf(weekday[1]);
    const now = new Date(utc(today)).getUTCDay();
    // "by Friday" on a Friday means today.
    date = iso(utc(today) + ((target - now + 7) % 7) * DAY_MS);
    label = `Your deadline, ${weekday[1][0].toUpperCase()}${weekday[1].slice(1)}`;
  } else if (/\btomorrow\b/.test(t)) {
    date = iso(utc(today) + DAY_MS);
    label = "Your deadline, tomorrow";
  } else if (/\btoday\b|\btonight\b/.test(t)) {
    date = today;
    label = "Your deadline, today";
  } else if (ordinal) {
    date = nextDayOfMonth(today, Number(ordinal[1]));
  }

  if (!date || Number.isNaN(utc(date))) return null;
  if (!label) {
    const d = new Date(utc(date));
    label = `Your deadline, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()][0].toUpperCase()}${MONTHS[d.getUTCMonth()].slice(1)}`;
  }
  return { label, dueDate: date, daysLeft: daysBetween(today, date), source: "user" };
}

/** Task topics a deadline label can match. The first topic found in the task text wins. */
const TOPICS: { name: string; task: RegExp; label: RegExp }[] = [
  { name: "vat", task: /\bvat\b/i, label: /\bvat\b/i },
  { name: "corporation tax", task: /\bct1\b|corporation tax/i, label: /\bct1\b|corporation tax/i },
  { name: "income tax", task: /\bform 11\b|income tax|self[- ]assess|pay and file/i, label: /form 11|pay and file/i },
  { name: "payroll", task: /payroll|\bpaye\b|\bprsi\b/i, label: /payroll|\bpaye\b/i },
  { name: "irs", task: /\birs\b|\bus\b tax|1040|1065|1120/i, label: /\birs\b/i },
  { name: "cayman", task: /cayman|\bcima\b/i, label: /cayman/i },
];

/** The topic the task names, or null when it names none. */
export function taskTopic(taskText: string): string | null {
  return TOPICS.find((t) => t.task.test(taskText))?.name ?? null;
}

/**
 * Prefers the user's own date. Otherwise picks the soonest upcoming catalogue deadline that fits
 * the task named (VAT text picks a VAT deadline, never ROS pay and file). If the task names a topic
 * with no matching deadline, returns null. If it names no topic, returns the soonest upcoming one.
 */
export function pickDeadline(
  userDeadline: Deadline | null,
  catalogueDeadlines: readonly CatalogueDeadline[],
  taskText: string,
  today: string,
): Deadline | null {
  if (userDeadline) return userDeadline;
  const topic = TOPICS.find((t) => t.task.test(taskText));
  const upcoming = catalogueDeadlines
    .filter((d) => daysBetween(today, d.date) >= 0)
    .filter((d) => !topic || topic.label.test(d.label))
    .sort((a, b) => utc(a.date) - utc(b.date));
  const d = upcoming[0];
  if (!d) return null;
  return { label: d.label, dueDate: d.date, daysLeft: daysBetween(today, d.date), source: "catalogue" };
}
