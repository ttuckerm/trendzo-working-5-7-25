# Viral Recipe Book — Page Contract

**Route:** `/admin/viral-recipe-book`  
**Owner Objective:** #2 Automated Viral Template Discovery  
**Also Supports:** #3 Instant Analysis, #4 Prediction Validation, #6 Script Intelligence, #11 Marketing Inception

---

## Tabs & Purpose (single source of truth)
1) **Templates** — HOT/COOLING/NEW sections + All grid + Template Viewer.  
2) **Analyzer** — Upload/link → score + prioritized fixes → handoff.  
3) **A/B Test** — Create/Start → poll → Winner surfaced.  
4) **Validate** — Start run → show calibration/confusion metrics.  
5) **Dashboard** — Discovery freshness + template decay charts.  
6) **(Secondary)** Scripts, Optimize, Inception.

---

## Endpoints (must exist, shapes stable)
- **Readiness:** `GET /api/discovery/readiness`
- **Rollups (charts):** `GET /api/discovery/rollups`
- **Templates list:** `GET /api/templates?range=&platform=&niche=`
- **Template detail:** `GET /api/templates/:id`
- **Template examples:** `GET /api/templates/:id/examples`
- **Analyze draft:** `POST /api/drafts/analyze`
- **Start A/B:** `POST /api/ab/start`
- **Poll A/B:** `GET /api/ab/:id`
- **Start validation:** `POST /api/validation/start`

**Ops Actions**
- **QA seed:** `POST /api/discovery/qa-seed`
- **Recompute discovery:** `POST /api/admin/pipeline/actions/recompute-discovery`
- **Warm examples:** `POST /api/admin/pipeline/actions/warm-examples`

---

## Required TestIDs (used by QA & smoke tests)
- `discovery-readiness-pill`, `discovery-readiness-panel`
- `tpl-card-<id>`, `tpl-slide-tabs`
- `analyze-results`, `btn-export-to-studio`, `btn-open-script-intel`
- `ab-start`, `ab-row-<id>`
- `validate-start`
- `chart-discovery`, `chart-decay`

---

## Readiness Gate (thresholds)
Show pill at top:
- **Ready** when: freshness ≤ 2h, templates ≥ 60, each section HOT/COOLING/NEW ≥ 10, examples ≥ 90%, safety ≥ 95%, analyzer/ab/validate online.
- Else **Needs Attention**. Panel lists reasons + buttons: **QA Seed**, **Recompute**, **Warm Examples**.

---

## Golden Path Workflows (what the user should see)
1) **Ops → QA Seed/Recompute → Return here**
   - Pill flips to **Ready**; sections fill with cards.
   - Show top green banner: `✅ Done (Audit #123)` on every POST.

2) **Templates**
   - Click any card (`tpl-card-*`) → slide-over (`tpl-slide-tabs`) shows examples, safety pills, sparkline.
   - Action: “Analyze this template”.

3) **Analyzer**
   - `POST /api/drafts/analyze` → render `analyze-results` with score + prioritized fixes.
   - Show buttons: `btn-export-to-studio`, `btn-open-script-intel`.
   - Banner with Audit # on success.

4) **A/B Test**
   - Click **Start** (`ab-start`) → row appears in **Active** (`ab-row-*`) → polls → **Completed** with Winner.

5) **Validate**
   - Click **Start** (`validate-start`) → run card appears; metrics charts show calibration/confusion.

6) **Dashboard**
   - `chart-discovery` + `chart-decay` render from rollups.

**Empty/Error states:** If data missing, show a clear hint: “Run QA Seed or Recompute in Operations Center”.

---

## RBAC & Audit (non-negotiable)
- All **POST** endpoints require **admin**.
- Every POST returns `{ audit_id }`; UI shows a visible top banner `✅ Action done (Audit #<id>)`.
- Log to `pipeline_control_actions` (or audit table in use).

---

## Acceptance (what QA checks)
- After QA Seed: **pill = Ready** and **sections show cards**.
- Each tab renders its required **TestIDs** with **non-null** data.
- Analyzer shows both handoff buttons.
- A/B moves **Active → Completed** automatically.
- Validate shows metrics.
- Charts render.
- Every POST shows banner with **Audit #**.

---

## Links
- Ops entry: **Engine Room → Operations Center** (Discovery card has QA Seed/Recompute/Warm Examples + link back here).
- Contract source (code): `src/contracts/viralRecipeBook.ts`
- Template Kernel: JSON Schema at `schemas/template-kernel.schema.json` with samples in `schemas/template-kernel.samples.json` and TS types in `src/contracts/templateKernel.ts`. All eight tabs bind to these entities and events.
