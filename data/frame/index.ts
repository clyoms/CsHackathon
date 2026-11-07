// Typed loader for the synthetic Frame data in this folder.
// Every record is made up and carries synthetic: true. Regenerate with:
//   node scripts/make-frame-data/generate.ts
import { z } from "zod";
import { Engagement, Staff, TimesheetLine, UsageRecord } from "@/contract/types";
import engagementsJson from "./engagements.json";
import staffJson from "./staff.json";
import timesheetsJson from "./timesheets.json";
import usageJson from "./usage.json";

/** Staff plus the office they work from (Cork, Dublin, New York or Grand Cayman). */
export const FrameStaff = Staff.extend({ office: z.enum(["Cork", "Dublin", "New York", "Grand Cayman"]) });
export type FrameStaff = z.infer<typeof FrameStaff>;

export interface FrameData {
  staff: FrameStaff[];
  engagements: Engagement[];
  timesheets: TimesheetLine[];
  usage: UsageRecord[];
}

let cache: FrameData | null = null;

/** Parses every file through the contract schemas. Throws if any record breaks the contract. */
export function loadFrameData(): FrameData {
  cache ??= {
    staff: z.array(FrameStaff).parse(staffJson),
    engagements: z.array(Engagement).parse(engagementsJson),
    timesheets: z.array(TimesheetLine).parse(timesheetsJson),
    usage: z.array(UsageRecord).parse(usageJson),
  };
  return cache;
}

export function staffById(id: string): FrameStaff | undefined {
  return loadFrameData().staff.find((s) => s.id === id);
}

/** Aoife, the junior tax assistant in Cork used in the demo. */
export const AOIFE_ID = "s-aoife";
/** Harry, AI and Automation Analyst. */
export const HARRY_ID = "s-harry";
