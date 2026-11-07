// POST /api/athena logic: decide whether to ask clarifying questions before a request goes to AI.
// The Athena engine has its own no-key fallback.
import { AthenaResponse, type AthenaRequest } from "@/contract/api";
import { runAthena, type AthenaOptions } from "@/engine/athena";
import { engagementsFor, type World } from "../ask/world";

/** Returns null for an unknown person. */
export async function handleAthena(req: AthenaRequest, world: World, opts: AthenaOptions = {}): Promise<AthenaResponse | null> {
  const staff = world.staff.find((s) => s.id === req.staffId);
  if (!staff) return null;
  const out = await runAthena(req.request, { staff, engagements: engagementsFor(world, staff.id) }, opts);
  return AthenaResponse.parse(out);
}
