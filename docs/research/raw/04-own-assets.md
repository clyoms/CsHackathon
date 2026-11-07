# 04 - Own assets (what Chulainn already has that fits Frame's challenge)

Compiled 7 Nov 2026 from the vault, TOP-shared, TopOS, skills folder and second-brain-harness. Read-only research. No log contents quoted.

## 1. Assets we can reuse today

| Asset | What it does | Real data it produces | Fit to Frame's challenge |
|---|---|---|---|
| TOP analyzer (tokenoptimisationprotocol.org, Adam's) | Reads a person's downloaded Claude Code / Claude chat / ChatGPT history or an Obsidian folder, in the browser, and reports usage by model, cost, token breakdown | Per-person AI usage history, never sent to a server | The "AI usage data" half of the suite, with a privacy model already worked out |
| Icarus (TOP-1, in testing) | Forecasts low/likely/high cost of a task before it starts | 414-turn replay results (see section 2) | Shows how to turn raw usage into a pre-action warning |
| Athena (TOP-3 idea, runs live as a protocol) | Asks 1-3 multiple-choice questions before non-trivial work, only when the answer changes the outcome | Content-free session logs | A "coach" pattern: ask before acting, measure whether asking helped |
| Athena log corpus | Logs one row per session, including sessions that asked nothing | 141 logs (30 Jul to 3 Sep), 123 comparable, 30 control sessions | Proof you can measure coaching with no content stored (privacy by design) |
| Daedalus (planned, not built) | Pick the right model per task | Nothing yet | Idea only: right-size the tool to the task |
| TopOS (spec, mockups in `Coding Projects/TopOS/screens`: agora, products, pulse, vault) | A shared board where work is specified, priced, routed and claimed by a person or an agent | Mockup only | Dashboard shape for a manager view |
| Relay (built 6 Nov, this repo's tool) | Cloud board so agents on separate accounts see each other's tasks, claim, checkpoint, return work | Task and claim records | The coordination layer for this hackathon, and a model for team automation |
| second-brain-harness hooks | Small programs that enforce rules: send guard, claim guard (no two agents write one file), build gate, chat-size nudge, reply card and meter, model-family, session start | Hook events (blocked sends, nudges) | Direct examples of "hooks" a Frame suite could ship: safe-by-default rules staff cannot forget |
| Skills in `.claude/skills` | build (gated builds: define done first), pro-team and forge-team (worker teams), project-model-selector (pick model and effort per stage), sweep (read-only inbox/calendar/vault sweep), visual-artifact (HTML explainers), obsidian-* (vault notes), defuddle (clean web text), find-skills, agent-reach (social research), brag (launch video) | n/a | Examples of skills and plugins to recommend per role |
| Harness starter skills | bug-hunter, fact-discipline, honest-advisor, intake, project-planner, security-sweep | n/a | Ready-made starter pack for a professional services firm (fact-checking and security suit consultancy work) |
| IS3322 CA work | Three public datasets plus own survey design on AI use vs grades | See section 3 | A ready analysis method and survey for "how people use AI", reusable for staff |

## 2. Numbers we can honestly cite, and ones we must not

**Cite (with source):**
- Icarus 414-turn walk-forward replay: median error about 2.0x, beats guessing the running median (2.37x) by about 15%, 77.5% of turns inside the band, 67.2% of dollars, median band width 17.9x. Source: `SecondBrain/11 - TOP/07-08-2026 - Icarus forecasting - where it stands.md`.
- Early testing: estimates averaged about 3.3x actual developer pricing, so calibration is the open problem. Say it as a limit. Source: `11 - TOP/TOP - Token Optimization Protocol.md`.
- Runaway turns: 10.6% of turns carried 31.3% of spend (median 29.5 calls vs 6); a second dataset showed 15% of rows and 36% of spend. Same Icarus note.
- Cost driver: number of calls the model chooses to make is about 64% of cost variance, per the meter's own code. Same note.
- Athena corpus size as counted 4 Sep: 141 logs, 123 on schema 2, 66 sessions ran a round, 57 ran none, 30 controls. Source: `11 - TOP/04-09-2026 - Athena log corpus - what it is and where it lives.md`. The corpus has not been analysed yet, so cite its size and design, not results.
- IS3322 figures in section 3 (source: `02 - University/Modules/IS3322 - Business Analytics/17-10-2026 - IS3322 2nd CA plan.md`).

**Do NOT claim (TOP hard rules from Adam, 18 Jul, same TOP note):**
- No savings percentages. Nothing is proven to save money.
- No "empty category" claim. Competitors exist; the wedge is the personal pre-run forecast.
- Daedalus and Athena-as-coach are planned, not live. Never imply measured improvement from Athena.
- Never say "91% accuracy". That was the cache-read share of usage, not forecast accuracy.
- Do not say the forecast is accurate. Honest line: typically about twice or half the real number.
- Corrections count in the Athena logs is the model marking its own homework (schema says so). Do not present it as proof coaching works.
- Local models and "Bitcoin of AI" ideas are conditional only; no hardware priced.
- Kaggle student data is likely synthetic; Bangladesh is self-selected. Do not present them as population facts.

## 3. IS3322 findings and a student version

**Question:** does the way students use AI relate to grades more than the amount?

- Amount barely relates to grades: Kaggle (50,000 rows, likely synthetic) r = -0.02; Colombia (357 real students) r = 0.09; Bangladesh (1,104 real, self-selected) r = 0.09.
- Upside-down U in Kaggle and Colombia: moderate users do best, heaviest drop back. Kaggle 20+ hours a week: +0.16 GPA change vs +0.23 at 5-10 hours.
- Way of use matters in Kaggle: main use debugging, 62% reach a 2:1 or above and 50% move up a band; direct answers, 54% and 36%.
- Bangladesh: 86% of heavy users (3+ hours a day) say they submit work they do not fully understand vs 20% of light users, yet grades are no lower. Only 14% of heavy users verify AI output vs 85% of light users. The split is unusually sharp; the plan says it needs checking.
- Takeaway for the plan: grades may be the wrong measure; ask about understanding and checking habits.
- Own 31-question Microsoft Form was built (consent gate, no names, attention check, groups under 5 suppressed, deletion by 31 Jan 2027). Replies not recorded in the plan, so do not quote form results.

**Student version for the hackathon:** an anonymous short survey plus optional pasted usage summary (hours, main use, verify/understand statements copied word for word from Bangladesh). Output per student: a band for amount, a profile for how they use AI (checks output, uses unchanged, submits without understanding), and 2-3 recommended habits, skills or tools (for example "try debugging-style prompts, add a verify step"). Show the cohort view only for groups of 5 or more.

## 4. Five concept seeds

1. **AI Fluency Profile (privacy-first).** Employee drops a Claude/ChatGPT export into a browser-only analyzer (TOP pattern); it shows how they use AI (amount, kinds of task, verify habits) and suggests the next skill. Manager sees only team aggregates.
2. **Hook pack for firms.** Ship guards like the send guard, fact-discipline and security-sweep as a starter kit, and recommend which to turn on based on role (client email sender vs analyst). Rules in code, not memos.
3. **Ask-before-you-act coach (Athena for staff).** Two or three questions before a big task, only when worth it; logs content-free counts so Frame can see where coaching helps without reading anyone's work. Control sessions give an honest test.
4. **Cost and effort meter for teams (Icarus-lite).** Before a long automated job, warn of a likely cost range and flag the 10% of runs that eat a third of spend. Show uncertainty openly, no savings promise.
5. **Understanding check, not just output.** From the IS3322 finding: heavy use with low verifying habit is the risk. Suite flags "output used unchanged" patterns and recommends a review habit or a checking skill, aimed at junior staff learning on client work.

Bonus fit: Relay's board pattern lets the suite turn recommendations into claimable tasks ("adopt skill X this week").
