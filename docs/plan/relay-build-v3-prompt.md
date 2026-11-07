# Build plan: Frame Next v3 (everything except design)

Status: approved by Chulainn on 07-11-2026. Design is out of scope: Charlie owns it.
A ready-to-paste prompt for a new chat is at the end of this file.

## Goal

Make Frame Next a product any firm could pick up. Rename Harry to AI Lead, take every demo-data label off the site, help employees start with sample prompts, explain each skill, teach the 4D framework inside the site, and let an agent check Athena's logic without a human in the middle.

Done means: no page shows "Harry", "synthetic" or "demo data", a finished literacy lesson shows in the AI Lead literacy log, `npm run logic` runs the prompt bank and writes a report, and `npm run build` and `npm test` pass on `main`.

## Out of scope

- Visual design, layout, colours, fonts, the home page look. Charlie owns this. `docs/design/v3-wireframes.html` is reference only.
- Do not restyle CSS modules beyond what a new element needs to be readable. New elements reuse existing classes where one fits.

## Context to read first

- `docs/plan/relay-build-v2-prompt.md` (v2 acceptance tests, still binding)
- `contract/types.ts`, `contract/api.ts` (shared types)
- `app/harry/page.tsx`, `components/harry/` (becomes AI Lead)
- `app/employee/page.tsx`, `components/employee/EmployeeFlow.tsx`
- `app/skills/page.tsx`, `components/skills/SkillLibrary.tsx`, `catalogue/index.ts`, `catalogue/items/`
- `engine/literacy/index.ts`, `components/harry/LiteracyLog.tsx`
- `app/api/athena/`, `app/api/ask/`, `engine/athena/`

## Rules for every task

- Never read, print or edit `.env.local`. A human owns the key.
- No page shows the words "synthetic" or "demo data", and no badge for them. Data files and tests may still say synthetic.
- Touch only the files your task lists.
- No new npm packages.

## Frozen contract changes (made in R1, used by later tasks)

- `CatalogueItem` gains `howThisHelps: z.string()`, default `""` when the front matter has none.
- `LiteracyLogEntry.measure` gains `"lesson"`. A lesson entry uses `itemId` = lesson id (`4d-delegation`, `4d-description`, `4d-discernment`, `4d-diligence`) and `adopted: true`.
- New route `/api/literacy`: `GET` returns `{ entries: LiteracyLogEntry[] }`, `POST` takes `{ staffId, lessonId }` and returns the saved entry. Today's date comes from the server's `today` (honours `FRAME_TODAY`).
- The AI Lead page lives at `/ai-lead`. `/harry` redirects there.

## Tasks

**R1. Rename and remove labels (first, alone, because it touches every page).**
- Route `/harry` becomes `/ai-lead` (`app/ai-lead/page.tsx`). Add a redirect from `/harry` in `next.config.ts`.
- Folder `components/harry` becomes `components/ai-lead`. Fix every import.
- Every visible "Harry" string becomes "AI Lead", including the home page card, page titles, `/api/ask` prompts and demo script.
- Remove `SyntheticBadge`, the `synthetic` badge in `Num` (both partner and AI Lead), and every visible "(synthetic)" or "synthetic" in page text. Keep `synthetic` fields in data and the contract.
- Make the frozen contract changes above, and update `catalogue/index.ts` to read `howThisHelps`.
- Update tests to match.
- Done check: `grep -rni "harry" app components` finds only the redirect, `grep -rni synthetic app components --include=*.tsx` finds no visible text, `npm test` and `npm run build` pass.

**E1. Employee prompt library (after R1).** Files: `components/employee/**`.
- Add `components/employee/prompts.ts` with 6 to 8 sample prompts from real work: VAT return, CT1, bank reconciliation, payroll, a client email reply, "What should I hand to AI before 18 November?", and "I don't trust AI, what's the safest thing to start with?".
- Show them above or below the question box. Each has a **Try this prompt** button that fills the box and moves focus to it. It never sends.
- Fix the "cost not set yet" text so it reads plainly when no price is set.
- Add a test that a button fills the box without sending.

**S1. How this helps you (after R1).** Files: `catalogue/items/*.md`, `components/skills/**`.
- Add a `howThisHelps:` line to every catalogue item: one plain sentence on what it saves and for whom.
- Show it on each skill card in the skills library, under the summary, labelled "How this helps".
- Extend `catalogue/catalogue.test.ts` (owned by S1) so every item has a non-empty `howThisHelps`.

**L1. 4D literacy course and log (after R1).** Files: `catalogue/literacy/**`, `app/literacy/**`, `components/literacy/**`, `app/api/literacy/**`, `engine/literacy/**`, `components/ai-lead/LiteracyLog.tsx`, `app/ai-lead/page.tsx`.
- Write four lessons on Anthropic's 4D AI Fluency framework: Delegation, Description, Discernment, Diligence. Each has a two-minute read and one exercise set in an Irish accounting firm (decide what part of a VAT return to delegate, rewrite a weak prompt, spot the error in an AI bank reconciliation, write the check step before filing). Cite Anthropic's AI Fluency course as the source and keep wording in your own words.
- New page `/literacy`: the four lessons, progress ("2 of 4 done"), and **Mark lesson complete** after each exercise.
- `/api/literacy` saves entries to `data/runtime/literacy-log.json` (add `data/runtime/` to `.gitignore`), creating it if missing. If the file cannot be written, keep entries in memory and log a warning.
- The AI Lead literacy log shows lesson entries from `/api/literacy` beside the existing entries, newest first, and the page renders on each request so a new lesson shows on refresh.
- Link `/literacy` from the employee page and the AI Lead page (one plain link each).
- Tests: the store round-trips an entry, the route rejects an unknown lesson, the log lists a lesson entry.

**A1. Logic prompt bank and judge (can start at once, beside R1).** Files: `tests/logic/**`, `scripts/logic-check/**`, `package.json` (one `logic` script only).
- `tests/logic/prompts.json`: 30 realistic employee prompts with the expected outcome for each: `decline` or `answer`, and for answers the task type (VAT, CT1, payroll, bank rec and so on), whether a named date applies, and whether a skill or "no matching skill" is right. Include the seven v2 acceptance prompts, vague ones ("help"), off-topic ones, named dates ("by Friday"), distrust, and typos.
- `scripts/logic-check/run.mjs` (plain Node, no new packages), run with `npm run logic`. It sends each prompt to `/api/athena` (and `/api/ask` when Athena says answer) on `http://localhost:3000` or `LOGIC_BASE_URL`, answers clarifying questions with the first option, and grades the reply with plain rules: decline when expected, no numbers on a decline, countdown matches a named date, skill fits the task type, prose does not say "before the deadline" when no countdown shows.
- It writes `logic-report.json` and `logic-report.md` (both gitignored), prints a pass count, and exits non-zero when any prompt fails.
- Add a small unit test for the grading rules in `tests/logic/grade.test.ts`.

**A2. The loop (after all tasks merge, needs the API key).**
An agent starts the server with `npm run build` and `npm start`, runs `npm run logic`, reads the failures, fixes the cause in the router, prompt or recommender, adds a unit test for each fix, and runs again. Stop when every prompt passes, after 5 rounds, or after two rounds in a row with no new pass. The agent works on its own branch, opens a PR with the final report, and a human merges.

**A3. Click-through (last).** An agent opens the running site in Chrome (Claude in Chrome) and clicks each role page, each **Try this prompt** button and one literacy lesson, then records any broken flow on Relay.

## Order

R1 and A1 run in parallel first. E1, S1 and L1 run in parallel after R1 merges. A2 runs after all of them merge. A3 runs last.

## Acceptance tests

1. No visible "Harry", "synthetic" or "demo data" on any page. `/harry` lands on `/ai-lead`.
2. Employee page: every **Try this prompt** button fills the box without sending.
3. Skills library: every skill shows "How this helps".
4. Finish one literacy lesson as the employee, open the AI Lead page: the log shows that lesson with today's date. Refresh: it is still there.
5. `npm run logic` runs every prompt in the bank and writes the report. After A2, every prompt passes.
6. All seven v2 acceptance tests still pass.
7. `npm run build` and `npm test` pass on `main`.

---

## Prompt for a new chat

Paste this into a new Claude Code chat opened in `C:\Users\chula\Coding Projects\CsHackathon`.

```text
Build Frame Next v3 from docs/plan/relay-build-v3-prompt.md. Read that file first, then the files it lists under "Context to read first".

Design is out of scope: Charlie owns layout, colour and fonts. Do not restyle pages.

Work in this order:
1. Run git checkout main and git pull. Check which tasks are already merged: look for app/ai-lead, components/employee/prompts.ts, howThisHelps in catalogue/items, app/literacy and scripts/logic-check. Skip anything already on main.
2. Do each remaining task (R1, A1, E1, S1, L1) on its own branch named v3/<task-id>, in the order the plan gives. Keep to the files each task lists.
3. After each task, run npm test and npm run build. If either fails, fix it before moving on.
4. Open one PR per task with gh pr create. Merge it with gh pr merge --squash once checks pass.
5. Then run task A2: start the app with npm run build and npm start, run npm run logic in a second terminal, fix failures, and repeat up to 5 rounds. Never open or print .env.local.
6. Finish with the acceptance tests at the end of the plan and tell me which pass and which fail, with the command output.

Do not add a Co-Authored-By line to any commit.
```
