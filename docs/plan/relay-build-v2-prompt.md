# Relay build prompt: Frame Next v2 (employee fixes + new frontend)

Paste everything below the line into `/relay-plan`. It plans the goal card and task graph only. Humans start the build.

---

## Goal

Make Frame Next work live with Claude and look like a product people remember. The employee view must be simple enough for a non-technical tax assistant. The whole site gets a new, distinctive frontend.

Done means: every employee test prompt in "Acceptance tests" passes with the API key set, the new design ships on all four pages, and `npm run build` and `npm test` pass.

## Context to read first

- `docs/demo-script.md` (current click path and numbers)
- `docs/plan/frame-next-build-plan.md` (original plan and contract)
- `app/api/athena/handler.ts`, `engine/athena/index.ts` (Athena and its no-key fallback)
- `app/api/ask/handler.ts` (written answers and fallback)
- `engine/recommend/`, `catalogue/` (how a skill is picked)
- `app/employee/page.tsx`, `components/employee/`

## Rules for every task

- Never read, print or edit `.env.local`. A human owns the key.
- Keep the no-key fallback, but make it visible (see task A1).
- Synthetic numbers keep the purple synthetic badge. Real numbers keep their source.
- Touch only the files your task lists.

## Workstream A: live Claude and correct logic (do first)

**A1. Prove whether Claude is actually called.** In live testing every answer looked like the fixed fallback, and the page showed "AI used for this task: 0 tokens". Find out why. Check that the server reads `ANTHROPIC_API_KEY` at request time, that errors are not silently swallowed, and that the model ID is current. Log the reason for every fallback to the server console. Show a small "offline answer" label on screen whenever a fallback is used, so testers can tell. Done when a live run shows a non-zero token count and no offline label.

**A2. Off-topic and nonsense questions.** "What's the weather in Cork?" ran three Athena questions, then returned Bank reconciliation with 15.7 hours and €1,336. That is wrong. Athena must first decide whether the question is about the employee's work. If not, reply in one line that Frame Next helps with work tasks, and stop. No skill, no numbers.

**A3. Respect the user's deadline.** "Can AI do my VAT return for Byrne Foods by Friday?" still showed "11 days to go" for ROS on 18 November. If the user names a date or day, parse it and count down to that. Pick a skill and deadline that fit the task named (VAT, not ROS). If the named task has no matching skill, say so plainly.

**A4. Stop defaulting to Bank reconciliation.** The recommender must use the client, task and goal from Athena's answers. "I don't trust AI, what's the safest thing to start with?" should return a low-risk skill with a strong check step, not the same default. Add a test for each case.

**A5. Skill bank grows.** The humans will add more skills to `catalogue/items`. Make sure the recommender and tests handle any number of skills, with no hard-coded skill names.

## Workstream B: simpler employee result

Keep: time back, what it is worth, the deadline (for example "ROS pay and file" or "CT1 return and balance, year end") with its countdown, and the sources.

Remove:
- The "time as an estimate" line ("about 30% of the 52.4 hours AI can help with come back to you").
- The long before-use box. Replace it with one line that tells the employee to check AI output before they rely on it, because the work is delegated, not handed off.
- Any other text that does not help the employee act now.

Add an **Export skill** button next to Copy skill. It downloads the skill as a file (`<skill-name>.md`, in the Claude Skill format with a `SKILL.md` style header). After download, show one short line on where to put it, for example: "In Claude, open Settings, then Capabilities, then Skills, and upload this file." Check the current Claude path before writing the line, and do not guess it.

## Workstream C: new frontend (all pages)

The current pages look like plain HTML. Make the site stand out while staying easy for non-technical staff.

- **Colour:** two colours that sit well together, plus one bright accent used only for the main action and key numbers. Check contrast meets WCAG AA (the standard readability rule) in light and dark mode.
- **Not generic:** avoid the default SaaS look (purple gradients, stock card grids, generic sans-serif). Choose a clear identity that suits an Irish accounting firm at deadline time, for example a calendar or ledger motif. Write a one-paragraph design brief first and get a human yes before building.
- **View picker:** replace the three plain links on the home page with something memorable. For example, three large role cards with a face, a one-line promise and a live number each, or a "who are you today?" picker.
- **More depth, still simple:** add richer layout and motion on partner and Harry (charts, hover detail, a crunch calendar strip). The employee page stays the simplest page: one question box, one result.
- **Works on a phone width** with no sideways scrolling.

## Order

A1 first, because it blocks all live testing. Then A2 to A5 and B in parallel where files do not overlap. C starts with the design brief and human approval, then pages in parallel. Employee page design waits for B.

## Acceptance tests (run with the key set)

1. `What should I hand to AI before 18 November?` then **All my clients**: one skill, time back, worth, countdown, sources, Export skill. No estimate line. One-line check reminder.
2. `help`: Athena asks clarifying questions, then gives a skill that matches the answers.
3. `Can AI do my VAT return for Byrne Foods by Friday?`: countdown to Friday, VAT-related skill or a plain "no matching skill".
4. `What's the weather in Cork?`: one-line decline, no skill, no numbers.
5. `I don't trust AI, what's the safest thing to start with?`: a low-risk skill, not the default.
6. Every answer shows a non-zero token count and no "offline answer" label.
7. Export skill downloads a valid file and shows where to upload it.

Partner and Harry live tests wait until these pass.
