// One small valid example of each contract type, for views and engines to build against.
// Made-up values carry synthetic: true. Real values were read from the source URL beside them.
import type {
  AthenaQuestion,
  AthenaResult,
  CatalogueItem,
  Deadline,
  Engagement,
  JobExposure,
  LiteracyLogEntry,
  MeterReading,
  Recommendation,
  SourcedNumber,
  Staff,
  TaskScore,
  TimesheetLine,
  UsageRecord,
} from "./types";
import type { AskRequest, AskResponse, AthenaRequest, AthenaResponse } from "./api";

const ECON_INDEX = "https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main/labor_market_impacts";

/** A real O*NET task statement, as it appears in task_penetration.csv. */
export const ONET_CLASSIFY_TASK =
  "Classify, record, and summarize numerical and financial data to compile and keep financial records, using journals and ledgers or computers.";

export const staffFixture: Staff = {
  id: "s-aoife",
  name: "Aoife",
  role: "Tax Assistant",
  team: "Tax",
  chargeRate: 85,
  synthetic: true,
};

// Real: Revenue eBrief 034/2026 extends the ROS pay-and-file date to 18 Nov 2026.
export const deadlineFixture: Deadline = {
  id: "ie-ros-2026",
  label: "ROS pay and file (extended)",
  date: "2026-11-18",
  jurisdiction: "IE",
  source: "https://www.revenue.ie/en/tax-professionals/ebrief/2026/no-0342026.aspx",
  checked: true,
};

export const engagementFixture: Engagement = {
  id: "e-murphy",
  client: "Murphy Engineering Ltd",
  type: "Corporation tax return",
  fee: 10000,
  budgetHours: 100,
  deadlineId: deadlineFixture.id,
  synthetic: true,
};

export const timesheetLineFixture: TimesheetLine = {
  staffId: staffFixture.id,
  engagementId: engagementFixture.id,
  date: "2026-11-02",
  hours: 3.5,
  taskText: "Coded bank transactions to the nominal ledger",
  onetTask: ONET_CLASSIFY_TASK,
  synthetic: true,
};

// Real: row from task_penetration.csv, read on 7 Nov 2026.
export const taskScoreFixture: TaskScore = {
  onetTask: ONET_CLASSIFY_TASK,
  penetration: 0.9664,
  source: `${ECON_INDEX}/task_penetration.csv`,
};

// Real: row from job_exposure.csv, read on 7 Nov 2026.
export const jobExposureFixture: JobExposure = {
  occCode: "13-2011",
  title: "Accountants and Auditors",
  observedExposure: 0.3478,
  source: `${ECON_INDEX}/job_exposure.csv`,
};

export const usageRecordFixture: UsageRecord = {
  staffId: staffFixture.id,
  date: "2026-11-03",
  prompts: 42,
  tokensIn: 61000,
  tokensOut: 18500,
  taskCategory: "data classification",
  verified: 0.2,
  synthetic: true,
};

export const catalogueItemFixture: CatalogueItem = {
  id: "skill-transaction-classify",
  kind: "skill",
  title: "Transaction classification",
  plainSummary: "Sorts a bank export into ledger codes so you only check the odd ones.",
  targetsOnetTasks: [ONET_CLASSIFY_TASK],
  body:
    "You are helping an Irish accounting firm. Take the bank transactions I paste and give each a nominal ledger code from the chart of accounts I paste. Return a table: date, description, amount, code, confidence. Flag anything below 80% confidence.",
  verifyStep: "Pick three flagged lines and check the code against the source document.",
  howThisHelps: "Saves a tax assistant the hours spent coding each bank line by hand before a VAT return.",
};

// Derived from synthetic timesheets, so synthetic.
export const recommendationFixture: Recommendation = {
  staffId: staffFixture.id,
  item: catalogueItemFixture,
  aiReadyHours: 9.7,
  hoursBackEstimate: 2.9,
  eurosBack: 246.5,
  deadline: deadlineFixture,
  reason: "You spent 10 hours classifying transactions for Murphy, and the ROS deadline is 11 days away.",
  synthetic: true,
};

export const athenaQuestionFixture: AthenaQuestion = {
  question: "Which part of the Murphy job do you want help with?",
  options: ["Coding bank transactions", "Drafting the client query letter", "Checking the CT1 figures"],
  why: "Each part needs a different skill.",
};

export const athenaResultFixture: AthenaResult = {
  needed: true,
  questions: [athenaQuestionFixture],
  tokensUsed: 0,
};

export const meterReadingFixture: MeterReading = {
  task: "athena-intake",
  tokensIn: 0,
  tokensOut: 0,
  euros: null,
  finished: false,
};

export const literacyLogEntryFixture: LiteracyLogEntry = {
  staffId: staffFixture.id,
  date: "2026-11-07",
  measure: "shown",
  itemId: catalogueItemFixture.id,
  adopted: false,
};

/** A finished 4D literacy lesson: itemId is the lesson id and adopted is true. */
export const lessonLogEntryFixture: LiteracyLogEntry = {
  staffId: staffFixture.id,
  date: "2026-11-07",
  measure: "lesson",
  itemId: "4d-delegation",
  adopted: true,
};

export const sourcedNumberFixtures: SourcedNumber[] = [
  { label: "Hours back this week", value: 2.9, unit: "hours", synthetic: true },
  { label: "Euros back", value: 246.5, unit: "EUR", synthetic: true },
  {
    label: "Days to ROS deadline",
    value: 11,
    unit: "days",
    source: deadlineFixture.source,
    synthetic: false,
  },
];

// ---------- API ----------

export const athenaRequestFixture: AthenaRequest = {
  staffId: staffFixture.id,
  request: "help with Murphy",
};

export const athenaResponseFixture: AthenaResponse = {
  result: athenaResultFixture,
  meter: meterReadingFixture,
  fallback: true,
};

export const askRequestFixture: AskRequest = {
  question: "What should I hand to AI before 18 November?",
  view: "employee",
  staffId: staffFixture.id,
  athenaAnswers: [{ question: athenaQuestionFixture.question, answer: "Coding bank transactions" }],
};

export const askResponseFixture: AskResponse = {
  answer:
    "Hand the transaction classification skill your Murphy bank export. It could give you about 2.9 hours back (€246.50) before the ROS deadline on 18 November, 11 days away. Check three flagged lines before you file.",
  numbers: sourcedNumberFixtures,
  meter: { ...meterReadingFixture, task: "ask", finished: true },
  fallback: true,
};
