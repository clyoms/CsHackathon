// Live numbers for the home role cards, worked out from the same engines the views use.
// Server only (the world loader reads files). No numbers are typed in.
import { getWorld } from "@/app/api/ask/world";
import { AOIFE_ID } from "@/data/frame";
import { rankByMoneyLost } from "@/engine/productivity";
import { recommend } from "@/engine/recommend";
import { adoptionByTeam } from "@/components/harry/data";

export interface RoleNumber {
  value: string;
  caption: string;
  synthetic: boolean;
}

const dayMonth = (iso: string) =>
  new Intl.DateTimeFormat("en-IE", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const euro = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export function roleNumbers(): { employee: RoleNumber | null; partner: RoleNumber | null; harry: RoleNumber | null } {
  const world = getWorld();

  const staff = world.staff.find((s) => s.id === AOIFE_ID);
  const rec = staff ? recommend({ ...world, staff, lines: world.timesheets }) : null;
  const employee = rec
    ? { value: `${rec.hoursBackEstimate} h`, caption: `back before ${dayMonth(rec.deadline.date)}`, synthetic: rec.synthetic }
    : null;

  const top = rankByMoneyLost(world.engagements, world.timesheets)[0];
  const partner = top && top.moneyLost > 0 ? { value: euro(top.moneyLost), caption: `lost on ${top.client}`, synthetic: true } : null;

  const teams = adoptionByTeam(world.staff, world.usage).filter((t) => t.verifiedRate !== null);
  const lowest = teams.sort((a, b) => (a.verifiedRate ?? 0) - (b.verifiedRate ?? 0))[0];
  const harry = lowest
    ? { value: `${Math.round((lowest.verifiedRate ?? 0) * 100)}%`, caption: `of ${lowest.team} AI output checked`, synthetic: true }
    : null;

  return { employee, partner, harry };
}
