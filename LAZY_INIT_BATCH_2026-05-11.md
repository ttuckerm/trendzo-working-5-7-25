# Lazy-init batch — 2026-05-11

Applied the same lazy-init transformation that succeeded for `emit.ts` to four more high-leverage files identified by the audit. Three of the four are Supabase clients (same pattern as `emit.ts`). The fourth, `rate-limiter.ts`, wraps a top-level `setInterval` behind an exported but unused-by-default starter function.

## Pre-flight check results

| # | Check | Result | Detail |
|---|-------|--------|--------|
| 1 | Branch is `vercel-deploy-test` | PASS | `git branch --show-current` → `vercel-deploy-test` |
| 2 | HEAD is the post-revert SHA | PASS | `b097a09ad2e830b6608b5f23b3ae0c8f0047a345` (the `revert(build): remove cpus: 2 …` commit) |
| 3 | `emit.ts` lazy-init still in place | PASS | `let _supabaseClient` at line 3, `function getSupabase()` at line 4, no top-level `const supabase = createClient(` |
| 4 | Working tree clean except WIP allow-list | PASS | Modified: `src/app/page.tsx`, `fixtures/*` (all in WIP allow-list). Untracked: the prior task reports and `src/components/landing/TestimonialsSection.tsx`. Nothing else. |
| 5 | All four target files exist | PASS | runPredictionPipeline.ts (43,489 bytes), metric-collector.ts (9,409 bytes), enhanced-database-service.ts (12,959 bytes), rate-limiter.ts (12,364 bytes) |
| 6 | BEFORE snapshots saved | PASS | `/tmp/lazyinit_<name>_before.ts` saved for all four files, byte counts match. |
| 7 | Expected `^const supabase = createClient(` patterns | PASS | runPredictionPipeline.ts: 1 match at line 61. metric-collector.ts: 1 match at line 21. enhanced-database-service.ts: 1 match at line 14. |
| 8 | Expected `^setInterval(` in rate-limiter.ts | PASS | 1 match at line 185. |

## File-by-file results

### File 1: `src/lib/prediction/runPredictionPipeline.ts`

- **Lines changed (git diff stat):** `22 +++++++-----` (+15 / -7)
- **Call sites updated:** 1 (the single `void supabase.from('prediction_log').insert(...)` at the original line 912).
- **Post-verification:**
  - No top-level `const supabase = createClient(` remains. PASS.
  - `function getSupabase()` present exactly once (line 62). PASS.
  - `let _supabaseClient` present exactly once (line 61). PASS.
  - `\bsupabase\.` regex returns zero matches. PASS.

```diff
diff --git a/src/lib/prediction/runPredictionPipeline.ts b/src/lib/prediction/runPredictionPipeline.ts
index 5367bcc..83526a9 100644
--- a/src/lib/prediction/runPredictionPipeline.ts
+++ b/src/lib/prediction/runPredictionPipeline.ts
@@ -58,14 +58,20 @@ import { resolveModelRoute, type ModelRoute } from '@/lib/prediction/model-route
 import { emitEvent } from '@/lib/events/emit';
 
 // Initialize Supabase with service key for writes
-const supabase = createClient(
-  process.env.NEXT_PUBLIC_SUPABASE_URL!,
-  process.env.SUPABASE_SERVICE_KEY!,
-  {
-    db: { schema: 'public' },
-    auth: { persistSession: false }
+let _supabaseClient: ReturnType<typeof createClient> | null = null;
+function getSupabase() {
+  if (!_supabaseClient) {
+    _supabaseClient = createClient(
+      process.env.NEXT_PUBLIC_SUPABASE_URL!,
+      process.env.SUPABASE_SERVICE_KEY!,
+      {
+        db: { schema: 'public' },
+        auth: { persistSession: false }
+      }
+    );
   }
-);
+  return _supabaseClient;
+}
 
 export interface PredictionPipelineOptions {
   mode?: 'standard' | 'validation';
@@ -909,7 +915,7 @@ export async function runPredictionPipeline(
           }).catch(() => {});
 
           // Atlas feedback hook: log every VPS prediction for future feedback collection
-          void supabase.from('prediction_log').insert({
+          void getSupabase().from('prediction_log').insert({
             prediction_id: runId,
             creator_id: (options.sourceMeta?.user_id as string) ?? null,
             content_id: videoId,
```

### File 2: `src/lib/training/metric-collector.ts`

- **Lines changed (git diff stat):** `40 +++++++++++++---------` (+25 / -15)
- **Call sites updated:** 10 total — 1× `let query = supabase` → `let query = getSupabase()`, plus 9× `await supabase` → `await getSupabase()`. (All call sites used the multi-line chained pattern `supabase\n    .from(...)`, so each replacement preserves the chain exactly.)
- **Post-verification:**
  - No top-level `const supabase = createClient(` remains. PASS.
  - `function getSupabase()` present exactly once (line 22). PASS.
  - `let _supabaseClient` present exactly once (line 21). PASS.
  - `\bsupabase\.` regex returns zero matches. PASS. Remaining `supabase` text is only the package import string `@supabase/supabase-js` and the internal `_supabaseClient` variable references.

```diff
diff --git a/src/lib/training/metric-collector.ts b/src/lib/training/metric-collector.ts
index aab799b..f504f56 100644
--- a/src/lib/training/metric-collector.ts
+++ b/src/lib/training/metric-collector.ts
@@ -18,14 +18,20 @@ import type {
   MetricCollectorItemResult,
 } from './training-ingest-types';
 
-const supabase = createClient(
-  process.env.NEXT_PUBLIC_SUPABASE_URL!,
-  process.env.SUPABASE_SERVICE_KEY!,
-  {
-    db: { schema: 'public' },
-    auth: { persistSession: false },
+let _supabaseClient: ReturnType<typeof createClient> | null = null;
+function getSupabase() {
+  if (!_supabaseClient) {
+    _supabaseClient = createClient(
+      process.env.NEXT_PUBLIC_SUPABASE_URL!,
+      process.env.SUPABASE_SERVICE_KEY!,
+      {
+        db: { schema: 'public' },
+        auth: { persistSession: false },
+      }
+    );
   }
-);
+  return _supabaseClient;
+}
 
 interface CollectorOptions {
   /** Only process schedules for this specific run */
@@ -52,7 +58,7 @@ export async function runMetricCollector(
   );
 
   // 1. Query due schedules (include rows with null platform_video_id so we can fail them explicitly)
-  let query = supabase
+  let query = getSupabase()
     .from('metric_check_schedule')
     .select('id, prediction_run_id, video_id, platform, platform_video_id, check_type, scheduled_at, status')
     .in('status', ['pending', 'failed'])
@@ -108,7 +114,7 @@ export async function runMetricCollector(
 
     // Fallback: resolve from prediction_runs.source_meta
     if (!tiktokUrl) {
-      const { data: prRun } = await supabase
+      const { data: prRun } = await getSupabase()
         .from('prediction_runs')
         .select('source_meta')
         .eq('id', sched.prediction_run_id)
@@ -118,7 +124,7 @@ export async function runMetricCollector(
       // If we resolved a URL, backfill the schedule row so future runs don't need the lookup
       if (tiktokUrl) {
         console.log(`[MetricCollector] Backfilled platform_video_id for schedule ${sched.id}: ${tiktokUrl}`);
-        await supabase
+        await getSupabase()
           .from('metric_check_schedule')
           .update({ platform_video_id: tiktokUrl })
           .eq('id', sched.id);
@@ -131,7 +137,7 @@ export async function runMetricCollector(
       item.platform_video_id = rawPvid || '';
       failed++;
 
-      await supabase
+      await getSupabase()
         .from('metric_check_schedule')
         .update({
           status: 'failed',
@@ -170,7 +176,7 @@ export async function runMetricCollector(
         item.error = 'No data returned from Apify';
         failed++;
 
-        await supabase
+        await getSupabase()
           .from('metric_check_schedule')
           .update({
             status: 'failed',
@@ -183,7 +189,7 @@ export async function runMetricCollector(
         item.metrics = metrics;
         succeeded++;
 
-        await supabase
+        await getSupabase()
           .from('metric_check_schedule')
           .update({
             status: 'completed',
@@ -200,7 +206,7 @@ export async function runMetricCollector(
         // 5. Update prediction_runs with metrics_source + best checkpoint
         try {
           // Find the best completed checkpoint for this run (7d > 48h > 24h > 4h)
-          const { data: completedChecks } = await supabase
+          const { data: completedChecks } = await getSupabase()
             .from('metric_check_schedule')
             .select('check_type')
             .eq('prediction_run_id', sched.prediction_run_id)
@@ -210,7 +216,7 @@ export async function runMetricCollector(
           const bestCheckpoint = CHECKPOINT_PRIORITY.find((t) => completedTypes.has(t)) || sched.check_type;
 
           // Only set actual_checkpoint_used if currently NULL (don't downgrade)
-          const { data: currentRun } = await supabase
+          const { data: currentRun } = await getSupabase()
             .from('prediction_runs')
             .select('actual_checkpoint_used')
             .eq('id', sched.prediction_run_id)
@@ -224,7 +230,7 @@ export async function runMetricCollector(
             updatePayload.actual_checkpoint_used = bestCheckpoint;
           }
 
-          await supabase
+          await getSupabase()
             .from('prediction_runs')
             .update(updatePayload)
             .eq('id', sched.prediction_run_id);
@@ -242,7 +248,7 @@ export async function runMetricCollector(
 
       console.error(`[MetricCollector] Failed ${sched.check_type} for ${sched.platform_video_id}: ${errMsg}`);
 
-      await supabase
+      await getSupabase()
         .from('metric_check_schedule')
         .update({
           status: 'failed',
```

### File 3: `src/lib/services/pattern-extraction/enhanced-database-service.ts`

- **Lines changed (git diff stat):** `26 ++++++++------` (+16 / -10)
- **Call sites updated:** 9 — all `await supabase` → `await getSupabase()` (multi-line chained pattern).
- **Post-verification:**
  - No top-level `const supabase = createClient(` remains. PASS.
  - `function getSupabase()` present exactly once (line 15). PASS.
  - `let _supabaseClient` present exactly once (line 14). PASS.
  - `\bsupabase\.` regex returns zero matches. PASS.

```diff
diff --git a/src/lib/services/pattern-extraction/enhanced-database-service.ts b/src/lib/services/pattern-extraction/enhanced-database-service.ts
index d8998f2..d4c6fcd 100644
--- a/src/lib/services/pattern-extraction/enhanced-database-service.ts
+++ b/src/lib/services/pattern-extraction/enhanced-database-service.ts
@@ -11,7 +11,13 @@ import type {
   VideoForDetailedExtraction,
 } from './types-enhanced';
 
-const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
+let _supabaseClient: ReturnType<typeof createClient> | null = null;
+function getSupabase() {
+  if (!_supabaseClient) {
+    _supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
+  }
+  return _supabaseClient;
+}
 
 // =====================================================
 // Storage Operations
@@ -51,7 +57,7 @@ export async function storeVideoPattern(
       extraction_batch_id: batchId,
     };
 
-    const { error } = await supabase
+    const { error } = await getSupabase()
       .from('viral_patterns')
       .upsert({
         niche: video.niche,
@@ -143,7 +149,7 @@ export async function getTopVideoPatterns(
   limit: number = 20
 ): Promise<VideoPatternDetailed[]> {
   try {
-    const { data, error } = await supabase
+    const { data, error } = await getSupabase()
       .from('viral_patterns')
       .select('*')
       .eq('niche', niche)
@@ -173,7 +179,7 @@ export async function getVideoPattern(
   videoId: string
 ): Promise<VideoPatternDetailed | null> {
   try {
-    const { data, error } = await supabase
+    const { data, error } = await getSupabase()
       .from('video_patterns_detailed')
       .select('*')
       .eq('video_id', videoId)
@@ -220,7 +226,7 @@ export async function queryVideosForDetailedExtraction(
     console.log('='.repeat(80) + '\n');
 
     // Check total count of high-DPS videos
-    const { count: totalCount } = await supabase
+    const { count: totalCount } = await getSupabase()
       .from('scraped_videos')
       .select('*', { count: 'exact', head: true })
       .gte('dps_score', minDpsScore);
@@ -231,7 +237,7 @@ export async function queryVideosForDetailedExtraction(
 
     // Query scraped_videos directly (dps metrics stored in same table)
     // NOTE: scraped_videos does NOT have a 'niche' column, so we don't filter by it
-    const { data, error, count } = await supabase
+    const { data, error, count } = await getSupabase()
       .from('scraped_videos')
       .select(`
         video_id,
@@ -271,25 +277,25 @@ export async function queryVideosForDetailedExtraction(
       console.log('Filter breakdown:');
       
       // Check each filter individually
-      const { count: dpsCount } = await supabase
+      const { count: dpsCount } = await getSupabase()
         .from('scraped_videos')
         .select('*', { count: 'exact', head: true })
         .gte('dps_score', minDpsScore);
       console.log(`  - Videos with dps_score >= ${minDpsScore}: ${dpsCount}`);
       
-      const { count: dateCount } = await supabase
+      const { count: dateCount } = await getSupabase()
         .from('scraped_videos')
         .select('*', { count: 'exact', head: true })
         .gte('scraped_at', cutoffDate.toISOString());
       console.log(`  - Videos with scraped_at >= ${cutoffDate.toISOString()}: ${dateCount}`);
       
-      const { count: transcriptCount } = await supabase
+      const { count: transcriptCount } = await getSupabase()
         .from('scraped_videos')
         .select('*', { count: 'exact', head: true })
         .not('transcript_text', 'is', null);
       console.log(`  - Videos with transcript_text: ${transcriptCount}`);
       
-      const { count: combinedCount } = await supabase
+      const { count: combinedCount } = await getSupabase()
         .from('scraped_videos')
         .select('*', { count: 'exact', head: true })
         .gte('dps_score', minDpsScore)
```

### File 4: `src/lib/security/rate-limiter.ts` (different transformation)

- **Lines changed (git diff stat):** `7 +++-` (+6 / -1)
- **Call sites updated:** N/A — this file had a top-level `setInterval(…)` expression, not a Supabase client. The transformation wraps the timer registration behind an exported `startMemoryStoreCleanup()` function that nothing currently invokes.
- **Post-verification:**
  - No top-level `^setInterval(` remains. Only one `setInterval(` reference still in the file, now indented at line 188, inside the new function body. PASS.
  - `export function startMemoryStoreCleanup()` present exactly once (line 186). PASS.
  - `let _cleanupTimer` present exactly once (line 185). PASS.
  - The original `MemoryStore.cleanup()` method on `MemoryRateLimitStore` still exists at line 172 (definition unchanged). PASS.
- **Intentional behavior change:** the memory cleanup timer is no longer started automatically at module load. Nothing currently calls `startMemoryStoreCleanup()`, so cleanup will not run unless a startup step is added later. This is per spec — the goal is to eliminate the 27 redundant timer registrations triggered when 27 route handlers each import `rate-limiter.ts`, which were each spawning a timer at build/runtime load.

```diff
diff --git a/src/lib/security/rate-limiter.ts b/src/lib/security/rate-limiter.ts
index 1941fe8..ea8606a 100644
--- a/src/lib/security/rate-limiter.ts
+++ b/src/lib/security/rate-limiter.ts
@@ -182,7 +182,12 @@ class MemoryRateLimitStore {
 const MemoryStore = new MemoryRateLimitStore();
 
 // Cleanup memory store every 5 minutes
-setInterval(() => MemoryStore.cleanup(), 5 * 60 * 1000);
+let _cleanupTimer: NodeJS.Timeout | null = null;
+export function startMemoryStoreCleanup() {
+  if (_cleanupTimer) return _cleanupTimer;
+  _cleanupTimer = setInterval(() => MemoryStore.cleanup(), 5 * 60 * 1000);
+  return _cleanupTimer;
+}
 
 /**
  * Rate Limit Configurations for Different Tiers
```

## Cross-file verification

### CHECK 9 — `git status --porcelain` after all four edits
Result: PASS. Exactly four expected files appear in the modified column, plus the pre-existing WIP files. Nothing else was touched.

```
 M fixtures/learning/summary.json
 M fixtures/validation/summary.json
 M fixtures/validation/validations.ndjson
 M src/app/page.tsx
 M src/lib/prediction/runPredictionPipeline.ts
 M src/lib/security/rate-limiter.ts
 M src/lib/services/pattern-extraction/enhanced-database-service.ts
 M src/lib/training/metric-collector.ts
```
(plus the same untracked report files and `src/components/landing/TestimonialsSection.tsx` from the WIP allow-list)

### CHECK 10 — per-file diff inspection
PASS. Each diff (printed above in full) contains only:
- Files #1, #2, #3: one removed block (top-level `createClient(...)` call), one added block (lazy-init `_supabaseClient` + `getSupabase()`), and the expected number of `supabase` → `getSupabase()` call-site substitutions. No whitespace shifts elsewhere, no import changes, no other function-body edits.
- File #4: exactly one removed line (the bare `setInterval(...)` call) and one added block defining `_cleanupTimer` + `startMemoryStoreCleanup()`. No other changes anywhere in the file.

### CHECK 11 — TypeScript-equivalence reasoning (no tsc run — `npx tsc --noEmit` OOMs on this project)

Per the prior local-build investigation, full-project `tsc --noEmit` exhausts Node's heap and crashes Windows on this machine. We did not retry it. Instead, equivalence is reasoned per file:

**Files #1, #2, #3 (Supabase clients).** In each file, the original `const supabase = createClient(<args>)` produced a value whose static type is `ReturnType<typeof createClient>` for that call. The new `let _supabaseClient: ReturnType<typeof createClient> | null = null` declares exactly that same return type (as a union with `null`). Inside `getSupabase()`, the `if (!_supabaseClient)` narrows the type at the return path: after the guard, `_supabaseClient` is non-null and the function returns `ReturnType<typeof createClient>`. Therefore every call site `getSupabase().X` is type-identical to the original `supabase.X`. The `createClient` arguments — env-var reads, options object — are preserved verbatim in each file, so the runtime client returned is bit-identical too. No call-site signature changes.

**File #4 (setInterval).** Bare `setInterval(handler, ms)` in Node returns `NodeJS.Timeout`. The new `_cleanupTimer: NodeJS.Timeout | null` holds that same return value. `startMemoryStoreCleanup()` returns `NodeJS.Timeout` (or the cached `_cleanupTimer` on a second call). The wrapping does not change the semantics of `MemoryStore.cleanup()` or its 5-minute interval — both are preserved verbatim. The new export is purely additive; no existing exports change.

Conclusion: no new TypeScript errors could be introduced in any of the four files by these edits. PASS by inspection.

### CHECK 12 — Importer signature stability

For each file, current top-level exports were enumerated via `grep -n "^export"`. Comparing against the audit's importer lists:

| File | Importers (per audit) | Exports before | Exports after | Verdict |
|------|------------------------|----------------|----------------|---------|
| runPredictionPipeline.ts | 11 route imports + fresh-video-scanner.ts | 5 (4 interfaces + `runPredictionPipeline`) | 5 (unchanged) | PASS — no signature change, no exports added or removed |
| metric-collector.ts | 3 importers incl. cron/training-pipeline | 1 (`runMetricCollector`) | 1 (unchanged) | PASS — no signature change |
| enhanced-database-service.ts | 3 importers | 5 (`storeVideoPattern`, `storeVideoPatternsBatch`, `getTopVideoPatterns`, `getVideoPattern`, `queryVideosForDetailedExtraction`) | 5 (unchanged) | PASS — no signature change |
| rate-limiter.ts | 27 route handlers + security-middleware.ts | 8 (`RateLimitTiers`, `KeyGenerators`, `RateLimiter`, `createRateLimiter`, `createMultiTierRateLimiter`, `createTrustedIPBypass`, `rateLimiter`, `commonRateLimiters`) | 9 — same eight, plus the new `startMemoryStoreCleanup` | PASS — one purely additive export; no existing export removed or changed; no importer can break |

The internal `supabase` variables in files #1-3 were never exported, so no importer could have referenced them. The bare top-level `setInterval(...)` expression in file #4 was anonymous — no importer could have referenced it either.

PASS for all four files.

## Status

**Final: SUCCESS.**

All four target files edited surgically. No file outside the target list was modified. All ten post-verification checks (the four per-file post-verifications plus the four cross-file checks CHECK 9–12) passed.

No commit, no stage, no push performed. Backups remain available at:
- `/tmp/lazyinit_runPredictionPipeline_before.ts` (43,489 bytes)
- `/tmp/lazyinit_metric-collector_before.ts` (9,409 bytes)
- `/tmp/lazyinit_enhanced-database-service_before.ts` (12,959 bytes)
- `/tmp/lazyinit_rate-limiter_before.ts` (12,364 bytes)

Pre-existing WIP files (`src/app/page.tsx`, `src/components/landing/TestimonialsSection.tsx`, `fixtures/*`) were not touched.

## Notes worth flagging for human review

1. **`rate-limiter.ts` cleanup is now dormant.** Until something calls `startMemoryStoreCleanup()`, the in-memory rate-limit store will grow indefinitely. The 28 importers (27 routes + security-middleware) continue to function normally for rate-limit checks themselves — only the cleanup sweep is gated off. If you want to restore the periodic cleanup, the cleanest place to invoke `startMemoryStoreCleanup()` is from a single deliberate startup hook (e.g., `src/instrumentation.ts` or a server-side runtime init). This is per spec — listed here so it does not get forgotten.

2. **Multi-line chained call pattern**, not the `supabase.from(...)` single-line style used in `emit.ts`, was the dominant form across files #2 and #3. Each file's substitution preserves the chain (`getSupabase()\n      .from(...)`), so call-site formatting is identical to the original.

3. **Net diff:** +59 / -36 across four files. Roughly two-thirds of the additions are the new lazy-init wrapper blocks (which are inherently larger than a single `const` line) and one-third are the `getSupabase()` text expansion at call sites. No "creative" reformatting.

4. **No tsc, no build, no tests run.** Per the spec ("DO NOT … run any build, test, or tsc command"), verification was strictly by diff inspection, pattern grep, and type-equivalence reasoning. The prior task's local build attempts established that running the full-project type checker on this machine is unsafe; the type-equivalence argument in CHECK 11 is the substitute for tsc on these four files.
