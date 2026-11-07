// Shared by the server page and the client flow. Kept out of the "use client" module, because a
// server component that imports a value from a client module gets a reference, not the value.
import type { Recommendation } from "@/contract/types";

/** The answer that keeps all of the person's work, offered beside their client names. */
export const ALL_CLIENTS = "All my clients";

/** The engine's recommendation per Athena client answer, with ALL_CLIENTS for everything. */
export type Choices = Record<string, Recommendation>;
