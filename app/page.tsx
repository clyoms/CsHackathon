import Link from "next/link";
import { RolePicker, type Role } from "@/components/home/RolePicker";
import { roleNumbers } from "@/components/home/numbers";
import { Orbit } from "@/components/home/Orbit";
import styles from "@/components/home/home.module.css";

// The live numbers depend on today's date and the data, so they are worked out per request.
export const dynamic = "force-dynamic";

export default function Home() {
  const n = roleNumbers();
  const roles: Role[] = [
    {
      href: "/employee",
      monogram: "A",
      name: "Aoife",
      role: "Tax Assistant, Cork",
      promise: "Find the one thing to hand to AI before your next deadline.",
      number: n.employee,
      tone: "violet",
    },
    {
      href: "/partner",
      monogram: "P",
      name: "Partner",
      role: "Engagement partner",
      promise: "See which jobs are losing money, and why.",
      number: n.partner,
      tone: "orchid",
    },
    {
      href: "/ai-lead",
      monogram: "AI",
      name: "AI Lead",
      role: "AI and Automation Analyst",
      promise: "Track how the firm uses AI and what it costs.",
      number: n.aiLead,
      tone: "indigo",
    },
  ];

  return (
    <div className={styles.shell}>
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <svg viewBox="0 0 34 34" aria-hidden="true" className={styles.logo}>
            <rect x="1" y="1" width="32" height="32" rx="10" />
            <path d="M11 10h12M11 10v14M11 17h8" />
            <circle cx="24" cy="23" r="2.4" />
          </svg>
          Frame Next
        </Link>
        <nav aria-label="Main" className={styles.links}>
          <Link href="/employee">Employee</Link>
          <Link href="/partner">Partner</Link>
          <Link href="/ai-lead">AI Lead</Link>
          <Link href="/skills" className={styles.pill}>
            Skills library
          </Link>
        </nav>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.copy}>
            <p className={styles.chip}>
              <span aria-hidden="true" />
              Deadline week at FRAME
            </p>
            <h1 className={styles.title}>
              Who are you <em>today?</em>
            </h1>
            <p className={styles.lead}>Pick your line. Each one shows what AI could take off your desk before the next deadline.</p>
            <div className={styles.ctas}>
              <Link href="/employee" className={styles.primary}>
                Start as Aoife
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link href="/skills" className={styles.ghost}>
                Browse skills
              </Link>
            </div>
          </div>
          <Orbit numbers={[n.employee?.value, n.partner?.value, n.aiLead?.value]} />
        </section>

        <section aria-labelledby="pick" className={styles.pick}>
          <h2 id="pick" className={styles.eyebrow}>
            Choose your view
          </h2>
          <RolePicker roles={roles} />
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Real numbers show their source on hover.</span>
      </footer>
    </div>
  );
}
