# Phase 1.5 — Fix Outcome
Date: 2026-05-03
Branch: vercel-deploy-test
Commit: 06024988f7e8de7f4cc57f6b24ee51f8e98d875c
Vercel deploy URL: https://trendzo-test-mb0t7xvet-tommys-projects-e3a941fb.vercel.app
Outcome: BUILD_FAILED (new failure mode — install fix succeeded; static page generation timeout / OOM)

## Headline

The Phase 1.5 fix achieved its scoped goal:
- `npm install --legacy-peer-deps` resolved cleanly on Vercel (1618 packages installed in 1m, no `ERESOLVE`).
- The previous Phase 1.0 install-time failure (`@json-render/react@0.15.0` peer-dep conflict with `react@18.2.0`) is fully resolved.

A new and unrelated failure surfaced during Next.js's static-page-generation phase: pages restarted 3× because each page exceeded a 60-second generation budget, and the build container hit at least one OOM event. This is an entirely separate failure mode from the install-resolution issue this prompt was scoped to fix.

Per prompt instructions, no fix attempt was made for the new failure. Outcome reported only.

## Pre-flight (PF1–PF6)

- PF1 (branch `vercel-deploy-test`): OK
- PF2 (HEAD = `dccf1b59bb0dceb41a195debdc3d31855334a006`): OK
- PF3 (`Test-Path vercel.json`): OK
- PF4 (current `installCommand` = `"npm install"`): OK
- PF5 (`crons.Count` = 6): OK
- PF6 (captured `vercel.json.before` to baseline, 677 bytes): OK

All pre-flight passed.

## Edit

```diff
diff --git a/vercel.json b/vercel.json
index 9c8883a..8fc457c 100644
--- a/vercel.json
+++ b/vercel.json
@@ -1,6 +1,6 @@
 {
   "framework": "nextjs",
-  "installCommand": "npm install",
+  "installCommand": "npm install --legacy-peer-deps",
   "buildCommand": "npm run build",
   "outputDirectory": ".next",
   "crons": [
```

Post-edit verification:
- `installCommand` → `'npm install --legacy-peer-deps'` ✓
- `crons.Count` → 6 (unchanged) ✓
- `framework` → `'nextjs'` (unchanged) ✓
- `buildCommand` → `'npm run build'` (unchanged) ✓
- `outputDirectory` → `'.next'` (unchanged) ✓
- `git diff` shows exactly one line removed and one added, both `installCommand`. No collateral edits.

## Commit & push

Commit SHA: `06024988f7e8de7f4cc57f6b24ee51f8e98d875c`
Stat: 1 file changed, 1 insertion(+), 1 deletion(-)

```
git push origin vercel-deploy-test
   dccf1b5..0602498  vercel-deploy-test -> vercel-deploy-test
```

Fast-forward push from `dccf1b5` (Phase 1) to `0602498` (Phase 1.5). No rejection. Not force-pushed.

## Vercel build outcome

Classification: **BUILD_FAILED**

Reasoning: install passed cleanly, Next.js compile finished (with non-fatal warnings), but the Next.js export / static-page-generation phase failed.

### Install phase — SUCCEEDED

```
2026-05-03T19:34:32.478Z  Running "install" command: `npm install --legacy-peer-deps`...
2026-05-03T19:35:46.301Z  added 1618 packages, and audited 1619 packages in 1m
```

No `ERESOLVE`. No `npm error code`. Vercel detected and used the new install command exactly as written. Install completed in ~74 seconds. The Phase 1 → Phase 1.5 install regression is fully fixed.

### Compile phase — SUCCEEDED with non-fatal warnings

```
2026-05-03T19:35:46.618Z  Detected Next.js version: 14.2.33
2026-05-03T19:35:46.619Z  Running "npm run build"
2026-05-03T19:35:48.110Z  ▲ Next.js 14.2.33
2026-05-03T19:35:48.211Z  Creating an optimized production build ...
...
2026-05-03T19:38:58.339Z  ⚠ Compiled with warnings
2026-05-03T19:38:58.340Z  ./src/app/admin/apify-scraper/page.tsx
2026-05-03T19:38:58.340Z  Attempted import error: 'supabaseClient' is not exported from '@/lib/supabase/client' (imported as 'supabaseClient').
```

Compile time: ~3m 10s (19:35:48 → 19:38:58). Tailwind ambiguous-class warnings + a single `Attempted import error` for `supabaseClient` in `src/app/admin/apify-scraper/page.tsx` — none fatal at compile time (Next.js continues).

### Static page generation phase — FAILED

```
2026-05-03T19:38:58.756Z  Collecting page data ...
...
(many routes' static page generation restarted because each took >60 seconds)
2026-05-03T19:49:54.460Z  ⚠ Restarted static page generation for /<route> because it took more than 60 seconds   (40+ routes affected)
...
2026-05-03T19:50:54.487Z  ⚠ Sending SIGTERM signal to Next.js build worker due to timeout of 60 seconds. Subsequent errors may be a result of the worker exiting.
2026-05-03T19:50:54.997Z  ⨯ Next.js build worker exited with code: null and signal: SIGTERM
2026-05-03T19:50:55.058Z  > Build error occurred
2026-05-03T19:50:55.061Z  Error: Static page generation for /api/admin/integration/dryrun_replay_81225 is still timing out after 3 attempts. See more info here https://nextjs.org/docs/messages/static-page-generation-timeout
2026-05-03T19:50:55.248Z  Error: Command "npm run build" exited with 1
```

### Vercel build system report (post-failure)

```
2026-05-03T19:50:57.338Z  ▲ Build system report
2026-05-03T19:50:57.338Z  ▲ To always completely log this report, add VERCEL_BUILD_SYSTEM_REPORT=1 as an Environment Variable to your project.
2026-05-03T19:50:57.338Z  • At least one "Out of Memory" ("OOM") event was detected during the build.
2026-05-03T19:50:57.339Z  • This occurs when processes or applications running during the build completely fill up the available memory (RAM) in the build container. When this happens, the build container terminates one of the processes during the build with a SIGKILL signal.
2026-05-03T19:50:57.339Z  • Read this troubleshooting guide for more information: https://vercel.link/troubleshoot-build-errors
```

Build container: 2 cores, 8 GB RAM (Vercel default Hobby/Pro tier).

### Build phase timeline

| Phase | Start | End | Duration | Outcome |
|---|---|---|---|---|
| Clone | 19:34:19 | 19:34:28 | 8.7s | OK |
| Install (`npm install --legacy-peer-deps`) | 19:34:32 | 19:35:46 | 1m 14s | **OK — Phase 1.5 fix verified** |
| Compile (`next build`) | 19:35:48 | 19:38:58 | 3m 10s | OK (with warnings) |
| Page-data collection / static export | 19:38:58 | 19:50:55 | 12m | **FAILED — timeout + OOM** |
| Total | 19:34:19 | 19:50:57 | ~16m 38s | Error |

### Routes that hit the 60-second static-generation timeout (sample)

40+ routes restarted at 19:49:54. Examples: `/settings`, `/sound-trend-test`, `/sound-trends`, `/studio/creator`, `/studio/dashboard`, `/system-status`, `/template-preview`, `/templates-browse`, `/templates`, `/trend-predictions`, `/viral-analyzer`, `/viral-dna-report`, `/viral-lab-entry/dna-analysis`, `/viral-lab-entry/manual-analysis`, `/viral-lab-entry/onboarding/goal`, `/viral-lab-entry/onboarding/niche`, `/viral-lab-entry`, `/viral-lab-entry/video-gallery`, `/viral-template-landing`, …

The route that hit the 3-restart fatal limit: `/api/admin/integration/dryrun_replay_81225`.

This pattern (many restarts plus an explicit OOM event) is characteristic of:
- Module-level code in pages making real network calls (Supabase, OpenAI, Anthropic, Stripe, Apify, Beehiiv, etc.) at static-render time without a missing-credential bailout, OR
- Memory-heavy module imports (per `app-route.runtime.prod.js`/`24139.js` in the trace, the `_useSession` / `_loadSession` path inside Supabase auth runs at build time from server pages), AND
- Aggregate memory pressure tipping the 8 GB build container into OOM.

Diagnosis is out of scope for Phase 1.5. This needs its own investigation prompt.

## What I changed

- `vercel.json`: `installCommand` changed from `"npm install"` to `"npm install --legacy-peer-deps"`.

That is the entire diff for commit `0602498`. One file, one line.

## What I did NOT do

- Did not touch any other field in `vercel.json` (verified: framework, buildCommand, outputDirectory, crons all unchanged).
- Did not touch `package.json`.
- Did not touch `package-lock.json`.
- Did not run `npm install` locally.
- Did not modify any source files.
- Did not modify any investigation reports (`PHASE1_*.md`, `JSON_RENDER_INVESTIGATION_2026-05-03.md`, `PHASE1_FIX_OUTCOME_2026-05-02.md`).
- Did not touch the `main` branch.
- Did not force-push.
- Did not attempt to fix the new BUILD_FAILED failure mode — per prompt instructions, paste log to Claude, do not improvise.
- Did not delete or "clean up" anything.

## Next steps

The Phase 1.5 prompt was scoped to fix the install-time `ERESOLVE` failure. That is done.

The new failure (static-page-generation timeout / OOM during `next build`'s export phase) is a Phase 2 issue. It is structurally different from anything Phase 1 was meant to address and needs its own investigation:

1. Why are 40+ pages taking >60 seconds each at static-generation time?
2. What is `/api/admin/integration/dryrun_replay_81225` doing during build that 3 retries can't unblock?
3. Where is the OOM coming from — module-level network calls, large data imports, memory leaks in Supabase session loading at build time?
4. Should affected routes be marked `dynamic = 'force-dynamic'` (skip static gen) or have build-time bailouts when env vars are missing?

The build log (`vercel_phase1_5_log.txt`, 353 KB / 4927 lines) is the primary evidence base. Paste to Claude for a follow-up investigation prompt; do not attempt to fix in this session.

The two fix prompts that were originally queued behind Phase 1.5 (e.g. Vercel project consolidation) remain blocked until the build is green.

## Stash + Pop Outcome

Baseline directory: `C:\Users\thoma\AppData\Local\Temp\trendzo-phase1.5-baseline-20260503-152706`

Backup files in baseline:
- `PRE_STASH_STATUS.txt` — 43 lines (21 WIP + 4 PHASE1 MDs + 1 JSON_RENDER report + 17 prior-run output files)
- `PRE_STASH_DIFF_STAT.txt`
- `PRE_STASH_UNTRACKED.txt`
- `vercel.json.before` — 677 bytes
- `stash-tracked.patch` — 63,738 bytes
- `stash-full.patch` — 449,869 bytes
- `push_output.txt`
- `stash-pop-output.txt` — 4,882 bytes

### Stash push

`git stash push --include-untracked -m "pre-phase1.5-wip-2026-05-03"` reported the expected save line:

```
Saved working directory and index state On vercel-deploy-test: pre-phase1.5-wip-2026-05-03
```

Six cosmetic permission warnings followed (`warning: failed to remove <empty-dir>/: Permission denied` on directories like `public/images/logos/`, `scripts/temp/`, `src/app/(dashboard)/analytics/remix-stats/`, etc.). These are the same Windows-permission cosmetic warnings as the previous run; the stash entry itself was saved correctly. Per the prompt's P1 contingency block, the residual tracked-file dirty state was finished off via:

```
git checkout HEAD -- $paths   # 21 paths from PRE_STASH_STATUS.txt
```

Result: clean working tree confirmed in P3.

Patch backups:
- `stash-tracked.patch`: 63,738 bytes
- `stash-full.patch`: 449,869 bytes

Both substantially non-zero.

### Stash pop

`git stash pop` ran cleanly. No conflict markers. Output trailer:

```
Dropped refs/stash@{0} (9edd17cf7b56fc822194a07c3f5fc7f044bc7128)
```

### Pre/post pop diff

| Metric | Value |
|---|---|
| `POP_DIFF_LOST.txt` lines | 0 |
| `POP_DIFF_GAINED.txt` lines | 2 |

Gained items (both expected new outputs from this session):
- `?? PHASE1_5_FIX_OUTCOME_2026-05-03.md`
- `?? vercel_phase1_5_log.txt`

Lost items: none.

### Must-exist verification

All 28 expected items present after pop:

| # | Path | Status |
|---|---|---|
| 1 | `src/app/(public)/free/freedom-os/FreedomOSTool.tsx` | ✓ M |
| 2 | `src/app/api/assessment/email-capture/route.ts` | ✓ M |
| 3 | `src/app/api/assessment/email-status/route.ts` | ✓ M |
| 4 | `src/app/api/assessment/generate/route.ts` | ✓ M |
| 5 | `src/app/api/assessment/sprint-progress/route.ts` | ✓ M |
| 6 | `src/app/api/freedom-agent/chat/route.ts` | ✓ M |
| 7 | `src/app/api/freedom-agent/conversation/route.ts` | ✓ M |
| 8 | `src/app/api/landing/email-notify/route.ts` | ✓ M |
| 9 | `src/app/assessment/[assessmentId]/page.tsx` | ✓ M |
| 10 | `src/components/assessment/AgentGate.tsx` | ✓ M |
| 11 | `src/components/assessment/AgentRail.tsx` | ✓ M |
| 12 | `src/components/assessment/AssessmentHUD.tsx` | ✓ M |
| 13 | `src/components/assessment/Day1Spotlight.tsx` | ✓ M |
| 14 | `src/components/assessment/SprintGrid.tsx` | ✓ M |
| 15 | `src/components/landing/CloseSection.tsx` | ✓ M |
| 16 | `src/lib/assessment/fetch-assessment.ts` | ✓ M |
| 17 | `src/lib/beehiiv/notify.ts` | ✓ M |
| 18 | `src/types/freedom-agent.ts` | ✓ M |
| 19 | `src/app/(public)/recover/RecoverForm.tsx` | ✓ D |
| 20 | `src/app/(public)/recover/page.tsx` | ✓ D |
| 21 | `src/app/api/recover-link/route.ts` | ✓ D |
| 22 | `src/components/assessment/SaveYourLinkNotice.tsx` | ✓ ?? |
| 23 | `supabase/migrations/20260430000000_assessment_share_token.sql` | ✓ ?? |
| 24 | `PHASE1_BUILD_INVESTIGATION_2026-05-02.md` | ✓ ?? |
| 25 | `PHASE1_DECISIONS_INVESTIGATION_2026-05-02.md` | ✓ ?? |
| 26 | `PHASE1_VERCEL_AND_GITIGNORE_INVESTIGATION_2026-05-02.md` | ✓ ?? |
| 27 | `PHASE1_FINAL_DECISIONS_2026-05-02.md` | ✓ ?? |
| 28 | `JSON_RENDER_INVESTIGATION_2026-05-03.md` | ✓ ?? |

Missing items: **0**.

### Final stash list

```
git stash list
(empty)
```

Stash is empty. The Phase 1.5 stash entry (`9edd17cf7b56fc822194a07c3f5fc7f044bc7128`) was popped and dropped successfully. No pre-existing stashes remain. Patch backups at the baseline directory are still on disk as a secondary safety net but no longer needed.

Tommy's WIP is fully restored. Branch `vercel-deploy-test` is at commit `06024988f7e8de7f4cc57f6b24ee51f8e98d875c`.
