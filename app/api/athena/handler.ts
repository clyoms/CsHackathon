// POST /api/athena logic: decide whether to ask clarifying questions before a request goes to AI.
// The Athena engine has its own no-key fallback.
import { AthenaResponse, type AthenaRequest } from "@/contract/api";
import { runAthena, type AthenaOptions } from "@/engine/athena";
import { engagementsFor, type World } from "../ask/world";

/** Matches Usage in engine/contract.ts (T-2). Switch to that import once it is merged. */
export interface OfflineInfo {
  offline: boolean;
  offlineReason?: string;
  tokensUsed: number;
}
export type AthenaApiResponse = AthenaResponse & OfflineInfo;

/** Returns null for an unknown person. */
export async function handleAthena(req: AthenaRequest, world: World, opts: AthenaOptions = {}): Promise<AthenaApiResponse | null> {
  const staff = world.staff.find((s) => s.id === req.staffId);
  if (!staff) return null;
  const out = await runAthena(req.request, { staff, engagements: engagementsFor(world, staff.id) }, opts);
  const res = AthenaResponse.parse(out);
  // The key is read per request, never at module load.
  const hasKey = opts.client !== undefined ? opts.client !== null : Boolean(process.env.ANTHROPIC_API_KEY);
  const tokensUsed = res.meter.tokensIn + res.meter.tokensOut;
  const offline = res.fallback || !hasKey;
  let offlineReason: string | undefined;
  if (!hasKey) offlineReason = "no ANTHROPIC_API_KEY on the server";
  else if (res.fallback) offlineReason = "Claude call failed (see the 'Athena fell back' warning above)";
  if (offlineReason) console.warn(`[athena] offline answer: ${offlineReason}`);
  else if (!res.result.needed) console.info("[athena] no questions needed, Claude not called");
  return { ...res, offline, offlineReason, tokensUsed };
}
