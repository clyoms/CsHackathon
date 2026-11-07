# Datasets research (7 Nov 2026)

Researched 7 Nov 2026 with web search and page fetches. Nothing downloaded, nothing signed up for. "V" = I opened the page or endpoint and it exists. "U" = unverified (search snippet only). Usefulness is 1-5.

Headline: no public dataset links an individual firm's AI use to its hours and revenue. The team must SYNTHESISE the firm layer (fake timesheets, openly labelled) and join it to REAL public layers (Claude usage by task, O*NET accountant tasks, exposure scores, Irish and EU AI adoption, tax deadlines). That join is the honest, defensible story.

## A. AI usage data

| Name | URL | Contents | Access | Licence | Live/static | Use |
|---|---|---|---|---|---|---|
| Anthropic Economic Index (V) | https://huggingface.co/datasets/Anthropic/EconomicIndex | Six releases (Feb 2025 to 26 Jun 2026). Claude usage mapped to O*NET tasks and occupations, automation vs augmentation split, geography, API vs chat, "economic primitives", learning curves. Folders: release_2025_02_10 to release_2026_06_26, labor_market_impacts, robot_exposure. Total 763 MB; latest release 296 MB, so pull single files. Column names not shown on the card (U: check each CSV header) | Hugging Face download, CSV, or `datasets` library | CC-BY data, MIT code (card text says CC-BY, metadata tag says MIT; attribute anyway) | Static, periodic releases | 5: task-level and already keyed to O*NET, the bridge to accountant tasks |
| AEI labor_market_impacts (V) | https://huggingface.co/datasets/Anthropic/EconomicIndex/tree/main/labor_market_impacts | job_exposure.csv (37 kB) and task_penetration.csv (1.9 MB). Tiny, ideal for a hackathon | CSV | as above | Static | 5: small, occupation and task level |
| Claude Enterprise Analytics API (V) | https://platform.claude.com/docs/en/manage-claude/analytics-api | Per-user daily: chat conversations, messages, projects, files, artifacts; Claude Code sessions, commits, PRs, lines; skills and connectors. Org daily/weekly/monthly active users, seats, cost and token reports. Data from 1 Jan 2026, about 1 day lag | REST; needs an Analytics API key from the primary owner of an Enterprise org | Customer's own data | Live | 3: the real schema a product would ingest; team has no key, so mock the shape |
| Claude Code Analytics API (V) | same page as above | Daily per user: sessions, lines of code, commits, PRs, tool acceptance, estimated cost by model. Endpoint `/v1/organizations/usage_report/claude_code` | REST, Admin API key, free | Customer data | Live (about 1h lag) | 2: coding focus, not accountants |
| GitHub Copilot usage metrics (V) | https://docs.github.com/en/copilot/reference/copilot-usage-metrics/copilot-usage-metrics | Per-user daily: user_login, user_initiated_interaction_count, code_generation and acceptance counts, loc_added/deleted, used_chat/agent/cli flags, ai_credits_used, ai_adoption_phase, breakdowns by IDE, feature, model. Enterprise or org, 1-day and 28-day, plus per-repo | REST API and NDJSON export; needs org admin token | Customer data | Live | 2: good schema to copy for mock data; developer-centric |
| CSO ICA237 Enterprise use of AI (V) | https://data.gov.ie/en_GB/dataset/ica237-enterprise-use-of-artificial-intelligence | Irish firms using AI by technology, size, sector. Press says 20% of firms in 2025, 15% in 2024, 8% in 2023 (U: confirm against the table). Data.gov.ie shows updated 2026-02-06 | CSV/JSON-stat/PX/XLSX, e.g. https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/ICA237/CSV/1.0/en | CC-BY 4.0 | Annual, static | 4: local, citable, instant "Ireland benchmark" |
| Eurostat isoc_eb_ain2 (V) | https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ain2?format=JSON&geo=IE | AI use by 50 NACE sectors (incl. professional services), 63 indicators (technologies, purposes, barriers, own vs bought), firms with 10+ staff, all EU countries. Updated 15 Jun 2026; 2025 data present | REST JSON-stat, no key | Eurostat free reuse with attribution | Annual, static | 4: sector-by-country benchmarks; the barriers are good UX material |
| OpenAI "How People Use ChatGPT", NBER w34255 (partly V) | https://www.nber.org/papers/w34255 | About 1.1M sampled conversations; 24 categories in 7 topics; Asking/Doing/Expressing split. No raw data download found (U) | Paper only | NBER terms | Static | 2: stats to quote, not to load |
| Microsoft Work Trend Index (partly V) | https://www.microsoft.com/en-us/worklab/work-trend-index | Annual survey report (2025: 31,000 workers, 31 countries; a 5 May 2026 edition is listed). No raw data found | Report/PDF | Microsoft copyright | Static | 1: quote only |
| Microsoft Copilot Dashboard / Viva Insights fields | not found | Not researched successfully | n/a | n/a | n/a | U |
| OECD AI data | not researched | n/a | n/a | n/a | n/a | U |

## B. Work and time data

| Name | URL | Contents | Access | Licence | Live/static | Use |
|---|---|---|---|---|---|---|
| O*NET 31.0 database (V) | https://www.onetcenter.org/database.html | Task statements, task ratings, work activities, skills for every occupation (e.g. Accountants and Auditors 13-2011.00; code from memory, U). Full zip db_31_0_excel.zip plus per-file CSV/JSON/SQL | Download (not fetched, size not checked). Web Services API needs sign-up, so avoid | CC BY 4.0 | Static, versioned | 5: the task list that everything joins on |
| Felten AIOE (V via search) | https://github.com/AIOE-Data/AIOE | AIOE_DataAppendix.xlsx: AI exposure by 6-digit SOC occupation, plus industry and county | GitHub download | Repo licence not checked (U) | Static (2021 paper) | 3: occupation level only, older |
| Eloundou et al "GPTs are GPTs" (U) | https://arxiv.org/abs/2303.10130 | Task-level LLM exposure (human and GPT-4 labels) on O*NET tasks. No official repo found; data in appendix or from authors | Paper or ask authors | Unclear | Static | 3: hard to get; AEI task data does the same job better |
| CSO earnings and hours (partly V) | EHQ03 and NSA03 on data.gov.ie / ws.cso.ie (same URL pattern as ICA237) | Average earnings, hours worked, employment, labour costs by NACE sector (professional/scientific/technical is section M). Whether accounting is split out: U | PxStat API or CSV | CC-BY (CSO standard, U) | Quarterly | 3: euro per hour turns "hours AI could save" into money |
| Public timesheet / billable-hours data | none found | Searches found HR datasets with attendance or monthly hours only; none with billable hours | n/a | n/a | n/a | 1: generate a synthetic timesheet and label it as such |
| Irish accounting-sector stats | not found | U | | | | U |

## C. Calendars and registers

| Name | URL | Contents | Access | Licence | Live/static | Use |
|---|---|---|---|---|---|---|
| Revenue pay and file dates (via search snippet, U) | https://www.revenue.ie/en/tax-professionals/ebrief/2026/no-0342026.aspx | 2025 Form 11: 31 Oct 2026 standard, 18 Nov 2026 if paid and filed on ROS (also CAT). No iCal found; the tax-calendar URL I tried returned 404 | Manual (hand-key dates) | Irish gov, check terms | Annual | 3: 11 days after hackathon day, good live hook; hand-entered |
| CRO Company Records and Financial Statements (V) | https://opendata.cro.ie/en_GB/dataset/ (CKAN API: https://opendata.cro.ie/api/3/action/datastore_search) | All registered companies, CSV, daily snapshot; plus a Financial Statements dataset. Field names U | CKAN JSON API (no sign-up) and CSV | CC BY 4.0 | Live (daily) | 4: real register; annual-return due dates could be derived (check fields) |
| CRO Open Services API | https://services.cro.ie | Company and officers | REST, free but needs an account (do NOT sign up) | Acceptable-use terms | Live | 1 |
| Irish public holidays (V) | https://date.nager.at/api/v3/PublicHolidays/2026/IE | 11 entries for 2026, JSON, no key | REST | Open source, free | Yearly | 4: easy working-day maths; cross-check with gov.ie |
| Cayman CIMA fund filings (U) | https://www.cima.ky | Law-firm notes: audited accounts and Fund Annual Return within 6 months of year end (30 Jun for a 31 Dec year end). No official machine-readable calendar found | Manual | n/a | Static | 3: Frame has a Cayman office, so a cross-jurisdiction touch |
| Central Bank of Ireland / ESMA registers | not researched | U | | | | U |

## D. Student AI use (brief; Kaggle pages not opened, so all U)

| Name | Where | Contents | Licence | Use |
|---|---|---|---|---|
| Student AI Tool Usage (zohairbaloch) | Kaggle | About 230 responses: tools used, weekly AI hours, self-reported score /100; one analysis found a weak link (r 0.17) | U | 2 |
| AI Tool Usage by Indian College Students 2025 | Kaggle | About 496 rows, 16 columns incl. trust and grade impact | U | 2 |
| AI Dependency and Academic Vulnerability, Bangladesh | https://data.mendeley.com/datasets/6s6nvmpgbb | Survey with CGPA and daily AI hours | U | 2 |
| IEEE DataPort student AI surveys | https://ieee-dataport.org/documents/ai-tool-usage-among-college-students | Raw survey tables | Login may be needed | 1 |

Student data is small, self-reported and foreign; it does not suit a professional-services sponsor. Skip unless pivoting.

## Top 5 novel combinations

1. "Which of my hours could AI take?" AEI task_penetration + O*NET accountant/auditor/tax tasks + a synthetic timesheet whose categories match O*NET tasks. Output: per-person weekly hours by task, AI-ready share, euro value via CSO hourly earnings, in plain English.
2. Deadline-aware AI workload planner. Revenue 31 Oct / 18 Nov dates + Irish holidays + CRO company list (who files when) + O*NET task shares. Shows which crunch weeks need AI help and which tasks to automate first.
3. "Are we ahead of Ireland?" Staff AI-usage mock (shaped like the Claude Enterprise analytics fields) vs CSO ICA237 and Eurostat isoc_eb_ain2 for the professional-services sector. A live benchmark bar for the firm.
4. AI-literacy path per role. AEI augmentation-vs-automation split per O*NET task + Eurostat "barriers" indicators (skills, cost, legal) to recommend the first workflow each job title should learn.
5. Cross-jurisdiction compliance clock. Irish Revenue/CRO dates + Cayman 6-month CIMA rule + public holidays in each office country (Nager covers IE, GB-style, US, KY coverage U), showing capacity risk across Cork, Dublin, New York and Cayman.

## Caveats / unverified
- AEI CSV column names and exact file names not checked; open one header before committing.
- Nothing downloaded. O*NET zip and AEI releases are large; fetch only the small files.
- Press figures for CSO AI adoption not checked against the table itself.
- Copilot Dashboard fields, OECD AI, CBI/ESMA registers, Irish accounting-sector stats: not found or not researched.
- Revenue pay-and-file dates came from a search summary of Revenue's eBrief; open the page to confirm before showing judges.
