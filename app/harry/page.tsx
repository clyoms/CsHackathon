import type { Metadata } from "next";
import Link from "next/link";
import { AskBox } from "@/components/harry/AskBox";
import { adoptionByTeam, benchmarks, costPanel, frameActiveShare } from "@/components/harry/data";
import { harryFixtureWorld } from "@/components/harry/fixtures";
import styles from "@/components/harry/harry.module.css";
import { LiteracyLog } from "@/components/harry/LiteracyLog";
import { AdoptionTable, BenchmarkBars, CostStats, Panel } from "@/components/harry/Panels";
import { loadCsoAdoption, loadEurostatAdoption } from "@/data/public";

export const metadata: Metadata = { title: "Harry view · Frame Next" };

export default function HarryPage() {
  const world = harryFixtureWorld();
  const teams = adoptionByTeam(world.staff, world.usage);
  const share = frameActiveShare(world.staff, world.usage);
  const marks = benchmarks(loadCsoAdoption(), loadEurostatAdoption());
  const cost = costPanel(world.meter);
  const names = Object.fromEntries(world.staff.map((s) => [s.id, s.name]));

  return (
    <main className={styles.page}>
      <p>
        <Link href="/">← Frame Next</Link>
      </p>
      <h1>Harry view</h1>
      <p className={styles.lede}>How the firm uses AI, what it costs per task, and the record of AI literacy measures.</p>

      <div className={styles.grid}>
        <Panel
          title="Adoption by team"
          explain="Active users, prompts and the share of AI outputs people checked, from usage records (synthetic). How people check matters more than how much they use AI."
        >
          <AdoptionTable teams={teams} />
        </Panel>

        <Panel
          title="Frame against Ireland and the EU"
          explain="CSO and Eurostat count enterprises that use any AI. Frame's bar counts staff, so read it as a rough guide, not a like-for-like match. Hover a figure for its source."
        >
          <BenchmarkBars frameShare={share} benchmarks={marks} />
        </Panel>

        <Panel
          title="Cost per task"
          explain="Tokens and euros per finished task from the token meter (synthetic). Euros show once a human fills data/public/prices.json. A few long, unclear tasks take a large share."
        >
          <CostStats cost={cost} />
        </Panel>

        <Panel
          title="AI literacy log"
          explain="Each time a recommendation is shown or adopted, it is logged as evidence of AI literacy measures under EU AI Act Article 4 (synthetic entries). Export it as a CSV."
        >
          <LiteracyLog entries={world.literacyLog} names={names} />
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
