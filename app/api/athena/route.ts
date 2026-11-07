import { AthenaRequest, type ApiError } from "@/contract/api";
import { loadPrice } from "@/engine/meter";
import { getWorld } from "../ask/world";
import { handleAthena } from "./handler";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body must be JSON" } satisfies ApiError, { status: 400 });
  }
  const parsed = AthenaRequest.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    return Response.json({ error } satisfies ApiError, { status: 400 });
  }
  const res = await handleAthena(parsed.data, getWorld(), { price: loadPrice() });
  if (!res) return Response.json({ error: `unknown staffId: ${parsed.data.staffId}` } satisfies ApiError, { status: 400 });
  return Response.json(res);
}
