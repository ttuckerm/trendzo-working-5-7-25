# High-Leverage Files — Lazy-Init Targets (2026-05-10)

Read-only investigation. Branch `vercel-deploy-test`, HEAD `07b960e`. Companion to `BUILD_MEMORY_AUDIT_2026-05-10.md`. No source files were modified.

Methodology: walked every `.ts/.tsx/.js/.jsx/.mjs/.cjs` file under the repo (excluding `node_modules`, `.next`, `dist`, `build`, `.git`, `out`, `coverage`), parsed `import … from '…'`, `import('…')`, and `require('…')` statements, resolved `@/…` aliases against `src/` and relative paths against the importing file's directory, then built a forward + reverse import graph. Self-imports excluded. Test files included (they still trigger module evaluation under Vitest/Jest). 3,426 source files scanned.

---

## Section 1 — Candidate files

| # | path | lines | side effects |
|---|---|---:|---|
| 1 | src/lib/prediction/runPredictionPipeline.ts | 958 | Supabase |
| 2 | src/lib/events/emit.ts | 69 | Supabase |
| 3 | src/lib/pattern-extraction/viral-pattern-council.ts | 192 | OpenAI, Anthropic, GoogleGenAI, Supabase |
| 4 | src/lib/services/ActionDispatcher.ts | 268 | Supabase |
| 5 | src/lib/idempotency.ts | 38 | Supabase |
| 6 | src/lib/training/metric-collector.ts | 274 | Supabase |
| 7 | src/lib/services/viral-prediction/apify-scraper.ts | 222 | Apify, Supabase |
| 8 | src/lib/security/rate-limiter.ts | 441 | setInterval |
| 9 | src/lib/security/security-headers.ts | 659 | setInterval |
| 10 | src/lib/security/cors-middleware.ts | 593 | setInterval |
| 11 | src/lib/services/featureDecomposer.ts | 387 | OpenAI |
| 12 | src/lib/services/pattern-extraction/enhanced-database-service.ts | 384 | Supabase |
| 13 | src/lib/services/pre-content/pre-content-prediction-service.ts | 487 | Supabase |
| 14 | src/lib/services/pre-content/llm-consensus.ts | 295 | OpenAI, Anthropic, GoogleGenAI |
| 15 | src/lib/services/pre-content/dps-predictor.ts | 284 | Supabase |
| 16 | src/lib/services/pre-content/pattern-matcher.ts | 284 | Supabase |
| 17 | src/lib/services/pattern-extraction/extract-viral-genome.ts | 339 | OpenAI, Supabase |
| 18 | src/lib/database/SupabaseService.ts | 181 | Supabase |
| 19 | src/lib/services/AnalyticsService.ts | 453 | Supabase |
| 20 | src/lib/services/alertService.ts | 214 | Supabase |

All 20 candidates exist on disk — none missing.

---

## Section 2 — Direct importer count

Sorted by total importers descending. `route.ts` = files under `src/app/api/**/route.ts`. `page.tsx` = `page.{ts,tsx,jsx}` files. `other lib` = files under `src/lib/`. `api/cron` = subset of route.ts under `src/app/api/cron/`. A single importer can fall into multiple buckets (e.g. a cron route counts as both `route.ts` and `api/cron`), so columns do not necessarily sum to `total`.

| # | path | total | route.ts | page.tsx | other lib | api/cron |
|---|---|---:|---:|---:|---:|---:|
| 1 | src/lib/security/rate-limiter.ts | 28 | 27 | 0 | 1 | 0 |
| 2 | src/lib/events/emit.ts | 15 | 7 | 0 | 8 | 1 |
| 3 | src/lib/prediction/runPredictionPipeline.ts | 13 | 11 | 0 | 2 | 0 |
| 4 | src/lib/services/alertService.ts | 5 | 3 | 0 | 1 | 0 |
| 5 | src/lib/training/metric-collector.ts | 3 | 2 | 0 | 1 | 1 |
| 6 | src/lib/services/featureDecomposer.ts | 3 | 2 | 0 | 1 | 0 |
| 7 | src/lib/services/pattern-extraction/enhanced-database-service.ts | 3 | 1 | 0 | 2 | 0 |
| 8 | src/lib/services/pattern-extraction/extract-viral-genome.ts | 2 | 1 | 0 | 0 | 0 |
| 9 | src/lib/services/AnalyticsService.ts | 2 | 0 | 0 | 2 | 0 |
| 10 | src/lib/pattern-extraction/viral-pattern-council.ts | 1 | 0 | 0 | 1 | 0 |
| 11 | src/lib/services/viral-prediction/apify-scraper.ts | 1 | 0 | 0 | 1 | 0 |
| 12 | src/lib/security/security-headers.ts | 1 | 0 | 0 | 1 | 0 |
| 13 | src/lib/security/cors-middleware.ts | 1 | 0 | 0 | 1 | 0 |
| 14 | src/lib/services/pre-content/llm-consensus.ts | 1 | 0 | 0 | 1 | 0 |
| 15 | src/lib/services/pre-content/dps-predictor.ts | 1 | 0 | 0 | 1 | 0 |
| 16 | src/lib/services/pre-content/pattern-matcher.ts | 1 | 0 | 0 | 1 | 0 |
| 17 | src/lib/database/SupabaseService.ts | 1 | 1 | 0 | 0 | 0 |
| 18 | src/lib/services/ActionDispatcher.ts | 0 | 0 | 0 | 0 | 0 |
| 19 | src/lib/idempotency.ts | 0 | 0 | 0 | 0 | 0 |
| 20 | src/lib/services/pre-content/pre-content-prediction-service.ts | 0 | 0 | 0 | 0 | 0 |

---

## Section 3 — Transitive fan-out (one level deep)

For each of the top 8 from Section 2, transitive reach is computed as:
`transitive_reach = direct_route_importers + direct_page_importers + Σ(own importer count of each direct lib importer)`.

Sorted by transitive reach descending.

| # | path | direct importers | transitive reach |
|---|---|---:|---:|
| 1 | src/lib/events/emit.ts | 15 | 36 |
| 2 | src/lib/security/rate-limiter.ts | 28 | 27 |
| 3 | src/lib/prediction/runPredictionPipeline.ts | 13 | 14 |
| 4 | src/lib/training/metric-collector.ts | 3 | 9 |
| 5 | src/lib/services/pattern-extraction/enhanced-database-service.ts | 3 | 7 |
| 6 | src/lib/services/alertService.ts | 5 | 6 |
| 7 | src/lib/services/featureDecomposer.ts | 3 | 2 |
| 8 | src/lib/services/pattern-extraction/extract-viral-genome.ts | 2 | 1 |

Per-candidate breakdown of where the transitive reach comes from:

### 1. src/lib/events/emit.ts — transitive 36 (direct 15)
- Direct route.ts importers (7): `src/app/api/brief-acknowledge/[briefId]/route.ts`, `src/app/api/brief-performance/route.ts`, `src/app/api/brief-status/route.ts`, `src/app/api/clay/action/route.ts`, `src/app/api/cron/auto-nudge-unacknowledged/route.ts`, `src/app/api/invite-acknowledge/[id]/route.ts`, `src/app/api/invites/send/route.ts`
- Direct lib importers and their own importer counts:
  - `src/lib/services/viralDNAReportService.ts` — 0
  - `src/lib/agent/tool-registry.ts` — 1
  - `src/lib/training/training-executor.ts` — 1
  - `src/lib/triage/overnight-triage.ts` — 5
  - `src/lib/clay/action-handler.ts` — 3
  - `src/lib/training/feature-extractor.ts` — 4
  - `src/lib/training/auto-labeler.ts` — 2
  - `src/lib/prediction/runPredictionPipeline.ts` — 13
- lib_reach = 0 + 1 + 1 + 5 + 3 + 4 + 2 + 13 = 29 → transitive 7 + 0 + 29 = 36

### 2. src/lib/security/rate-limiter.ts — transitive 27 (direct 28)
- 27 direct route.ts importers (all admin / status / public API endpoints) and 1 lib importer `src/lib/security/security-middleware.ts` which itself has 0 importers.
- lib_reach = 0 → transitive 27 + 0 + 0 = 27

### 3. src/lib/prediction/runPredictionPipeline.ts — transitive 14 (direct 13)
- 11 direct route.ts importers (admin/predict, admin/reprocess-queue, admin/training-ingest, creator/concept-score/expand, creator/predict, operations/training/reprocess, predict, predict/pre-content, quick-win/analyze, quick-win/generate-script, viral-prediction/analyze).
- Lib importers: `src/lib/prediction/__tests__/pack-gating.test.ts` (0 own importers), `src/lib/training/fresh-video-scanner.ts` (3 own importers — including `src/app/api/cron/training-pipeline/route.ts`).
- lib_reach = 0 + 3 = 3 → transitive 11 + 0 + 3 = 14

### 4. src/lib/training/metric-collector.ts — transitive 9 (direct 3)
- Direct: `src/app/api/admin/metric-collector/run/route.ts`, `src/app/api/cron/training-pipeline/route.ts`, `src/lib/cron/scheduler.ts`.
- `src/lib/cron/scheduler.ts` has 7 own importers, contributing the bulk of the fan-out.
- transitive = 2 + 0 + 7 = 9

### 5. src/lib/services/pattern-extraction/enhanced-database-service.ts — transitive 7 (direct 3)
- Direct route: `src/app/api/patterns/extract-enhanced/route.ts`.
- Lib importers: `enhanced-extraction-service.ts` (3 own), `unified-extraction-service.ts` (3 own).
- transitive = 1 + 0 + 6 = 7

### 6. src/lib/services/alertService.ts — transitive 6 (direct 5)
- Direct route: `admin/test-database-connection`, `studio/quick-predict`, `system-alerts`. Plus `src/components/admin/SystemAlertsDisplay.tsx` (a component, not bucketed here).
- Lib importer `src/lib/services/validationSystem.ts` has 3 own importers.
- transitive = 3 + 0 + 3 = 6

### 7. src/lib/services/featureDecomposer.ts — transitive 2 (direct 3)
- Routes: `admin/run-feature-decomposer`, `test-modules`. Lib: `src/lib/services/feature-extract.ts` (0 own importers).
- transitive = 2 + 0 + 0 = 2

### 8. src/lib/services/pattern-extraction/extract-viral-genome.ts — transitive 1 (direct 2)
- Route: `admin/extract-genomes`. The other importer is `scripts/extract-all-genomes.ts` (a script, not a lib or route — excluded from lib_reach).
- transitive = 1 + 0 + 0 = 1

---

## Section 4 — Cron route dependencies

All 9 cron routes under `src/app/api/cron/`. Local imports listed are the `@/…` and relative imports declared at the top of each route file (npm packages excluded). The training-pipeline route shows `@/lib/cron/scheduler` three times because it is imported in three separate statements.

| cron route | direct local imports |
|---|---|
| src/app/api/cron/auto-nudge-unacknowledged/route.ts | `@/lib/env`, `@/lib/account-manager/auto-nudge`, `@/lib/events/emit` |
| src/app/api/cron/autodream/route.ts | `@/lib/content/adversarial-evaluator`, `@/lib/context/assemble-context` |
| src/app/api/cron/classify-events/route.ts | *(none — only npm + Next imports)* |
| src/app/api/cron/consolidate-memory/route.ts | `@/lib/scheduler/schedule-action` |
| src/app/api/cron/cultural-scan/route.ts | *(none — only npm + Next imports)* |
| src/app/api/cron/generate-recipes/route.ts | `@/lib/analytics/discovery` |
| src/app/api/cron/overnight-triage/route.ts | `@/lib/triage/overnight-triage` |
| src/app/api/cron/process-scheduled-actions/route.ts | `@/lib/scheduler/processor` |
| src/app/api/cron/training-pipeline/route.ts | `@/lib/training/fresh-video-scanner`, `@/lib/training/schedule-backfill`, `@/lib/training/metric-collector`, `@/lib/training/auto-labeler`, `@/lib/training/spearman-evaluator`, `@/lib/training/niche-creator-scraper`, `@/lib/cron/scheduler` (×3) |

Of the candidate files, only two appear directly in a cron route's import list:
- `src/lib/events/emit.ts` — imported by `auto-nudge-unacknowledged`.
- `src/lib/training/metric-collector.ts` — imported by `training-pipeline`.

`runPredictionPipeline.ts` is reached transitively from `training-pipeline` via `fresh-video-scanner.ts`.

---

## Section 5 — setInterval file importers

### src/lib/security/rate-limiter.ts (28 importers)
- src/app/api/ab/start/route.ts
- src/app/api/admin/api-keys/[id]/regenerate/route.ts
- src/app/api/admin/api-keys/[id]/route.ts
- src/app/api/admin/api-keys/[id]/toggle/route.ts
- src/app/api/admin/api-keys/route.ts
- src/app/api/admin/baselines/metrics_30d/route.ts
- src/app/api/admin/baselines/summary/route.ts
- src/app/api/admin/monitoring/comprehensive/route.ts
- src/app/api/admin/monitoring/dashboard/route.ts
- src/app/api/admin/quality/recent/route.ts
- src/app/api/admin/security/dashboard/route.ts
- src/app/api/admin/security/events/route.ts
- src/app/api/admin/validation/48h/route.ts
- src/app/api/admin/validation/breakdown/route.ts
- src/app/api/admin/validation/pending/route.ts
- src/app/api/admin/validation/recent_errors/route.ts
- src/app/api/admin/validation/summary/route.ts
- src/app/api/algorithm_weather/route.ts
- src/app/api/discovery/qa-seed/route.ts
- src/app/api/drafts/analyze/route.ts
- src/app/api/optimize/schedule/route.ts
- src/app/api/process/event/route.ts
- src/app/api/recipes/history/route.ts
- src/app/api/recipes/today/route.ts
- src/app/api/templates/copy-winner/route.ts
- src/app/status/baseline/route.ts
- src/app/status/integrity/route.ts
- src/lib/security/security-middleware.ts

### src/lib/security/security-headers.ts (1 importer)
- src/lib/security/security-middleware.ts

### src/lib/security/cors-middleware.ts (1 importer)
- src/lib/security/security-middleware.ts

Note: `src/lib/security/security-middleware.ts` itself has zero importers in the scan — it is a barrel-style aggregator that today is not picked up by any route or page. The 27 routes that import `rate-limiter.ts` import it directly, not through the middleware aggregator.

---

## Section 6 — Summary

Top 8 candidates ranked by transitive reach:

1. **src/lib/events/emit.ts** — directly imported by 7 route handlers (including 1 cron) and 8 library files; one of those library files is `runPredictionPipeline.ts` itself, which is imported by 11 more routes — total transitive reach 36.
2. **src/lib/security/rate-limiter.ts** — imported by 27 route handlers directly; the setInterval cleanup fires at every module evaluation.
3. **src/lib/prediction/runPredictionPipeline.ts** — 11 direct route importers across admin/creator/quick-win/predict surfaces, plus `fresh-video-scanner.ts` which feeds the training-pipeline cron.
4. **src/lib/training/metric-collector.ts** — only 3 direct importers but one of them is `src/lib/cron/scheduler.ts`, which is imported by 7 more files; also a direct cron dependency.
5. **src/lib/services/pattern-extraction/enhanced-database-service.ts** — 1 direct route and 2 lib importers (each with 3 own importers) form an extraction-service chain.
6. **src/lib/services/alertService.ts** — 3 direct routes plus `validationSystem.ts` (3 own importers).
7. **src/lib/services/featureDecomposer.ts** — 2 direct routes (`admin/run-feature-decomposer`, `test-modules`); lib importer has no further fan-out.
8. **src/lib/services/pattern-extraction/extract-viral-genome.ts** — 1 route, 1 script; the lowest-leverage of the top 8.

Zero-importer candidates (dead code or only used internally — exclude from the fix):
- `src/lib/services/ActionDispatcher.ts`
- `src/lib/idempotency.ts`
- `src/lib/services/pre-content/pre-content-prediction-service.ts`

Lib-only candidates (no routes, no pages, no crons — lower priority for the build-memory issue):
- `src/lib/pattern-extraction/viral-pattern-council.ts` (1 lib importer)
- `src/lib/services/viral-prediction/apify-scraper.ts` (1 test-file importer)
- `src/lib/security/security-headers.ts` (1 lib)
- `src/lib/security/cors-middleware.ts` (1 lib)
- `src/lib/services/pre-content/llm-consensus.ts` (1 lib)
- `src/lib/services/pre-content/dps-predictor.ts` (1 lib)
- `src/lib/services/pre-content/pattern-matcher.ts` (1 lib)
- `src/lib/services/AnalyticsService.ts` (2 lib importers, no routes/pages/crons)

Critical for cron jobs specifically (the model-training path Tommy needs running):
- `src/lib/events/emit.ts` — direct dependency of `cron/auto-nudge-unacknowledged`.
- `src/lib/training/metric-collector.ts` — direct dependency of `cron/training-pipeline`.
- `src/lib/prediction/runPredictionPipeline.ts` — transitive dependency of `cron/training-pipeline` via `fresh-video-scanner.ts`.

The remaining top-8 entries (`rate-limiter.ts`, `enhanced-database-service.ts`, `alertService.ts`, `featureDecomposer.ts`, `extract-viral-genome.ts`) are not on any cron route's direct or one-level transitive import path.
