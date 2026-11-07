import type { Metadata } from "next";
import Link from "next/link";
import { getWorld } from "@/app/api/ask/world";
import { AskBox } from "@/components/ai-lead/AskBox";
import { adoptionByTeam, benchmarks, costPanel, frameActiveShare } from "@/components/ai-lead/data";
import styles from "@/components/ai-lead/ai-lead.module.css";
import { LiteracyLog } from "@/components/ai-lead/LiteracyLog";
import { BenchmarkChart, CheckedChart } from "@/components/ai-lead/Charts";
import { AdoptionTable, CostStats, Panel } from "@/components/ai-lead/Panels";
import { literacyFromRecommendations, meterFromUsage } from "@/components/ai-lead/real";
import type { Recommendation } from "@/contract/types";
import { loadCsoAdoption, loadEurostatAdoption } from "@/data/public";
import { lessonEntries, newestFirst } from "@/engine/literacy";
import { getLessonStore } from "@/engine/literacy/store";
import { MODEL, loadPrice } from "@/engine/meter";
import { recommend } from "@/engine/recommend";
import { pct } from "@/components/ai-lead/Num";

export const metadata: Metadata = { title: "AI Lead view · Handoff" };
// The literacy log is dated today, so render on each request.
export const dynamic = "force-dynamic";

export default function AiLeadPage() {
  // Real data: data/frame staff and usage (synthetic), data/public benchmarks (real), catalogue.
  const world = getWorld();
  const teams = adoptionByTeam(world.staff, world.usage);
  const share = frameActiveShare(world.staff, world.usage);
  const marks = benchmarks(loadCsoAdoption(), loadEurostatAdoption());
  const cost = costPanel(meterFromUsage(world.usage, loadPrice(MODEL)));
  const recs = world.staff
    .map((staff) => recommend({ ...world, staff, lines: world.timesheets }))
    .filter((r): r is Recommendation => r !== null);
  // Lessons people finished (saved by /api/literacy) beside today's recommendations, newest first.
  const lessons = lessonEntries(getLessonStore().read());
  // Demo data: about two in three people have said they will try their pick, so the log shows both answers.
  // Real "I'll try it" clicks saved by /api/literacy override the demo answer for that person and item.
  const saved = getLessonStore().read().filter((e) => e.measure === "adopted");
  const clicked = (e: { staffId: string; itemId: string }) => saved.some((s) => s.staffId === e.staffId && s.itemId === e.itemId);
  const shown = literacyFromRecommendations(recs, world.today).map((e, i) => (clicked(e) || i % 3 !== 2 ? { ...e, adopted: true } : e));
  const literacyLog = newestFirst([...shown, ...lessons]);
  const names = Object.fromEntries(world.staff.map((s) => [s.id, s.name]));
  const titles = Object.fromEntries(recs.map((r) => [r.item.id, r.item.title]));

  const measured = teams.filter((t) => t.verifiedRate !== null);
  const lowest = [...measured].sort((a, b) => (a.verifiedRate ?? 0) - (b.verifiedRate ?? 0))[0];
  const topMark = [...marks].sort((a, b) => b.percent - a.percent)[0];
  const ahead = topMark ? share * 100 >= topMark.percent : false;
  const notTried = shown.filter((e) => !e.adopted).map((e) => names[e.staffId] ?? e.staffId);
  const followUp = notTried.slice(0, 3).join(", ") + (notTried.length > 3 ? ` and ${notTried.length - 3} more` : "");

  return (
    <main className={styles.page}>
      <h1>AI Lead view</h1>
      <p className={styles.lede}>How the firm uses AI, what it costs per task, and who is building AI skills. Each panel ends with one next step.</p>

      <div className={styles.grid}>
        <Panel
          title="Adoption by team"
          explain="Active users, prompts and the share of AI outputs people checked. How people check matters more than how much they use AI."
          tells={
            lowest ? (
              <>
                {lowest.team} checks {pct(lowest.verifiedRate ?? 0)} of its AI output, the lowest of any team. Unchecked output is where mistakes get through.
              </>
            ) : (
              "No team has used AI yet."
            )
          }
          next={
            lowest ? (
              <>Run a 15-minute checking session with {lowest.team} and make &ldquo;check before you send&rdquo; the default.</>
            ) : (
              "Share the skills library with every team."
            )
          }
        >
          <CheckedChart teams={teams} />
          <AdoptionTable teams={teams} />
        </Panel>

        <Panel
          title="Your firm against Ireland and the EU"
          explain="CSO and Eurostat count enterprises that use any AI. Your bar counts staff, so read it as a rough guide. Hover a bar for its source."
          tells={
            topMark ? (
              <>
                {pct(share)} of your staff used AI this period, {ahead ? "ahead of" : "behind"} the {Math.round(topMark.percent)}% of {topMark.label} ({topMark.year}).
              </>
            ) : (
              <>{pct(share)} of your staff used AI this period.</>
            )
          }
          next={
            ahead
              ? "Usage is not the gap. Put the effort into checking quality and the 4D course instead."
              : "Point the teams with the fewest active users to one starter skill each."
          }
        >
          <BenchmarkChart frameShare={share} benchmarks={marks} />
        </Panel>

        <Panel
          title="Cost per task"
          explain="A task is one person's AI work in one category on one day."
          tells={
            cost.topTenShare !== null ? (
              <>
                The heaviest 10% of tasks use {pct(cost.topTenShare)} of all {cost.measuredIn}. A few long tasks drive most of the spend.
              </>
            ) : (
              "No finished tasks to measure yet."
            )
          }
          next={
            cost.eurosPerFinishedTask === null
              ? "Add the model price in data/public/prices.json to see euros, then review the heaviest tasks first."
              : "Review the heaviest tasks first: turning a repeated one into a skill cuts its tokens."
          }
        >
          <CostStats cost={cost} />
        </Panel>

        <Panel
          title="AI literacy log"
          explain="Every recommendation shown and every finished 4D lesson, kept as evidence of AI literacy measures under EU AI Act Article 4. Export it as a CSV."
          tells={
            <>
              {shown.length - notTried.length} of {shown.length} people said they will try their pick.
              {notTried.length > 0 ? ` ${notTried.length} have not yet.` : " Everyone has."}
            </>
          }
          next={notTried.length > 0 ? <>Follow up this week with {followUp}, and send them the 4D course.</> : "Ask how it went and log the hours saved."}
        >
          <LiteracyLog entries={literacyLog} names={names} titles={titles} />
          <p className={styles.explain}>
            <Link href="/literacy">Open the 4D literacy course</Link>
          </p>
        </Panel>
      </div>

      <section className={styles.section}>
        <h2>Ask</h2>
        <p className={styles.explain}>Answers use only the numbers the engine gives and name the source of each one.</p>
        <AskBox />
      </section>
    </main>
  );
}
