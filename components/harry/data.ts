// Builds the numbers on Harry's page. Pure: no I/O.
import type { MeterReading, Staff, UsageRecord } from "@/contract/types";
import type { CsoAdoption, EurostatAdoption } from "@/data/public";

export interface TeamAdoption {
  team: string;
  staff: number;
  activeUsers: number;
  prompts: number;
  /** Share of outputs checked, weighted by prompts. Null with no prompts. */
  verifiedRate: number | null;
}

/** Active users, prompts and verified rate per team, sorted by team name. */
export function adoptionByTeam(staff: Staff[], usage: UsageRecord[]): TeamAdoption[] {
  const teams = new Map<string, TeamAdoption & { checked: number; users: Set<string> }>();
  for (const s of staff) {
    const t = teams.get(s.team) ?? { team: s.team, staff: 0, activeUsers: 0, prompts: 0, verifiedRate: null, checked: 0, users: new Set() };
    t.staff += 1;
    teams.set(s.team, t);
  }
  const teamOf = new Map(staff.map((s) => [s.id, s.team]));
  for (const u of usage) {
    const t = teams.get(teamOf.get(u.staffId) ?? "");
    if (!t || u.prompts <= 0) continue;
    t.users.add(u.staffId);
    t.prompts += u.prompts;
    t.checked += u.verified * u.prompts;
  }
  return [...teams.values()]
    .map(({ checked, users, ...t }) => ({ ...t, activeUsers: users.size, verifiedRate: t.prompts > 0 ? checked / t.prompts : null }))
    .sort((a, b) => a.team.localeCompare(b.team));
}

/** Share of staff who used AI at least once. */
export function frameActiveShare(staff: Staff[], usage: UsageRecord[]): number {
  if (staff.length === 0) return 0;
  const ids = new Set(staff.map((s) => s.id));
  const active = new Set(usage.filter((u) => u.prompts > 0 && ids.has(u.staffId)).map((u) => u.staffId));
  return active.size / staff.length;
}

export interface CostPanel {
  finishedTasks: number;
  tokensPerFinishedTask: number | null;
  /** Null when prices.json has no price. */
  eurosPerFinishedTask: number | null;
  /** Share of spend in the top 10% of finished tasks, by euros when priced, else by tokens. */
  topTenShare: number | null;
  measuredIn: "euros" | "tokens";
}

export function costPanel(readings: MeterReading[]): CostPanel {
  const done = readings.filter((r) => r.finished);
  const tokens = (r: MeterReading) => r.tokensIn + r.tokensOut;
  const priced = done.length > 0 && done.every((r) => r.euros !== null);
  const spend = (r: MeterReading) => (priced ? (r.euros as number) : tokens(r));
  if (done.length === 0) {
    return { finishedTasks: 0, tokensPerFinishedTask: null, eurosPerFinishedTask: null, topTenShare: null, measuredIn: priced ? "euros" : "tokens" };
  }
  const total = done.reduce((s, r) => s + spend(r), 0);
  const top = Math.max(1, Math.ceil(done.length * 0.1));
  const topSpend = [...done].sort((a, b) => spend(b) - spend(a)).slice(0, top).reduce((s, r) => s + spend(r), 0);
  return {
    finishedTasks: done.length,
    tokensPerFinishedTask: done.reduce((s, r) => s + tokens(r), 0) / done.length,
    eurosPerFinishedTask: priced ? total / done.length : null,
    topTenShare: total > 0 ? topSpend / total : null,
    measuredIn: priced ? "euros" : "tokens",
  };
}

export interface Benchmark {
  label: string;
  percent: number;
  year: number;
  source: string;
}

/** Latest CSO all-enterprise AI share and latest Eurostat shares for Ireland and the EU. */
export function benchmarks(cso: CsoAdoption[], eurostat: EurostatAdoption[]): Benchmark[] {
  const out: Benchmark[] = [];
  const csoAll = cso
    .filter((r) => r.statistic === "Enterprises using Artificial Intelligence" && r.sizeClass === "All Enterprises" && r.percent !== null)
    .sort((a, b) => b.year - a.year)[0];
  if (csoAll) out.push({ label: "Irish enterprises using AI (CSO)", percent: csoAll.percent as number, year: csoAll.year, source: csoAll.source });

  const latest = (geo: EurostatAdoption["geo"], nace: string) =>
    eurostat.filter((r) => r.geo === geo && r.nace === nace).sort((a, b) => b.year - a.year)[0];
  for (const [geo, name] of [["IE", "Ireland"], ["EU27_2020", "EU"]] as const) {
    const pro = latest(geo, "M69-M71");
    if (pro) out.push({ label: `${name}: professional services firms using AI, NACE M69-M71 (Eurostat)`, percent: pro.percent, year: pro.year, source: pro.source });
  }
  return out;
}
