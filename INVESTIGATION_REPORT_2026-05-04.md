# Investigation Report — 18 items across the repo

**Date:** 2026-05-04
**Branch:** `vercel-deploy-test`
**HEAD:** `da993d9b1e8ea014e1425c835d17f5885a0d0a33`
**Mode:** Read-only. No edits, no commits, no installs. Only this report file was created.

---

## 1. Pre-flight check results

| Check | Expected | Result |
|---|---|---|
| `git status` captured | yes | 52 lines (51 from earlier WIP + the verification report from the previous read-only task) — unchanged by this task |
| `git rev-parse HEAD` | `da993d9b1e8ea014e1425c835d17f5885a0d0a33` | ✅ matches |
| `git rev-parse --abbrev-ref HEAD` | `vercel-deploy-test` | ✅ matches |
| `INVESTIGATION_REPORT_2026-05-04.md` did not already exist | absent | ✅ confirmed absent, then created by this task |

All pre-flight checks pass.

---

## 🚨 STOP-CONDITION FLAGS (read this first)

While searching, I hit **two stop-condition triggers**. I documented full findings in Part C and Part B4 instead of stopping mid-investigation, but you should know up front:

1. **All 5 of the C-series "predictor legacy engines" are load-bearing.** Every one is imported by production code under `src/app/api/` and `src/lib/services/`. Anyone calling them "legacy" by file path alone is wrong. Details in Part C.
2. **`model-backups/` is local-only insurance, not in git.** `.gitignore:89` excludes the folder, `.vercelignore:18` excludes it from deploys. No `src/` code reads from it, but `model-backups/v10-production-backup-2026-04-17/BACKUP_README.md` documents a manual rollback procedure that depends on those files existing on disk. Details in Part B4.

Plus a sub-finding worth flagging now: **Part A7 `storage/` is wired into multiple admin integration routes** (`src/app/api/admin/integration/*`, `src/app/api/admin/demo/run/route.ts`). Detailed in A7.

---

## 2. Part A — Config and data folders

### A1 — `config/`

**Contents (3 files):** `niche-keywords.json`, `objectives.matrix.json`, `objectives.ops.json`.

**Inbound reference search & runtime imports:**

`niche-keywords.json` (the `config/` copy specifically):
- **Zero matches** for `config/niche-keywords` in `src/` or `scripts/`.
- The orchestrator does load `niche-keywords.json` — but from `src/data/`, not `config/` (`docs/COMPONENT_DEEP_ANALYSIS.md:2292`: "Loads `@/data/niche-keywords.json` (or hardcoded fallback)").
- `CLAUDE.md:1506` explicitly states: "`src/data/niche-keywords.json` and `config/niche-keywords.json` are AI-generated — NOT authoritative".
- The component itself is permanently disabled (`CLAUDE.md:1275`, `docs/COMPONENT_DEEP_ANALYSIS.md:93` — "CONFIRMED DEAD").

`objectives.matrix.json`:
- ✅ **Live.** `src/app/config/objectives.matrix.json/route.ts:7` reads it via `path.join(process.cwd(), 'config', 'objectives.matrix.json')`.
- Consumers: `src/lib/qa/qa-mode.ts:10` (`fetch("/config/objectives.matrix.json")`), `src/components/qa/QaOverlay.tsx:127` (link to View Matrix).
- Vercel build log shows this route generating during build (`vercel_phase1_5_log.txt:2625, 4363`).

`objectives.ops.json`:
- **Zero matches** in `src/` or `scripts/`. Only mentioned in `CODEBASE_INVENTORY_2026-05-04.md` (audit doc, excluded by scope rules).
- File contents resemble `objectives.matrix.json` (operations-center objectives) — looks like the same pattern, but no route exists at `src/app/config/objectives.ops.json/`.

**Verdict — folder mixed:**

| File | Verdict | Reason |
|---|---|---|
| `config/niche-keywords.json` | **DELETE** | The live orchestrator loads `src/data/niche-keywords.json`, not this. CLAUDE.md says this copy is "AI-generated, NOT authoritative". The component is disabled. |
| `config/objectives.matrix.json` | **KEEP** | Live: served by `src/app/config/objectives.matrix.json/route.ts`, consumed by `src/lib/qa/qa-mode.ts` and `src/components/qa/QaOverlay.tsx`. |
| `config/objectives.ops.json` | **AMBIGUOUS** | Looks like `matrix.json`'s sibling but no route serves it and no code reads it. Could be staged for a future ops-objectives endpoint that was never built. Don't delete without asking — could be 30-second wiring away from being used. |

---

### A2 — `paths/`

**Contents (4 files — NOT the 5 JSONs the prompt assumed):** `chat.md`, `image-generation.md`, `social-media.md`, `voice-notes.md`. *No `calibration.json`, `flags.json`, `proof_tiles.json`, `videos.json`, or `weather.json` in this folder.*

**Sample read** (`paths/chat.md:1-3`): "# AI Chat App — You are an expert in TypeScript, Next.js App Router, React, and Tailwind. Follow @Next.js docs for Data Fetching, Rendering, and Routing." — i.e., these are Cursor-style AI prompt instruction documents for building four hypothetical app types.

**Inbound reference search:**
- Zero matches in `src/`, `scripts/`, `package.json`, `vercel.json`, or any test runner config.
- Only mentioned in `CODEBASE_INVENTORY_2026-05-04.md:1307` (audit doc, excluded by scope rules).

**Verdict: DELETE** (with one note). They are AI prompt scaffolding for unrelated app types (an AI chat app, an image generator, a social-media manager, a voice-notes app) — none of which is Trendzo. They appear to be Cursor-rule templates dropped in from another project. Zero runtime use.

> ⚠️ The prompt assumed `paths/` contained 5 JSON files. It actually contains 4 markdown files. Worth a sanity-check read — flagged for "anything that surprised me" at the bottom.

---

### A3 — `database/`

**Contents (4 standalone SQL files):** `add_metadata_column_migration.sql`, `algorithm_optimizations_table.sql`, `pipeline_ops.sql`, `prediction_validation_table.sql`.

**Comparison with `supabase/migrations/`:** Grepped `supabase/migrations/` for the table names — **zero matches**. None of these 4 SQL files have a counterpart in `supabase/migrations/`.

**But the tables they create ARE live tables in production code:**

| Table created here | Live consumers in `src/` |
|---|---|
| `prediction_validation` | `src/app/api/ws/route.ts:161`, `src/lib/calibration/calibration.ts:132`, `src/lib/cron/scheduler.ts:38`, `src/lib/creator/profile_builder.ts:72,76`, `src/lib/drift/feature-importance.ts:114`, `src/lib/ops/alarms.ts:48`, `src/lib/services/database-pool.ts:87,126,145,184`, plus more |
| `pipeline_modules` + `pipeline_module_config` | `src/app/api/admin/pipeline/status/route.ts:30`, `src/app/api/admin/pipeline/modules/[id]/config/route.ts:16-37`, `src/app/api/admin/pipeline/modules/route.ts:20`, `src/app/api/admin/pipeline/modules/[id]/route.ts:13-14`, `src/app/api/admin/pipeline/actions/[action]/route.ts:32` |
| `algorithm_optimizations` | `src/lib/services/database-pool.ts:256`, `src/app/api/admin/algorithm/optimize-weights/route.ts:70` |

**Verdict: ARCHIVE.** These four `.sql` files are *historical bootstrap scripts* — they describe the original schema for tables that are still live. They are **not** part of the current migration system (`supabase/migrations/` uses timestamp-prefixed filenames, and these tables aren't in there). They are not loaded by any runtime code. Deleting them does not affect the running app, but losing them removes the only checked-in record of how those tables were initially shaped. Keep them in a `legacy/` archive folder, or commit a comment in CLAUDE.md saying "see git history for original DDL".

If you want to delete: confirm first that the *current* live schema in Supabase is well-documented elsewhere (e.g., via `supabase db dump` output checked in somewhere), or accept losing the schema history.

---

### A4 — `openapi/`

**Contents (2 files):** `public_v1.json`, `public_v2.json`.

**Inbound reference search:**
- ✅ **Live.** `src/app/api/openapi.json/route.ts:2-3` directly imports both files:
  ```ts
  import v1 from '../../../../openapi/public_v1.json'
  import v2 from '../../../../openapi/public_v2.json'
  ```
- The route serves merged paths at `/api/openapi.json` (`docs/developers.md:4`: "OpenAPI: `/api/openapi.json`").
- A Playwright test exercises this route: `playwright/tests/criticalFlows.spec.ts:155` (`request.get(\`${BASE_URL}/api/openapi.json\`)`).
- Build log confirms `/api/openapi.json` static-page generation (`vercel_phase1_5_log.txt:2213, 3951`).

**Verdict: KEEP.** Hard-imported by a live API route.

---

### A5 — `packages/`

**Contents (2 subdirectories):**
- `packages/shared/` — full TS package with `package.json` (`name: "@trendzo/shared"`), `src/`, `tsconfig.json`. Exports `VITSchema`, `IngressVITSchema`, `VIT_VERSION`, `VIT_UPSERT_KEY`.
- `packages/fixtures/` — 2 JSON test fixtures (`vit-fixtures.json`, `vit-bad-fixtures.json`).

**Path alias check:** `tsconfig.json:27-31` declares `@trendzo/shared` → `./packages/shared/src/index.ts` and `@trendzo/shared/*` → `./packages/shared/src/*`.

**Inbound references:**
- `src/app/api/ingest/upsert/route.ts:5` — `import { VITSchema, VIT_UPSERT_KEY } from '@trendzo/shared'`
- `src/__tests__/unit/vit-schema.test.ts:3` — `import { VITSchema } from '@trendzo/shared'`
- `src/__tests__/unit/vit-schema.test.ts:7,15` — load `packages/fixtures/vit-fixtures.json` and `vit-bad-fixtures.json`
- `src/__tests__/ingest.obj1.test.ts:5` — load `../../packages/fixtures/vit-fixtures.json`
- `workers/ingest/index.ts:6` — `import ... from '@trendzo/shared'`
- `workers/ingest/index.ts:32` — load `packages/fixtures/vit-fixtures.json`
- `scripts/seed.ts:3,7,11,43` — both `@trendzo/shared` and the fixtures

**Verdict: KEEP.** Heavily wired into the build via TypeScript path alias + imported from production routes, tests, scripts, and worker code.

---

### A6 — `schemas/`

**Contents (3 files):** `feature-store-schema.yaml`, `template-kernel.samples.json`, `template-kernel.schema.json`.

**Inbound reference search:**
- **Zero runtime imports** from `src/` or `scripts/`. Grep for `schemas/template-kernel` and `schemas/feature-store` returned no matches.
- Only mentioned in `docs/contracts/viral-recipe-book.contract.md:102` (a contract documentation page, not loaded at runtime): *"JSON Schema at `schemas/template-kernel.schema.json` with samples in `schemas/template-kernel.samples.json` and TS types in `src/contracts/templateKernel.ts`"*.
- The actual TypeScript types are duplicated in `src/contracts/templateKernel.ts` (read first 15 lines — defines `Platform`, `Badge`, `BeatType`, `Beat`, `Script`, etc.). The TS file is what code imports; the JSON schema is documentation.

**Verdict: AMBIGUOUS** (lean toward ARCHIVE). These are reference artifacts for a contract that is implemented in TypeScript at `src/contracts/templateKernel.ts`. Nothing loads them at runtime, but they are referenced from contract docs as "the canonical schema". If you want to keep contract docs accurate, they need to stay or the doc reference needs to be removed. Don't delete unilaterally — confirm whether the contract docs in `docs/contracts/` are still load-bearing for any compliance/external review process.

---

### A7 — `storage/`

**Contents (3 subdirectories):**
- `storage/evidence/` — `mock_1.zip`
- `storage/models/` — `dryrun_*.json`, `integration_*.json`, `instagram.json`, `tiktok.json`, `tiktok/` subfolder
- `storage/proof/` — `demo_current.json`, `demo_readiness.zip`, `dryrun_proof_*.json`, `readiness_*.json`, `readiness_*.zip`

**Inbound references (all live):**
- `src/app/api/admin/demo/run/route.ts:168-169` — returns `'storage/proof/demo_readiness.zip'` and `'storage/proof/demo_current.json'`
- `src/app/api/admin/integration/dryrun_jarvis_full/route.ts:9` — `evidence_path = 'storage/evidence/jarvis_mock_1.zip'`
- `src/app/api/admin/integration/dryrun_full/route.ts:16` — writes `proof_file: 'storage/proof/readiness_${ts}.zip'`
- `src/app/api/admin/integration/dryrun_commerce_attribution/route.ts:13` — writes `'storage/proof/commerce_attr_${ts}.json'`
- `src/app/api/admin/integration/dryrun/route.ts:109` — writes `path.join('storage','proof', \`dryrun_proof_${ts}.json\`)`
- `scripts/preflight_check.ts:12` — preflight checks for `dir:storage/proof`
- `CHANGELOG.md:6` — "training flow persists model artifacts under `storage/models/<platform>/<version>.json`"

**Verdict: KEEP.** Multiple admin integration routes write to `storage/proof/` and `storage/evidence/`, the preflight check requires `storage/proof/` to exist, and the training flow persists artifacts to `storage/models/<platform>/`. Even files that look like stale artifacts inside the folder (`dryrun_proof_1700000000000.json`) match the active write patterns.

> Sub-suggestion (not a verdict): individual stale files inside `storage/proof/` and `storage/models/` could be pruned as a separate cleanup, but the *folders* must stay.

---

### A8 — `plugins/`

**Contents (3 files in 3 subdirs):** `capcut/score-helper.js`, `descript/score-cli.js`, `premiere/panel.html`.

**Inbound references:**
- `scripts/smoke_plugins.ts:8-10` — checks all three files exist:
  ```
  { name: 'premiere', file: 'plugins/premiere/panel.html' },
  { name: 'descript', file: 'plugins/descript/score-cli.js' },
  { name: 'capcut',   file: 'plugins/capcut/score-helper.js' }
  ```
- `src/app/api/admin/integration/status/route.ts:597-599` — same three paths checked at runtime
- `docs/PLUGIN_GUIDES.md:26,31,36` — usage documentation
- `docs/SANDBOX.md:26-27` — usage documentation

**Verdict: KEEP.** A live admin status endpoint checks for these files' presence; deleting them would change what `/api/admin/integration/status` reports. Plus a smoke test depends on them.

---

## 3. Part B — Code folders

### B1 — `sdk/`

**Contents:**
- `sdk/js/index.ts` — exports `score()` function that POSTs to `/public/score` with an `x-api-key` header.
- `sdk/js/commerce.ts` — exports `init()`, `track()`, `order()` for a "ViralLab" pixel (sends events to `/px.gif?...` and `/api/commerce/order`).
- `sdk/python/virallab/__init__.py` — Python equivalent of the JS `score()` function.

**Inbound reference search (filtered to `src/`):**
- **Zero matches** for `sdk/js`, `sdk/python`, or `virallab` from any `.ts`/`.tsx` file in `src/`.

**Documentation references (not runtime):**
- `docs/COMMERCE.md:11` — "sdk/js/commerce.ts — ViralLabPixel.init/track/order"
- `docs/SANDBOX.md:14` — `import { score } from '../sdk/js/index'`
- `docs/PLUGIN_GUIDES.md:15` — `import { score } from '@virallab/sdk'`
- `docs/developers.md:10` — Postman link

**Verdict: AMBIGUOUS** (lean PRESERVE). These are external-customer SDK files (the kind you'd publish to npm/PyPI for partners to integrate against). Nothing inside Trendzo's own app imports them — by design, they are *for clients*, not for internal use. They are only useful if:
- (a) you have, or plan to have, external integrations using these SDKs, OR
- (b) the docs (`docs/SANDBOX.md`, `docs/PLUGIN_GUIDES.md`) are still load-bearing for a partners/developers program.

The fact that they have no import inside `src/` is *expected* for an SDK and **does not** mean they're dead. Don't delete without confirming the partners program / sandbox is shut down.

---

### B2 — `tasks/`

**Contents (27 files):** `tasks.json`, `task_001.txt` through `task_010.txt`, plus 16 markdown files (`creative-phase-1-architecture.md`, `phase-3-task-tracking.md`, `viral-prediction-core-plan.md`, etc.).

**Sample reads:**
- `tasks/tasks.json:5-7` — Task 1 description: *"Initialize the project with React.js, TypeScript, and Tailwind CSS. Set up Firebase Firestore integration..."*
- `tasks/task_001.txt:6-8` — same content: *"Initialize the project with React.js... Set up Firebase project and initialize Firestore database..."*

**Stack mismatch:** The tasks describe a **Create-React-App + Firebase Firestore** project. The current project is **Next.js 14 + Supabase**. These are from a previous architecture pivot.

**Inbound reference search:**
- Zero matches in `src/`, `scripts/`, `package.json`, or any runtime config.
- Only mention is `CODEBASE_INVENTORY_2026-05-04.md:135` referencing `.ralph/tasks.json` (a *different* tasks file, in a different location).

**Verdict: DELETE.** Twenty-seven planning documents for an architecture (CRA + Firebase) that was abandoned in favour of the current Next.js + Supabase stack. Zero runtime references. They're frozen artifacts of an older plan, not active task lists.

---

### B3 — `tests/`

**Contents (4 subdirectories):**
- `tests/e2e/` — `preview-perf.spec.ts`, `template-mini-ui.spec.ts`
- `tests/load/` — `smoke.yml`, `stress.yml`
- `tests/preflight/` — `objectives-preflight.spec.ts`, `partners.spec.ts`, `recipeBookCanvas.spec.ts`, `workflow-13.spec.ts`
- `tests/validation/` — `golden/`, `run_golden_eval.ts`

**Test runner reconciliation:**

| Runner | Config file | Picks up `tests/`? | Picks up which folder? |
|---|---|---|---|
| **Jest** | `jest.config.js:12-15` | ❌ No | `**/__tests__/**/*.(test\|spec).ts(x)` only — i.e., only `src/__tests__/` and `src/**/__tests__/` |
| **Playwright** | `playwright.config.ts:4` | ❌ No | `./playwright/tests` only |

**The 4 test homes in this repo:**

| Home | Wired into a runner? | Files |
|---|---|---|
| `src/__tests__/` and `src/**/__tests__/` | ✅ Jest (auto) | many |
| `playwright/tests/` | ✅ Playwright (auto) | 12 spec files |
| `tests/` (this folder) | ❌ Not auto — runnable only via explicit path (`npx playwright test tests/e2e/template-mini-ui.spec.ts` per `docs/template-mini-ui_audit.md:127`) | 8 files + `golden/` |
| `e2e/` (root-level) | ❌ Not auto | 1 file (`sandbox-workflow.spec.ts`) |

**Inbound reference search:**
- `docs/template-mini-ui_audit.md:122,127` — references `tests/e2e/template-mini-ui.spec.ts` with the exact `npx playwright test tests/e2e/template-mini-ui.spec.ts` command.
- `src/components/templateMiniUI/README.md:191` — `npm run test:e2e -- tests/e2e/preview-perf.spec.ts`
- `package.json` has no `test:e2e` script defined (only `test`, `test:watch`, `test:coverage`, `test:smoke`, `test:integrity`). So that README command would fail today.

**Verdict: AMBIGUOUS** (per-subfolder breakdown):

| Subfolder | Verdict | Reason |
|---|---|---|
| `tests/e2e/` | AMBIGUOUS | Two specs, both referenced from docs/READMEs. Runnable manually via `npx playwright test tests/e2e/...`. Not in any auto-run path. |
| `tests/load/` | AMBIGUOUS | Two YAML files (`smoke.yml`, `stress.yml`) — load-test scenarios. No runner config wires them up; could be intended for a separate load-testing tool (k6/artillery) that isn't installed. |
| `tests/preflight/` | AMBIGUOUS | Four `.spec.ts` files. Same status as e2e — runnable manually only. |
| `tests/validation/` | AMBIGUOUS | `run_golden_eval.ts` is a runner-style script; `golden/` is a test-data subdirectory. Not in any auto-run config. |

These all *might* be runnable, but nothing in the repo automatically runs them. If you've never executed them in months, they are de-facto orphaned. Don't blind-delete; confirm by asking: "When was the last time I ran `tests/e2e/`, `tests/load/`, `tests/preflight/`, or `tests/validation/`?" If the answer is "never" or "I don't remember", DELETE is safe.

> No fifth or sixth test home was found. The four homes above are exhaustive.

---

### B4 — `model-backups/`

**Contents (1 subdirectory):** `model-backups/v10-production-backup-2026-04-17/` containing:
- `BACKUP_README.md`
- `xgboost-v10-features.json`
- `xgboost-v10-metadata.json`
- `xgboost-v10-model.json`
- `xgboost-v10-scaler.json`

**Cross-reference against `models/`:**

The current `models/` folder also contains v10 files (`xgboost-v10-features.json`, `xgboost-v10-metadata.json`, `xgboost-v10-model.json`, `xgboost-v10-scaler.json`). The `model-backups/` copy is a duplicate snapshot taken on 2026-04-17 before contemplating promotion of v15.

**Inbound reference search:**
- **Zero `src/` matches** for `model-backups` or `v10-production-backup`.
- `.gitignore:89` excludes `model-backups/` from git.
- `.vercelignore:18` excludes `/model-backups/` from Vercel deploys.

**The README documents the rollback procedure:**

> `model-backups/v10-production-backup-2026-04-17/BACKUP_README.md:24-33`:
> *"If v15 is promoted and needs to be rolled back beyond the in-DB rollback path: (1) Copy these four files back to `C:/Projects/CleanCopy/models/` (overwriting). (2) Flip `model_variants.is_active = true` on the v10 row... The DB-level rollback in `trainer-engine.ts:rollbackModelVariant()` handles steps 2–3 automatically as long as these model files remain reachable at `models/xgboost-v10-*.json`."*

**Verdict: KEEP** (with nuance).
- No live code reads from `model-backups/`. By the strict "is anything loading this" test, it's orphaned.
- BUT: it is **manually load-bearing rollback insurance**. If `models/xgboost-v10-*.json` get overwritten by a v15 promotion and v15 then turns out to be broken, this is the only on-disk copy that lets you restore v10 without retraining.
- It is **already gitignored** — so this isn't bloat in the repo, it's only on Tommy's local disk. Deleting it on disk doesn't shrink the repo (it's already not tracked).

**Recommendation:** Keep on local disk until v15 (or whichever model is current) has been promoted and run in production for at least 2 weeks without rollback. Then this v10 backup can be deleted.

---

## 4. Part C — Predictor legacy engines (5 files) — 🚨 ALL LOAD-BEARING

These five files all live in `src/lib/services/viral-prediction/`, NOT in `src/lib/prediction/`. CLAUDE.md notes the canonical pipeline is `src/lib/prediction/runPredictionPipeline.ts`. The prompt asked me to verify whether these 5 are still wired into the running app.

**They are.** All five are imported from production code. Per the stop condition, I am flagging this immediately.

### C1 — `unified-prediction-engine.ts` — **PRESERVE** (load-bearing)

Inbound references from production code:

| File:line | Context |
|---|---|
| `src/app/public/score/route.ts:3` | `import { getPredictionEngine } from '@/lib/services/viral-prediction/unified-prediction-engine'` — public scoring API |
| `src/app/api/admin/prediction/unified-predict/route.ts:2` | `import { UnifiedPredictionEngine } from ...` — admin endpoint |
| `src/app/api/admin/integration/status/route.ts:5` | `import { UnifiedPredictionEngine } from ...` — integration status |
| `src/app/api/admin/integration/replay_apify/route.ts:4` | `import { UnifiedPredictionEngine } from ...` |
| `src/app/api/admin/integration/dryrun_replay_81225/route.ts:4` | `import { UnifiedPredictionEngine } from ...` |
| `src/app/api/admin/integration/dryrun_hourly/route.ts:3` | `import { getPredictionEngine } from ...` |
| `src/app/api/admin/integration/dryrun_formats/route.ts:3` | `import { getPredictionEngine } from ...` |
| `src/app/api/admin/integration/dryrun/route.ts:75` | string ref `'src/lib/services/viral-prediction/unified-prediction-engine.ts:24'` |
| `src/app/api/admin/phase2-test/route.ts:24` | `path: '@/lib/services/viral-prediction/unified-prediction-engine'` |
| `src/lib/services/dual_runner.ts:1` | `import { UnifiedPredictionEngine } from ...` |
| `src/lib/services/master-viral-algorithm.ts:16` | `import { UnifiedPredictionEngine } from ...` |
| `src/lib/services/accuracy-enhancement/ensemble-fusion-engine.ts:25` | `import { UnifiedPredictionEngine } from ...` |
| `src/lib/services/viral-prediction/test-unified-engine.ts:8` | sibling import |

### C2 — `main-prediction-engine.ts` — **PRESERVE** (load-bearing)

| File:line | Context |
|---|---|
| `src/app/api/viral-prediction/analyze-complete/route.ts:4` | `import { MainPredictionEngine } from ...` |
| `src/app/api/admin/viral-prediction-hub/route.ts:10` | `import MainPredictionEngine from ...` |
| `src/app/api/admin/viral-prediction/real-time-analysis/route.ts:8` | `import { MainPredictionEngine } from ...` |
| `src/app/api/admin/viral-prediction/daily-recipe-book/route.ts:8` | `import { MainPredictionEngine } from ...` |
| `src/app/api/admin/viral-prediction/accuracy-validation/route.ts:8` | `import { MainPredictionEngine } from ...` |
| `src/app/api/admin/prediction/test-engine/route.ts:11` | `await import('@/lib/services/viral-prediction/main-prediction-engine')` |
| `src/app/api/admin/prediction/analyze-video/route.ts:2` | `import { MainPredictionEngine } from ...` |
| `src/lib/services/master-viral-algorithm.ts:13` | `import { MainPredictionEngine } from './viral-prediction/main-prediction-engine'` |
| `src/lib/services/unifiedTestingFramework.ts:14` | `import { MainPredictionEngine } from ...` |
| `src/lib/services/accuracy-enhancement/ensemble-fusion-engine.ts:23` | `import { MainPredictionEngine } from ...` |

### C3 — `framework-evolution-system.ts` — **PRESERVE** (load-bearing)

| File:line | Context |
|---|---|
| `src/app/api/templates/evolution/route.ts:2` | `import { FrameworkEvolutionSystem } from ...` |
| `src/app/api/admin/framework-evolution/run/route.ts:11` | `import { FrameworkEvolutionSystem } from ...` |
| `src/app/api/admin/framework-evolution/patterns/route.ts:294` | `await import('@/lib/services/viral-prediction/framework-evolution-system')` |

### C4 — `god-mode-psychological-analyzer.ts` — **PRESERVE** (load-bearing via C2)

| File:line | Context |
|---|---|
| `src/lib/services/viral-prediction/main-prediction-engine.ts:7` | `import { GodModePsychologicalAnalyzer } from './god-mode-psychological-analyzer'` |

C2 (`main-prediction-engine.ts`) is itself imported by 10 production routes (above). Therefore C4 is transitively load-bearing.

### C5 — `inception-mode.ts` — **PRESERVE** (load-bearing)

| File:line | Context |
|---|---|
| `src/app/api/viral-prediction/inception/route.ts:4` | `import { InceptionModeSystem } from '@/lib/services/viral-prediction/inception-mode'` |

### Bundle verdict — Part C

**There is no "dead island." All 5 files are imported by routes under `src/app/api/`** (public scoring, multiple admin endpoints, viral-prediction routes). Several of them are also imported by `master-viral-algorithm.ts`, `dual_runner.ts`, and `ensemble-fusion-engine.ts` — meaning they are part of the live prediction surface that the app exposes.

**The premise of the prompt — that these are pre-consolidation "legacy engines" replaced by `runPredictionPipeline.ts` — is not borne out by the imports.** Both architectures coexist in production. The "canonical" pipeline at `src/lib/prediction/runPredictionPipeline.ts` is one path; these `viral-prediction/` engines are a separate, live path used by other routes.

**Do not delete any file in `src/lib/services/viral-prediction/` without untangling the imports first.** That's a multi-day refactor, not a cleanup task.

---

## 5. Part D — `apify/` cross-check

**Contents (5 scripts + 1 README):** `comment-sampler.js`, `entity-trackers.js`, `hot-feed-scanner.js`, `video-detail-enricher.js`, `author-backfill.js`.

**Per-file analysis:**

| File | Top-level structure | Writes to Supabase table | Inbound references in `src/` |
|---|---|---|---|
| `comment-sampler.js` | Reads recent rows from `videos`, inserts to `comments_sample` | `comments_sample` | **None** |
| `entity-trackers.js` | Stub upsert to `sounds` | `sounds` | **None** (but the `sounds` table is read by `src/lib/services/sound-service.ts:6,34,67,101`) |
| `hot-feed-scanner.js` | Calls Apify dataset API, ingests via Supabase | (mapping into `videos`) | **None** |
| `video-detail-enricher.js` | Reads `videos`, inserts to `video_engagement_windows` | `video_engagement_windows` | **None** (table is read by `src/app/api/admin/pipeline/status/route.ts:32`, `src/app/api/admin/prediction-validation/trigger/route.ts:52`) |
| `author-backfill.js` | Reads `videos`, upserts to `authors` | `authors` | **None** |

**Distinctive identifiers:** Each file is a top-level Node CLI (`#!/usr/bin/env node`, `async function main()`, no exports). They cannot be imported — only spawned as processes (`node apify/<name>.js`).

**README claims:** `apify/README.md:5-23` documents these as five Apify cloud actors (HotFeedScanner hourly, VideoDetailEnricher every 2h, AuthorBackfill daily, EntityTrackers every 6h, CommentSampler every 3h). Local invocation: `node apify/hot-feed-scanner.js --niche marketing --limit 50`.

**Per-file verdict:**

| File | Verdict | Reason |
|---|---|---|
| `comment-sampler.js` | AMBIGUOUS | Stub harness writing to `comments_sample`. Not imported by any `src/` code. May or may not be scheduled in your Apify cloud account. |
| `entity-trackers.js` | AMBIGUOUS | Same pattern. Sound-service.ts reads `sounds`; this script writes to it. |
| `hot-feed-scanner.js` | AMBIGUOUS | Same pattern. README schedules it hourly. |
| `video-detail-enricher.js` | AMBIGUOUS | Same pattern. The data sink (`video_engagement_windows`) is read by live admin routes. |
| `author-backfill.js` | AMBIGUOUS | Same pattern. |

**Folder verdict: AMBIGUOUS.**

The truth depends on a fact only Tommy can confirm:

> **Does your Apify account have these 5 scripts deployed and scheduled?**
>
> - If **yes** → folder is **PRESERVE**, even though no `src/` code imports them. Apify cloud is the runtime; your Next.js app is just the data consumer. Deleting these would silently break the data feed that several admin routes assume.
> - If **no** (e.g., your live Apify actors are all `clockworks/*` third-party actors and these scripts were never deployed) → folder is **DELETE**. Each file's inserted data could already be coming from your real `clockworks/*` actors via different code paths, or the data sink could be stale.

**The prompt hinted that your live Apify actors are `clockworks/*`** (third-party), which would suggest these scripts were never deployed. If you can confirm that with a quick check in your Apify dashboard, the verdict drops to DELETE. Until you do, default to AMBIGUOUS.

---

## 6. Summary table

| # | Item | Verdict | One-sentence reason |
|---|---|---|---|
| A1a | `config/niche-keywords.json` | **DELETE** | Live orchestrator loads `src/data/niche-keywords.json`, not this; CLAUDE.md says this copy is AI-generated/non-authoritative; the component is dead. |
| A1b | `config/objectives.matrix.json` | **KEEP** | Served by `src/app/config/objectives.matrix.json/route.ts`, consumed by QA mode. |
| A1c | `config/objectives.ops.json` | **AMBIGUOUS** | No route or import found, but resembles a sibling of `objectives.matrix.json` — possibly staged for an unbuilt route. |
| A2 | `paths/` | **DELETE** | 4 markdown files (NOT 5 JSONs as prompt assumed) — Cursor-style prompt scaffolding for unrelated AI app types; zero references. |
| A3 | `database/` | **ARCHIVE** | 4 historical SQL bootstrap scripts for live tables that have no counterpart in `supabase/migrations/`; not loaded at runtime but the only checked-in record of original DDL. |
| A4 | `openapi/` | **KEEP** | `src/app/api/openapi.json/route.ts` directly imports both `public_v1.json` and `public_v2.json`. |
| A5 | `packages/` | **KEEP** | `@trendzo/shared` TypeScript path alias points here; imported by routes, tests, scripts, and workers. |
| A6 | `schemas/` | **AMBIGUOUS** | No runtime import; referenced from `docs/contracts/`. ARCHIVE only if those contract docs are no longer load-bearing. |
| A7 | `storage/` | **KEEP** | Five admin integration routes write into `storage/proof/` and `storage/evidence/`; preflight check requires `storage/proof/`; training flow persists to `storage/models/`. |
| A8 | `plugins/` | **KEEP** | `src/app/api/admin/integration/status/route.ts:597-599` checks all three files at runtime; smoke test depends on them. |
| B1 | `sdk/` | **AMBIGUOUS** (lean PRESERVE) | External-customer SDK files (no internal import is expected); preserve unless partners/sandbox program is shut down. |
| B2 | `tasks/` | **DELETE** | 27 planning docs for an abandoned Create-React-App + Firebase architecture; current stack is Next.js + Supabase. |
| B3 | `tests/` | **AMBIGUOUS** | Not picked up by jest (testMatch is `__tests__/`) or playwright (testDir is `playwright/tests`); runnable only manually; ask "have I run any of these recently?" before deleting. |
| B4 | `model-backups/` | **KEEP** (local insurance) | No runtime import, but BACKUP_README documents a manual rollback procedure that depends on these files; already gitignored. |
| C1 | `unified-prediction-engine.ts` | **PRESERVE** | Imported by 11+ production files including `src/app/public/score/route.ts` and 7 admin routes. |
| C2 | `main-prediction-engine.ts` | **PRESERVE** | Imported by 10 production files including 5 viral-prediction admin routes. |
| C3 | `framework-evolution-system.ts` | **PRESERVE** | Imported by 3 production routes (templates/evolution + 2 admin/framework-evolution routes). |
| C4 | `god-mode-psychological-analyzer.ts` | **PRESERVE** | Imported by C2 (which is itself load-bearing). |
| C5 | `inception-mode.ts` | **PRESERVE** | Imported by `src/app/api/viral-prediction/inception/route.ts`. |
| D | `apify/` (5 scripts) | **AMBIGUOUS** | Stub harnesses that write to live Supabase tables; status depends on whether your Apify cloud account has them deployed. |

---

## 7. Anything that surprised me

1. **🚨 The 5 "predictor legacy engines" in Part C are not legacy.** All 5 are imported from production code — including the public `/public/score` API endpoint, multiple `/api/admin/*` routes, and `master-viral-algorithm.ts`. The prompt described them as "from an earlier architecture before the consolidation to `runPredictionPipeline.ts`", but in reality both architectures coexist live. Anyone reasoning from filenames alone would conclude these are deletable; the imports prove otherwise.

2. **`paths/` doesn't contain what the prompt expected.** The prompt described 5 JSON files (`calibration.json`, `flags.json`, `proof_tiles.json`, `videos.json`, `weather.json`); the actual folder has 4 unrelated `.md` files (`chat.md`, `image-generation.md`, `social-media.md`, `voice-notes.md`) that look like AI-app prompt templates. Either the audit doc that fed the prompt was outdated, or `paths/` got swapped at some point. Worth a sanity check.

3. **`config/objectives.matrix.json` is served by an *App Router route file at the same URL path*** (`src/app/config/objectives.matrix.json/route.ts`). I had not seen this pattern before — using a folder name with a `.json` suffix to mirror the static file path while serving dynamically. Subtle but elegant; deleting that route file would silently 404 the file from `qa-mode.ts`.

4. **`database/` SQL files describe live tables but are not in the migration system.** All four tables (`prediction_validation`, `pipeline_modules`, `algorithm_optimizations`, plus the `pipeline_module_config` sibling) are queried by live code (15+ call sites), but the SQL files in `database/` don't exist under `supabase/migrations/`. This means: (a) someone bootstrapped these tables outside the migration system originally, and (b) if you delete `database/`, you lose the only checked-in record of how they were shaped. Not catastrophic — Supabase has the live schema — but worth a beat of thought before deleting.

5. **`tests/` is technically orphaned from both test runners.** Jest's `testMatch` only catches `__tests__/` directories; Playwright's `testDir` is `playwright/tests`. Specs in `tests/e2e/`, `tests/preflight/` etc. can only be run with explicit paths (and the `npm run test:e2e` command referenced in `src/components/templateMiniUI/README.md:191` doesn't exist in `package.json`). So even though the spec files look "live", they are not part of any automated CI run. They're only useful if Tommy runs them manually — which he probably hasn't in months.

6. **`model-backups/` is gitignored.** It's not in the repo at all. So "deleting" it isn't a repo-cleanup question — it's a question about whether to delete a file from Tommy's local disk. The answer is "not yet, keep until v15 is fully promoted and stable for 2+ weeks".

7. **The `apify/` scripts insert into tables that the live app reads.** That asymmetric dependency (writers locally, readers in `src/`) is the trickiest case. If they're scheduled in Apify cloud, deleting them silently breaks data flow into `comments_sample`, `sounds`, `video_engagement_windows`, and `authors` — and `src/app/api/admin/pipeline/status/route.ts` reads from `video_engagement_windows` to show pipeline health. So a clean `apify/` deletion could turn that pipeline-health endpoint into "no recent data". This is the strongest argument for confirming Apify cloud state before any deletion in Part D.
