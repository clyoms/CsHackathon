import type { Metadata } from "next";
import { getWorld, linesForAnswers, engagementsFor } from "@/app/api/ask/world";
import { ALL_CLIENTS, type Choices } from "@/components/employee/choices";
import { EmployeeFlow } from "@/components/employee/EmployeeFlow";
import { AOIFE_ID } from "@/data/frame";
import { recommend } from "@/engine/recommend";

export const metadata: Metadata = { title: "Handoff: what to hand to AI" };
// Today's date and the data are read per request.
export const dynamic = "force-dynamic";

/**
 * Aoife's page on real data. The engine's recommendation is worked out here for "all my clients"
 * and for each client she works on, with the same line selection /api/ask uses, so the answer card
 * and the written answer always show the same numbers. Questions and the written answer come from
 * the real /api/athena and /api/ask routes.
 */
export default function EmployeePage() {
  const world = getWorld();
  const staff = world.staff.find((s) => s.id === AOIFE_ID);
  if (!staff) throw new Error(`staff ${AOIFE_ID} is missing from data/frame`);

  const choices: Choices = {};
  const options = [ALL_CLIENTS, ...engagementsFor(world, staff.id).map((e) => e.client)];
  for (const answer of options) {
    const { lines } = linesForAnswers(world, staff.id, [{ question: "Which client is this for?", answer }]);
    const rec = recommend({ ...world, staff, lines });
    if (rec) choices[answer] = rec;
  }

  return <EmployeeFlow staff={staff} choices={choices} />;
}
