import type { Metadata } from "next";
import { EmployeeFlow } from "@/components/employee/EmployeeFlow";
import {
  athenaResultFixture,
  meterReadingFixture,
  recommendationFixture,
  staffFixture,
} from "@/contract/fixtures";

export const metadata: Metadata = { title: "Frame Next: what to hand to AI" };

/** Matches DEFAULT_HOURS_BACK_FACTOR in engine/recommend and engine/productivity. */
const HOURS_BACK_FACTOR = 0.3;

// Built from contract fixtures only. The halfway task swaps these for data/ and the API.
export default function EmployeePage() {
  return (
    <EmployeeFlow
      staff={staffFixture}
      athena={athenaResultFixture}
      recommendation={recommendationFixture}
      meter={meterReadingFixture}
      hoursBackFactor={HOURS_BACK_FACTOR}
    />
  );
}
