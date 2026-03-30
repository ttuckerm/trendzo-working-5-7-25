BEGIN REPORT

# Viral Recipe Book — Inventory & Gaps

## A. Page Summary
- Route: /admin/viral-recipe-book
- Tabs present: [Templates, Analyzer, Dashboard, Scripts, Optimize, A/B Test, Inception, Validate]
- Shared layout: [header chips, filters bar, slide-over, no inner left nav]
- Polling defaults: 15–30s

## B. Component Inventory (one row per component)
| Tab | Component | File path | Purpose (1 line) | Endpoint(s) | Poll | State (SWR/zustand/etc.) | TestIDs | Data shape (key fields) |
|---|---|---|---|---|---|---|---|---|
| Global | Header KPI Chips (inline) | src/app/admin/viral-recipe-book/page.tsx | Show System Accuracy and Active Templates | GET /api/discovery/metrics | 20s (SWR) | SWR + useState | kpi-chips | system.accuracy_pct, templates.active_count, discovery.freshness_seconds, new_per_day, churn_pct, coverage_pct |
| Global | Filters Bar (inline) | src/app/admin/viral-recipe-book/page.tsx | Range/Platform/Niche controls + Refresh | GET /api/templates?range=&platform=&niche=&sort= | Manual | useState | filters-bar, btn-refresh | id, name, status, sr, uses, examples, entity{sound,hashtags[]}, last_seen_at, trend[], safety{nsfw,copyright}, uplift_pct, support |
| Templates | Sections: HOT/COOLING/NEW (inline) | src/app/admin/viral-recipe-book/page.tsx | Three section cards from discovery list | GET /api/templates?range=... | On change/Refresh | useState + useEffect | hot-list, cooling-list, new-list, tpl-card-<id> | same as above |
| Templates | TemplateGallery | src/components/admin/viral-recipe-book/TemplateGallery.tsx | All templates grid (AURA cards) | GET /api/templates?range=30d | — | useEffect | — | maps endpoint -> ViralTemplate {id,title,success_rate,viral_probability,avg_views,status,last_updated,...} |
| Templates | TemplateViewer (Slide-over) | src/components/admin/viral-recipe-book/TemplateViewer.tsx | Detailed template view with tabs | — | — | local state | tpl-slide-tabs | ViralTemplate (passed from gallery) |
| Analyzer | DraftsAnalyzer | src/components/admin/viral-recipe-book/DraftsAnalyzer.tsx | Upload/link/script → analysis, predictions | POST /api/drafts/analyze; (client polling stub) GET /api/video/predict | 5s (client polling stub) | useState | analyze-dropzone, analyze-results | {probability, confidence, top_matches[], prioritized_fixes[]} |
| Dashboard | PredictionDashboard | src/components/admin/viral-recipe-book/PredictionDashboard.tsx | Prediction metrics and recent predictions | — | — | useState (mock) | chart-discovery, chart-decay (placeholders in page) | — |
| Scripts | ScriptIntelligenceDashboard | src/components/admin/ScriptIntelligenceDashboard.tsx | Script analysis/generation/memory/patterns | POST /api/admin/script-intelligence (actions); GET /api/admin/script-intelligence?endpoint=... | — | useState + fetch | scripts-list (placeholder) | varied: analysis, generation, memories, metrics |
| Optimize | OptimizationEngine | src/components/admin/viral-recipe-book/OptimizationEngine.tsx | AI optimization suggestions and roadmap | — | — | useState | opt-schedule, opt-entities (placeholders) | — |
| A/B Test | ABTestInterface | src/components/admin/viral-recipe-book/ABTestInterface.tsx | Create/run/inspect A/B tests | POST /api/ab/start | — | useState | ab-start, ab-table (placeholders) | {id,test_name,variants[],results?,status,...} |
| Inception | InceptionMarketing | src/components/admin/viral-recipe-book/InceptionMarketing.tsx | Generate/promote Trendzo marketing content | POST /api/admin/script-intelligence (generate_script) | — | useState | inception-queue (placeholder) | generation receipt + content object |
| Validate | ValidationSystem | src/components/admin/viral-recipe-book/ValidationSystem.tsx | Validation runs and accuracy metrics | — | — | useState | validate-calibration (placeholder) | — |
| Global | FloatingBrainTrigger | src/components/admin/FloatingBrainTrigger.tsx | Opens floating AI assistant | — | — | context | — | — |

## C. Slide-over Tabs (Template Details)
| Tab name | File path | Endpoint(s) | TestIDs | Notes |
|---|---|---|---|---|
| Structure | src/components/admin/viral-recipe-book/TemplateViewer.tsx | — | tpl-slide-tabs | Client-only; shows structure fields from selected template |
| Viral Elements | src/components/admin/viral-recipe-book/TemplateViewer.tsx | — | tpl-slide-tabs | Client-only mock data |
| Examples | src/components/admin/viral-recipe-book/TemplateViewer.tsx | — | tpl-slide-tabs | Client-only; no fetch to /api/templates/:id/examples yet |
| Optimization | src/components/admin/viral-recipe-book/TemplateViewer.tsx | — | tpl-slide-tabs | Client-only mock tips |
| Preview | src/components/admin/viral-recipe-book/TemplateViewer.tsx | — | tpl-slide-tabs | Visual mock preview only |

## D. Charts/Widgets
| Name | File path | Endpoint | TestID | Notes |
|---|---|---|---|---|
| KPI Chips | src/app/admin/viral-recipe-book/page.tsx | GET /api/discovery/metrics | kpi-chips | SWR 20s poll |
| Discovery freshness (placeholder) | src/app/admin/viral-recipe-book/page.tsx | — | chart-discovery | Placeholder marker only |
| Template decay (placeholder) | src/app/admin/viral-recipe-book/page.tsx | — | chart-decay | Placeholder marker only |

## E. Actions/Mutations
| Action | Endpoint | Method | RBAC/Audit wired? | Toast/Optimistic? |
|---|---|---|---|---|
| Start A/B Test | /api/ab/start | POST | — | — |
| Analyze Draft | /api/drafts/analyze | POST | — | — |
| Generate AI Content (Inception) | /api/admin/script-intelligence | POST | — | — |
| Copy Winner | — | — | — | — |
| Export to Studio (Starter) | (route) /admin/studio/script?starter=on | GET | — | — |
| Refresh Discovery Lists | /api/templates?range=... | GET | — | — |

## F. Discovery KPIs
| KPI | Source endpoint | Calc notes | Poll |
|---|---|---|---|
| System Accuracy | /api/discovery/metrics | uses system.accuracy_pct | 20s (SWR) |
| Active Templates | /api/discovery/metrics | uses templates.active_count | 20s (SWR) |
| Discovery Freshness | /api/discovery/metrics | uses discovery.freshness_seconds (not currently rendered as a chip) | 20s (SWR) |

## G. Overlap Matrix (duplication vs other routes)
| Capability | viral-recipe-book | studio | recipe-book | template-analyzer | Decision (keep/redirect) |
|---|---|---|---|---|---|
| Templates sections (HOT/COOLING/NEW) | yes | — | yes | — | Keep here; redirect from /admin/recipe-book |
| All templates grid | yes | — | partial (different feed) | — | Keep here |
| Analyzer (video/template) | yes | — | — | yes | Keep here; redirect /admin/template-analyzer → here |
| Scripts/patterns intel | yes | partial (creation) | — | — | Keep here; Studio for creation only |
| Optimize suggestions | yes | — | — | — | Keep here |
| A/B testing | yes | — | — | — | Keep here |
| Inception (discovery/promote) | yes | — | — | — | Keep here |
| Validate calibration | yes | — | — | — | Keep here |
| Trending feed | — | — | yes | — | Redirect to Viral Recipe Book |
| Export to Studio | link-out | yes | — | — | Keep Studio link-out only |

## H. Redirects & Nav
- Implemented redirects:
  - /admin/recipe-book → /admin/viral-recipe-book (permanent)
  - /admin/recipe-book/:path* → /admin/viral-recipe-book (permanent)
  - /admin/template-analyzer → /admin/viral-recipe-book?tab=analyzer (permanent)
  - /admin/template-analyzer/:path* → /admin/viral-recipe-book?tab=analyzer (permanent)
- Pending redirects:
  - —
- Nav entries to keep/remove:
  - Keep: VIRAL RECIPE BOOK, THE STUDIO, ENGINE ROOM
  - Remove: legacy “Recipe Book” links (renamed to Viral Recipe Book)

## I. Gaps to close (ordered)
1. Wire TemplateViewer to GET /api/templates/:id and GET /api/templates/:id/examples; add sparkline, safety pills, metrics.
2. Add SWR polling (15–30s) for discovery list; unify All-grid with section data; virtualize All grid.
3. Add `tpl-card-<id>` testids to All grid (AURA cards) for parity with section cards.
4. Implement toasts and audit logging on POST actions (A/B start, Analyzer, Inception).
5. Use GET /api/ab/:id to poll test progress; surface in UI table.
6. Replace dashboard mocks with real endpoints; implement testIDs `chart-discovery`, `chart-decay` with live data.
7. Remove legacy `/api/video/predict` polling path from DraftsAnalyzer; rely on `/api/drafts/analyze` flow.
8. Apply RBAC and safety checks to new endpoints; reuse existing admin protections.
9. Implement “Copy Winner” to create a user draft via endpoint; add success toast.
10. Confirm all nav/menu entries reference Viral Recipe Book as single owner route.

## J. Test Surface (smoke)
| Route/Tab | Required TestIDs (must render non-null) |
|---|---|
| /admin/viral-recipe-book (header) | kpi-chips, filters-bar |
| Templates | tpl-card-<id>, tpl-slide-tabs |
| Analyzer | analyze-dropzone, analyze-results |
| Dashboard | chart-discovery, chart-decay |
| Scripts | scripts-list |
| Optimize | opt-schedule, opt-entities |
| A/B Test | ab-start, ab-table |
| Inception | inception-queue |
| Validate | validate-calibration |

## K. Route Owner Map (JSON)
```json
{ "objective_2_owner": "/admin/viral-recipe-book",
  "redirects": ["/admin/recipe-book", "/admin/template-analyzer"] }
```

END REPORT

### Viral Recipe Book – Inventory & Audit

Generated for route `\admin\viral-recipe-book`.

Tabs/sections/components inventory

| Area | File path | Component | Purpose | Current endpoints | TestIDs | Known gaps |
|---|---|---|---|---|---|---|
| Header KPIs | `src/app/admin/viral-recipe-book/page.tsx` | inline | Show System Accuracy, Active Templates, Discovery Freshness | (to be) `GET /api/discovery/metrics` | — | Static numbers; wire SWR 15–30s polling |
| Filters bar | `src/app/admin/viral-recipe-book/page.tsx` | inline | Range, Platform, Niche, Sort; Refresh | `GET /api/recipe-book?window=...&platform=&niche=`; (to be) `GET /api/templates?range=...&platform=&niche=&sort=` | `starter-chip`, `template-leaderboard` | Sort not wired; All-grid source still legacy |
| Templates tab sections | `src/app/admin/viral-recipe-book/page.tsx` | inline cards | HOT • COOLING • NEW buckets | `GET /api/recipe-book` | — | Lacks per-card testids; sparkline/safety pills missing |
| Templates – All grid | `src/components/admin/viral-recipe-book/TemplateGallery.tsx` | `TemplateGallery` | Cards grid for full list | Legacy `GET /api/gallery/recipe-book` (Supabase) | — | Should switch to `GET /api/templates?range=...` per spec; add `tpl-card-<id>` |
| Template card | `src/components/admin/viral-recipe-book/AURATemplateCard.tsx` | `AURATemplateCard` | Display SR, Uses, Examples, actions | — | — | Needs `data-testid=tpl-card-<id>` |
| Template slide-over | `src/components/admin/viral-recipe-book/TemplateViewer.tsx` | `TemplateViewer` | Details for selected template | (to be) `GET /api/templates/:id` `.../examples` | — | Tabs differ from spec; add `tpl-slide-tabs` |
| Analyzer tab | `src/components/admin/viral-recipe-book/DraftsAnalyzer.tsx` | `DraftsAnalyzer` | Drop/link/script → analysis | Currently `/api/video/upload` + `/api/video/predict`; (to be) `POST /api/drafts/analyze` | — | Add `analyze-dropzone`, `analyze-results`; call `/api/drafts/analyze` |
| Dashboard tab | `src/components/admin/viral-recipe-book/PredictionDashboard.tsx` | `PredictionDashboard` | Charts & metrics | (to be) `GET /api/discovery/metrics` | — | Add `chart-discovery`, `chart-decay` testids |
| Scripts tab | `src/components/admin/ScriptIntelligenceDashboard.tsx` | `ScriptIntelligenceDashboard` | Script patterns & beats | `/api/admin/script-intelligence` | `script-patterns` | Add wrapper `scripts-list` testid |
| Optimize tab | `src/components/admin/viral-recipe-book/OptimizationEngine.tsx` | `OptimizationEngine` | Tweak suggestions, schedule hints | — | — | Add `opt-schedule`, `opt-entities` markers |
| A/B Test tab | `src/components/admin/viral-recipe-book/ABTestInterface.tsx` | `ABTestInterface` | Create & track tests | (to be) `POST /api/ab/start`, `GET /api/ab/:id` | — | Add `ab-start`, `ab-table`; wire endpoints |
| Inception tab | `src/components/admin/viral-recipe-book/InceptionMarketing.tsx` | `InceptionMarketing` | Discovery queue → promote | (to be) `GET /api/templates/discovery` | — | Add `inception-queue` testid |
| Validate tab | `src/components/admin/viral-recipe-book/ValidationSystem.tsx` | `ValidationSystem` | Uplift vs baseline, calibration | (to be) `GET /api/validation/templates` | — | Add `validate-calibration` testid |

Routes overlap and duplication

| Route | Overlapping features with Viral Recipe Book | Action |
|---|---|---|
| `/admin/recipe-book` (`src/app/admin/recipe-book/page.tsx`) | HOT/COOLING/NEW buckets, trending feed | Redirect to `/admin/viral-recipe-book` |
| `/admin/template-analyzer` (`src/app/admin/template-analyzer/*`) | Analyzer UI for trending videos | Redirect to `/admin/viral-recipe-book?tab=analyzer` |
| `/admin/studio` (`src/app/admin/studio/*`) | Content creation; export target only | Keep; link-out from Template actions |

Known gaps summary

- Switch All-grid data source to `GET /api/templates?...` with range/platform/niche/sort; keep Supabase fallback.
- Add required testids across tabs; add slide-over testid for TemplateViewer.
- Implement new endpoints: `/api/templates` (discovery list shape), `/api/templates/{hot|cooling|discovery}`, `/api/templates/:id`, `/api/templates/:id/examples`, `/api/drafts/analyze`, `/api/ab/start`, `/api/ab/:id`, `/api/discovery/metrics`, `/api/validation/templates`.
- Wire header KPIs to `/api/discovery/metrics` with SWR polling.
- Add redirects from old recipe/analyzer routes; update admin nav to single entry.


