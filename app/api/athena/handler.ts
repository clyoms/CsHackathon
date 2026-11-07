// POST /api/athena logic. First triage: is this about the person's work? Off-topic requests get a
// one-line decline and stop. Otherwise Athena decides whether to ask clarifying questions.
// Both steps have their own no-key fallback, and every fallback is labelled and logged.
import { AthenaResponse, type AthenaRequest } from "@/contract/api";
import type { MeterReading } from "@/contract/types";
import type { AthenaOutcome, Usage } from "@/engine/contract";
import { runAthena, type AthenaOptions } from "@/engine/athena";
import { triage } from "@/engine/athena/triage";
import { NO_PRICE, readingFromUsage } from "@/engine/meter";
import { engagementsFor, type World } from "../ask/world";

export type OfflineInfo = Usage;
export type AthenaApiResponse = AthenaResponse & Usage & { outcome: AthenaOutcome };

/** Adds two readings for the same task. Euros stay null if either is unknown. */
function addMeters(a: MeterReading, b: MeterReading): MeterReading {
  return {
    ...a,
    tokensIn: a.tokensIn + b.tokensIn,
    tokensOut: a.tokensOut + b.tokensOut,
    euros: a.euros === null || b.euros === null ? null : a.euros + b.euros,
  };
}

/** Returns null for an unknown person. */
export async function handleAthena(req: AthenaRequest, world: World, opts: AthenaOptions = {}): Promise<AthenaApiResponse | null> {
  const staff = world.staff.find((s) => s.id === req.staffId);
  if (!staff) return null;
  const price = opts.price ?? NO_PRICE;
  const engagements = engagementsFor(world, staff.id);
  // The key is read per request, never at module load.
  const hasKey = opts.client !== undefined ? opts.client !== null : Boolean(process.env.ANTHROPIC_API_KEY);

  const tri = await triage(req.request, { engagements, client: opts.client });
  const triMeter = readingFromUsage("athena-intake", tri.rawUsage, price, false);

  if (tri.outcome.kind === "decline") {
    const offline = tri.usage.offline;
    const offlineReason = tri.usage.offlineReason;
    if (offlineReason) console.warn(`[athena] offline answer: ${offlineReason}`);
    const res = AthenaResponse.parse({
      result: { needed: false, questions: [], tokensUsed: tri.usage.tokensUsed },
      meter: { ...triMeter, finished: true },
      fallback: offline,
    });
    return { ...res, offline, offlineReason, tokensUsed: tri.usage.tokensUsed, outcome: tri.outcome };
  }

  const out = await runAthena(req.request, { staff, engagements }, opts);
  const res = AthenaResponse.parse({ ...out, meter: addMeters(out.meter, triMeter) });
  const tokensUsed = res.meter.tokensIn + res.meter.tokensOut;
  const offline = res.fallback || tri.usage.offline || !hasKey;
  let offlineReason: string | undefined;
  if (!hasKey) offlineReason = "no ANTHROPIC_API_KEY on the server";
  else if (res.fallback) offlineReason = "Claude call failed (see the 'Athena fell back' warning above)";
  else if (tri.usage.offline) offlineReason = tri.usage.offlineReason;
  if (offlineReason) console.warn(`[athena] offline answer: ${offlineReason}`);
  else if (!res.result.needed) console.info("[athena] no questions needed after triage");
  const outcome: AthenaOutcome = res.result.needed ? { kind: "clarify" } : { kind: "skill" };
  return { ...res, offline, offlineReason, tokensUsed, outcome };
}
