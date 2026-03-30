## Scale-From-Zero Demonstration (Objective #13)

This module simulates five brand-new creators, generates 30-day plans from HOT Recipe Book templates with Script Intelligence, runs daily simulations using Instant Analysis + Counterfactual Coach + A/B bandit experiments, and rolls up KPIs. It is MOCK-first and live-safe with fallbacks; all file writes are atomic and Windows-path-safe.

### Data & Storage

Files under `fixtures/scale/` (NDJSON):
- `creators.ndjson` — `{ id, handle, niche, platformSet, createdAtISO }`
- `plans.ndjson` — `{ creatorId, day1..day30: [{ templateId, seedIdea, script, timing, targetPlatform }] }`
- `sessions.ndjson` — `{ creatorId, day, actions[], outcomes{ views, viral, followersDelta, convDelta }, notes? }`
- `runs.ndjson` — `{ runId, createdAtISO, status, summary }`

Helper: `src/lib/scale/store.ts` implements append/read, list, atomic writes (tmp+rename).

### Planning

`src/lib/scale/plan.ts` → `make30DayPlan(creator, { seed })`:
- Pulls HOT templates from `data/seed/recipe-book.json`.
- Generates scripts with `lib/script/generate.generateScript`.
- Chooses target platform via simple Cross-Intel prior (TikTok lead) and schedules publish time windows.
- Deterministic when seed is provided; used in MOCK.

### Simulation

`src/lib/scale/simulate.ts`:
- `runDay(creatorId, day, planItems, { niche })` calls `/api/analyze` (mock-safe) to score a baseline, asks Coach for one variant, creates a tiny bandit experiment, samples a `viral48h` outcome from calibrated probabilities, and persists to `sessions.ndjson`.
- `run30Days(creatorId, plan, { niche })` loops days and aggregates totals.

### Metrics

`src/lib/scale/metrics.ts` → `computeMetrics(sessions)` returns:
- `viralEvents`, `medianTimeToFirstViral`, `avgFollowerDelta`, `successRate`, `templateWinRate`, `coachUpliftAvg`.

### APIs

- POST `/api/scale/create-creator` → `{ creator }`
- POST `/api/scale/plan` → `{ plan }`
- POST `/api/scale/run-day` → `{ session }`
- POST `/api/scale/run-30d` → `{ summary }`
- GET `/api/scale/summary` → global KPIs and followerGrowth
- GET `/api/scale/case-study/[creatorId]` → JSON or `?format=csv`

All routes catch errors and return valid shapes; no 500s.

### UI

Admin page `src/app/admin/scale/page.tsx`:
- Creators board with actions (Create, Generate 30-Day Plan, Run Day, Run 30 Days).
- KPIs panel and timeline snippet of sessions.
- Export Case Study via the case-study endpoint (download via `?format=csv`).

### Proof Tile #13

`/api/proof-tiles` updated in MOCK to compute PASS when:
- ≥5 creators exist, each has a 30-day plan,
- ≥3 viral events across all sessions,
- followerGrowth > 0 from `/api/scale/summary`.

Tile value example: `5 creators • 30-day sims • 7 viral events • +12.4k followers`.

### Live Mode

MOCK=0 uses the same code paths; API calls are wrapped with try/catch and fall back to script analyzer or demo experiment ids. Storage is local fixtures-only; hook up your live sources by adapting `analyzeDraft` and Coach endpoints.


