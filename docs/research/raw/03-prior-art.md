# Prior art: enterprise AI adoption, accounting AI, evidence, literacy (7 Nov 2026)

Method: web searches only, no page deep-reads. Most facts come from search summaries and vendor or press pages. Anything marked [UNVERIFIED] was not confirmed against a primary source.

## 1. Competitor table (AI adoption measurement and coaching)

| Name | Measures | For whom | Gap |
|---|---|---|---|
| Microsoft Copilot Dashboard (Viva Insights) | Readiness, adoption (per app: Teams, Outlook, Word, Excel...), impact, sentiment surveys. Group-level only (min group size 10 by default). Limited under 50 licences. | IT and HR leaders in Microsoft 365 firms | Copilot only. Aggregated, so no per-person "what to build next". No link to billing or revenue. |
| Worklytics | Who uses which AI tool and how often; benchmarks by team, role, peers. Pulls from Copilot, ChatGPT Ent, Gemini, Claude, GitHub Copilot (about 9 tools, per Larridin [UNVERIFIED]) | People analytics and HR | Counts usage; no concrete automation recommendations. |
| Larridin (Scout) | Adoption, "proficiency" benchmarking, spend, governance, productivity correlation via surveys | Enterprise AI leads, finance | Closest rival on paper. Vendor-written comparisons only [UNVERIFIED]. Survey-based outcome measures; no skill/plugin/hook generation seen. |
| Faros AI, DX, Jellyfish | Engineering delivery metrics vs AI use. Faros: 22,000 developers, 4,000+ teams, individual gains not visible at company level (Faros's own claim) | Software engineering orgs | Developer-only. Not accounting or non-coding staff. |
| Claude Enterprise analytics | Weekly active users, seat use, feature adoption, spend, Analytics API (admin pages disagree on role access) | Admins | Raw counts and spend. No coaching, no work-data link. |
| ChatGPT Enterprise analytics | Seats, activation, weekly actives, trends, credit and spend controls (June 2026). Aggregate only; admins cannot see prompts | Admins | Same: counts only, privacy-limited. |
| Section, Multiverse (AI proficiency and training) | Proficiency assessments and courses | L&D teams | Not found in searches [UNVERIFIED]. Assumed generic training, not tied to real usage logs. |
| Glean, Writer | Not searched. [UNVERIFIED] Both are enterprise AI platforms with their own admin analytics. | - | - |
| Big 4: KPMG Workbench, PwC (ChatGPT Enterprise reseller, "My AI" upskilling), Deloitte Zora AI, EY.ai | Platforms of agents. EY says 55,000+ staff trained; EY.ai gives 80,000 tax staff 150 agents. PwC rolling ChatGPT Enterprise to about 100,000 UK and US staff. | Their own staff and clients | Internal, not for sale. Figures from trade press, not firm releases [UNVERIFIED]. Platform and training push, not personalised per-person recommendations. |

## 2. Accounting-specific AI tools

- **Basis**: agents for categorisation, reconciliations, financial statements, tax return prep, audit testing, workpapers. Claims about 30% of the US Top 25 firms and about 30% time saving (openai.com/index/basis; vendor claim). Raised $100M at $1.15B, Feb 2026.
- **Digits**: accounting agents, says about 95% of bookkeeping automatable with its autonomous ledger (vendor claim, accountingtoday.com).
- **Xero JAX**: assistant for invoices, reconciliation, cash flow questions; target of 80%+ bank lines reconciled in real time; bill screening roadmap; multi-year Claude deal (xero.com media release, Sept to Oct 2025).
- **Accrual**: AI-native tax return prep and review.
- **Karbon AI, Numeric, Fieldguide, TaxGPT, Blue J, CCH Axcess AI**: not retrieved. [UNVERIFIED] General knowledge only: practice management, month-end close, audit workpapers, tax research.
- Pattern: these automate the accountant's client work. None coach the accountant on how they use AI.

## 3. Evidence table

| Claim | Number | Source | Date |
|---|---|---|---|
| Accountants using genAI shifted time from routine data entry | about 8.5% of time (about 3.5 h of a 40 h week) | Journal of Accountancy summary of Choi (Stanford GSB) and Xie (MIT Sloan): https://www.journalofaccountancy.com/news/2025/aug/calculating-ais-impact-on-cpas-new-study-quantifies-time-savings/ | Aug 2025 |
| Same study: faster month-end close | 7.5 days sooner | https://www.cfodive.com/news/ai-cuts-monthly-financial-close-time-75-days-mit-stanford-study-accounting-accountants/ | 2025 |
| Same study: more clients supported weekly; billable hours | +55% clients per week; +21% billable hours. CFO Brew says unique clients not significantly higher | https://www.cfobrew.com/stories/2025/08/21/accountants-are-benefitting-from-ai | Aug 2025 |
| Same study: ledger granularity; concern | +12%; 62% worried about errors. Sample: 277 accountants, 79 firms. Original paper not read [UNVERIFIED] | as above | 2025 |
| Experience matters | Senior accountants gained more; juniors over-rely or under-use AI | Journal of Accountancy | 2025 |
| Thomson Reuters Future of Professionals: expected saving | 5 h/week, about 240 h/year, about $19,000 per professional. Self-reported forecast, n=2,275 | https://www.thomsonreuters.com/en/press-releases/2025/june/the-ai-adoption-reality-check-firms-with-ai-strategies-are-twice-as-likely-to-see-ai-driven-revenue-growth-those-without-risk-falling-behind | Jun 2025 |
| TR: firms with a visible AI strategy | only 22% have one; those with one about 2x as likely to see revenue growth | same | Jun 2025 |
| Chartered Accountants Worldwide/Ipsos survey | 2,700+ accountants, 48 countries; 30% had employer AI training; 92% would take it if offered; 52% say skills/training is the biggest barrier; 30% say data security stops regular use | https://www.charteredaccountants.ie/News/pressrelease/2025/significant-enthusiasm-for-artificial-intelligence-(ai)-amongst-chartered-accountants-new-research-shows | Apr 2025 |
| Self-report vs measured gap (dev work, not accounting) | METR trial: developers felt 20% faster, were 19% slower (16 devs, 246 tasks). METR reportedly updated its design in 2026 [UNVERIFIED] | https://getdx.com/blog/metr-study-on-how-ai-affects-developer-productivity/ | 2025 |

No ACCA report found. ICAEW appears only as a survey partner (124 responses).

## 4. AI literacy frameworks

- **EU AI Act Article 4**: in force 2 Feb 2025. Commission Q&A (May 2025, https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers; read via law-firm summaries): firms should record and document measures taken; an internal log of trainings is acceptable; no external certificate; no fixed "sufficient level"; role-based and risk-proportionate; staff using a genAI chatbot for ordinary writing are in scope and should be told about hallucination. Enforcement by national market surveillance authorities from 2-3 Aug 2026.
- **Change to check**: law-firm commentary says the Digital Omnibus on AI, Regulation (EU) 2026/1744 (published about 24 Jul 2026), softened Article 4 from "ensure sufficient literacy" to "take measures to promote" literacy, with Commission and Member State support duties. [UNVERIFIED: check EUR-Lex before presenting.] Either way, "keep evidence of measures" is the safe framing.
- **Anthropic AI Fluency (4D)**: Delegation, Description, Discernment, Diligence; three modes (automation, augmentation, agency). Free course, CC BY-NC-SA 4.0, by Dakan and Feller with Anthropic. Useful as a scoring rubric for usage data.
- **UNESCO, DigComp**: not searched. [UNVERIFIED] Treat as general competence frameworks, not usage-based.

## 5. White space and the angle that would stand out

- **Usage to next build.** Dashboards report counts. Nobody found takes one person's real history and outputs a specific artefact: "you rewrote the same client-query email 14 times; here is a ready skill, hook or automation".
- **Closed loop with money.** Pair each recommendation with a before/after estimate of hours and EUR (billing rate x hours), then re-measure. The Stanford/MIT and Thomson Reuters numbers are the benchmarks; METR shows why measured beats self-reported.
- **Coaching by role and seniority.** The Stanford/MIT study says seniors gain more and juniors misuse AI. Per-person 4D scoring (Discernment and Diligence especially) with targeted nudges is not in any dashboard found.
- **Article 4 evidence pack.** Auto-generate the internal record the Commission accepts: who got what literacy measure, when, and demonstrated behaviour change. No product found positions on this [UNVERIFIED but nothing surfaced].
- **Local and private.** Admin tools are aggregate-only or cloud. TOP's local analysis of exported history gives a privacy story: the employee sees their own insights first, the firm sees only opted-in summaries. Pair with Athena (intake questions) as the visible "wow" step in the demo, which is more than a dashboard.

Caveat to state in the pitch: competitor claims here come from vendor pages and press; Larridin is the one to check hardest before saying "nobody does this".
