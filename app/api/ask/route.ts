import { AskRequest, type ApiError } from "@/contract/api";
import { AskInputError, handleAsk, routePrice } from "./handler";
import { getWorld } from "./world";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body must be JSON" } satisfies ApiError, { status: 400 });
  }
  const parsed = AskRequest.safeParse(body);
  if (!parsed.success) {
    const error = parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    return Response.json({ error } satisfies ApiError, { status: 400 });
  }
  try {
    return Response.json(await handleAsk(parsed.data, { world: getWorld(), price: routePrice() }));
  } catch (err) {
    if (err instanceof AskInputError) return Response.json({ error: err.message } satisfies ApiError, { status: 400 });
    console.error(err);
    return Response.json({ error: "could not answer" } satisfies ApiError, { status: 500 });
  }
}
