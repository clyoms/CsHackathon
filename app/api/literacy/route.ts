import type { ApiError } from "@/contract/api";
import { getLessonStore } from "@/engine/literacy/store";
import { getWorld } from "../ask/world";
import { handleLiteracyGet, handleLiteracyPost } from "./handler";

// The log changes as lessons are finished, so never cache it.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json(handleLiteracyGet(getLessonStore()));
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "body must be JSON" } satisfies ApiError, { status: 400 });
  }
  const res = handleLiteracyPost(body, getWorld(), getLessonStore());
  return Response.json(res.body, { status: res.status });
}
