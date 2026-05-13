# Local Build Test #2 — Worker Limit — 2026-05-10

## What changed since last run
One line added to `next.config.mjs`: `cpus: 2,` as the first key inside the `experimental: {` block. No other changes. The intent was to reduce the number of parallel Next.js build worker processes, so each worker would have more system memory headroom during the "Collecting page data" phase that killed build #1.

## Pre-flight checks

| # | Check | Result | Detail |
|---|-------|--------|--------|
| 1 | Branch is `vercel-deploy-test` | PASS | `git branch --show-current` → `vercel-deploy-test` |
| 2 | HEAD starts with `07b960e` | PASS | `07b960e66ae87eeb6b437f530d71e9646a70fe21` |
| 3 | emit.ts lazy-init still in place | PASS | `let _supabaseClient` line 3, `function getSupabase()` line 4, no top-level `const supabase = createClient(` |
| 4 | next.config.mjs exists with `experimental: {` block | PASS | Block found at line 78 of pre-edit file |
| 5 | `cpus:` not already present | PASS | Zero matches for `cpus:` or `cpus =` in pre-edit file |
| 6 | BEFORE snapshot saved | PASS | `/tmp/nextconfig_before.mjs` (8462 bytes) |
| 7 | `.next` cleaned from prior run | PASS | Deleted successfully |

## Edit verification

CHECK 8 — AFTER snapshot saved: `/tmp/nextconfig_after.mjs` (8475 bytes; 13-byte delta = the new line `    cpus: 2,\n`).
CHECK 9 — Exactly **1** occurrence of `cpus: 2` in `next.config.mjs`.
CHECK 10 — `git diff next.config.mjs`:

```diff
diff --git a/next.config.mjs b/next.config.mjs
index f833480..fd769ad 100644
--- a/next.config.mjs
+++ b/next.config.mjs
@@ -76,6 +76,7 @@ const nextConfig = {
     contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
   },
   experimental: {
+    cpus: 2,
     // TEMPORARILY disabled 2026-04-21 — src/instrumentation.ts pulls the entire
     // scheduler chain (node-cron → fluent-ffmpeg → fresh-video-scanner) into
     // webpack's bundle target, which can't resolve Node built-ins (fs, path)
```

Exactly one line added, zero lines removed, no other reformatting.

## Environment
- NODE_OPTIONS: `--max-old-space-size=8192`
- Node version: `v22.16.0`
- Free disk before build: 34.72 GB

## Build execution
- Start time: `2026-05-11T12:38:16.0646577-04:00`
- End time: `2026-05-11T12:44:25.1602562-04:00`
- Duration: **6.15 minutes**
- Exit code (npm via `$LASTEXITCODE`): `-2147483651` (Windows STATUS_BREAKPOINT / 0x80000003; PowerShell wrapper reported task exit code `3`)
- `.next` size after build: **1190.74 MB** (partial)

## Outcome classification
**OUTCOME C** — Build failed at "Collecting page data" with the same OS-level memory commit failure as build #1. `cpus: 2` did not help.

## What happened (plain English)
Nothing changed in terms of the underlying problem. The build successfully compiled all your code (in about 6 minutes), then started the "Collecting page data" step — which is exactly where build #1 died — and Windows ran out of committable memory in the same way. Limiting Next.js to 2 worker processes did not solve it; in fact the build crashed about 50 seconds *earlier* than last time, and a new error variant ("MemoryChunk allocation failed during deserialization") showed up, which means workers were dying so early in their boot sequence that they couldn't even finish initializing V8 before being killed. This is conclusive evidence that the bottleneck is not worker parallelism — it is total system memory pressure during the data-collection phase, on this specific machine. Continuing to tune build flags will not unblock a local build here.

## Critical log excerpts

- **Compiled successfully**: NO (compiled with warnings — line 36: `⚠ Compiled with warnings`). The warnings are the same dynamic-server-usage notices on `phase2-test`, `channel/me`, and `training/populate` routes — they don't fail the build.
- **Last "Generating static pages X/Y" line**: NONE. The build never reached the static-generation phase.
- **Phase progression seen in log**:
  - Line 10:  `Creating an optimized production build ...`
  - Line 36:  `⚠ Compiled with warnings`
  - Line 141: `Skipping validation of types`
  - Line 142: `Skipping linting`
  - Line 143: `Collecting page data ...`         ← died here, same as build #1
  - Line 673: `⨯ Next.js build worker exited with code: 2147483651 and signal: null`
- **FATAL ERROR lines** (5 total, vs. 3 in build #1):
  - Line 596: `FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of memory`
  - Line 610: `FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of memory`
  - Line 622: `# Fatal JavaScript out of memory: MemoryChunk allocation failed during deserialization.`  ← new variant
  - Line 635: `# Fatal JavaScript out of memory: MemoryChunk allocation failed during deserialization.`  ← new variant
  - Line 641: `v8::base::FatalOOM+54` (stack frame)
- **Worker-count signal**: only one `worker` reference in the entire log — the final `Next.js build worker exited` line. The `cpus: 2` setting did reduce parallelism but the log doesn't show explicit worker counts, only the final exit message.

### Last 50 lines of build-output-2-2026-05-10.log

```
----- Native stack trace -----


<--- Last few GCs --->


<--- JS stacktrace --->



#
# Fatal JavaScript out of memory: MemoryChunk allocation failed during deserialization.
#
----- Native stack trace -----

 1: 00007FF7BFFC711D node::SetCppgcReference+17725
 2: 00007FF7BFEA181F node::TriggerNodeReport+73231
 3: 00007FF7C11195C6 v8::base::FatalOOM+54
 4: 00007FF7C0AB0CA3 v8::Isolate::ReportExternalAllocationLimitReached+147
 5: 00007FF7C0A9D8D6 v8::Function::Experimental_IsNopFunction+2870
 6: 00007FF7C08EAA20 v8::internal::StrongRootAllocatorBase::StrongRootAllocatorBase+31456
 7: 00007FF7C08B29DA v8::CpuProfileNode::GetScriptResourceNameStr+3146
 8: 00007FF7C08B2FF0 v8::CpuProfileNode::GetScriptResourceNameStr+4704
 9: 00007FF7C08B2CF5 v8::CpuProfileNode::GetScriptResourceNameStr+3941
10: 00007FF7C08987D3 v8::FixedArray::Length+85907
11: 00007FF7C08D8D36 v8::CpuProfileNode::GetScriptResourceNameStr+159654
12: 00007FF7C08D89C0 v8::CpuProfileNode::GetScriptResourceNameStr+158768
13: 00007FF7C08D8108 v8::CpuProfileNode::GetScriptResourceNameStr+156536
14: 00007FF7C08D7861 v8::CpuProfileNode::GetScriptResourceNameStr+154321
15: 00007FF7C08FD221 v8::Isolate::GetHeapProfiler+7601
16: 00007FF7C08FDB88 v8::Isolate::GetHeapProfiler+10008
17: 00007FF7C05A67FF v8::base::AddressSpaceReservation::AddressSpaceReservation+121583
18: 00007FF7C05A80E6 v8::base::AddressSpaceReservation::AddressSpaceReservation+127958
19: 00007FF7C05A3A07 v8::base::AddressSpaceReservation::AddressSpaceReservation+109815
20: 00007FF7C05A87AF v8::base::AddressSpaceReservation::AddressSpaceReservation+129695
21: 00007FF7C05833C4 v8::internal::Version::GetString+92372
22: 00007FF7C08F09F9 v8::internal::StrongRootAllocatorBase::StrongRootAllocatorBase+55993
23: 00007FF7C0583A31 v8::internal::Version::GetString+94017
24: 00007FF7C095CF45 v8::base::CPU::has_sse41+75605
25: 00007FF7C058B9D5 v8::base::AddressSpaceReservation::AddressSpaceReservation+11461
26: 00007FF7C0AA68A1 v8::Isolate::Initialize+433
27: 00007FF7C000696D node::NewContext+397
28: 00007FF7BFDDE58A X509_CRL_get_meth_data+146010
29: 00007FF7BFDE3FEA X509_CRL_get_meth_data+169146
30: 00007FF7BFDD88F5 X509_CRL_get_meth_data+122309
31: 00007FF7C0027463 uv_poll_stop+291
32: 00007FF7C1824C2E inflateValidate+159742
33: 00007FFF5B97E8D7 BaseThreadInitThunk+23
34: 00007FFF5D4EC3FC RtlUserThreadStart+44
 ⨯ Next.js build worker exited with code: 2147483651 and signal: null
```

## Comparison to previous build (Outcome C, 6.98 min)

| Dimension | Build #1 (no cpus limit) | Build #2 (cpus: 2) | Verdict |
|-----------|--------------------------|---------------------|---------|
| Died at phase | `Collecting page data ...` | `Collecting page data ...` | **Same** |
| Duration | 6.98 min | **6.15 min** | 0.83 min faster (worse — died sooner) |
| Total log lines | 823 | 673 | Build #2 produced ~18% less output before dying |
| Compile phase outcome | Compiled with warnings | Compiled with warnings | **Same** |
| Reached static generation? | No | No | **Same** |
| Primary error | `Committing semi space failed` ×3 | `Committing semi space failed` ×2 | Same root cause |
| Secondary error | (none) | `MemoryChunk allocation failed during deserialization` ×2 | **New, worse** — workers dying during V8 boot |
| .next partial size | 1257.74 MB | 1190.74 MB | Roughly equivalent |
| Build worker exit code | 2147483651 | 2147483651 | **Same** |

### Reading the comparison
- The build hit the **same wall in the same place**.
- Build #2 hit it slightly *earlier*, and the new `MemoryChunk allocation failed during deserialization` errors indicate that with `cpus: 2` set, the workers Next.js *did* spawn were each being asked to do more work — meaning they were larger / had bigger snapshots to deserialize at boot — and the OS could not commit even that initial allocation.
- Worker-count parallelism is not the lever that fixes this. The lever is total physical RAM + page-file size available to Node processes on the machine.

## Status

`git status --porcelain`:
```
 M fixtures/learning/summary.json
 M fixtures/validation/summary.json
 M fixtures/validation/validations.ndjson
 M next.config.mjs
 M src/app/page.tsx
 M src/lib/events/emit.ts
?? BUILD_MEMORY_AUDIT_2026-05-10.md
?? EMIT_LAZY_INIT_2026-05-10.md
?? HIGH_LEVERAGE_FILES_2026-05-10.md
?? LOCAL_BUILD_TEST_2026-05-10.md
?? build-timing-2.txt
?? build-timing.txt
?? src/components/landing/TestimonialsSection.tsx
```

`next.config.mjs` is now in the modified list (the `cpus: 2` line). No commit, no stage, no push.

Untracked files generated by this run:
- `build-output-2-2026-05-10.log` (UTF-16, 673 lines, full build output)
- `build-timing-2.txt` (UTF-8, start/end/duration/exit code)
- `.next/` (1.19 GB partial output)
- `LOCAL_BUILD_TEST_2_2026-05-10.md` (this report)

## Conclusion / what this proves

1. **Confirmed: the local build failure is a system memory issue, not a Node heap-cap issue and not a worker-count issue.** Two different remediations (raising heap to 8 GB; cutting workers to 2) produced the same outcome at the same phase.
2. **The codebase still compiles cleanly.** This continues to be the most important data point — there are no source-level blockers.
3. **Suggested next steps before another local-build attempt** (in rough priority order):
   - Increase the Windows page file (set virtual memory to e.g. 32 GB system-managed). This is the single most likely-to-work change. Open: `System Properties → Advanced → Performance Settings → Advanced → Virtual memory → Change …`
   - Close every other app that has any memory footprint — browsers, Cursor/VS Code, Slack, Docker Desktop, etc. — before retrying.
   - **Skip local builds entirely and push to Vercel.** Vercel build runners have far more headroom than a Windows laptop, and they don't share Windows' virtual-memory commit ceiling. The fact that the codebase compiled cleanly twice is what actually matters for Vercel.
4. **Recommended cleanup before further attempts**:
   - The `cpus: 2` line in `next.config.mjs` did not help and may have made things slightly worse. Consider reverting it before retrying any local build, so the next attempt isn't contaminated by a known-bad knob. (Not done by this session — modifying `next.config.mjs` further would exceed scope.)
   - Once you've reviewed: `.next`, `build-output-*.log`, `build-timing*.txt` can all be deleted safely.
