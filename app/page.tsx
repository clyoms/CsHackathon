import Link from "next/link";
import { RolePicker, type Role } from "@/components/home/RolePicker";
import { roleNumbers } from "@/components/home/numbers";
import { HowItWorks } from "@/components/home/HowItWorks";
import styles from "@/components/home/home.module.css";

// The live numbers depend on today's date and the data, so they are worked out per request.
export const dynamic = "force-dynamic";

export default function Home() {
  const n = roleNumbers();
  const roles: Role[] = [
    {
      href: "/employee",
      monogram: "E",
      name: "Employee",
      role: "Anyone on the team",
      promise: "Find the one thing to hand to AI before the next deadline.",
      number: n.employee,
    },
    {
      href: "/partner",
      monogram: "P",
      name: "Partner",
      role: "Engagement partner",
      promise: "See which jobs are losing money, and why.",
      number: n.partner,
    },
    {
      href: "/ai-lead",
      monogram: "AI",
      name: "AI Lead",
      role: "AI and automation lead",
      promise: "Track how the firm uses AI and what it costs.",
      number: n.aiLead,
    },
  ];

  return (
    <div className={styles.shell}>
      <main>
        <section className={styles.hero}>
          <div className={styles.copy}>
            <p className={styles.chip}>
              <span aria-hidden="true" />
              Admin view
            </p>
            <h1 className={styles.title}>
              Every view of the platform, <em>in one place.</em>
            </h1>
            <p className={styles.lead}>
              You are signed in as an admin. Open any view below to see exactly what that person sees, with live numbers.
            </p>
            <div className={styles.ctas}>
              <Link href="/employee" className={styles.primary}>
                Open the employee view
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link href="/skills" className={styles.ghost}>
                Browse skills
              </Link>
            </div>
          </div>
          <HowItWorks />
        </section>

        <section aria-labelledby="pick" className={styles.pick}>
          <h2 id="pick" className={styles.eyebrow}>
            Views
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
