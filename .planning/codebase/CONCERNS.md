# Codebase Concerns

**Analysis Date:** 2026-01-18 (Updated after v1.0 milestone)

## Tech Debt

**Monolithic KaiOrchestrator (CRITICAL):**
- Issue: Single file with 4,888 lines handling all 27 prediction components
- Files: `src/lib/orchestration/kai-orchestrator.ts`
- Why: Grew organically as components were added
- Impact: Difficult to maintain, test, and understand; no parallelization
- Fix approach: Refactor into component-specific modules, extract component registry

**Firebase Migration Debt (35+ files):**
- Issue: Firebase services disabled but stub code remains, needs Supabase reimplementation
- Files: `src/lib/services/etlJobService.ts`, `src/lib/services/etlErrorHandlingService.ts`, `src/lib/services/expertInsightService.ts`, `src/lib/services/soundService.ts`, `src/lib/services/soundLibraryService.ts`, `src/lib/services/soundAnalysisService.ts`, `src/lib/services/templateVariationService.ts`, `src/lib/services/trendPredictionService.ts`, `src/lib/hooks/useAuditLog.ts`, and 25+ more
- Why: Migration from Firebase to Supabase in progress
- Impact: Services return mock/empty data, features broken
- Fix approach: Systematically reimplement each service with Supabase

**~~Multiple Prediction Endpoints Without Unified Response:~~ RESOLVED (v1.0 Phase 04)**
- ~~Issue: 5+ prediction endpoints exist, not all return Pack 1/2 results consistently~~
- **Status:** Fixed in Phase 04 (API Response Standardization)
- All endpoints now return `qualitative_analysis` with Pack 1/2/3/V and `_meta` metadata

**Duplicate Service Patterns:**
- Issue: Multiple similar services with overlapping functionality
- Files: `src/lib/services/sound-service.ts`, `src/lib/services/soundService.ts`, `src/lib/services/soundLibraryService.ts`
- Why: Incremental development without consolidation
- Impact: Confusion about which service to use
- Fix approach: Consolidate into single service with clear API

## Known Bugs

**~~Pack 1/2 Not Displayed on Upload-Test Page:~~ RESOLVED (v1.0 Phase 05)**
- ~~Symptoms: User runs prediction from `/admin/upload-test`, Pack 1/2 results not shown~~
- **Status:** Fixed in Phase 05 (UI Polish)
- All 4 Pack panels now display on `/admin/upload-test`: Pack 1, Pack 2, Pack 3 (with strength indicators), Pack V
- Added PackLoadingSkeleton and PackErrorState components

**Environment Variable Duplication:**
- Symptoms: Fallback logic doesn't work as intended
- Files: `src/lib/supabase-server.ts:10-11`
- Root cause: Same env var repeated: `process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY`
- Fix: Correct fallback to alternative key names

## Security Considerations

**Unsafe File Write Path:**
- Risk: File write to `data/raw_videos/` without path sanitization, potential directory traversal
- Files: `src/app/api/kai/predict/route.ts:73-77`
- Current mitigation: None visible
- Recommendations: Validate and sanitize filename before writing

**Pack 1/2 LLM Output Validation Missing:**
- Risk: LLM responses not validated against schema, could cause runtime errors
- Files: `src/lib/prediction/runPredictionPipeline.ts:51-52` - Pack 1/2 results typed as `any`
- Current mitigation: Basic error catching
- Recommendations: Add Zod schema validation for all LLM outputs

**Environment Variable Handling:**
- Risk: Non-null assertions on env vars without validation
- Files: `src/lib/prediction/runPredictionPipeline.ts:19-20` - `process.env.NEXT_PUBLIC_SUPABASE_URL!`
- Current mitigation: Server-side only access
- Recommendations: Add runtime validation before use

**Admin Route Protection:**
- Risk: Admin pages may not have consistent auth checks
- Files: `src/app/admin/**/*.tsx`
- Current mitigation: Layout-level auth check in `src/app/admin/layout.tsx`
- Recommendations: Verify all admin routes have proper auth middleware

## Performance Bottlenecks

**Sequential Component Execution:**
- Problem: 27 components executed sequentially, no parallelization
- Files: `src/lib/orchestration/kai-orchestrator.ts`
- Measurement: Full prediction can take 30+ seconds with all components
- Cause: No visible parallelization control despite `parallel-execution.ts` existing
- Improvement path: Implement parallel execution for independent components

**Debug Logging in Production:**
- Problem: Console.log with JSON.stringify in production paths
- Files: `src/lib/contexts/TemplateEditorContext.tsx:228-285`, `src/lib/services/pattern-extraction/enhanced-database-service.ts:212,256`
- Measurement: Performance impact on every operation
- Cause: Debug code not removed
- Improvement path: Remove or conditionally disable debug logs

**Large Page Components:**
- Problem: Large client components mixing UI, form handling, API calls
- Files: `src/app/admin/upload-test/page.tsx` (1,383 lines), `src/app/admin/viral-prediction-hub/page.tsx` (738 lines)
- Improvement path: Extract into smaller, focused components

## Fragile Areas

**Prediction Pipeline:**
- Files: `src/lib/prediction/runPredictionPipeline.ts`
- Why fragile: Central to all predictions, many consumers depend on exact response shape
- Common failures: Adding new fields without updating all consumers
- Safe modification: Run full test suite, test all prediction endpoints manually
- Test coverage: Has dedicated tests, but coverage could be expanded

**KaiOrchestrator Component Registration:**
- Files: `src/lib/orchestration/kai-orchestrator.ts`
- Why fragile: Components registered with IDs, order matters for some
- Common failures: Adding component without proper ID, missing dependency
- Safe modification: Add new components at end, verify existing tests pass
- Test coverage: Basic tests exist

## Type Safety Issues

**`any` Type Usage (30+ files):**
- Files: `src/lib/orchestration/kai-orchestrator.ts` (ComponentResult, VideoInput), `src/lib/prediction/runPredictionPipeline.ts:51-52` (Pack 1/2), `src/lib/services/apifyScraper.ts:103`, `src/lib/services/immediate-video-analyzer.ts`, `src/lib/rubric-engine/unified-grading-runner.ts`
- Risk: Runtime errors from unexpected data shapes
- Fix approach: Add proper type definitions, Zod validation

**@ts-ignore Usage:**
- Files: `src/lib/services/apifyScraper.ts:10` - `@ts-ignore` on fluent-ffmpeg import
- Risk: Type errors silently ignored
- Fix approach: Fix underlying type issue or add type definitions

## Incomplete Implementations (TODO Comments)

**Critical TODOs:**
- `src/lib/grpc/services/viral-prediction-service.ts:180` - TODO: Implement embeddings (BERT embeddings array empty)
- `src/lib/grpc/services/viral-prediction-service.ts:281` - TODO: Implement full conversion
- `src/lib/grpc/services/viral-prediction-service.ts:355` - TODO: Implement feature extraction
- `src/lib/donna/testing/testing-framework.ts:500` - TODO: Implement Tests 3, 4, 5
- `src/lib/services/ffmpeg-service.ts:124` - TODO: Implement video download logic
- `src/lib/services/ffmpeg-service.ts:353` - TODO: Integrate with Sharp for color analysis
- `src/lib/services/ffmpeg-service.ts:431` - TODO: Implement scene change detection

## Scaling Limits

**LLM API Rate Limits:**
- Current capacity: Depends on API tier (Anthropic, OpenAI)
- Limit: Rate limits on concurrent requests
- Symptoms at limit: 429 errors, delayed predictions
- Scaling path: Implement request queuing, caching for repeated content

## Dependencies at Risk

**fluent-ffmpeg:**
- Risk: Legacy library with type issues, requires `@ts-ignore`
- Files: `src/lib/services/apifyScraper.ts`
- Migration plan: Consider modern alternatives or add proper type definitions

**Multiple Auth Libraries:**
- Risk: Complexity from Supabase Auth + Clerk + NextAuth
- Impact: Confusion, potential security gaps
- Migration plan: Consolidate to single auth provider

**Mixed Package Managers:**
- Risk: Inconsistent dependency resolution
- Files: Both `bun.lock` and `package-lock.json` detected
- Migration plan: Standardize on single package manager

## Test Coverage Gaps

**Pack 1/2 Integration Tests:**
- What's not tested: End-to-end Pack 1/2 flow through all prediction endpoints
- Risk: Changes could break Pack 1/2 without detection
- Priority: High
- Difficulty to test: Medium (need to mock LLM responses)

**Firebase-Disabled Services:**
- What's not tested: Services return mock data, tests may not catch failures after migration
- Risk: Silent failures in production
- Priority: High
- Difficulty to test: Need Supabase test fixtures

**Admin Page Tests:**
- What's not tested: Most admin pages lack component tests
- Risk: UI regressions
- Priority: Medium
- Difficulty to test: Component testing setup needed

---

## Priority Summary

| Severity | Count | Top Items |
|----------|-------|-----------|
| **CRITICAL** | 3 | KaiOrchestrator 4,888 lines, Firebase migration (35+ files), Type safety in Pack 1/2 |
| **HIGH** | 8 | Missing error handling, unsafe file ops, Pack 1/2 integration, debug logging |
| **MEDIUM** | 15+ | TODO comments, `any` types, duplicate services |
| **LOW** | 10+ | Documentation gaps, minor type issues |

---

*Concerns audit: 2026-01-18*
*Updated after v1.0 Production Readiness milestone*
*2 major issues resolved in v1.0: Pack display, API unification*
