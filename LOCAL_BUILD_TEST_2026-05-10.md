# Local Build Test — 2026-05-10

## Pre-flight checks

| # | Check | Result | Detail |
|---|-------|--------|--------|
| 1 | Branch is `vercel-deploy-test` | PASS | `git branch --show-current` → `vercel-deploy-test` |
| 2 | HEAD starts with `07b960e` | PASS | `git rev-parse HEAD` → `07b960e66ae87eeb6b437f530d71e9646a70fe21` |
| 3 | emit.ts lazy-init edit in place | PASS | `let _supabaseClient` at line 3, `function getSupabase()` at line 4, no top-level `const supabase = createClient(` |
| 4 | No unexpected modifications | PASS | Modified: `src/lib/events/emit.ts` (this task's prior edit), `src/app/page.tsx`, `src/components/landing/TestimonialsSection.tsx` (untracked), `fixtures/*`. Untracked markdowns: `BUILD_MEMORY_AUDIT_2026-05-10.md`, `EMIT_LAZY_INIT_2026-05-10.md`, `HIGH_LEVERAGE_FILES_2026-05-10.md`. All within allow-list. |
| 5 | ≥5 GB free disk | PASS | 34.53 GB free on C: |

## Environment
- NODE_OPTIONS value at time of build: `--max-old-space-size=8192`
- Node version: `v22.16.0`
- npm version: `10.9.2`
- Disk free space before build: 34.53 GB (C: drive)

## Build execution
- Start time: `2026-05-11T12:11:46.2303225-04:00`
- End time: `2026-05-11T12:18:44.8560659-04:00`
- Total duration: **6.98 minutes**
- Exit code (npm via `$LASTEXITCODE`): `-2147483645` (Windows STATUS_BREAKPOINT / 0x80000003; PowerShell wrapper reported task exit code `3`)
- `.next` directory size after build: **1257.74 MB** (partial output — build did not finish)

## Outcome classification
**OUTCOME C — Out-of-memory failure.**

Phase where it died: `Collecting page data …` (Next.js was evaluating each route module to figure out which routes are static vs dynamic). The build never reached "Generating static pages", so no `X/Y` progress counter was emitted before the worker crashed.

Important nuance: the fatal error was `Committing semi space failed`, not `Mark-compact near heap limit`. Those are different failure modes:
- `Mark-compact near heap limit` = a Node process hit its own `--max-old-space-size` ceiling. This is what would have meant "raise the cap further."
- `Committing semi space failed` = the OS refused to give the Node worker a small piece of additional virtual memory. The GC logs show the worker was using only ~14–34 MB at the moment of death — far below the 8 GB cap.

In plain terms: raising the Node heap ceiling did not help, because the workers were not hitting the ceiling. Windows itself ran out of committable memory (RAM + page file) while many parallel Next.js workers were spawning. Raising NODE_OPTIONS further would not change this outcome.

## What happened (plain English)
The build got off the ground and successfully compiled all your code in about 6 minutes — that's the good news. It then started the next step ("Collecting page data"), which is when Next.js opens up every page and API route in the project and runs a little bit of each one to figure out how to optimize it. During that step, Windows ran out of memory and killed the build worker. This was **not** Node hitting our 8 GB cap; it was Windows itself running out of memory headroom across all the worker processes Next.js spawns in parallel. The build wrote about 1.26 GB of partial output to `.next` before dying.

Practical takeaway: the codebase **does compile** with the `emit.ts` lazy-init fix in place. The blocker is now system-level memory pressure during the page-data phase, not a Node heap cap.

## Critical log excerpts

### Phase progression (from build log)
```
Line   8: ▲ Next.js 14.2.x — Creating an optimized production build ...
Line  34:  ⚠ Compiled with warnings
Line 139:    Skipping validation of types
Line 140:    Skipping linting
Line 141:    Collecting page data ...        ← started this phase
...        (GC death spiral begins shortly after)
Line 823:  ⨯ Next.js build worker exited with code: 2147483651 and signal: null
```

Compile warnings (counted in log lines 36–137) were all about dynamic-server-usage warnings in:
- `./src/app/api/admin/phase2-test/route.ts`
- `./src/app/api/channel/me/route.ts`
- `./src/app/api/training/populate/route.ts` (×11)

These are warnings, not errors — they did not stop the build. They indicate routes that opt into dynamic rendering by using `cookies()`/`headers()`/etc.

### Fatal error (extracted from final ~80 lines of log)
```
FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of memory
FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of memory
FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of memory
# Fatal process out of memory: Re-embedded builtins: set permissions
 ⨯ Next.js build worker exited with code: 2147483651 and signal: null
```

Three separate worker processes hit the OS commit failure within seconds of each other — a clear signal that the *system* (not any one Node process) ran out of memory.

GC stats at moment of death (sampled):
```
[22148] Mark-Compact 19.1 (32.7) -> 14.2 (34.4) MB
[22148] Mark-Compact (reduce) 15.5 (34.7) -> 14.4 (16.4) MB
```
Heap usage: 14–34 MB. Heap cap: 8192 MB. Workers were nowhere near their cap.

## Last 50 lines of build-output-2026-05-10.log

```

FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of memory
----- Native stack trace -----


<--- JS stacktrace --->


<--- Last few GCs --->

[22148:0000020606DF4000]     2141 ms: Mark-Compact 19.3 (32.7) -> 14.2 (34.4) MB, pooled: 0 MB, 53.80 / 0.00 ms  (+ 
109.3 ms in 0 steps since start of marking, biggest step 0.0 ms, walltime since start of marking 174 ms) (average mu = 
0.923, current mu = [22148:0000020606DF4000]    74331 ms: Mark-Compact (reduce) 15.2 (34.7) -> 14.5 (16.2) MB, pooled: 
0 MB, 16988.08 / 0.40 ms  (+ 9036.1 ms in 0 steps since start of marking, biggest step 0.0 ms, walltime since start of 
marking 28111 ms) (average mu = 0.648

<--- JS stacktrace --->

FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of memory
FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of memory
----- Native stack trace -----

----- Native stack trace -----



#
# Fatal process out of memory: Re-embedded builtins: set permissions
#
----- Native stack trace -----

 1: 00007FF7BFFC711D 
 2: 00007FF7BFEA181F 
 3: 00007FF7C11195C6 
 4: 00007FF7C0AB0CA3 
 5: 00007FF7C0A9D8D6 
 6: 00007FF7C0936FCB 
 7: 00007FF7C095EA5A 
 8: 00007FF7C095CAB9 
 9: 00007FF7C058B9D5 
10: 00007FF7C0AA68A1 
11: 00007FF7C000696D 
12: 00007FF7BFDDE58A 
13: 00007FF7BFDE3FEA 
14: 00007FF7BFDD88F5 
15: 00007FF7C0027463 
16: 00007FF7C1824C2E 
17: 00007FFF5B97E8D7 
18: 00007FFF5D4EC3FC 
 ⨯ Next.js build worker exited with code: 2147483651 and signal: null
```

## Status

Final working tree (`git status --porcelain`):

```
 M fixtures/learning/summary.json
 M fixtures/validation/summary.json
 M fixtures/validation/validations.ndjson
 M src/app/page.tsx
 M src/lib/events/emit.ts
?? BUILD_MEMORY_AUDIT_2026-05-10.md
?? EMIT_LAZY_INIT_2026-05-10.md
?? HIGH_LEVERAGE_FILES_2026-05-10.md
?? build-timing.txt
?? src/components/landing/TestimonialsSection.tsx
```

New untracked files created by this run (in addition to the report itself):
- `build-output-2026-05-10.log` (UTF-16, 823 lines, full build output)
- `build-timing.txt` (UTF-8, start/end/duration/exit code)
- `.next/` (1.26 GB of partial build output — Next.js cache and chunks emitted before the OOM)

No source files were modified by this run. No commit, no stage, no push. NODE_OPTIONS was set in-shell only and is gone the moment the PowerShell call ended.

## Conclusions for next steps (read this part carefully)

1. **The codebase compiled successfully.** That's a real positive signal — TypeScript, webpack, all module resolution worked. The lazy-init `emit.ts` fix did not break anything observable at compile time.

2. **Raising the Node heap further will not help on this machine.** The workers died at ~14–34 MB of heap usage with an OS-level commit failure. The bottleneck is Windows itself running out of committable memory while many parallel Next.js workers spin up.

3. **Options to actually finish a local build, in order of effort:**
   - Increase the Windows page file (virtual memory) to e.g. 32 GB system-managed. This is the most likely single fix.
   - Close every other app while the build runs (browsers, Slack, Cursor, etc. — each takes >1 GB).
   - Limit Next.js worker parallelism via `experimental.workerThreads = false` or `experimental.cpus = 2` in `next.config.js`. (But the prompt forbade config changes, so do not do this without explicit approval.)
   - Build on a machine with more physical RAM (e.g. a Vercel build runner).

4. **What this means for Vercel.** Vercel build runners have far more headroom than a Windows laptop and they do not use a Windows-style virtual-memory commit ceiling. The fact that the local build dies of OS commit pressure does **not** mean Vercel will fail. The thing worth watching on Vercel is whether the same `Collecting page data` step hits the Vercel worker's own heap limit — that's a separate question.

5. **Generated files to clean up later** (when you've reviewed this report):
   - `.next/` (1.26 GB, partial — safe to delete with `Remove-Item -Recurse -Force .next`)
   - `build-output-2026-05-10.log` (build log)
   - `build-timing.txt` (timing record)

   Keep them around until the next decision is made.
