# Phase 1 — Decisions Investigation

**Date:** 2026-05-02
**Mode:** Read-only
**Companion to:** PHASE1_BUILD_INVESTIGATION_2026-05-02.md

---

## Pre-flight results

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | `PHASE1_BUILD_INVESTIGATION_2026-05-02.md` exists at repo root | ✅ PASS | Confirmed via `Test-Path` |
| 2 | Both `package-lock.json` and `pnpm-lock.yaml` exist at repo root | ✅ PASS | Both present |
| 3 | Currently on branch `vercel-deploy-test` | ✅ PASS | `git rev-parse --abbrev-ref HEAD` → `vercel-deploy-test` |
| 4 | `git status` is no dirtier than at end of Investigation #1 | ✅ PASS | Working tree has 29 short-status entries. Investigation #1 ended with 26 (21 modified/deleted code files + 5 unrelated untracked files). The 3 new entries are exactly the 3 read-only artifacts that Investigation #1 created at repo root: `PHASE1_BUILD_INVESTIGATION_2026-05-02.md`, `tsc_output.txt`, `vercel_log.txt`. No additional code files have changed. |

**Pre-flight: PASSED. Proceeding with investigation.**

---

## Q1. Package manager — which is Tommy actually running?

### Evidence

#### Q1.1 — Lockfile commit history (last 20 commits affecting either lockfile)

```
$ git log --name-only --format=format:"%h %ai %s" -20 -- pnpm-lock.yaml package-lock.json

051f431 2026-04-29 18:57:55 -0400 checkpoint: 2026-04-29 — escape funnel + agency dashboard parity work
package-lock.json

f6232a4 2026-04-22 14:07:43 -0400 deploy: add .vercelignore and refresh pnpm-lock.yaml for Vercel preview
pnpm-lock.yaml

8549c9d 2026-04-17 12:46:07 -0400 CHECKPOINT: April 17 2026 — Intelligent Clay planning + v15 XGBoost + agency work
package-lock.json

c1426cb 2026-03-30 19:12:10 -0400 Fresh init: clean source, no video data, no secrets
package-lock.json
pnpm-lock.yaml
```

**Reading:**
- The only commit that ever explicitly touched `pnpm-lock.yaml` (other than `c1426cb` which seeded both) is `f6232a4` (Apr 22), with the message *"deploy: add .vercelignore and refresh pnpm-lock.yaml for Vercel preview"* — i.e., it was a one-off resync because Vercel was complaining.
- `package-lock.json` has been touched in **every other** lockfile-modifying commit (`051f431`, `8549c9d`, `c1426cb`). Most recently in `051f431` (Apr 29) — the current branch tip.

#### Q1.2 — On-disk modification times

```
Name              Length LastWriteTime
----              ------ -------------
pnpm-lock.yaml    501908 4/22/2026 8:50:57 AM
package-lock.json 830127 4/28/2026 7:02:04 PM
```

**Reading:** `package-lock.json` is ~6 days newer on disk. The `package-lock.json` mtime (Apr 28 7:02 PM) sits between commits `8549c9d` (Apr 17) and `051f431` (Apr 29 6:57 PM), strongly suggesting a local `npm install` ran on Apr 28 that updated the lockfile, and that change was then committed the next day.

#### Q1.3 — `lockfileVersion` of each file

```
$ Get-Content package-lock.json -TotalCount 5
{
  "name": "trendzo",
  "version": "0.1.0",
  "lockfileVersion": 3,
  "requires": true,

$ Get-Content pnpm-lock.yaml -TotalCount 3
lockfileVersion: '9.0'

settings:
```

- `package-lock.json` → `lockfileVersion: 3` (npm 7+ format)
- `pnpm-lock.yaml` → `lockfileVersion: '9.0'` (pnpm 9+ format)

#### Q1.4 — pnpm-specific config files

```
$ Test-Path .npmrc                                     → False
$ Test-Path pnpm-workspace.yaml                         → False
$ Get-Content package.json | Select-String "packageManager"  → (no matches)
```

**No `.npmrc`, no `pnpm-workspace.yaml`, no `packageManager` field in `package.json`.** Nothing in the repo declares pnpm as the official package manager.

#### Q1.5 — Shell history

```
$ (Get-PSReadlineOption).HistorySavePath
C:\Users\thoma\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt

TOTAL MATCHES (npm install | npm i | npm add | pnpm install | pnpm i | pnpm add): 446

--- 5 most recent matching commands ---
npm install -g @anthropic-ai/claude-code
npm install @supabase/supabase-js @supabase/ssr zustand zod react-hook-form framer-motion lucide-react date-fns openai resend stripe
npm install -g @anthropic-ai/claude-code
npm install
npm install --legacy-peer-deps
```

(Showed last 10; all 10 most recent are `npm install*` variants. `pnpm` does not appear in the recent slice — and a separate count confirms zero `pnpm install/i/add` matches in the 446 total.)

**Smoking gun:** the line
```
npm install @supabase/supabase-js @supabase/ssr zustand zod react-hook-form framer-motion lucide-react date-fns openai resend stripe
```
explains exactly how `stripe@^22.1.0` ended up in `package.json` and `package-lock.json` but NOT in `pnpm-lock.yaml`. It was installed with `npm`, which only knows how to update its own lockfile.

#### Q1.6 — Marker files in `node_modules/`

```
$ Test-Path node_modules\.modules.yaml      → True   (pnpm wrote this)
$ Test-Path node_modules\.package-lock.json → True   (npm wrote this)
```

**Both markers exist.** This means the `node_modules/` folder is contaminated — both managers have run against this tree at different points. (The presence of both is not unusual on a developer machine that has switched managers; it just means we cannot use these markers to identify the *most recent* install.)

#### Q1.7 — `node_modules/.pnpm` directory

```
$ Test-Path node_modules\.pnpm  → True
```

**`.pnpm/` exists** — confirms pnpm has run at some point. Does NOT prove pnpm ran most recently.

### Recommendation

**npm**, because the developer's filesystem evidence is overwhelming:

- The most recent commit that touched a lockfile (Apr 29) modified `package-lock.json`, not `pnpm-lock.yaml`.
- The on-disk mtime of `package-lock.json` is ~6 days newer than `pnpm-lock.yaml`.
- The 5 (in fact, 10+) most recent install commands in PowerShell history are all `npm install`, several with `--legacy-peer-deps`. Zero recent `pnpm` commands.
- Of all 446 install-related history lines (since the start of this PowerShell session's recorded history), the recent skew is heavily npm.
- The only commit that ever explicitly touched `pnpm-lock.yaml` post-init is a one-shot "refresh pnpm-lock.yaml for Vercel preview" — a reactive resync, not a recurring install pattern.
- The exact dependency that broke Vercel (`stripe@^22.1.0`) appears in a `npm install ... stripe` history line.

**Implication for the fix:** Tommy is locally running `npm`, but Vercel auto-detects `pnpm` because `pnpm-lock.yaml` is checked in. Every time Tommy runs `npm install`, he updates `package-lock.json` and `package.json` but not `pnpm-lock.yaml`, and every Vercel build that follows will fail with `ERR_PNPM_OUTDATED_LOCKFILE`. The two-lockfile state is fundamentally unstable and must be resolved.

---

## Q2. What happened to `src/lib/data/`?

### Evidence

#### Q2.1 — Was anything in `src/lib/data/*` ever DELETED in any commit on any branch?

```
$ git log --all --diff-filter=D --name-only --format=format:"%h %ai %s" -- "src/lib/data/*"
(no output — empty result)
```

**Result: zero deletions ever recorded.**

#### Q2.2 — Was any of the missing files ever COMMITTED on any branch?

```
$ git log --all --oneline --name-only -- "**/init-fixtures*"
(no output)

$ git log --all --oneline --name-only -- "src/lib/data/source*"
(no output)

$ git log --all --oneline --name-only -- "src/lib/data/mock*"
(no output)

$ git log --all --oneline --name-only -- "src/lib/data/upload*"
(no output)
```

**Result: zero commits on any branch ever contained `init-fixtures*`, `src/lib/data/source*`, `src/lib/data/mock*`, or `src/lib/data/upload*`.**

Cross-check via the broader query *"any file path in the entire history matching `src/lib/data`"*:

```
$ git log --all --pretty=format: --name-only --diff-filter=A | Select-String "src/lib/data" -Unique
(no output)
```

Zero matches across all branches. **`src/lib/data/` has never been git-tracked.**

#### Q2.3 — `src/lib/database/` contents

```
$ Get-ChildItem src/lib/database -Recurse -File | Select-Object FullName
C:\Projects\CleanCopy\src\lib\database\index.ts
C:\Projects\CleanCopy\src\lib\database\loggedDb.ts
C:\Projects\CleanCopy\src\lib\database\sandbox-database.ts
C:\Projects\CleanCopy\src\lib\database\supabase-viral-prediction.ts
C:\Projects\CleanCopy\src\lib\database\supabase.ts
C:\Projects\CleanCopy\src\lib\database\SupabaseService.ts
C:\Projects\CleanCopy\src\lib\database\types.ts
```

**No `init-fixtures.ts`, `source.ts`, `mock.ts`, or `upload.ts`. `database/` is an entirely unrelated directory** (Supabase clients and DB wrappers). It is NOT a renamed `data/`.

#### Q2.4 — Read one importing file (`src/app/api/metrics/route.ts`)

```ts
import { NextResponse } from 'next/server'
import { source } from '@/lib/data'
import { ensureFixtures } from '@/lib/data/init-fixtures'
import { computeDriftIndex } from '@/lib/learning/summary'
import { GET as ADAPT_SUM } from '@/app/api/adaptation/summary/route'

export async function GET() {
  if (process.env.MOCK === '1') ensureFixtures()
  const m = await source.metrics()
  let driftIndex = 0
  try { driftIndex = computeDriftIndex() } catch {}
  let status: 'Stable'|'Shifting'|'Storm' = driftIndex < 0.15 ? 'Stable' : driftIndex < 0.3 ? 'Shifting' : 'Storm'
  let last = (m.weather as any)?.lastChange || new Date().toISOString()
  try {
    const resp = await ADAPT_SUM()
    if ((resp as any)?.ok !== false) {
      const j = await (resp as any).json()
      status = j?.weather?.status || status
      last = j?.weather?.lastChangeISO || last
      driftIndex = j?.weather?.driftIndex ?? driftIndex
    }
  } catch {}
  const weather = { ...(m.weather||{}), status, lastChange: last, lastChangeISO: last }
  return NextResponse.json({ ...m, weather, driftIndex })
}
```

**Reading:**
- `source.metrics()` is the **primary data fetch** for the route's GET response. Without `source`, the route returns nothing meaningful — it's load-bearing.
- `ensureFixtures()` is only called when `process.env.MOCK === '1'`, i.e., it's a dev-mode seed. Not load-bearing in production, but the import line itself still has to resolve at build time (and Vercel does not have the file).
- The route is not scaffolding. It builds a real response object combining `source.metrics()`, `computeDriftIndex()`, and the `/api/adaptation/summary` route's GET.

#### Q2.5 — When was the broken import introduced?

```
$ git log --all -p -S "from '@/lib/data'" -- "src/app/api/metrics/route.ts"

commit c1426cb3dacd19efcfd3c5ac77340739ed9fa602
Author: ttuckerm <ttucker.m@gmail.com>
Date:   Mon Mar 30 19:12:10 2026 -0400
    Fresh init: clean source, no video data, no secrets

diff --git a/src/app/api/metrics/route.ts b/src/app/api/metrics/route.ts
new file mode 100644
+import { source } from '@/lib/data'
+import { ensureFixtures } from '@/lib/data/init-fixtures'
... (full file added at this commit)
```

**The import was introduced in commit `c1426cb` (Mar 30) — the "Fresh init" commit, which is also the tip of `main`.** The file `src/app/api/metrics/route.ts` was added in the same commit, but `src/lib/data/source.ts` and `src/lib/data/init-fixtures.ts` were NOT added in that commit (or any other). **The imports have been unresolvable on the committed tree since the day they were written.**

#### Q2.6 — `.gitignore` patterns affecting `src/lib/data/`

`.gitignore` line 60:
```
# scraped data
data/
```

The pattern `data/` is **unanchored**, so git interprets it as "any directory named `data`, anywhere in the tree" — including `src/lib/data/`.

Verification:
```
$ git check-ignore -v src/lib/data
.gitignore:60:data/   src/lib/data
```

**This is the root cause.** The rule was clearly intended to exclude `<repo-root>/data/` (scraped video data — see the comment on line 59), but because it is not anchored with a leading `/`, it inadvertently matches `src/lib/data/` as well, and git silently refuses to track the directory. Whoever first ran `git add` on `src/lib/data/` would have been told there was nothing to add, and the directory has been a local-only artifact ever since.

Confirmed by listing what's actually on disk locally:
```
$ Get-ChildItem src\lib\data -Recurse
src\lib\data\apify.ts                  (2275 bytes)
src\lib\data\framework_genes.json      (1282 bytes)
src\lib\data\index.ts                  (1590 bytes)
src\lib\data\init-fixtures.ts          (6245 bytes)
src\lib\data\mock.ts                   (1687 bytes)
src\lib\data\real-data-connector.ts   (11362 bytes)
src\lib\data\source.ts                  (604 bytes)
src\lib\data\upload.ts                  (747 bytes)
```

**All eight expected files exist on Tommy's local machine — they just aren't in git, and therefore they aren't on Vercel.**

#### Q2.7 — Parallel "data" directory under `_disabled/` or similar

```
$ Glob: src/**/init-fixtures*    → 0 files (matches the gitignore exclusion: src/lib/data/init-fixtures.ts is excluded from globs against tracked files because of the same rule)
$ Glob: **/_disabled/**/data/*   → 0 files
```

No parallel `data/` directory under any `_disabled/` path.

### Finding

**(C) — `src/lib/data/` has NEVER existed in any commit on any branch**, with one critical extension to the user-defined options:

> **(C′) — The directory exists in Tommy's local working tree (with all 8 expected files including `init-fixtures.ts`, `source.ts`, `mock.ts`, `upload.ts`), but it has never been committed because `.gitignore` line 60 (`data/`) silently matches it.** Vercel only ever sees the committed tree, which is why the build cannot resolve any `@/lib/data` import.

This is functionally the same problem as (C) for build-blocking purposes — Vercel sees no `src/lib/data/` — but the recovery path is dramatically different: the code already exists on disk, so the fix can be as small as changing `.gitignore` line 60 from `data/` to `/data/` (anchored) and then `git add src/lib/data/`. No code needs to be written or restored from history.

**Recommended remediation options for the user to choose between (NOT executing any of these in this session):**
1. Anchor the gitignore rule (`/data/`) and `git add src/lib/data/`. Smallest possible diff. Recovers all 8 files into git.
2. Move `src/lib/data/` to a path that doesn't trigger the gitignore (e.g., `src/lib/datasource/` or `src/lib/fixtures/`) and update the 25 import paths. More disruption, but avoids any gitignore subtlety.
3. Inline-replace the imports with the existing `src/lib/database/` module if its API is compatible. (It almost certainly is not — different shape — but mentioned for completeness.)

### Load-bearing classification

**Note on count:** Phase 1 reported 19 importing files. A re-grep at this moment finds **25 files** importing from `@/lib/data` or `@/lib/data/*`. The 6 additional files probably reflect either a different grep pattern in Phase 1 or Phase 1 having only counted importers from the API surface. Listing all 25 below.

**The 25 files importing from `@/lib/data` (or `@/lib/data/*`):**

| # | File | Load-bearing? | Reasoning |
|---|------|---------------|-----------|
| 1 | `src/app/api/metrics/route.ts` | YES | Implements `/api/metrics` GET; `source.metrics()` is the response payload. Consumed by `src/__tests__/api/metrics.api.test.ts` and referenced by sibling routes. |
| 2 | `src/app/api/cross/cascades/route.ts` | YES | `/api/cross/cascades`. Consumed by `src/components/admin/accuracy/*`, `src/__tests__/api/cross.cascades.api.test.ts`, `src/app/admin/cross-intel/page.tsx`. |
| 3 | `src/app/api/cross/predict/route.ts` | YES | `/api/cross/predict`. Consumed by tests + admin cross-intel page. |
| 4 | `src/app/api/cross/summary/route.ts` | YES | `/api/cross/summary`. Consumed by tests + cross-intel UI. |
| 5 | `src/app/api/templates/leaderboard/route.ts` | YES | `/api/templates/leaderboard`. Consumed by `src/app/admin/template-leaderboard/page.tsx`, `src/app/admin/recipes/leaderboard/page.tsx`, tests. |
| 6 | `src/app/api/proof-tiles/route.ts` | YES | `/api/proof-tiles`. Consumed by `src/app/proof/page.tsx` and tests. |
| 7 | `src/app/api/recipe-book/route.ts` | YES | `/api/recipe-book`. Consumed by `src/app/admin/viral-recipe-book/page.tsx`, `src/app/admin/recipe-book/page.tsx`, tests. |
| 8 | `src/app/api/recipe-book/generate/route.ts` | YES | `/api/recipe-book/generate`. Consumed by recipe-book admin pages. |
| 9 | `src/app/api/public/v1/recipe-book/route.ts` | YES | Public V1 surface — `/api/public/v1/recipe-book`. Hosted contract. |
| 10 | `src/app/api/public/v1/analyze/route.ts` | YES | Public V1 surface — `/api/public/v1/analyze`. Hosted contract. |
| 11 | `src/app/api/videos/route.ts` | YES | `/api/videos`. Consumed by tests and several frontend pages. |
| 12 | `src/app/api/videos/[id]/route.ts` | YES | `/api/videos/[id]`. Consumed by `src/__tests__/api/videos.detail.api.test.ts` etc. (Phase 1 listed this one; PowerShell `Test-Path` returns false for the literal `[id]` path due to bracket expansion — `Test-Path -LiteralPath` confirms it exists.) |
| 13 | `src/app/api/video/predict/route.ts` | YES | `/api/video/predict`. Active prediction surface. |
| 14 | `src/app/api/video/upload/route.ts` | YES | `/api/video/upload`. Upload endpoint. |
| 15 | `src/app/api/studio/templates/route.ts` | YES | `/api/studio/templates`. Studio admin surface. |
| 16 | `src/app/widget/badge/route.tsx` | YES | `/widget/badge`. Embed/badge widget endpoint. |
| 17 | `src/lib/cross/service.ts` | YES (lib) | Used by cross-intel routes and components. |
| 18 | `src/lib/cross/cascade.ts` | YES (lib) | Used by cross routes and tests. |
| 19 | `src/lib/templates/cache.ts` | YES (lib) | Imported by template routes and admin pages. |
| 20 | `src/lib/templates/service.ts` | YES (lib) | Imported by template routes. |
| 21 | `src/lib/insights/lift.ts` | YES (lib) | Imported by analytics and insights surfaces. |
| 22 | `src/lib/validation/actuals.ts` | YES (lib) | Validation utility imported by cross/predict logic. |
| 23 | `src/lib/services/script-intelligence-engine.ts` | YES (lib) | Imported by `src/app/api/admin/script-intelligence/route.ts`. |
| 24 | `src/lib/services/data-ingestion-pipeline.ts` | YES (lib) | Imported by ingestion-related endpoints. |
| 25 | `src/lib/utils/featureFlags.ts` | YES (lib) | Imported widely (multiple page and route files). |

**Load-bearing summary:**
- **vs. the 6 cron paths in `vercel.json` (`/api/cron/recency-decay`, `/api/freedom-agent/weekly-checkin`, `/api/atlas/feedback-collector`, `/api/cron/cultural-scan`, `/api/cron/classify-events`, `/api/cron/overnight-triage`):** **0 of 25 match.** None of the broken-import files is itself a cron handler.
- **vs. `redirects()` destinations in `next.config.mjs`:** **0 of 25 match.** All redirects target `/dashboard-view/...`, `/admin/...`, or `/favicon.svg` — none of the API-route-shaped paths.
- **vs. `<Link href=...>` / `router.push(...)` and `fetch('/api/...')` references in `src/`:** **All 25 are reachable.** Every API endpoint in the list is referenced by at least one frontend page, admin page, test, or other route. Every lib file is imported by other tracked source files.

**Conclusion: 25 of 25 are load-bearing in some capacity. Zero appear to be dead routes.** Deleting all 25 to "fix" the build is therefore not a viable Phase 1 strategy — losing them would silently disable admin tooling, public V1 contracts, the badge widget, video routes, recipe-book routes, and most of the cross-intel surface.

---

## Q3. Which branch should be canonical?

### Evidence

#### Q3.1 — Vercel CLI inspect on most recent deployments

```
$ npx vercel ls
> Deployments for tommys-projects-e3a941fb/trendzo-test
  Age   Project                              Deployment                                                              Status   Environment   Duration   Username
  3d    tommys-projects-e3a941fb/trendzo-test  https://trendzo-test-o6n817s4c-tommys-projects-e3a941fb.vercel.app   ● Error  Preview        16s        admin-4568
  7d    tommys-projects-e3a941fb/trendzo-test  https://trendzo-test-fsg1p2vwn-...                                    ● Error  Preview        3m         admin-4568
  8d    tommys-projects-e3a941fb/trendzo-test  https://trendzo-test-mxm7tstkw-...                                    ● Error  Preview        3m         admin-4568
  ...
  10d   tommys-projects-e3a941fb/trendzo-test  https://trendzo-test-dchzwkalm-...                                    ● Error  Production     50s        admin-4568
```

```
$ npx vercel inspect https://trendzo-test-o6n817s4c-tommys-projects-e3a941fb.vercel.app
General
  id        dpl_7VguGVwy7QBUXbyzKHVxd8dxugFk
  name      trendzo-test
  target    preview
  status    ● Error
  url       https://trendzo-test-o6n817s4c-tommys-projects-e3a941fb.vercel.app
  created   Wed Apr 29 2026 18:58:53 GMT-0400 [3d ago]
Aliases
  ╶ https://trendzo-test-git-vercel-deploy-test-tommys-projects-e3a941fb.vercel.app
```

**The git-branch alias `https://trendzo-test-git-vercel-deploy-test-tommys-projects-e3a941fb.vercel.app` directly encodes the source branch as `vercel-deploy-test`.** This is Vercel's standard alias pattern: `[project]-git-[branch]-[org]`. So Vercel is currently deploying from `vercel-deploy-test`.

The most recent **Production** deployment is 10 days old and ended in Error. Every deploy since has been a Preview against `vercel-deploy-test`, and every one has Error'd.

`npx vercel inspect` of the production deployment URL returned only `target: production` with no `Branch` field surfaced — likely because when that deployment failed during install it never registered a confirmed source branch in Vercel's surfaced metadata, but the alias on the more recent failed Preview deployments unambiguously tells us the branch.

#### Q3.2 — `vercel project ls`

```
$ npx vercel project ls
> Projects found under tommys-projects-e3a941fb
  Project Name                    Latest Production URL                                                Updated   Node Version
  trendzo-working-5-7-25          https://trendzo-working-5-7-25-tommys-projects-e3a941fb.vercel.app   8d        24.x
  trendzo-test                    https://trendzo-test-tommys-projects-e3a941fb.vercel.app             10d       24.x
  v0-mom-site-demo-az31leymjzt    --                                                                   183d      22.x
```

**There are TWO active Vercel projects** in this org tied to recent activity:
- `trendzo-test` — the project we've been inspecting; production deploy 10 days ago
- `trendzo-working-5-7-25` — a separate project, production deploy 8 days ago (more recent)

This is a Phase 1 ambiguity that the filesystem cannot resolve: which project is the canonical production target? Listed as an open question.

#### Q3.3 — `vercel.json` git block

```
$ (Get-Content vercel.json | ConvertFrom-Json).PSObject.Properties.Name
framework
buildCommand
outputDirectory
crons
```

**No `git` key in `vercel.json`.** No `git.deploymentEnabled` block. No branch restrictions configured at the repo level — Vercel is making the branch decision via the dashboard, not via this file.

#### Q3.4 — GitHub Actions workflow branch references

```
.github/workflows/unicorn-grade-ci.yml
  9:    branches: [main, develop, feature/*]
  11:    branches: [main, develop]
  192:        if: github.ref == 'refs/heads/main'
  220:        if: github.ref == 'refs/heads/main'

.github/workflows/claude-pr-review.yml
  83:  new_predict=$(git diff origin/main...HEAD --name-only ...)
  89:  direct_calls=$(git diff origin/main...HEAD -- "src/app/api/**/*.ts" ...)
  95:  legacy_writes=$(git diff origin/main...HEAD ...)
  132: body += `\n\nPlease review [CLAUDE.md](../blob/main/CLAUDE.md) ...`
  305: body += `*Review [CLAUDE.md](../blob/main/CLAUDE.md) ...*`

.github/workflows/ci-golden.yml
  6:    branches: [ main ]

.github/workflows/ci.yml
  23:    branches: [ main, develop ]
  25:    branches: [ main, develop ]
  64:    branches: [ main, develop ]
  66:    branches: [ main, develop ]

.github/workflows/ci.yml.backup
  6:    branches: [ main ]
  8:    branches: [ main ]

.github/workflows/preflight.yml
  5:    branches: [ main ]
  7:    branches: [ main ]
```

**Branches referenced by CI: `main`, `develop`, `feature/*`. NONE reference `vercel-deploy-test`.** Six workflows total, all configured around the assumption that `main` is canonical. Today, none of them actually run useful checks against the dev work, because the dev work lives on `vercel-deploy-test` and `main` never receives those commits.

Other notable workflow files at repo root that may not be in `.github/workflows/`:
- `test-secrets.yml` (under `.github/workflows/`)
- (no other workflow file referenced `vercel-deploy-test` by name)

#### Q3.5 — Branch divergence

```
$ git log --oneline main..vercel-deploy-test | wc -l
28

$ git log --oneline vercel-deploy-test..main | wc -l
0
```

**`vercel-deploy-test` is 28 commits ahead of `main`. `main` is 0 commits ahead of `vercel-deploy-test`.** `main` is a strict ancestor — option α (force-replacing main) would lose nothing on the main branch.

#### Q3.6 — Branch tracking config

```
$ git config --get-all branch.main.remote
origin

$ git config --get-all branch.vercel-deploy-test.remote
origin

$ git config --get-all branch.main.merge
refs/heads/main

$ git config --get-all branch.vercel-deploy-test.merge
refs/heads/vercel-deploy-test
```

```
$ git ls-remote --heads origin
4d5ba68… refs/heads/dr-archives-20250903-162107
a79f6fb… refs/heads/feat/unified-grading-rubric
2961d0e… refs/heads/fresh-checkpoint-2026-01-28
c1426cb… refs/heads/main
d00085f… refs/heads/supabase-migration
051f4310… refs/heads/vercel-deploy-test
```

Both `main` and `vercel-deploy-test` track `origin`. Both exist on the remote. `origin/main` HEAD is `c1426cb` (the "Fresh init" commit), confirming the dormancy reported in Phase 1. `origin/vercel-deploy-test` HEAD is `051f43106` — matches the local tip exactly.

There are also four other remote branches in the org's repo that may or may not be relevant: `dr-archives-20250903-162107`, `feat/unified-grading-rubric`, `fresh-checkpoint-2026-01-28`, `supabase-migration`. None are tied to deploys.

### Recommendation

**Sub-option γ — Defer the branch-canonicalization decision to Phase 2.**

Reasoning:

1. **Phase 1's stated goal is restoring the deploy pipeline, not reorganizing branches.** Vercel is currently deploying from `vercel-deploy-test`. Fixing the build there is the smallest possible change that achieves Phase 1's goal. Branch reorganization is orthogonal.

2. **Sub-option α (force-replace main) introduces unnecessary risk into Phase 1.** Force-pushing main rewrites the only existing reference point. Even though `main` has nothing unique on it (Q3.5: 0 commits ahead), the operation is irreversible from any party that has already cloned, and it requires reconfiguring Vercel's project settings AND the production branch alias mid-flight. If anything goes wrong, the build is still broken AND the branch state is muddled. Worth doing eventually — but not while we're still triaging the lockfile and missing-directory issues.

3. **Sub-option β (treat main as permanent legacy) commits us to a long-term unconventional layout.** All six existing GitHub Actions workflows reference `main` (and one of them, `claude-pr-review.yml`, hard-codes `origin/main` as the diff base in five separate places). Permanently treating `vercel-deploy-test` as canonical means rewriting every CI workflow file. That's a multi-PR cleanup that doesn't belong in Phase 1.

4. **Phase 2 has the right context for this decision.** Once Phase 1 lands a green deploy, Phase 2 can do this properly: pick one of α or β intentionally, update CI workflows in the same change, regenerate any branch protection rules, and document the new convention in `CLAUDE.md`. Doing it then is one coherent change; doing it now is two entangled ones.

5. **The cost of γ is low:** the only "deviation from convention" introduced is the existing one (deploys come from `vercel-deploy-test`). That deviation has already existed for ~10 days. Letting it persist for the duration of Phase 1 (probably hours, maybe a day) creates no new risk.

For Phase 1, the practical shape of γ is:
- Make all build fixes on `vercel-deploy-test`.
- Do not touch `main` in this phase.
- Do not change any CI workflow branch references in this phase.
- After Phase 1 is green, draft a Phase 2 prompt that explicitly chooses between α and β and executes it as one atomic change.

---

## Open questions for the user

1. **Which Vercel project is canonical?** There are two active projects in your org: `trendzo-test` (last prod deploy 10d ago, all recent attempts errored) and `trendzo-working-5-7-25` (last prod deploy 8d ago, status not inspected). Should the Phase 1 fix target `trendzo-test`, or has work shifted to `trendzo-working-5-7-25`? The Vercel CLI cannot tell us your intent here.
2. **The pnpm-lock.yaml at `f6232a4` ("refresh pnpm-lock.yaml for Vercel preview") — was that you, or someone else?** That commit is the only post-init touchpoint for the pnpm lockfile and may indicate that someone (or a CI script) was once trying to keep both lockfiles in sync. If there's a script for that, we should know about it before deleting one of the lockfiles.
3. **Are you comfortable with the gitignore-anchor fix (`data/` → `/data/`) for the `src/lib/data/` problem?** This is the smallest possible recovery — but it does change a checked-in `.gitignore` that may have been intentionally crafted. Before fixing it, you should confirm there's no `<repo-root>/data/` you actively want to keep ignored (verify with `Test-Path data` at the repo root) and no other `data/` directory anywhere in the tree that would inadvertently get tracked.
4. **For Q3 Sub-option γ:** do you agree with deferring the branch-canonicalization decision, or do you want one of α/β baked into Phase 1?
5. **Is `claude-pr-review.yml`'s use of `origin/main` as the diff base actually currently functional?** If PRs are being opened against `vercel-deploy-test`, this workflow would diff against a 28-commit-old base, which would either generate massive false positives or fail outright. Worth knowing if this CI has been silently broken for the duration of the divergence.

---

## What I did NOT do

Confirmed explicitly:

- ✅ **No files edited** other than the deliverable (`PHASE1_DECISIONS_INVESTIGATION_2026-05-02.md`).
- ✅ **No commits made.**
- ✅ **No installs performed** (no `npm install`, no `pnpm install`, no `npm add`, etc.).
- ✅ **No config changes** (no edits to `package.json`, `tsconfig.json`, `vercel.json`, `next.config.mjs`, `.gitignore`, or any other config file).
- ✅ **No migrations run.**
- ✅ **No branch operations** (no checkout, no merge, no rebase, no reset, no push, no delete). Branch is unchanged at `vercel-deploy-test`.
- ✅ **No lockfile modifications.**
- ✅ **No node_modules changes.**

Vercel CLI was used in **read-only** mode (`vercel ls`, `vercel inspect`, `vercel project ls`) — no deploy was triggered.

The only filesystem writes performed by this session are this single markdown report at the repo root.
