import type { Metadata } from "next";
import { getWorld } from "@/app/api/ask/world";
import { AskBox } from "@/components/partner/AskBox";
import { UpcomingDeadlines, daysBetween } from "@/components/partner/UpcomingDeadlines";
import { Insight } from "@/components/site/Insight";
import { buildPartnerView } from "@/components/partner/data";
import { EngagementTable } from "@/components/partner/EngagementTable";
import { HoursChart } from "@/components/partner/HoursChart";
import { Num, euro, hours } from "@/components/partner/Num";
import styles from "@/components/partner/partner.module.css";
import { HOURS_BACK_ASSUMPTION } from "@/engine/productivity";

export const metadata: Metadata = { title: "Partner view · Handoff" };
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
  const worst = overRows[0];
  const bestAi = [...view.rows].filter((r) => r.recommended).sort((a, b) => (b.recommended?.aiReadyHours ?? 0) - (a.recommended?.aiReadyHours ?? 0))[0];
  const nextDays = nextDue ? daysBetween(view.today, nextDue.deadline.date) : null;

  return (
    <main className={styles.page}>
      <p className={styles.kicker}>Partner view</p>
      <h1 className={styles.title}>Which jobs are losing money, and why?</h1>
      <p className={styles.lede}>Fees eaten by hours over budget, the tasks AI could take on, and the deadlines coming up.</p>

      <dl className={styles.stats}>
        <div>
          <dt>Fee lost to over-runs</dt>
          <dd className={styles.statValue}>
            <Num detail={`Sum over the ${overRows.length} jobs over budget: hours over × each job's budgeted rate.`}>
              <span className={styles.total}>{euro(totalLost)}</span>
            </Num>
          </dd>
        </div>
        <div>
          <dt>Jobs over budget</dt>
          <dd className={styles.statValue}>
            <Num detail={`${hours(hoursOver)} logged beyond budget across these jobs.`}>
              <span className={styles.total}>{overRows.length} of {view.rows.length}</span>
            </Num>
          </dd>
        </div>
        <div>
          <dt>AI-ready hours</dt>
          <dd className={styles.statValue}>
            <Num detail="Each task's logged hours × its Anthropic Economic Index usage share, summed over every job.">
              <span className={styles.total}>{hours(aiReady)}</span>
            </Num>
          </dd>
        </div>
      </dl>
      <Insight
        tells={<>{overRows.length} jobs ran {hours(hoursOver)} over budget. There are {hours(aiReady)} of AI-ready work across all jobs, {aiReady >= hoursOver ? "more than" : "less than"} the overrun.</>}
        next={<>Start with the job at the top of the table below: it loses the most fee.</>}
      />

      <section className={styles.section}>
        <h2>Hours against budget</h2>
        <p className={styles.explain}>Hover or tap a figure to see how it is worked out.</p>
        <HoursChart rows={view.rows} />
        {worst ? (
          <Insight
            tells={<>{worst.client} is {hours(worst.varianceHours)} over budget, the biggest overrun, costing {euro(worst.moneyLost)} in fee.</>}
            next={<>Agree a scope change or fee top-up with {worst.client} before more hours go in, and hand its AI-ready tasks to AI first.</>}
          />
        ) : (
          <Insight tells="Every job is inside its budget." next="Keep an eye on the jobs closest to their budget line." />
        )}
      </section>

      <section className={styles.section}>
        <h2>Upcoming deadlines</h2>
        <p className={styles.explain}>Filing dates in the next eight weeks. Click a date for its official source.</p>
        <UpcomingDeadlines weeks={view.weeks} today={view.today} />
        {nextDue && nextDays !== null ? (
          <Insight
            tells={<>The next deadline is {nextDue.deadline.label} in {nextDays} day{nextDays === 1 ? "" : "s"}{nextDue.clients.length > 0 ? <>, with {nextDue.clients.length} client{nextDue.clients.length === 1 ? "" : "s"} due</> : null}.</>}
            next={<>Check those jobs are on track this week and start their AI-ready tasks now, not in the final days.</>}
          />
        ) : (
          <Insight tells="No filing deadlines in the next eight weeks." next="Use the quiet weeks to set up skills for the next busy period." />
        )}
      </section>

      <section className={styles.section}>
        <h2>Engagements, by money lost</h2>
        <p className={styles.explain}>
          Click a client to see its tasks. AI usage shares come from the Anthropic Economic
          Index (hover for the source). {HOURS_BACK_ASSUMPTION}
        </p>
        <EngagementTable rows={view.rows} />
        {bestAi?.recommended ? (
          <Insight
            tells={<>{bestAi.recommended.title} could cover {hours(bestAi.recommended.aiReadyHours)} of AI-ready work on {bestAi.client}, the most of any job.</>}
            next={<>Send {bestAi.recommended.title} to the team on {bestAi.client} from the skills library.</>}
          />
        ) : null}
      </section>

      <section className={styles.section}>
        <h2>Ask</h2>
        <p className={styles.explain}>Answers use only the numbers on this page and name the source of each one.</p>
        <AskBox />
      </section>
    </main>
  );
}
