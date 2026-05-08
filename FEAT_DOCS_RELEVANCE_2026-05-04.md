# FEAT-XXX Doc Relevance Diagnostic — 2026-05-04

**Branch:** `vercel-deploy-test`
**Repo root:** `C:\Projects\CleanCopy`
**Mode:** Read-only. No file changes were made during this diagnostic.

Methodology:
- Read first 50 lines of each FEAT-XXX doc and extracted: feature ID, stated purpose, file paths, function names, table names, and API routes.
- For each path in the doc, ran a `Test-Path` existence check.
- Grepped `FEAT-002`/`FEAT-003`/`FEAT-007`/`FEAT-060`/`FEAT-070` literally across `src/`, `scripts/`, `tests/`, `supabase/`, `config/`. The "Refs in src/" column counts files (not occurrences) under `src/` that mention the FEAT number.
- Verdict scale: **LIVELY** / **PARTIAL** / **ORPHANED** / **UNCLEAR**. Verdicts are recommendations only.

**Critical contextual finding (applies to all FEATs below):**
- All five FEAT-XXX migration files (`20251002_feat002_dps_calculation_engine.sql`, `20251002_feat002_enhancements.sql`, `20251003_feat003_pattern_extraction.sql`, `20251003_feat007_pre_content_predictions.sql`, `20251008_feat060_extracted_knowledge.sql`, `20251015_feat070_predictions_table.sql`) **exist in `supabase/migrations_archive/`** but **NOT** in `supabase/migrations/`. They have been archived (which is normal post-application housekeeping — once a migration has run in prod, moving it to archive is common practice). When this report says a migration is "MISSING from active migrations dir," it means exactly that: it's in the archive, not removed from the repo. The DB tables it created may still very well exist in Supabase.

---

## Verdict table (sorted ORPHANED → PARTIAL → UNCLEAR → LIVELY)

| Filename | FEAT # | Stated purpose (1 line) | Refs in src/ | Files mentioned (exists/total) | Verdict | Evidence summary |
|----------|--------|--------------------------|-------------:|-------------------------------:|---------|------------------|
| FEAT-002-DEPLOYMENT-CHECKLIST.md | FEAT-002 | DPS Calculation Engine — deployment checklist tracking schema migration, services, event emitter, API endpoints | 3 | 0 / 7 | ORPHANED | Migration is archived (`migrations_archive/20251002_feat002_dps_calculation_engine.sql`). Entire `src/lib/services/dps/` directory MISSING. None of the 6 listed service files exist (`dps-calculation-engine.ts`, `dps-database-service.ts`, `dps-calculation-service.ts`, `dps-event-emitter.ts`, `blockchain-timestamp.ts`). API path `/api/dps/calculate/route.ts` MISSING (no `src/app/api/dps/` dir). The 3 stray `FEAT-002` mentions in src/ are in: a `.backup-20251024` file, a comment in `unified-viral-pipeline.ts`, and an unrelated `dps-research-discovery-matrix.ts`. |
| FEAT-002-ENHANCEMENTS-QUICKSTART.md | FEAT-002 | DPS enhancements — blockchain timestamp, identity container scoring, prediction mode flag | 3 | 0 / 2 | ORPHANED | `src/lib/services/dps/blockchain-timestamp.ts` MISSING. `dps-calculation-engine.ts` MISSING. `calculateIdentityContainerScore()` not found in src/. Function `calculateSingleDPS()` referenced in the doc not present. Same archived-migration / missing-directory pattern as FEAT-002-DEPLOYMENT-CHECKLIST. |
| FEAT-002-ENHANCEMENTS.md | FEAT-002 | Same enhancements doc, longer form | 3 | 0 / 2 | ORPHANED | Same evidence as above. `blockchain-timestamp.ts` MISSING. `timestampPrediction()`, `verifyTimestamp()`, `batchTimestampPredictions()`, `createCalculationHash()` — none found in src/. |
| FEAT-002-IMPLEMENTATION-SUMMARY.md | FEAT-002 | DPS calc engine — full file list and module breakdown | 3 | 0 / 2 | ORPHANED | Migration in archive. `src/lib/services/dps/dps-calculation-engine.ts` MISSING. Specific functions (`calculateDPS`, `calculateZScore`, `calculateDecayFactor`, `calculateMasterViralScore`, `zScoreToPercentile`, `classifyVirality`) not found at the documented module path. Substitute logic exists in `src/lib/services/predictVirality.ts`, `src/lib/services/predictViralityScore.ts`, `src/lib/services/viral-prediction/unified-prediction-engine.ts` — under different names and structure. |
| FEAT-003-DEPLOYMENT-CHECKLIST.md | FEAT-003 | Pattern Extraction System — deployment checklist (migration, RLS, helper functions) | 8 | 0 / 1 | PARTIAL | Migration archived (`migrations_archive/20251003_feat003_pattern_extraction.sql`). Tables `viral_patterns`, `pattern_video_associations`, `pattern_extraction_jobs`, `pattern_extraction_errors` referenced across **22 files** in src/ — clearly alive in code. Helper functions `get_top_patterns_by_niche()`, `find_similar_patterns()` not grep-confirmed in src/ at quick glance. Doc's specific deployment paths reference Supabase CLI & migration file locations that have moved to archive. |
| FEAT-003-IMPLEMENTATION-SUMMARY.md | FEAT-003 | Pattern Extraction System — architecture overview, API + Service + Engine + DB layers | 8 | 1 / 2 | PARTIAL | API endpoint `POST /api/patterns/extract` EXISTS (`src/app/api/patterns/extract/route.ts`). Service home is at `src/lib/services/pattern-extraction/` (full directory: `pattern-extraction-service.ts`, `pattern-extraction-engine.ts`, `pattern-database-service.ts`, `extract-viral-genome.ts`, `quality-filter-integration.ts`, plus `enhanced-*.ts` variants and `index.ts`). The doc cites no specific src path so technically only the API path is checkable; that path exists. Migration archived. Verdict PARTIAL because the doc's structure is broadly accurate but the `src/lib/services/patterns/` (singular) directory it implies does NOT exist — the actual code lives at `src/lib/services/pattern-extraction/` (with hyphen). |
| FEAT-003-PATTERN-EXTRACTION-COMPLETE.md | FEAT-003 | "Virality Fingerprint Generator" — completion report with 7 pattern types and DPS quality metrics | 8 | 1 / 1 | PARTIAL | API endpoint `POST /api/patterns/extract` EXISTS. Code under `src/lib/services/pattern-extraction/` is alive (12 files there, several carry `FEAT-003` in headers). Migration archived. The 7 pattern types (topic, angle, hook_structure, story_structure, visual_format, key_visuals, audio) appear in code references. The numeric quality metrics in the doc (76.69 avg DPS, 84 patterns, 12 videos) cannot be re-verified without DB access — they're a snapshot. |
| FEAT-003-QUICKSTART.md | FEAT-003 | Pattern Extraction quickstart — 5 minute setup | 8 | 1 / 1 | PARTIAL | Migration archived. Tables exist in code references. API endpoint exists. Quickstart's setup commands (Supabase CLI push, env vars, dev server, curl) remain conceptually valid but the migration file is no longer at the path the quickstart cites. |
| FEAT-007-DEPLOYMENT-CHECKLIST.md | FEAT-007 | Pre-Content Prediction — deployment checklist (env vars, migrations, feature flag) | 8 | 1 / 2 | LIVELY | Migration archived (`migrations_archive/20251003_feat007_pre_content_predictions.sql`). API route `/api/predict/pre-content/route.ts` EXISTS (with `FEAT-007` in route header comment). Feature flag `FF-PreContentAnalyzer-v1` referenced in doc. Service home `src/lib/services/pre-content/` EXISTS with 6 files: `pre-content-prediction-service.ts`, `idea-legos-extractor.ts`, `pattern-matcher.ts`, `llm-consensus.ts`, `dps-predictor.ts`, `recommendations-generator.ts` — all carrying `FEAT-007` headers. |
| FEAT-007-IMPLEMENTATION-SUMMARY.md | FEAT-007 | Pre-Content Prediction — pipeline architecture (5-step LLM consensus + DPS) | 8 | 1 / 2 | LIVELY | API route `/api/predict/pre-content/route.ts` EXISTS. Pipeline steps map to actual files in `src/lib/services/pre-content/` (idea legos, pattern matcher, LLM consensus, DPS predictor, recommendations). `pre_content_predictions` table referenced in 2 files. `FEAT-007` literal appears in 8 src files including type definitions. |
| FEAT-007-QUICKSTART.md | FEAT-007 | Pre-Content Prediction quickstart — 10-minute setup | 8 | 1 / 1 | LIVELY | Migration archived. Endpoint exists. Service code exists. Setup steps (env vars, npm install) remain operationally valid. |
| FEAT-060-IMPLEMENTATION-SUMMARY.md | FEAT-060 | GPT Knowledge Extraction Pipeline — Multi-LLM consensus (GPT-4 + Claude + Gemini) | 11 | 1 / 2 | LIVELY | Migration archived (`migrations_archive/20251008_feat060_extracted_knowledge.sql`). Engine EXISTS at the documented path: `src/lib/services/gppt/knowledge-extraction-engine.ts` — file header reads `FEAT-060: GPT Knowledge Extraction Pipeline`. Internal logs use `[FEAT-060]` tags in 4+ places. `extracted_knowledge` table referenced across 5 files including `validation-workflow.ts`, `creator-workflow.ts`, `research-review/page.tsx`. |
| FEAT-060-QUICKSTART.md | FEAT-060 | FEAT-060 quickstart — extract knowledge for one video via curl | 11 | 1 / 1 | LIVELY | Migration archived. Engine path exists. API route `/api/knowledge/extract/route.ts` EXISTS and contains `FEAT-060` log tags. Curl command structure matches actual route signature. |
| FEAT-070-VALIDATION-READY.md | FEAT-070 | Pre-Content Viral Prediction validation — 4 scripts ready, predictions table fix needed | 6 | 5 / 5 | LIVELY | All 4 scripts EXIST: `scripts/extract-test-videos.js`, `scripts/validate-predictions.js`, `scripts/verify-predictions-migration.js`, `scripts/run-feat070-validation.js`. The referenced fix doc (`FIX-PREDICTIONS-TABLE-NOW.md`) also still exists at root. `viral_patterns` table active. The "predictions" table referenced is in `migrations_archive/20251008_predictions_table.sql` and `migrations_archive/20251015_feat070_predictions_table.sql`. |
| FEAT-070-VALIDATION-REPORT.md | FEAT-070 | FEAT-070 validation results — `/api/predict/viral` endpoint test report | 6 | 1 / 1 | LIVELY | API route `/api/predict/viral/route.ts` EXISTS with `🔮 FEAT-070: Starting viral prediction` log line. Integrates with FEAT-060 (`STEP 1: Extract Knowledge Using FEAT-060`) and FEAT-003 patterns (`STEP 2: Match Against Viral Patterns (FEAT-003)`). Scripts referenced in companion VALIDATION-READY doc all exist. |

---

## Totals per verdict

| Verdict | Count |
|---------|------:|
| ORPHANED | 4 |
| PARTIAL | 4 |
| UNCLEAR | 0 |
| LIVELY | 7 |
| **Total** | **15** |

---

## Strongest single piece of evidence per ORPHANED verdict

For each of the 4 ORPHANED verdicts (all FEAT-002 docs), the strongest piece of evidence Tommy can sanity-check before treating the doc as archive-candidate:

1. **FEAT-002-DEPLOYMENT-CHECKLIST.md** — strongest evidence: **the entire `src/lib/services/dps/` directory does not exist**. `Test-Path C:\Projects\CleanCopy\src\lib\services\dps` returns false. The doc's "Implementation Status" section asserts that 6 specific files exist under that directory; none of them do. To verify: `ls src/lib/services/` from the repo root will confirm there is no `dps` subdirectory.

2. **FEAT-002-ENHANCEMENTS-QUICKSTART.md** — strongest evidence: **`src/lib/services/dps/blockchain-timestamp.ts` does not exist** (also no file by that name anywhere under `src/`). The function `calculateSingleDPS()` cited in the doc's "Usage" code block does not appear in `src/`. To verify: search the codebase for `blockchain-timestamp` or `calculateSingleDPS` — both return zero matches in active code (only stale comment references exist).

3. **FEAT-002-ENHANCEMENTS.md** — strongest evidence: **none of the four functions the doc names — `timestampPrediction`, `verifyTimestamp`, `batchTimestampPredictions`, `createCalculationHash` — appear anywhere in `src/`**. These are the doc's headline implementation details. Their complete absence indicates the blockchain-timestamp enhancement was never landed in current code (or was removed). To verify: grep for `timestampPrediction` across `src/` — zero matches.

4. **FEAT-002-IMPLEMENTATION-SUMMARY.md** — strongest evidence: **the doc's "Files Created" list begins with `src/lib/services/dps/dps-calculation-engine.ts (532 lines)`, and that file does not exist**. The substitute viral-scoring logic in the codebase lives under different module names (`predictVirality.ts`, `predictViralityScore.ts`, `viral-prediction/unified-prediction-engine.ts`) with different function signatures. The doc therefore documents a module that was either renamed/merged into something else or never landed at the documented path. To verify: `Test-Path src/lib/services/dps/dps-calculation-engine.ts` returns false.

**Common context for all four ORPHANED verdicts:** the FEAT-002 migration files (`20251002_feat002_dps_calculation_engine.sql`, `20251002_feat002_enhancements.sql`) **do** still exist in the repo, but in `supabase/migrations_archive/`. So the database tables `dps_calculations`, `dps_cohort_stats`, `dps_calculation_errors`, the `blockchain_tx`/`identity_container_score`/`prediction_mode` columns, and the helper functions `get_dps_cohort_stats()` / `classify_virality()` may all still exist in Supabase even though the documented application-layer code is gone. If Tommy archives these docs, he should be aware that the DB schema they describe may be in production. Recommendation: do not treat "ORPHANED" as "delete" — these docs describe an archived application module whose database schema may still be live.

---

## Read-only observations

1. **FEAT-002 is the only fully-orphaned feature in this set.** All FEAT-002 application-layer code is gone; substitute viral-scoring logic was implemented under different filenames (`predictVirality.ts`, `predictViralityScore.ts`) and inside `viral-prediction/unified-prediction-engine.ts`. The FEAT-002 docs describe a module that no longer exists.
2. **FEAT-003's docs reference `src/lib/services/patterns/` (plural-singular ambiguity).** The actual code lives at `src/lib/services/pattern-extraction/` (with a hyphen). 12 files there, several carrying `FEAT-003:` headers. The docs would still be useful if the path discrepancy were noted at the top.
3. **FEAT-007 / FEAT-060 / FEAT-070 are all clearly alive with `FEAT-XXX` literal log tags inside the code itself** (e.g., `console.log('[FEAT-060] Extracting knowledge...')`, `console.log('🔮 FEAT-070: Starting viral prediction')`). These provenance markers anchor the docs directly to running code.
4. **`/api/predict/viral` (FEAT-070) is the integration backbone** — its route imports from FEAT-060 (knowledge extraction) and FEAT-003 (viral pattern matching). Removing any of FEAT-003/060/070 would break the others.
5. **Two of the FEAT-070 references in src/ are TODOs** (`// TODO: Integrate with FEAT-070 prediction API` and `// Mock prediction logic (replace with FEAT-070 call)` in `validation-workflow.ts` and `creator-workflow.ts`). The validation/creator workflow code intends to call FEAT-070 but currently uses placeholders. Worth surfacing if Tommy is auditing what's wired through end-to-end.
6. **`src/app/admin/testing-accuracy/page.tsx.backup-20251024`** appears multiple times as the source of FEAT-002/FEAT-003/FEAT-060/FEAT-070 references. It's a `.backup-` file — historical artifact, not active code. The backup file inflates the raw grep counts.
7. **Helper SQL functions `get_top_patterns_by_niche()` and `find_similar_patterns()`** (called out in FEAT-003-DEPLOYMENT-CHECKLIST.md as required after migration) are not visible in any current `src/` code as call sites at a quick glance — they may live exclusively in DB and be invoked via Supabase RPC, in which case grep wouldn't catch their TS-side usage cleanly.
8. **FEAT-070-VALIDATION-REPORT.md flags issues that may still be live**: "Claude API client initialization error", "Gemini model version not found", "Database insert failing returns undefined". This doc is dated 2025-10-08; the codebase has moved on substantially since then, so those specific issues may already be fixed — but the doc itself is now a snapshot and can mislead if read as current state.
9. **No FEAT-XXX doc is structurally invalid or impossible to evaluate.** UNCLEAR is at 0 because every doc named at least one concrete artifact (file path, table, function, or API route) that could be checked.

— end of diagnostic —
