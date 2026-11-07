# Frame Next: demo script (3 minutes)

The click path for the pitch, and what to say at each step. Numbers below are what the app showed on 7 Nov 2026 with no API key. Made-up Frame numbers carry a purple **synthetic** badge on screen; real numbers show their source on hover. Say so when you point at them.

## Before you start (5 minutes before)

```bash
npm run build
FRAME_TODAY=2026-11-07 npm start
```

In PowerShell, run `$env:FRAME_TODAY = "2026-11-07"; npm start` instead.

- Open `http://localhost:3000` in a full-width browser window.
- `FRAME_TODAY` pins "today" so the partner calendar and API answers match this script. The employee countdown uses the laptop's date.
- With `ANTHROPIC_API_KEY` in `.env.local` (a human sets this; agents never touch it), Athena and the written answers come from Claude. Without it, the app uses fixed fallback answers built from the same engine numbers. The demo works either way.
- Warm the server up once: open `/employee` and ask any question, so the first live request is not slow.

## 1. Home (10 seconds)

**Click:** nothing yet. Point at the three role cards. The skills library link under them lists every skill, ready to copy or export.

**Say:** "Frame Next tells each person at FRAME which AI habit to adopt this week, and what it saves before the next deadline. Three views: Aoife, a tax assistant; a partner; and Harry, who runs AI adoption."

## 2. Employee view: Aoife (70 seconds)

**Click:** Employee. Type `What should I hand to AI before 18 November?` and press Enter.

**Say:** "Aoife isn't technical. She asks in plain words. Before anything goes to AI, Athena checks whether the request is clear enough."

**See:** one question, "Which client is this for?", with Murphy Engineering Ltd, Byrne Foods, Kelly Family, Quinn Tech DAC and All my clients.

**Click:** All my clients.

**See:** "Try this skill: Bank reconciliation". About **15.7 hours** and **€1,336.89** back (synthetic), with ROS pay and file (extended) **11 days to go**, Wednesday 18 November.

**Say:**
- "One skill, not a menu. The engine took her eight weeks of timesheets, matched each line to an O\*NET task, and weighted it by how much people already use AI for that task. That's the Anthropic Economic Index, real data."
- "The 18 November date is real." *Hover or click* **source**: it opens Revenue's eBrief 034/26.
- "Hours and euros are synthetic, because we have no real Frame data. The badge says so."
- "She checks only 18% of AI output today, so the engine favours items with a check step." *Point at the yellow box.*

**Click:** Copy skill, then I'll try it.

**Say:** "She copies the skill straight into Claude. 'I'll try it' records the adoption for Harry's literacy log."

**Optional click:** Export skill. It downloads `bank-reconciliation.zip`, a folder with SKILL.md that Claude takes as it is (Customize, Skills, Upload a skill).

## 3. Partner view (45 seconds)

**Click:** ← Who are you today?, then Partner.

**See:** 10 engagements, sorted by money lost. **Walsh Holdings** has lost **€8,677**: 330.5 h against 260 budgeted, €97 an hour. Murphy and Byrne are also over budget.

**Say:** "Partners see which jobs leak money, and why."

**Click:** ▸ Walsh Holdings.

**See:** the task breakdown. "Examine records and interview workers…" has AI usage share 0.954 (hover for the Economic Index source). Recommended for the team: **Working-paper summary**.

**Say:** "Walsh's biggest AI-ready block is audit fieldwork, a task that scores 0.954 for AI use in the Anthropic Economic Index. Reconciliation tasks score zero in the real data, and we show that honestly."

**Point:** the crunch calendar. ROS on 18 Nov, then CT1 and VAT on 23 Nov, marked *unconfirmed* because they come from Revenue's rule, not a dated page.

**Optional click:** type `Which jobs are losing money, and why?` and press Enter. The answer reads "3 of 10 engagements are over budget. Walsh Holdings has lost €8,676.92…" and names the source of each number.

## 4. Harry view (40 seconds)

**Click:** ← Who are you today?, then Harry.

**Say:** "Harry needs the firm-wide picture."

**Point, top to bottom:**
- **Adoption by team:** Tax uses AI the most (2,884 prompts) but checks only **39%** of outputs. That's where verify training goes first.
- **Frame against Ireland and the EU:** real benchmarks. CSO 2025: **20.2%** of Irish enterprises use AI. Eurostat 2025, legal and accounting: Ireland **27.9%**, EU **37.92%**. Hover for sources. Frame's bar counts staff, not firms, so it's a rough guide.
- **Cost per task:** about **40,800 tokens** per task, and the top 10% of tasks take **27%** of tokens. Euros appear once we fill in Anthropic's prices; we never invent a price.
- **AI literacy log:** every recommendation shown is logged, as evidence for EU AI Act Article 4.

**Click:** Export CSV. **Say:** "One click gives the compliance file."

## 5. Close (15 seconds)

**Say:** "Real public data, honest about what's synthetic, one habit per person, with hours and euros attached. Every Claude call has a no-key fallback, so it never breaks on stage."

## If something goes wrong

- **The question box says "Thinking…" for a long time:** the first request after start is slow. Wait 3 seconds, or warm up as above.
- **No API key, or Claude errors:** the app falls back to fixed answers built from the same numbers, and nothing on screen breaks.
- **Countdown not "11 days":** the laptop date isn't 7 Nov. Say "days to go" without the number.
