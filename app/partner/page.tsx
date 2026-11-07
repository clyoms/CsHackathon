import type { Metadata } from "next";
import Link from "next/link";
import { AskBox } from "@/components/partner/AskBox";
import { CrunchCalendar } from "@/components/partner/CrunchCalendar";
import { EngagementTable } from "@/components/partner/EngagementTable";
import { buildPartnerView } from "@/components/partner/data";
import { partnerFixtureWorld } from "@/components/partner/fixtures";
import styles from "@/components/partner/partner.module.css";
import { HOURS_BACK_ASSUMPTION } from "@/engine/productivity";

export const metadata: Metadata = { title: "Partner view · Frame Next" };
// The calendar starts from today, so render on each request rather than at build time.
export const dynamic = "force-dynamic";

function today(): string {
  return process.env.FRAME_TODAY ?? new Date().toISOString().slice(0, 10);
}

export default function PartnerPage() {
  const view = buildPartnerView(partnerFixtureWorld(today()));

  return (
    <main className={styles.page}>
      <p>
        <Link href="/">← Frame Next</Link>
      </p>
      <h1>Partner view</h1>
      <p className={styles.lede}>Which jobs are losing money, which tasks AI could take, and when the crunch weeks fall.</p>

      <section className={styles.section}>
        <h2>Ask</h2>
        <p className={styles.explain}>Answers use only the numbers on this page and name the source of each one.</p>
        <AskBox />
      </section>

      <section className={styles.section}>
        <h2>Engagements, by money lost</h2>
        <p className={styles.explain}>
          Money lost is the fee eaten by hours over budget, priced at the budgeted rate. Click a client to see its tasks.
          Hours, fees and rates are synthetic. AI usage shares come from the Anthropic Economic Index (hover for the
          source). {HOURS_BACK_ASSUMPTION}
        </p>
        <EngagementTable rows={view.rows} />
      </section>

      <section className={styles.section}>
        <h2>Crunch calendar: next 8 weeks</h2>
        <p className={styles.explain}>
          Weeks with a filing deadline are outlined in red. Each date links to its official source. &quot;Unconfirmed&quot; dates
          were worked out from a rule, not read on the official page.
        </p>
        <CrunchCalendar weeks={view.weeks} />
      </section>
    </main>
  );
}
