# Admin Inventory — 2026-05-04

## Pre-flight check results

| # | Check | Result |
|---|-------|--------|
| 1 | Branch is `vercel-deploy-test` | ✓ |
| 2 | `src/app/admin/` exists | ✓ |
| 3 | `git status --short` line count | **56** (22 modified/deleted + 34 untracked) |

**Re: check 3** — Tommy expected 21 WIP files. Actual modified/deleted count is 22. The extra one is `src/components/ui/ThemeToggleButton.tsx` (a one-line `useTheme` import-path fix made in an earlier turn this session to unblock the `localhost:3002/analytics/newsletter` runtime crash). If you didn't expect that file in the WIP list, that's the one to look at — it's reversible with `git checkout src/components/ui/ThemeToggleButton.tsx`. **No admin files were modified.** Proceeding.

## Methodology

- Total page files: counted by `find src/app/admin -name "page.{tsx,ts,jsx,js}" -type f`, excluding 3 backup files (`.BACKUP-...`, `.tsx.backup-...`, `.tsx.before-step1`).
- Last-modified date: `git log -1 --format=%ci` (date portion only, YYYY-MM-DD).
- "Active in last 2 weeks" cutoff: today is 2026-05-05, so cutoff = **2026-04-21**.
- Path-keyword match: case-insensitive search of the URL for any of `test`, `debug`, `experimental`, `dev`, `playground`, `demo`. Matched: `testing-accuracy`, `upload-test`, `component-test` (substring of `test`).
- Bucketing rules (verbatim from prompt, with a slight C-extension):
  - **A — Likely CORE:** modified ≥ 2026-04-21 AND path has no test/debug/experimental/dev/playground/demo keyword AND no firebase / legacy-predictor imports.
  - **B — Likely EXPERIMENTAL:** modified < 2026-04-10 (≥ 25 days dormant) OR path keyword match OR firebase / legacy-predictor import.
  - **C — Ambiguous:** modified between 2026-04-10 and 2026-04-20 inclusive (recent-ish but outside the strict 2-week window) and no other red flag. **Tommy decides where these go.**

### Imports check (whole admin tree)

- Files importing `firebase/firestore` / `@/lib/firebase` / `firebase-shim` under `src/app/admin/`: **0**
- Files importing `@/lib/services/viral-prediction` (legacy predictor engines) under `src/app/admin/`: **0**
- Files importing `@/lib/prediction` (canonical predictor) under `src/app/admin/`: **4**
  - `src/app/admin/upload-test/page.tsx`
  - `src/app/admin/bulk-download/page.tsx`
  - `src/app/admin/viral-studio/components/phases/OnboardingPhase.tsx` *(non-page support file)*
  - `src/app/admin/studio/components/ConceptScorerTab.tsx` *(non-page support file)*

That makes the bucketing reduce to (date OR path-keyword) for every page.

---

## Section A — Likely CORE

Modified ≥ 2026-04-21, no test/debug/experimental/dev/playground/demo keyword, no firebase, no legacy predictor.

| URL | File | Lines | Last modified | h1 / heading |
|---|---|---:|---|---|
| `/admin/operations/training/data` | `src/app/admin/operations/training/data/page.tsx` | 771 | 2026-05-03 | Multi-line h1 with white text + flex icon (likely "Training Data") |
| `/admin/workflows/quick-win` | `src/app/admin/workflows/quick-win/page.tsx` | 1318 | 2026-04-29 | (no top-level `<h1>` captured by simple grep — page may use a header component) |

**Section A count: 2**

---

## Section B — Likely EXPERIMENTAL

Dormant ≥ 25 days OR path matches test/debug/experimental/dev/playground/demo.

Sorted by last-modified date, newest first. Note: every file in this section is dated 2026-03-30 (the dashboard tree all moved on the same day; see surprises). Within 2026-03-30, sorted alphabetically by URL.

### B.1 — Path-keyword matches (test/debug/experimental/dev/playground/demo)

| URL | File | Lines | Last modified | h1 / heading |
|---|---|---:|---|---|
| `/admin/component-test` | `src/app/admin/component-test/page.tsx` | 491 | 2026-03-30 | Gradient text (no plain heading captured) |
| `/admin/testing-accuracy` | `src/app/admin/testing-accuracy/page.tsx` | 1158 | 2026-03-30 | "Prediction Setup Wizard" / "Data Intake & Cohort Freezing" / "Pattern QA" / "Fingerprints & Templates" / "Pre-Post Predictor" / "Validation & Reporting" (multi-step wizard) |
| `/admin/upload-test` | `src/app/admin/upload-test/page.tsx` | 4286 | 2026-03-30 | Multi-line h1 (gradient text) — primary workflow page (per CLAUDE.md memory, this is the "Primary workflow page") |

### B.2 — Dormant ≥ 25 days (modified 2026-03-30, no path keyword)

| URL | File | Lines | h1 / heading |
|---|---|---:|---|
| `/admin` | `src/app/admin/page.tsx` | 21 | (no h1 found) |
| `/admin/adaptation` | `src/app/admin/adaptation/page.tsx` | 110 | Adaptation Center |
| `/admin/advisor-service` | `src/app/admin/advisor-service/page.tsx` | 74 | "Admin Access Required" (auth gate) → gradient title |
| `/admin/agent` | `src/app/admin/agent/page.tsx` | 262 | Agentic Control Center |
| `/admin/ai-brain` | `src/app/admin/ai-brain/page.tsx` | 25 | AI Brain Interface |
| `/admin/algorithm-iq` | `src/app/admin/algorithm-iq/page.tsx` | 958 | Algorithm IQ Dashboard |
| `/admin/alignment` | `src/app/admin/alignment/page.tsx` | 98 | Methodology Alignment |
| `/admin/analysis` | `src/app/admin/analysis/page.tsx` | 98 | Instant Analysis |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | 161 | (no h1 found) |
| `/admin/analytics/labels` | `src/app/admin/analytics/labels/page.tsx` | 25 | Success Labeling (Normalized) |
| `/admin/analytics/windows` | `src/app/admin/analytics/windows/page.tsx` | 35 | Engagement Windows |
| `/admin/api` | `src/app/admin/api/page.tsx` | 363 | (no h1 found) |
| `/admin/apify-scraper` | `src/app/admin/apify-scraper/page.tsx` | 423 | Auth gate → ApifyScraper Dashboard |
| `/admin/audit-log` | `src/app/admin/audit-log/page.tsx` | 497 | Multi-line h1 (Audit Log) |
| `/admin/baselines` | `src/app/admin/baselines/page.tsx` | 78 | Baselines / Calibration / Timing |
| `/admin/bloomberg` | `src/app/admin/bloomberg/page.tsx` | 2237 | Bloomberg Terminal |
| `/admin/bloomberg/marketplace` | `src/app/admin/bloomberg/marketplace/page.tsx` | 409 | Mini App Marketplace |
| `/admin/bulk-download` | `src/app/admin/bulk-download/page.tsx` | 1196 | Bulk TikTok Downloader (uses `@/lib/prediction`) |
| `/admin/calibration` | `src/app/admin/calibration/page.tsx` | 833 | Multi-line h1 |
| `/admin/canvas` | `src/app/admin/canvas/page.tsx` | 303 | (no h1 found) |
| `/admin/canvas/[projectId]` | `src/app/admin/canvas/[projectId]/page.tsx` | 936 | (no h1 found) |
| `/admin/checklist` | `src/app/admin/checklist/page.tsx` | 46 | Admin Checklist |
| `/admin/coach` | `src/app/admin/coach/page.tsx` | 127 | Coach Studio |
| `/admin/command-center` | `src/app/admin/command-center/page.tsx` | 1040 | Multi-line gradient h1 (Command Center) |
| `/admin/compare-runs` | `src/app/admin/compare-runs/page.tsx` | 536 | Compare Runs |
| `/admin/control-center` | `src/app/admin/control-center/page.tsx` | 563 | Control Center |
| `/admin/creators` | `src/app/admin/creators/page.tsx` | 288 | Creator Dashboard |
| `/admin/creators/[username]` | `src/app/admin/creators/[username]/page.tsx` | 436 | "Creator Not Found" / "@{profile.tiktok_username}" (dynamic) |
| `/admin/cross-intel` | `src/app/admin/cross-intel/page.tsx` | 103 | Cross-Platform Intelligence |
| `/admin/data-ingestion` | `src/app/admin/data-ingestion/page.tsx` | 8 | (stub, 8 lines) |
| `/admin/diagnostics` | `src/app/admin/diagnostics/page.tsx` | 108 | Admin Diagnostics |
| `/admin/dna-detective` | `src/app/admin/dna-detective/page.tsx` | 74 | Auth gate → gradient title |
| `/admin/draft-analyzer` | `src/app/admin/draft-analyzer/page.tsx` | 269 | Auth gate → gradient title |
| `/admin/drafts-analyzer` | `src/app/admin/drafts-analyzer/page.tsx` | 444 | Multi-line h1 |
| `/admin/drift` | `src/app/admin/drift/page.tsx` | 124 | Feature-Importance Drift |
| `/admin/ecom` | `src/app/admin/ecom/page.tsx` | 62 | Ecom Forecast |
| `/admin/ecom/[productId]` | `src/app/admin/ecom/[productId]/page.tsx` | 477 | Product Detail |
| `/admin/error-logs` | `src/app/admin/error-logs/page.tsx` | 520 | Multi-line h1 |
| `/admin/etl-dashboard` | `src/app/admin/etl-dashboard/page.tsx` | 283 | Auth gate → ETL Dashboard |
| `/admin/etl-status` | `src/app/admin/etl-status/page.tsx` | 166 | ETL Status |
| `/admin/experiments` | `src/app/admin/experiments/page.tsx` | 88 | Experiments |
| `/admin/feature-decomposer` | `src/app/admin/feature-decomposer/page.tsx` | 463 | Auth gate → FeatureDecomposer Dashboard |
| `/admin/feature-flags` | `src/app/admin/feature-flags/page.tsx` | 94 | (no h1 found) |
| `/admin/federated` | `src/app/admin/federated/page.tsx` | 59 | (no h1 found) |
| `/admin/feedback-ingest` | `src/app/admin/feedback-ingest/page.tsx` | 74 | Auth gate → gradient title |
| `/admin/flags` | `src/app/admin/flags/page.tsx` | 32 | Feature Flags |
| `/admin/flipboard` | `src/app/admin/flipboard/page.tsx` | 13 | (stub, 13 lines) |
| `/admin/framework-reservoir` | `src/app/admin/framework-reservoir/page.tsx` | 471 | Framework Reservoir Manager |
| `/admin/gene-tagger` | `src/app/admin/gene-tagger/page.tsx` | 541 | Auth gate → GeneTagger Dashboard |
| `/admin/gold-set` | `src/app/admin/gold-set/page.tsx` | 455 | Gold Set Verification Harness |
| `/admin/guardrails` | `src/app/admin/guardrails/page.tsx` | 51 | Guardrails |
| `/admin/hub` | `src/app/admin/hub/page.tsx` | 192 | Multi-line gradient h1 |
| `/admin/inception-studio` | `src/app/admin/inception-studio/page.tsx` | 591 | ✨ Inception Marketing Studio |
| `/admin/insights` | `src/app/admin/insights/page.tsx` | 51 | (no h1 found) |
| `/admin/integration` | `src/app/admin/integration/page.tsx` | 38 | (no h1 found) |
| `/admin/integrations/api` | `src/app/admin/integrations/api/page.tsx` | 500 | Multi-line h1 (Integrations / API) |
| `/admin/integrations/webhooks` | `src/app/admin/integrations/webhooks/page.tsx` | 667 | Multi-line h1 (Webhooks) |
| `/admin/keys` | `src/app/admin/keys/page.tsx` | 49 | API Keys |
| `/admin/learning` | `src/app/admin/learning/page.tsx` | 89 | Learning Lab |
| `/admin/limited-users` | `src/app/admin/limited-users/page.tsx` | 637 | 👥 Limited User Management |
| `/admin/llm-console` | `src/app/admin/llm-console/page.tsx` | 84 | LLM Console |
| `/admin/login` | `src/app/admin/login/page.tsx` | 136 | Admin Studio Login |
| `/admin/marketing-inception` | `src/app/admin/marketing-inception/page.tsx` | 55 | Marketing Inception (Drafts) |
| `/admin/marketing-studio` | `src/app/admin/marketing-studio/page.tsx` | 225 | Multi-line gradient h1 |
| `/admin/marketplace/creator` | `src/app/admin/marketplace/creator/page.tsx` | 337 | Creator Dashboard |
| `/admin/master-orchestrator` | `src/app/admin/master-orchestrator/page.tsx` | 518 | 🎭 Master Agent Orchestrator |
| `/admin/mission-control` | `src/app/admin/mission-control/page.tsx` | 481 | 🎛️ Mission Control |
| `/admin/moat` | `src/app/admin/moat/page.tsx` | 113 | (no h1 found) |
| `/admin/model-evaluation` | `src/app/admin/model-evaluation/page.tsx` | 1138 | Experiment Tracking |
| `/admin/monitoring` | `src/app/admin/monitoring/page.tsx` | 707 | Monitoring Dashboard |
| `/admin/mvp` | `src/app/admin/mvp/page.tsx` | 294 | MVP Dashboard |
| `/admin/mvp/settings` | `src/app/admin/mvp/settings/page.tsx` | 283 | MVP Settings |
| `/admin/mvp/templates` | `src/app/admin/mvp/templates/page.tsx` | 451 | Template Management |
| `/admin/newsletter` | `src/app/admin/newsletter/page.tsx` | 393 | Newsletter Management |
| `/admin/operations/accuracy` | `src/app/admin/operations/accuracy/page.tsx` | 683 | Multi-line h1 (Accuracy) |
| `/admin/operations/alerts` | `src/app/admin/operations/alerts/page.tsx` | 610 | Alert Management |
| `/admin/operations/data-explorer` | `src/app/admin/operations/data-explorer/page.tsx` | 1020 | Data Explorer |
| `/admin/operations/experiments` | `src/app/admin/operations/experiments/page.tsx` | 594 | Experiment Lab |
| `/admin/operations/health` | `src/app/admin/operations/health/page.tsx` | 581 | System Health Monitor |
| `/admin/operations/initiative` | `src/app/admin/operations/initiative/page.tsx` | 381 | Initiative Intelligence |
| `/admin/operations/model` | `src/app/admin/operations/model/page.tsx` | 565 | Model Performance Center |
| `/admin/operations/system-health` | `src/app/admin/operations/system-health/page.tsx` | 574 | (no h1 found — Pack Health Dashboard per memory) |
| `/admin/operations/training` | `src/app/admin/operations/training/page.tsx` | 2301 | Training Pipeline |
| `/admin/operations/training/base` | `src/app/admin/operations/training/base/page.tsx` | 1036 | Multi-line h1 |
| `/admin/operations/training/history` | `src/app/admin/operations/training/history/page.tsx` | 1251 | Training History |
| `/admin/operations/training/jobs` | `src/app/admin/operations/training/jobs/page.tsx` | 420 | Training Jobs |
| `/admin/operations/training/models` | `src/app/admin/operations/training/models/page.tsx` | 602 | Model Versions |
| `/admin/operations/training/readiness` | `src/app/admin/operations/training/readiness/page.tsx` | 885 | Multi-line h1 |
| `/admin/operations/training/viral-scrape` | `src/app/admin/operations/training/viral-scrape/page.tsx` | 885 | Viral Content Scraping Mission |
| `/admin/orchestrator` | `src/app/admin/orchestrator/page.tsx` | 74 | Auth gate → gradient title |
| `/admin/organization` | `src/app/admin/organization/page.tsx` | 463 | Organization Overview |
| `/admin/organization/agencies` | `src/app/admin/organization/agencies/page.tsx` | 357 | Multi-line h1 |
| `/admin/organization/agencies/[id]` | `src/app/admin/organization/agencies/[id]/page.tsx` | 580 | (no h1 found) |
| `/admin/organization/creators` | `src/app/admin/organization/creators/page.tsx` | 679 | Multi-line h1 |
| `/admin/process-intel` | `src/app/admin/process-intel/page.tsx` | 79 | Process Intelligence |
| `/admin/recipe-book` | `src/app/admin/recipe-book/page.tsx` | 94 | Daily Recipe Book — {day} |
| `/admin/recipe-book-api` | `src/app/admin/recipe-book-api/page.tsx` | 74 | Auth gate → gradient title |
| `/admin/recipes/leaderboard` | `src/app/admin/recipes/leaderboard/page.tsx` | 107 | Template Leaderboard |
| `/admin/research-review` | `src/app/admin/research-review/page.tsx` | 1058 | Multi-line gradient h1 |
| `/admin/rewards` | `src/app/admin/rewards/page.tsx` | 504 | Multi-line h1 |
| `/admin/rewards/affiliate` | `src/app/admin/rewards/affiliate/page.tsx` | 540 | Multi-line h1 |
| `/admin/rewards/app-campaigns` | `src/app/admin/rewards/app-campaigns/page.tsx` | 506 | Multi-line h1 |
| `/admin/rewards/app-store` | `src/app/admin/rewards/app-store/page.tsx` | 503 | Multi-line h1 |
| `/admin/rewards/content-campaigns` | `src/app/admin/rewards/content-campaigns/page.tsx` | 473 | Multi-line h1 |
| `/admin/rewards/payouts` | `src/app/admin/rewards/payouts/page.tsx` | 571 | Multi-line h1 |
| `/admin/rewards/platform-campaigns` | `src/app/admin/rewards/platform-campaigns/page.tsx` | 433 | Multi-line h1 |
| `/admin/rewards/platform-campaigns/create` | `src/app/admin/rewards/platform-campaigns/create/page.tsx` | 479 | Multi-line h1 |
| `/admin/scale` | `src/app/admin/scale/page.tsx` | 120 | Scale Lab |
| `/admin/scraping` | `src/app/admin/scraping/page.tsx` | 1461 | Multi-line h1 |
| `/admin/security` | `src/app/admin/security/page.tsx` | 439 | Security Dashboard |
| `/admin/settings` | `src/app/admin/settings/page.tsx` | 57 | (no h1 found) |
| `/admin/settings/analyzer` | `src/app/admin/settings/analyzer/page.tsx` | 318 | Template Analyzer Settings |
| `/admin/studio` | `src/app/admin/studio/page.tsx` | 145 | (no h1 found) |
| `/admin/studio/script` | `src/app/admin/studio/script/page.tsx` | 209 | Script Intelligence |
| `/admin/success-tracking` | `src/app/admin/success-tracking/page.tsx` | 617 | 🏆 Success Tracking & Testimonials |
| `/admin/super-admin-live` | `src/app/admin/super-admin-live/page.tsx` | 459 | (h1 has className `page-title` but no captured text — uses CSS-driven title) |
| `/admin/system` | `src/app/admin/system/page.tsx` | 200 | (no h1 found) |
| `/admin/system-map` | `src/app/admin/system-map/page.tsx` | 227 | System Intelligence Map |
| `/admin/system-settings` | `src/app/admin/system-settings/page.tsx` | 793 | Multi-line h1 |
| `/admin/template-analyzer` | `src/app/admin/template-analyzer/page.tsx` | 487 | TikTok Template Analyzer |
| `/admin/template-analyzer/template/[id]` | `src/app/admin/template-analyzer/template/[id]/page.tsx` | 308 | "Loading Template..." / "Template Error" / "Template Details" (state-dependent) |
| `/admin/template-generator` | `src/app/admin/template-generator/page.js` | 190 | TemplateGenerator (note: this is `.js`, not `.tsx`) |
| `/admin/template-leaderboard` | `src/app/admin/template-leaderboard/page.tsx` | 86 | Template Leaderboard |
| `/admin/users` | `src/app/admin/users/page.tsx` | 139 | (no h1 found) |
| `/admin/value-template-editor` | `src/app/admin/value-template-editor/page.tsx` | 306 | Multi-line h1 |
| `/admin/viral-approval-queue` | `src/app/admin/viral-approval-queue/page.tsx` | 489 | Viral Approval Queue |
| `/admin/viral-filter` | `src/app/admin/viral-filter/page.tsx` | 442 | Auth gate → ViralFilter Dashboard |
| `/admin/viral-recipe-book` | `src/app/admin/viral-recipe-book/page.tsx` | 605 | Multi-line gradient h1 |
| `/admin/viral-studio` | `src/app/admin/viral-studio/page.tsx` | 750 | Viral Lab V2 |
| `/admin/workflow-dashboard` | `src/app/admin/workflow-dashboard/page.tsx` | 514 | Multi-line h1 |
| `/admin/workflows/creator` | `src/app/admin/workflows/creator/page.tsx` | 591 | Multi-step: "Sign In Required" / "Your Content Strategy" / "Create Your Video" / "Ship Your Content" |

**Section B count: 134** (3 path-keyword + 131 dormant)

---

## Section C — Ambiguous

Files modified between 2026-04-10 and 2026-04-20 (recent-ish, but technically outside the strict 2-week threshold). **Tommy decides.** No firebase, no legacy predictor, no test/debug/etc keyword in any of these.

Sorted by last-modified date, newest first.

| URL | File | Lines | Last modified | h1 / heading |
|---|---|---:|---|---|
| `/admin/chairman` | `src/app/admin/chairman/page.tsx` | 1988 | 2026-04-17 | Chairman OS |
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | 91 | 2026-04-17 | (no h1 found) |
| `/admin/operations` | `src/app/admin/operations/page.tsx` | 1299 | 2026-04-17 | (no h1 found) |
| `/admin/operations/network-intelligence` | `src/app/admin/operations/network-intelligence/page.tsx` | 139 | 2026-04-17 | Network Intelligence |
| `/admin/planning/[id]` | `src/app/admin/planning/[id]/page.tsx` | 615 | 2026-04-17 | (no h1 found) |
| `/admin/cultural-events` | `src/app/admin/cultural-events/page.tsx` | 320 | 2026-04-10 | Cultural Events Review |
| `/admin/brief-review` | `src/app/admin/brief-review/page.tsx` | 9 | 2026-04-10 | (9-line stub) |

**Section C count: 7**

---

## Totals

- **Total admin page files (excluding 3 backups):** 143
- Section A (CORE): **2**
- Section B (EXPERIMENTAL): **134**
- Section C (AMBIGUOUS): **7**

---

## Orphan directories — folders without `page.tsx`

A directory is "orphan" if it sits inside `src/app/admin/` and contains no `page.{tsx,ts,jsx,js}` at its own level. Some are component/hook support folders by design (lowercase `components/`, `hooks/`, `_components/`); others look like Next.js parent routes that lost their page.

### Likely intentional support folders (NOT orphan routes)

- `src/app/admin/canvas/[projectId]/_components` — underscore prefix is a Next.js convention for private folders
- `src/app/admin/components`
- `src/app/admin/hooks`
- `src/app/admin/hub/components`
- `src/app/admin/newsletter/components`
- `src/app/admin/studio/components`
- `src/app/admin/super-admin-components`
- `src/app/admin/viral-studio/components`
- `src/app/admin/viral-studio/components/phases`
- `src/app/admin/viral-studio/components/ui`

### Possible orphan parent routes (folder exists, child pages exist, but no `page.tsx` at this level)

| Directory | Children present | Visiting parent URL would |
|---|---|---|
| `src/app/admin/(studio)` | (route group, no children visible — empty) | Route groups don't add segments; an empty group is invisible to routing. **Possible vestige.** |
| `src/app/admin/accuracy` | `accuracy/publish/` (also missing page) | 404 |
| `src/app/admin/accuracy/publish` | (no children, no page) | 404 |
| `src/app/admin/integrations` | `integrations/api/page.tsx`, `integrations/webhooks/page.tsx` | 404 — `/admin/integrations` does NOT render |
| `src/app/admin/marketplace` | `marketplace/creator/page.tsx` | 404 — `/admin/marketplace` does NOT render |
| `src/app/admin/planning` | `planning/[id]/page.tsx` | 404 — `/admin/planning` (no id) does NOT render |
| `src/app/admin/recipes` | `recipes/leaderboard/page.tsx` | 404 — `/admin/recipes` does NOT render |
| `src/app/admin/template-analyzer/template` | `template/[id]/page.tsx` | 404 — `/admin/template-analyzer/template` (no id) does NOT render |
| `src/app/admin/workflows` | `workflows/creator/page.tsx`, `workflows/quick-win/page.tsx` | 404 — `/admin/workflows` does NOT render |

These 9 parent routes are either intentional (you only ever link directly to a child) or accidental (a parent landing page was deleted/never written). I am NOT making that call — flagging only.

---

## Anything that surprised you (read-only observations, NOT recommendations)

### 1. Extreme date clustering
**131 of 143 admin pages share the same git mtime: 2026-03-30.** That's ~92% of the admin tree touched on a single day. Two possibilities:
- A repo-wide reformat / mass-move that reset git's modification dates
- A genuine point-in-time write spree

Either way, "last modified" alone is a poor signal of "this page is in active use" for the admin tree. The strict 2-week cutoff places nearly the whole admin section into Section B, but that doesn't mean those pages are dead — many of them (mission-control, monitoring, master-orchestrator, calibration, model-evaluation, the operations/training family) are referenced extensively in the project memory as load-bearing surfaces. **Treat Section B's size with skepticism, not as a hit-list.**

### 2. Three files exist that are NOT page routes but look like they were
- `src/app/admin/testing-accuracy/page.BACKUP-20251030-150900.tsx`
- `src/app/admin/testing-accuracy/page.tsx.backup-20251024`
- `src/app/admin/testing-accuracy/page.tsx.before-step1`

Next.js will not treat any of these as routes (the basename must be exactly `page.tsx`/etc.), so they are dead weight in the routing sense. They DO sit alongside the live `testing-accuracy/page.tsx` and could be confusing if Tommy or a future agent grep-edits "testing-accuracy". **Not flagged for removal — they may be intentional history pins from past surgery.**

### 3. One non-TSX page in the admin tree
`src/app/admin/template-generator/page.js` is plain JavaScript (no TypeScript). Every other admin page is `.tsx`. Could be:
- Intentional (some lib it imports doesn't have types and Tommy didn't want to fight it)
- An old scaffold that never got migrated
The page has 190 lines and renders an actual `<h1>TemplateGenerator</h1>`, so it's not a stub.

### 4. Auth-gate pattern in 7+ pages
Many pages have an early-return block titled "Admin Access Required" with a gradient title — example files: `advisor-service`, `apify-scraper`, `dna-detective`, `draft-analyzer`, `feature-decomposer`, `feedback-ingest`, `gene-tagger`, `orchestrator`, `recipe-book-api`, `viral-filter`, `etl-dashboard`. The pattern suggests a copy-pasted template auth check. None of them imports `firebase/firestore`, so the auth check is whatever the local convention is — but having 11+ near-identical 50-line auth gates inline (rather than via a shared `<AdminGate>` component or middleware) is unusual. **Not recommending consolidation; just noting it for context.**

### 5. Two pages exist with effectively the same name
- `/admin/draft-analyzer` (`src/app/admin/draft-analyzer/page.tsx`, 269 lines)
- `/admin/drafts-analyzer` (`src/app/admin/drafts-analyzer/page.tsx`, 444 lines)

Singular vs plural. Both 2026-03-30. Both real pages. Probably one is a successor to the other; possibly both are kept on purpose.

Also adjacent: `/admin/recipe-book` and `/admin/recipe-book-api`, plus `/admin/viral-recipe-book`, plus `/admin/recipes/leaderboard`. Four pages in the "recipe" namespace.

Plus `/admin/marketplace/creator` and `/admin/creators` and `/admin/marketing-studio` and `/admin/marketing-inception` — the boundary between these surfaces is not obvious from the file system alone.

### 6. A single 4286-line page (upload-test)
`src/app/admin/upload-test/page.tsx` is **4286 lines**. The next-largest admin page is `operations/training/page.tsx` at 2301. Per memory, `upload-test` is "Primary workflow page (uses `/api/kai/predict`)". A 4-thousand-line single-file React component that is also the most-trafficked admin workflow is worth knowing about — not for a refactor (forbidden), but because any change to it has a wide blast radius.

### 7. The two pages in Section A both touch areas under heavy active development
- `/admin/operations/training/data` (2026-05-03) — training data management. Active per memory ("Bucket 3: Training Pipeline Automation").
- `/admin/workflows/quick-win` (2026-04-29) — workflow surface. The `Sidebar.tsx` has explicit isActive checks for `/quick-win` paths, suggesting this is a routed feature with a pinned nav slot.

The fact that Section A has only 2 entries reflects the date-clustering issue (#1), not the actual active-surface count. Tommy should expect to manually re-bucket many B entries into "still load-bearing" based on his own context.

### 8. The `super-admin-live` page uses a CSS class (`page-title`) instead of inline tailwind for its `<h1>`
Almost every other admin page uses inline Tailwind for headings. `super-admin-live/page.tsx:191` uses `<h1 className="page-title">…` — implies a separate stylesheet. Could mean this page was authored under a different convention (older, transplanted from elsewhere, or part of a separate design system). **Just a fingerprint; not flagging.**

### 9. The admin tree has a `(studio)` route group that appears empty
`src/app/admin/(studio)/` is listed as a directory but has no `page.tsx` and no other tracked files I can see at that level. Route groups in Next.js are zero-segment (only their layout / page applies), so an empty one is effectively invisible — but it also signals that something was being staged here and either got moved to `studio/` (which exists and has its own page.tsx and `script/page.tsx`) or got abandoned. Cannot decide which.
