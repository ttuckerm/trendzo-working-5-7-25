# Phase 1 — Vercel Project & Gitignore Investigation

**Date:** 2026-05-02
**Mode:** Read-only
**Companion to:**
- `PHASE1_BUILD_INVESTIGATION_2026-05-02.md`
- `PHASE1_DECISIONS_INVESTIGATION_2026-05-02.md`

---

## Pre-flight results

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Both Phase 1 reports exist at repo root | ✅ PASS | Confirmed via `Test-Path` |
| 2 | Currently on branch `vercel-deploy-test` | ✅ PASS | `git rev-parse --abbrev-ref HEAD` → `vercel-deploy-test` |
| 3 | `git status` no dirtier than at end of Investigation #2 | ✅ PASS | 30 short-status entries (was 29 at end of #2). +1 = the new `PHASE1_DECISIONS_INVESTIGATION_2026-05-02.md` from #2 itself. No new tracked-file modifications. |
| 4 | `npx vercel --version` works and CLI authenticated | ✅ PASS | `Vercel CLI 52.0.0`, authenticated as `admin-4568` |

**Pre-flight: PASSED. Proceeding.**

---

## Question A — Which Vercel project is wired up to this GitHub repo?

### Evidence

#### A1 — `npx vercel project ls`

```
$ npx vercel project ls
> Projects found under tommys-projects-e3a941fb
  Project Name                   Latest Production URL                                                Updated   Node Version
  trendzo-working-5-7-25         https://trendzo-working-5-7-25-tommys-projects-e3a941fb.vercel.app   9d        24.x
  trendzo-test                   https://trendzo-test-tommys-projects-e3a941fb.vercel.app             11d       24.x
  v0-mom-site-demo-az31leymjzt   --                                                                   183d      22.x
```

Two active projects in the org: `trendzo-working-5-7-25` (last prod 9d) and `trendzo-test` (last prod 11d). The third project (`v0-mom-site-demo-...`) is unrelated (183d stale, no recent activity).

#### A5 — GitHub remote URL of this local repo

```
$ git config --get remote.origin.url
https://github.com/ttuckerm/trendzo-working-5-7-25
```

The GitHub repo this clone pushes to is **`ttuckerm/trendzo-working-5-7-25`**.

#### A7 — `.vercel/project.json` of this local clone

```
$ Test-Path .vercel\project.json
True

$ Get-Content .vercel\project.json -Raw
{"projectId":"prj_Lj0BziVmqm9PmfCCC89dPf5uzoGh","orgId":"team_r4yU1CXPLv7UeQo9qkAshGbl","projectName":"trendzo-test"}
```

The local `.vercel/project.json` (the file `vercel link` writes when you bind a clone to a project) declares this clone is linked to **`trendzo-test`** (project ID `prj_Lj0BziVmqm9PmfCCC89dPf5uzoGh`). This is the project that any `npx vercel ...` command run from this directory will target by default.

> **Note the divergence already visible:** the local link is to `trendzo-test`, but the GitHub repo name matches `trendzo-working-5-7-25`. The two are not the same project.

#### A3 — Recent deployments per project

```
$ npx vercel ls trendzo-test
  Age   Deployment                                                                Status   Environment   Duration
  4d    https://trendzo-test-o6n817s4c-tommys-projects-e3a941fb.vercel.app        ● Error  Preview        16s
  8d    https://trendzo-test-fsg1p2vwn-tommys-projects-e3a941fb.vercel.app        ● Error  Preview        3m
  9d    https://trendzo-test-mxm7tstkw-tommys-projects-e3a941fb.vercel.app        ● Error  Preview        3m
  9d    https://trendzo-test-8jz32lv5t-tommys-projects-e3a941fb.vercel.app        ● Error  Preview        4m
  10d   https://trendzo-test-ck7hj18xo-tommys-projects-e3a941fb.vercel.app        ● Error  Preview        7m
  10d   https://trendzo-test-8msdrfm7u-tommys-projects-e3a941fb.vercel.app        ● Error  Preview        11m
  11d   https://trendzo-test-8itlelvn7-tommys-projects-e3a941fb.vercel.app        ● Error  Preview        5m
  11d   https://trendzo-test-5n0txcf0k-tommys-projects-e3a941fb.vercel.app        ● Error  Preview        5m
  11d   https://trendzo-test-dchzwkalm-tommys-projects-e3a941fb.vercel.app        ● Error  Production     50s
```

```
$ npx vercel ls trendzo-working-5-7-25
  Age   Deployment                                                                              Status   Environment   Duration
  4d    https://trendzo-working-5-7-25-bzym0jq16-tommys-projects-e3a941fb.vercel.app            ● Error  Preview        16s
  8d    https://trendzo-working-5-7-25-6oc08hqfe-tommys-projects-e3a941fb.vercel.app            ● Error  Preview        3m
  9d    https://trendzo-working-5-7-25-20eiki1rm-tommys-projects-e3a941fb.vercel.app            ● Error  Preview        3m
  9d    https://trendzo-working-5-7-25-fwusa0w13-tommys-projects-e3a941fb.vercel.app            ● Error  Production     3m
```

**Same age, same status, same duration for the most recent deployments** of both projects. This is highly suggestive that both projects are deploying from the same git pushes.

#### A2 — `vercel inspect` on one deployment from each project

```
$ npx vercel inspect https://trendzo-test-o6n817s4c-tommys-projects-e3a941fb.vercel.app
General
  id        dpl_7VguGVwy7QBUXbyzKHVxd8dxugFk
  name      trendzo-test
  target    preview
  status    ● Error
  url       https://trendzo-test-o6n817s4c-tommys-projects-e3a941fb.vercel.app
  created   Wed Apr 29 2026 18:58:53 GMT-0400 (Eastern Daylight Time) [4d ago]
Aliases
  ╶ https://trendzo-test-git-vercel-deploy-test-tommys-projects-e3a941fb.vercel.app
```

```
$ npx vercel inspect https://trendzo-working-5-7-25-bzym0jq16-tommys-projects-e3a941fb.vercel.app
General
  id        dpl_8udxRCWQrrJaGBednsooThiqRALN
  name      trendzo-working-5-7-25
  target    preview
  status    ● Error
  url       https://trendzo-working-5-7-25-bzym0jq16-tommys-projects-e3a941fb.vercel.app
  created   Wed Apr 29 2026 18:58:53 GMT-0400 (Eastern Daylight Time) [4d ago]
Aliases
  ╶ https://trendzo-working-5-7-25-git-verc-bebf5c-tommys-projects-e3a941fb.vercel.app
```

```
$ npx vercel inspect https://trendzo-working-5-7-25-fwusa0w13-tommys-projects-e3a941fb.vercel.app
General
  id        dpl_DA6L3riubQV9FWw7qdpW4zDjhLC3
  name      trendzo-working-5-7-25
  target    production
  status    ● Error
  url       https://trendzo-working-5-7-25-fwusa0w13-tommys-projects-e3a941fb.vercel.app
  created   Fri Apr 24 2026 13:21:05 GMT-0400 (Eastern Daylight Time) [9d ago]
Aliases
  ╶ https://trendzo-working-5-7-25-tommys-projects-e3a941fb.vercel.app
  ╶ https://trendzo-working-5-7-25-git-verc-bebf5c-tommys-projects-e3a941fb.vercel.app
```

**Decisive cross-project alignment:**

- `trendzo-test` deployment `dpl_7VguGVwy7QBUXbyzKHVxd8dxugFk` was created `Wed Apr 29 2026 18:58:53 GMT-0400`.
- `trendzo-working-5-7-25` deployment `dpl_8udxRCWQrrJaGBednsooThiqRALN` was created `Wed Apr 29 2026 18:58:53 GMT-0400`.
- **Same wall-clock second** — separate deployment IDs, same trigger.

The git-branch alias on each:
- `trendzo-test`: `trendzo-test-git-vercel-deploy-test-...` → branch `vercel-deploy-test` (full)
- `trendzo-working-5-7-25`: `trendzo-working-5-7-25-git-verc-bebf5c-...` → branch `vercel-deploy-test` (truncated to fit Vercel's alias length limit; Vercel keeps the prefix `verc-` and appends a stable hash `bebf5c`)

Both aliases encode the same source branch (`vercel-deploy-test`).

The Vercel CLI's `inspect` view does not surface the source commit SHA in the General/Aliases sections (this CLI version only shows `id`, `name`, `target`, `status`, `url`, `created`, and Aliases). I cannot satisfy A4's SHA cross-check from CLI output alone — but the **simultaneous-creation timestamps and matching branch aliases are stronger evidence** that both projects are receiving the same git push event from the same GitHub webhook.

#### A6 — `vercel git ls`?

```
$ npx vercel git ls
Error: Please specify a valid subcommand: connect | disconnect
```

`vercel git` does not expose a "list connected repos" subcommand in CLI 52.0.0. Only `connect` / `disconnect`. **The Vercel dashboard would be needed to inspect each project's connected GitHub repo URL directly.** Logged as an open question.

#### A4 — SHA cross-check

Cannot perform the requested SHA cross-check because the `vercel inspect` output in CLI 52.0.0 does not surface the deployment's source SHA in any of the inspectable sections. Verbatim from above: `General` shows id/name/target/status/url/created; `Aliases` shows the URL aliases; `Builds` shows just `╶ .  [0ms]`. No `commit`, `sha`, `gitSource`, `repository`, or `revision` field is rendered.

**Workaround attempted:** the deployment IDs (`dpl_7Vgu...` and `dpl_8udx...`) are different, so they are demonstrably distinct deployments — not two views of the same row. The matching `created` timestamps to the second + matching branch aliases is what carries the proof.

### Finding A

**Both Vercel projects are connected to the same GitHub repo (`ttuckerm/trendzo-working-5-7-25`) and both auto-deploy on every git push.** The evidence:

1. The local `.vercel/project.json` declares this clone is linked to **`trendzo-test`** — that's where local CLI commands go.
2. The GitHub remote `origin` is `https://github.com/ttuckerm/trendzo-working-5-7-25` — that's where `git push` goes.
3. Every recent deployment in both projects was created at the same wall-clock second (e.g., `Wed Apr 29 2026 18:58:53` for both `dpl_7Vgu...` in `trendzo-test` and `dpl_8udx...` in `trendzo-working-5-7-25`).
4. Both projects' deployments encode `vercel-deploy-test` as the source branch in their git-aliases.
5. Both projects show identical age/status patterns across their last several deployments (4d/8d/9d Errors).

**Implication for "which is canonical":** Filesystem evidence cannot answer this. Both are connected, both are failing for the same reasons (the lockfile and `@/lib/data` issues from Phase 1 affect both equally because they're building from the same commit), and the local clone is bound to `trendzo-test` while the GitHub repo name matches `trendzo-working-5-7-25`. Most likely scenario: Tommy created `trendzo-test` first, then later created `trendzo-working-5-7-25` (perhaps in May 2026 — the project name suggests "working as of 5-7-25") and connected it to the same GitHub repo without disconnecting `trendzo-test`. The `trendzo-working-5-7-25` project has the more recent production deployment (9d vs 11d), suggesting it may be the *intended* current target.

**This requires a Tommy decision** — see open questions below.

---

## Question B — Is anchoring `.gitignore` line 60 safe?

### Evidence

#### B1 — `.gitignore` lines 55–70 (verbatim)

```
55: *.avi
56: *.mov
57: *.mkv
58:
59: # scraped data
60: data/
61:
62: # OS files
63: Thumbs.db
64: desktop.ini
65: .DS_Store
66: nul
67:
68: # scripts output
69: scripts/*.log
70:
```

The comment on line 59 (`# scraped data`) confirms the rule's *intent*: it was written to exclude scraped video data, which lives at `<repo-root>/data/`. The rule was not written with the intent of recursively matching every `data/` directory deeper in the tree — that's an unintended side effect of the unanchored pattern.

#### B2 — Every directory named `data` in the working tree (excl. `node_modules/`, `.next/`, `.git/`)

```
RelativePath                                  FileCount   SizeMB
------------                                  ---------   ------
data                                                204    1032.457
.bmad-core\data                                       4      0.038
autoresearch\data                                     4      2.777
src\data                                              1      0.004
src\app\admin\operations\training\data                1      0.026
src\components\templateEditor-v2\data                 1      0.007
src\lib\data                                          8      0.025
src\lib\training\data                                 3      3.840
```

**Eight `data/` directories total. Combined size on disk: ~1041 MB. The root `data/` alone is 1032 MB (~99% of the total).**

#### B3 — `git check-ignore -v` for each

```
=== data ===
.gitignore:60:data/   data
=== .bmad-core/data ===
.gitignore:60:data/   .bmad-core/data
=== autoresearch/data ===
.gitignore:60:data/   autoresearch/data
=== src/data ===
.gitignore:60:data/   src/data
=== src/app/admin/operations/training/data ===
.gitignore:60:data/   src/app/admin/operations/training/data
=== src/components/templateEditor-v2/data ===
.gitignore:60:data/   src/components/templateEditor-v2/data
=== src/lib/data ===
.gitignore:60:data/   src/lib/data
=== src/lib/training/data ===
.gitignore:60:data/   src/lib/training/data
```

**All 8 directories are matched only by the same `.gitignore:60` rule.** No other rule in `.gitignore` independently covers any of them. Anchoring line 60 to `/data/` would un-ignore all 7 non-root directories simultaneously.

#### B4 — Simulation: what becomes trackable post-anchor?

If line 60 is changed from `data/` to `/data/` (anchored to the repo root), the matching outcomes change as follows:

| Directory | Currently | After `/data/` anchor | Other rules matching? |
|-----------|-----------|------------------------|------------------------|
| `data/` (root) | ignored ✓ (intended) | **STILL ignored ✓** (1032 MB stays out of git) | n/a |
| `.bmad-core/data/` | ignored (unintended) | Becomes trackable | No other rule matches |
| `autoresearch/data/` | ignored (unintended) | Becomes trackable | No other rule matches |
| `src/data/` | ignored (unintended) | Becomes trackable | No other rule matches |
| `src/app/admin/operations/training/data/` | ignored (unintended) | Becomes trackable | No other rule matches |
| `src/components/templateEditor-v2/data/` | ignored (unintended) | Becomes trackable | No other rule matches |
| `src/lib/data/` | ignored (unintended — the bug) | **Becomes trackable** ✓ (the fix) | No other rule matches |
| `src/lib/training/data/` | ignored (unintended) | Becomes trackable | No other rule matches |

I manually inspected the full `.gitignore` (B8 below) for any other rule that could fall back to ignoring any of the 7 non-root paths. Nothing else matches them — they would all become candidates for tracking after the anchor.

#### B5 — Top-level contents of each `data/` directory

```
=== data (root, 1032 MB) ===
audio                      d (subdir)
frames                     d (subdir)
raw_videos                 d (subdir)
sandbox                    d (subdir)
seed                       d (subdir)
temp                       d (subdir)
test-frames                d (subdir)
tiktok_downloads           d (subdir)
tmp                        d (subdir)
custom_frameworks.json     26396 bytes
full_batch_956.log         277026 bytes
niches.json                563 bytes
sample-test.mp4            157858 bytes
test-audio.wav             320328 bytes
vps-baseline-before.json   12226 bytes
xgboost-retrain-input.json 195230 bytes

=== .bmad-core/data (38 KB) ===
bmad-kb.md                  32592 bytes
brainstorming-techniques.md  1923 bytes
elicitation-methods.md       5179 bytes
technical-preferences.md       66 bytes

=== autoresearch/data (2.7 MB) ===
.gitkeep                       0 bytes
README.md                   3120 bytes
snapshot-2026-03-22.json 1306269 bytes
snapshot-2026-03-25.json 1602350 bytes

=== src/data (4 KB) ===
niche-keywords.json         3779 bytes

=== src/app/admin/operations/training/data (26 KB) ===
page.tsx                   26976 bytes      ← Next.js page route!

=== src/components/templateEditor-v2/data (7 KB) ===
elementsData.ts             7727 bytes      ← TypeScript module

=== src/lib/data (25 KB) ===
apify.ts                    2275 bytes
framework_genes.json        1282 bytes
index.ts                    1590 bytes
init-fixtures.ts            6245 bytes      ← The Phase 1 missing import
mock.ts                     1687 bytes
real-data-connector.ts     11362 bytes
source.ts                    604 bytes      ← The Phase 1 missing import
upload.ts                    747 bytes      ← Phase 1 missing import

=== src/lib/training/data (3.8 MB) ===
feature_metadata.json      15342 bytes
holdout_data.csv          139918 bytes
training_data.csv        3871391 bytes
```

#### B6 — Sensitivity scan

**Filename/extension regex sweep** (`secret`, `key`, `token`, `credentials`, `.env`, `password`, `private`, `pem`, `cert`, plus `.env`/`.pem`/`.key`/`.p12`/`.pfx` extensions) across all 8 directories recursively:

```
=== SCAN: data ===                                       no name/extension hits
=== SCAN: .bmad-core/data ===                             no name/extension hits
=== SCAN: autoresearch/data ===                           no name/extension hits
=== SCAN: src/data ===                                    HIT: src\data\niche-keywords.json (3779 bytes)
=== SCAN: src/app/admin/operations/training/data ===      no name/extension hits
=== SCAN: src/components/templateEditor-v2/data ===       no name/extension hits
=== SCAN: src/lib/data ===                                no name/extension hits
=== SCAN: src/lib/training/data ===                       no name/extension hits
```

The single hit is a **false positive**: `niche-keywords.json` matches because the substring `key` appears in the word `keywords`. Spot-checked first 30 lines — file contains TikTok search keyword arrays (`"money", "invest", "workout", "side hustle", ...`). Not a credential.

**Spot-checks of representative files** (first 20 lines or 1KB; reading these does not commit them to git):

- `autoresearch/data/README.md` — Documents that this directory is for "exported snapshots of labeled prediction data". **Critically, line 4 reads:** *"Actual data files are gitignored; only `.gitkeep` and this README are tracked."* The original author explicitly intended `.gitkeep` and `README.md` to be tracked but the JSON snapshots to remain ignored. The current `data/` rule was preventing all four files (including `.gitkeep` and the README) from being committed. Anchoring will start tracking everything in this directory unless a more specific rule is added.
- `autoresearch/data/snapshot-2026-03-25.json` — A 1.6 MB JSON dump of `prediction_runs` rows containing video IDs (UUIDs), predicted/actual VPS scores, confidence intervals, components used. No PII or credentials, but **the README states these should remain ignored**.
- `src/data/niche-keywords.json` — TikTok niche-classification keywords. Not sensitive.
- `src/app/admin/operations/training/data/page.tsx` — `'use client'` Next.js page component. UI for the Training Data admin page. Source code, not data.
- `src/components/templateEditor-v2/data/elementsData.ts` — TypeScript module exporting `elementCategories: ElementCategory[]`. Source code.
- `src/lib/training/data/feature_metadata.json` — JSON listing ML feature names (`views_count`, `likes_count`, etc.) with metadata. Not sensitive but documents internal feature schema.
- `src/lib/training/data/holdout_data.csv` — CSV with columns `video_id,niche,source,dps_score,views_count,likes_count,...` (~120 columns). No PII; per-video aggregate metrics. ~140 KB.
- `src/lib/training/data/training_data.csv` — Same schema as holdout but ~3.8 MB. Same sensitivity profile.
- `.bmad-core/data/bmad-kb.md` — BMad framework knowledge-base markdown ("Breakthrough Method of Agile AI-driven Development"). Documentation. Not sensitive.

**No secrets, no credentials, no PII found in any of the 7 non-root `data/` directories.** The remaining concerns are size and intent (see Finding B).

#### B7 — Size of `<repo-root>/data/`

`1032.457 MB` on disk (204 files). **This single directory is over 10× larger than GitHub's recommended single-file limit (100 MB) for the largest individual file, and the directory as a whole would dwarf typical repo sizes.** Anchoring `/data/` keeps this directory excluded — confirmed correct outcome.

I did NOT enumerate per-file sizes inside `data/` because the directory should remain ignored regardless of contents.

#### B8 — Other unanchored gitignore rules with potential collision risk

Full `.gitignore` is 91 lines. Classifying every directory rule (lines ending in `/`):

| Line | Rule | Anchored? | Working-tree collisions found |
|------|------|-----------|-------------------------------|
| 2 | `/node_modules` | ✓ anchored | n/a |
| 3 | `/.pnp` | ✓ anchored | n/a |
| 5 | `.yarn/install-state.gz` | unanchored, deep path | none currently |
| 8 | `/coverage` | ✓ anchored | n/a |
| 11 | `/.next/` | ✓ anchored | n/a |
| 12 | `/out/` | ✓ anchored | n/a |
| 15 | `/build` | ✓ anchored | n/a |
| 34 | `.vercel` | unanchored (file or dir) | only `.vercel/` at root in tree |
| 37 | `/logs` | ✓ anchored | n/a |
| 49 | `/temp-install/` | ✓ anchored | n/a |
| 50 | `/whisper_env/` | ✓ anchored | n/a |
| 51 | `/ffmpeg-master-latest-linux64-gpl/` | ✓ anchored | n/a |
| **60** | **`data/`** | **unanchored** | **8 matches in tree** ← the bug being fixed |
| 72 | `.git-backup/` | unanchored | none in tree |
| 73 | `agent-starter-python/` | unanchored | only at root |
| 74 | `frameworks-and-research/` | unanchored | only at root |
| 75 | `tmp/` | unanchored | **2 matches: `tmp/` (root) and `data/tmp/`** ← same bug pattern, but practically inert |
| 82 | `.claude/` | unanchored | only `.claude/` at root in tree (from `Get-ChildItem`; the user's home `.claude/` is outside the repo) |
| 86 | `.gstack/` | unanchored | only at root |
| 89 | `model-backups/` | unanchored | only at root |
| 91 | `.vercel` | unanchored (duplicate of line 34) | redundant — same match |

**Findings:**

1. **`tmp/` (line 75) has the same structural flaw as `data/` (line 60):** unanchored, and there is more than one `tmp/` directory in the working tree (`<repo-root>/tmp/` and `data/tmp/`). However, the practical impact is currently nil because `data/tmp/` is nested inside `<repo-root>/data/`, which is itself ignored — so `data/tmp/` is doubly-ignored. If `data/` were ever moved or anchored without tightening `tmp/`, the issue would become live.
2. **`.vercel` is listed twice (lines 34 and 91).** Redundant but not harmful.
3. **No other unanchored directory rule currently has multiple matches in the tree.** All other unanchored rules (`agent-starter-python/`, `frameworks-and-research/`, `tmp/` excepted, `.claude/`, `.gstack/`, `model-backups/`, `.git-backup/`) either have zero or one match. They are latent risks (a future contributor creating, say, `src/lib/.claude/` would silently lose it from git), but not active bugs today.

### Finding B

**Anchoring `.gitignore` line 60 from `data/` to `/data/` would successfully recover `src/lib/data/` for git tracking AND would not expose any secrets or credentials.** All 8 directories were sensitivity-scanned; the only filename-regex hit was a false positive (`niche-keywords.json` matched on `key` in `keywords`). The 1 GB root `data/` directory stays excluded by the anchored rule.

**However, the change has 6 cascading side effects on other `data/` subdirectories** that Tommy needs to decide about explicitly. I am NOT recommending a single course of action because two of these subdirectories carry intent-versus-implementation conflicts that only Tommy can resolve. Per the standing principle, here is the evidence-backed breakdown:

#### Side effect 1: `src/app/admin/operations/training/data/page.tsx` — silently broken admin route ★

This file is a Next.js page route at `/admin/operations/training/data` (the directory name is `data` but the contents are a `'use client'` React component, not data). The route is referenced in **three tracked source files**:

```
src/components/admin/navigation-config.ts:96
  { label: 'Training Data', href: '/admin/operations/training/data', icon: FileStack },

src/app/admin/operations/page.tsx:857
  href="/admin/operations/training/data"

src/lib/control-center/constants.ts:101
  path: '/admin/operations/training/data',
```

But the page file itself has been silently excluded from git by the `data/` rule. **On Vercel, this admin nav link is currently a 404** — it builds successfully (because no other code imports the missing page file), but the nav button takes you nowhere. Anchoring `/data/` recovers this page automatically. **This is a second silent-build-quality-bug fix beyond the `src/lib/data/` Phase 1 issue.**

#### Side effect 2: `src/components/templateEditor-v2/data/elementsData.ts` — module not currently in git

This is a 7.7 KB TypeScript module exporting `elementCategories: ElementCategory[]`. Whether anything imports it currently is its own grep question (not strictly in scope here), but it's source code that's been silently excluded. Anchoring recovers it.

#### Side effect 3: `src/data/niche-keywords.json` — small data file

3.7 KB JSON. CLAUDE.md explicitly references this file (line ~865: *"`src/data/niche-keywords.json` and `config/niche-keywords.json` are AI-generated — NOT authoritative"*) — meaning the project has been operating as if this file exists in the repo, when in fact git has been refusing to track it. Anchoring recovers it.

#### Side effect 4: `src/lib/data/` — the Phase 1 target ✓

8 source files (25 KB total) including `init-fixtures.ts`, `source.ts`, `mock.ts`, `upload.ts` — the four files Phase 1 identified as missing-from-Vercel. Anchoring recovers these. **This is the goal.**

`src/lib/data/index.ts` (54 lines, read in full) shows the module is a clean source/mock/apify dispatcher with `getSource()` and a backwards-compat `source` export — exactly what the importers expect. No surprises.

#### Side effect 5: `src/lib/training/data/` — 3.8 MB of training CSVs (NEEDS A DECISION)

Three files: `feature_metadata.json` (15 KB, definitely should be tracked — defines the ML feature schema), `holdout_data.csv` (140 KB), and `training_data.csv` (3.8 MB).

The CSVs contain per-video aggregate metrics (no PII), but tracking a 3.8 MB CSV in git permanently bloats the repo's history every time the file is regenerated. **Common practice is to track the metadata file but exclude the CSVs.** If Tommy wants to follow that pattern, anchoring `/data/` should be paired with adding a new rule like:

```
# Training datasets — track schema, not the bulk data
src/lib/training/data/*.csv
```

Tommy's call. No security concern either way.

#### Side effect 6: `autoresearch/data/` — explicit intent conflict (NEEDS A DECISION) ★

The `autoresearch/data/README.md` says verbatim:

> "Actual data files are gitignored; only `.gitkeep` and this README are tracked."

Right now, *nothing* in this directory is tracked (the gitignore is over-broad). Anchoring `/data/` would start tracking ALL FOUR files: `.gitkeep` (good — that's the intent), `README.md` (good — that's the intent), `snapshot-2026-03-22.json` (1.3 MB — the README says NO), `snapshot-2026-03-25.json` (1.6 MB — the README says NO).

To honor the original author's stated intent, anchoring should be paired with:

```
# Snapshot exports — schema lives in README, data does not
autoresearch/data/snapshot-*.json
```

Without that companion rule, anchoring will inadvertently start tracking 2.9 MB of snapshot data the README explicitly designated as ignored.

#### Side effect 7: `.bmad-core/data/` — third-party framework docs

4 markdown files (38 KB) belonging to the BMad framework (`.bmad-core/` is otherwise tracked: `git ls-files .bmad-core | wc -l` returns 84 tracked files). The markdown files are documentation/configuration for the framework. Whether to track them depends on whether the BMad framework needs them on Vercel — likely yes, because the rest of `.bmad-core/` is tracked and a partial framework on Vercel is suspect. Probably safe to track. Tommy's call.

### Recommendation

**Anchor `data/` → `/data/`, AND add two narrowly-scoped follow-up rules to preserve original intent:**

```
/data/                                  # was: data/  — anchored to root only
src/lib/training/data/*.csv             # NEW — keep large CSVs out of git (track schema only)
autoresearch/data/snapshot-*.json       # NEW — honor README's stated intent
```

Reasoning, per the standing principle:

- Recovers `src/lib/data/` (the Phase 1 build-blocker).
- Recovers `src/app/admin/operations/training/data/page.tsx` (a silently-broken admin route that's referenced in 3 places).
- Recovers `src/data/niche-keywords.json`, `src/components/templateEditor-v2/data/elementsData.ts`, `.bmad-core/data/*` (small, source-or-config files that the project assumes exist in the repo).
- Keeps `<repo-root>/data/` (1 GB of scraped video data) excluded.
- Honors the explicit "track schema, not bulk data" intent in `autoresearch/data/README.md`.
- Avoids permanently bloating the repo with regenerated training CSVs.
- Zero secrets exposed (sensitivity scan confirmed clean).

This change is small, evidence-backed, and reversible (one commit can be reverted). Tommy makes the final call.

---

## Other unanchored gitignore patterns flagged (informational)

| Line | Rule | Status |
|------|------|--------|
| 60 | `data/` | **Active bug — fix proposed in Finding B** |
| 75 | `tmp/` | **Latent bug** — same pattern, currently inert because the second match (`data/tmp/`) is nested in the (also-ignored) root `data/`. Worth tightening to `/tmp/` in the same change. |
| 91 | `.vercel` | Redundant with line 34. Cosmetic. |
| 4-5, 18, 19, 22-24, 27-31, 38, 41-46, 53-57, 63-66, 78-79, 85 | various globs/files | Glob/file patterns intended to be unanchored (`.DS_Store`, `*.log`, `.env*`, `*.mp4`, etc.). All correct. |
| 34, 72-75, 82, 86, 89 | unanchored directory names with currently-only-one-match | Latent risk only. A future contributor creating, e.g., `src/lib/.claude/` would silently lose it. Not actionable today. |

---

## Open questions for the user

1. **Which Vercel project do you intend as the canonical production target — `trendzo-test` or `trendzo-working-5-7-25`?** Both are connected to the same GitHub repo and both auto-deploy on every push (proven by matching deployment timestamps). The local `.vercel/project.json` binds CLI commands to `trendzo-test`. The GitHub repo name matches `trendzo-working-5-7-25`. The `trendzo-working-5-7-25` project has a more recent production deployment (9d vs 11d). Filesystem alone cannot determine your intent.
2. **Do you want to disconnect the non-canonical Vercel project from this GitHub repo?** If both stay connected, every git push will continue triggering two simultaneous builds and two failure notifications. This wastes Vercel build minutes and creates noise.
3. **For Finding B Side Effect 5 (`src/lib/training/data/*.csv`):** do you want the 3.8 MB training CSV tracked in git, or kept out (with only `feature_metadata.json` tracked)? Both are defensible; the project doesn't currently make this clear.
4. **For Finding B Side Effect 6 (`autoresearch/data/snapshot-*.json`):** do you want to honor the README's stated intent and keep snapshots ignored (the recommendation), or track them? Tracking them would add ~2.9 MB to the repo per snapshot.
5. **For Finding B Side Effect 7 (`.bmad-core/data/`):** the rest of `.bmad-core/` is tracked (84 files). Do you want the 4 markdown files in its `data/` subdir tracked too? (Likely yes for consistency.)
6. **Is the `tmp/` rule's structural flaw worth fixing in the same change?** It currently doesn't manifest as a visible bug, but it's the same pattern that caused the `data/` problem. Tightening it to `/tmp/` in the same commit costs nothing.

---

## What I did NOT do

Confirmed explicitly:

- ✅ **No files edited** other than the deliverable (`PHASE1_VERCEL_AND_GITIGNORE_INVESTIGATION_2026-05-02.md`).
- ✅ **No commits made.**
- ✅ **No installs performed** (no `npm install`, no `pnpm install`, no `vercel install`, etc.).
- ✅ **No config changes** (no edits to `package.json`, `tsconfig.json`, `vercel.json`, `next.config.mjs`, `.gitignore`, `.vercel/project.json`, or any other file).
- ✅ **No migrations run.**
- ✅ **No branch operations** (no checkout, no merge, no rebase, no reset, no push, no delete). Branch is unchanged at `vercel-deploy-test`.
- ✅ **No Vercel deploys triggered.** All `vercel` invocations were read-only (`vercel --version`, `vercel whoami`, `vercel project ls`, `vercel ls <project>`, `vercel inspect <url>`, `vercel git ls`).
- ✅ **No Vercel project links created or destroyed** (no `vercel link`, no `vercel git connect`, no `vercel git disconnect`).
- ✅ **No git tracking operations attempted on previously-ignored files** (no `git add`, no `git add -f`).
- ✅ **No node_modules or lockfile changes.**

Per the standing principle: every claim about "safe to track" or "stays ignored" in this report is backed by either a `git check-ignore -v` output, a sensitivity scan output, a directory listing, or a verbatim comment from the codebase. No removals or destructive actions are recommended. Where the evidence required a Tommy judgment call (Side Effects 5, 6, 7 and Question A canonical-project), it is flagged in Open Questions rather than rounded up to a confident recommendation.
