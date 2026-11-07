// The data the API routes run the engines over.
// For now this is built from contract/fixtures.ts. The halfway task swaps getWorld() to the
// real data in data/public, data/frame and catalogue, without touching the route handlers.
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

/** The world the routes use. Replace the body to wire real data. */
export function getWorld(): World {
  return fixtureWorld();
}

/** Engagements a person has logged time on. */
export function engagementsFor(world: World, staffId: string): Engagement[] {
  const ids = new Set(world.timesheets.filter((l) => l.staffId === staffId).map((l) => l.engagementId));
  return world.engagements.filter((e) => ids.has(e.id));
}
