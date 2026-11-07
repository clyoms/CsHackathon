# Frame hackathon: research and recommendation (7 Nov 2026)

Raw worker reports sit in `docs/research/raw/` (01 Frame, 02 datasets, 03 prior art, 04 own assets). This file is the synthesis. Items marked **[checked]** were verified by the lead in this session. Items marked **[worker]** come from a worker's search and were not re-opened.

## 1. The answer first

Build **one tool with three doors**: an employee asks a plain question, a manager sees hours and deadlines, Harry sees adoption and the AI-literacy record. Underneath, one engine joins four data layers:

1. **How a person uses AI** (their usage summary, Claude Enterprise analytics shape).
2. **What their job is made of** (their timesheet, by task).
3. **Which of those tasks AI already does well** (Anthropic Economic Index, real, public).
4. **When it matters** (Revenue, CRO, Cayman and US deadlines, plus holidays).

The output is never a chart on its own. It is **"your next automation"**: one specific skill, hook or workflow, the hours and euros it frees before the next deadline, and a one-click record for the EU AI Act literacy log.

Working name: **Frame Next**. One sentence: *"It tells each person at Frame the one AI habit or automation worth adopting this week, and proves whether it paid off."*

Why this wins on the four equal criteria:

| Criterion | How this scores |
|---|---|
| Innovation | The join is new: personal AI usage x task-level AI capability x billable time x tax calendar. No product found does "usage → specific next build → measured saving". |
| Impact | Clear beneficiaries at three levels. Ties to a legal duty (AI Act Article 4) and to money (billable hours). |
| Technical depth | Real public data with a sensible join on O*NET tasks, a scoring model you can explain, and an LLM step that writes the actual skill. |
| Demo | A non-technical accountant types "What should I hand to AI before the 18 November deadline?" and gets an answer with a number. |

## 2. Frame: confirmed facts vs assumptions

**Confirmed [checked, https://frame.international/]**
- FRAME Professional Services. Offices: One Albert Quay Cork, Palmerston Road Dublin 6, Regatta Park Grand Cayman, 387 Park Ave South New York. This matches the slide exactly.
- Services: Business Finance (CFO support, "real-time insight"), Tax and Compliance (Irish, Cayman, US), Private Wealth, Audit and Assurance, Transactions and Deals, Founders and CEOs.
- Self-description: referral-only, "deeply discreet", "not the largest firm", more than 45 years advising owner-led businesses, PE-backed firms and international families.
- The site names no staff and says nothing about AI, automation or data.
- Sister firm FRAME Financial Advisors (framefinancial.ie, est. 2007, Central Bank regulated) names Richard Fowler, Dermot O'Kelly FCA and Martin Black **[worker]**.

**From the slides only**
- Harry Page is "Founding AI and Automation Analyst". "Founding" suggests the AI role is new at Frame. No public profile was found.
- Their stated pains: timing (January vs June), scattered data (systems, spreadsheets, inboxes), non-technical users.

**Assumptions (say them as assumptions in Q&A)**
- Small, partner-led firm. No headcount is published.
- They record time, run WIP and billing, and track filing deadlines. Every billing accountancy does, but nothing public confirms their software.
- Staff likely use Microsoft 365 (inboxes). Their AI tool is unknown: Copilot, ChatGPT or Claude.
- "Discreet" plus "referral-only" means **privacy is a selling point**. A design that keeps an employee's prompts on their own device fits their brand.

**Not a fund administrator.** Nothing on the site mentions fund services or CIMA fund filings. Do not pitch fund-admin features.

## 3. Data map: source → what it shows → action → how to measure

| Data source | Tier | What it shows | Who acts, and how | Measure of success |
|---|---|---|---|---|
| Employee AI usage (prompts per task type, tools used, verify habits) | Frame could collect (Claude Enterprise Analytics API gives per-user daily counts from Jan 2026 **[worker]**). Mock for demo | How much and **how** each person uses AI | Employee gets one habit or skill to try. Harry sees where training is needed | Uptake of the recommended skill. Repeat-task count drops |
| Timesheets by client and task | Frame holds (typical). Synthetic for demo, labelled | Where each person's hours go | Manager picks which task to automate first | Hours on that task, before vs after |
| WIP, billing, charge-out rates | Frame holds (typical). Synthetic | Euro value of each hour | Partner sees hours freed as euros or capacity | Write-offs down, more chargeable time |
| Anthropic Economic Index: job_exposure.csv, task_penetration.csv | **Public, real [checked]** | How much of each O*NET task already shows up in Claude usage | Ranks a person's tasks by "AI-ready" | n/a, it is the reference layer |
| O*NET 31.0 task lists | Public, CC BY 4.0 **[worker]** | The task statements that join timesheets to the index | Maps "Prepared CT1" to a task | n/a |
| Revenue, CRO, IRS, Cayman deadlines | Public, hand-keyed **[worker; confirm Revenue page]** | Crunch weeks per office | Employee is told what to automate before the crunch | Deadlines met with fewer late nights |
| Irish public holidays (Nager.Date API) | Public, live **[worker]** | Working days left | Countdown maths | n/a |
| CSO ICA237 and Eurostat isoc_eb_ain2 | Public, open API **[worker]** | AI adoption in Irish and EU professional services | Harry benchmarks Frame against the sector | Frame above the Irish line |
| EU tender awards (TED), accounting, audit and tax services | Public, open API **[not checked today]** | What accounting engagements are worth in Ireland | Gives the synthetic engagements realistic fees | n/a, it anchors the fee layer |
| Our own Claude Code history, Icarus replay, Athena logs | Real, ours | Real tokens per turn and per task, and where spend piles up | Powers the live cost-per-task panel | Tokens per finished task |
| AI Act literacy log | Frame must keep evidence (see §5) | Who received which literacy measure, when | Harry exports the record | An auditable log exists |

**Real numbers already in hand [checked, pulled from Hugging Face today]:**
- Observed exposure, Anthropic Economic Index: **Accountants and Auditors 0.348**, **Bookkeeping clerks 0.310**, **Tax Preparers 0.128**, Chief Executives 0.033.
- task_penetration.csv has about 18,000 tasks. Top accounting tasks: "Classify, record and summarise numerical and financial data…" **0.966**, "Compile … accounting or auditing reports" **0.932**, "Prepare … financial statements … reports required by regulatory agencies" **0.920**, "Prepare, examine or analyse accounting records … conformance to standards" **0.893**.
- What "observed exposure" means (Anthropic, "Labor Market Impacts of AI: A New Measure and Early Evidence", March 2026, via secondary coverage): of the tasks an LLM could in theory speed up, how much actually shows up as automated professional use of Claude. It is built from O*NET tasks, Economic Index usage and Eloundou et al. (2023) exposure scores. Read the primary page (anthropic.com/research/labor-market-impacts) before quoting. Do not call it "the share of the job AI can do".

That contrast is a demo moment by itself: tax preparers sit at 0.13 while the bookkeeping inside the same firm sits at 0.31 to 0.97. The tool explains which half of someone's week is ripe.

## 4. Feasibility tiers

| Tier | Data | Use in the demo |
|---|---|---|
| **A. Real and public, use live** | Economic Index CSVs, O*NET tasks, CSO ICA237, Eurostat, Nager holidays, CRO open data API | Load at start-up. Show the source on screen |
| **B. Real but hand-keyed** | Revenue 18 Nov ROS date, IRS dates, Cayman six-month rule | A small JSON file with source links |
| **C. Frame holds, we mock** | Timesheets, WIP, charge-out rates, staff list | Synthetic CSV for 12 fictional staff. Label "synthetic" on screen |
| **D. Frame could collect, we mock the shape** | Per-person AI usage (Claude Enterprise analytics fields) | Synthetic, shaped exactly like the real API. Say so |
| **E. Our own real data** | Our own Claude usage, exported and analysed locally (TOP pattern) | Optional live moment: run it on one of us |

Never claim access to Frame's internal data. Say: "Plug in your real timesheet and analytics export and this runs on day one."

## 5. The legal hook: EU AI Act Article 4

- Article 4 (AI literacy) has applied since 2 Feb 2025.
- The Digital Omnibus on AI (Regulation (EU) 2026/1744, in force 27 July 2026) **softened it but kept it**. The duty moved from "ensure a sufficient level" to "take measures to promote" AI literacy among staff **[checked across several law-firm sources: Lewis Silkin, KI-Campus, IAPP; read EUR-Lex before quoting wording]**.
- The Commission's Q&A says an internal training record is acceptable and no certificate is needed **[worker]**.
- So every recommendation the tool makes, and every one an employee adopts, becomes a dated line in Frame's literacy record. That turns a compliance chore into a by-product. Harry gets evidence, not just a dashboard.

Sources: [Lewis Silkin](https://www.lewissilkin.com/insights/2026/07/27/the-digital-omnibus-on-ai-enters-into-force-today-102nedo), [KI-Campus](https://ki-campus.org/en/blog/eu-ai-act-ai-omnibus-recalibrates-article-4-ai-literacy-remains-mandatory), [IAPP](https://iapp.org/news/a/eu-ai-act-literacy-changes-may-complicate-more-than-simplify-compliance), [Matheson](https://www.matheson.com/insights/eu-ai-digital-omnibus-proposal-where-are-we-now/).

## 6. Evidence you can cite (and how carefully)

| Claim | Number | Strength |
|---|---|---|
| Accountants using genAI moved time off data entry (Choi and Xie, Stanford and MIT, 277 accountants) | about 8.5% of time, about 3.5 h a week. Close 7.5 days faster | Peer-reviewed study via trade press **[worker]**. Seniors gained more than juniors |
| Thomson Reuters Future of Professionals | 5 h a week expected saving | Self-reported forecast. Say "expected" |
| Chartered Accountants Worldwide and Ipsos, 2,700 accountants | 30% had employer AI training, 92% would take it, 52% say training is the main barrier | Survey, Irish body's own release **[worker]** |
| METR developer trial | Felt 20% faster, measured 19% slower | Why we **measure** savings instead of asking |
| CSO: Irish firms using AI | about 20% in 2025 **[worker, press figure, confirm in table]** | Official statistics |

**Do not claim** (TOP rules apply here too): no savings percentage for our tool, no "nobody else does this" (Larridin and Worklytics exist), no accuracy figures we have not measured.

## 7. Competitors and the white space

- **Count usage:** Microsoft Copilot Dashboard, Worklytics, Larridin, Claude and ChatGPT Enterprise analytics. All aggregate or count. None recommends a specific thing to build.
- **Automate client work:** Basis, Digits, Xero JAX. They do the accountant's work, they do not coach the accountant.
- **Train:** Big 4 programmes, Section, Multiverse. Generic courses, not driven by each person's real usage.
- **White space:** personal usage → one specific next automation → measured hours and euros → literacy record. Larridin is closest on paper. Check it hardest before Q&A.

## 8. Concept comparison

Scores are 1 to 5, my judgement against the four equal criteria plus build risk in nine hours.

| Concept | Innovation | Impact | Tech depth | Demo | Buildable in 9 h | Total | Verdict |
|---|---|---|---|---|---|---|---|
| **A. Employee AI suite** (catalogue of skills, plugins, hooks) | 3 | 4 | 3 | 3 | 4 | 17 | Strong for Harry, but weak on "data". A catalogue alone looks like a wiki |
| **B. Productivity and money** (who works on what, hours, revenue, AI exposure) | 4 | 4 | 4 | 3 | 4 | 19 | Best data story. Risks reading as a dashboard |
| **C. Student route** (IS3322: how you use AI, not how much) | 4 | 3 | 3 | 4 | 4 | 18 | Good evidence, wrong sponsor. Frame cannot act on it |
| **D. TOP-style cost meter** (Icarus-lite for teams) | 3 | 2 | 4 | 3 | 3 | 15 | Cost is not Frame's pain. Hours and deadlines are |
| **E. Recommended: A + B + timing + literacy log** ("Frame Next") | 5 | 5 | 4 | 5 | 3 | 22 | Uses B's data to drive A's recommendations, with deadlines as the "act now" trigger |

**What to borrow from each, without naming TOP:**
- From IS3322: the finding that **how** you use AI matters more than **how much** (r under 0.1 for amount in all three datasets). This becomes the tool's coaching rule: it scores verify habits, not volume.
- From Athena: ask one or two clarifying questions before suggesting an automation, only when the answer changes the suggestion.
- From the TOP analyzer: the employee's prompts stay on their device. Only counts and categories go to the firm view. Fits Frame's "discreet" brand.
- From the harness hooks: hooks are rules in code that staff cannot forget, for example "never send a client email that contains a PPS number". These are the concrete artefacts the tool hands out.

**The student route stays as a fallback** if a judge asks "who else could use this?". Answer: the same engine runs on a student's AI use and module deadlines. One slide, no build.

## 8a. Agreed shape (Chulainn, 07-11-2026)

Frame Next is **one engine, three views, Athena in front**. The skills, plugins and hooks are the actions the engine recommends, not a separate product. The hours, revenue and AI-exposure view is the partner's view of the same engine.

### Data we have to work from

| Layer | Source | Real or made up | Size |
|---|---|---|---|
| Which tasks AI suits | Anthropic Economic Index | Real, checked | About 18,000 tasks, about 800 jobs |
| What an accountant's job contains | O*NET task lists | Real | Every job title |
| When work is due | Revenue, IRS and Cayman deadlines, Irish holidays | Real | About 20 dates |
| How Irish firms compare | CSO and Eurostat AI adoption | Real | Annual, by sector |
| What accounting contracts are worth | EU tender awards (TED) | Real, not checked today | Thousands of award notices |
| Real token use and cost | Our own Claude Code history, Icarus replay, Athena logs | Real, ours | Thousands of turns, 414 replayed, 141 Athena logs |
| Frame's engagements, timesheets and fees | None public | Made up, labelled "synthetic" | 12 staff, about 10 engagements |

Seven layers is enough. Add no more.

### Productivity per engagement

Frame takes work by referral and does not bid publicly, so the unit is the **engagement** (one client job with an agreed fee and budgeted hours). For each engagement the tool shows:

1. Fee, budgeted hours and actual hours, task by task.
2. The effective rate: fee divided by actual hours.
3. Which over-budget tasks score high on the Economic Index.
4. The skill or hook that targets those tasks, and the rate if those hours come back.

Real TED award values give the synthetic engagements realistic fees.

Each view gets one plain question:
- **Partner:** "Which jobs are losing money, and why?"
- **Employee:** "What do I hand to AI on the Murphy audit?"
- **Harry:** "Which teams improve when they adopt a skill?"

### Athena as the front door

Athena asks one to three multiple-choice questions before a task goes to AI, only when the answer would change the result.

- **Context:** a vague request makes the AI guess, then redo the work. Athena fills the gap first.
- **Cost:** in our own Icarus replay, 10.6% of turns used 31.3% of the money. Those runaway turns usually come from unclear tasks. Athena targets those few before they start.
- **Fluency:** each question teaches the person what a good brief contains. That counts towards the Article 4 literacy record.

The pitch line: "A few long, unclear tasks burn about a third of the spend. Athena targets those few before they start." The cost-per-task panel shows tokens and euros per finished task, live.

## 9. What the demo shows (three doors, one engine)

1. **Employee door (Aoife, junior tax assistant, synthetic).** She types: "What should I hand to AI before the 18 November deadline?" The tool reads her week: 11 h on reconciliations and data classification (penetration 0.97), 6 h on client queries, 4 h on CT1 review. It answers in plain English: "Start with reconciliations. Here is a ready skill. It should free about 5 hours before the 18th." It shows the skill text and a "check the output" step, because her verify habit is low.
2. **Manager door (tax partner).** Sees the team's crunch weeks against Revenue, IRS and Cayman dates, and hours freed as capacity in euros (synthetic rates).
3. **Harry's door.** Sees adoption by team, Frame against CSO and Eurostat sector benchmarks, and exports the Article 4 literacy log.
4. **Closing line:** "Every number on screen is either public data you can check, or a labelled stand-in for data Frame already holds."

## 10. Honest limits (judges score this)

- Exposure and penetration scores describe Claude usage across the world, not Frame's staff. They rank tasks. They do not promise savings.
- Hour estimates are hypotheses until re-measured. The tool shows a before and after check for that reason.
- Mapping timesheet lines to O*NET tasks is fuzzy. We use an LLM to match and show the match so a person can correct it.
- Usage data is mocked. The real Claude Enterprise analytics gives counts, not task types, so task type would come from a local classifier or self-tagging.
- Privacy: per-person data is sensitive under GDPR and employment law. Default to employee-first visibility and team-level views for managers (groups of 5 or more).
- With more time: real Frame pilot data, calibrate the hours estimate against measured change, Outlook inbox triage as a data source.

## 11. Build outline for nine hours (for the plan stage, not a commitment)

| Hours | Piece |
|---|---|
| 0 to 1 | Load Economic Index CSVs, O*NET accountant tasks, deadlines JSON, holidays API. Write synthetic staff, timesheet and usage CSVs |
| 1 to 3 | Engine: map timesheet lines to tasks, score "AI-ready hours", weight by deadline proximity and verify habit |
| 3 to 5 | Plain-language Q&A with Claude over the engine's output. Skill and hook generator from templates |
| 5 to 7 | Three views in one web page. Literacy log export |
| 7 to 8 | Benchmark panel (CSO, Eurostat). Polish |
| 8 to 9 | Rehearse the three-minute pitch and two-minute Q&A |

Top 10 pitch: Boole 2 from 19:35, 3 minutes plus 2 minutes Q&A.

## 12. Open checks before the pitch

1. ~~Confirm the ROS date.~~ **Done [checked, Revenue eBrief 034/2026]:** 31 Oct 2026 standard, **Wed 18 Nov 2026** for those who both pay and file on ROS (2025 Form 11, 2026 preliminary tax, CAT).
2. Read Anthropic's primary labour-market page to confirm the "observed exposure" definition (secondary sources agree, see §3).
3. Confirm the CSO ICA237 figure in the table, not the press release.
4. Read Article 4 as amended on EUR-Lex.
5. Check Larridin's product page before saying anything about competitors.
