# Frame Next: build plan for Relay (7 Nov 2026)

Builders: Chulainn and Charity, one Relay account each. Pitch: Boole 2 from 19:35, 3 minutes plus 2 minutes Q&A.
Research behind every choice: `docs/research/2026-11-07-frame-hackathon-research.md`.

This file has four parts:
1. The goal card and stack.
2. The task graph, written for `/relay-plan`.
3. The run guide: what each human does, in order.
4. Copy-paste prompts.

---

## 1. Goal card (paste as `goal_card`)

Frame Next tells each person at FRAME which AI habit or automation to adopt this week, and shows the hours, euros and tokens it saves before the next deadline. It joins real public data (Anthropic Economic Index, O*NET tasks, Revenue and IRS deadlines, CSO and Eurostat adoption) with labelled synthetic Frame data (staff, engagements, timesheets, AI usage). The demo moment: a non-technical tax assistant types "What should I hand to AI before 18 November?", Athena asks one clarifying question, and she gets a ready skill with hours and euros attached. Out of scope: login, real Frame data, a database, Outlook integration, mobile layout.

## 2. Stack and ground rules

| Choice | Value | Why |
|---|---|---|
| App | Next.js (App Router) with TypeScript | One repo holds pages and API routes |
| Tests | Vitest, run by `npm test` | Relay's CI already runs `npm test` on every pull request |
| Data | CSV and JSON files committed under `data/` | No database, so no Red schema tasks |
| AI calls | Anthropic SDK, model `claude-sonnet-5-5` | Fast and cheap enough for a live demo |
| Charts | Plain HTML tables and CSS bars | No chart library to debug |

Rules every task follows:
- Every module that calls Claude has a **no-key fallback**. If `ANTHROPIC_API_KEY` is missing, it returns a fixed sample answer. Tests and CI never need a key.
- Agents never read or write `.env.local`. A human creates it once (see the run guide).
- Every synthetic number carries a `synthetic: true` flag, and the UI shows a "synthetic" badge beside it.
- Every real number carries a `source` URL, and the UI shows it on hover.
- Prices for the token panel come from `data/public/prices.json`. A human fills it from Anthropic's pricing page. Agents never invent a price.

## 3. Task graph (14 tasks)

`ref` names let tasks point at each other. Relay gives the T-keys.

| ref | Title | Depends on | Owned paths | Signal |
|---|---|---|---|---|
| scaffold | Scaffold Next.js app, tests and every dependency | none | `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `README.md` | Red |
| contract | Shared data contract | scaffold | `contract/` | Amber |
| public-data | Load real public data | contract | `data/public/`, `scripts/fetch-public/` | Amber |
| frame-data | Generate synthetic Frame data | contract | `data/frame/`, `scripts/make-frame-data/` | Amber |
| catalogue | Skills, hooks and plugins catalogue | contract | `catalogue/` | Amber |
| productivity | Engagement productivity engine | contract | `engine/productivity/` | Amber |
| recommend | Next-automation engine and literacy log | contract | `engine/recommend/`, `engine/literacy/` | Amber |
| athena | Athena intake and token meter | contract | `engine/athena/`, `engine/meter/` | Amber |
| employee-view | Employee view | contract | `app/employee/`, `components/employee/` | Amber |
| partner-view | Partner view | contract | `app/partner/`, `components/partner/` | Amber |
| harry-view | Harry view | contract | `app/harry/`, `components/harry/` | Amber |
| ask-api | Plain-language ask route | productivity, recommend, athena | `app/api/ask/`, `app/api/athena/` | Normal |
| halfway | Integrate the employee flow on real data | public-data, frame-data, catalogue, employee-view, ask-api | none | Normal |
| final | Integrate and test the full flow | halfway, partner-view, harry-view | none | Normal |

**Longest chain:** scaffold → contract → athena → ask-api → halfway → final. That is six tasks. At about 40 minutes each, plus reviews, it is about five hours.

**Width:** after the contract is frozen, ten tasks are ready at once. Both agents stay busy until the halfway point.

**Red tasks:** only the scaffold, because it owns the dependency files. A human clicks Release before it starts and Accept after review.

**Amber tasks:** every task that depends directly on the contract. Each adds a 5-minute veto window after review. Let it lapse unless something looks wrong.

### Task text for each card

Each `goal` must stand alone, because a fresh agent reads it with no memory of this chat.

**scaffold**
- Goal: Create a Next.js App Router project in TypeScript at the repo root. Add these dependencies now, because later dependency changes are Red: `next`, `react`, `react-dom`, `@anthropic-ai/sdk`, `papaparse`, `zod`. Add dev dependencies: `typescript`, `@types/react`, `@types/node`, `@types/papaparse`, `vitest`. Set `"test": "vitest run"` in `package.json`. Add a home page with three links: Employee, Partner, Harry. Add `.env.local` to `.gitignore`. In `README.md`, say how to run the app and that `ANTHROPIC_API_KEY` goes in `.env.local`.
- Done check: `npm install && npm test` passes with one placeholder test. `npm run build` succeeds. The home page shows three links.

**contract**
- Goal: In `contract/types.ts`, define zod schemas and TypeScript types for: `Staff` (id, name, role, team, chargeRate, synthetic), `Engagement` (id, client, type, fee, budgetHours, deadlineId, synthetic), `TimesheetLine` (staffId, engagementId, date, hours, taskText, onetTask), `TaskScore` (onetTask, penetration, source), `JobExposure` (occCode, title, observedExposure, source), `Deadline` (id, label, date, jurisdiction, source), `UsageRecord` (staffId, date, prompts, tokensIn, tokensOut, taskCategory, verified, synthetic), `CatalogueItem` (id, kind: skill, hook or plugin, title, plainSummary, targetsOnetTasks, body, verifyStep), `Recommendation` (staffId, item, aiReadyHours, hoursBackEstimate, eurosBack, deadline, reason), `AthenaQuestion` (question, options, why), `AthenaResult` (needed, questions, tokensUsed), `MeterReading` (task, tokensIn, tokensOut, euros, finished), `LiteracyLogEntry` (staffId, date, measure, itemId, adopted). In `contract/api.ts`, define request and response types for `POST /api/athena` and `POST /api/ask`. In `contract/fixtures.ts`, export one small valid example of each type, for views to build against.
- Done check: `npm test` runs a test that parses every fixture with its schema and passes. After acceptance, call `freeze_contract`.

**public-data**
- Goal: Download and commit small real files. (1) From `https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main/labor_market_impacts/job_exposure.csv`, keep the whole file. (2) From `.../labor_market_impacts/task_penetration.csv`, keep only rows whose task text matches accounting, audit, tax, ledger, reconcile, payroll, invoice, financial statement or budget. (3) Write `data/public/deadlines.json` with source URLs: Revenue Form 11 pay and file 31 Oct 2026, ROS extended 18 Nov 2026 (source `https://www.revenue.ie/en/tax-professionals/ebrief/2026/no-0342026.aspx`), Irish CT1 and VAT dates for Nov 2026 to Mar 2027, IRS 15 Jan 2027 estimated tax, 15 Mar and 15 Apr 2027, Cayman fund annual return six months after a 31 Dec year end. Mark any date not read from an official page with `"checked": false`. (4) Cache Irish public holidays from `https://date.nager.at/api/v3/PublicHolidays/2026/IE` and 2027. (5) Save CSO table ICA237 as CSV from the CSO PxStat API, and Eurostat `isoc_eb_ain2` for Ireland and the EU as JSON. (6) Create `data/public/prices.json` with model names and `null` prices, plus a note that a human fills them. Write a loader in `data/public/index.ts` that returns typed, contract-valid data.
- Done check: `npm test` loads every file through the contract schemas. A test asserts that "Accountants and Auditors" has observed exposure 0.3478 and "Tax Preparers" 0.1283.

**frame-data**
- Goal: Write a seeded generator in `scripts/make-frame-data/` and commit its output to `data/frame/`. Create 12 synthetic staff across Tax, Audit, Business Finance and Private Wealth, in Cork, Dublin, New York and Grand Cayman. Include "Aoife", a junior tax assistant in Cork, and "Harry", AI and Automation Analyst. Create 10 engagements with fees between €8,000 and €60,000, budget hours, and a linked deadline id from the deadlines list. Generate 8 weeks of timesheet lines. Each line's `onetTask` must be an exact task statement from O*NET for Accountants and Auditors, Tax Preparers or Bookkeeping clerks. Make three engagements run over budget, mostly on reconciliation and data classification tasks. Generate daily AI usage records shaped like the Claude Enterprise Analytics API, plus task category, verified flag and tokens. Make Aoife a heavy user with a low verified rate. Set `synthetic: true` everywhere. Export a typed loader in `data/frame/index.ts`.
- Done check: `npm test` validates every record against the contract. Same seed gives the same files. A test asserts three engagements exceed budget hours.

**catalogue**
- Goal: Write 10 catalogue items as markdown files with front matter in `catalogue/items/`, plus a loader in `catalogue/index.ts`. Include at least: a bank reconciliation skill, a transaction classification skill, a CT1 review checklist skill, a client query reply skill, a meeting notes to action list skill, a "check the output" verify hook that asks the user to confirm three figures, a "no PPS number in a client email" hook, a deadline reminder plugin, a "write a good brief" Athena starter, and a working-paper summary skill. Each item has a plain one-line summary for a non-technical reader, the O*NET tasks it targets, the full body a person can copy, and a verify step.
- Done check: `npm test` loads all 10 items through the `CatalogueItem` schema. Every item targets at least one O*NET task found in the public task list fixture.

**productivity**
- Goal: In `engine/productivity/`, write pure functions over contract types. Per engagement: fee, budget hours, actual hours, effective rate (fee / actual hours), budget variance, hours per O*NET task. Per task: AI-ready hours = hours × penetration. Hours back estimate = AI-ready hours × a stated, adjustable factor (default 0.3, shown in the UI as an assumption). Euros back = hours back × the staff charge rate. Rank engagements by money lost against budget. Build against `contract/fixtures.ts`, not the data folders.
- Done check: `npm test` covers each function with hand-worked numbers. An engagement with fee €10,000, budget 100 h and actual 125 h shows an effective rate of €80 an hour.

**recommend**
- Goal: In `engine/recommend/`, pick one next automation per person. Score each catalogue item by: AI-ready hours on the tasks it targets × deadline weight (closer deadlines weigh more) × a verify bonus (for low verified rates, prefer items with a verify step). Return a `Recommendation` with a plain-English reason under 30 words. In `engine/literacy/`, append a `LiteracyLogEntry` when a recommendation is shown or adopted, and export the log as CSV. Build against fixtures.
- Done check: `npm test` shows that a fixture person with 10 reconciliation hours and a deadline in 11 days gets the reconciliation skill. A low-verify fixture person gets an item with a verify step. The CSV export has one row per entry with a header.

**athena**
- Goal: In `engine/athena/`, take a user request plus the person's context. Decide whether questions are needed: skip them when the request names the client, the task and the output. Otherwise ask Claude for one to three multiple-choice questions, each with options and a one-line reason, as JSON. Use the no-key fallback. In `engine/meter/`, record tokens in and out from each Claude response's usage field, and convert to euros from `data/public/prices.json`. If a price is `null`, show tokens only. Keep a running "tokens per finished task" figure.
- Done check: `npm test` shows a vague request ("help with Murphy") gets at least one question and a specific one gets none, using the fallback with no key. The meter adds up usage from a recorded sample response.

**employee-view**
- Goal: In `app/employee/`, build Aoife's page using `contract/fixtures.ts` only. Show a question box with the placeholder "What should I hand to AI before my next deadline?". Athena's questions appear as clickable options. Then show the answer card: the recommended item, hours and euros back, the deadline countdown, a "Copy skill" button, and an "I'll try it" button that records adoption. Show a small token meter for this task. Show "synthetic" badges on made-up numbers. Plain words, large text, no jargon.
- Done check: `npm run build` passes. Opening `/employee` shows the question box. Submitting shows a fixture question, then the answer card. Copy puts the skill body on the clipboard.

**partner-view**
- Goal: In `app/partner/`, build the engagement table from fixtures: client, fee, budget versus actual hours, effective rate, and the top AI-ready task. Sort by money lost. Clicking a row shows its tasks with AI-ready hours and the recommended item for the team. Add a crunch calendar of the next 8 weeks with deadlines marked. Add a question box: "Which jobs are losing money, and why?".
- Done check: `npm run build` passes. `/partner` shows the table sorted by money lost. Clicking a row opens its task breakdown.

**harry-view**
- Goal: In `app/harry/`, build from fixtures: adoption by team (active users, prompts, verified rate), Frame against CSO and Eurostat professional-services AI adoption, the cost-per-task panel (tokens and euros per finished task, and the share of spend in the top 10% of tasks), the literacy log table with an "Export CSV" button, and a question box: "Which teams improve when they adopt a skill?". Put a one-line explanation under every panel.
- Done check: `npm run build` passes. `/harry` shows all four panels. Export downloads a CSV.

**ask-api**
- Goal: Build `POST /api/athena` and `POST /api/ask` from `contract/api.ts`. `/api/athena` calls the Athena engine. `/api/ask` takes the question, any Athena answers and the view (employee, partner or harry). It runs the matching engine functions, then asks Claude to write a plain answer of at most 80 words that uses only the numbers given, and names the source of each one. Return the answer, the numbers and a meter reading. Use the no-key fallback.
- Done check: `npm test` calls both handlers with no key and gets contract-valid responses. With a key, `curl` against `/api/ask` returns an answer that contains the hours figure from the engine.

**halfway**
- Goal: Wire `/employee` to real data: `data/public`, `data/frame`, `catalogue` and the real `/api/athena` and `/api/ask`. Replace fixtures in the employee view only. Fix the joins.
- Done check: As Aoife, ask "What should I hand to AI before 18 November?". Athena asks one question. The answer names a real catalogue item and shows hours and euros from the engine. The source link for the 18 Nov date opens Revenue's page.

**final**
- Goal: Wire `/partner` and `/harry` to real data and the real API. Run the full demo path. Fix the joins. Write `docs/demo-script.md` with the click path and what to say at each step.
- Done check: Run the demo script from the home page through all three views with no errors in the browser console. `npm test` and `npm run build` both pass on `main`.

---

## 4. Run guide

### Before the board (Chulainn, about 15 minutes)

1. **Give Charity a Relay token.** In the `relay` folder, run the command below with her GitHub login. The token prints once.

```bash
node scripts/token.mjs <charity-github-login> "Charity"
```

2. **Send her the token privately**, in person or by direct message. Never paste it into a Relay card or a commit.
3. **Add her to the GitHub repo** `clyoms/CsHackathon` as a collaborator with write access.
4. **Put the plan on `main`.** Agents read `docs/plan/` and `docs/research/`, so both must be merged before the build. Pushing straight to `main` is blocked, so use a pull request:

```bash
git checkout -b docs/frame-next-plan && git add docs && git commit -m "Add Frame Next research and build plan" && git push -u origin docs/frame-next-plan && gh pr create --fill && gh pr merge --squash --delete-branch
```

5. **Check the board is empty.** In the `relay` folder, run this. If it lists old tasks, run it again with `--yes`.

```bash
node scripts/new-plan.mjs
```

### Charity's setup (about 10 minutes)

1. Clone the repo.

```bash
git clone https://github.com/clyoms/CsHackathon.git
```

2. Set her Relay token as an environment variable called `RELAY_TOKEN`. On Windows PowerShell:

```powershell
[Environment]::SetEnvironmentVariable("RELAY_TOKEN", "<her token>", "User")
```

3. Restart Claude Code, so it reads the new variable.
4. Install the GitHub CLI and log in, because reviews merge with `gh`.

```bash
gh auth login
```

5. Open Claude Code in the `CsHackathon` folder. The session-start hook prints a Relay session id. If it prints a warning, check the token.

### Both builders, once

- Create `.env.local` in the repo root with `ANTHROPIC_API_KEY=...`. Agents never read this file. Do it after the scaffold is merged.
- Open `data/public/prices.json` after the public-data task merges. Fill the prices for `claude-sonnet-5-5` from Anthropic's pricing page.

### Load the plan (Chulainn, about 10 minutes)

1. Open a fresh Claude Code chat in `CsHackathon`.
2. Paste **Prompt A** below.
3. Read the table it returns. Check the longest chain and the Red list.
4. Open the Relay board in the browser. Both of you read the cards and click **Approve plan**.

### Run the build

| Time | Chulainn | Charity |
|---|---|---|
| 11:30 | Click **Release** on the scaffold. Paste **Prompt B** in a fresh chat | Paste **Prompt B** in a fresh chat. Her agent waits or reviews |
| about 12:10 | Click **Accept** on the scaffold after review. Create `.env.local` | Create `.env.local` |
| about 12:40 | Contract merged and frozen. Ten tasks open | Same |
| 12:40 to 15:30 | Watch the board. Let Amber vetoes lapse. Answer `mark_blocked` questions | Same. Start the pitch outline in a doc (Prompt D) |
| about 15:30 | Halfway task: try Aoife's question yourself | Fill `prices.json`. Check the public data sources open |
| 15:30 to 17:30 | Final task. Rehearse with the real app | Write the demo script with the agent's output |
| 17:30 to 19:00 | Freeze. Fix only demo-breaking bugs | Rehearse the 3-minute pitch twice, timed |
| 19:35 | Pitch | Pitch |

### Getting the most out of Relay

- **Keep one agent session each, running the loop.** The Stop hook hands each agent its next job, so neither of you needs to type between tasks.
- **Reviews are the bottleneck.** Each agent reviews first, then claims. Do not tell an agent to skip reviews.
- **Answer blocked cards within five minutes.** A blocked card holds every task that depends on it.
- **Never edit an owned path by hand while a task holds it.** Relay refuses the write, and your change is lost. Post a message on the card instead.
- **New ideas go on the board as proposed tasks.** Approve them only if they help the demo and fit before 17:30.
- **If an agent hits the 45-minute budget**, read its last checkpoint. Release it, or split the task with `create_tasks`.
- **If Relay goes down**, the hooks fail open. Keep working and record who holds what in `BOARD.md`.

### Cut list, if the day runs late

Cut in this order. Each cut still leaves a working demo.
1. Eurostat comparison (keep CSO only).
2. Partner crunch calendar.
3. Harry's "which teams improve" question box.
4. Live Athena questions from Claude (keep the no-key fallback questions).

Never cut: Aoife's question, Athena's question, the answer card with hours and euros, the source links.

---

## 5. Prompts

### Prompt A: load the plan (Chulainn only, once)

```
/relay-plan Frame Next. Use docs/plan/frame-next-build-plan.md as the plan, exactly. Take the goal card from section 1. Create the 14 tasks in section 3 with the same refs, depends_on, owned_paths, goals and done checks, word for word. Do not add, merge or split tasks. If create_tasks refuses something, change only what it names, then tell me what changed.
```

### Prompt B: work the board (both, in a fresh chat each)

```
Work the Relay board in this repo. Read docs/plan/frame-next-build-plan.md section 2 first: every Claude call needs a no-key fallback, never read .env.local, mark synthetic numbers, give every real number a source. Review before you claim. Keep going until the Stop hook lets you stop.
```

### Prompt C: when a task is blocked or rejected twice (either person)

```
Read the Relay history for <T-key>: every attempt, checkpoint, dead end and review fix. Tell me in five lines or fewer what keeps failing and the smallest change that would pass the done check. Do not change any files.
```

### Prompt D: pitch outline (Charity, in a separate chat outside the repo)

```
Write a 3-minute pitch outline for Frame Next for the FRAME hackathon track. Judges score innovation, impact, technical depth and demo quality equally. Use docs/research/2026-11-07-frame-hackathon-research.md as the only source of facts. Structure: the problem in Frame's words (15 s), the one sentence (10 s), live demo as Aoife, then partner, then Harry (100 s), how it works and the real data (30 s), limits and next steps (25 s). Then list five likely judge questions with a 20-second answer each. No savings percentages.
```

### Prompt E: final check before the pitch (either person, about 18:30)

```
Run npm test and npm run build on main. Then walk the steps in docs/demo-script.md and tell me any step that fails, with the error. Do not fix anything unless I say so.
```
