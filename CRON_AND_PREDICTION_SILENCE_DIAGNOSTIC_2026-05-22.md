# CRON + PREDICTION_RUNS SILENCE — READ-ONLY DIAGNOSTIC

**Generated:** 2026-05-22
**Mode:** Read-only. No source files modified, no DB writes, no crons triggered, no build/deploy commands.
**Repo root:** `C:\Projects\CleanCopy`
**Current branch:** `vercel-deploy-test` (HEAD `dab05ff`, 2026-05-15)

---

## THREAD A — CULTURAL-SCAN AND SIBLING CRONS SILENCE

### A.1 — Authentication / CRON_SECRET check

All four routes use the **same** auth pattern: read `Authorization` header, compare against `Bearer ${CRON_SECRET}`. **If `CRON_SECRET` is unset, the auth gate is bypassed** (any caller succeeds).

| Route | File | Auth gate line(s) | Pattern |
|---|---|---|---|
| `/api/cron/cultural-scan` | `src/app/api/cron/cultural-scan/route.ts` | **494–497** | `if (process.env.CRON_SECRET && auth !== \`Bearer ${process.env.CRON_SECRET}\`) return 401` |
| `/api/cron/classify-events` | `src/app/api/cron/classify-events/route.ts` | **111–114** | identical |
| `/api/cron/overnight-triage` | `src/app/api/cron/overnight-triage/route.ts` | **26–29** | identical |
| `/api/atlas/feedback-collector` | `src/app/api/atlas/feedback-collector/route.ts` | **152–155** | identical (inside shared `handle()`; both GET + POST) |

None of these routes accept `?token=X`. (`/api/cron/training-pipeline:21` does, but that path is **not** in `vercel.json`.)

### A.2 — Vercel cron auth requirement

The pattern `Authorization: Bearer ${CRON_SECRET}` matches Vercel's documented cron contract — when `CRON_SECRET` is set on the project, Vercel-fired crons send exactly that header. So if `CRON_SECRET` is set in **both** Vercel project envs and the code reads it from `process.env`, the gate passes. If `CRON_SECRET` is only set in one place, the gate fails closed (any inbound header `!==` `Bearer undefined` returns 401).

No header-name mismatch found. No alternate auth scheme (`x-cron-secret`, `x-api-key`, etc.) is checked by these four routes.

### A.3 — Env var inventory (local .env.local only — Vercel envs not visible)

`process.env.*` references inside the four cron routes:

| Env var | Where used | Required / optional | Set in local `.env.local`? |
|---|---|---|---|
| `CRON_SECRET` | cultural-scan:495, classify-events:112, overnight-triage:27, feedback-collector:153 | optional (gate bypassed if unset) | **SET** |
| `GOOGLE_GEMINI_AI_API_KEY` | cultural-scan:230,344; classify-events:55 | optional — silently returns `[]` / errors string if missing (cultural-scan:231–234, 345–347; classify-events:56 throws) | **SET** |
| `GOOGLE_AI_API_KEY` | same files (fallback) | optional fallback | **UNSET** (but primary var is set) |
| `NEXT_PUBLIC_SUPABASE_URL` | cultural-scan:502, classify-events:118, feedback-collector:24, overnight-triage:38 | **required** — route returns 500 / 503 if missing | **SET** |
| `SUPABASE_URL` | same lines (fallback) | optional fallback | **UNSET** (primary var is set) |
| `SUPABASE_SERVICE_ROLE_KEY` | cultural-scan:503, classify-events:119, feedback-collector:25, overnight-triage:39 | **required** (with `SUPABASE_SERVICE_KEY` fallback) | **UNSET** |
| `SUPABASE_SERVICE_KEY` | same lines (fallback) | required-OR-with-the-other | **SET** |
| `NEXT_PUBLIC_BASE_URL` | not referenced in these four routes (used by scheduler.ts:266) | n/a here | **SET** |

Note: `GEMINI_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY` are **never read** by these routes — only the two variants above. The four routes are syntactically capable of running with the local env as-is.

**AMBIGUOUS — Vercel production env vars are not inspectable from the local filesystem.** The diagnostic cannot confirm whether `CRON_SECRET`, `GOOGLE_GEMINI_AI_API_KEY`, `SUPABASE_SERVICE_KEY` (or `_ROLE_KEY`), and `NEXT_PUBLIC_SUPABASE_URL` are set on the production Vercel project. If any one of these is missing or differs, that alone would explain the silence — but this requires the Vercel dashboard to verify.

### A.4 — Recent error evidence (logging tables)

**AMBIGUOUS — DB queries cannot be run from this read-only audit.** No `psql`/`supabase` CLI invocation was attempted; only static analysis is possible.

What the **code** writes to these tables (from grep):
- `integration_job_runs`: all four cron routes upsert `{ job, last_run }` on success (cultural-scan:541, classify-events:222, overnight-triage:43, plus other crons under `src/lib/cron/scheduler.ts`). If the routes had been firing successfully on Vercel since 2026-04-21, the `last_run` for `cultural_scanner`, `event_classifier`, `overnight_triage`, `feedback_collector` would be ≥ 2026-04-22. The prior MODEL_STATE_DIAGNOSTIC_2026-05-22.md noted that `atlas_accuracy_summary` has exactly 1 row dated 2026-04-21 — circumstantially indicating zero successful production runs since.
- `platform_events`: not written by any of the four cron routes (grep returns nothing matching `platform_events` inside them).
- `chairman_alerts`: not written by any of the four cron routes.

To definitively answer A.4, run the suggested SELECTs against the prod Supabase from a separate authenticated session. The current diagnostic cannot.

### A.5 — vercel.json validity check

- Parses as valid JSON: **YES** (`node -e JSON.parse(...)` returns `VALID JSON`).
- All four cron paths in `vercel.json` resolve to files on disk on the **current `vercel-deploy-test` branch**:
  - `/api/cron/cultural-scan` → `src/app/api/cron/cultural-scan/route.ts` ✅
  - `/api/cron/classify-events` → `src/app/api/cron/classify-events/route.ts` ✅
  - `/api/cron/overnight-triage` → `src/app/api/cron/overnight-triage/route.ts` ✅
  - `/api/atlas/feedback-collector` → `src/app/api/atlas/feedback-collector/route.ts` ✅
- Schedules: all 5-field cron expressions, all within valid ranges:
  - `30 0 * * *` ✅ (daily 00:30 UTC)
  - `0 1 * * *` ✅ (daily 01:00 UTC)
  - `0 6 * * *` ✅ (daily 06:00 UTC, x2: feedback-collector + overnight-triage)
  - `0 3 * * 0` ✅ (Sundays 03:00 UTC, recency-decay)
  - `0 10 * * 1` ✅ (Mondays 10:00 UTC, weekly-checkin)

Note: `/api/cron/recency-decay` is scheduled in `vercel.json` (line 8) but **no route file exists on disk** (`Glob` for `src/app/api/cron/recency-decay/**` returns no results). That cron would 404. Not part of the question, but worth flagging.

### A.6 — Deploy status (THIS IS THE LIKELY ROOT CAUSE)

Git history of `vercel.json` (all commits, all branches):

| Hash | Date | Branches | Summary | Cron entries |
|---|---|---|---|---|
| `c1426cb` | 2026-03-30 | all | Fresh init: clean source | None (no `crons` key) |
| `0d6ee6c` | 2026-04-04 | all | SAFETY CHECKPOINT pre-deploy-prep | Added `recency-decay`, `weekly-checkin`, `feedback-collector` (every 6h `0 */6 * * *`) |
| `433ce64` | 2026-04-10 | all | v14 sandbox checkpoint | (no vercel.json delta noted; tagged in log) |
| `33ece60` | 2026-04-21 | vercel-deploy-test, vercel-deploy-test-pre-layer1-2026-05-04, funnel-deploy-techyai, orb-wip-2026-05-19, s8-autoresearch-checkpoint | **atlas crons: activate feedback-collector + cultural intelligence pipeline** | **ADDED `cultural-scan` (30 0 * * *), `classify-events` (0 1 * * *)** and changed feedback-collector to `0 6 * * *` |
| `b280d13` | 2026-04-24 | vercel-deploy-test, vercel-deploy-test-pre-layer1-2026-05-04, funnel-deploy-techyai, orb-wip-2026-05-19 | Fix Problem A: overnight-triage Vercel cron + dev auth fallback | **ADDED `overnight-triage` (0 6 * * *)** |
| `dccf1b5` | 2026-05-03 | vercel-deploy-test, funnel-deploy-techyai (and forks) | Phase 1: lock package manager to npm | minor: added `installCommand` etc. |
| `0602498` | 2026-05-03 | vercel-deploy-test, funnel-deploy-techyai | Phase 1.5: add --legacy-peer-deps to npm install | minor: tweaked `installCommand` |
| `5279d2f` | 2026-05-16 | **funnel-deploy-techyai only** | chore(funnel): **replace vercel.json with funnel config (drop crons)** for techyai deploy | **REMOVED all crons** on this branch |

**Per-branch vercel.json state (HEAD of each branch):**

| Branch | HEAD | Crons in vercel.json |
|---|---|---|
| `vercel-deploy-test` (current) | `dab05ff` 2026-05-15 | recency-decay, weekly-checkin, feedback-collector (0 6 * * *), cultural-scan, classify-events, overnight-triage (all 6) |
| `main` | `d37d66d` 2026-04-17 | recency-decay, weekly-checkin, **feedback-collector (every 6h, `0 */6 * * *`)** — **NO cultural-scan, classify-events, overnight-triage** |
| `origin/main` | `c1426cb` 2026-03-30 | None (no `crons` key) |
| `funnel-deploy-techyai` | `f8caff9` 2026-05-22 | **None** (file is `{framework, installCommand, buildCommand, outputDirectory}` only) |
| `orb-wip-2026-05-19` | (not checked) | (b280d13 present → same crons as vercel-deploy-test on that snapshot) |

**Additional file-existence check across branches:**

| Branch | `cron/cultural-scan/route.ts` | `cron/classify-events/route.ts` | `cron/overnight-triage/route.ts` | `atlas/feedback-collector/route.ts` |
|---|---|---|---|---|
| `vercel-deploy-test` | ✅ | ✅ | ✅ | ✅ |
| `main` | ✅ | ✅ | ❌ does not exist | ✅ |
| `funnel-deploy-techyai` | ❌ does not exist (deleted in a0990d7) | ❌ does not exist | ❌ does not exist | ❌ does not exist |

**Combined picture (the smoking gun):**
- If Vercel production is wired to `vercel-deploy-test`: all 6 crons are scheduled AND the route files exist — but per MEMORY.md the recent commits (`05c364f`…`02ed265`, all titled "fix(build): …" / "Phase 1.6: add force-dynamic to 640 API routes to fix Vercel build OOM") are still trying to defeat a build-time OOM. **If the most recent successful production build pre-dates `33ece60` (2026-04-21) — or pre-dates any of the build-fix commits — then the deployed bundle has no knowledge of cultural-scan / classify-events / overnight-triage cron registrations.**
- If wired to `main`: `cultural-scan` would 404 anyway because main's `vercel.json` does not list it (and `overnight-triage/route.ts` doesn't exist on main either).
- If wired to `funnel-deploy-techyai`: zero crons scheduled, and the route files are deleted from the source tree.

**AMBIGUOUS — Vercel deploy logs / production deployment commit hash are not inspectable from this filesystem.** Confirming which branch Vercel actually built last requires the Vercel dashboard. The evidence weight is heavy that **either (a) the post-2026-04-21 vercel.json was never successfully deployed, or (b) the deployment is wired to a branch that doesn't list those crons** — both of which fully explain the silence.

### A.7 — Manual-invoke walkthrough for cultural-scan

Tracing `GET /api/cron/cultural-scan` with `phase=all` and a valid `CRON_SECRET`:

1. **Auth check** (`cultural-scan/route.ts:494–497`) — passes if `Authorization: Bearer ${CRON_SECRET}` matches.
2. **First env-var check** (`502–506`) — returns 500 `"Missing Supabase env vars"` if `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_SERVICE_KEY` are not both resolvable.
3. **First external API call** (Phase 1 Reddit, `scanReddit:174 → fetchSubredditTop:86`) — anonymous `GET https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=25` with User-Agent `Trendzo-Cultural-Scanner/1.0`. No auth required; rate-limited at 429 (warning + skip).
4. **First DB read** — none in Phase 1. Phase 3 synthesis re-reads today's `cultural_scan_results` rows at `synthesizeTrends:358` to feed the LLM, but that only happens after writes.
5. **First DB write** (`scanReddit:192–203`) — `db.from('cultural_scan_results').upsert({ niche, source: 'reddit', subreddit, scan_date, raw_data, post_count, top_themes })`.
6. **Phase 2 Twitter** (`scanTwitter:286`) — requires `GOOGLE_GEMINI_AI_API_KEY` (or `GOOGLE_AI_API_KEY`). If missing, prints `"No Gemini API key, skipping Twitter scan"` and returns 0 rows — non-fatal (`scanTwitterForNiche:230–234`).
7. **Phase 3 synthesis** (`synthesizeTrends:341`) — also requires the Gemini key. If missing, returns `{ trends: 0, errors: ['No Gemini API key for synthesis'] }` (`345–347`) — **but the run still returns `success: true` with `synthesis.trends_created: 0`**. This is the failure mode that would produce zero `detected_trends` rows even on a "successful" cron run.
8. **Job-run marker** (`540–542`) — best-effort upsert to `integration_job_runs.job = 'cultural_scanner'`.
9. **Response** — 200 with summary even if most phases produced nothing.

**Silent-zero preconditions (route returns 200 but writes 0 rows):**
- `GOOGLE_GEMINI_AI_API_KEY` and `GOOGLE_AI_API_KEY` both unset → Twitter scan + synthesis both skip (only Reddit-only rows would be written).
- All Reddit subreddit fetches 429 / non-OK → `posts.length === 0` per subreddit, no upsert (`scanReddit:187`).
- Supabase upsert failure on `cultural_scan_results` → recorded to `errors[]`, run continues, response still `success: true`.

**Hard-fail preconditions (route returns non-200, no writes):**
- Missing `CRON_SECRET` on caller side when set on server → 401.
- Missing both Supabase env vars → 500 `"Missing Supabase env vars"`.

---

## THREAD B — PREDICTION_RUNS SILENCE FOR 51 DAYS

### B.1 — Who writes to prediction_runs?

Only **four** code paths call `.from('prediction_runs').insert(...)`. No `.upsert()` against this table anywhere in `src/`.

| File:line | Triggered by | Insert payload |
|---|---|---|
| `src/lib/prediction/runPredictionPipeline.ts:237–250` | The canonical pipeline. Called by ~10 API routes (see B.2). | `{ id: runId(uuid), video_id, mode, status: 'running', started_at, source, source_meta, ingest_mode, cohort_key, cohort_frozen_at }` |
| `src/app/api/kai/predict/route.ts:209–211` | `POST /api/kai/predict` (admin upload-test page) | minimal pending row `{ video_id, status: 'running', ... }`, later updated with VPS v2 result at `:250` |
| `src/app/api/predict/v2/route.ts:99–100` | `POST /api/predict/v2` (admin upload-test page) | similar pending row for VPS v2 sole-XGBoost path |
| `src/app/api/bulk-download/predict/route.ts:100–101` | `POST /api/bulk-download/predict` (admin bulk-download page) | row per bulk-downloaded video |

Backfill/update-only paths (not inserts): `src/lib/training/fresh-video-scanner.ts:510` updates `discovery_scan_run_id` AFTER the canonical pipeline inserts; `src/lib/backfill/backfill-actual-performance.ts` updates `actual_performance`. These do not create new rows.

### B.2 — Predict endpoints inventory (paths matching predict|score|kai)

Found **58** routes whose path contains `predict`, plus 5 under `/score`, plus 4 under `/kai`. Filtering to ones that **could plausibly insert into `prediction_runs`** (either via canonical pipeline or direct DB insert):

| Route | File | Method | Auth | Writes prediction_runs? |
|---|---|---|---|---|
| `/api/kai/predict` | `src/app/api/kai/predict/route.ts` | POST | none | **YES** (direct, line 210) |
| `/api/predict/v2` | `src/app/api/predict/v2/route.ts` | POST | none | **YES** (direct, line 99) |
| `/api/bulk-download/predict` | `src/app/api/bulk-download/predict/route.ts` | POST | none | **YES** (direct, line 100) |
| `/api/predict` | `src/app/api/predict/route.ts` | POST | none | YES (via `runPredictionPipeline`) |
| `/api/predict/pre-content` | `src/app/api/predict/pre-content/route.ts` | POST | none | YES (via pipeline) |
| `/api/creator/predict` | `src/app/api/creator/predict/route.ts` | POST | **REQUIRED** (Supabase session, route returns 401 if no user) | YES (via pipeline) |
| `/api/creator/concept-score/expand` | similar | POST | (not verified — uses pipeline) | YES (via pipeline) |
| `/api/admin/predict` | `src/app/api/admin/predict/route.ts` | (not inspected) | likely admin gate | YES (via pipeline) |
| `/api/admin/training-ingest` | `src/app/api/admin/training-ingest/route.ts` | POST | admin | YES (via pipeline) |
| `/api/admin/reprocess-queue` | `src/app/api/admin/reprocess-queue/route.ts` | (not inspected) | admin | YES (via pipeline) |
| `/api/quick-win/analyze` | `src/app/api/quick-win/analyze/route.ts` | POST | (not inspected) | YES (via pipeline) |
| `/api/quick-win/generate-script` | `src/app/api/quick-win/generate-script/route.ts` | POST | (not inspected) | YES (via pipeline) |
| `/api/viral-prediction/analyze` | `src/app/api/viral-prediction/analyze/route.ts` | POST | (not inspected) | YES (via pipeline) |
| `/api/operations/training/reprocess` | `src/app/api/operations/training/reprocess/route.ts` | (not inspected) | admin | YES (via pipeline) |
| `/api/public/score` | `src/app/api/public/score/route.ts` | GET | feature-flag gated; returns 403 if `leaderboard` flag is off; otherwise returns `{score: 0.0}` literally | **NO** — does not write anything; stub returning hardcoded 0.0 |

Other `/api/*` paths matched (admin viewer/dashboard routes, validation lock, scheduler/notification CRUDs) do not write `prediction_runs` based on the grep above.

### B.3 — Recent prediction_runs activity by endpoint

**AMBIGUOUS — DB cannot be queried from this audit.** The suggested SQL would need to be run via a separate authenticated Supabase connection:

```sql
SELECT score_version, source_meta->>'route' AS route, source,
       COUNT(*), MAX(created_at)
FROM prediction_runs
GROUP BY score_version, source_meta->>'route', source
ORDER BY MAX(created_at) DESC;
```

What is known from the prior diagnostic: total 258 rows, MAX(created_at) = 2026-04-01. The `source_meta.route` field is populated by `/api/creator/predict:202` (`route: '/api/creator/predict'`); other paths use `source: options.source || 'manual'` only.

### B.4 — Is the predict path reachable from the UI?

Frontend fetches to predict endpoints, grouped by entrypoint:

| UI file | Action | Endpoint hit | Reachable from live site? |
|---|---|---|---|
| `src/app/admin/upload-test/page.tsx:1298,1349,1480,1621` | upload-test page (admin only) | `/api/kai/predict`, `/api/predict/v2` | only `/admin/upload-test` |
| `src/app/admin/workflows/creator/page.tsx:258` | admin workflows page | `/api/kai/predict` | only `/admin/workflows/creator` |
| `src/app/admin/creators/[username]/page.tsx:111,132` | admin creator detail | `/api/admin/predict`, `/api/creator/predictions` | only `/admin/creators/*` |
| `src/app/admin/studio/components/LaboratoryTab.tsx:57` | admin studio | `/api/value-template-editor/predict` | only `/admin/studio` |
| `src/app/admin/bulk-download/page.tsx:224` | admin bulk-download | `/api/bulk-download/predict` | only `/admin/bulk-download` |
| `src/app/creator-workflow/page.tsx:183` | `/creator-workflow` page | `/api/creator-workflow/predict` (does NOT call canonical pipeline — needs verification) | public/auth |

**Result:** every UI fetch to a `prediction_runs`-writing endpoint is an **admin-page** path (`/admin/*`). The non-admin `/creator-workflow/page.tsx` calls `/api/creator-workflow/predict`, which is a separate route not in the prediction_runs-writer list.

### B.5 — Predict-path reachability from agency / funnel / public surfaces

- **`/agency` and `/agency/*`** — grep `fetch.*predict|score|kai` returns **0 hits** across the 45 `.tsx` files in `src/app/agency/`. The closest is `src/app/agency/dashboard/components/AccuracyView.tsx:11–46`, which **synthesizes mock prediction data with `Math.random()`** (see `generatePredictions()`). The agency dashboard does not call any predict endpoint.
- **Funnel (`src/app/(public)/free/*`, `(public)/welcome`)** — grep for `fetch.*` returns: `/api/freedom-agent/history`, `/api/freedom-agent/chat`, `/api/assessment/generate`, `/api/freedom-agent/session`. **Zero hits on predict or score endpoints.** Funnel never writes `prediction_runs`.
- **Public root** — `/api/public/score` exists but is a stub (`return NextResponse.json({ score: 0.0 })`) gated behind a `leaderboard` feature flag; it does not write `prediction_runs`. No `/pulse` route exists at the app top level.

**Conclusion:** the only live entrypoints to `prediction_runs` writers are admin-only pages and scraper-internal calls (B.6). The agency, funnel, and public surfaces produce **zero** new prediction_runs rows by design.

### B.6 — Cohort scrape paths

- `src/app/api/training/scrape-hashtags/route.ts:8` — explicitly annotated: *"NOTE: This route writes to scraped_videos (not prediction_runs)."* Does **not** insert into prediction_runs. Uses Apify; requires `APIFY_API_TOKEN`. Last triggered: **AMBIGUOUS** (no in-repo log; would need DB query against `scraped_videos.created_at_utc` per niche or `integration_job_runs`).
- `src/app/api/training/scrape-profiles/route.ts:8` — same annotation; writes only `scraped_videos`.
- `niche-creator-scraper` (`src/lib/training/niche-creator-scraper`, called by `/api/cron/training-pipeline?step=scrape-creators`) — not in `vercel.json`, only triggerable manually with `?token=$CRON_SECRET` or via in-process node-cron (`src/lib/cron/scheduler.ts`), which does **not** run on Vercel serverless.
- **Discovery scanner** (`src/lib/training/fresh-video-scanner.ts:488`) — calls `runPredictionPipeline` for each discovered video with `source: 'training_ingest'`. **This is the only scraping path that writes prediction_runs.** It is invoked by `/api/cron/training-pipeline?step=scan` (manual GET; not in vercel.json) or by the in-process node-cron scheduler (not on Vercel). Last activity: AMBIGUOUS (DB-side).

**Result:** with no Vercel cron wired to `/api/cron/training-pipeline` and the in-process node-cron scheduler being a no-op on serverless, the discovery scanner essentially never fires in production unless someone manually GETs the URL with `?token=`. That is consistent with the 51-day silence.

### B.7 — Comparison check (scraped_videos vs prediction_runs cutoffs)

`scraped_videos` MAX(created_at_utc) = 2026-03-30 (per prior audit).
`prediction_runs` MAX(created_at) = 2026-04-01.

Git activity in that window:

```
9688e73 2026-03-31 13:44:52  Fix DPS tier collapse bug and score column semantics in scrape routes
c1426cb 2026-03-30 19:12:10  Fresh init: clean source, no video data, no secrets
```

The `c1426cb` commit message is `"Fresh init: clean source, no video data, no secrets"` and is the **root of the repo** (origin/main is still at this commit). All subsequent work happened on branches that diverged from this fresh init. The 2026-03-30/04-01 cutoffs align suspiciously with this **fresh-init event**: the prior data was preserved in Supabase, but local source/cron infrastructure was rebuilt from scratch, and the scraping/prediction pipelines were not re-wired to managed cron until much later (and even then only added to a branch that may not be the production-deployed branch — see Thread A.6).

Between `9688e73` (2026-03-31) and `0d6ee6c` (2026-04-04) there are **zero commits** — a 4-day gap. The next commit, `0d6ee6c`, is a "SAFETY CHECKPOINT" snapshot. The two cutoffs (3-30 scraped_videos, 4-01 prediction_runs) sit inside this gap, consistent with a one-off manual prediction run shortly before the work paused for the safety checkpoint.

---

## THREAD C — SHARED INFRASTRUCTURE CHECK

### C.1 — Current production deploy state

**AMBIGUOUS — the production deployed commit hash on Vercel cannot be observed from this filesystem.**

What CAN be observed:
- Per MEMORY.md (`Substrate Pivot Deal — Stage 3 Phase 2 v2 VERIFIED 2026-04-21`): production was being shipped on `vercel-deploy-test`-style branches as of late April. Subsequent build commits (`05c364f` 2026-05-15, `02ed265` 2026-05-15, `b097a09`, `3be7600`, `91ec27e`, `fbcd4ac`, `159fd12`, `07b960e`, `da993d9` "Phase 1.6: add force-dynamic to 640 API routes to fix Vercel build OOM" 2026-05-03) form an unbroken sequence of OOM-fix attempts. The titles strongly suggest the build was failing.
- HEAD of `vercel-deploy-test` is `dab05ff` 2026-05-15 (1 commit ahead of `origin/vercel-deploy-test`).
- `funnel-deploy-techyai` HEAD is `f8caff9` 2026-05-22 (today). This branch deleted all the cron routes (`a0990d7` 2026-05-16 "chore(funnel): remove non-allowlist routes to unblock build") and removed all crons from vercel.json (`5279d2f` 2026-05-16). The branch name + commit titles ("for techyai deploy") indicate this is the branch wired to the techyai.co funnel Vercel project.

**Two distinct Vercel projects may exist:** one for the funnel (techyai.co) on `funnel-deploy-techyai`, and a separate one for the main app (Trendzo) presumably on `vercel-deploy-test` or `main`. If the **funnel project** is the one whose URL the crons would call, then no crons fire there at all (vercel.json has none, route files deleted). If the **main app project** is the cron target, its last successful build is unknown — could be from before 2026-04-21 if recent builds OOM'd.

### C.2 — Recent commits to relevant files (since 2026-04-21)

```
b280d13  2026-04-24  Fix Problem A: overnight-triage Vercel cron + Problem B dev auth fallback + stacking bug
dccf1b5  2026-05-03  Phase 1: lock package manager to npm + recover silently-excluded source files
0602498  2026-05-03  Phase 1.5: add --legacy-peer-deps to npm install
da993d9  2026-05-03  Phase 1.6: add force-dynamic to 640 API routes to fix Vercel build OOM
5279d2f  2026-05-16  chore(funnel): replace vercel.json with funnel config (drop crons) for techyai deploy   [funnel-deploy-techyai only]
a0990d7  2026-05-16  chore(funnel): remove non-allowlist routes to unblock build                              [funnel-deploy-techyai only]
```

(scoped to the 7 files: vercel.json + cultural-scan/classify-events/overnight-triage/feedback-collector route files + public/score + creator/predict route files. The score/predict route files themselves were modified only as part of the `da993d9` Phase 1.6 mass force-dynamic patch.)

### C.3 — Recently introduced env vars

Diff of `.env.example` between `origin/main` and the current branch (`vercel-deploy-test`):

```
+ # Stripe — paid-path checkout for the Escape Assessment.
+ STRIPE_SECRET_KEY=your_stripe_secret_key                    (renamed from STRIPE_SECRET_KEY=your_stripe_key)
+ STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
+ STRIPE_PRICE_ID_ESCAPE_ASSESSMENT=your_stripe_price_id
+ NEXT_PUBLIC_SITE_URL=http://localhost:3004
+ CODE_PATH_COOKIE_SECRET=your_long_random_string
+ AUTO_NUDGE_DRY_RUN=true
```

None of the newly-introduced env vars are referenced by cultural-scan, classify-events, overnight-triage, feedback-collector, or the prediction_runs writers. Stripe/cookie/auto-nudge variables affect funnel checkout and brief-emails only.

The four cron routes still depend on the **same** env vars they did before 2026-04-21 (`CRON_SECRET`, `GOOGLE_GEMINI_AI_API_KEY` or `GOOGLE_AI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_KEY`). **No new env-var dependency was introduced that would have silently turned off the crons after 04-21.**

`BRIEF_ACK_SECRET` is newly required (per MEMORY.md "MUST set BRIEF_ACK_SECRET in Vercel before deploy or brief emails fail") — relevant to brief emails, not these crons.

---

## END OF REPORT

### Files modified by this audit

**1** file added: `C:\Projects\CleanCopy\CRON_AND_PREDICTION_SILENCE_DIAGNOSTIC_2026-05-22.md`.
No other files modified. No `.env`, `vercel.json`, source file, or DB row was touched.

### Git status (post-write)

```
On branch vercel-deploy-test
Your branch is ahead of 'origin/vercel-deploy-test' by 1 commit.

Untracked files:
  .env.funnel
  CRON_AND_PREDICTION_SILENCE_DIAGNOSTIC_2026-05-22.md   ← this report
  MODEL_STATE_DIAGNOSTIC_2026-05-22.md                   ← prior diagnostic (pre-existing)
  funnel_hero_verify.png … hero_with_logo_verify.png     ← pre-existing PNG verification artefacts

nothing added to commit but untracked files present
```

### Most likely root causes, ranked by evidence weight

**A — Cron silence (cultural-scan, classify-events, overnight-triage; feedback-collector partially)**

1. **Highest weight: the deployed production bundle does not include the post-2026-04-21 cron registrations.** Direct evidence: (a) `main` branch's `vercel.json` lists only 3 crons (feedback-collector every 6h, recency-decay, weekly-checkin) and is missing cultural-scan, classify-events, overnight-triage entirely; (b) `funnel-deploy-techyai` has zero crons and the route files are deleted; (c) the 7-commit sequence `da993d9 → 02ed265` (2026-05-03 to 2026-05-15) is a continuous OOM-fix sequence whose titles assert the Vercel build keeps failing. The Vercel cron dispatcher only fires for crons present in the **last successfully built** `vercel.json` on the production branch — and the most recent successful build pre-dating these OOM fixes likely pre-dates the 33ece60 (2026-04-21) cron additions. Caveat: needs Vercel dashboard to confirm.

2. **Second highest: CRON_SECRET / Gemini key mismatch in Vercel production env.** If Vercel's `CRON_SECRET` env was changed/cleared, or if Vercel-fired crons send a header that fails the `=== \`Bearer ${CRON_SECRET}\`` check, every cron call returns 401 silently. Easy to verify by checking Vercel project env vars. Caveat: cannot inspect Vercel envs from local filesystem.

3. **Third: silent "success with zero output" for cultural-scan + classify-events even if they DO fire.** With `GOOGLE_GEMINI_AI_API_KEY`/`GOOGLE_AI_API_KEY` unset in production, cultural-scan skips Twitter + synthesis (returning `success: true` with 0 trends), and classify-events throws "No Gemini API key" inside the LLM call and writes 0 events. This would produce zero `detected_trends` and zero `cultural_events` rows while leaving the cron logs looking "200 OK". Less likely as the primary cause but consistent with the symptom shape.

4. **Lowest: Vercel project pointing at `funnel-deploy-techyai`.** If the funnel project is the only deployed surface, none of these crons fire because they are deleted from both the schedule and the source tree on that branch.

**B — prediction_runs silence (51 days, since 2026-04-01)**

1. **Highest weight: no live UI surface produces predictions.** Every `prediction_runs`-inserting endpoint is reachable only from `/admin/*` pages (upload-test, bulk-download, workflows). The agency dashboard uses `Math.random()` mock data (`AccuracyView.tsx`); the funnel never calls predict; `/api/public/score` is a hard-coded `0.0` stub. **If no admin user has manually uploaded a video to `/admin/upload-test` (or the related admin pages) in 51 days, zero new rows is the expected behaviour.**

2. **Second highest: the discovery scanner is not wired to a managed cron.** `runDiscoveryScan` (which IS the auto-prediction path that doesn't need an admin click) is reachable only via `/api/cron/training-pipeline?step=scan&token=...`. That endpoint is **not in `vercel.json`**. The in-process node-cron scheduler in `src/lib/cron/scheduler.ts` would schedule it, but node-cron is a no-op on Vercel's serverless runtime. So unless someone manually GETs the URL, the scanner never runs.

3. **Coincident timing with `c1426cb` (Fresh init, 2026-03-30).** The cutoff matches the day the repo was re-initialised. Subsequent work happened on branches that may or may not have rewired the prediction pipeline to a continuously-running production trigger. Strong circumstantial evidence that the fresh-init reset the auto-prediction wiring, and only the manual admin paths still functioned afterward — eventually those stopped getting used too.

**Shared upstream — both threads converge on one root**

The single best explanation for both silences is: **after the 2026-03-30 fresh init, the production deploy on Vercel has not successfully reflected the post-04-21 cron additions because the build keeps OOMing.** Combined with the fact that no live UI flow auto-triggers `prediction_runs` writes (only admin pages do), and the discovery-scanner is not in `vercel.json`, the system has effectively been read-only for both the cultural intelligence pipeline (Thread A) and the prediction pipeline (Thread B) since shortly after the init. Confirming this requires three checks the local filesystem cannot perform:

- Vercel dashboard: which branch is the production project wired to, and what is the latest successful build commit hash?
- Vercel dashboard: are `CRON_SECRET`, `GOOGLE_GEMINI_AI_API_KEY`, `SUPABASE_SERVICE_KEY`, and `NEXT_PUBLIC_SUPABASE_URL` all set in production env?
- Supabase: `SELECT job, last_run FROM integration_job_runs ORDER BY last_run DESC;` — any row with `last_run >= '2026-04-22'` would falsify hypothesis A-1 for that specific job.
