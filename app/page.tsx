import Link from "next/link";
import { RolePicker, type Role } from "@/components/home/RolePicker";
import { roleNumbers } from "@/components/home/numbers";
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
      href: "/harry",
      monogram: "H",
      name: "Harry",
      role: "AI and Automation Analyst",
      promise: "Track how the firm uses AI and what it costs.",
      number: n.harry,
    },
  ];

  return (
    <main className={styles.page}>
      <p className={styles.kicker}>Frame Next</p>
      <h1 className={styles.title}>Who are you today?</h1>
      <p className={styles.lead}>Pick your line. Each one shows what AI could do for you before the next deadline.</p>
      <RolePicker roles={roles} />
      <p className={styles.library}>
        <Link href="/skills">Browse the skills library</Link>: every skill, hook and plugin, ready to copy or export.
      </p>
      <p className={styles.foot}>Numbers marked synthetic come from made-up Frame data for the demo.</p>
    </main>
  );
}
