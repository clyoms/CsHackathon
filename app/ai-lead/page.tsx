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

export const metadata: Metadata = { title: "AI Lead view · Frame Next" };
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
  const literacyLog = newestFirst([...literacyFromRecommendations(recs, world.today), ...lessons]);
  const names = Object.fromEntries(world.staff.map((s) => [s.id, s.name]));

  return (
    <main className={styles.page}>
      <p className={styles.back}>
        <Link href="/">← Who are you today?</Link>
      </p>
      <h1>AI Lead view</h1>
      <p className={styles.lede}>How the firm uses AI, what it costs per task, and the record of AI literacy measures.</p>

      <div className={styles.grid}>
        <Panel
          title="Adoption by team"
          explain="Active users, prompts and the share of AI outputs people checked, from usage records. How people check matters more than how much they use AI."
        >
          <CheckedChart teams={teams} />
          <AdoptionTable teams={teams} />
        </Panel>

        <Panel
          title="Frame against Ireland and the EU"
          explain="CSO and Eurostat count enterprises that use any AI. Frame's bar counts staff, so read it as a rough guide, not a like-for-like match. Hover a bar for its source."
        >
          <BenchmarkChart frameShare={share} benchmarks={marks} />
        </Panel>

        <Panel
          title="Cost per task"
          explain="One task is one person's AI work in one category on one day, from usage records. Euros show once a human fills data/public/prices.json. A few heavy tasks take a large share."
        >
          <CostStats cost={cost} />
        </Panel>

        <Panel
          title="AI literacy log"
          explain="Each recommendation the engine shows today and each finished 4D lesson is logged as evidence of AI literacy measures under EU AI Act Article 4. “I’ll try it” clicks are not stored here yet. Export it as a CSV."
        >
          <LiteracyLog entries={literacyLog} names={names} />
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
