# Phase 1 — Final Decisions

**Date:** 2026-05-02
**Mode:** Read-only
**Companion to:**
- `PHASE1_BUILD_INVESTIGATION_2026-05-02.md`
- `PHASE1_DECISIONS_INVESTIGATION_2026-05-02.md`
- `PHASE1_VERCEL_AND_GITIGNORE_INVESTIGATION_2026-05-02.md`

---

## Pre-flight results

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | All three prior Phase 1 reports exist at repo root | ✅ PASS | Confirmed via `Test-Path` for each. |
| 2 | Currently on branch `vercel-deploy-test` | ✅ PASS | `git branch --show-current` → `vercel-deploy-test`. |
| 3 | `git status` shows no NEW tracked-file modifications since end of Investigation #3 | ✅ PASS | `git status --short` returns 31 entries (was 30 at end of #3). The +1 is the new `PHASE1_VERCEL_AND_GITIGNORE_INVESTIGATION_2026-05-02.md` itself. No additional code-file mutations. |
| 4 | `npx vercel --version` works and CLI is authenticated | ✅ PASS | `Vercel CLI 52.0.0`. (Authentication verified by successful `vercel project ls`, `vercel domains ls`, `vercel env ls` calls.) |

**Pre-flight: PASSED. Proceeding.**

---

## Block 1 — Vercel Project Canonicalization

### Q1. Canonical project

#### Evidence

**Q1.1 — Custom domain map across the org**

```
$ npx vercel domains ls
> 0 Domains found under tommys-projects-e3a941fb [192ms]
```

**Zero custom domains exist anywhere in the org.** Both `trendzo-test` and `trendzo-working-5-7-25` rely entirely on auto-assigned `*.vercel.app` URLs. No live user-facing URL would break from any decision about either project.

**Q1.1 — Env vars on the locally-bound project (`trendzo-test`)**

```
$ npx vercel env ls
> Environment Variables found for tommys-projects-e3a941fb/trendzo-test [230ms]

  name                            environments (git branch)         created
  OPENAI_API_KEY                  Preview (vercel-deploy-test)      11d ago
  ANTHROPIC_API_KEY               Preview (vercel-deploy-test)      11d ago
  GOOGLE_GEMINI_AI_API_KEY        Preview (vercel-deploy-test)      11d ago
  SUPABASE_SERVICE_KEY            Preview (vercel-deploy-test)      11d ago
  NEXT_PUBLIC_SUPABASE_ANON_KEY   Preview (vercel-deploy-test)      11d ago
  NEXT_PUBLIC_SUPABASE_URL        Preview (vercel-deploy-test)      11d ago
  CRON_SECRET                     Preview (vercel-deploy-test)      11d ago
```

(Names only — values not retrieved.) **7 env vars total, all scoped exclusively to `Preview (vercel-deploy-test)` — not Production, not Development.** This is unusual: it means `trendzo-test`'s Production environment has *no* env vars at all. Every successful production deploy would have run with empty `OPENAI_API_KEY`, empty `SUPABASE_SERVICE_KEY`, etc. — i.e., `trendzo-test` has never been configured to actually serve production.

**Env vars on `trendzo-working-5-7-25`:** Not enumerable from CLI without re-linking the local clone (`vercel env ls` reads from `.vercel/project.json`). Per the prompt's instruction "do not relink," this is left as a known gap. **Filesystem-side gap noted: env-var count on `trendzo-working-5-7-25` is unknown from this session.**

**Q1.2 — Commit messages mentioning either project name**

```
$ git log --all --pretty=format:"%h %ai %s" | Select-String -Pattern "trendzo-test|trendzo-working"
(no output)
```

**Zero commit messages anywhere in the repo's history mention either Vercel project name.** Neither was created or abandoned via an explicit commit. There's no ground-truth git record of intent.

**Q1.3 — Successful deployments per project**

```
$ npx vercel ls trendzo-test --status ready
> No deployments found under tommys-projects-e3a941fb.

$ npx vercel ls trendzo-working-5-7-25 --status ready
> No deployments found under tommys-projects-e3a941fb.
```

**Neither project has ANY successful deployment in its visible history.** Every visible deployment in both projects is in `● Error` state. Investigation #3 already confirmed this for the visible window; the `--status ready` filter confirms it for the entire CLI-visible history.

This means we cannot distinguish "the canonical one" by "the one that last shipped successfully" — both have shipped exactly zero times in the visible window.

What we CAN distinguish: most recent **attempted** deployments.
- `trendzo-test`: 9 visible deploys, latest 4d ago, latest production 11d ago.
- `trendzo-working-5-7-25`: 4 visible deploys, latest 4d ago, latest production 9d ago.

The most recent **production attempt** is on `trendzo-working-5-7-25` (9d) vs `trendzo-test` (11d).

**Q1.4 — Git remote URL**

```
$ git config --get remote.origin.url
https://github.com/ttuckerm/trendzo-working-5-7-25
```

**The GitHub repo this clone pushes to is `ttuckerm/trendzo-working-5-7-25`** — exactly matches the Vercel project name `trendzo-working-5-7-25`. By Vercel's default convention (and what most CI tooling expects), the Vercel project whose name matches the GitHub repo is the intended canonical one.

**Q1.5 — `.vercel/project.json` (local CLI binding)**

```json
{"projectId":"prj_Lj0BziVmqm9PmfCCC89dPf5uzoGh","orgId":"team_r4yU1CXPLv7UeQo9qkAshGbl","projectName":"trendzo-test"}
```

The local clone's CLI is bound to `trendzo-test`. This is a local artifact (`vercel link`) and does not encode the user's intent about which project is canonical — it just records "this is the project the CLI was linked against most recently from this directory."

#### Recommendation

**Canonical project = `trendzo-working-5-7-25`.**

Evidence pointing to it (in order of weight):

1. **Name matches the GitHub repo** (`ttuckerm/trendzo-working-5-7-25` === `trendzo-working-5-7-25`). This is Vercel's default convention and the canonical signal absent other intent.
2. **More recent production deployment attempt** (9d vs 11d).
3. **The other project's name literally contains "test"** (`trendzo-test`). Convention is that "-test" / "-staging" / "-preview" projects are not the production target.
4. **`trendzo-test`'s env vars are scoped only to the `vercel-deploy-test` Preview branch, not to Production**, suggesting it was set up as a sandbox specifically to debug the current branch's deploys, not to serve real traffic.

**Risk of choosing `trendzo-working-5-7-25`:**

- The local clone is bound to `trendzo-test` via `.vercel/project.json`. To run `vercel ...` commands against the canonical project, Tommy will need to re-link (`vercel link --yes` and select `trendzo-working-5-7-25`, or delete `.vercel/project.json` and re-run `vercel link`). One-time cost, reversible.
- Env vars currently live only on `trendzo-test` (7 vars, Preview-scoped). If `trendzo-working-5-7-25` does not already have its own env vars (unknown from this session — see gap above), Tommy will need to copy them across. The CLI `vercel env pull` (against the source project) plus `vercel env add` (against the target project) handles this. **Note: this is a Phase 2 build-fix step, NOT a recommendation for this read-only session.**

**Default if Tommy says yes:** Canonical = `trendzo-working-5-7-25`. Subsequent build-fix work targets that project. Local clone gets re-linked at the start of Phase 2.

---

### Q2. Non-canonical project disposition

#### Evidence

**Q2.1 — What `trendzo-test` would lose if disconnected from GitHub:**

- **Custom domains:** 0 (per Q1.1 — zero in the entire org). Nothing routes via this project.
- **Env vars:** 7 env vars (per Q1.1). **These are PRESERVED on disconnect.** Disconnect only removes the GitHub webhook integration; it does not delete env vars or deploy history.
- **Deploy history:** Preserved. The dashboard continues to show the project and all past deployments after disconnect; only auto-deploy on git push is severed. (Vercel's documented behavior.)

**Q2.2 — Disconnect vs. delete:**

| Operation | Reversible? | What's lost |
|-----------|-------------|-------------|
| `vercel git disconnect` | Yes — reconnect via `vercel git connect` | Only the GitHub webhook. Env vars, deploy history, settings, custom domains all preserved. |
| Delete project (dashboard / `vercel projects rm`) | **No — irreversible** | Everything: env vars, deploy history, settings, custom domain bindings, project ID. |

**Q2.3 — Active custom domain on `trendzo-test`:**

Zero (per Q1.1). No user-facing URL routes through this project. Deletion would not break any live traffic.

#### Recommendation

**Disconnect `trendzo-test` from GitHub. Do NOT delete it.**

Evidence:

- Disconnect achieves the operational goal (stop the duplicate-build noise on every push) at zero risk.
- Delete is irreversible. If three months from now Tommy realizes there was a useful build log, env var, or settings snapshot on `trendzo-test`, deletion has erased that permanently.
- The standing principle says "default to the LEAST destructive REVERSIBLE option." Disconnect is reversible; delete is not.
- The 7 env vars on `trendzo-test` may be needed as the source-of-truth for migrating to `trendzo-working-5-7-25` in Phase 2. Disconnecting preserves them; deleting loses them.

**Risk of disconnecting `trendzo-test`:**

- Tommy retains a stale, dormant project in the dashboard. Slight cognitive overhead. Easy to relabel via the project's Display Name in the dashboard if the name itself causes confusion.
- After disconnect, every push will only deploy to `trendzo-working-5-7-25` (one build instead of two). Build minutes are cut in half, and the current "two failure emails per push" noise stops.

**Default if Tommy says yes:**

1. After Phase 2 has migrated env vars from `trendzo-test` → `trendzo-working-5-7-25` AND verified `trendzo-working-5-7-25` is building cleanly, run `vercel git disconnect` against `trendzo-test` (from a re-linked CLI session targeting `trendzo-test`).
2. Leave `trendzo-test` in place as a dormant historical reference.
3. Optionally rename it to `trendzo-test-DEPRECATED-2026-05` in the dashboard for clarity.
4. Do NOT delete it.

If Tommy ever later confirms `trendzo-test` is truly never needed again (e.g., 90+ days of clean operation on `trendzo-working-5-7-25`), deletion can be revisited then. That is a Phase 3+ decision, not a Phase 1 decision.

---

## Block 2 — Gitignore & Training Data

### Q3. Training CSVs (track or exclude?)

#### Evidence

**Q3.1 — All references to `training_data.csv`, `holdout_data.csv`, `feature_metadata.json`:**

| File path category | Files | Role |
|---|---|---|
| **Vercel-served Next.js routes** | `src/app/api/admin/training/export-data/route.ts` | Imports `exportScrapedTrainingData()` and **WRITES** the CSVs (admin POST endpoint). Does not READ them. |
| **CLI / tsx scripts (not bundled by Next.js)** | `src/lib/training/run_export_training_data.ts`, `src/lib/training/export-scraped-training-data.ts`, `src/lib/training/backfill_fixed_features.ts`, `src/lib/training/smoke_vector_diff.ts`, `src/lib/training/smoke_test_v15.ts` | Each invoked via `npx tsx`. The first two **WRITE** the CSVs; `backfill_fixed_features.ts` **READS** them (lines 483-484); the rest reference them in comments or compare paths. |
| **Python scripts (local training, not in Vercel build)** | `src/lib/training/retrain_s6.py`, `src/lib/training/retrain_s7.py`, `src/lib/training/validate_s7.py`, `src/lib/training/smoke_python_preds.py`, `src/lib/training/investigate_sound_type.py`, `src/lib/training/autoresearch/autoresearch_run.py`, `src/lib/training/autoresearch/bootstrap_validation.py`, `src/scripts/retrain_model.py`, `scripts/train-xgboost-v7-phase1.py`, `scripts/train-xgboost-v8.py` | Read or write via `pd.read_csv` / `pd.DataFrame.to_csv` / `open()`. None ship to Vercel — Python files are not part of the Next.js build. |
| **Documentation / output records** | `docs/RETRAIN_REPORT.md`, `docs/CURRENT_STATE_AUDIT_2026-03-19.md`, ~30 files in `results-autoresearch/auto-*/results.json` (just record the path string in run output) | Not code. |
| **The investigation report** | `PHASE1_VERCEL_AND_GITIGNORE_INVESTIGATION_2026-05-02.md` | Self-reference. |

**Q3.2 — Git history for these filenames:**

```
$ git log --all --oneline --diff-filter=A -- "**/training_data.csv"
051f431 checkpoint: 2026-04-29 — escape funnel + agency dashboard parity work

$ git show --stat 051f431 -- "**/training_data.csv" "**/holdout_data.csv"
  results-autoresearch/bootstrap_validation_s9/pre_export_snapshot/holdout_data.csv  | 201 +
  results-autoresearch/bootstrap_validation_s9/pre_export_snapshot/training_data.csv | 5646 ++++++++++++++++++++
  2 files changed, 5847 insertions(+)
```

**The only commit ever to add either filename** committed them to a `results-autoresearch/...` path that is OUTSIDE any `data/` directory — so the gitignore rule never blocked them. There is also a 26-byte placeholder `training_data.csv` at the repo root, tracked since the `c1426cb` "Fresh init" commit. **The CSVs at `src/lib/training/data/` have NEVER been git-tracked on any branch.**

**Q3.3 — On-disk modification times:**

```
Name                   Length LastWriteTime
----                   ------ -------------
feature_metadata.json   15342 4/21/2026 6:36:10 AM
holdout_data.csv       139918 4/21/2026 6:36:10 AM
training_data.csv     3871391 4/21/2026 6:36:10 AM
```

All three files have identical mtimes (4/21/2026 6:36:10 AM — same single export run, ~12 days ago). `feature_metadata.json` is also written by the export script, so it's not a separate hand-curated schema — it's a derived artifact from the same run.

**Q3.4 — Are the CSVs inputs (manually prepared) or outputs (regenerated)?**

OUTPUTS. Confirmed three ways:
- `src/lib/training/export-scraped-training-data.ts:24-27` defines `DATA_DIR = src/lib/training/data` and writes `training_data.csv`, `holdout_data.csv`, `feature_metadata.json` into that directory.
- `src/lib/training/run_export_training_data.ts:11` documents itself as "Runs the same export logic the admin API route uses, then compares the newly-written CSVs against a pre-existing snapshot."
- `src/app/api/admin/training/export-data/route.ts` is described as: *"Exports training_eligible scraped_videos rows (training + holdout) to CSV for the Python XGBoost trainer: engagement/metadata from scraped_videos, plus a LEFT JOIN of training_features content columns on video_id."*

There is no scheduled regeneration (no Vercel cron, no GitHub Action, no `setInterval` in tracked code matches these CSV paths). They are regenerated on-demand by an admin clicking the Export button (or `npx tsx run_export_training_data.ts`).

**Q3.5 — Does any tracked code IMPORT or LOAD these CSVs at runtime, in a context that ships to Vercel?**

No. The grep for `read_csv\(|readFileSync.*\.csv|fs\.readFile.*\.csv` in `src/**/*.ts` and `src/**/*.tsx` returned **zero matches**. The only reader is `backfill_fixed_features.ts` — a `npx tsx ...` CLI script not part of the Next.js bundle. Vercel does not need these files at build time or runtime.

#### Recommendation

**Exclude the entire `src/lib/training/data/` directory from git.**

Reasoning per the standing principle:

- All 3 files are regenerable outputs of an admin endpoint that already exists (`/api/admin/training/export-data`).
- No Vercel-built code reads them at build or runtime.
- Tracking them adds 3.85 MB per regeneration to git history permanently. Even at one regeneration per month, that's ~46 MB/year of CSV churn.
- Excluding them does not break the export route (the route writes the directory; doesn't depend on prior content).
- Local Python training scripts already require the user to run the export step locally — that workflow is unchanged.
- A future change that wanted to bake the latest CSVs into a Vercel deploy could opt in via `git add -f` for that one snapshot, without re-tracking the directory.

**Risk of excluding:**

- A future contributor cloning the repo will not get the latest training data automatically; they must hit `/api/admin/training/export-data` (admin auth required) or run `npx tsx src/lib/training/run_export_training_data.ts` to regenerate. This is the **current** behavior already (the files are already gitignored today).
- If the export route ever breaks and the admin is unable to regenerate, training scripts have nothing to consume. Mitigation: the snapshot at `results-autoresearch/bootstrap_validation_s9/pre_export_snapshot/{training_data,holdout_data}.csv` is already tracked as a known-good fallback — that's exactly what `c1426cb`'s ancestor commit `051f431` recorded.

**Default if Tommy says yes:** Add `src/lib/training/data/` (with trailing slash) as a single ignore rule. The directory itself is preserved by Git via the existing `.gitkeep` convention — though there is currently no `.gitkeep` in `src/lib/training/data/`, so an empty directory will simply not exist after a fresh clone. The `export-scraped-training-data.ts` script handles directory creation if missing (`fs.mkdirSync(..., { recursive: true })` is the standard pattern for Node export scripts; if it doesn't, that's a separate Phase 2 hardening question).

---

### Q4. Tighten `tmp/` to `/tmp/`?

#### Evidence

**Q4.1–Q4.2 — All `tmp/` directories in working tree:**

```
Path     FileCount  SizeKB
tmp              1     3.5
data\tmp         1  4559.2
```

Two `tmp/` directories. Top-level contents:

```
=== tmp ===
prediction_validation.json   3533 bytes (mtime 3/25/2026)

=== data/tmp ===
test_out.txt              4668670 bytes (mtime 4/17/2026)
```

**Q4.3 — `git check-ignore -v` for each:**

```
$ git check-ignore -v -- tmp
(no output — exit code 1 → NOT ignored)

$ git check-ignore -v -- data/tmp
.gitignore:60:data/   data/tmp
```

**Surprising result:** `tmp/` (root) is **NOT currently ignored**, even though `.gitignore:75` reads `tmp/`. Investigation:

```
$ git ls-files tmp/
tmp/prediction_validation.json
```

**`tmp/prediction_validation.json` is already tracked in the git index.** Once a file is tracked, gitignore is bypassed for it. So the `tmp/` rule on line 75 has zero current effect — it does NOT ignore `tmp/prediction_validation.json` (already tracked) and does NOT ignore `data/tmp/test_out.txt` (already covered by line 60's `data/`).

**Q4.4 — Intent of each tmp directory:**

- **Root `tmp/`:** Has one file from Mar 25, tracked since some prior commit. Looks like an output snapshot. Does not appear to be active scratch space — only one file, three months old, never updated.
- **`data/tmp/`:** Inside the `data/` umbrella that Investigation #3 already classified as scraped/output area. The 4.5 MB `test_out.txt` is local-only output.

#### Recommendation

**Tighten `tmp/` to `/tmp/`. YES.**

Reasoning:

- The current `tmp/` rule has **zero current effect** (the only matching file is already tracked; the only other matching directory is doubly-covered by `data/`). Tightening to `/tmp/` makes the rule's stated scope match its actual scope: "ignore the root-level `tmp/` directory, nothing else."
- After tightening, root `tmp/` continues to be ignored for *new* untracked files (the existing tracked file stays tracked — gitignore doesn't untrack).
- After tightening, `data/tmp/` continues to be ignored because it is inside the `/data/` parent (per the recommended Q3 anchor).
- A future deep `tmp/` directory (e.g., `src/foo/tmp/`) would NOT be silently lost — which is the safer behavior.

**Risk:** Negligible. The change is structurally identical to the `data/` → `/data/` anchor proposed in Investigation #3. No file loses ignore status as a result of this specific change.

---

### Q5. `.bmad-core/data/` tracking

#### Evidence

**Q5.1 — `.bmad-core/` tracked-file count:**

```
$ (git ls-files .bmad-core | Measure-Object).Count
84
```

**84 tracked files in `.bmad-core/`** — the rest of the framework's directory tree is fully tracked.

**Q5.2 — `.bmad-core/data/` contents:**

```
Name                        Length LastWriteTime
bmad-kb.md                   32592 1/28/2026
brainstorming-techniques.md   1923 1/28/2026
elicitation-methods.md        5179 1/28/2026
technical-preferences.md        66 1/28/2026
```

4 markdown files, all dated 1/28/2026 (matches the rest of `.bmad-core/`), 38 KB total. Already spot-checked in Investigation #3: framework KB and elicitation-method documentation. No secrets, no PII, no large binaries.

**Q5.3 — Does tracked code reference these files?**

The grep for `bmad-kb|brainstorming-techniques|elicitation-methods|technical-preferences` returned **34 matching tracked files**, including:

- `.bmad-core/agents/bmad-master.md`, `.bmad-core/agents/bmad-orchestrator.md`, `.bmad-core/agents/analyst.md`, `.bmad-core/agents/architect.md`, `.bmad-core/agents/pm.md`, `.bmad-core/agents/qa.md`, `.bmad-core/agents/ux-expert.md`
- `.bmad-core/tasks/facilitate-brainstorming-session.md`, `.bmad-core/tasks/advanced-elicitation.md`, `.bmad-core/tasks/create-doc.md`
- `.bmad-core/templates/architecture-tmpl.yaml`, `.bmad-core/templates/prd-tmpl.yaml`
- `.bmad-core/workflows/*.yaml` (all 5 workflow files)
- `.bmad-core/install-manifest.yaml`
- `.cursor/rules/{architect,bmad-master,bmad-orchestrator,analyst,qa,ux-expert,pm}.mdc` (Cursor rule mirrors)
- `.windsurf/rules/{architect,bmad-master,bmad-orchestrator,analyst,qa,ux-expert,pm}.md` (Windsurf rule mirrors)

The BMad framework agents reference these knowledge files as part of their operating instructions. They are framework documentation, not data outputs.

#### Recommendation

**Track `.bmad-core/data/`.**

Evidence:
- The rest of `.bmad-core/` (84 files) is tracked.
- The 4 .md files are referenced by 34 other tracked files in the framework.
- Tiny (38 KB).
- No secrets, no PII (per Investigation #3's sensitivity scan).
- A partial framework on Vercel — 84 tracked + 4 silently-excluded — is suspect: any agent that loads `bmad-kb.md` would fail on Vercel. (May not currently be visible because BMad agents likely aren't invoked at runtime on Vercel, but consistency is the safer default.)

**Default if Tommy says yes:** Once `data/` is anchored to `/data/`, `.bmad-core/data/` becomes trackable automatically. No additional ignore-rule exception required.

---

### Q6. `autoresearch/data/snapshot-*.json`

#### Evidence

**Q6.1 — `autoresearch/data/README.md` verbatim intent:**

> "Holds exported snapshots of labeled prediction data for offline replay. Actual data files are gitignored; only `.gitkeep` and this README are tracked."

The README is unambiguous: snapshots are intentionally excluded from git.

**Q6.2 — Scripts that write snapshot files:**

The grep for `autoresearch/data/snapshot|snapshot-2026-` against the entire codebase returned **zero matches in tracked code** — only the investigation report itself. There is no tracked exporter script that writes to this directory; the README itself says "The export script (to be built in sandbox/) will produce this format." So the script that wrote the existing snapshots either lives in the (gitignored) `sandbox/` directory or was a one-off ad-hoc invocation.

**Q6.3 — Snapshot regeneration cadence:**

```
.gitkeep                       0 bytes  (mtime 3/22/2026)
README.md                   3120 bytes  (mtime 3/22/2026)
snapshot-2026-03-22.json 1306269 bytes  (mtime 3/22/2026 3:06:16 PM)
snapshot-2026-03-25.json 1602350 bytes  (mtime 3/25/2026 7:47:47 PM)
```

Two snapshots over 3 days, then nothing for ~40 days. Effectively a one-time export pair.

**Q6.4 — Tracked code reading the snapshots:** zero matches (per Q6.2 grep).

#### Recommendation

**Exclude `autoresearch/data/snapshot-*.json` from git. Honor the README.**

Evidence:
- README explicitly states this intent verbatim.
- Snapshots are 2.9 MB combined; checking them in adds permanent history bloat per snapshot.
- Zero tracked code reads them; they are pure offline-replay artifacts.
- Tracking them would silently contradict the README — confusing future contributors.

**Default if Tommy says yes:** Add a narrow rule: `autoresearch/data/snapshot-*.json`. The `.gitkeep` and `README.md` in the same directory **become trackable** once `data/` → `/data/` is anchored, which is the original author's stated intent and matches the README ("only `.gitkeep` and this README are tracked").

---

### Q7. `src/data/niche-keywords.json`

#### Evidence

**Q7.1–Q7.2 — References to this file in tracked code:**

The decisive reference is in `src/lib/orchestration/kai-orchestrator.ts` line 3575:

```ts
let nicheKeywords: Record<string, string[]>;
try {
  nicheKeywords = require('@/data/niche-keywords.json');
} catch {
  // Fallback to default if file doesn't exist
  nicheKeywords = this.getDefaultNicheKeywords();
}
```

This is a **dynamic require with a try/catch fallback** inside the `niche-keywords` component handler. The component is **always disabled at runtime** per CLAUDE.md (lines 20, 1275, 1504-1506) — confirmed at multiple registry/orchestrator sites:

- `src/app/api/admin/operations/system-health/route.ts:79-80`: `if (comp.id === 'niche-keywords') return 'disabled';`
- `src/lib/orchestration/kai-orchestrator.ts:349`: `disabledList.push('niche-keywords', ...);`
- `src/lib/prediction/system-registry.ts:805` comment: `// niche-keywords is registered but always disabled at runtime`

So the require statement is reachable in code but not invoked at runtime. With the try/catch, the worst case is a graceful fallback to `getDefaultNicheKeywords()`.

CLAUDE.md (line 1506) explicitly documents: *"⚠️ `src/data/niche-keywords.json` and `config/niche-keywords.json` are AI-generated — NOT authoritative."*

**Q7.3 — Sibling `config/niche-keywords.json`:**

```
$ git ls-files config/niche-keywords.json
config/niche-keywords.json
$ Get-Item config/niche-keywords.json
Name                Length  LastWriteTime
niche-keywords.json  13216  1/28/2026 9:17:02 PM
```

**`config/niche-keywords.json` IS already tracked** (13.2 KB). The `src/data/...` version is the smaller (3.7 KB) sibling that is currently gitignored only because of the unanchored `data/` rule. Several tracked files reference `config/niche-keywords.json`:

- `scripts/orchestrate-viral-research.js:34`: `path.join(__dirname, '..', 'config', 'niche-keywords.json')`
- `docs/viral-research-pipeline-setup.md:13,58,288,339`
- `VIRAL-RESEARCH-SYSTEM-COMPLETE.md`, `PATTERN_ARCHITECTURE_ANALYSIS.md`

#### Recommendation

**Track `src/data/niche-keywords.json`.**

Evidence:
- Reachable from tracked code via `require('@/data/niche-keywords.json')`. While the try/catch protects runtime, **Next.js's webpack does static analysis on `require()` calls with hardcoded string paths** and may emit a build warning (or worse, a build error) when the resolved path doesn't exist. Tracking it removes a build-time concern.
- Tiny (3.7 KB).
- The sibling `config/niche-keywords.json` is already tracked, and CLAUDE.md treats both as a pair.
- Re-Investigation #3's sensitivity scan confirmed it is TikTok keyword arrays — no secrets.

**Default if Tommy says yes:** Once `data/` → `/data/` is anchored, this file becomes trackable automatically. No additional rule required.

---

### Q8. `src/components/templateEditor-v2/data/elementsData.ts`

#### Evidence

**Q8.1 — Imports of this module in tracked code:**

The grep for `elementsData` returned imports in **5 tracked source files**, plus 2 test files that mock it:

| File | Import |
|---|---|
| `src/components/templateEditor-v2/hooks/useDragDrop.ts:2` | `import { ElementItem } from '../data/elementsData';` |
| `src/components/templateEditor-v2/DragContext.tsx:4` | `import { ElementItem } from './data/elementsData';` |
| `src/components/templateEditor-v2/panels/ElementItem.tsx:2` | `import { ElementItem as ElementItemType } from '../data/elementsData';` |
| `src/components/templateEditor-v2/panels/ElementCategory.tsx:3` | `import { ElementCategory, ElementItem } from '../data/elementsData';` |
| `src/components/templateEditor-v2/panels/ElementsPanel.tsx:5` | `import { ElementCategory, ElementItem, elementCategories } from "../data/elementsData";` |
| `src/__tests__/components/templateEditor-v2/Performance.test.tsx:13` | `jest.mock('@/components/templateEditor-v2/data/elementsData', ...)` |
| `src/__tests__/components/templateEditor-v2/DragDrop.test.tsx:32` | `jest.mock('@/components/templateEditor-v2/data/elementsData', ...)` |

Furthermore, `tsc_output.txt` already shows TypeScript emitting errors about this missing import (lines 9186, 9191) — the same silent-source-loss pattern that broke `src/lib/data/`.

**Q8.2 — Load-bearing?**

YES, decisively. The 5 tracked components in `src/components/templateEditor-v2/` (the entire templateEditor-v2 surface for hooks, drag context, the elements panel UI, the element items, and the element categories) depend on this file. Without it, **the templateEditor-v2 component surface does not type-check or build**.

#### Recommendation

**Track `src/components/templateEditor-v2/data/elementsData.ts`.**

Evidence:
- Imported by 5 tracked source files.
- Mocked by 2 tracked test files (which proves the test authors expected it to exist).
- TypeScript already complains it's missing.
- Same root-cause class as the `src/lib/data/` Phase 1 build-blocker — silently excluded source code.
- 7.7 KB; pure source code.

**Default if Tommy says yes:** Once `data/` → `/data/` is anchored, this file becomes trackable automatically.

---

### Q9. `src/app/admin/operations/training/data/page.tsx`

#### Evidence

**Q9.1 — References to the route path `/admin/operations/training/data` in tracked code:**

```
src/lib/control-center/constants.ts:101         path: '/admin/operations/training/data',
src/components/admin/navigation-config.ts:96    href: '/admin/operations/training/data', icon: FileStack
src/app/admin/operations/page.tsx:857           href="/admin/operations/training/data"
```

3 tracked files reference this route as a navigation target / nav item / control-center entry. The `page.tsx` at this path is the Next.js page handler that backs the route.

#### Recommendation

**Track `src/app/admin/operations/training/data/page.tsx`.** (Already proven load-bearing in Investigation #3; re-confirmed here.)

Evidence:
- 3 tracked files link to / reference this route.
- The file at `src/app/admin/operations/training/data/page.tsx` exists locally as a 27 KB `'use client'` Next.js page component.
- Without it, the admin nav button at `Training Data` is a 404 on Vercel.

**Default if Tommy says yes:** Once `data/` → `/data/` is anchored, this file becomes trackable automatically.

---

## Consolidated recommended `.gitignore` diff (for Tommy's review)

This is the single block of `.gitignore` changes that would resolve everything in Block 2.

```diff
 # scraped data
-data/
+/data/

 # backup/archive folders
 .git-backup/
 agent-starter-python/
 frameworks-and-research/
-tmp/
+/tmp/

+# Training-data exports — regenerable via /api/admin/training/export-data
+# (or `npx tsx src/lib/training/run_export_training_data.ts`).
+# Consumed only by local Python training scripts; never read by Vercel-built code.
+src/lib/training/data/
+
+# Autoresearch snapshots — README in this dir explicitly designates them as gitignored
+autoresearch/data/snapshot-*.json
```

**What this single change does:**

| Today | After |
|---|---|
| `<repo-root>/data/` (1 GB scraped data) ignored ✓ | `<repo-root>/data/` ignored ✓ — STILL EXCLUDED |
| `src/lib/data/` (8 source files, 25 KB) silently lost ❌ | `src/lib/data/` trackable ✓ — Phase 1 BUILD FIX |
| `src/app/admin/operations/training/data/page.tsx` silently lost ❌ | trackable ✓ — fixes silent 404 admin route |
| `src/components/templateEditor-v2/data/elementsData.ts` silently lost ❌ | trackable ✓ — fixes templateEditor-v2 type errors |
| `src/data/niche-keywords.json` silently lost ❌ | trackable ✓ — pairs with already-tracked `config/niche-keywords.json` |
| `.bmad-core/data/*` (4 .md framework KB files) silently lost ❌ | trackable ✓ — consistent with rest of `.bmad-core/` |
| `autoresearch/data/.gitkeep` and `README.md` silently lost ❌ | trackable ✓ — README's stated intent |
| `autoresearch/data/snapshot-*.json` silently lost ❌ | EXPLICITLY EXCLUDED ✓ — README's stated intent |
| `src/lib/training/data/{training,holdout}_data.csv + feature_metadata.json` silently lost (one good outcome but not by design) ❌ | EXPLICITLY EXCLUDED ✓ — regenerable outputs, not Vercel-needed |
| `tmp/` rule has zero effect (only file in root `tmp/` is already tracked) ❌ | rule is now scoped correctly, future-safe |

**No file currently tracked becomes untracked. No file containing secrets becomes tracked.** (Sensitivity scan in Investigation #3 confirmed clean across all candidates.)

After applying this diff, the actual Phase 2 git operations Tommy would need to run are:

```bash
git add src/lib/data/                                       # 8 files, 25 KB — the Phase 1 BUILD FIX
git add src/app/admin/operations/training/data/page.tsx     # silent admin route
git add src/components/templateEditor-v2/data/elementsData.ts  # templateEditor-v2 fix
git add src/data/niche-keywords.json                        # pairs with config/
git add .bmad-core/data/                                    # framework KB
git add autoresearch/data/.gitkeep autoresearch/data/README.md   # README's intent
```

These are **NOT executed in this read-only session**. They are the proposed Phase 2 fix steps.

---

## Consolidated recommended Vercel actions (for Tommy's review)

This is the plain-English sequence Tommy can review. **None of this is executed in this read-only session.**

### Step 1 — Make `trendzo-working-5-7-25` the canonical project (Phase 2 work)

1. From the repo root, re-link the local CLI to `trendzo-working-5-7-25`:
   - Delete `.vercel/project.json`, OR run `npx vercel link` interactively and select `trendzo-working-5-7-25` when prompted.
2. After re-link, `npx vercel env ls` will show whatever env vars are already on `trendzo-working-5-7-25` (currently unknown — see "Outstanding ambiguities" below).

### Step 2 — Migrate env vars from `trendzo-test` → `trendzo-working-5-7-25` (only if needed)

If Step 1 reveals `trendzo-working-5-7-25` is missing env vars that `trendzo-test` has:

1. Re-link temporarily to `trendzo-test`, run `vercel env pull .env.from-trendzo-test --environment=preview` to pull the 7 env vars to a local file (file contents are sensitive — do not commit).
2. Re-link to `trendzo-working-5-7-25`, run `vercel env add` for each variable individually, **scoping them appropriately** (Production AND Preview, not just Preview-on-`vercel-deploy-test`).
3. Delete the local `.env.from-trendzo-test` file when done.

### Step 3 — After Step 2 completes successfully, disconnect `trendzo-test` from GitHub (do NOT delete)

1. Re-link the local CLI to `trendzo-test` one last time.
2. Run `npx vercel git disconnect`.
3. Confirm in the dashboard that the GitHub integration is removed but the project, env vars, and deploy history remain.
4. (Optional) Rename `trendzo-test` → `trendzo-test-DEPRECATED-2026-05` in the dashboard for clarity.
5. Re-link the local CLI back to `trendzo-working-5-7-25`.

### Step 4 — Verify

- A subsequent `git push` should now trigger only ONE Vercel build (on `trendzo-working-5-7-25`), not two.
- `vercel project ls` will still show both projects, but only one will receive auto-deploys.

### What NOT to do

- Do NOT delete `trendzo-test`. Disconnect only.
- Do NOT touch the existing `vercel-deploy-test` git branch — that's still where Phase 1 build-fix work lives.
- Do NOT change CI workflow branch references in this work — that's a Phase 2/3 decision (the prior investigations explicitly deferred branch canonicalization to a separate phase).

---

## Outstanding ambiguities (only things Tommy genuinely must decide)

After this round of investigation, **only one ambiguity remains** that this session could not resolve from filesystem/CLI evidence alone:

1. **Env-var contents on `trendzo-working-5-7-25`.** The CLI is locally bound to `trendzo-test`, and the prompt explicitly forbade re-linking just to enumerate env-var names on the other project. So this report cannot say definitively whether `trendzo-working-5-7-25` already has its own env vars or needs them migrated from `trendzo-test`. **Phase 2's first task should be to re-link and run `vercel env ls` against `trendzo-working-5-7-25` to determine this.** Tommy doesn't need to "decide" anything here — it's a future check that will produce a yes/no answer.

Everything else in the prior open-questions lists from Investigations #1, #2, and #3 has been resolved with a recommendation in this report. There are no remaining intent-only decisions Tommy must make.

---

## What I did NOT do

Confirmed explicitly:

- ✅ **No files edited** other than the deliverable (`PHASE1_FINAL_DECISIONS_2026-05-02.md`).
- ✅ **No commits made.**
- ✅ **No installs performed** (no `npm install`, no `pnpm install`, etc.).
- ✅ **No config changes** (no edits to `.gitignore`, `package.json`, `tsconfig.json`, `vercel.json`, `next.config.mjs`, `.vercel/project.json`, or any other file).
- ✅ **No migrations run.**
- ✅ **No branch operations** (no checkout, merge, rebase, reset, push, delete). Branch is unchanged at `vercel-deploy-test`.
- ✅ **No Vercel deploys triggered.** All `vercel` invocations were read-only: `vercel --version`, `vercel domains ls`, `vercel env ls`, `vercel ls trendzo-test`, `vercel ls trendzo-working-5-7-25`, `vercel ls <project> --status ready`.
- ✅ **No Vercel project links created or destroyed** (no `vercel link`, no `vercel git connect`, no `vercel git disconnect`, no `vercel projects rm`). The local clone remains bound to `trendzo-test` exactly as it was at the start of this session.
- ✅ **No env vars added, removed, or modified** on either Vercel project.
- ✅ **No git tracking operations on previously-ignored files** (no `git add`, no `git add -f`).
- ✅ **No node_modules or lockfile changes.**

Per the standing principle: every recommendation in this report cites the evidence that supports it (file paths, line numbers, command outputs, README quotations). Where filesystem evidence was insufficient, the gap is named explicitly in "Outstanding ambiguities" rather than rounded up to a confident recommendation.
