// Seeded generator for synthetic Frame data. Every record is made up and carries synthetic: true.
//
// Run:  node scripts/make-frame-data/generate.ts [seed]
// It writes data/frame/staff.json, engagements.json, timesheets.json and usage.json.
// The same seed always gives the same files. tests in data/frame check this.
//
// This file uses only type annotations that Node can strip, so it runs without a build step.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_SEED = 20261107;

// ---------- O*NET task statements ----------
// Exact task statements from O*NET 30.0 Task Statements
// (https://www.onetcenter.org/dl_files/database/db_30_0_text/Task%20Statements.txt) for
// 13-2011.00 Accountants and Auditors, 13-2082.00 Tax Preparers and 43-3031.00 Bookkeeping clerks.
// Every one also appears in the Anthropic Economic Index task_penetration.csv.
export const ONET = {
  recBank: { code: "43-3031.00", task: "Reconcile records of bank transactions." },
  recAccounts: { code: "13-2011.00", task: "Review accounts for discrepancies and reconcile differences." },
  classify: {
    code: "43-3031.00",
    task: "Classify, record, and summarize numerical and financial data to compile and keep financial records, using journals and ledgers or computers.",
  },
  assignEntries: { code: "13-2011.00", task: "Establish tables of accounts and assign entries to proper accounts." },
  codeDocs: { code: "43-3031.00", task: "Code documents according to company procedures." },
  prepReturns: { code: "13-2082.00", task: "Prepare or assist in preparing simple to complex tax returns for individuals or small businesses." },
  checkForms: {
    code: "13-2082.00",
    task: "Check data input or verify totals on forms prepared by others to detect errors in arithmetic, data entry, or procedures.",
  },
  reviewForForms: {
    code: "13-2082.00",
    task: "Review financial records, such as income statements and documentation of expenditures to determine forms needed to prepare tax returns.",
  },
  clientQueries: { code: "13-2082.00", task: "Answer questions and provide future tax planning to clients." },
  furnishInfo: {
    code: "13-2082.00",
    task: "Furnish taxpayers with sufficient information and advice to ensure correct tax form completion.",
  },
  auditReport: { code: "13-2011.00", task: "Prepare detailed reports on audit findings." },
  examineRecords: {
    code: "13-2011.00",
    task: "Examine records and interview workers to ensure recording of transactions and compliance with laws and regulations.",
  },
  analyseStatements: {
    code: "13-2011.00",
    task: "Prepare, examine, or analyze accounting records, financial statements, or other financial reports to assess accuracy, completeness, and conformance to reporting and procedural standards.",
  },
  controls: {
    code: "13-2011.00",
    task: "Collect and analyze data to detect deficient controls, duplicated effort, extravagance, fraud, or non-compliance with laws, regulations, and management policies.",
  },
  compileReports: {
    code: "43-3031.00",
    task: "Compile statistical, financial, accounting, or auditing reports and tables pertaining to such matters as cash receipts, expenditures, accounts payable and receivable, and profits and losses.",
  },
  analyseOps: {
    code: "13-2011.00",
    task: "Analyze business operations, trends, costs, revenues, financial commitments, and obligations to project future revenues and expenses or to provide advice.",
  },
  trialBalance: { code: "43-3031.00", task: "Prepare trial balances of books." },
  journals: { code: "13-2011.00", task: "Prepare adjusting journal entries." },
  calculations: {
    code: "43-3031.00",
    task: "Perform financial calculations, such as amounts due, interest charges, balances, discounts, equity, and principal.",
  },
  advise: {
    code: "13-2011.00",
    task: "Advise clients in areas such as compensation, employee health care benefits, the design of accounting or data processing systems, or long-range tax or estate plans.",
  },
  confer: { code: "13-2011.00", task: "Confer with company officials about financial and regulatory matters." },
  systems: {
    code: "13-2011.00",
    task: "Develop, implement, modify, and document recordkeeping and accounting systems, making use of current computer technology.",
  },
} as const;

type TaskKey = keyof typeof ONET;

/** What a person might type in a timesheet for each task. */
const TASK_TEXT: Record<TaskKey, string[]> = {
  recBank: ["Bank rec", "Bank reconciliation", "Rec bank statements to ledger"],
  recAccounts: ["Debtors/creditors rec", "Reconcile intercompany balances", "Clear rec differences"],
  classify: ["Coding bank transactions", "Post and categorise transactions", "Classify expenses to nominal codes"],
  assignEntries: ["Set up chart of accounts mapping", "Map ledger codes"],
  codeDocs: ["Code purchase invoices", "Code supplier docs"],
  prepReturns: ["Prepare tax return", "Draft return", "Return prep"],
  checkForms: ["Check figures on return", "Review return totals"],
  reviewForForms: ["Review records for return", "Gather docs for return"],
  clientQueries: ["Client queries", "Answer client tax questions"],
  furnishInfo: ["Client info request", "Explain return items to client"],
  auditReport: ["Audit findings report", "Draft management letter"],
  examineRecords: ["Audit fieldwork", "Vouching and walkthroughs"],
  analyseStatements: ["Review financial statements", "FS review"],
  controls: ["Controls testing", "Fraud risk procedures"],
  compileReports: ["Management accounts pack", "Prepare monthly reports"],
  analyseOps: ["Cash flow forecast", "Budget vs actual analysis"],
  trialBalance: ["Prepare TB", "Trial balance"],
  journals: ["Year-end journals", "Adjusting journals"],
  calculations: ["Interest and balance calcs", "Calculate amounts due"],
  advise: ["Client advisory call", "Planning advice"],
  confer: ["Meeting with client finance team", "Call with CFO"],
  systems: ["Build automation for team", "Document AI workflow"],
};

// ---------- Deadline ids (shared with data/public/deadlines.json, task T-3) ----------
export const DEADLINE_IDS = [
  "ie-form11-2026",
  "ie-ros-2026",
  "ie-ct1-2026-11",
  "ie-vat-2026-11",
  "ie-ct1-2027-01",
  "us-est-2027-01",
  "us-1065-2027-03",
  "us-1040-2027-04",
  "ky-annual-2027-06",
] as const;

// ---------- Staff ----------
export const OFFICES = ["Cork", "Dublin", "New York", "Grand Cayman"] as const;
export const TEAMS = ["Tax", "Audit", "Business Finance", "Private Wealth"] as const;

interface StaffSeed {
  id: string;
  name: string;
  role: string;
  team: (typeof TEAMS)[number];
  office: (typeof OFFICES)[number];
  chargeRate: number;
  /** Mean prompts per active day, and mean verified share. */
  prompts: number;
  verified: number;
  /** Share of weekdays the person uses AI at all. */
  activeShare: number;
}

const STAFF: StaffSeed[] = [
  { id: "s-aoife", name: "Aoife", role: "Junior Tax Assistant", team: "Tax", office: "Cork", chargeRate: 85, prompts: 46, verified: 0.18, activeShare: 0.98 },
  { id: "s-harry", name: "Harry", role: "AI and Automation Analyst", team: "Business Finance", office: "Cork", chargeRate: 120, prompts: 38, verified: 0.86, activeShare: 0.95 },
  { id: "s-conor", name: "Conor", role: "Tax Manager", team: "Tax", office: "Cork", chargeRate: 175, prompts: 6, verified: 0.8, activeShare: 0.45 },
  { id: "s-niamh", name: "Niamh", role: "Tax Senior", team: "Tax", office: "Dublin", chargeRate: 130, prompts: 14, verified: 0.72, activeShare: 0.75 },
  { id: "s-daniel", name: "Daniel", role: "US Tax Senior", team: "Tax", office: "New York", chargeRate: 160, prompts: 18, verified: 0.65, activeShare: 0.8 },
  { id: "s-maeve", name: "Maeve", role: "Audit Manager", team: "Audit", office: "Dublin", chargeRate: 170, prompts: 4, verified: 0.9, activeShare: 0.3 },
  { id: "s-sinead", name: "Sinéad", role: "Audit Senior", team: "Audit", office: "Cork", chargeRate: 125, prompts: 12, verified: 0.7, activeShare: 0.7 },
  { id: "s-eoin", name: "Eoin", role: "Audit Assistant", team: "Audit", office: "Dublin", chargeRate: 80, prompts: 22, verified: 0.45, activeShare: 0.85 },
  { id: "s-ciaran", name: "Ciarán", role: "Business Finance Accountant", team: "Business Finance", office: "Cork", chargeRate: 110, prompts: 16, verified: 0.6, activeShare: 0.8 },
  { id: "s-rachel", name: "Rachel", role: "Bookkeeper", team: "Business Finance", office: "Dublin", chargeRate: 70, prompts: 9, verified: 0.55, activeShare: 0.6 },
  { id: "s-keisha", name: "Keisha", role: "Private Wealth Associate", team: "Private Wealth", office: "Grand Cayman", chargeRate: 140, prompts: 10, verified: 0.68, activeShare: 0.65 },
  { id: "s-tom", name: "Tom", role: "Private Wealth Manager", team: "Private Wealth", office: "New York", chargeRate: 190, prompts: 3, verified: 0.85, activeShare: 0.25 },
];

// ---------- Engagements ----------
interface EngagementSeed {
  id: string;
  client: string;
  type: string;
  fee: number;
  budgetHours: number;
  deadlineId: (typeof DEADLINE_IDS)[number];
  /** Staff ids and their share of the hours. */
  team: [string, number][];
  /** Task mix for the planned work. */
  mix: [TaskKey, number][];
  /** True for the three jobs that run over budget, mostly on reconciliation and classification. */
  over: boolean;
}

const ENGAGEMENTS: EngagementSeed[] = [
  {
    id: "e-murphy", client: "Murphy Engineering Ltd", type: "Corporation tax return (CT1)", fee: 12000, budgetHours: 110,
    deadlineId: "ie-ct1-2026-11", over: true,
    team: [["s-aoife", 0.6], ["s-niamh", 0.25], ["s-conor", 0.15]],
    mix: [["classify", 3], ["recBank", 2], ["prepReturns", 2], ["checkForms", 1], ["clientQueries", 1]],
  },
  {
    id: "e-byrne", client: "Byrne Foods", type: "VAT returns and bookkeeping", fee: 8500, budgetHours: 90,
    deadlineId: "ie-vat-2026-11", over: true,
    team: [["s-rachel", 0.5], ["s-aoife", 0.35], ["s-ciaran", 0.15]],
    mix: [["classify", 3], ["codeDocs", 2], ["recBank", 2], ["calculations", 1], ["checkForms", 1]],
  },
  {
    id: "e-walsh", client: "Walsh Holdings", type: "Statutory audit", fee: 32000, budgetHours: 260,
    deadlineId: "ie-ct1-2027-01", over: true,
    team: [["s-eoin", 0.45], ["s-sinead", 0.35], ["s-maeve", 0.2]],
    mix: [["examineRecords", 3], ["recAccounts", 2], ["analyseStatements", 2], ["controls", 1], ["auditReport", 1]],
  },
  {
    id: "e-kelly", client: "Kelly Family", type: "Personal tax returns (Form 11)", fee: 9000, budgetHours: 60,
    deadlineId: "ie-ros-2026", over: false,
    team: [["s-aoife", 0.55], ["s-niamh", 0.3], ["s-conor", 0.15]],
    mix: [["reviewForForms", 2], ["prepReturns", 3], ["furnishInfo", 1], ["clientQueries", 1], ["classify", 1]],
  },
  {
    id: "e-oconnor", client: "O'Connor Pharmacy Group", type: "Management accounts", fee: 18000, budgetHours: 150,
    deadlineId: "ie-vat-2026-11", over: false,
    team: [["s-ciaran", 0.6], ["s-rachel", 0.4]],
    mix: [["compileReports", 3], ["trialBalance", 2], ["journals", 1], ["analyseOps", 2], ["classify", 1]],
  },
  {
    id: "e-quinn", client: "Quinn Tech DAC", type: "Corporation tax return (CT1)", fee: 15000, budgetHours: 120,
    deadlineId: "ie-ct1-2026-11", over: false,
    team: [["s-niamh", 0.5], ["s-aoife", 0.3], ["s-conor", 0.2]],
    mix: [["prepReturns", 3], ["checkForms", 2], ["reviewForForms", 1], ["classify", 1], ["confer", 1]],
  },
  {
    id: "e-harbour", client: "Harbour Point Partners LP", type: "US partnership return (Form 1065)", fee: 30000, budgetHours: 200,
    deadlineId: "us-1065-2027-03", over: false,
    team: [["s-daniel", 0.75], ["s-tom", 0.25]],
    mix: [["prepReturns", 3], ["reviewForForms", 2], ["calculations", 1], ["confer", 1]],
  },
  {
    id: "e-hudson", client: "Hudson Family Office", type: "US individual returns and estimated tax", fee: 22000, budgetHours: 140,
    deadlineId: "us-est-2027-01", over: false,
    team: [["s-daniel", 0.4], ["s-tom", 0.35], ["s-keisha", 0.25]],
    mix: [["advise", 2], ["calculations", 2], ["prepReturns", 1], ["clientQueries", 1]],
  },
  {
    id: "e-sevenmile", client: "Seven Mile Holdings", type: "Cayman annual return and accounts", fee: 26000, budgetHours: 180,
    deadlineId: "ky-annual-2027-06", over: false,
    team: [["s-keisha", 0.7], ["s-tom", 0.3]],
    mix: [["analyseStatements", 2], ["compileReports", 2], ["advise", 1], ["confer", 1]],
  },
  {
    id: "e-lee", client: "Lee Clinics Ltd", type: "Statutory audit", fee: 38000, budgetHours: 300,
    deadlineId: "ie-ct1-2027-01", over: false,
    team: [["s-sinead", 0.4], ["s-eoin", 0.4], ["s-maeve", 0.2]],
    mix: [["examineRecords", 3], ["analyseStatements", 2], ["controls", 2], ["auditReport", 1], ["recAccounts", 1]],
  },
];

// ---------- Dates ----------
/** First and last weekday of the 8 weeks: Mon 14 Sep 2026 to Fri 6 Nov 2026. */
export const PERIOD = { start: "2026-09-14", end: "2026-11-06" } as const;
/** Irish public holiday in the period (October bank holiday). Irish offices take it off. */
const IE_HOLIDAYS = new Set(["2026-10-26"]);

function weekdays(start: string, end: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${start}T00:00:00Z`); t <= Date.parse(`${end}T00:00:00Z`); t += 86_400_000) {
    const d = new Date(t);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// ---------- Seeded random numbers (mulberry32) ----------
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const quarter = (n: number) => Math.round(n * 4) / 4;
const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const between = (r: () => number, lo: number, hi: number) => lo + r() * (hi - lo);

// ---------- Output types (match contract/types.ts, plus office on staff) ----------
export interface StaffOut {
  id: string;
  name: string;
  role: string;
  team: string;
  office: string;
  chargeRate: number;
  synthetic: true;
}
export interface EngagementOut {
  id: string;
  client: string;
  type: string;
  fee: number;
  budgetHours: number;
  deadlineId: string;
  synthetic: true;
}
export interface TimesheetOut {
  staffId: string;
  engagementId: string;
  date: string;
  hours: number;
  taskText: string;
  onetTask: string;
  synthetic: true;
}
export interface UsageOut {
  staffId: string;
  date: string;
  prompts: number;
  tokensIn: number;
  tokensOut: number;
  taskCategory: string;
  verified: number;
  synthetic: true;
}
export interface FrameData {
  staff: StaffOut[];
  engagements: EngagementOut[];
  timesheets: TimesheetOut[];
  usage: UsageOut[];
}

/** Splits `hours` into chunks of 0.5 to 3.5 hours, in quarter hours, that sum exactly to `hours`. */
function chunks(r: () => number, hours: number): number[] {
  const out: number[] = [];
  let left = quarter(hours);
  while (left > 0) {
    const size = Math.min(left, quarter(between(r, 0.5, 3.5)));
    out.push(size);
    left = quarter(left - size);
  }
  return out;
}

/** Splits `total` across weighted keys, in quarter hours. */
function allocate<K>(total: number, weights: [K, number][]): [K, number][] {
  const sum = weights.reduce((s, [, w]) => s + w, 0);
  return weights.map(([k, w]) => [k, quarter((total * w) / sum)]);
}

const USAGE_CATEGORIES: Record<string, string[]> = {
  Tax: ["data classification", "tax research", "client email", "reconciliation", "spreadsheet formulas"],
  Audit: ["report drafting", "reconciliation", "data classification", "meeting notes", "spreadsheet formulas"],
  "Business Finance": ["spreadsheet formulas", "report drafting", "data classification", "reconciliation", "meeting notes"],
  "Private Wealth": ["client email", "meeting notes", "tax research", "report drafting"],
};

export function generate(seed: number = DEFAULT_SEED): FrameData {
  const r = rng(seed);
  const days = weekdays(PERIOD.start, PERIOD.end);
  const staffById = new Map(STAFF.map((s) => [s.id, s]));
  const workdays = (staffId: string) => {
    const s = staffById.get(staffId);
    const irish = s?.office === "Cork" || s?.office === "Dublin";
    return irish ? days.filter((d) => !IE_HOLIDAYS.has(d)) : days;
  };

  const staff: StaffOut[] = STAFF.map((s) => ({
    id: s.id, name: s.name, role: s.role, team: s.team, office: s.office, chargeRate: s.chargeRate, synthetic: true,
  }));

  const engagements: EngagementOut[] = ENGAGEMENTS.map((e) => ({
    id: e.id, client: e.client, type: e.type, fee: e.fee, budgetHours: e.budgetHours, deadlineId: e.deadlineId, synthetic: true,
  }));

  const timesheets: TimesheetOut[] = [];
  // Hours already booked per person per day, so nobody logs more than a full day.
  const load = new Map<string, number>();
  const DAY_CAP = 8;
  const bookDay = (staffId: string, hours: number): string => {
    const dates = workdays(staffId);
    let chosen = "";
    for (let tries = 0; tries < 20 && !chosen; tries++) {
      const d = pick(r, dates);
      if ((load.get(staffId + d) ?? 0) + hours <= DAY_CAP) chosen = d;
    }
    if (!chosen) {
      // Fall back to the least-loaded day, earliest first.
      chosen = dates.reduce((best, d) => ((load.get(staffId + d) ?? 0) < (load.get(staffId + best) ?? 0) ? d : best));
    }
    load.set(staffId + chosen, (load.get(staffId + chosen) ?? 0) + hours);
    return chosen;
  };

  for (const e of ENGAGEMENTS) {
    // Planned work: 55% to 85% of budget so far. Over-budget jobs add 25% to 40% more,
    // all on reconciliation and classification.
    const planned = quarter(e.budgetHours * (e.over ? between(r, 0.88, 0.95) : between(r, 0.55, 0.85)));
    const overrun = e.over ? quarter(e.budgetHours * between(r, 0.27, 0.4)) : 0;
    const overMix: [TaskKey, number][] = e.mix.some(([k]) => k === "recAccounts")
      ? [["recAccounts", 1], ["classify", 1]]
      : [["recBank", 1], ["classify", 1.2]];

    const buckets: [TaskKey, number][] = [...allocate(planned, e.mix), ...allocate(overrun, overMix)];
    for (const [task, taskHours] of buckets) {
      for (const [staffId, hours] of allocate(taskHours, e.team)) {
        for (const h of chunks(r, hours)) {
          timesheets.push({
            staffId,
            engagementId: e.id,
            date: bookDay(staffId, h),
            hours: h,
            taskText: `${pick(r, TASK_TEXT[task])} - ${e.client.split(" ")[0]}`,
            onetTask: ONET[task].task,
            synthetic: true,
          });
        }
      }
    }
  }
  // Harry is not on client engagements, so he logs no client timesheet lines.
  timesheets.sort((a, b) => a.date.localeCompare(b.date) || a.staffId.localeCompare(b.staffId) || a.engagementId.localeCompare(b.engagementId));

  const usage: UsageOut[] = [];
  for (const s of STAFF) {
    for (const d of workdays(s.id)) {
      if (r() > s.activeShare) continue;
      const prompts = Math.max(1, Math.round(s.prompts * between(r, 0.5, 1.5)));
      const tokensIn = Math.round(prompts * between(r, 900, 2200));
      const tokensOut = Math.round(prompts * between(r, 250, 650));
      const verified = Math.round(Math.min(1, Math.max(0, s.verified + between(r, -0.12, 0.12))) * 100) / 100;
      usage.push({
        staffId: s.id, date: d, prompts, tokensIn, tokensOut,
        taskCategory: pick(r, USAGE_CATEGORIES[s.team]), verified, synthetic: true,
      });
    }
  }
  usage.sort((a, b) => a.date.localeCompare(b.date) || a.staffId.localeCompare(b.staffId));

  return { staff, engagements, timesheets, usage };
}

/** One record per line keeps diffs readable and files small. */
export function toJson(records: unknown[]): string {
  return `[\n${records.map((x) => `  ${JSON.stringify(x)}`).join(",\n")}\n]\n`;
}

export function writeFrameData(outDir: string, seed: number = DEFAULT_SEED): void {
  const data = generate(seed);
  mkdirSync(outDir, { recursive: true });
  for (const [name, records] of Object.entries(data)) {
    writeFileSync(path.join(outDir, `${name}.json`), toJson(records as unknown[]));
  }
}

// Run directly: node scripts/make-frame-data/generate.ts [seed]
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const seed = process.argv[2] ? Number(process.argv[2]) : DEFAULT_SEED;
  const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "frame");
  writeFrameData(outDir, seed);
  console.log(`Wrote synthetic Frame data to ${outDir} with seed ${seed}.`);
}
