# Trendzo Codebase Inventory — 2026-05-04

**Branch:** `vercel-deploy-test`
**HEAD:** `da993d9b1e8ea014e1425c835d17f5885a0d0a33`
**Mode:** Strictly read-only. No file in the repo was modified by this pass except for this output document.
**Author:** AI inventory pass (Phase B)
**Audience:** Tommy (chairman / non-developer founder)

---

## How to read this document

Every directory and major file surface in the repo is sorted into one of four buckets:

- **CORE** — directly required to deliver one of the three halves of Trendzo (the platform, the funnel, or the chairman operating layer)
- **SUPPORTING** — infrastructure CORE depends on (auth, database client, build config, shared types)
- **EXPERIMENTAL** — earlier pivots, abandoned features, or chairman defer-list items. Candidates for removal in a later phase.
- **UNKNOWN** — could not classify with confidence. Listed at the end with what would resolve it.

A bucket is **not** a deletion verdict. This pass produces the map. Deletions happen later, only with chairman sign-off.

---

## A note on the date lens

The original prompt asks for a "Recent (last 8 months) vs Older" split. **That lens collapses on this branch.** The `vercel-deploy-test` branch only has 52 commits, all dated between **2026-03-30** and **2026-05-03** — about five weeks of git history. There is no "older than 8 months" cohort here at all.

The repo on disk is older than that — the file contents reflect roughly a year of accumulated work — but git treats almost everything as "added on 2026-03-30" because that is the date of the initial bulk commit on this branch.

To produce a useful signal, I substituted a different lens:

- **ACTIVE** — touched by a commit on/after **2026-04-21** (the last two weeks of work — feature commits, not just the bulk import or the build-fix sweep)
- **DORMANT** — only touched by the initial bulk commit (`2026-03-30`) and never revisited

A file being DORMANT does not mean it's dead. It might be load-bearing legacy code that just hasn't needed touching. But a directory full of DORMANT files combined with a hard-to-justify product purpose is a strong signal.

I flag this clearly in each section below so Tommy can apply judgment.

---

# 1. Summary

| Metric | Value |
| --- | --- |
| Total tracked top-level directories | 64 |
| Total tracked files (excluding `node_modules`, `.next`, `.git`, `.vercel`) | ~10,800 |
| File counts skewed by | `tiktok_transcriber/` (4,013 files — Python project, mostly vendored deps) and `src/` (3,260 files — main app) |

### Bucket breakdown (top-level directories only)

| Bucket | Count | % | Examples |
| --- | --- | --- | --- |
| CORE | 5 | 8% | `src/`, `supabase/`, `public/`, `next.config.mjs`, `package.json` |
| SUPPORTING | 9 | 14% | `.github/`, `playwright/`, `e2e/`, `scripts/` (parts), `infrastructure/`, `models/` |
| EXPERIMENTAL | 28 | 44% | `.bmad-core/`, `autoresearch/`, `tiktok_transcriber/`, `nine-attributes-framework/`, `Unicorn UX/`, `video frameworks and research/`, `dashboard-fix/`, `frameworks-and-research/`, `ip-components/`, `legal/`, `agent-starter-python/`, `dist/`, `extensions/`, etc. |
| UNKNOWN | 22 | 34% | `apify/`, `data/`, `database/`, `docker/`, `fixtures/`, `integrations/`, `k8s/`, `model-backups/`, `packages/`, `paths/`, `python-services/`, `sdk/`, `security/`, `snapshots/`, `storage/`, `tasks/`, `tests/`, `tmp/`, `workers/`, etc. |

### Bucket breakdown inside `src/` (the actual app code)

| Bucket | Coverage |
| --- | --- |
| CORE | The funnel surface, the chairman surface, the predictor surface, the agency app shell, billing/Stripe wiring |
| SUPPORTING | `src/lib/supabase/`, `src/lib/stripe/`, `src/types/`, `src/lib/utils/`, `src/middleware.ts`, base layout/auth files |
| EXPERIMENTAL | Most of `src/app/sandbox/` (43 pages), large parts of `src/app/admin/` (specifically the algorithm-design pages: `dna-detective`, `gene-tagger`, `framework-reservoir`, `master-orchestrator`, `inception-studio`, `viral-genomes`, `ai-brain`, `algorithm-iq`, etc.), `src/lib/firebase/` (stubbed dead shim), `src/pages._disabled/` |
| UNKNOWN | Many service files in `src/lib/services/` (especially `viral-prediction/`, which has 25 files of overlapping engines) |

### Lens distribution

- **ACTIVE (touched in last 2 weeks)** — concentrated in: funnel surface, agency app, predictor pipeline, calibration, Phase 1.x build-fix (`force-dynamic` adds across 640 routes). Maybe 5-10% of files.
- **DORMANT (only in initial bulk commit)** — the rest. ~90% of files have not been touched on this branch since the initial import.

---

# 2. Top-level directory classification

Listed alphabetically. Bucket → reasoning → activity → representative files.

---

### `.agents/`
- **Bucket:** EXPERIMENTAL
- **Files:** 32
- **Reasoning:** AI agent skill definitions for Cursor/Claude Code workflows (skill markdown files like `animate`, `find-skills`). Tooling for the developer, not Trendzo product.
- **Activity:** DORMANT (last touched 2026-03-30)
- **Representative:** `.agents/skills/animate/SKILL.md`, `.agents/skills/find-skills/SKILL.md`

### `.bmad-core/`
- **Bucket:** EXPERIMENTAL — clearly an abandoned pivot (BMAD)
- **Files:** 88
- **Reasoning:** BMAD = "BMad Master" agent framework. The `.bmad-core/agents/bmad-master.md` file declares an agent persona ("ACTIVATION-NOTICE: this file contains your full agent operating guidelines"). This is a third-party AI agent methodology, not Trendzo product code.
- **Activity:** Mostly DORMANT, but `.bmad-core/data/` had ACTIVE touches in last 2 weeks (4 file-touches)
- **Representative:** `.bmad-core/agents/bmad-master.md`, `.bmad-core/agents/bmad-orchestrator.md`, `.bmad-core/utils/bmad-doc-template.md`
- **Cross-reference:** also referenced from `docs/bmad/` (12+ planning docs) and `.cursor/rules/bmad-*.mdc` and `.windsurf/rules/bmad-*.md` — see Pivot Clusters section.

### `.claude/`
- **Bucket:** SUPPORTING
- **Files:** 124
- **Reasoning:** Claude Code project rules, agent playbooks, command templates (`/verify`, `/ticket`, `/pr-checklist`). Developer tooling, not product code, but actively used to scaffold dev work.
- **Activity:** DORMANT
- **Representative:** `.claude/agents/verify-app.md`, `.claude/commands/verify.md`, `.claude/get-shit-done/templates/`

### `.cursor/`
- **Bucket:** SUPPORTING
- **Files:** 59
- **Reasoning:** Cursor IDE rules (`core.mdc`, `unicorn-ux-tracking.mdc`, `bmad-master.mdc`, etc.). Same developer tooling category as `.claude/`.
- **Activity:** DORMANT
- **Representative:** `.cursor/rules/core.mdc`, `.cursor/rules/bmad-master.mdc`, `.cursor/rules/trendzo-project-instructions.mdc`

### `.github/`
- **Bucket:** SUPPORTING
- **Files:** 8
- **Reasoning:** GitHub Actions workflows (CI, PR review). Standard dev infrastructure.
- **Activity:** DORMANT
- **Representative:** `.github/workflows/claude-pr-review.yml`

### `.gstack/`
- **Bucket:** EXPERIMENTAL
- **Files:** 2
- **Reasoning:** `gstack` developer-tool installation residue. Not product code.
- **Activity:** DORMANT
- **Representative:** `.gstack/skills/`

### `.planning/`
- **Bucket:** SUPPORTING (documentation) but worth chairman review
- **Files:** 78
- **Reasoning:** The "official" planning docs for the project — `accuracy-roadmap.md`, `prediction-audit.md`, codebase docs (`STACK.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`). These are referenced from `CLAUDE.md` and represent the architectural source-of-truth narrative. Not product code, but Tommy will want to keep them to orient future agents.
- **Activity:** DORMANT
- **Representative:** `.planning/accuracy-roadmap.md`, `.planning/prediction-audit.md`, `.planning/codebase/STACK.md`

### `.ralph/`
- **Bucket:** EXPERIMENTAL
- **Files:** 9
- **Reasoning:** Project orchestrator config files (`tasks.json`, `task_001.txt` … `task_010.txt`). Looks like another agent/orchestrator pivot's residue.
- **Activity:** DORMANT
- **Representative:** `.ralph/tasks.json`

### `.windsurf/`
- **Bucket:** EXPERIMENTAL
- **Files:** 10
- **Reasoning:** Windsurf IDE rules — third-party tooling residue. Includes `.windsurf/rules/bmad-master.md` (overlaps with BMAD pivot).
- **Activity:** DORMANT
- **Representative:** `.windsurf/rules/bmad-master.md`, `.windsurf/rules/bmad-orchestrator.md`

### `ADR/`
- **Bucket:** UNKNOWN
- **Files:** 1
- **Reasoning:** A single Architecture Decision Record. Single-file dir; unclear if this is the start of a discipline that was abandoned, or a one-off.
- **Activity:** DORMANT

### `agent-starter-python/`
- **Bucket:** EXPERIMENTAL — and **gitignored**
- **Files:** 67 (on disk, not in git)
- **Reasoning:** Sample/template Python agent starter. Listed in `.gitignore` under "backup/archive folders". Not part of the deployed product.
- **Activity:** N/A — not in git history
- **Representative:** local-only

### `apify/`
- **Bucket:** UNKNOWN
- **Files:** 6
- **Reasoning:** Apify scraper actor definitions. The predictor pipeline does call Apify (`src/lib/services/viral-prediction/apify-scraper.ts` is heavily used), so this MAY be the source code for that scraper actor. But the directory itself is small (6 files) and includes things like `comment-sampler.js`, `entity-trackers.js`, `hot-feed-scanner.js` — these look like standalone scraper scripts deployed separately to Apify. Not bundled into the Next.js app. Could be live infrastructure or could be experimental scripts.
- **Activity:** DORMANT
- **Representative:** `apify/hot-feed-scanner.js`, `apify/comment-sampler.js`, `apify/README.md`
- **What would resolve:** Confirm with Tommy whether these scripts are live in his Apify account or were prototypes that never deployed.

### `artifacts/`
- **Bucket:** EXPERIMENTAL / artifact-only
- **Files:** 4
- **Reasoning:** Build artifacts (evidence, models, proof). Generated output, not source.
- **Activity:** DORMANT

### `autoresearch/`
- **Bucket:** SUPPORTING (research tooling for the predictor — the moat)
- **Files:** 24
- **Reasoning:** Per `autoresearch/README.md`: "Offline optimization sandbox for Trendzo's VPS prediction pipeline." It exports labeled prediction data, replays the aggregation math, and tests parameter configurations against Spearman rank correlation. **No live API calls. No production writes. No LLM re-execution.** It tunes the predictor's weights offline. Without it the predictor still runs; with it the predictor improves over time. So: SUPPORTING.
- **Activity:** ACTIVE — many subdirs were touched in last 2 weeks (`auto-014` through `auto-044`, `bootstrap_validation_s9`, `phase3_chain_logs`, `v16-control`, `v16-candidate`).
- **Representative:** `autoresearch/sandbox/optimize-weights.ts`, `autoresearch/sandbox/eval-spearman.ts`, `autoresearch/configs/best.json`, `autoresearch/results/optimization-summary.json`
- **Note:** There is also `src/lib/training/autoresearch/` (Python + TS files) — that's the in-app bridge to this sandbox. Treat the two together.

### `config/`
- **Bucket:** UNKNOWN
- **Files:** 3
- **Reasoning:** Three JSON files (`niche-keywords.json`, `objectives.matrix.json`, `objectives.ops.json`). Per `CLAUDE.md`: "`config/niche-keywords.json` is AI-generated — NOT authoritative." Unclear if `objectives.*.json` are loaded at runtime.
- **Activity:** DORMANT
- **What would resolve:** grep for imports of these specific JSON paths.

### `dashboard-fix/`
- **Bucket:** EXPERIMENTAL (artifact)
- **Files:** 1
- **Reasoning:** Single `page.tsx` file. Appears to be a one-off patch file from a debugging session.
- **Activity:** DORMANT

### `data/`
- **Bucket:** EXPERIMENTAL — and **gitignored**
- **Files:** 204 (on disk, not in git)
- **Reasoning:** Local scraped data. `.gitignore` line: `# scraped data` → `/data/`. Not deployed.
- **Activity:** N/A — not in git history

### `database/`
- **Bucket:** UNKNOWN
- **Files:** 4
- **Reasoning:** Standalone DB schema files separate from `supabase/migrations/`. Why two locations?
- **Activity:** DORMANT
- **What would resolve:** Confirm whether anything reads from `database/` at runtime.

### `dist/`
- **Bucket:** EXPERIMENTAL (build artifact)
- **Files:** 1
- **Reasoning:** Compiled output. Not source.
- **Activity:** DORMANT

### `docker/`
- **Bucket:** UNKNOWN
- **Files:** 15
- **Reasoning:** Docker Compose configs (`monitoring-stack.yml`, alertmanager/grafana/loki/prometheus/promtail configs). Production observability stack — but this branch deploys to **Vercel**, not Docker. So either dead, or the team intends to spin up monitoring on a separate host.
- **Activity:** DORMANT
- **Representative:** `docker/monitoring-stack.yml`, `docker/grafana/`, `docker/loki/`
- **What would resolve:** Has Tommy ever run this? If "no, never," it's EXPERIMENTAL.

### `docs/`
- **Bucket:** SUPPORTING
- **Files:** 272
- **Reasoning:** Architecture docs, methodology pack, BMAD planning docs, codex notes, feature deployment guides. Not product code.
- **Activity:** Mostly DORMANT, light recent touches
- **Representative:** `docs/COMPONENT_DEEP_ANALYSIS.md`, `docs/Trendzo Methodology Pack v1.1.md`, `docs/methodology_pack/` (43 files), `docs/features/` (33 files), `docs/bmad/` (9 files — BMAD pivot artifact)

### `e2e/`
- **Bucket:** SUPPORTING (test)
- **Files:** 1
- **Reasoning:** End-to-end test scaffolding. One file (`sandbox-workflow.spec.ts`).
- **Activity:** DORMANT

### `extensions/`
- **Bucket:** EXPERIMENTAL
- **Files:** 8
- **Reasoning:** Browser extensions (capcut, descript, premiere, telemetry-extension). Not part of the deployed Next.js app. Likely earlier-pivot side experiments.
- **Activity:** DORMANT
- **Representative:** `extensions/capcut/`, `extensions/descript/`

### `fixtures/`
- **Bucket:** UNKNOWN
- **Files:** 113
- **Reasoning:** Test fixtures. Could be live test data or stale.
- **Activity:** DORMANT
- **What would resolve:** grep for which test files import from `fixtures/`.

### `frameworks-and-research/`
- **Bucket:** EXPERIMENTAL — and **gitignored**
- **Files:** 93 (on disk, not in git)
- **Reasoning:** Listed in `.gitignore` under "backup/archive folders". Notable: holds `frameworks-and-research/POC Research & Framework Data/Framework- Niche Keywords 11-16-25.md` — which `CLAUDE.md` cites as "manually curated TikTok search terms across 4/20 niches" feeding the future Search Alignment Component. So while EXPERIMENTAL by location and git status, **the keyword data inside is irreplaceable hand-curated source material.** Do not delete the directory contents without preserving that file.
- **Activity:** N/A — not in git history
- **Representative on disk:** `frameworks-and-research/POC Research & Framework Data/Framework- Niche Keywords 11-16-25.md`

### `infrastructure/`
- **Bucket:** UNKNOWN
- **Files:** 10
- **Reasoning:** Has a `monitoring/` subdir (likely paired with `docker/` above). On a Vercel deploy, may or may not be live.
- **Activity:** DORMANT

### `integrations/`
- **Bucket:** UNKNOWN
- **Files:** 16
- **Reasoning:** Subdirs `make/`, `sheets/`, `zapier/`, `js/`, `python/` — third-party automation glue. Could be production webhooks or could be aspirational scaffolding.
- **Activity:** DORMANT
- **What would resolve:** Confirm with Tommy whether any external Zap/Make/Sheets automation is live and depends on files here.

### `ip-components/`
- **Bucket:** UNKNOWN
- **Files:** 1
- **Reasoning:** Single file: `Sprint-0-Backlog.md`. Looks like a planning doc that ended up in the wrong directory.
- **Activity:** DORMANT

### `k8s/`
- **Bucket:** UNKNOWN (likely EXPERIMENTAL given the Vercel deployment target)
- **Files:** 7
- **Reasoning:** Kubernetes manifests (`deployment.yaml`, `hpa.yaml`, `ingress.yaml`, `service.yaml`, `configmap.yaml`). Branch deploys to Vercel — these are not in use for the live deploy.
- **Activity:** DORMANT

### `legal/`
- **Bucket:** EXPERIMENTAL
- **Files:** 1
- **Reasoning:** Single file: `owasp-compliance-checklist.md`. Notes only.
- **Activity:** DORMANT

### `logs/`
- **Bucket:** EXPERIMENTAL (artifact, also `.gitignore`'d via `*.log`)
- **Files:** 1
- **Reasoning:** Log dump. Not source.

### `model-backups/`
- **Bucket:** UNKNOWN
- **Files:** 5
- **Reasoning:** Backups of trained ML models. Could be the only copy of a load-bearing model artifact, or could be stale.
- **Activity:** DORMANT
- **What would resolve:** Confirm whether `models/xgboost-v6-metadata.json` or another live-model file references anything in here.

### `models/`
- **Bucket:** SUPPORTING (predictor support — the moat)
- **Files:** 35
- **Reasoning:** Trained ML model artifacts + metadata. `CLAUDE.md` cites `models/xgboost-v6-metadata.json` as the active XGBoost v6 metadata. The predictor depends on these files at runtime. Status of v6 is "DISABLED" per `CLAUDE.md`, but artifacts must be preserved for any future v7 retrain.
- **Activity:** Lightly ACTIVE — last touch 2026-04-17
- **Representative:** `models/xgboost-v6-metadata.json`, `models/feature-names.json`, `models/feature-scaler.pkl`, `models/holdout-video-ids.json`, `models/v10-production-backup-2026-04-17/`

### `nine-attributes-framework/`
- **Bucket:** EXPERIMENTAL
- **Files:** 20
- **Reasoning:** Standalone framework folder (likely the source material for the "9 attributes scorer" component, now subsumed into Pack 1 inside `src/lib/rubric-engine/`). Pure docs.
- **Activity:** DORMANT

### `openapi/`
- **Bucket:** UNKNOWN
- **Files:** 2
- **Reasoning:** OpenAPI specs (`public_v1.json`, `public_v2.json`). May or may not be served live.
- **Activity:** DORMANT
- **What would resolve:** grep for routes that serve these.

### `packages/`
- **Bucket:** UNKNOWN
- **Files:** 9
- **Reasoning:** Has `template-kernel.samples.json`, `template-kernel.schema.json`, `feature-store-schema.yaml`. Looks like data/schema artifacts, possibly from a planned monorepo structure that wasn't completed.
- **Activity:** DORMANT

### `paths/`
- **Bucket:** UNKNOWN
- **Files:** 4
- **Reasoning:** `calibration.json`, `flags.json`, `proof_tiles.json`, `videos.json`, `weather.json` — small JSON config files. May be runtime-loaded.
- **Activity:** DORMANT
- **What would resolve:** grep for imports of these paths.

### `pipeline-progress/`
- **Bucket:** EXPERIMENTAL
- **Files:** 1
- **Reasoning:** Single file. Likely a one-off note.
- **Activity:** DORMANT

### `playwright/`
- **Bucket:** SUPPORTING (test)
- **Files:** 12
- **Reasoning:** Playwright E2E test config. `CLAUDE.md` cites `playwright/tests/training-readiness.spec.ts` as a real test.
- **Activity:** DORMANT

### `plugins/`
- **Bucket:** UNKNOWN
- **Files:** 3
- **Reasoning:** Three files in unknown role.
- **Activity:** DORMANT

### `project-management/`
- **Bucket:** EXPERIMENTAL
- **Files:** 1
- **Reasoning:** Single file. Doc-only.
- **Activity:** DORMANT

### `public/`
- **Bucket:** CORE (Next.js convention; static assets served by the live site)
- **Files:** 82
- **Reasoning:** Standard Next.js `public/` directory. Includes images for the funnel landing page (`escape-assessment-guide.png`, `escape-assessment-modules.png`), favicon, audio sample files. Some legacy assets (TV-show themed images: `peaky-blinders-banner.jpg`, `ash-vs-evil-dead.jpg`, `brooklyn-nine-nine.jpg` — likely placeholders from earlier pivots). Some `.html` files in the root (`deploy-database.html`, `verify-beat-sync.html`, `index.html`) look like leftover one-off pages.
- **Activity:** ACTIVE
- **Representative:** `public/escape-assessment-guide.png`, `public/escape-assessment-modules.png`, `public/favicon.svg`

### `python-services/`
- **Bucket:** UNKNOWN
- **Files:** 4
- **Reasoning:** Python services. Vercel deploy serves Next.js — these would have to run elsewhere.
- **Activity:** DORMANT

### `Research & Framework Data For Algorithm/`
- **Bucket:** SUPPORTING (research source material)
- **Files:** 15
- **Reasoning:** Research markdown files from external sources (TikTok algorithm 2024-2025, viral metrics validation, "90% Accurate TikTok Viral Content Prediction System"). These are the empirical foundation Tommy used to design the predictor. Pure documentation, but valuable.
- **Activity:** DORMANT

### `research-reports/`
- **Bucket:** EXPERIMENTAL
- **Files:** 1
- **Reasoning:** Single file: `personal-finance-report.json`. Looks orphaned.
- **Activity:** DORMANT

### `results-autoresearch/`
- **Bucket:** SUPPORTING (paired with `autoresearch/`)
- **Files:** 155
- **Reasoning:** Output of the autoresearch optimization runs. Each `auto-NNN/` subdir is one experimental config evaluation.
- **Activity:** ACTIVE — many runs created in last 2 weeks
- **Representative:** `results-autoresearch/auto-044/`, `results-autoresearch/v16-control/`, `results-autoresearch/v16-candidate/`, `results-autoresearch/bootstrap_validation_s9/`

### `sales/`
- **Bucket:** EXPERIMENTAL
- **Files:** 2
- **Reasoning:** Two sales decks (`deck_5slides.mdx`, `one_pager.md`). Pure docs.
- **Activity:** DORMANT

### `schemas/`
- **Bucket:** UNKNOWN
- **Files:** 3
- **Reasoning:** Top-level `schemas/` (likely contracts/schemas, possibly redundant with `src/contracts/` or `packages/`).
- **Activity:** DORMANT

### `scripts/`
- **Bucket:** Mixed — mostly EXPERIMENTAL/artifact, some SUPPORTING
- **Files:** 443
- **Reasoning:** Massive script graveyard. Most are one-off database migrations (`apply-migration-direct.js`, `apply-prompt42-migration.ts`, etc.), one-off analyses (`analyze-classification-mismatch.js`, `analyze-tier-breakdown.py`), one-off backfills, and ad-hoc data cleaning scripts. A handful are likely live cron entry points or operations scripts. The directory needs file-by-file review later.
- **Activity:** Lightly ACTIVE — `scripts/` was touched in last 2 weeks (a small number of files; majority is DORMANT)
- **Representative:** `scripts/apply-migration.js`, `scripts/analyze-creator-baselines.py`, `scripts/comprehensive-database-report.js`, `scripts/sql/` (1 file), `scripts/temp/` (empty)
- **Recommendation:** This is the single largest deletion-target candidate in the repo, but each file needs to be checked for whether it's still wired into something live (cron, package.json script, README reference).

### `sdk/`
- **Bucket:** UNKNOWN
- **Files:** 3
- **Reasoning:** Three files. Possibly an SDK skeleton.
- **Activity:** DORMANT

### `security/`
- **Bucket:** UNKNOWN
- **Files:** 1
- **Reasoning:** Single file.
- **Activity:** DORMANT

### `snapshots/`
- **Bucket:** EXPERIMENTAL (artifact)
- **Files:** 88
- **Reasoning:** Snapshot files from analyses or tests. Not source.
- **Activity:** DORMANT

### `src/`
- **Bucket:** CORE (the Next.js app — primary product code)
- **Files:** 3,260
- **Reasoning:** This is the Next.js application. Inside it, however, are mixed buckets — see Section 7 (UI surfaces inside `src/app/`) and the dedicated funnel/chairman/predictor sections below.
- **Activity:** Most ACTIVE directory in the repo; 713 file-touches in last 2 weeks (largely from the Phase 1.6 `force-dynamic` sweep).

### `storage/`
- **Bucket:** UNKNOWN
- **Files:** 9
- **Reasoning:** May be Supabase Storage helpers, may be unrelated.
- **Activity:** DORMANT

### `supabase/`
- **Bucket:** CORE (database migrations + Edge Functions for the live database)
- **Files:** 210
- **Reasoning:** `supabase/migrations/` (165 files) is the canonical schema for the production database. `supabase/functions/` (5 files) is Supabase Edge Functions. `supabase/migrations_archive/` (30 files) is older migrations preserved.
- **Activity:** ACTIVE — 13 migration touches in last 2 weeks
- **Representative:** `supabase/migrations/20260428200000_create_stripe_purchases.sql`, `supabase/migrations/20260426120000_create_escape_assessments.sql`, `supabase/migrations/20260427100000_create_freedom_agent_conversations.sql`, `supabase/migrations/20260429000000_create_redemption_codes.sql`

### `tasks/`
- **Bucket:** UNKNOWN
- **Files:** 27
- **Reasoning:** Likely planning docs.
- **Activity:** DORMANT

### `test-results/`
- **Bucket:** EXPERIMENTAL (artifact)
- **Files:** 2

### `tests/`
- **Bucket:** SUPPORTING (test)
- **Files:** 11
- **Reasoning:** A second test directory. The repo has tests scattered across `tests/`, `e2e/`, `playwright/`, and `src/__tests__/` — fragmentation that needs cleanup.
- **Activity:** DORMANT

### `tiktok_transcriber/`
- **Bucket:** EXPERIMENTAL (separate Python project, vendored deps inflate count)
- **Files:** 4,013
- **Reasoning:** Standalone Python TikTok transcription project. The vast majority of its 4,013 files are vendored Python dependencies (this project doesn't use Python `requirements.txt` + virtualenv discipline). The actual application logic is small. The deployed Next.js app uses OpenAI Whisper directly (see `src/lib/services/whisper-service.ts`), not this. This appears to be an earlier, separate transcriber experiment.
- **Activity:** DORMANT
- **Recommendation:** A strong delete-candidate, but verify nothing in `scripts/` or a cron shells out to it.

### `tmp/`
- **Bucket:** EXPERIMENTAL (and `.gitignore`'d)
- **Files:** 1
- **Reasoning:** Temp file.

### `Unicorn UX/`
- **Bucket:** EXPERIMENTAL (docs)
- **Files:** 1
- **Reasoning:** UI implementation guide. Pure doc, possibly companion to `.cursor/rules/unicorn-ux-tracking.mdc`.
- **Activity:** DORMANT

### `video frameworks and research/`
- **Bucket:** EXPERIMENTAL (docs)
- **Files:** 6
- **Reasoning:** Markdown reports about TikTok / viral video frameworks. Documentation only.
- **Activity:** DORMANT

### `work-streams/`
- **Bucket:** UNKNOWN
- **Files:** 1

### `workers/`
- **Bucket:** UNKNOWN
- **Files:** 1

---

# 3. Funnel surface (CORE — protect from deletion)

The Half-2 funnel: YouTube code drops → Escape Assessment → attached agent → soft-pitch to Trendzo. Per Tommy's standing definition this is **CORE even though it isn't part of the platform's delivery pipeline.**

### Public-facing pages
```
src/app/(public)/free/freedom-os/page.tsx
src/app/(public)/free/freedom-os/FreedomOSTool.tsx          [modified, uncommitted]
src/app/(public)/free/freedom-os/PlanResultsView.tsx
src/app/(public)/free/freedom-os/plan/[planId]/page.tsx
src/app/(public)/free/freedom-os/plan/[planId]/not-found.tsx
src/app/(public)/free/freedom-agent/page.tsx
src/app/(public)/free/freedom-agent/[sessionId]/page.tsx
src/app/(public)/free/page.tsx
src/app/(public)/welcome/page.tsx
src/app/(public)/t/[shareId]/page.tsx
src/app/assessment/[assessmentId]/page.tsx                  [modified, uncommitted]
src/app/assessment/[assessmentId]/loading.tsx
src/app/assessment/[assessmentId]/not-found.tsx
```

### API routes
```
src/app/api/freedom-agent/chat/route.ts                     [modified, uncommitted]
src/app/api/freedom-agent/conversation/route.ts             [modified, uncommitted]
src/app/api/freedom-agent/session/route.ts
src/app/api/freedom-agent/history/route.ts
src/app/api/freedom-agent/weekly-checkin/route.ts
src/app/api/freedom-agent/unsubscribe/route.ts
src/app/api/freedom-agent/chat/route.deprecated.ts          [legacy — flag for cleanup]
src/app/api/assessment/generate/route.ts                    [modified, uncommitted]
src/app/api/assessment/email-capture/route.ts               [modified, uncommitted]
src/app/api/assessment/email-status/route.ts                [modified, uncommitted]
src/app/api/assessment/sprint-progress/route.ts             [modified, uncommitted]
src/app/api/assessment/test/route.ts
src/app/api/landing/code-validate/route.ts
src/app/api/landing/email-notify/route.ts                   [modified, uncommitted]
src/app/api/free/freedom-os/lead/route.ts
src/app/api/free/freedom-os/resend/route.ts
src/app/api/funnel/waitlist/route.ts
src/app/api/subscribe/route.ts
src/app/api/billing/checkout/route.ts                       [Stripe — funnel monetization]
src/app/api/billing/stripe/webhook/route.ts
```

### Core funnel libraries
```
src/lib/freedom-agent/build-system-prompt.ts
src/lib/freedom-agent/fetch-conversation.ts
src/lib/freedom-agent/append-message.ts
src/lib/freedom-agent/load-plan-for-session.ts
src/lib/freedom-agent/niche-templates.ts
src/lib/freedom-agent/plan-prompt-section.ts
src/lib/freedom-agent/progress-tracker.ts
src/lib/freedom-agent/soft-sell-arc.ts
src/lib/prompts/freedom-agent-prompt.ts                     [active — recently modified]
src/lib/assessment/fetch-assessment.ts                      [modified, uncommitted]
src/lib/assessment/build-input-from-form.ts
src/lib/assessment/generate.ts
src/lib/assessment/validate-payload.ts
src/lib/beehiiv/notify.ts                                   [modified, uncommitted — beehiiv newsletter integration]
```

### UI components
```
src/components/landing/CodeEntry.tsx                        [the YouTube code-drop entry surface]
src/components/landing/YouTubeCTA.tsx
src/components/landing/HookSection.tsx
src/components/landing/PromiseSection.tsx
src/components/landing/MethodSection.tsx
src/components/landing/CloseSection.tsx                     [modified, uncommitted]
src/components/landing/CTASection.tsx
src/components/landing/CheckoutBanner.tsx
src/components/landing/PaidCheckoutButton.tsx
src/components/landing/EmailNotifyForm.tsx
src/components/landing/ScarcitySection.tsx
src/components/landing/StatsSection.tsx
src/components/landing/StackSection.tsx
src/components/landing/ReceiveSection.tsx
src/components/landing/CostSection.tsx
src/components/landing/BetrayalSection.tsx
src/components/landing/NotForSection.tsx
src/components/freedom-os/FreedomMultiplierControl.tsx
src/components/freedom-os/HamsterLoader.tsx
src/components/assessment/AgentChip.tsx
src/components/assessment/AgentGate.tsx                     [modified, uncommitted]
src/components/assessment/AgentInput.tsx
src/components/assessment/AgentMessages.tsx
src/components/assessment/AgentRail.tsx                     [modified, uncommitted]
src/components/assessment/AssessmentHUD.tsx                 [modified, uncommitted]
src/components/assessment/AgentIdentityGlyph.tsx
src/components/assessment/BusinessMatchPanel.tsx
src/components/assessment/Chassis.tsx
src/components/assessment/Day1Spotlight.tsx                 [modified, uncommitted]
src/components/assessment/DeliverablesHeader.tsx
src/components/assessment/EmailCapturePanel.tsx
src/components/assessment/FreedomNumberRing.tsx
src/components/assessment/HolographicRing.tsx
src/components/assessment/LeadsPanel.tsx
src/components/assessment/OperatorPanel.tsx
src/components/assessment/RoadmapList.tsx
src/components/assessment/SaveYourLinkNotice.tsx            [untracked, new file]
src/components/assessment/SprintGrid.tsx                    [modified, uncommitted]
```

### Database tables (per `supabase/migrations/`)
```
escape_assessments               (20260426120000_create_escape_assessments.sql)
sprint_progress                  (20260427000000_add_sprint_progress.sql)
freedom_agent_conversations      (20260427100000_create_freedom_agent_conversations.sql)
freedom_agent_sessions           (20260403_create_freedom_agent_sessions.sql)
assessment_emails                (20260428000000_create_assessment_emails.sql)
landing_emails                   (20260428100000_create_landing_emails.sql)
stripe_purchases                 (20260428200000_create_stripe_purchases.sql)
redemption_codes                 (20260429000000_create_redemption_codes.sql)
freedom_os_plans                 (20260418_freedom_os_plans.sql)
freedom_os_saved_plans           (202602210004_freedom_os_saved_plans.sql)
assessment share_token           (20260430000000_assessment_share_token.sql) — untracked, new
```

### Notes
- `src/app/api/recover-link/route.ts` and `src/app/(public)/recover/` are **deleted** in the working tree — Tommy is mid-refactor of the recover-link mechanic.
- `src/app/api/freedom-agent/chat/route.deprecated.ts` is explicit dead code worth cleanup.
- The funnel surface has **the largest concentration of recent commits** in the repo (assessment polish, email capture, instrument aesthetic, freedom-os tool changes). It is clearly the most active area of development.

---

# 4. Chairman-layer surface (CORE)

### Currently implemented (CORE)

**Chairman dashboard pages**
```
src/app/admin/chairman/page.tsx                   [primary chairman view, 1929 lines]
src/app/chairman/page.tsx                         [redirects to /admin/operations]
src/app/chairman/layout.tsx
src/components/admin/dashboard/ChairmanDashboard.tsx
src/components/admin/dashboard/ChairmanAlertsBanner.tsx
src/app/admin/dashboard/page.tsx                  [admin landing dashboard]
src/app/admin/operations/page.tsx                 [chairman's primary ops view per /chairman redirect]
```

**Multi-tenant agency view + lifecycle**
```
src/app/admin/organization/page.tsx
src/app/admin/organization/agencies/page.tsx
src/app/admin/organization/agencies/[id]/page.tsx
src/app/admin/organization/creators/page.tsx
src/app/api/admin/agencies/[id]/preload-patterns/route.ts
src/app/api/admin/tenants/route.ts
src/app/api/admin/tenants/[tenantId]/keys/route.ts
src/app/api/admin/tenants/[tenantId]/keys/[keyId]/route.ts
src/lib/auth/agency-utils.ts
```

**Revenue (Stripe pull)**
```
src/app/api/billing/status/route.ts
src/app/api/billing/usage/route.ts
src/app/api/billing/usage/report/route.ts
src/app/api/billing/portal/route.ts
src/app/api/billing/checkout/route.ts
src/app/api/billing/webhook/route.ts
src/app/api/billing/stripe/webhook/route.ts
src/lib/stripe/admin.ts
src/lib/stripe/client.ts
src/lib/stripe/cookie.ts
src/lib/stripe/verify.ts
```

**Predictor health (operations-side surface)**
```
src/app/admin/operations/system-health/page.tsx
src/app/admin/operations/health/page.tsx
src/app/admin/operations/accuracy/page.tsx
src/app/admin/operations/model/page.tsx
src/app/api/admin/operations/                     [3 routes]
src/app/api/system-health/                        [3 routes from .next build trace]
src/lib/control-center/component-status-checker.ts
src/lib/monitoring/platform-monitor.ts
src/lib/monitoring/business-metrics.ts
src/lib/monitoring/platform-signals.ts
```

**Audit trail / chairman alerts**
```
src/app/admin/audit-log/page.tsx
src/app/api/admin/chairman-alerts/route.ts
src/app/api/admin/chairman-alerts/summary/route.ts
src/app/api/chairman-chat/route.ts
src/app/api/chairman/performance/route.ts
src/lib/events/emit.ts                            [platform_events emission boundary]
```

**Tommy's in-house agency**
```
src/app/agency/page.tsx
src/app/agency/AgencyClient.tsx
src/app/agency/AuthGate.tsx
src/app/agency/layout.tsx
src/app/agency/dashboard/page.tsx
src/app/agency/dashboard/DashboardClient.tsx
src/app/agency/dashboard/components/                       (10 component files)
src/app/agency/cards/page.tsx
src/app/agency/cards/CardsManager.tsx
src/app/agency/clients/page.tsx
src/app/agency/clients/ClientsGrid.tsx
src/app/agency/competitive/page.tsx
src/app/agency/content-lab/page.tsx
src/app/agency/content-lab/ContentLabGrid.tsx
src/app/agency/memory/page.tsx
src/app/agency/memory/MemoryClient.tsx
src/app/agency/network/page.tsx
src/app/agency/proposals/page.tsx
src/app/agency/trends/page.tsx
src/app/agency/trends/TrendRadar.tsx
src/app/agency/trend-iq/page.tsx
src/app/agency/what-you-missed/page.tsx
src/app/agency/client-portal/page.tsx
src/app/agency/components/                         (15 component files)
src/app/agency/hooks/useVoiceInput.ts
src/app/api/agency/brief-review/route.ts
src/app/api/agency/memory/route.ts
src/app/api/agency/batch-briefs/route.ts
src/app/api/agency-chat/route.ts                   [most-recently-touched route in repo]
```

**Funnel telemetry (chairman should-ship)**
```
src/app/api/landing/code-validate/route.ts        [code-redemption telemetry entry]
src/app/api/landing/email-notify/route.ts
src/app/api/funnel/waitlist/route.ts
src/lib/clay/component-data-fetcher.ts            [Clay funnel/CRM bridge]
src/lib/clay/action-handler.ts
src/app/api/clay/classify/route.ts
src/app/api/clay/action/route.ts
```

### Chairman items NOT yet implemented (from Tommy's must-ship/should-ship list)

These are listed in the product definition but I could not find clear implementations in the repo:

- **Total platform MRR rollup** — Stripe webhook ingestion exists (`stripe_purchases` table, `billing/stripe/webhook` route), but I found no admin page that aggregates MRR across all agencies and presents a single rolled-up number. There is `src/lib/monitoring/business-metrics.ts` but no obvious "total platform MRR" surface.
- **Per-agency MRR / churn breakdown** — same as above; the data is queryable but I did not find a single admin page that surfaces it per-agency.
- **Cost-per-active-creator** — no surface found.
- **Refunds / disputes / abuse queue** — no dedicated surface found. There is `src/app/admin/error-logs/page.tsx` and `src/app/api/incidents/` but nothing labelled refunds/disputes/abuse.
- **Predictor health one-pager (rolling 7/30/90d accuracy + drift + sample size)** — partial: `system-health/page.tsx` exists and `src/app/api/admin/drift/` has routes, but a single one-pager covering exactly these four numbers in this format was not located.
- **Per-creator outcomes rolled up across all agencies (videos posted, % beating channel average, predictor vs actual)** — partial coverage: prediction_runs + actuals exist, but I did not find a unified rollup surface.

These should be added to Tommy's "build next" list, not removed from anywhere.

---

# 5. Predictor surface (CORE — the moat)

This is the most sensitive surface in the codebase. Misclassification here is the worst possible mistake. Listing exhaustively.

### Canonical entry point (per `CLAUDE.md`)
```
src/lib/prediction/runPredictionPipeline.ts        [single source of truth — actively maintained]
src/lib/orchestration/kai-orchestrator.ts          [component orchestration]
src/lib/orchestration/parallel-execution.ts
src/lib/orchestration/validation-gates.ts
src/lib/prediction/system-registry.ts              [single source of truth for components, packs, tiers, niches]
src/lib/prediction/prediction-config.ts            [component input validation]
src/lib/prediction/prediction-calibrator.ts        [VPS calibration rules 1-5]
src/lib/prediction/concept-scorer.ts               [pre-mortem two-mode prediction]
src/lib/prediction/creator-context.ts              [creator context resolver]
src/lib/prediction/contamination-lock.ts
src/lib/prediction/extract-prediction-features.ts
src/lib/prediction/normalize-component-result.ts
src/lib/prediction/record.ts
src/lib/prediction/run-vps-pipeline-v2.ts
src/lib/prediction/model-router.ts
src/lib/prediction/xgboost-inference.ts
src/lib/prediction/content-strategy-features.ts
src/lib/prediction/vision-hook-features.ts
src/lib/prediction/ffmpeg-segment-features.ts
src/lib/prediction/__tests__/system-integrity.test.ts        [37 integrity tests]
src/lib/prediction/__tests__/calibrator.test.ts              [14 calibrator tests]
src/lib/prediction/__tests__/pack-gating.test.ts             [pack gating tests]
```

### Foundation analyzers (Layer 1)
```
src/lib/services/ffmpeg-canonical-analyzer.ts      [single source of truth for video analysis]
src/lib/services/whisper-service.ts                [Whisper transcription, verbose_json]
src/lib/services/transcription-pipeline.ts
src/lib/services/audio-prosodic-analyzer.ts
src/lib/services/speaking-rate-analyzer.ts
src/lib/services/audio-classifier.ts
src/lib/components/audio-analyzer.ts
src/lib/components/visual-scene-detector.ts
src/lib/components/thumbnail-analyzer.ts
```

### Pack rubric engine (Pack 1, 2, 3, V)
```
src/lib/rubric-engine/                              [15 files — all CORE]
  ├── unified-grading-runner.ts                    (Pack 1)
  ├── unified-grading-types.ts
  ├── unified-grading-schema.ts
  ├── editing-coach-runner.ts                      (Pack 2)
  ├── editing-coach-types.ts
  ├── viral-mechanics-runner.ts                    (Pack 3)
  ├── viral-mechanics-types.ts
  ├── visual-rubric-runner.ts                      (Pack V)
  ├── visual-rubric-types.ts
  ├── gemini-vision-scorer.ts                      (Pack V vision)
  ├── pack-metadata.ts
  ├── index.ts
  └── prompts/
      ├── unified-grading-prompt.ts
      └── editing-coach-prompt.ts
```

### Training pipeline (40 files in `src/lib/training/`)
```
src/lib/training/auto-labeler.ts
src/lib/training/spearman-evaluator.ts
src/lib/training/schedule-backfill.ts
src/lib/training/metric-collector.ts
src/lib/training/metric-attacher.ts
src/lib/training/metric-scheduler.ts
src/lib/training/feature-extractor.ts
src/lib/training/training-features-export-columns.ts
src/lib/training/data-quality-gate.ts
src/lib/training/scraped-video-quality-gate.ts
src/lib/training/training-eligibility.ts
src/lib/training/training-executor.ts
src/lib/training/trainer-engine.ts
src/lib/training/dataset-prep.ts
src/lib/training/dps-v2.ts
src/lib/training/dps-insights.ts
src/lib/training/follower-resolver.ts
src/lib/training/cross-niche-miner.ts
src/lib/training/niche-creator-scraper.ts
src/lib/training/contamination-validator.ts
src/lib/training/designate-holdout.ts
src/lib/training/designate-scraped-holdout.ts
src/lib/training/promote_v15.ts                    [v1.5 model promotion]
src/lib/training/post-promotion-validator.ts
src/lib/training/verify_promotion.ts
src/lib/training/run-s6-retrain.ts                 [v6 retrain script]
src/lib/training/run_export_training_data.ts
src/lib/training/scrape-label.ts
src/lib/training/tiktok-metric-fetcher.ts
src/lib/training/fresh-video-scanner.ts
src/lib/training/feature-availability-matrix.ts
src/lib/training/backfill_fixed_features.ts
src/lib/training/export-scraped-training-data.ts
src/lib/training/training-ingest-types.ts
src/lib/training/model-evaluator.ts
src/lib/training/check_scraped_cols.ts             [DEV utility — flag for review]
src/lib/training/test_dead_features.ts             [DEV utility — flag for review]
src/lib/training/test_audio_classifier.ts          [DEV utility — flag for review]
src/lib/training/smoke_test_v15.ts                 [DEV utility — flag for review]
src/lib/training/smoke_vector_diff.ts              [DEV utility — flag for review]
src/lib/training/autoresearch/                     [bridge to autoresearch sandbox]
```

### Prediction API entry points
```
src/app/api/predict/route.ts                       [standard prediction]
src/app/api/predict/pre-content/route.ts           [pre-content analysis]
src/app/api/predict/v2/route.ts
src/app/api/predict/viral/route.ts
src/app/api/predict/log/route.ts
src/app/api/predict/legacy/route.ts                [name suggests legacy — flag]
src/app/api/admin/predict/route.ts                 [admin mode]
src/app/api/admin/super-admin/quick-predict/route.ts
src/app/api/bulk-download/predict/route.ts
src/app/api/kai/predict/route.ts                   [primary upload-test endpoint]
src/app/api/kai/ab-test/route.ts
src/app/api/kai/ab-test/[testId]/route.ts
src/app/api/kai/drift/route.ts
src/app/api/creator/predict/route.ts               [creator-facing with context]
src/app/api/creator/concept-score/route.ts
src/app/api/creator/concept-score/expand/route.ts
src/app/api/quick-win/analyze/route.ts
src/app/api/quick-win/brief/route.ts
src/app/api/viral-prediction/dashboard/route.ts
src/app/api/viral-prediction/batch-process/route.ts
src/app/api/admin/viral-prediction/                [5 routes]
```

### Predictor admin/operator surfaces (CORE per Tommy's must-ship list)
```
src/app/admin/operations/system-health/page.tsx
src/app/admin/operations/training/page.tsx
src/app/admin/operations/training/readiness/page.tsx
src/app/admin/operations/training/jobs/page.tsx
src/app/admin/operations/training/models/page.tsx
src/app/admin/operations/training/history/page.tsx
src/app/admin/operations/training/viral-scrape/page.tsx
src/app/admin/operations/training/data/page.tsx
src/app/admin/operations/training/base/page.tsx
src/app/admin/operations/accuracy/page.tsx
src/app/admin/operations/model/page.tsx
src/app/admin/operations/data-explorer/page.tsx
src/app/admin/upload-test/page.tsx                 [PRIMARY workflow per CLAUDE.md]
src/app/admin/calibration/page.tsx
src/app/admin/testing-accuracy/page.tsx
src/app/admin/baselines/page.tsx
src/app/admin/drift/page.tsx
src/app/api/operations/training/label/route.ts
src/app/api/training/                              [17 routes]
src/app/api/training/pipeline-status/route.ts
src/app/api/cron/training-pipeline/route.ts
```

### Predictor data dependencies (CORE)
```
models/                                             [trained ML model artifacts — see top-level dir entry]
autoresearch/                                       [offline weight optimization sandbox]
results-autoresearch/                               [optimization run outputs]
```

### Predictor support that lives inside `src/lib/services/` (mixed)
```
src/lib/services/viral-prediction/                  [25 files — see UNKNOWN list, parts may be legacy]
src/lib/services/feature-extraction/                [8 files — DISABLED per CLAUDE.md, CORE-adjacent]
src/lib/services/pre-content/                       [6 files]
src/lib/services/training/                          [11 files]
src/lib/services/virality-indicator/                [2 files]
src/lib/services/pattern-extraction/                [12 files]
src/lib/services/accuracy-enhancement/              [7 files]
```

### Database tables (predictor)
```
prediction_runs              (20260115_transcription_status_tracking.sql)
run_component_results        (same)
prediction_outcomes          (20251119_1_learning_loop_system.sql)
component_reliability        (same)
artifact_cache               (per CLAUDE.md — could not locate the exact migration file in this audit, flag)
training_feature_cache       (20260414_training_feature_cache.sql)
training_prep_runs           (20260414_training_prep.sql)
feature_scaling_params       (same)
training_eligible            (20260414_training_eligible.sql)
contamination_audit_log      (20260212_training_pipeline_v2.sql)
feature_availability_matrix  (same)
model_performance_segments   (same)
discovery_scan_config        (20260305_training_pipeline_v3.sql)
discovery_scan_runs          (same)
cohort_medians               (20260302_dps_percentile_columns.sql)
viral_genomes                (20251130_viral_genomes_v2.sql)
calibration_profiles         (multiple migrations)
```

### Notes
- The XGBoost v6 model is **disabled** per `CLAUDE.md` (Layer 5 audit). The artifacts in `models/` and the inference code in `src/lib/prediction/xgboost-inference.ts` must be preserved for any v7 retrain — do not remove.
- `src/lib/services/viral-prediction/` is a mixed bag: it contains both the live Apify scraper integration (`apify-scraper.ts`, used by 5+ files) AND legacy "engine" files like `unified-prediction-engine.ts`, `main-prediction-engine.ts`, `framework-evolution-system.ts`, `god-mode-psychological-analyzer.ts`, `inception-mode.ts`. Per `CLAUDE.md`, the canonical pipeline is `runPredictionPipeline.ts` and these legacy engines are not on the critical path. Listed in UNKNOWN section for chairman review.

---

# 6. Pivot clusters

### Firebase pivot (the pre-Supabase auth/database era)

**Status: Code physically present, dependency NOT installed.** Both `firebase` and `firebase-admin` are absent from `package.json` and `node_modules/`. This means the code that imports `firebase/firestore`, `firebase/auth`, etc. would crash at runtime if invoked. Many of these routes were given `force-dynamic` in Phase 1.6 to skip build-time evaluation, but they would still fail when called.

**`src/lib/firebase/` — stubbed shim files**
```
src/lib/firebase/firebase.ts        [explicitly says "MIGRATED TO SUPABASE - This file now exports null objects to prevent import errors"]
src/lib/firebase/firebaseAdmin.ts
src/lib/firebase/auth-helpers.ts
src/lib/firebase/client.js
src/lib/firebase/types.ts
src/lib/firebase/__tests__/firebase.test.ts
src/__tests__/lib/firebase.test.ts
src/lib/utils/firebase-init.js
src/lib/utils/__tests__/firebase-init.test.js
src/lib/utils/__tests__/firebase-to-supabase-migration.test.js
src/scripts/verifyFirebaseData.js
```

**Routes that still `import 'firebase/firestore'` directly (would fail at runtime)**
```
src/app/api/sounds/trending/route.ts
src/app/api/sounds/categories/route.ts
src/app/api/templates/analytics/route.ts
src/app/api/newsletter/generate-link/route.ts
```

**Files importing the Firebase shim (`@/lib/firebase`) — most are in service code that may or may not be called**
```
src/app/api/templates/expert-insights/route.ts
src/app/api/experts/performance/route.ts
src/app/api/templates/variations/route.ts
src/app/api/template-expert/route.ts
src/app/api/newsletter/generate-template-link/route.ts
src/app/api/analytics/track-template-usage/route.ts
src/app/api/remix/track-performance/route.ts
src/app/nl/[shortCode]/route.ts
src/app/debug/page.tsx
src/components/FeatureDebug.tsx
src/components/layout/Header.tsx
src/components/notifications/ExpertNotificationDashboard.tsx
src/lib/services/etlJobService.ts
src/lib/services/soundAnalysisService.ts
src/lib/services/templateService.ts
src/lib/services/templateStorageService.ts
src/lib/services/trendingTemplateService.ts
src/lib/services/templateVariationService.ts
src/lib/services/systemSettingsService.ts
src/lib/services/expertInsightService.ts
src/lib/services/newsletterSoundService.ts
src/lib/services/trendPredictionService.ts
src/lib/services/soundLibraryService.ts
src/lib/services/expertPerformanceService.ts
src/lib/services/etlErrorHandlingService.ts
src/lib/analytics/expertAnalyticsPipeline.ts
src/lib/analytics/newsletterAnalytics.ts
src/lib/auth.ts
src/lib/types/user.ts
src/lib/types/expert.ts
src/lib/types/sound.ts
src/lib/utils/etlLogger.ts
src/lib/utils/adminAuth.ts
src/lib/utils/subscriptionUtils.ts
src/lib/utils/test-data.ts
src/lib/utils/migration.js
src/lib/utils/data-migration.js
src/lib/contexts/FeatureContext.tsx
src/lib/hooks/useAuditLog.ts
src/lib/test/etl-error-handling-test.ts
src/lib/test/etl-integration-test.ts
src/scripts/createTestSoundData.ts
```

**Firebase config artifacts at repo root**
```
firestore.indexes.json
firestore.rules
```

**Verdict:** The entire Firebase cluster is EXPERIMENTAL (effectively dead). The shim makes most files compile, but the surface they implement (sounds library, templates analytics, expert insights, ETL job logging via Firebase, audit log) belongs to a feature set that the current product doesn't ship.

### BMAD pivot

BMAD = a third-party AI-agent framework methodology. Files:

```
.bmad-core/                                           [88 files — full BMAD installation]
.bmad-core/agents/bmad-master.md
.bmad-core/agents/bmad-orchestrator.md
.bmad-core/utils/bmad-doc-template.md
.bmad-core/data/                                      [some recent activity]
.cursor/rules/bmad-master.mdc
.cursor/rules/bmad-orchestrator.mdc
.windsurf/rules/bmad-master.md
.windsurf/rules/bmad-orchestrator.md
docs/bmad/                                            [9 files — planning docs in BMAD format]
docs/bmad/CAP-310.md
docs/bmad/CAP-320.md
docs/bmad/CAP-330.md
docs/bmad/CAP-340.md
docs/bmad/CAP-350.md
docs/bmad/ALG-101.md
docs/bmad/a-plus-plus-scorecard.md
docs/bmad/rollout-runbook.md
docs/bmad/traceability-matrix.csv
docs/bmad-implementation-summary.md
docs/BMAD-Database-Change-Protocol.md
.claude/commands/BMad/                                [21 files — Claude Code BMAD command templates]
```

**Verdict:** EXPERIMENTAL. BMAD is a workflow methodology adopted at one point and not removed. None of these files are imported by the running application. Affects `node_modules` indirectly (BMAD didn't add npm deps), so removal is purely a tidiness exercise — but it's a lot of files.

### Autoresearch

**Status: ACTIVE.** This is the offline weight-optimization sandbox for the predictor. See full top-level entries above for `autoresearch/` and `results-autoresearch/`. Cross-references:

```
autoresearch/                                         [24 files — sandbox]
autoresearch/sandbox/optimize-weights.ts
autoresearch/sandbox/eval-spearman.ts
autoresearch/sandbox/replay-aggregation.ts
autoresearch/sandbox/loader.ts
autoresearch/sandbox/baseline-check.ts
autoresearch/sandbox/types.ts
autoresearch/configs/best.json
autoresearch/configs/baseline.json
autoresearch/results/                                 [optimization output]
autoresearch/notes/feasibility-audit.md
autoresearch/export-snapshot.ts
src/lib/training/autoresearch/                        [9 files — bridge into the in-app training pipeline]
src/lib/training/autoresearch/autoresearch_run.py
src/lib/training/autoresearch/bootstrap_validation.py
src/lib/training/autoresearch/leaderboard.py
src/lib/training/autoresearch/leaderboard_full.py
src/lib/training/autoresearch/check_experiments.ts
src/lib/training/autoresearch/list_all_sandbox.ts
src/lib/training/autoresearch/clear_stuck_lock.ts
src/lib/training/autoresearch/bridge_results_to_db.ts
src/lib/training/autoresearch/_derived_smoke.py
results-autoresearch/                                 [155 files — run output dirs auto-014 through auto-044, plus v16-control/v16-candidate]
```

**Verdict:** SUPPORTING. Tunes the predictor (CORE), so it serves the moat, but is not itself the production surface.

### Coexisting auth systems

`package.json` includes:

| Package | Installed in `node_modules`? | Files importing it | Bucket |
| --- | --- | --- | --- |
| `@supabase/auth-helpers-nextjs`, `@supabase/ssr`, `@supabase/supabase-js` | YES | 380+ files | **CORE** (active primary auth) |
| `next-auth` | YES | 16 files | Mixed: powers admin auth (`src/app/api/auth/[...nextauth]/route.ts`, `src/lib/auth/admin-auth-options.ts`), AI Brain admin routes, ML suggestions, template predictions notifications. **Active.** |
| `@clerk/nextjs` | YES | **0 files** | EXPERIMENTAL — installed but unused. Pure dependency bloat. |
| `firebase` / `firebase-admin` | NO | The 50+ files listed above still try to import them | Dead cluster (see Firebase section) |

**Auth-adjacent code locations**
```
src/lib/supabase/                         [6 files — primary]
src/lib/auth/                             [8 files: server-auth.ts, admin-auth-options.ts, supabase-auth.ts, agency-utils.ts, api-guard.ts, permissions.ts, plus provider-switcher.js + auth-service.js — unclear whether the .js files are dead Firebase-era residue]
src/contexts/AuthContext.tsx              [global auth context]
src/lib/contexts/AuthContext.tsx          (per CLAUDE.md — this path may exist; confirmed in CLAUDE.md ref)
src/lib/firebase/auth-helpers.ts          [stubbed Firebase shim]
src/middleware.ts                         [Next.js middleware — ACTIVE]
src/_middleware.off.ts                    [explicitly disabled middleware — flag for cleanup]
```

**Verdict on auth:** **Three live systems, one dead, one installed-but-unused.**
- **CORE:** Supabase Auth (consumer/main flow) + NextAuth (admin flow)
- **EXPERIMENTAL:** Firebase shim + the 50+ legacy callsites
- **EXPERIMENTAL (dependency bloat):** `@clerk/nextjs`

Recommend Tommy delete `@clerk/nextjs` from `package.json` and confirm he's never used Clerk.

---

# 7. UI surfaces inside `src/app/` — sub-classification

This zooms into the largest single CORE directory.

### `src/app/(public)/` — public-facing pages
- **Bucket:** CORE (funnel + brand surface)
- **Notes:** All listed in Funnel Surface above. The currently-modified `FreedomOSTool.tsx` and the deleted `recover/` route both indicate active work.

### `src/app/(auth)/` — auth flows
- **Bucket:** CORE
- 3 pages: `login/`, `signup/`, `onboarding/`. Standard surface.

### `src/app/(dashboard)/` — consumer dashboard (the platform's user side)
- **Bucket:** Mixed: CORE shell + EXPERIMENTAL contents
- **Notes:** 23 pages. Key ones (`page.tsx`, `analytics/page.tsx`) are CORE platform delivery surface. But many look like leftover earlier feature pages: `template-editor/`, `variations/`, `template-library/`, `template-library/[slug]/`, `remix/[templateId]/`, `remix-guide/`, `dashboard-templates/`, `sounds/`, `sounds/browser/`, `video-analyzer/`, `trend-predictions-dashboard/`, `trend-predictions-dashboard/expert/`, `trend-predictions-dashboard/expert-simple/`, `trend-predictions-dashboard/advanced/`, `notifications/`, `analytics/newsletter/`, `test-notifications/`, `debug/subscription/`, `debug/remix-test/`, `dev-bypass/`, `user-guide/`. These are the remnants of an earlier "TikTok template marketplace" product.
- **Recommendation:** Many of these consumer-dashboard pages are likely EXPERIMENTAL relative to the current product definition (which centers the consumer experience on the agency-served creator workflow, not direct template browsing). Worth a chairman review.

### `src/app/admin/` — chairman + operator interface
- **Bucket:** Mixed: CORE chairman pages + many EXPERIMENTAL algorithm-design pages

**CORE-confirmed admin pages:**
```
admin/page.tsx
admin/login/page.tsx
admin/dashboard/page.tsx
admin/chairman/page.tsx
admin/operations/                                   [16 pages — all CORE per chairman must-ship/should-ship]
admin/organization/                                 [5 pages — multi-tenant agency view]
admin/audit-log/page.tsx
admin/upload-test/page.tsx                          [primary predictor workflow per CLAUDE.md]
admin/canvas/                                       [Tommy's canvas/strategy surface]
admin/testing-accuracy/page.tsx
admin/calibration/page.tsx
admin/baselines/page.tsx
admin/drift/page.tsx
admin/users/page.tsx
admin/limited-users/page.tsx
admin/error-logs/page.tsx
admin/security/page.tsx
admin/system/page.tsx
admin/system-settings/page.tsx
admin/keys/page.tsx
admin/api/page.tsx
admin/integrations/                                 [api/, webhooks/]
admin/feature-flags/page.tsx
admin/flags/page.tsx
admin/etl-dashboard/page.tsx
admin/etl-status/page.tsx
admin/diagnostics/page.tsx
admin/monitoring/page.tsx
admin/cultural-events/page.tsx
admin/scraping/page.tsx
admin/data-ingestion/page.tsx
admin/feedback-ingest/page.tsx
admin/research-review/page.tsx
admin/ai-brain/page.tsx                             [AI brain admin view — likely CORE for chairman LLM oversight]
```

**EXPERIMENTAL admin pages (algorithm-design pivot residue):**
```
admin/dna-detective/page.tsx                        [earlier pivot's "DNA detective" — speculative algorithm tool]
admin/gene-tagger/page.tsx                          [same family — "gene tagging"]
admin/framework-reservoir/page.tsx                  [framework experiments]
admin/master-orchestrator/page.tsx                  [speculative orchestrator UI]
admin/inception-studio/page.tsx                     [the "Inception Mode" pivot]
admin/marketing-inception/page.tsx                  [same family]
admin/marketing-studio/page.tsx
admin/cross-intel/page.tsx
admin/algorithm-iq/page.tsx
admin/llm-console/page.tsx
admin/feature-decomposer/page.tsx
admin/coach/page.tsx                                [overlap with the rubric engine Pack 2 "editing coach"]
admin/draft-analyzer/page.tsx, admin/drafts-analyzer/page.tsx   [duplicate names — likely one is dead]
admin/template-analyzer/page.tsx, admin/template-analyzer/template/[id]/page.tsx
admin/template-leaderboard/page.tsx
admin/template-generator/page.tsx
admin/value-template-editor/page.tsx
admin/viral-recipe-book/page.tsx
admin/recipe-book/page.tsx, admin/recipe-book-api/page.tsx
admin/recipes/leaderboard/page.tsx
admin/algorithm/...                                 [admin/alignment, admin/analysis, admin/baselines]
admin/component-test/page.tsx
admin/compare-runs/page.tsx
admin/process-intel/page.tsx
admin/checklist/page.tsx
admin/orchestrator/page.tsx
admin/super-admin-live/page.tsx
admin/system-map/page.tsx
admin/scale/page.tsx
admin/marketplace/creator/page.tsx
admin/bloomberg/marketplace/page.tsx, admin/bloomberg/page.tsx
admin/ecom/page.tsx, admin/ecom/[productId]/page.tsx
admin/federated/page.tsx
admin/flipboard/page.tsx
admin/guardrails/page.tsx
admin/hub/page.tsx
admin/insights/page.tsx
admin/integration/page.tsx
admin/learning/page.tsx
admin/mission-control/page.tsx
admin/mvp/page.tsx, admin/mvp/settings/page.tsx, admin/mvp/templates/page.tsx
admin/newsletter/page.tsx
admin/planning/[id]/page.tsx
admin/rewards/                                      [7 pages — "rewards" / affiliates / app-campaigns / payouts. Defer-list per chairman EXPERIMENTAL items unless Tommy confirms it's live]
admin/scraping/page.tsx, admin/apify-scraper/page.tsx
admin/settings/page.tsx, admin/settings/analyzer/page.tsx
admin/studio/page.tsx, admin/studio/script/page.tsx
admin/success-tracking/page.tsx
admin/viral-approval-queue/page.tsx
admin/viral-filter/page.tsx
admin/viral-studio/page.tsx
admin/workflow-dashboard/page.tsx
admin/workflows/creator/page.tsx, admin/workflows/quick-win/page.tsx
admin/agent/page.tsx, admin/advisor-service/page.tsx, admin/adaptation/page.tsx
admin/analytics/page.tsx, admin/analytics/labels/page.tsx, admin/analytics/windows/page.tsx
admin/brief-review/page.tsx
admin/bulk-download/page.tsx
admin/command-center/page.tsx
admin/control-center/page.tsx
admin/creators/page.tsx, admin/creators/[username]/page.tsx
admin/experiments/page.tsx
admin/gold-set/page.tsx
admin/model-evaluation/page.tsx
admin/moat/page.tsx
```

**Verdict:** Roughly **60-70 admin pages are likely EXPERIMENTAL** (left over from algorithm-design pivots), and **~30 admin pages are CORE** (chairman-must-ship surfaces + predictor operator pages). This is the largest cleanup opportunity in the repo, but it requires page-by-page review — many of these EXPERIMENTAL pages may have been used recently by Tommy for one-off analysis and might still hold useful state.

### `src/app/agency/` — Tommy's in-house agency
- **Bucket:** CORE (per chairman must-ship: "Tommy's own in-house agency, accessible from the chairman console without re-login")
- All 47 files listed in Chairman Surface above.

### `src/app/sandbox/` — labs, mockups, design tests
- **Bucket:** EXPERIMENTAL
- 55 files. Includes `viral-studio/`, `viral-lab-v2/`, `workflow/` (lab/schedule/onboarding/dashboard variants), `chairman-design-test/`. Per the directory name and contents, these are clearly experimental UI mockups and prototypes.
- **Recommendation:** Strongest delete-candidate among the UI surfaces, with one exception: `chairman-design-test/page.tsx` may contain UI prototypes Tommy wants to harvest into the real chairman page.

### `src/pages._disabled/` — explicitly disabled pages
- **Bucket:** EXPERIMENTAL (the underscore prefix means Next.js ignores it)
- 23 files. All explicitly switched off.

### `src/middleware.ts`
- **Bucket:** SUPPORTING (Next.js convention)

### `src/_middleware.off.ts`
- **Bucket:** EXPERIMENTAL — naming convention says "off" — explicitly disabled.

---

# 8. Cross-check: stale CORE and active EXPERIMENTAL

### CORE directories with high DORMANT proportion
Reminder: on this branch, "DORMANT" means "untouched since the initial bulk commit on 2026-03-30." Most of `src/` falls into this category because the bulk import set the same date on everything.

- **`src/lib/services/viral-prediction/`** — 25 files, mostly untouched. Cited as CORE-adjacent (predictor support) but several files (`unified-prediction-engine.ts`, `main-prediction-engine.ts`, `framework-evolution-system.ts`, `god-mode-psychological-analyzer.ts`, `inception-mode.ts`, `comprehensive-framework-library.ts`) appear to be legacy "engine" implementations from before the canonical `runPredictionPipeline.ts` consolidation. Worth review — not all 25 may be load-bearing.
- **`src/lib/training/`** — 40 files, several are dev/smoke utilities (`smoke_test_v15.ts`, `smoke_vector_diff.ts`, `test_dead_features.ts`, `check_scraped_cols.ts`, `test_audio_classifier.ts`). These are likely safe to remove but verify no script in `scripts/` calls them.
- **`src/app/admin/operations/`** — most pages stable; `system-health/page.tsx` is the chairman-must-ship target and is DORMANT — has it been built out yet, or was it built earlier and is just not being touched? Worth Tommy's eyes on whether it surfaces the four numbers (rolling 7/30/90d accuracy + drift + sample size).

### EXPERIMENTAL directories with recent activity
- **`autoresearch/` + `results-autoresearch/`** — heavy recent activity. Reclassified as SUPPORTING above (it tunes the predictor moat).
- **`.bmad-core/data/`** — 4 file-touches in the last 2 weeks despite the rest of `.bmad-core/` being dormant. Worth a quick look — maybe one of the planning docs in `data/` was being updated.
- **`src/app/sandbox/`** — touched recently (`chairman-design-test/page.tsx` is in last-2-weeks log via the force-dynamic sweep). The activity is the build-fix sweep, not real feature work, so safe to keep classified EXPERIMENTAL.

---

# 9. UNKNOWN reconciliation

For each UNKNOWN, what specifically I couldn't determine, and what evidence would resolve it.

| Item | Why UNKNOWN | What would resolve |
| --- | --- | --- |
| `apify/` | Could be live deployed Apify actors or could be one-off prototypes that never deployed. | Tommy confirms whether `comment-sampler.js`, `entity-trackers.js`, `hot-feed-scanner.js`, `video-detail-enricher.js`, `author-backfill.js` are live in his Apify account. |
| `config/` | 3 small JSON files; unclear which (if any) are loaded at runtime. | grep for runtime imports of `niche-keywords.json`, `objectives.matrix.json`, `objectives.ops.json`. |
| `database/` | Standalone SQL dir parallel to `supabase/migrations/`. Why two locations? | Read each file in `database/`, check for any imports/references. Likely overlap or older state. |
| `docker/` + `infrastructure/` + `k8s/` | Docker Compose, monitoring stack, K8s manifests — but the deploy target is Vercel. | Tommy: "Have you ever spun up monitoring or K8s for Trendzo?" If no → EXPERIMENTAL. |
| `extensions/` (capcut, descript, premiere, telemetry-extension) | Browser/desktop extensions not bundled into Next.js. | Tommy: "Are these published or installed anywhere?" If no → EXPERIMENTAL. |
| `fixtures/` (113 files) | Test fixtures, but unclear which test suites consume them. | grep for imports of `fixtures/` paths in test files. |
| `integrations/` (make, sheets, zapier) | Could be live Zap/Make/Sheets glue or aspirational scaffolding. | Tommy: "Is anything on Zapier/Make connected to a Trendzo endpoint that depends on a file here?" |
| `ip-components/` | Single planning doc in dir labeled "ip-components". | Probably misplaced — read once and either delete dir or move file to `docs/`. |
| `model-backups/` | Backup model artifacts; unclear if any are the only copy of a load-bearing artifact. | Cross-reference filenames against what `models/` and the predictor reference. |
| `openapi/` (`public_v1.json`, `public_v2.json`) | OpenAPI spec files; no obvious served route. | grep for `/openapi`, `swagger`, `redoc`, or static route serving these files. |
| `packages/` | Has data-shape artifacts (template-kernel schema, feature-store schema). May be unfinished monorepo skeleton. | Check whether anything imports from `@trendzo/...` packages or reads `packages/*.json`. |
| `paths/` (5 small JSONs) | Tiny config files; unclear runtime use. | grep for imports of `paths/calibration.json` etc. |
| `plugins/` (3 files) | Category unclear without inspection. | Read the 3 files. |
| `python-services/` | Python services not deployable on Vercel. | Tommy: "Do these run anywhere?" |
| `sdk/` (3 files) | SDK skeleton; client code? | Read the 3 files. |
| `schemas/` (3 files) | May overlap with `src/contracts/` or `packages/`. | Compare contents with `src/contracts/` and `packages/`. |
| `storage/` (9 files) | Could be Supabase Storage helpers or unrelated. | Read top-level of `storage/`. |
| `tasks/` (27 files) | Likely planning docs. | Read a sample. |
| `tests/` (11 files) | Top-level `tests/` separate from `src/__tests__/` and `playwright/` and `e2e/`. Why four test homes? | Read top-level; reconcile against test runner config in `jest.config.js`, `playwright.config.ts`. |
| `work-streams/`, `workers/`, `security/`, `dist/`, `tmp/`, `pipeline-progress/`, `dashboard-fix/`, `legal/`, `research-reports/`, `ADR/` | All single-file or near-empty directories. | Read each — most are likely artifacts to be deleted. |
| `src/lib/services/viral-prediction/` (the legacy "engines" subset) | Listed as Predictor surface but several files inside (`unified-prediction-engine.ts`, `main-prediction-engine.ts`, `framework-evolution-system.ts`, `god-mode-psychological-analyzer.ts`, `inception-mode.ts`) appear to be pre-canonical-pipeline implementations. | grep for imports of each file from the runtime path; if no production code imports it, demote to EXPERIMENTAL. |
| `src/app/(dashboard)/` consumer-side pages | Many appear to be remnants of an earlier "TikTok template marketplace" product surface that doesn't fit the current product definition cleanly. | Tommy decides which consumer-dashboard surfaces survive into the current product. |

---

# 10. Method notes / things that surprised me

### Method limitations
- **The 8-month date split is meaningless on this branch.** All 52 commits span just five weeks. I substituted an "ACTIVE in last 2 weeks vs DORMANT (initial bulk commit only)" lens. This is a workaround, not a perfect substitute — files that were updated in another branch and merged in via the bulk commit appear DORMANT but may be load-bearing.
- **`force-dynamic` sweep distorts the activity signal.** Phase 1.6 added a one-line `export const dynamic = 'force-dynamic'` to ~640 API routes in a single commit. This shows up as 640 file-touches in the last 2 weeks but isn't real feature work. I tried to discount this when judging "active" vs "stable."
- **The repo on disk is much older than the branch's git history shows.** File contents and naming patterns reflect roughly a year of accumulated work across multiple pivots. Git treats almost everything as "from 2026-03-30" because that was the bulk import commit.

### Surprises worth Tommy's attention

1. **Three coexisting auth systems in `package.json`** (Supabase + NextAuth + Clerk) plus a fourth (Firebase) physically present in source code with the npm package missing. `@clerk/nextjs` has zero imports — pure dependency bloat.

2. **The Firebase shim is more dangerous than it looks.** `src/lib/firebase/firebase.ts` returns null objects to keep imports compiling, but four routes (`sounds/trending`, `sounds/categories`, `templates/analytics`, `newsletter/generate-link`) import `firebase/firestore` directly. Those routes would crash on first call. They have `force-dynamic` so the build doesn't catch them, but a user request would.

3. **`src/lib/services/viral-prediction/` has multiple "engine" files** with names like `unified-prediction-engine.ts`, `main-prediction-engine.ts`, `god-mode-psychological-analyzer.ts`, `inception-mode.ts`, `framework-evolution-system.ts`. Per `CLAUDE.md` the canonical entry point is `runPredictionPipeline.ts`. The relationship between these legacy engines and the current pipeline needs clarification.

4. **`tiktok_transcriber/` is 4,013 files** (37% of the repo's file count), almost entirely vendored Python deps. The deployed Next.js app does its own Whisper transcription via `src/lib/services/whisper-service.ts` and doesn't use this. Strong delete-candidate after confirming no script shells out to it.

5. **`scripts/` has 443 files**, dominated by one-off migration apply scripts and ad-hoc analyses. Each needs file-by-file triage. Some are likely cron entry points or `package.json scripts` targets — those must be preserved.

6. **The chairman page already exists but is heavy.** `src/app/admin/chairman/page.tsx` is 1,929 lines in a single file, includes the full Layer-Build/Performance/Loops/Decisions/Map UI Tommy wants. It is wired to `getSupabaseClient` and uses `@ai-sdk/react` for the chat. Status: working but unrefactored.

7. **The root of the repo has 200+ stray files** — mostly markdown reports from past investigations, screenshots, batch outputs, log dumps, ad-hoc test scripts (`test-tiktok-fix.js`, `test-rls.js`, `test-prediction.js`, etc.), and a few accidentally-committed shell artifacts (`tatus`, `tatus -v`, `et GIT_PAGER=cat`, `e HEAD`, `t -n 1 v0.7.0-moat2` — these look like commands that were `> filename` instead of `| less` and got saved as files). The prompt told me to ignore `PHASE1_*.md`, `JSON_RENDER_*.md`, `BUILD_TIMEOUT_*.md`, `FORCE_DYNAMIC_TARGET_LIST_*`, `vercel_phase1*_log.txt` — those are session artifacts. But the rest of the root clutter (`AI_EMPLOYEE_*.md`, `FEAT-*.md`, `PATENT_*.md`, `INNOVATION_*.md`, `LICENSING_*.md`, all the `.html` mockups, etc.) is similar in nature. Worth a separate "clean the repo root" pass.

8. **No `Discrepancies` section needed.** I did not find any major feature in the codebase that contradicted the product definition. Everything I found either fit one of the three halves or could be classified as EXPERIMENTAL/UNKNOWN. The product definition holds.

### What I did NOT do
- I did not delete or modify any file other than this output.
- I did not run `npm install`, `next build`, `npx tsc`, or any test.
- I did not stage or commit anything.
- I did not modify the working tree's existing uncommitted WIP.
- I did not classify anything in `node_modules/`, `.next/`, `.git/`, `.vercel/`, IDE config dirs, or the prior session-artifact files (`PHASE1_*.md`, etc.).

---

**End of inventory. Pre-flight verified at start; final `git status` check follows in chairman-side report.**
