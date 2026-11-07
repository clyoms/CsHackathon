// Loader for the real public data in data/public/. Server only: it reads files with node:fs.
// Every record is checked against a schema and carries the URL it came from.
// Refresh the downloaded files with: node scripts/fetch-public/fetch.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { z } from "zod";
import { Deadline, IsoDate, JobExposure, SourceUrl, TaskScore } from "@/contract/types";

const DIR = path.join(process.cwd(), "data", "public");
const ECON = "https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main/labor_market_impacts";

export const SOURCES = {
  jobExposure: `${ECON}/job_exposure.csv`,
  taskPenetration: `${ECON}/task_penetration.csv`,
  holidays: "https://date.nager.at/api/v3/PublicHolidays",
  csoIca237: "https://data.cso.ie/table/ICA237",
  eurostat: "https://ec.europa.eu/eurostat/databrowser/view/isoc_eb_ain2/default/table",
} as const;

// ---------- Local types for data the contract does not cover ----------

export const Holiday = z.object({ date: IsoDate, name: z.string().min(1), source: SourceUrl });
export type Holiday = z.infer<typeof Holiday>;

/** CSO ICA237: share of Irish enterprises using AI, by enterprise size. */
export const CsoAdoption = z.object({
  statistic: z.string().min(1),
  year: z.number().int(),
  sizeClass: z.string().min(1),
  /** Percent of enterprises, 0 to 100. Null where CSO publishes no value. */
  percent: z.number().min(0).max(100).nullable(),
  source: SourceUrl,
});
export type CsoAdoption = z.infer<typeof CsoAdoption>;

/** Eurostat isoc_eb_ain2: share of enterprises (10+ staff) using at least one AI technology. */
export const EurostatAdoption = z.object({
  geo: z.enum(["IE", "EU27_2020"]),
  geoLabel: z.string().min(1),
  nace: z.string().min(1),
  naceLabel: z.string().min(1),
  year: z.number().int(),
  /** Percent of enterprises, 0 to 100. */
  percent: z.number().min(0).max(100),
  source: SourceUrl,
});
export type EurostatAdoption = z.infer<typeof EurostatAdoption>;

/** data/public/prices.json. Read it with priceFor() in engine/meter. */
export const Prices = z.object({
  note: z.string(),
  currency: z.enum(["USD", "EUR"]),
  usdToEur: z.number().positive().nullable(),
  models: z.record(
    z.string(),
    z.object({ inputPerMTok: z.number().nonnegative().nullable(), outputPerMTok: z.number().nonnegative().nullable() }),
  ),
});
export type Prices = z.infer<typeof Prices>;

// ---------- Readers ----------

function read(file: string): string {
  return readFileSync(path.join(DIR, file), "utf8");
}

function csv(file: string): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(read(file), { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) throw new Error(`${file}: ${parsed.errors[0].message}`);
  return parsed.data;
}

const cache = new Map<string, unknown>();
function once<T>(key: string, load: () => T): T {
  if (!cache.has(key)) cache.set(key, load());
  return cache.get(key) as T;
}

/** Anthropic Economic Index observed exposure for every occupation. */
export function loadJobExposure(): JobExposure[] {
  return once("jobExposure", () =>
    csv("job_exposure.csv").map((r) =>
      JobExposure.parse({
        occCode: r.occ_code,
        title: r.title,
        observedExposure: Number(r.observed_exposure),
        source: SOURCES.jobExposure,
      }),
    ),
  );
}

/** Anthropic Economic Index task penetration, finance-related tasks only. */
export function loadTaskScores(): TaskScore[] {
  return once("taskScores", () =>
    csv("task_penetration.csv").map((r) =>
      TaskScore.parse({ onetTask: r.task, penetration: Number(r.penetration), source: SOURCES.taskPenetration }),
    ),
  );
}

/** Irish, US and Cayman filing deadlines, sorted by date. checked: false marks dates to confirm. */
export function loadDeadlines(): Deadline[] {
  return once("deadlines", () => {
    const file = z.object({ deadlines: z.array(Deadline) }).parse(JSON.parse(read("deadlines.json")));
    return [...file.deadlines].sort((a, b) => a.date.localeCompare(b.date));
  });
}

/** Irish public holidays for 2026 and 2027. */
export function loadHolidays(): Holiday[] {
  return once("holidays", () => {
    const raw = z.array(z.object({ date: IsoDate, name: z.string() })).parse(JSON.parse(read("holidays-ie.json")));
    return raw.map((h) => Holiday.parse({ ...h, source: `${SOURCES.holidays}/${h.date.slice(0, 4)}/IE` }));
  });
}

/** CSO ICA237 rows. */
export function loadCsoAdoption(): CsoAdoption[] {
  return once("cso", () =>
    csv("cso-ica237.csv").map((r) => {
      const value = r.VALUE?.trim();
      return CsoAdoption.parse({
        statistic: r["Statistic Label"],
        year: Number(r.Year),
        sizeClass: r["Enterprise Size Class"],
        percent: value === "" || value === undefined || Number.isNaN(Number(value)) ? null : Number(value),
        source: SOURCES.csoIca237,
      });
    }),
  );
}

const JsonStat = z.object({
  id: z.array(z.string()),
  size: z.array(z.number().int()),
  value: z.record(z.string(), z.number()),
  dimension: z.record(
    z.string(),
    z.object({
      category: z.object({ index: z.record(z.string(), z.number().int()), label: z.record(z.string(), z.string()) }),
    }),
  ),
});

/** Eurostat isoc_eb_ain2 for Ireland and the EU, decoded from JSON-stat. */
export function loadEurostatAdoption(): EurostatAdoption[] {
  return once("eurostat", () => {
    const js = JsonStat.parse(JSON.parse(read("eurostat-isoc_eb_ain2.json")));
    // Category code at each position, per dimension.
    const codes = js.id.map((dim) => {
      const byPos: string[] = [];
      for (const [code, pos] of Object.entries(js.dimension[dim].category.index)) byPos[pos] = code;
      return byPos;
    });
    const out: EurostatAdoption[] = [];
    for (const [flat, percent] of Object.entries(js.value)) {
      // Unflatten the row-major index into one position per dimension.
      let rest = Number(flat);
      const at: Record<string, string> = {};
      for (let d = js.id.length - 1; d >= 0; d--) {
        at[js.id[d]] = codes[d][rest % js.size[d]];
        rest = Math.floor(rest / js.size[d]);
      }
      out.push(
        EurostatAdoption.parse({
          geo: at.geo,
          geoLabel: js.dimension.geo.category.label[at.geo],
          nace: at.nace_r2,
          naceLabel: js.dimension.nace_r2.category.label[at.nace_r2],
          year: Number(at.time),
          percent,
          source: SOURCES.eurostat,
        }),
      );
    }
    return out.sort((a, b) => a.geo.localeCompare(b.geo) || a.nace.localeCompare(b.nace) || a.year - b.year);
  });
}

/** Token prices. Every price starts null until a human fills it. */
export function loadPrices(): Prices {
  return once("prices", () => Prices.parse(JSON.parse(read("prices.json"))));
}

export interface PublicData {
  jobExposure: JobExposure[];
  taskScores: TaskScore[];
  deadlines: Deadline[];
  holidays: Holiday[];
  csoAdoption: CsoAdoption[];
  eurostatAdoption: EurostatAdoption[];
  prices: Prices;
}

/** Everything in data/public, validated. */
export function loadPublicData(): PublicData {
  return {
    jobExposure: loadJobExposure(),
    taskScores: loadTaskScores(),
    deadlines: loadDeadlines(),
    holidays: loadHolidays(),
    csoAdoption: loadCsoAdoption(),
    eurostatAdoption: loadEurostatAdoption(),
    prices: loadPrices(),
  };
}
