// The data the API routes and the views run the engines over.
// getWorld() reads the real files: data/public (real), data/frame (synthetic) and catalogue.
// fixtureWorld() keeps the small contract-fixture world for tests. Server only (reads files).
import { loadCatalogue } from "@/catalogue";
import type { AthenaAnswer } from "@/contract/api";
import { namesClient } from "@/components/employee/choices";
import {
  catalogueItemFixture,
  deadlineFixture,
  engagementFixture,
  staffFixture,
  taskScoreFixture,
  timesheetLineFixture,
  usageRecordFixture,
} from "@/contract/fixtures";
import type {
  CatalogueItem,
  Deadline,
  Engagement,
  Staff,
  TaskScore,
  TimesheetLine,
  UsageRecord,
} from "@/contract/types";
import { loadFrameData } from "@/data/frame";
import { loadDeadlines, loadTaskScores } from "@/data/public";

export interface World {
  staff: Staff[];
  engagements: Engagement[];
  timesheets: TimesheetLine[];
  deadlines: Deadline[];
  taskScores: TaskScore[];
  catalogue: CatalogueItem[];
  usage: UsageRecord[];
  /** Today's date, YYYY-MM-DD. Fixed in tests so answers are repeatable. */
  today: string;
}

/** Today as YYYY-MM-DD. FRAME_TODAY overrides it for demos and tests. */
export function todayIso(): string {
  return process.env.FRAME_TODAY ?? new Date().toISOString().slice(0, 10);
}

export function fixtureWorld(today: string = todayIso()): World {
  return {
    staff: [staffFixture],
    engagements: [engagementFixture],
    timesheets: [timesheetLineFixture],
    deadlines: [deadlineFixture],
    taskScores: [taskScoreFixture],
    catalogue: [catalogueItemFixture],
    usage: [usageRecordFixture],
    today,
  };
}

/** The real world: every record validated by its loader. */
export function realWorld(today: string = todayIso()): World {
  const frame = loadFrameData();
  return {
    staff: frame.staff,
    engagements: frame.engagements,
    timesheets: frame.timesheets,
    deadlines: loadDeadlines(),
    taskScores: loadTaskScores(),
    catalogue: loadCatalogue(),
    usage: frame.usage,
    today,
  };
}

/** The world the routes and views use. */
export function getWorld(): World {
  return realWorld();
}

/** Engagements a person has logged time on. */
export function engagementsFor(world: World, staffId: string): Engagement[] {
  const ids = new Set(world.timesheets.filter((l) => l.staffId === staffId).map((l) => l.engagementId));
  return world.engagements.filter((e) => ids.has(e.id));
}

/**
 * The timesheet lines a recommendation should use, given the person's answers to Athena.
 * An answer that names one of their clients narrows to that client. Any other answer
 * (such as "All my clients") keeps all their work. Shared by /api/ask and the employee page,
 * so the answer card and the written answer use the same numbers.
 */
export function linesForAnswers(
  world: World,
  staffId: string,
  answers: AthenaAnswer[],
): { chosen: Engagement | undefined; lines: TimesheetLine[] } {
  const chosen = engagementsFor(world, staffId).find((e) => answers.some((a) => namesClient(a.answer, e.client)));
  const lines = chosen ? world.timesheets.filter((l) => l.engagementId === chosen.id) : world.timesheets;
  return { chosen, lines };
}
