// Catalogue loader. Each item is a markdown file in catalogue/items/ with front matter:
//
//   ---
//   id: skill-bank-reconciliation
//   kind: skill | hook | plugin
//   title: ...
//   plainSummary: ...
//   targetsOnetTasks:
//     - <exact O*NET task statement>
//   verifyStep: ...
//   howThisHelps: ...        (optional; "" when missing)
//   ---
//   <body: the full text a person copies>
//
// The front matter is a small subset of YAML (single-line values and one list), parsed here
// so the app needs no YAML dependency. Server-side only: it reads files with node:fs.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { CatalogueItem } from "@/contract/types";

export const ITEMS_DIR = path.join(process.cwd(), "catalogue", "items");

/** Parses one item file. Throws with the file name when the item breaks the contract. */
export function parseItem(text: string, fileName = "item"): CatalogueItem {
  const normalised = text.replace(/\r\n/g, "\n");
  const match = normalised.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${fileName}: missing front matter`);
  const [, head, body] = match;

  const fields: Record<string, string | string[]> = {};
  let listKey: string | null = null;
  for (const line of head.split("\n")) {
    if (line.trim() === "") continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      (fields[listKey] as string[]).push(item[1].trim());
      continue;
    }
    const kv = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (!kv) throw new Error(`${fileName}: cannot read front matter line "${line}"`);
    const [, key, value] = kv;
    if (value === "") {
      fields[key] = [];
      listKey = key;
    } else {
      fields[key] = value.trim();
      listKey = null;
    }
  }

  // howThisHelps is optional in the file and empty when missing.
  const parsed = CatalogueItem.safeParse({ howThisHelps: "", ...fields, body: body.trim() });
  if (!parsed.success) {
    throw new Error(`${fileName}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  }
  return parsed.data;
}

let cache: CatalogueItem[] | null = null;

/** All catalogue items, sorted by id. */
export function loadCatalogue(dir: string = ITEMS_DIR): CatalogueItem[] {
  if (dir === ITEMS_DIR && cache) return cache;
  const items = readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => parseItem(readFileSync(path.join(dir, f), "utf8"), f));
  const ids = new Set<string>();
  for (const i of items) {
    if (ids.has(i.id)) throw new Error(`duplicate catalogue id: ${i.id}`);
    ids.add(i.id);
  }
  if (dir === ITEMS_DIR) cache = items;
  return items;
}

export type Risk = "low" | "medium" | "high";
export const RISKS: readonly Risk[] = ["low", "medium", "high"];
/** Used when an item file has no risk line. */
export const DEFAULT_RISK: Risk = "medium";

/** Reads the optional `risk: low | medium | high` front matter line. The contract schema drops it, so it is kept here. */
export function parseRisk(text: string, fileName = "item"): Risk {
  const head = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const value = head.match(/^risk:\s*(\S+)\s*$/m)?.[1];
  if (value === undefined) return DEFAULT_RISK;
  if (!RISKS.includes(value as Risk)) throw new Error(`${fileName}: risk must be low, medium or high, not "${value}"`);
  return value as Risk;
}

let riskCache: Record<string, Risk> | null = null;

/** Risk of every catalogue item, by id. Any number of items. */
export function loadRisk(dir: string = ITEMS_DIR): Record<string, Risk> {
  if (dir === ITEMS_DIR && riskCache) return riskCache;
  const out: Record<string, Risk> = {};
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".md"))) {
    const text = readFileSync(path.join(dir, f), "utf8");
    out[parseItem(text, f).id] = parseRisk(text, f);
  }
  if (dir === ITEMS_DIR) riskCache = out;
  return out;
}

export function catalogueItem(id: string): CatalogueItem | undefined {
  return loadCatalogue().find((i) => i.id === id);
}
