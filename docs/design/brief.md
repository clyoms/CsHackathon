# Frame Next: design brief

Status: **draft, waiting for a human yes** (Relay T-7).

## Brief

Frame Next should feel like a well-kept ledger on the desk of an Irish accounting firm in deadline week: calm paper, dark ink, and one bright mark where the money is. The base is warm **ledger paper** with deep **counting-house green** ink. A single bright **vermilion** accent is kept for the one main action on each screen and for the key numbers (hours back, euros, days to go). Numbers get the accountant's convention: a double rule under a total. Headings are set in **Fraunces**, a soft old-style serif with real character. Body text and figures are set in **IBM Plex Sans**, with tabular figures so columns line up like a trial balance. Both load through `next/font/google`, which is built into Next, so there are no new npm packages. The motif is the ledger page itself: hairline horizontal rules behind tables and cards, a narrow left margin rule, and deadlines shown as ticks on a calendar strip. No purple gradients, no stock card grids, no generic system sans. The existing purple **synthetic** badge stays as it is and stays distinct: purple appears nowhere else, so "made-up number" always looks different from "real number".

## Colour tokens

All ratios are WCAG 2.x contrast ratios, measured with the standard relative-luminance formula. AA for body text needs 4.5:1.

### Light mode

| Token | Hex | Use | Measured on | Ratio |
|---|---|---|---|---|
| `--paper` | `#F6F1E7` | Page background | – | – |
| `--surface` | `#FFFDF8` | Cards, tables | – | – |
| `--ink` | `#1C2B24` | Body text | paper / surface | **13.13** / **14.54** |
| `--muted` | `#4F5B55` | Secondary text, captions | paper / surface | **6.30** / **6.98** |
| `--green` | `#1F4D3F` | Headings, links, ledger rules (strong) | paper | **8.51** |
| `--accent` | `#C2410C` | Main action, key numbers, double rule | paper / surface | **4.60** / **5.09** |
| `--on-accent` | `#FFFFFF` | Text on the accent button | accent | **5.18** |
| `--rule` | `#D8CFBD` | Hairline ledger lines (decoration, never text) | – | – |
| `--badge-fg` / `--badge-bg` | `#5B2A9A` / `#F1E6FF` | Synthetic badge (unchanged) | badge bg | **7.80** |

### Dark mode

| Token | Hex | Use | Measured on | Ratio |
|---|---|---|---|---|
| `--paper` | `#121A16` | Page background | – | – |
| `--surface` | `#1A241F` | Cards, tables | – | – |
| `--ink` | `#EDE6D6` | Body text | paper / surface | **14.25** / **12.83** |
| `--muted` | `#A9B3AC` | Secondary text | paper / surface | **8.21** / **7.39** |
| `--green` | `#7FB59E` | Headings, links | paper | **7.60** |
| `--accent` | `#FF8A4C` | Main action, key numbers | paper / surface | **7.59** / **6.83** |
| `--on-accent` | `#121A16` | Text on the accent button | accent | **7.59** |
| `--rule` | `#2C3A33` | Hairline ledger lines (decoration) | – | – |
| `--badge-fg` / `--badge-bg` | `#E4D2FF` / `#3B2160` | Synthetic badge, dark version | badge bg | **9.51** |

Every text pairing is at least 4.5:1. The tightest is the light accent on paper at 4.60, so accent numbers on paper should be bold or 20px and up.

## Type

- **Fraunces** (Google Fonts): headings and the big numbers on the role cards. Weights 600 and 700, optical size on.
- **IBM Plex Sans** (Google Fonts): body, tables, buttons. Weights 400, 500 and 600, with `font-variant-numeric: tabular-nums` on all figures.
- Base size 18px, 20px on the employee view. Line height 1.5.

## Home: "Who are you today?"

The home page asks one question, **"Who are you today?"**, over three role cards laid on a ledger page. They read like three lines in a book, not a stock grid.

| Card | Face | Promise (one line) | Live number |
|---|---|---|---|
| **Aoife**, Tax Assistant, Cork | Drawn monogram portrait "A" in a green ink circle (no stock photo) | "Find the one thing to hand to AI before your next deadline." | **15.7 h** back before 18 Nov `synthetic` |
| **Partner** | Monogram "P" | "See which jobs are losing money, and why." | **€8,677** lost on Walsh Holdings `synthetic` |
| **Harry**, AI and Automation Analyst | Monogram "H" | "Track how the firm uses AI and what it costs." | **39%** of Tax AI output checked `synthetic` |

- Each live number is computed from the engines on page load, not typed in. Each carries the synthetic badge, because it comes from made-up Frame data.
- The number sits in `--accent` with the accountant's double rule beneath it. Name and role are in `--ink`, the promise in `--muted`.
- The whole card is one link, with a visible focus ring in `--green` (keyboard reachable). Hover lifts the ledger rule under the card to `--accent`.
- Below 640px the cards stack. The page keeps a 16px side gutter, with no horizontal scroll.

## Out of scope for this brief

Logos, illustrations beyond the monograms, and motion beyond a 150 ms hover transition.
