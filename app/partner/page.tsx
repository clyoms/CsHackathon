import type { Metadata } from "next";
import Link from "next/link";
import { getWorld } from "@/app/api/ask/world";
import { AskBox } from "@/components/partner/AskBox";
import { CrunchCalendar } from "@/components/partner/CrunchCalendar";
import { buildPartnerView } from "@/components/partner/data";
import { EngagementTable } from "@/components/partner/EngagementTable";
import { HoursChart } from "@/components/partner/HoursChart";
import { Num, euro, hours } from "@/components/partner/Num";
import styles from "@/components/partner/partner.module.css";
import { HOURS_BACK_ASSUMPTION } from "@/engine/productivity";

export const metadata: Metadata = { title: "Partner view · Frame Next" };
// The calendar starts from today, so render on each request rather than at build time.
export const dynamic = "force-dynamic";

export default function PartnerPage() {
  // Real data: data/frame engagements and timesheets, data/public scores and deadlines, catalogue.
  const view = buildPartnerView(getWorld());
  const overRows = view.rows.filter((r) => r.moneyLost > 0);
  const totalLost = overRows.reduce((s, r) => s + r.moneyLost, 0);
  const hoursOver = overRows.reduce((s, r) => s + r.varianceHours, 0);
  const aiReady = view.rows.reduce((s, r) => s + r.tasks.reduce((t, x) => t + x.aiReadyHours, 0), 0);
  const nextDue = view.weeks.flatMap((w) => w.deadlines)[0];

  return (
    <main className={styles.page}>
      <p className={styles.back}>
        <Link href="/">← Who are you today?</Link>
      </p>
      <p className={styles.kicker}>Partner view</p>
      <h1 className={styles.title}>Which jobs are losing money, and why?</h1>
      <p className={styles.lede}>Fees eaten by hours over budget, the tasks AI could take on, and the weeks the deadlines bunch up.</p>

      <dl className={styles.stats}>
        <div>
          <dt>Fee lost to over-runs</dt>
          <dd className={styles.statValue}>
            <Num synthetic detail={`Sum over the ${overRows.length} jobs over budget: hours over × each job's budgeted rate.`}>
              <span className={styles.total}>{euro(totalLost)}</span>
            </Num>
          </dd>
        </div>
        <div>
          <dt>Jobs over budget</dt>
          <dd className={styles.statValue}>
            <Num synthetic detail={`${hours(hoursOver)} logged beyond budget across these jobs.`}>
              <span className={styles.total}>{overRows.length} of {view.rows.length}</span>
            </Num>
          </dd>
        </div>
        <div>
          <dt>AI-ready hours</dt>
          <dd className={styles.statValue}>
            <Num synthetic detail="Each task's logged hours × its Anthropic Economic Index usage share, summed over every job.">
              <span className={styles.total}>{hours(aiReady)}</span>
            </Num>
          </dd>
        </div>
      </dl>

      <section className={styles.section}>
        <h2>Hours against budget</h2>
        <p className={styles.explain}>Hover or tap a figure to see how it is worked out.</p>
        <HoursChart rows={view.rows} />
      </section>

      <section className={styles.section}>
        <h2>Crunch calendar</h2>
        <p className={styles.explain}>
          The next eight weeks. Red ticks are filing deadlines, linked to their official source. &quot;Unconfirmed&quot; dates were
          worked out from a rule, not read on the official page.
          {nextDue ? ` Next up: ${nextDue.deadline.label}.` : ""}
        </p>
        <CrunchCalendar weeks={view.weeks} today={view.today} />
      </section>

      <section className={styles.section}>
        <h2>Engagements, by money lost</h2>
        <p className={styles.explain}>
          Click a client to see its tasks. Hours, fees and rates are synthetic. AI usage shares come from the Anthropic Economic
          Index (hover for the source). {HOURS_BACK_ASSUMPTION}
        </p>
        <EngagementTable rows={view.rows} />
      </section>

      <section className={styles.section}>
        <h2>Ask</h2>
        <p className={styles.explain}>Answers use only the numbers on this page and name the source of each one.</p>
        <AskBox />
      </section>
    </main>
  );
}
