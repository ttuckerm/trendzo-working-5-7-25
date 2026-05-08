# Phase 1.6 — Fix Outcome

- **Date:** 2026-05-03
- **Branch:** vercel-deploy-test
- **Commit:** `da993d9b1e8ea014e1425c835d17f5885a0d0a33`
- **Vercel deploy URL:** https://trendzo-test-5xj4tryh6-tommys-projects-e3a941fb.vercel.app
- **Outcome:** **STILL_OOM** — build progressed past the timeout/page-data hang point but the container still terminated with SIGKILL after ~26 minutes.

---

## Pre-flight

| Check | Result |
|---|---|
| PF1 — branch == `vercel-deploy-test` | PASS |
| PF2 — last commit == `06024988f7e8de7f4cc57f6b24ee51f8e98d875c` (Phase 1.5) | PASS |
| PF3 — `FORCE_DYNAMIC_TARGET_LIST_2026-05-03.csv` present (restored from baseline) | PASS |
| PF4 — target row count == 640 | PASS |
| PF5 — all 640 target files exist on disk | PASS (0 missing) |

---

## Edit summary

- **Files edited:** 640
- **Files skipped (defensive re-check found existing dynamic export):** 0
- **Files inserted at top (no imports):** 0
- **Files failed:** 0
- **Line endings:** all 640 files were CRLF on disk; preserved as CRLF on rewrite.

### Encoding regression and recovery

Initial pass used `Get-Content -Raw` which silently used the system default (Windows-1252) encoding. Files containing non-ASCII characters (emojis, smart quotes) were corrupted (e.g. `📍` → `ðŸ"`).

- Detected via `git diff --shortstat` showing `2847 insertions(+), 927 deletions(-)` — far above the expected `~1920 insertions, 0 deletions`.
- Reverted with `git checkout -- .` (clean revert; no commit existed yet).
- Re-ran with `[System.IO.File]::ReadAllText($path, [System.Text.UTF8Encoding]::new($false))` to force UTF-8 reads.
- Final diff: `640 files changed, 1921 insertions(+), 1 deletion(-)`.
  - The single deletion is one file (`src/app/api/intel/orchestrate/route.ts`) which had a UTF-8 BOM at the start. UTF-8 readers strip the BOM and the rewrite emits no BOM. This is a benign normalization.

---

## Diff sanity check

| Metric | Value |
|---|---|
| `git diff --name-only` row count | 640 |
| `git diff --shortstat` | `640 files changed, 1921 insertions(+), 1 deletion(-)` |
| Files with `>5` line diff | 0 |
| Spot-check of 5 random files | PASS — all show `imports → blank → marker comment → export const dynamic = 'force-dynamic' → blank → body` |

Spot-checked files:
- `src/app/api/studio/quick-predict/route.ts`
- `src/app/api/recs/metrics/route.ts`
- `src/app/api/schedule/suggest/route.ts`
- `src/app/api/admin/mission-control/restart/route.ts`
- `src/app/api/admin/jobs/list/route.ts`

---

## Commit & push

- **Commit SHA:** `da993d9b1e8ea014e1425c835d17f5885a0d0a33`
- **Commit stats:** `640 files changed, 1921 insertions(+), 1 deletion(-)`
- **Push result:** `0602498..da993d9  vercel-deploy-test -> vercel-deploy-test` (clean fast-forward, no rejection)

---

## Vercel build outcome

**Classification: STILL_OOM**

Timeline (UTC):
- 22:24:xx — deploy queued
- 22:27:xx — build container provisioned, npm install starts
- 22:29:32 — webpack compile finishes, "Skipping validation of types / Skipping linting"
- 22:29:34 — **"Collecting page data ..."** begins
- 22:29:38 — first env-var warnings emitted (`APIFY_API_TOKEN is not set`, etc.)
- 22:29:46 — last stdout line written (a `punycode` deprecation warning)
- 22:29:46 → 22:50:34 — **20 minutes 48 seconds of silent work** (no log output)
- 22:50:34 — `Error: Command "npm run build" exited with SIGKILL`
- 22:51:21 — Vercel build-system report: `At least one "Out of Memory" ("OOM") event was detected during the build.`

### Critical observation: the failure mode CHANGED

Phase 1.5 (commit 0602498) build log showed:
- 617 explicit `Static page generation timeout` lines for individual routes
- Each route hung for >60s before being flagged
- Container OOM'd at the 8 GB ceiling

Phase 1.6 (commit da993d9) build log shows:
- **Zero timeout lines.** No route is being executed at build time.
- Build enters "Collecting page data" then goes silent for 21 minutes, then SIGKILL.

This means **the page-handler-execution OOM is fixed** — the 640 routes are no longer being invoked at build time. But there is a **second, distinct OOM** that surfaces during module loading / page-data collection itself.

### Likely root causes (for Tommy to triage)

1. **Module-level side effects in `src/lib/`** — many route files import lib modules that run code on import (Supabase client construction, scheduler initialization, env-var checks, model/registry hydration). Next.js loads every route module to compute the route manifest, even for `dynamic = 'force-dynamic'` routes. If 700+ modules each instantiate a few singletons, total memory grows fast.
   - Evidence: the env-var warnings in the log (`APIFY_API_TOKEN not set`, `KLING_ACCESS_KEY not set`, `Apify scraping will not work`) were emitted from module-load code paths, proving lib/ modules execute at build time.

2. **Page routes (`src/app/**/page.tsx`)** — Phase 1.6 only touched `/api/` route files. There are also page routes that may be running getServerSideProps-equivalent / server component data fetching at build time. These were *not* in the 640 list.

3. **The ~127 API routes that already had `force-dynamic`** — they don't time out, but their module imports still load. Same module-level side-effect risk.

### Build log excerpt (last 60 lines)

```
2026-05-03T22:29:32.726Z  Skipping linting
2026-05-03T22:29:34.205Z  Collecting page data ...
2026-05-03T22:29:38.257Z  Warning: APIFY_API_TOKEN is not set. TikTok scraping will likely fail.
2026-05-03T22:29:38.258Z  Warning: TIKTOK_SCRAPER_ACTOR_ID is not set. Using default value.
2026-05-03T22:29:41.149Z  ⚠️  APIFY_API_TOKEN not set - Apify scraping will not work
2026-05-03T22:29:41.227Z  KLING_ACCESS_KEY or KLING_SECRET_KEY not set - video generation will fail
2026-05-03T22:29:41.801Z  ⚠️ APIFY_API_TOKEN not set - will use mock data in development
[... ~14 punycode deprecation warnings, last at 22:29:46.390Z ...]
2026-05-03T22:50:34.762Z  Error: Command "npm run build" exited with SIGKILL
2026-05-03T22:51:21.381Z  ▲ Build system report
2026-05-03T22:51:21.439Z  • At least one "Out of Memory" ("OOM") event was detected during the build.
2026-05-03T22:51:21.443Z  • This occurs when processes or applications running during the build completely fill up the available memory (RAM) in the build container. When this happens, the build container terminates one of the processes during the build with a SIGKILL signal.
```

Full log saved to `vercel_phase1_6_log.txt` (107 KB, 872 lines).

---

## What I changed

- **640 API route files** under `src/app/api/**/route.ts` — added `export const dynamic = 'force-dynamic'` immediately after the last import statement.
- The change was atomic, in one commit (`da993d9`), reversible via `git revert da993d9` (no merge, no rebase, no force-push).

## What I did NOT do

- Did NOT modify any source file other than the 640 route files.
- Did NOT touch `package.json`, `vercel.json`, `next.config.mjs`, or any config.
- Did NOT touch any `page.tsx`, `layout.tsx`, server component, or non-route file.
- Did NOT touch `src/lib/`, `src/components/`, `src/types/`, etc.
- Did NOT run `npm install` or `npm run build` locally.
- Did NOT touch the `main` branch.
- Did NOT force-push.
- Did NOT modify any investigation report (`PHASE1_*.md`, `BUILD_TIMEOUT_*.md`, `JSON_RENDER_*.md`, `OB_*.md`).
- Did NOT modify any of the 21 stashed WIP files.
- Did NOT commit `FORCE_DYNAMIC_TARGET_LIST_2026-05-03.csv` or `.txt` (they remain untracked at repo root for reference).

---

## Next steps

The page-handler-execution OOM is fixed. A second, deeper OOM remains: **module-load OOM during `Collecting page data`**.

Recommended diagnostic options for Phase 1.7:

1. **Increase build memory ceiling.** Easiest. Set `NODE_OPTIONS=--max-old-space-size=12288` (or higher) in Vercel env vars. May be a one-line workaround if the codebase is just genuinely large.
2. **Find the heaviest module-load offenders.** Add `--cpu-prof` or `--heap-prof` to the build command, or add `console.log` markers in suspected lib initializers (Supabase client wrappers, scheduler bootstrapping, prediction registry) and re-deploy to find which modules push memory over the edge.
3. **Audit `src/app/**/page.tsx` for build-time data fetching.** Add `export const dynamic = 'force-dynamic'` to non-public pages too, so they're not pre-rendered.
4. **Lazy-import expensive lib modules from inside route handlers** rather than at module top-level, so they only load when an actual request arrives.

Tommy can paste the log and this report to a follow-up Claude conversation to plan Phase 1.7.

---

## Standing principle compliance

- WIP files: stashed (`stash@{0}: pre-phase1.6-wip-2026-05-03`), patch backups in baseline dir.
- Investigation reports: untouched.
- Reversibility: `git revert da993d9` is a single command and produces a clean revert (no merge conflicts expected — the 640 changes are surgical, additive, and isolated).
- No force-push, no rebase, no main-branch touch.

---

## Stash + Pop Outcome

### Stash creation (E1)
- Command: `git stash push --include-untracked -m "pre-phase1.6-wip-2026-05-03"`
- Result: `Saved working directory and index state On vercel-deploy-test: pre-phase1.6-wip-2026-05-03`
- 6 Windows permission warnings on directory cleanup (`public/images/logos/`, `scripts/temp/`, `src/app/(dashboard)/analytics/remix-stats/`, `src/app/(dashboard)/editor/`, `src/app/api/templates/analytics/test/`, `src/app/auth/bypass-auth/`) — same Phase 1.5 pattern, does not affect stash contents.
- Tracked files remained dirty after stash; resolved with `git checkout HEAD -- <21 paths>` (replicating the Phase 1.5 escape hatch).
- Verified clean tree (`git status --porcelain` → 0 lines) before proceeding.

### Patch backups (E2)
- `stash-tracked.patch`: **63,738 bytes**
- `stash-full.patch` (incl. untracked): **981,097 bytes**
- Both well above the 1 KB safety threshold.
- Baseline directory: `C:\Users\thoma\AppData\Local\Temp\trendzo-phase1.6-baseline-20260503-181548`
- Baseline contents: PRE_STASH_STATUS.txt, PRE_STASH_DIFF_STAT.txt, PRE_STASH_UNTRACKED.txt, target-list.csv, target-list.txt, stash-tracked.patch, stash-full.patch, stash-pop-output.txt.

### Stash pop (E14)
- Command: `git stash pop`
- Result: **partial success**.
  - Tracked files: all 21 modifications/deletions **restored byte-identically** (verified by `git diff --stat` matching `PRE_STASH_DIFF_STAT.txt` exactly).
  - Untracked files: all critical items restored to disk by the pop.
  - One conflict: `FORCE_DYNAMIC_TARGET_LIST_2026-05-03.csv already exists, no checkout`. This file was restored from the baseline copy during PF3 (pre-flight) and was therefore present when the pop tried to restore it from the stash.
  - Because of that single conflict, git **kept the stash entry on the stack** and exited non-zero. This is benign — it's a safety hold, not a data loss event.
- `stash@{0}` is **still present** as `pre-phase1.6-wip-2026-05-03`. Tommy can drop it manually with `git stash drop` once satisfied with the working tree state. Patch backups in the baseline dir provide a redundant safety net.

### Working tree integrity check (E14.1)

| Metric | Value |
|---|---|
| Pre-stash status lines | 48 |
| Post-pop status lines | 50 |
| Lost (in PRE but not POST) | 0 |
| Gained (in POST but not PRE) | 2 (`PHASE1_6_FIX_OUTCOME_2026-05-03.md`, `vercel_phase1_6_log.txt`) |
| Tracked diff stat (PRE vs POST) | **byte-identical** (`21 files changed, 471 insertions(+), 458 deletions(-)`) |

### Must-exist check on critical WIP items (26 files/reports)

All 26 critical items present:
- 18 of the 21 tracked WIP files (the other 3 are deletions, verified as `D` in `git status`).
- 5 untracked WIP source files: `src/components/assessment/SaveYourLinkNotice.tsx`, `supabase/migrations/20260430000000_assessment_share_token.sql`, plus the 3 deletion targets verified absent.
- 6 investigation reports: `PHASE1_BUILD_INVESTIGATION_2026-05-02.md`, `PHASE1_DECISIONS_INVESTIGATION_2026-05-02.md`, `PHASE1_VERCEL_AND_GITIGNORE_INVESTIGATION_2026-05-02.md`, `PHASE1_FINAL_DECISIONS_2026-05-02.md`, `JSON_RENDER_INVESTIGATION_2026-05-03.md`, `BUILD_TIMEOUT_INVESTIGATION_2026-05-03.md`.

### Final state

- Branch: `vercel-deploy-test`
- HEAD: `da993d9b1e8ea014e1425c835d17f5885a0d0a33` (Phase 1.6 commit)
- Remote: in sync (`origin/vercel-deploy-test` at same SHA)
- Stash: `stash@{0}: pre-phase1.6-wip-2026-05-03` retained as safety net
- Untracked WIP files: all present
- Tracked WIP modifications: all present and byte-identical to pre-stash
- Patch backups: present at `C:\Users\thoma\AppData\Local\Temp\trendzo-phase1.6-baseline-20260503-181548\`

**No WIP file was lost. No investigation report was modified. No file outside the 640-route-list was edited.**
