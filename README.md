# Frame Next

Frame Next tells each person at FRAME which AI habit or automation to adopt this week. It shows the hours, euros and tokens it saves before the next deadline.

Plan: `docs/plan/frame-next-build-plan.md`. Research: `docs/research/`.

## Run it

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. The home page links to the Employee, Partner and Harry views.

## Tests and build

```bash
npm test
npm run build
```

## Claude API key

Put your key in a file called `.env.local` in the repo root:

```
ANTHROPIC_API_KEY=your-key-here
```

`.env.local` is in `.gitignore`, so it is never committed. A human creates it. Agents never read or write it.

Without a key the app still runs: every module that calls Claude returns a fixed sample answer instead.

## Data labels

- Every synthetic number has `synthetic: true` and shows a "synthetic" badge.
- Every real number has a `source` URL, shown on hover.
