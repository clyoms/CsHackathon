import Link from "next/link";

const views = [
  { href: "/employee", label: "Employee", note: "What should I hand to AI before my next deadline?" },
  { href: "/partner", label: "Partner", note: "Which jobs are losing money, and why?" },
  { href: "/harry", label: "Harry", note: "How is the firm adopting AI, and what does it cost?" },
];

export default function Home() {
  return (
    <main className="home">
      <h1>Frame Next</h1>
      <p>Pick a view.</p>
      <ul className="views">
        {views.map((v) => (
          <li key={v.href}>
            <Link href={v.href}>{v.label}</Link>
            <span>{v.note}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
