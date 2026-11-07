# Handoff

**Handoff turns the AI data a company already has into one next AI habit per employee, with the hours it saves before a real deadline, and logs every step as EU AI Act Article 4 literacy evidence.**

Built at Corkathon 2026 for the FRAME and Ignite tracks.

## The problem

Companies pay for AI, but most staff do not know what to use it for. Partners cannot see which jobs leak hours. And since February 2025, Article 4 of the EU AI Act has required every company that uses AI to take measures on its staff's AI literacy. The 2026 Digital Omnibus softened the wording to "take measures to promote" AI literacy, but the duty stays. Most firms have no record to show for it.

## The solution

One engine joins four data sources:

| Source | What it tells us | Real or demo |
|---|---|---|
| Anthropic Economic Index | Which work tasks people already hand to AI | Real, sourced |
| O*NET task list | Turns a timesheet line into a task we can score | Real, sourced |
| Revenue, IRS and Cayman deadlines | When work is due, so advice lands before the crunch | Real, sourced |
| Company timesheets and AI usage | What each person actually spends their week on | Demo data (no real firm data at a hackathon) |

It gives three people one clear action each:

- **Employee:** asks a plain question, such as "What should I hand to AI before 18 November?". Athena, the intake step, checks the request is clear, then Handoff picks one skill with the hours and euros it frees before the deadline, plus a check step.
- **Partner:** sees every job ranked by fee lost, the AI-ready tasks inside each, and the upcoming deadlines.
- **AI Lead:** sees adoption and verify rates by team, real CSO and Eurostat benchmarks, cost per task, and the AI literacy log, exportable as CSV for Article 4.

Staff also get a short course on Anthropic's AI Fluency framework (the 4Ds: Delegation, Description, Discernment, Diligence). Every lesson and every skill tried lands in the literacy log.

**Honest limits:** company data is synthetic, and hour estimates need measuring in a real pilot. The engine is not tied to FRAME: swap in any firm's timesheets and deadlines.

## Pages

| Route | View |
|---|---|
| `/` | Overview and role picker |
| `/employee` | Employee question and skill card |
| `/partner` | Jobs by fee lost, deadlines |
| `/ai-lead` | Firm-wide adoption and the literacy log |
| `/literacy` | 4D AI Fluency course |
| `/skills` | Skills library, copy or export each skill |

## Run it

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

For the demo, pin "today" so the countdowns match the script:

```bash
npm run build
FRAME_TODAY=2026-11-07 npm start
```

In PowerShell, run `$env:FRAME_TODAY = "2026-11-07"; npm start` instead.

## Tests and checks

```bash
npm test
npm run build
npm run logic
```

`npm run logic` runs 30 realistic employee prompts against a running server and writes `logic-report.md`.

## Claude API key

Put your key in a file called `.env.local` in the repo root:

```
ANTHROPIC_API_KEY=your-key-here
```

`.env.local` is in `.gitignore`, so it is never committed. Without a key the app still runs: every Claude call has a fixed fallback answer built from the same engine numbers.

## How we built it

Two people, one day, coordinating AI agents through Relay, our own task board. Relay splits the build into tasks along a critical path, and every pull request passes tests and a review by the other person's agent before it merges.

