#!/usr/bin/env node
// Downloads the real public data Frame Next uses into data/public/.
// Run from the repo root: node scripts/fetch-public/fetch.mjs
// No dependencies. Writes sources.json with each file's URL and fetch time.
// deadlines.json and prices.json are written by hand and never touched here.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "data", "public");
const ECON = "https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main/labor_market_impacts";
const SOURCES = {
  jobExposure: `${ECON}/job_exposure.csv`,
  taskPenetration: `${ECON}/task_penetration.csv`,
  holidays2026: "https://date.nager.at/api/v3/PublicHolidays/2026/IE",
  holidays2027: "https://date.nager.at/api/v3/PublicHolidays/2027/IE",
  csoIca237: "https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/ICA237/CSV/1.0/en",
  // Share of enterprises using at least one AI technology: Ireland and EU27,
  // legal and accounting (M69-M71) and all enterprises (C10-S951_X_K).
  // O*NET 30.0 task statements. Every statement for ONET_CODES is kept from task_penetration.csv.
  onetTasks: "https://www.onetcenter.org/dl_files/database/db_30_0_text/Task%20Statements.txt",
  eurostat:
    "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ain2?format=JSON&lang=EN" +
    "&geo=IE&geo=EU27_2020&indic_is=E_AI_TANY&unit=PC_ENT&nace_r2=M69-M71&nace_r2=C10-S951_X_K",
};

/** Task text must match one of these to be kept from task_penetration.csv. */
const FINANCE_WORDS =
  /\b(accounting|accountant|audit|tax|ledger|reconcil|payroll|invoice|financial statement|budget)/i;

/** O*NET-SOC codes whose task statements are always kept: Accountants and Auditors, Tax Preparers, Bookkeeping clerks. */
const ONET_CODES = ["13-2011.00", "13-2082.00", "43-3031.00"];

/** Task text from a task_penetration.csv row with its score removed: drops the quotes and unescapes "". */
function taskText(field) {
  return field.startsWith('"') ? field.slice(1, -1).replace(/""/g, '"') : field;
}

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": "frame-next-fetch/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const text = await res.text();
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // drop a byte-order mark
}

/** Keeps the header and rows whose first quoted or bare field matches. */
function filterCsv(csv, test) {
  const lines = csv.split(/\r?\n/).filter((l) => l.length > 0);
  const [header, ...rows] = lines;
  return [header, ...rows.filter((row) => test(row.replace(/,[^,]*$/, "")))].join("\n") + "\n";
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const fetchedAt = new Date().toISOString();
  const files = {};
  const save = (name, body, source) => {
    writeFileSync(join(OUT, name), body);
    files[name] = { source, fetchedAt };
    console.log(`wrote data/public/${name} (${body.length} bytes)`);
  };

  save("job_exposure.csv", await get(SOURCES.jobExposure), SOURCES.jobExposure);
  // O*NET task statements for the three finance occupations, saved so tests can check the join offline.
  const onetRows = (await get(SOURCES.onetTasks))
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split("\t"))
    .filter((cols) => ONET_CODES.includes(cols[0]));
  const onetTasks = new Set(onetRows.map((cols) => cols[2]));
  const onetCsv = ["occCode,task", ...onetRows.map((cols) => `${cols[0]},"${cols[2].replace(/"/g, '""')}"`)].join("\n") + "\n";
  save("onet_tasks.csv", onetCsv, SOURCES.onetTasks);

  // Keep the finance keyword rows plus every task statement of the three occupations (union).
  save(
    "task_penetration.csv",
    filterCsv(await get(SOURCES.taskPenetration), (t) => FINANCE_WORDS.test(t) || onetTasks.has(taskText(t))),
    SOURCES.taskPenetration,
  );

  const holidays = [
    ...JSON.parse(await get(SOURCES.holidays2026)),
    ...JSON.parse(await get(SOURCES.holidays2027)),
  ].map(({ date, localName, name, global, counties }) => ({ date, localName, name, global, counties }));
  save("holidays-ie.json", JSON.stringify(holidays, null, 2) + "\n", [SOURCES.holidays2026, SOURCES.holidays2027].join(" "));

  save("cso-ica237.csv", await get(SOURCES.csoIca237), SOURCES.csoIca237);
  const eurostat = JSON.parse(await get(SOURCES.eurostat));
  save("eurostat-isoc_eb_ain2.json", JSON.stringify(eurostat, null, 2) + "\n", SOURCES.eurostat);

  writeFileSync(join(OUT, "sources.json"), JSON.stringify(files, null, 2) + "\n");
  console.log("wrote data/public/sources.json");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
