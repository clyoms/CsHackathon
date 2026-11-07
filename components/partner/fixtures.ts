// Partner view test world, built from contract/fixtures.ts plus a few more synthetic rows,
// so the table has something to sort. The final task swaps this for data/public, data/frame
// and catalogue.
//
// Real numbers here (penetration scores, deadline dates) are copied from data/public with
// their source URLs. Everything else is synthetic.
import {
  catalogueItemFixture,
  deadlineFixture,
  engagementFixture,
  staffFixture,
  taskScoreFixture,
  timesheetLineFixture,
} from "@/contract/fixtures";
import type { CatalogueItem, Deadline, Engagement, Staff, TaskScore, TimesheetLine } from "@/contract/types";

export interface PartnerWorld {
  staff: Staff[];
  engagements: Engagement[];
  timesheets: TimesheetLine[];
  deadlines: Deadline[];
  taskScores: TaskScore[];
  catalogue: CatalogueItem[];
  today: string;
}

const PENETRATION_SOURCE = taskScoreFixture.source;
const CT1_SOURCE =
  "https://www.revenue.ie/en/companies-and-charities/corporation-tax-for-companies/corporation-tax-payment-and-filing/payment-and-filing.aspx";

export const TASKS = {
  classify: taskScoreFixture.onetTask,
  recBank: "Reconcile records of bank transactions.",
  prepReturns: "Prepare or assist in preparing simple to complex tax returns for individuals or small businesses.",
  checkForms: "Check data input or verify totals on forms prepared by others to detect errors in arithmetic, data entry, or procedures.",
  examine: "Examine records and interview workers to ensure recording of transactions and compliance with laws and regulations.",
} as const;

const taskScores: TaskScore[] = [
  taskScoreFixture,
  { onetTask: TASKS.recBank, penetration: 0, source: PENETRATION_SOURCE },
  { onetTask: TASKS.prepReturns, penetration: 0, source: PENETRATION_SOURCE },
  { onetTask: TASKS.checkForms, penetration: 0.903, source: PENETRATION_SOURCE },
  { onetTask: TASKS.examine, penetration: 0.954, source: PENETRATION_SOURCE },
];

const deadlines: Deadline[] = [
  deadlineFixture,
  { id: "ie-ct1-2026-11", label: "CT1 return and balance, year ended 28 Feb 2026", date: "2026-11-23", jurisdiction: "IE", source: CT1_SOURCE, checked: false },
  { id: "ie-ct1-2026-12", label: "CT1 return and balance, year ended 31 Mar 2026", date: "2026-12-23", jurisdiction: "IE", source: CT1_SOURCE, checked: false },
];

const staff: Staff[] = [
  staffFixture,
  { id: "s-niamh", name: "Niamh", role: "Tax Senior", team: "Tax", chargeRate: 130, synthetic: true },
  { id: "s-eoin", name: "Eoin", role: "Audit Assistant", team: "Audit", chargeRate: 80, synthetic: true },
];

const engagements: Engagement[] = [
  { ...engagementFixture, deadlineId: "ie-ct1-2026-11" }, // Murphy: fee 10,000, budget 100 h
  { id: "e-walsh", client: "Walsh Holdings", type: "Statutory audit", fee: 32000, budgetHours: 260, deadlineId: "ie-ct1-2026-12", synthetic: true },
  { id: "e-kelly", client: "Kelly Family", type: "Personal tax returns (Form 11)", fee: 9000, budgetHours: 60, deadlineId: deadlineFixture.id, synthetic: true },
];

const line = (staffId: string, engagementId: string, onetTask: string, hours: number, taskText: string): TimesheetLine => ({
  ...timesheetLineFixture,
  staffId,
  engagementId,
  onetTask,
  hours,
  taskText,
});

const timesheets: TimesheetLine[] = [
  // Murphy: 125 h against 100 budgeted. Effective rate €80 an hour.
  line("s-aoife", "e-murphy", TASKS.classify, 55, "Coding bank transactions - Murphy"),
  line("s-aoife", "e-murphy", TASKS.recBank, 30, "Bank rec - Murphy"),
  line("s-niamh", "e-murphy", TASKS.prepReturns, 25, "Prepare tax return - Murphy"),
  line("s-niamh", "e-murphy", TASKS.checkForms, 15, "Check figures on return - Murphy"),
  // Walsh: 286 h against 260.
  line("s-eoin", "e-walsh", TASKS.examine, 180, "Audit fieldwork - Walsh"),
  line("s-eoin", "e-walsh", TASKS.classify, 106, "Post and categorise transactions - Walsh"),
  // Kelly: 40 h against 60, under budget.
  line("s-aoife", "e-kelly", TASKS.prepReturns, 28, "Prepare tax return - Kelly"),
  line("s-niamh", "e-kelly", TASKS.checkForms, 12, "Review return totals - Kelly"),
];

const ct1Checklist: CatalogueItem = {
  id: "skill-ct1-review-checklist",
  kind: "skill",
  title: "CT1 review checklist",
  plainSummary: "Checks a draft corporation tax return against the accounts and lists anything that does not tie.",
  targetsOnetTasks: [TASKS.checkForms, TASKS.prepReturns],
  body: "Check each CT1 box against the accounts and list every difference.",
  verifyStep: "Trace the three largest differences to the accounts yourself.",
  howThisHelps: "",
};

const auditSummary: CatalogueItem = {
  id: "skill-working-paper-summary",
  kind: "skill",
  title: "Working-paper summary",
  plainSummary: "Summarises a set of audit working papers into one page a manager can review fast.",
  targetsOnetTasks: [TASKS.examine],
  body: "Summarise the working papers for one audit area into one page with cross-references.",
  verifyStep: "Open three cross-references and confirm they point to the right paper.",
  howThisHelps: "",
};

export function partnerFixtureWorld(today = "2026-11-07"): PartnerWorld {
  return {
    staff,
    engagements,
    timesheets,
    deadlines,
    taskScores,
    catalogue: [catalogueItemFixture, ct1Checklist, auditSummary],
    today,
  };
}
