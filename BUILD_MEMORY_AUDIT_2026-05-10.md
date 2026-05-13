# BUILD MEMORY AUDIT — 2026-05-10

Read-only audit of build-time exposure surfaces. Evidence only; no recommendations.

Totals at a glance:
- `page.tsx` files under `src/app/`: **164**
- `layout.tsx` files under `src/app/`: **15**
- `route.ts` files under `src/app/api/`: **882**

---

## 1. PAGE INVENTORY — Top 30 page.tsx by line count

`us` = `'use server'` on line 1-3, `uc` = `'use client'` on line 1-3, `dyn` = `export const dynamic` value, `rev` = `export const revalidate` value, `gsp` = `generateStaticParams` occurrences (any).

| # | path | lines | us | uc | dyn | rev | gsp |
|---|------|------:|---:|---:|-----|-----|----:|
| 1 | src/app/admin/upload-test/page.tsx | 4287 | 0 | 1 | force-dynamic | _ | 0 |
| 2 | src/app/admin/operations/training/page.tsx | 2302 | 0 | 1 | force-dynamic | _ | 0 |
| 3 | src/app/admin/bloomberg/page.tsx | 2238 | 0 | 1 | force-dynamic | _ | 0 |
| 4 | src/app/sandbox/chairman-design-test/page.tsx | 2133 | 0 | 1 | force-dynamic | _ | 0 |
| 5 | src/app/sandbox/viral-lab-v2/page.tsx | 2002 | 0 | 1 | force-dynamic | _ | 0 |
| 6 | src/app/admin/chairman/page.tsx | 1989 | 0 | 1 | force-dynamic | _ | 0 |
| 7 | src/app/admin/scraping/page.tsx | 1462 | 0 | 1 | force-dynamic | _ | 0 |
| 8 | src/app/admin/workflows/quick-win/page.tsx | 1319 | 0 | 1 | force-dynamic | _ | 0 |
| 9 | src/app/admin/operations/page.tsx | 1300 | 0 | 1 | force-dynamic | _ | 0 |
| 10 | src/app/admin/operations/training/history/page.tsx | 1252 | 0 | 1 | force-dynamic | _ | 0 |
| 11 | src/app/admin/bulk-download/page.tsx | 1197 | 0 | 1 | force-dynamic | _ | 0 |
| 12 | src/app/admin/model-evaluation/page.tsx | 1139 | 0 | 1 | force-dynamic | _ | 0 |
| 13 | src/app/admin/operations/training/base/page.tsx | 1037 | 0 | 1 | force-dynamic | _ | 0 |
| 14 | src/app/admin/operations/data-explorer/page.tsx | 1021 | 0 | 1 | force-dynamic | _ | 0 |
| 15 | src/app/admin/algorithm-iq/page.tsx | 959 | 0 | 1 | force-dynamic | _ | 0 |
| 16 | src/app/admin/canvas/[projectId]/page.tsx | 937 | 0 | 1 | force-dynamic | _ | 0 |
| 17 | src/app/admin/operations/training/viral-scrape/page.tsx | 886 | 0 | 1 | force-dynamic | _ | 0 |
| 18 | src/app/admin/operations/training/readiness/page.tsx | 886 | 0 | 1 | force-dynamic | _ | 0 |
| 19 | src/app/admin/calibration/page.tsx | 834 | 0 | 1 | force-dynamic | _ | 0 |
| 20 | src/app/admin/system-settings/page.tsx | 794 | 0 | 1 | force-dynamic | _ | 0 |
| 21 | src/app/admin/operations/training/data/page.tsx | 772 | 0 | 1 | force-dynamic | _ | 0 |
| 22 | src/app/admin/viral-studio/page.tsx | 751 | 0 | 1 | force-dynamic | _ | 0 |
| 23 | src/app/admin/operations/accuracy/page.tsx | 684 | 0 | 1 | force-dynamic | _ | 0 |
| 24 | src/app/admin/organization/creators/page.tsx | 680 | 0 | 1 | force-dynamic | _ | 0 |
| 25 | src/app/admin/integrations/webhooks/page.tsx | 668 | 0 | 1 | force-dynamic | _ | 0 |
| 26 | src/app/templates/[id]/page.tsx | 625 | 0 | 1 | force-dynamic | _ | 0 |
| 27 | src/app/admin/success-tracking/page.tsx | 618 | 0 | 1 | force-dynamic | _ | 0 |
| 28 | src/app/admin/planning/[id]/page.tsx | 616 | 0 | 1 | force-dynamic | _ | 0 |
| 29 | src/app/admin/operations/alerts/page.tsx | 611 | 0 | 1 | force-dynamic | _ | 0 |
| 30 | src/app/admin/operations/training/models/page.tsx | 603 | 0 | 1 | force-dynamic | _ | 0 |

**Total page.tsx files under src/app: 164.** Aggregate line count across all 164 pages: 61,941. Every one of the top 30 is `'use client'` + `dynamic = 'force-dynamic'`, zero `revalidate`, zero `generateStaticParams`.

---

## 2. LAYOUT INVENTORY — full list

| # | path | lines | us | uc | dyn | rev | gsp |
|---|------|------:|---:|---:|-----|-----|----:|
| 1 | src/app/admin/layout.tsx | 90 | 0 | 0 | _ | _ | 0 |
| 2 | src/app/agency/layout.tsx | 75 | 0 | 0 | _ | _ | 0 |
| 3 | src/app/membership/layout.tsx | 65 | 0 | 1 | _ | _ | 0 |
| 4 | src/app/layout.tsx | 55 | 0 | 0 | force-dynamic | _ | 0 |
| 5 | src/app/sandbox/workflow/layout.tsx | 22 | 0 | 1 | _ | _ | 0 |
| 6 | src/app/sandbox/viral-lab-v2/layout.tsx | 17 | 0 | 1 | _ | _ | 0 |
| 7 | src/app/sandbox/layout.tsx | 17 | 0 | 0 | _ | _ | 0 |
| 8 | src/app/admin/viral-studio/layout.tsx | 17 | 0 | 0 | _ | _ | 0 |
| 9 | src/app/admin/(studio)/layout.tsx | 14 | 0 | 0 | _ | _ | 0 |
| 10 | src/app/chairman/layout.tsx | 13 | 0 | 1 | _ | _ | 0 |
| 11 | src/app/trend-predictions/layout.tsx | 10 | 0 | 1 | _ | _ | 0 |
| 12 | src/app/templates/layout.tsx | 10 | 0 | 1 | _ | _ | 0 |
| 13 | src/app/templates/[id]/layout.tsx | 10 | 0 | 1 | _ | _ | 0 |
| 14 | src/app/templates-browse/layout.tsx | 10 | 0 | 1 | _ | _ | 0 |
| 15 | src/app/app/layout.tsx | 6 | 0 | 0 | _ | _ | 0 |

Only the **root** `src/app/layout.tsx` declares `force-dynamic`. The root layout is a server component (no `use client`).

---

## 3. ROUTE HANDLER INVENTORY — Top 20 route.ts by line count

| # | path | lines | dyn | runtime |
|---|------|------:|-----|---------|
| 1 | src/app/api/agency-chat/route.ts | 1854 | force-dynamic | nodejs |
| 2 | src/app/api/generate/script/route.ts | 964 | force-dynamic | _ |
| 3 | src/app/api/admin/integration/status/route.ts | 893 | force-dynamic | _ |
| 4 | src/app/api/admin/script-intelligence/route.ts | 768 | force-dynamic | _ |
| 5 | src/app/api/scraping/start/route.ts | 670 | force-dynamic | _ |
| 6 | src/app/api/admin/pipeline-status/route.ts | 647 | force-dynamic | _ |
| 7 | src/app/api/admin/monitoring/comprehensive/route.ts | 613 | force-dynamic | _ |
| 8 | src/app/api/admin/monitoring/dashboard/route.ts | 608 | force-dynamic | _ |
| 9 | src/app/api/value-template-editor/predict/route.ts | 598 | force-dynamic | _ |
| 10 | src/app/api/testing/framework/route.ts | 567 | force-dynamic | _ |
| 11 | src/app/api/cron/cultural-scan/route.ts | 556 | force-dynamic | _ |
| 12 | src/app/api/admin/viral-prediction/pipeline-status/route.ts | 547 | force-dynamic | _ |
| 13 | src/app/api/viral-prediction/validate-system/route.ts | 519 | force-dynamic | _ |
| 14 | src/app/api/admin/super-admin/quick-predict/route.ts | 508 | force-dynamic | _ |
| 15 | src/app/api/cron/consolidate-memory/route.ts | 502 | force-dynamic | _ |
| 16 | src/app/api/value-template-editor/workspace-config/route.ts | 494 | force-dynamic | _ |
| 17 | src/app/api/training/history/route.ts | 492 | force-dynamic | _ |
| 18 | src/app/api/admin/viral-prediction/daily-recipe-book/route.ts | 484 | force-dynamic | _ |
| 19 | src/app/api/admin/viral-prediction-hub/route.ts | 467 | force-dynamic | _ |
| 20 | src/app/api/admin/bulk-import/route.ts | 451 | force-dynamic | _ |

**Total route.ts files under src/app/api: 882.** All top-20 have `dynamic = 'force-dynamic'`. Only `agency-chat` declares a runtime explicitly (`nodejs`).

---

## 4. MODULE-TOP-LEVEL SIDE EFFECTS

Exhaustive scan under `src/lib`, `src/components`, `src/contexts`, `src/hooks`, `src/services` (none — folder absent), `src/utils` (none — folder absent), and adjacent library directories. Files in `src/app/api/**/route.ts` are not the spec target for this section but a parallel sweep is noted at the end. **All hits below are at column-0 (module body), not inside a function/class/component.**

### 4.1 `createClient(` (top-level Supabase client construction)

Each of the entries below executes a network-aware Supabase client constructor at module-load time. Most call `process.env.NEXT_PUBLIC_SUPABASE_URL!` / `process.env.SUPABASE_SERVICE_KEY!` with the non-null assertion (`!`) — if either env var is missing during Next's build worker module evaluation (RSC tracing, route collection, server-component reachability), construction throws.

| file:line | snippet | build-time risk |
|-----------|---------|-----------------|
| src/lib/analytics/discovery.ts:5 | `const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);` | Throws on missing env at module load; pulled in by any importer transitively imported during build. |
| src/lib/components/competitor-benchmark.ts:15 | `const supabase = createClient( ... )` | Same. |
| src/lib/components/posting-time-optimizer.ts:14 | `const supabase = createClient( ... )` | Same. |
| src/lib/components/trend-timing-analyzer.ts:13 | `const supabase = createClient( ... )` | Same. |
| src/lib/creator/profile_builder.ts:4 | `const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)` | Same. |
| src/lib/data/real-data-connector.ts:10 | `const supabase = createClient( ... )` | Same. |
| src/lib/database/SupabaseService.ts:5 | `const supabase = createClient(supabaseUrl, supabaseKey);` | Same. |
| src/lib/donna/testing/testing-framework.ts:21 | `const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);` | Same. |
| src/lib/donna/workflows/viral-scraping-workflow.ts:23 | `const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);` | Same. |
| src/lib/events/emit.ts:3 | `const supabase = createClient( ... )` | Hot path — `emitEvent` is imported by many service files. |
| src/lib/idempotency.ts:6 | `const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)` | Same. |
| src/lib/modules/advisor-service.ts:18 | `const supabase = createClient(supabaseUrl, supabaseKey);` | Same. |
| src/lib/modules/dna-detective.ts:18 | `const supabase = createClient(supabaseUrl, supabaseKey);` | Same. |
| src/lib/modules/feedback-ingest.ts:20 | `const supabase = createClient(supabaseUrl, supabaseKey);` | Same. |
| src/lib/pattern-extraction/extraction-pipeline.ts:4 | `const supabase = createClient( ... )` | Same. |
| src/lib/pattern-extraction/viral-pattern-council.ts:18 | `const supabase = createClient( ... )` | This module also constructs OpenAI/Anthropic/GoogleGenAI at top level — see 4.2. |
| src/lib/prediction/runPredictionPipeline.ts:61 | `const supabase = createClient( ... )` | **Canonical prediction pipeline** (per project CLAUDE.md). Imported by `/api/kai/predict`, `/api/creator/predict`, and many admin routes. |
| src/lib/security/telemetry-keys.ts:6 | `const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)` | Imported by tenant/key routes. |
| src/lib/services/ab-kai-integration.ts:14 | `const supabase = createClient( ... )` | Same. |
| src/lib/services/ActionDispatcher.ts:6 | `const supabase = createClient( ... )` | Same. |
| src/lib/services/alertService.ts:5 | `const supabase = createClient(supabaseUrl, supabaseServiceKey);` | Same. |
| src/lib/services/AnalyticsService.ts:3 | `const supabase = createClient( ... )` | Same. |
| src/lib/services/ChangePreviewService.ts:3 | `const supabase = createClient( ... )` | Same. |
| src/lib/services/CommandParser.ts:3 | `const supabase = createClient( ... )` | Same. |
| src/lib/services/evolutionEngine.ts:6 | `const supabase = createClient(supabaseUrl, supabaseKey);` | Same. |
| src/lib/services/pattern-extraction/enhanced-database-service.ts:14 | `const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);` | Same. |
| src/lib/services/pattern-extraction/extract-viral-genome.ts:18 | `const supabase = createClient( ... )` | Co-located with `new OpenAI(...)` — see 4.2. |
| src/lib/services/pre-content/dps-predictor.ts:13 | `const supabase = createClient( ... )` | Same. |
| src/lib/services/pre-content/pattern-matcher.ts:14 | `const supabase = createClient( ... )` | Same. |
| src/lib/services/pre-content/pre-content-prediction-service.ts:30 | `const supabase = createClient( ... )` | Same. |
| src/lib/services/SuggestionEngine.ts:4 | `const supabase = createClient( ... )` | Same. |
| src/lib/services/templateGenerator.ts:8 | `const supabase = createClient(supabaseUrl, supabaseKey);` | Same. |
| src/lib/services/videoIntelligenceService.ts:5 | `const supabase = createClient(supabaseUrl, supabaseServiceKey);` | Same. |
| src/lib/services/viral-prediction/apify-scraper.ts:39 | `const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)` | Co-located with `new ApifyClient(...)` — see 4.3. |
| src/lib/services/viralFilter.ts:5 | `const supabase = createClient(supabaseUrl, supabaseKey);` | Same. |
| src/lib/training/autoresearch/check_experiments.ts:2 | `const db = createClient( ... )` | Script-flavored module, but lives under `src/lib`. |
| src/lib/training/autoresearch/clear_stuck_lock.ts:2 | `const db = createClient( ... )` | Same. |
| src/lib/training/autoresearch/list_all_sandbox.ts:2 | `const db = createClient( ... )` | Same. |
| src/lib/training/check_scraped_cols.ts:2 | `const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, ...)` | Same. |
| src/lib/training/metric-collector.ts:21 | `const supabase = createClient( ... )` | Same. |
| src/lib/training/metric-scheduler.ts:15 | `const supabase = createClient( ... )` | Imported by `instrumentation.ts` chain (currently disabled — see Section 8 next.config). |
| src/lib/training/verify_promotion.ts:2 | `const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, ...)` | Same. |
| src/lib/test/supabase-schema-test.js:19 | `const supabase = createClient(supabaseUrl, supabaseKey);` | Same. |
| src/api/recipeBook.ts:13 | `const supabase = createClient(supabaseUrl, supabaseKey);` | Non-`src/lib` library file. |
| src/grpc/services/viral-prediction-service.ts:29 | `const supabase = createClient( ... )` | Same. |
| src/scripts/generate-synthetic-data.ts:3 | `const supabase = createClient( ... )` | Script under src/, but bundleable. |
| src/components/templates/GalleryPhase.tsx:22 | `const supabase = createClient( ... )` | **Component-body top-level** — runs when this client component is loaded. |
| src/components/workflow-1/ResearchPhase.tsx:33 | `const supabase = createClient( ... )` | Same. |

For completeness, the `route.ts` files (not in spec scope, but representative of the same pattern) account for **75+** additional top-level `const supabase = createClient(...)` constructions. These execute at request handler module-load (not first request). Examples: `src/app/api/kai/predict/route.ts:23`, `src/app/api/creator/predict/route.ts:36`, `src/app/api/admin/predict/route.ts:24`, `src/app/api/admin/viral-prediction/daily-recipe-book/route.ts:14`, `src/app/api/bulk-download/route.ts:21`, `src/app/api/scraping/start/route.ts:10`, `src/app/api/admin/integration/status/route.ts:*`.

### 4.2 `new OpenAI`, `new Anthropic`, `new GoogleGenAI` (top-level LLM client construction)

These constructors read env at module load. Even with empty-string fallbacks (`|| ''`), the OpenAI SDK constructor itself is `O(KB)` of allocation per import.

| file:line | snippet | build-time risk |
|-----------|---------|-----------------|
| src/lib/ml/gpt-refinement-service.ts:11 | `const openai = new OpenAI({ ... });` | Module-load construction. |
| src/lib/pattern-extraction/viral-pattern-council.ts:7 | `const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY \|\| '', dangerouslyAllowBrowser: true });` | + Anthropic + GoogleGenAI + Supabase all in same file. |
| src/lib/pattern-extraction/viral-pattern-council.ts:12 | `const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY \|\| '' });` | Same file. |
| src/lib/pattern-extraction/viral-pattern-council.ts:16 | `const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_AI_API_KEY \|\| process.env.GOOGLE_AI_API_KEY \|\| '' });` | Same file. |
| src/lib/services/featureDecomposer.ts:28 | `const openai = new OpenAI({ ... });` | Co-located with `ffmpeg.setFfmpegPath(...)` calls at top level (see 4.4). |
| src/lib/services/pattern-extraction/extract-viral-genome.ts:14 | `const openai = new OpenAI({ ... });` | + Supabase in same file. |
| src/lib/services/pattern-extraction/quality-filter-integration.ts:12 | `const openai = new OpenAI({ ... });` | |
| src/lib/services/pre-content/idea-legos-extractor.ts:13 | `const openai = new OpenAI({ ... });` | |
| src/lib/services/pre-content/llm-consensus.ts:15 | `const openai = new OpenAI({ ... });` | + Anthropic + GoogleGenAI in same file. |
| src/lib/services/pre-content/llm-consensus.ts:19 | `const anthropic = new Anthropic({ ... });` | Same file. |
| src/lib/services/pre-content/llm-consensus.ts:25 | `const genAI = new GoogleGenAI({ apiKey: geminiApiKey });` | Same file. |
| src/lib/services/prompt-generation/prompt-generator-engine.ts:13 | `const openai = new OpenAI({ ... });` | |
| src/lib/services/whisper-service.ts:20 | `const openai = new OpenAI({ ... });` | |

Plus 11 OpenAI client constructions at top of `route.ts` files (out of spec scope but related): `src/app/api/admin/expand-keywords/route.ts:6`, `src/app/api/admin/inception-studio/generate/route.ts:5`, `src/app/api/admin/transcribe/route.ts:14`, `src/app/api/ai/generate-script/route.ts:10`, `src/app/api/brain/route.ts:15`, `src/app/api/generate/script/route.ts:13`, `src/app/api/generate/optimize/route.ts:7`, `src/app/api/generate-cinematic-prompt/route.ts:12`, `src/app/api/remix/generate-variations/route.ts:12`, `src/app/api/onboarding/process/route.ts:19`, `src/app/api/quick-win/generate-script/route.ts:27`, `src/app/api/openai/transcribe/route.ts:8`.

### 4.3 `new ApifyClient(`, `new WebSocketManager(`, other service constructors

| file:line | snippet | build-time risk |
|-----------|---------|-----------------|
| src/lib/donna/services/apify-integration.ts:17 | `const client = new ApifyClient({ token: APIFY_TOKEN });` | Reads `process.env.APIFY_API_TOKEN` at module load. `apify-client` is externalized in `next.config.mjs` but still resolved. |
| src/lib/services/apifyService.ts:27 | `const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN \|\| '' });` | Same. |
| src/lib/services/viral-prediction/apify-scraper.ts:35 | `const apifyClient = new ApifyClient({ token: process.env.APIFY_TOKEN });` | Same — note env name differs from other two (`APIFY_TOKEN` vs `APIFY_API_TOKEN`). |
| src/lib/services/pattern-extraction/enhanced-extraction-engine.ts:17 | `const llmWrapper = new LLMWrapper();` | Wraps LLM client lazily; constructor runs immediately. |
| src/lib/services/pattern-extraction/pattern-extraction-engine.ts:26 | `const llmWrapper = new LLMWrapper();` | Same. |
| src/lib/validation/jsonSchema.ts:5 | `const ajv = new Ajv({ allErrors: true, strict: false });` | Pure compute, but allocates a singleton at import. |
| src/app/api/ws/route.ts:174 | `const wsManager = new WebSocketManager();` | Route module top level. |

### 4.4 `ffmpeg.setFfmpegPath` / `ffmpeg.setFfprobePath` (binary-path side effects at import)

| file:line | snippet | build-time risk |
|-----------|---------|-----------------|
| src/lib/services/featureDecomposer.ts:22 | `ffmpeg.setFfmpegPath(RESOLVED_FFMPEG_PATH);` | Resolves `ffmpeg-static` path at module load. `fluent-ffmpeg` is externalized server-side (next.config webpack block), but the **call still executes** when this module is loaded server-side. |
| src/lib/services/featureDecomposer.ts:23 | `ffmpeg.setFfprobePath(RESOLVED_FFPROBE_PATH);` | Same. |

### 4.5 Top-level `setInterval` (timer registration at import)

These register intervals on the Node process at module load. In Next's build workers and in `next start`, these will keep the process alive and fire indefinitely.

| file:line | snippet | build-time risk |
|-----------|---------|-----------------|
| src/lib/security/rate-limiter.ts:185 | `setInterval(() => MemoryStore.cleanup(), 5 * 60 * 1000);` | Fires every 5 min for the life of the process; module is import-side-effect. |
| src/lib/security/security-headers.ts:616 | `setInterval(() => { NonceGenerator.getInstance().cleanup(); }, 60 * 1000);` | Fires every 60s. |
| src/lib/security/cors-middleware.ts:313 | `setInterval(() => preflightLimiter.cleanup(), 5 * 60 * 1000);` | Fires every 5 min. |

### 4.6 Top-level `await` / `import(` expressions

- Top-level `await` (regex `^await\s+` at column 0): **no matches** across `src/**/*.{ts,tsx,js,jsx}`.
- Top-level dynamic `import(...)` (regex `^import\(` at column 0): **no matches**.

### 4.7 `nodemailer.createTransport`

All four occurrences are **inside functions**, not at module top level. No build-time exposure here.

- src/lib/email/send-invite.ts:153 (inside a function body, indented)
- src/lib/email/send-brief.ts:179 (inside a function body)
- src/lib/ops/notifier.ts:61 (inside a function body)
- src/lib/monitoring/alert-system.ts:545 (assigned to `this.emailTransporter` inside a method)

### 4.8 Section 4 count summary

Distinct module-top-level side-effect sites in spec-scope directories (excluding `route.ts` files which are listed for context but out of the scoped folders):

- `createClient(` (Supabase) at top level: **47** sites in `src/lib`, `src/components`, plus `src/api`, `src/grpc`, `src/scripts`.
- `new OpenAI/Anthropic/GoogleGenAI` at top level: **13** sites in `src/lib`.
- `new ApifyClient` / `new LLMWrapper` / `new Ajv` at top level: **6** sites in `src/lib`.
- `ffmpeg.set*Path(...)` at top level: **2** sites (same file).
- Top-level `setInterval`: **3** sites in `src/lib/security/`.
- Top-level `await` / `import(`: **0** sites.

**Total distinct top-level side-effect sites in scope: 71.**

---

## 5. HEAVY IMPORTS ACROSS PAGES — modules imported by 5+ page/layout files

Resolved against `@/...` → `src/...`. Relative imports (`./`, `../`) resolved against the importer's directory. Of the universe of imported local modules across all 164 pages + 15 layouts, the following are imported by **5 or more** distinct page-or-layout files. The list is exhaustive (everything ≥5 is included).

| # | module path | importer count | line count | in Section 4? |
|---|-------------|---------------:|-----------:|---------------|
| 1 | src/lib/utils.ts | 21 | 95 | no |
| 2 | src/components/ui/button.tsx | 11 | 45 | no |
| 3 | src/hooks/useAdminUser.ts | 10 | 274 | no |
| 4 | src/components/ui/card.tsx | 10 | 80 | no |
| 5 | src/lib/supabase/server.ts | 8 | 30 | no (factory function only — `createServerSupabaseClient()`) |
| 6 | src/lib/hooks/useAuth.ts | 8 | 8 | no |
| 7 | src/components/ui/badge.tsx | 8 | 36 | no |
| 8 | src/lib/auth/agency-utils.ts | 7 | 46 | no |
| 9 | src/app/sandbox/workflow/_context/SandboxWorkflowContext.tsx | 7 | 109 | no |
| 10 | src/lib/supabase/client.ts | 6 | 39 | no |
| 11 | src/lib/env.ts | 6 | 63 | no |
| 12 | src/components/ui/tabs.tsx | 6 | 54 | no |
| 13 | src/app/sandbox/workflow/_types/index.ts | 5 | 72 | no |
| 14 | src/app/sandbox/workflow/_services/index.ts | 5 | 58 | no |

**There are only 14 modules imported by 5+ page/layout files.** None of them appears in Section 4. The 30 spec slots beyond 14 are not populated because the codebase does not have additional modules at the 5+ threshold — the page graph is unusually flat because all top-30 pages are large monolithic `'use client'` files with very few local imports each (typically 0-6).

For visibility, the modules immediately below the threshold (importer count = 4): `src/components/ui/use-toast.ts` (4, 138 lines), `src/components/ui/input.tsx` (4, 25 lines), `src/components/ui/error-boundary.tsx` (4, 157 lines), `src/app/sandbox/workflow/_services/exports.ts` (4, 82 lines).

---

## 6. PAGES WITH HEAVY IMPORT GRAPHS — top 20 pages

`direct imports` counts `^import` lines. `local` counts those resolving to `@/...` or relative paths under `src/`. `S4 hits` = imports that directly resolve to a Section 4 file. `S5 hits` = imports that directly resolve to a Section 5 file. Flagged imports list specific resolved paths.

| # | page | direct imports | local | S4 hits | S5 hits | flagged imports |
|---|------|---:|---:|---:|---:|---|
| 1 | src/app/admin/upload-test/page.tsx | 8 | 5 | 0 | 0 | (creates its own `createClient(...)` at top level in the page itself — line 14) |
| 2 | src/app/admin/operations/training/page.tsx | 5 | 2 | 0 | 0 | — |
| 3 | src/app/admin/bloomberg/page.tsx | 3 | 0 | 0 | 0 | — |
| 4 | src/app/sandbox/chairman-design-test/page.tsx | 1 | 0 | 0 | 0 | — |
| 5 | src/app/sandbox/viral-lab-v2/page.tsx | 1 | 0 | 0 | 0 | — |
| 6 | src/app/admin/chairman/page.tsx | 6 | 2 | 0 | 0 | — |
| 7 | src/app/admin/scraping/page.tsx | 3 | 0 | 0 | 0 | — |
| 8 | src/app/admin/workflows/quick-win/page.tsx | 7 | 5 | 0 | 0 | — |
| 9 | src/app/admin/operations/page.tsx | 3 | 1 | 0 | 0 | — |
| 10 | src/app/admin/operations/training/history/page.tsx | 2 | 0 | 0 | 0 | — |
| 11 | src/app/admin/bulk-download/page.tsx | 4 | 3 | 0 | 0 | — |
| 12 | src/app/admin/model-evaluation/page.tsx | 2 | 0 | 0 | 0 | — |
| 13 | src/app/admin/operations/training/base/page.tsx | 1 | 0 | 0 | 0 | — |
| 14 | src/app/admin/operations/data-explorer/page.tsx | 2 | 0 | 0 | 0 | — |
| 15 | src/app/admin/algorithm-iq/page.tsx | 1 | 0 | 0 | 0 | — |
| 16 | src/app/admin/canvas/[projectId]/page.tsx | 8 | 6 | 0 | 0 | — |
| 17 | src/app/admin/operations/training/viral-scrape/page.tsx | 1 | 0 | 0 | 0 | — |
| 18 | src/app/admin/operations/training/readiness/page.tsx | 1 | 0 | 0 | 0 | — |
| 19 | src/app/admin/calibration/page.tsx | 1 | 0 | 0 | 0 | — |
| 20 | src/app/admin/system-settings/page.tsx | 7 | 6 | 0 | 0 | — |

Notes:
- Pages with `local = 0` and `direct imports = 1`-`3` typically follow the pattern `dynamic(() => import('./LongComponent'), { ssr: false })` — the heavy content is inside a single client-only chunk loaded lazily, so the page module itself stays thin.
- `src/app/admin/upload-test/page.tsx` does NOT import Section 4 modules transitively at the page level but **constructs its own top-level Supabase client** at line 14 (a Section-4-class issue inside a `'use client'` page — runs client-side, not at server build, but still a hydration-time side effect).
- All flagged imports counts are 0 because the top-20 pages — by structural pattern — defer heavy work behind `next/dynamic` boundaries or to runtime route handlers (`/api/...`). Section-4 modules surface through the `route.ts` chain, not through the page tree.

---

## 7. ABANDONED DIRECTORIES — every dir under src/app/ containing a page.tsx

164 directories total. Sorted oldest-touched first by the last-commit date for that directory. `file count` is the count of files at depth 1 (not recursive). Recent build-fix sweep on **2026-05-10** (commit `fbcd4ac` "fix(build): delete 14 abandoned trees and force-dynamic remaining pages" and `07b960e` "fix(build): remove force-dynamic from 'use server' page files") touched almost every page dir; the three rows below those represent the **only** dirs whose last commit predates that sweep.

### Oldest-touched dirs (last commit before 2026-05-10):

| # | dir | files (depth 1) | last commit |
|---|-----|---:|-------------|
| 1 | src/app/admin/operations/network-intelligence | 1 | 8549c9d 2026-04-17 CHECKPOINT: April 17 2026 — Intelligent Clay planning + v15 XGBoost + agency work |
| 2 | src/app/(public)/welcome | 1 | 051f431 2026-04-29 checkpoint: 2026-04-29 — escape funnel + agency dashboard parity work |
| 3 | src/app/assessment/[assessmentId] | 3 | 51b7af1 2026-05-08 Layer 1 cleanup: triage dispositions executed |

**No dir was last touched before 2026-03-10.** All other 161 dirs were touched on 2026-05-10 (commits `fbcd4ac` and `07b960e`). A representative slice of those, sorted alphabetically:

| # | dir | files | last commit |
|---|-----|---:|-------------|
| 4 | src/app | 17 | 07b960e 2026-05-10 fix(build): remove force-dynamic from 'use server' page files |
| 5 | src/app/(auth)/login | 1 | fbcd4ac 2026-05-10 fix(build): delete 14 abandoned trees and force-dynamic remaining pages |
| 6 | src/app/(auth)/onboarding | 1 | fbcd4ac 2026-05-10 ... |
| 7 | src/app/(auth)/signup | 1 | fbcd4ac 2026-05-10 ... |
| 8 | src/app/(dev)/assessment-test | 1 | fbcd4ac 2026-05-10 ... |
| 9 | src/app/(public)/free | 1 | fbcd4ac 2026-05-10 ... |
| 10 | src/app/(public)/free/freedom-agent | 1 | fbcd4ac 2026-05-10 ... |
| 11 | src/app/(public)/free/freedom-agent/[sessionId] | 1 | fbcd4ac 2026-05-10 ... |
| 12 | src/app/(public)/free/freedom-os | 4 | fbcd4ac 2026-05-10 ... |
| 13 | src/app/(public)/free/freedom-os/plan/[planId] | 2 | fbcd4ac 2026-05-10 ... |
| 14 | src/app/(public)/t/[shareId] | 1 | fbcd4ac 2026-05-10 ... |
| 15 | src/app/access | 1 | fbcd4ac 2026-05-10 ... |
| 16 | src/app/access-denied | 1 | fbcd4ac 2026-05-10 ... |
| 17 | src/app/agency | 4 | fbcd4ac 2026-05-10 ... |
| 18 | src/app/agency/cards | 2 | fbcd4ac 2026-05-10 ... |
| 19 | src/app/agency/client-portal | 1 | fbcd4ac 2026-05-10 ... |
| 20 | src/app/agency/clients | 2 | fbcd4ac 2026-05-10 ... |
| 21 | src/app/agency/competitive | 1 | fbcd4ac 2026-05-10 ... |
| 22 | src/app/agency/content-lab | 2 | fbcd4ac 2026-05-10 ... |
| 23 | src/app/agency/dashboard | 2 | fbcd4ac 2026-05-10 ... |
| 24 | src/app/agency/memory | 2 | fbcd4ac 2026-05-10 ... |
| 25 | src/app/agency/network | 1 | fbcd4ac 2026-05-10 ... |
| 26 | src/app/agency/proposals | 1 | fbcd4ac 2026-05-10 ... |
| 27 | src/app/agency/trend-iq | 1 | fbcd4ac 2026-05-10 ... |
| 28 | src/app/agency/trends | 2 | fbcd4ac 2026-05-10 ... |
| 29 | src/app/agency/what-you-missed | 1 | fbcd4ac 2026-05-10 ... |
| 30 | src/app/analytics/advanced-insights | 1 | fbcd4ac 2026-05-10 ... |

…and 131 more dirs all sharing the `fbcd4ac` 2026-05-10 commit (delete-14-trees-and-force-dynamic-remaining-pages) or `07b960e` 2026-05-10 (remove-force-dynamic-from-use-server pages). Because the recent build-fix sweep rewrote every page header, the git-mtime signal is collapsed onto a single day; the meaningful evidence is in the **three rows above** that escaped the sweep.

---

## 8. NEXT CONFIG + PACKAGE.JSON (raw)

### `next.config.mjs`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strip console.* in production builds while keeping warnings and errors
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_CLONE_URL: process.env.NEXT_PUBLIC_CLONE_URL || 'https://os.ryo.lu/',
  },
  // Enable standalone output ONLY for production builds (Docker deployment).
  // In dev, standalone output adds heavy file-tracing overhead that slows compiles.
  ...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {}),

  // Optimize for production
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  eslint: {
    // Avoid blocking builds on lint errors; surface them in CI/editor instead
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Unblock builds in dev/staging even if stray type errors exist elsewhere
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co", port: "", pathname: "/**" },
      { protocol: "https", hostname: "randomuser.me", port: "", pathname: "/**" },
      { protocol: "https", hostname: "placekitten.com" },
      { protocol: "https", hostname: "replicate.com" },
      { protocol: "https", hostname: "replicate.delivery" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    // TEMPORARILY disabled 2026-04-21 — src/instrumentation.ts pulls the entire
    // scheduler chain (node-cron → fluent-ffmpeg → fresh-video-scanner) into
    // webpack's bundle target, which can't resolve Node built-ins (fs, path)
    // in the instrumentation context. Dev server returns 500 on every route.
    // Auto-start convenience is lost (kick the scheduler manually via
    // /api/admin/integration/status on boot). Re-enable after the
    // instrumentation chain is refactored to use runtime require() so webpack
    // doesn't statically analyze it.
    instrumentationHook: false,
    optimizeServerReact: true,
    // jsdom ships a CSS asset (default-stylesheet.css) loaded via require.resolve;
    // webpack can't trace it, so the build fails at /api/admin/api-keys.
    // isomorphic-dompurify depends on jsdom — keep them together.
    serverComponentsExternalPackages: ['jsdom', 'isomorphic-dompurify'],
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'd3',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-radio-group',
      'date-fns',
      'chart.js',
      'react-chartjs-2',
    ],
    outputFileTracingExcludes: {
      '*': [
        '**/whisper_env/**',
        '**/node_modules/**/.bin/**'
      ]
    }
  },
  webpack: (config, { isServer, webpack }) => {
    // Prevent Next.js from bundling ffmpeg/ffprobe binaries into vendor chunks
    // and let fluent-ffmpeg resolve the paths from ffmpeg-static/ffprobe-static
    config.externals = config.externals || [];
    config.externals.push({ 'ffmpeg-static': 'commonjs ffmpeg-static' });
    config.externals.push({ 'ffprobe-static': 'commonjs ffprobe-static' });

    // On the server, keep heavy/optional libs available at runtime but out of the bundle
    if (isServer) {
      config.externals.push({ 'apify': 'commonjs apify' });
      config.externals.push({ 'apify-client': 'commonjs apify-client' });
      config.externals.push({ 'ioredis': 'commonjs ioredis' });
      config.externals.push({ 'pg': 'commonjs pg' });
      // fluent-ffmpeg requires Node's 'fs' which webpack can't resolve when bundling
      // the instrumentation hook chain (scheduler → fresh-video-scanner → kai-orchestrator
      // → audio-analyzer). Load at runtime instead.
      config.externals.push({ 'fluent-ffmpeg': 'commonjs fluent-ffmpeg' });
    }

    // Ignore heavy optional modules conditionally
    config.plugins = config.plugins || [];
    if (isServer) {
      // Server: ignore only modules known to break static analysis when unused
      config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^(natural|webworker-threads)$/ }));

      // Supabase fix: https://github.com/supabase/supabase-js/issues/783
      config.externals.push({
        '@supabase/realtime-js': 'commonjs @supabase/realtime-js',
        '@supabase/gotrue-js': 'commonjs @supabase/gotrue-js'
      })
    } else {
      // Client: fully ignore Node-only modules so they never get bundled
      config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^(natural|webworker-threads|apify|apify-client)$/ }));
    }

    // Alias heavy Node-only modules to noops on client to avoid bundling failures
    config.resolve = config.resolve || {};
    config.resolve.alias = Object.assign({}, config.resolve.alias, isServer ? {} : {
      'natural': false,
      'webworker-threads': false,
      'apify': false,
      'apify-client': false,
    });

    // Enable async WebAssembly for optional OCR (tesseract.js)
    config.experiments = config.experiments || {};
    config.experiments.asyncWebAssembly = true;
    return config;
  },
  async redirects() {
    return [
      // Stop /favicon.ico from triggering a 500 + full _error page recompile in dev.
      { source: '/favicon.ico', destination: '/favicon.svg', permanent: false },
      // Ensure all trend prediction routes are properly handled
      { source: '/trend-predictions', destination: '/dashboard-view/trend-predictions-dashboard', permanent: true },
      { source: '/trend-predictions/:path*', destination: '/dashboard-view/trend-predictions-dashboard/:path*', permanent: true },
      { source: '/(dashboard)/trend-predictions-dashboard', destination: '/dashboard-view/trend-predictions-dashboard', permanent: true },
      { source: '/(dashboard)/trend-predictions-dashboard/:path*', destination: '/dashboard-view/trend-predictions-dashboard/:path*', permanent: true },
      { source: '/admin/engine-room', has: [{ type: 'query', key: 'tab', value: '24-7' }], destination: '/admin/operations-center?view=pipeline', permanent: false },
      { source: '/admin/operations-center', destination: '/admin/engine-room?tab=operations', permanent: true },
      { source: '/admin/operations-center/:path*', destination: '/admin/engine-room?tab=operations', permanent: true },
      { source: '/does-not-match', destination: '/does-not-match', permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/openai/:path*", destination: "https://api.openai.com/:path*" },
      { source: "/lab/canvas", destination: "/lab-canvas" },
    ];
  },
};

export default nextConfig;
```

### `package.json` — scripts / dependencies / devDependencies

```json
{
  "name": "trendzo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "dev:turbo": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:smoke": "jest src/__tests__/unit/runPredictionPipeline.test.ts src/__tests__/api/ticket-a2-endpoints.test.ts",
    "test:integrity": "jest src/lib/prediction/__tests__/system-integrity.test.ts",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "extract-patterns": "ts-node src/scripts/extract-patterns.ts",
    "generate-synthetic": "ts-node src/scripts/generate-synthetic-data.ts",
    "smoke:funnel": "tsx scripts/smoke-funnel.ts"
  },
  "dependencies": {
    "@ai-sdk/anthropic": "^3.0.69",
    "@ai-sdk/openai": "^3.0.48",
    "@ai-sdk/react": "^3.0.140",
    "@clerk/nextjs": "^5.1.3",
    "@deepgram/sdk": "^3.6.0",
    "@google/genai": "^1.43.0",
    "@json-render/core": "^0.15.0",
    "@json-render/react": "^0.15.0",
    "@modelcontextprotocol/sdk": "^1.29.0",
    "@motionone/utils": "^10.18.0",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.8",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.1.8",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.57.4",
    "@types/d3": "^7.4.3",
    "@types/jsonwebtoken": "^9.0.10",
    "ai": "^6.0.138",
    "ajv": "^8.12.0",
    "ajv-formats": "^2.1.1",
    "apify": "^3.4.4",
    "apify-client": "^2.19.0",
    "axios": "^1.13.2",
    "bullmq": "^5.12.3",
    "chart.js": "^4.4.8",
    "cheerio": "^1.1.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cookies-next": "^4.1.1",
    "d3": "^7.9.0",
    "date-fns": "^3.6.0",
    "ffmpeg-static": "^5.2.0",
    "ffprobe-static": "^3.1.0",
    "fluent-ffmpeg": "^2.1.3",
    "framer-motion": "^11.18.2",
    "html2canvas": "^1.4.1",
    "ioredis": "^5.4.1",
    "isomorphic-dompurify": "^2.26.0",
    "isomorphic-git": "^1.25.0",
    "jsonwebtoken": "^9.0.3",
    "lucide-react": "^0.436.0",
    "natural": "^8.1.0",
    "next": "^14.2.28",
    "next-auth": "^4.24.11",
    "next-themes": "^0.4.6",
    "node-cron": "^3.0.3",
    "nodemailer": "^7.0.10",
    "pg": "^8.12.0",
    "pino": "^9.5.0",
    "pitchfinder": "^2.3.4",
    "puppeteer-core": "^24.12.0",
    "react": "18.2.0",
    "react-chartjs-2": "^5.3.0",
    "react-dom": "18.2.0",
    "react-draggable": "^4.5.0",
    "react-dropzone": "^14.3.8",
    "react-error-boundary": "^5.0.0",
    "react-hotkeys-hook": "^5.0.1",
    "react-intersection-observer": "^9.16.0",
    "react-markdown": "^9.0.1",
    "react-use-measure": "^2.1.7",
    "recharts": "^2.15.4",
    "replicate": "^0.32.0",
    "serve": "^14.2.3",
    "sharp": "^0.34.3",
    "sonner": "^1.5.0",
    "standardized-audio-context": "^25.3.77",
    "stripe": "^22.1.0",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7",
    "tesseract.js": "^6.0.1",
    "tesseract.js-core": "^6.0.0",
    "validator": "^13.15.15",
    "zod": "^3.25.76",
    "zod4": "npm:zod@^4.3.6",
    "zustand": "^5.0.7"
  },
  "devDependencies": {
    "@anthropic-ai/sdk": "^0.71.2",
    "@axe-core/playwright": "^4.10.1",
    "@playwright/test": "^1.52.0",
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/jest": "^29.5.14",
    "@types/node": "20.17.30",
    "@types/react": "^18.3.24",
    "@types/react-dom": "^18.3.7",
    "@types/uuid": "^10.0.0",
    "chalk": "^5.4.1",
    "cross-env": "^7.0.3",
    "dotenv": "^16.6.1",
    "dotenv-cli": "^8.0.0",
    "eslint": "^8",
    "eslint-config-next": "^16.0.3",
    "fast-json-patch": "^3.1.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "kill-port": "^2.0.1",
    "node-fetch": "^2.7.0",
    "openai": "^4.104.0",
    "pixelmatch": "^7.1.0",
    "playwright": "^1.55.0",
    "pngjs": "^7.0.0",
    "postcss": "^8",
    "prettier": "^3.7.4",
    "tailwindcss": "^3.4.1",
    "ts-jest": "^29.4.1",
    "ts-node": "^10.9.2",
    "tsx": "^4.20.5",
    "typescript": "^5.8.3",
    "uuid": "^9.0.1"
  }
}
```

---

## 9. SUMMARY

- **Page surface area:** 164 `page.tsx` files, 61,941 total lines. 15 `layout.tsx` files. 882 `route.ts` files. Every one of the top-30 pages is `'use client'` + `export const dynamic = 'force-dynamic'` with no `revalidate` and no `generateStaticParams`. The root `src/app/layout.tsx` is also `force-dynamic`.
- **Section 4 (module-top-level side effects):** 71 distinct top-level side-effect sites in scope — 47 `createClient(...)` constructions, 13 LLM-client constructions (`new OpenAI/Anthropic/GoogleGenAI`), 6 service constructors (Apify, LLMWrapper, Ajv), 2 `ffmpeg.set*Path(...)` calls, 3 `setInterval(...)` registrations. **Zero** top-level `await`, **zero** top-level dynamic `import()`. Nodemailer transports are all inside functions.
- **Top-3 highest-leverage Section-4 modules** (most likely to be reached from the build graph because of how many other modules depend on them): `src/lib/prediction/runPredictionPipeline.ts` (canonical pipeline, imported by `/api/kai/predict`, `/api/creator/predict`, training routes); `src/lib/events/emit.ts` (low-level `emitEvent` imported by many service modules); `src/lib/pattern-extraction/viral-pattern-council.ts` (single module with 4 distinct top-level side effects: Supabase + OpenAI + Anthropic + GoogleGenAI). None of these three are direct page imports — they reach the build graph through `route.ts` and other library modules.
- **Section 5 reality:** only **14** modules are imported by 5+ page/layout files; the threshold thins out fast because the top pages are large monolithic `'use client'` files with few local imports. None of the 14 heavily-imported modules is in Section 4 — the highest-importer-count module is `src/lib/utils.ts` (21 importers, 95 lines, pure helpers). `src/lib/supabase/server.ts` (8 importers) is a factory function, not a top-level client.
- **Largest page:** `src/app/admin/upload-test/page.tsx` at 4,287 lines. It has 8 direct imports (5 local) and 0 imports of Section-4 modules. It does, however, **construct its own top-level Supabase client at line 14 of the page itself** (a Section-4-class pattern inside the page file).
- **Abandoned dirs:** no `src/app/**` directory is last-touched before **2026-03-10**. Only three dirs escape the 2026-05-10 build-fix sweep — `src/app/admin/operations/network-intelligence` (last commit 2026-04-17), `src/app/(public)/welcome` (2026-04-29), and `src/app/assessment/[assessmentId]` (2026-05-08). The other 161 page directories all carry commits dated 2026-05-10 (`fbcd4ac` deletes 14 abandoned trees and force-dynamics remaining pages; `07b960e` removes force-dynamic from `'use server'` page files), which collapses the git-mtime signal across the rest of the tree.
