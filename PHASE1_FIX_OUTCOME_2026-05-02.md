# Phase 1 — Fix Outcome

**Date:** 2026-05-03 (Fix Prompt #1 dated 2026-05-02)
**Branch:** `vercel-deploy-test`
**Commit:** `dccf1b59bb0dceb41a195debdc3d31855334a006`
**Vercel deploy URL:** https://trendzo-test-63v9jrma5-tommys-projects-e3a941fb.vercel.app
**Outcome classification:** **`INSTALL_FAILED`** — but a NEW failure mode, not the prior `ERR_PNPM_OUTDATED_LOCKFILE`. The package-manager-lock objective succeeded; a second pre-existing dependency conflict is now exposed.

---

## Pre-flight (PF1–PF10)

| # | Check | Result |
|---|-------|--------|
| PF1 | branch == `vercel-deploy-test` | PASS (`vercel-deploy-test`) |
| PF2 | Four prior Phase 1 reports present | PASS (all four on disk; materialized from `stash@{0}^3` per wrapper protocol) |
| PF3 | Both lockfiles present | PASS (`package-lock.json` True, `pnpm-lock.yaml` True) |
| PF4 | `package.json` contains `"stripe"` | PASS (1 match) |
| PF5 | `.gitignore` line 60 == `data/` | PASS |
| PF6 | `.gitignore` line 75 == `tmp/` | PASS |
| PF7 | All 9 source files to recover present | PASS (all 9 `Test-Path` True) |
| PF8 | `git diff --stat` empty (no surprise tracked edits) | PASS (empty output) |
| PF9 | `git status --porcelain` captured | PASS — exactly 4 untracked PHASE1 reference MDs, no other entries |
| PF10 | npm available | PASS (`10.9.2`) |

PF9 verbatim:
```
?? PHASE1_BUILD_INVESTIGATION_2026-05-02.md
?? PHASE1_DECISIONS_INVESTIGATION_2026-05-02.md
?? PHASE1_FINAL_DECISIONS_2026-05-02.md
?? PHASE1_VERCEL_AND_GITIGNORE_INVESTIGATION_2026-05-02.md
```

---

## Step 1 — Package manager lock

**Status:** COMPLETED

- `vercel.json` edited to add `"installCommand": "npm install"` between `framework` and `buildCommand`. All other fields unchanged. Six cron entries preserved (`crons.Count == 6`).
- `pnpm-lock.yaml` deleted from disk. `package-lock.json` untouched.
- Post-step `git status --porcelain` showed exactly two tracked changes: ` M vercel.json`, ` D pnpm-lock.yaml`.

---

## Step 2 — `.gitignore` changes

**Status:** COMPLETED

Diff (S2.5 verbatim — only the four expected changes):

```
@@ -57,7 +57,7 @@ next-env.d.ts
 # scraped data
-data/
+/data/

@@ -72,7 +72,7 @@ scripts/*.log
 frameworks-and-research/
-tmp/
+/tmp/

@@ -89,3 +89,11 @@ taskmaster-config-mcp.json
 .vercel
+
+# Training-data exports — regenerable via /api/admin/training/export-data
+# (or `npx tsx src/lib/training/run_export_training_data.ts`).
+# Consumed only by local Python training scripts; never read by Vercel-built code.
+src/lib/training/data/
+
+# Autoresearch snapshots — README in autoresearch/data/ explicitly designates these as gitignored
+autoresearch/data/snapshot-*.json
```

Selectstring counts (S2.4):
- `^/data/$` → 1
- `^/tmp/$` → 1
- `^src/lib/training/data/$` → 1
- `^autoresearch/data/snapshot-\*\.json$` → 1
- `^data/$` (old unanchored) → 0
- `^tmp/$` (old unanchored) → 0

S2.6 — `git check-ignore -v` results for the 8 known `data/` directories:

| Directory | Result | Expected |
|-----------|--------|----------|
| `data` | IGNORED — `.gitignore:60:/data/` | STILL IGNORED ✓ |
| `src/lib/data` | NO LONGER IGNORED (exit 1) | NO LONGER IGNORED ✓ |
| `src/app/admin/operations/training/data` | NO LONGER IGNORED | NO LONGER IGNORED ✓ |
| `src/components/templateEditor-v2/data` | NO LONGER IGNORED | NO LONGER IGNORED ✓ |
| `src/data` | NO LONGER IGNORED | NO LONGER IGNORED ✓ |
| `.bmad-core/data` | NO LONGER IGNORED | NO LONGER IGNORED ✓ |
| `autoresearch/data` | NO LONGER IGNORED (directory itself) | NO LONGER IGNORED ✓ |
| `src/lib/training/data` | IGNORED — `.gitignore:96:src/lib/training/data/` | STILL IGNORED ✓ |

S2.7 — Snapshot exclusion:
- `autoresearch/data/snapshot-2026-03-25.json` → matched by `.gitignore:99:autoresearch/data/snapshot-*.json` ✓
- `autoresearch/data/.gitkeep` → not ignored ✓
- `autoresearch/data/README.md` → not ignored ✓

---

## Step 3 — Source file recovery

**Status:** COMPLETED — exactly 21 staged entries, matching the expected list. Zero PHASE1 reference MDs leaked into the staged set.

`git status --porcelain` after staging (S3.4 verbatim):

```
A  .bmad-core/data/bmad-kb.md
A  .bmad-core/data/brainstorming-techniques.md
A  .bmad-core/data/elicitation-methods.md
A  .bmad-core/data/technical-preferences.md
M  .gitignore
A  PHASE1_PARKING_LOT.md
A  autoresearch/data/.gitkeep
A  autoresearch/data/README.md
D  pnpm-lock.yaml
A  src/app/admin/operations/training/data/page.tsx
A  src/components/templateEditor-v2/data/elementsData.ts
A  src/data/niche-keywords.json
A  src/lib/data/apify.ts
A  src/lib/data/framework_genes.json
A  src/lib/data/index.ts
A  src/lib/data/init-fixtures.ts
A  src/lib/data/mock.ts
A  src/lib/data/real-data-connector.ts
A  src/lib/data/source.ts
A  src/lib/data/upload.ts
M  vercel.json
?? PHASE1_BUILD_INVESTIGATION_2026-05-02.md
?? PHASE1_DECISIONS_INVESTIGATION_2026-05-02.md
?? PHASE1_FINAL_DECISIONS_2026-05-02.md
?? PHASE1_VERCEL_AND_GITIGNORE_INVESTIGATION_2026-05-02.md
```

S3.5 staged size summary: **21 files, 3,028 insertions, 15,012 deletions** (15,010 from `pnpm-lock.yaml` deletion). No single file >1MB. Recovered source code totals well under 300 KB.

S3.6 spot-check `src/lib/data/index.ts` (first lines):
```ts
import { isMock, Source } from './source';
import { mockSource } from './mock';
import { apifySource } from './apify';
import { ensureFixtures } from './init-fixtures';
```
Real TypeScript module, intact. ✓

---

## Step 4 — Commit & push

**Commit SHA:** `dccf1b59bb0dceb41a195debdc3d31855334a006`
**Files in commit:** 21 changed, 3,028 insertions, 15,012 deletions
**PHASE1 reference MDs in commit:** 0 (verified via `git show --name-only`)

Push output (verbatim, post-stripping PowerShell stderr-capture noise):
```
To https://github.com/ttuckerm/trendzo-working-5-7-25
   051f431..dccf1b5  vercel-deploy-test -> vercel-deploy-test
```
Fast-forward push. No force. No touch to `main`.

**Vercel deploy URL:** https://trendzo-test-63v9jrma5-tommys-projects-e3a941fb.vercel.app
**Build started:** 2026-05-03T18:21:30Z
**Build duration:** 14s (fast fail at install)
**Status:** ● Error

---

## Step 5 — Vercel build outcome

**Classification: `INSTALL_FAILED`**

But this is a **new** failure mode, distinct from the prior `ERR_PNPM_OUTDATED_LOCKFILE`. Phase 1's package-manager-lock objective succeeded — Vercel did execute `npm install` (not `pnpm install`), confirming the `installCommand` change took effect. A second pre-existing peer-dependency conflict is now surfaced.

### What's different from before

| Aspect | Pre-fix (last 10 days) | Post-fix (this commit) |
|--------|------------------------|------------------------|
| Install command | `pnpm install --frozen-lockfile` (auto-detected) | `npm install` (from `vercel.json`) ✓ |
| Failure type | `ERR_PNPM_OUTDATED_LOCKFILE` (missing stripe@^22.1.0) | `npm ERESOLVE` (peer-dep conflict on react) |
| Failure phase | Install | Install (different cause) |
| Build phase reached? | No | No |

### New error (verbatim from log)

```
2026-05-03T18:21:42.211Z  Running "install" command: `npm install`...
2026-05-03T18:21:43.847Z  npm error code ERESOLVE
2026-05-03T18:21:43.848Z  npm error ERESOLVE could not resolve
2026-05-03T18:21:43.849Z  npm error While resolving: @json-render/react@0.15.0
2026-05-03T18:21:43.849Z  npm error Found: react@18.2.0
2026-05-03T18:21:43.850Z  npm error node_modules/react
2026-05-03T18:21:43.850Z  npm error   react@"18.2.0" from the root project
2026-05-03T18:21:43.850Z  npm error   peer react@"^18 || ~19.0.1 || ~19.1.2 || ^19.2.1" from @ai-sdk/react@3.0.140
2026-05-03T18:21:43.851Z  npm error   70 more (@clerk/clerk-react, @clerk/nextjs, @clerk/shared, ...)
2026-05-03T18:21:43.852Z  npm error Could not resolve dependency:
2026-05-03T18:21:43.852Z  npm error peer react@"^19.2.3" from @json-render/react@0.15.0
2026-05-03T18:21:43.852Z  npm error node_modules/@json-render/react
2026-05-03T18:21:43.852Z  npm error   @json-render/react@"^0.15.0" from the root project
2026-05-03T18:21:43.853Z  npm error Conflicting peer dependency: react@19.2.5
2026-05-03T18:21:43.854Z  npm error Fix the upstream dependency conflict, or retry
2026-05-03T18:21:43.854Z  npm error this command with --force or --legacy-peer-deps
2026-05-03T18:21:43.854Z  npm error to accept an incorrect (and potentially broken) dependency resolution.
2026-05-03T18:21:43.883Z  Error: Command "npm install" exited with 1
```

### Reading of the error

- Project pins `react@18.2.0`.
- Most peer deps (Clerk, Supabase, AI SDK, etc., 70 packages) accept React 18.
- One package — `@json-render/react@^0.15.0` — requires `react@^19.2.3` strictly.
- `npm install` (without `--legacy-peer-deps`) refuses to resolve.

This is a **substrate** issue: a dependency was added that requires React 19, while the project is on React 18. Two possible directions for Fix Prompt #1.5:

1. **Remove `@json-render/react`** if it's unused / safe to drop. Burden of proof per standing principle: full grep of `src/`, `supabase/`, `docs/`, configs, tests; positive reachability argument; explicit statement of what breaks if removed.
2. **Add `--legacy-peer-deps`** to `vercel.json` `installCommand` (`"installCommand": "npm install --legacy-peer-deps"`). Pragmatic, reversible, doesn't touch substrate. Matches the npm error's own suggested remedy. Does not actually fix the underlying React 18 vs 19 question; just lets install proceed.

Per Fix Prompt #1's rules of engagement ("If INSTALL_FAILED ... do NOT attempt to fix — Claude will draft a follow-up fix prompt"), no fix is attempted in this session. Reporting and stopping.

### Full build log

Captured to repo root: `vercel_post_fix_log.txt` (62 lines). Also at `$baseline\vercel_post_fix_log.txt`.

Full log (only meaningful Vercel lines, PowerShell stderr-capture noise removed):

```
2026-05-03T18:21:30.053Z  Running build in Washington, D.C., USA (East) – iad1
2026-05-03T18:21:30.053Z  Build machine configuration: 2 cores, 8 GB
2026-05-03T18:21:30.164Z  Cloning github.com/ttuckerm/trendzo-working-5-7-25 (Branch: vercel-deploy-test, Commit: dccf1b5)
2026-05-03T18:21:30.165Z  Previous build caches not available.
2026-05-03T18:21:39.010Z  Cloning completed: 8.845s
2026-05-03T18:21:39.678Z  Found .vercelignore
2026-05-03T18:21:39.818Z  Removed 1000 ignored files defined in .vercelignore
2026-05-03T18:21:40.797Z  Running "vercel build"
2026-05-03T18:21:41.497Z  Vercel CLI 51.6.1
2026-05-03T18:21:42.211Z  Running "install" command: `npm install`...
2026-05-03T18:21:43.847Z  npm error code ERESOLVE
[... ERESOLVE block above ...]
2026-05-03T18:21:43.883Z  Error: Command "npm install" exited with 1
status	● Error
```

---

## What I changed (in commit `dccf1b5`)

**Modified (2):**
- `.gitignore` — anchored `data/` → `/data/`, anchored `tmp/` → `/tmp/`, added 2 new rules
- `vercel.json` — added `"installCommand": "npm install"`

**Deleted (1):**
- `pnpm-lock.yaml`

**Added — recovered source files (16):**
- `src/lib/data/apify.ts`
- `src/lib/data/framework_genes.json`
- `src/lib/data/index.ts`
- `src/lib/data/init-fixtures.ts`
- `src/lib/data/mock.ts`
- `src/lib/data/real-data-connector.ts`
- `src/lib/data/source.ts`
- `src/lib/data/upload.ts`
- `src/app/admin/operations/training/data/page.tsx`
- `src/components/templateEditor-v2/data/elementsData.ts`
- `src/data/niche-keywords.json`
- `.bmad-core/data/bmad-kb.md`
- `.bmad-core/data/brainstorming-techniques.md`
- `.bmad-core/data/elicitation-methods.md`
- `.bmad-core/data/technical-preferences.md`
- `autoresearch/data/.gitkeep`
- `autoresearch/data/README.md`

(That's 17 entries — 8 in `src/lib/data/`, 1 admin page, 1 elementsData, 1 niche-keywords, 4 in `.bmad-core/data/`, 2 in `autoresearch/data/`. Plus `PHASE1_PARKING_LOT.md` = 18 added. + 2 modified + 1 deleted = 21. ✓)

**Added — documentation (1):**
- `PHASE1_PARKING_LOT.md`

---

## What I did NOT do (out-of-scope checklist respected)

- ✓ Did not re-link the local clone to a different Vercel project (Fix Prompt #2)
- ✓ Did not migrate env vars between Vercel projects (Fix Prompt #2)
- ✓ Did not disconnect any Vercel project from GitHub (Fix Prompt #2)
- ✓ Did not touch the 2418 TypeScript errors (parking lot)
- ✓ Did not touch filename casing collisions (parking lot)
- ✓ Did not touch the `@types/react` version mismatch (parking lot)
- ✓ Did not touch any Firebase ghost code (parking lot)
- ✓ Did not touch CI workflow files (parking lot)
- ✓ Did not touch `claude-pr-review.yml` (parking lot)
- ✓ Did not change `main` branch
- ✓ Did not run `npm install` locally
- ✓ Did not modify any of the four investigation reports
- ✓ Did not force-push
- ✓ Did not stage or commit any of the four PHASE1 reference MDs
- ✓ Did not attempt to fix the new ERESOLVE error

---

## Next steps

Per Fix Prompt #1's S5 instructions:

> If INSTALL_FAILED or BUILD_FAILED: Capture the full log, paste back to Claude, do NOT attempt to fix — Claude will draft a follow-up fix prompt.

The full log is at `vercel_post_fix_log.txt`. The next prompt should decide between (a) removing `@json-render/react` after the standard burden-of-proof grep, or (b) adding `--legacy-peer-deps` to `vercel.json`'s `installCommand`. Both are reversible.

---

## MD Cleanup + Stash Pop Outcome (Wrapper Steps 2–4)

**Baseline path:** `C:\Users\thoma\AppData\Local\Temp\trendzo-phase1-baseline-20260503-114810`

### Pre-pop cleanup (Wrapper Step 2)

The four PHASE1 reference MDs were removed from disk to avoid stash-pop collision. They are NOT touched in commit `dccf1b5` — verified by `git show --name-only` returning zero matches against the four filenames.

```
Removed: PHASE1_BUILD_INVESTIGATION_2026-05-02.md
Removed: PHASE1_DECISIONS_INVESTIGATION_2026-05-02.md
Removed: PHASE1_VERCEL_AND_GITIGNORE_INVESTIGATION_2026-05-02.md
Removed: PHASE1_FINAL_DECISIONS_2026-05-02.md
```

`git status --porcelain` after cleanup (only Fix-Prompt-#1 outputs remained):
```
?? PHASE1_FIX_OUTCOME_2026-05-02.md
?? vercel_post_fix_log.txt
```

### Stash pop (Wrapper Step 3)

`git stash pop` ran cleanly with **zero conflicts**. Pop output (verbatim, condensed):

```
On branch vercel-deploy-test
Your branch is up to date with 'origin/vercel-deploy-test'.
Changes not staged for commit:
  modified:   src/app/(public)/free/freedom-os/FreedomOSTool.tsx
  deleted:    src/app/(public)/recover/RecoverForm.tsx
  deleted:    src/app/(public)/recover/page.tsx
  modified:   src/app/api/assessment/email-capture/route.ts
  modified:   src/app/api/assessment/email-status/route.ts
  modified:   src/app/api/assessment/generate/route.ts
  modified:   src/app/api/assessment/sprint-progress/route.ts
  modified:   src/app/api/freedom-agent/chat/route.ts
  modified:   src/app/api/freedom-agent/conversation/route.ts
  modified:   src/app/api/landing/email-notify/route.ts
  deleted:    src/app/api/recover-link/route.ts
  modified:   src/app/assessment/[assessmentId]/page.tsx
  modified:   src/components/assessment/AgentGate.tsx
  modified:   src/components/assessment/AgentRail.tsx
  modified:   src/components/assessment/AssessmentHUD.tsx
  modified:   src/components/assessment/Day1Spotlight.tsx
  modified:   src/components/assessment/SprintGrid.tsx
  modified:   src/components/landing/CloseSection.tsx
  modified:   src/lib/assessment/fetch-assessment.ts
  modified:   src/lib/beehiiv/notify.ts
  modified:   src/types/freedom-agent.ts
Untracked files: [PHASE1_*.md x4, src/components/assessment/SaveYourLinkNotice.tsx,
                  supabase/migrations/20260430000000_assessment_share_token.sql,
                  PRE_STASH_*.txt x4, ADMIN_ROUTE_AUDIT_*, OB_2_*, tsc_output.txt, vercel_log.txt,
                  PHASE1_FIX_OUTCOME_2026-05-02.md, vercel_post_fix_log.txt]
Dropped refs/stash@{0} (1ba72e3952f0494eb7e92915ba4b52b0bb2c3c9b)
```

### POP_DIFF metrics (compared against `$baseline\PRE_STASH_STATUS.txt`)

- **POP_DIFF_LOST.txt:** 1 line — `?? PHASE1_PARKING_LOT.md` (was untracked pre-stash; now tracked in commit `dccf1b5`. Expected.)
- **POP_DIFF_GAINED.txt:** 6 lines:
  - `?? PHASE1_FIX_OUTCOME_2026-05-02.md` (this report; created by Fix Prompt #1)
  - `?? POST_POP_STATUS.txt` (created during 3.1 verification)
  - `?? PRE_STASH_DIFF_CACHED_STAT.txt` (restored from stash)
  - `?? PRE_STASH_DIFF_STAT.txt` (restored from stash)
  - `?? PRE_STASH_UNTRACKED.txt` (restored from stash)
  - `?? vercel_post_fix_log.txt` (Vercel log; captured by Fix Prompt #1)

All gained items are explained. All lost items are explained. Nothing is missing.

### 27-item must-exist check

Verified all 27 expected items are present in `POST_POP_STATUS.txt`:

| Group | Count | Status |
|-------|-------|--------|
| Modified source files | 18 | ✓ all present |
| Deleted source files | 3 | ✓ all present |
| Untracked source items | 2 | ✓ all present (`SaveYourLinkNotice.tsx`, share_token migration) |
| PHASE1 reference MDs (back as untracked) | 4 | ✓ all present |
| **Total** | **27** | **0 missing** |

### Stash list after pop

```
(empty)
```

`refs/stash@{0}` was dropped successfully. The patch backups at `$baseline\stash-tracked.patch` and `$baseline\stash-full.patch` remain in place as a secondary safety net.

---

## Final summary

- **Phase 1 atomic commit:** `dccf1b59bb0dceb41a195debdc3d31855334a006` on `vercel-deploy-test`, 21 files changed.
- **Push:** clean fast-forward `051f431..dccf1b5`. No force, `main` untouched.
- **Vercel build:** `INSTALL_FAILED` with **a different and more progressed failure mode** than before — pnpm-lock issue is solved, peer-dep conflict on `react` newly exposed.
- **Tommy's WIP:** fully restored from stash. Working tree contains all 18 modifications, 3 deletions, 2 new source items, 4 reference MDs, plus this outcome report and the Vercel log.
- **No data loss. No force-push. No touch to `main`.** All actions reversible per standing principle.

Standing by for the follow-up fix prompt addressing the React peer-dep conflict.
