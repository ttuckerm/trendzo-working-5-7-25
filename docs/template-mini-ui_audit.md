### Mini-UI Accuracy Dev Store Toggle

Use the in-memory dev accuracy store for local/demo environments without Supabase.

- Env toggle: set `ACCURACY_DEV_STORE=true`
- Affects endpoints:
  - `POST /api/jobs/calibrate`: forces dev mode join; response includes `mode: "dev"`
  - `GET /api/metrics/accuracy`: computes from dev store; response includes `mode: "dev"`
- Admin UI indicators:
  - Recalibrate panel shows a pill: “Mode: DEV” (amber) when in dev mode, “Mode: DB” (green) otherwise
  - Reliability chart shows caption “Dev store (in-memory)” when metrics are from dev mode
- Seed button text: “Seed demo data (dev)” and success toast includes counts and “(dev)” suffix

Notes:
- Dev store lives in `src/lib/dev/accuracyStore.ts` and is process-local, non-persistent.
- Calibrate reads last 30 days from the dev store. If labels are missing, labels are derived on-the-fly from outcomes using platform-specific thresholds (TikTok 95, Instagram 92, YouTube 90) applied to simple view-based percentiles.
### Template Mini‑UI — End‑to‑End Audit (P0)

#### Executive summary
- Mini‑UI module is implemented and flag‑gated; clicking a Template card can open it instead of the legacy detail page when enabled.
- Hash deep‑links and keyboard shortcuts are supported (Reader/Editor + 6 right‑rail panels).
- Right‑rail panels provide summaries and deep links to the existing full pages; the Analyzer remains out of scope.
- Telemetry ingestion API is implemented; client logs `open`, `apply_fix`, and token usage (as `outcome`). Other events are scaffolded.
- Realtime signal bridge uses Supabase broadcast channels (`template:{id}`) for slot updates with optimistic preview.
- Preview kernel supports cancelation and skeletons (>250 ms) to meet perf gates; Playwright spec asserts P95 targets.
- Integration is additive: legacy pages remain; feature flag controls the new route.
- Some unit testing scaffolding exists; CI/type‑check currently fails due to pre‑existing repo‑wide TS issues (not introduced by Mini‑UI).
- Token metering exists and is wired to preview renders; LLM calls are not yet wrapped.
- No warehouse/dbt/calibration/A/B automation is wired inside Mini‑UI; those remain on the full pages.

---

### How to enable in development
- Set environment variable: `NEXT_PUBLIC_FEATURE_TEMPLATE_MINI_UI=true`
- Navigate to membership book: `/membership/viral-recipe-book`
- Click a template card; when the flag is ON it routes to Mini‑UI: `/membership/viral-recipe-book/templates/{id}`
- Optional: append `?hash=#validate` (or `#dashboard`, etc.) to land on a specific panel.

---

### File inventory

- Mini‑UI module (src/components/templateMiniUI/)
  - `miniRouter.ts` — URL hash router, back‑stack, keyboard shortcuts (D/S/O/B/I/V, E, Esc)
  - `store.ts` — per‑instance Zustand vanilla store with undo/redo and isolated slots
  - `signalBridge.ts` — Supabase broadcast channel binder; `template:{id}`, event `slot_update`
  - `previewKernel.ts` — incremental preview with cancel tokens and 250 ms skeleton threshold; token metering hook‑in
  - `validation.ts` — basic rules (hashtags limit by platform; required first‑3s cue; TikTok on‑screen text length)
  - `telemetry.ts` — client logger to `/api/telemetry/template-event` (+ Supabase fallback), `logTokenUsage`
  - `tokenMeter.ts` — soft/hard caps + usage tracking (vanilla store)
  - `TemplateMiniUI.tsx` — main UI shell: breadcrumb, center preview, right‑rail panels, fixes, deep links
  - `index.ts` — barrel exports
  - (Demo) `src/app/template-mini-ui-demo/page.tsx`

- Feature flag
  - `src/config/flags.ts` → `isTemplateMiniUIEnabled()` (reads `NEXT_PUBLIC_FEATURE_TEMPLATE_MINI_UI`)

- Integration routes
  - `src/app/membership/viral-recipe-book/templates/[id]/page.tsx` — Mini‑UI entry (flag‑gated)

- Template card click handler (navigates to Mini‑UI when flag ON)
  - `src/components/admin/viral-recipe-book/TemplateGallery.tsx`

- Telemetry ingestion API
  - `src/app/api/telemetry/template-event/route.ts`

---

### Behavior verification (as‑built)

- Deep links (hash)
  - Supported: `#reader`, `#editor`, `#dashboard`, `#scripts`, `#optimize`, `#abtest`, `#inception`, `#validate`
  - Behavior: hash changes drive UI; Esc restores prior hash (mini back‑stack)

- Keyboard
  - `D/S/O/B/I/V` open respective right‑rail panels, `E` toggles editor, `Esc` returns to prior hash

- Right‑rail panel → Full‑page deep links
  - Dashboard: `/membership/viral-recipe-book?tab=dashboard&templateId={id}`
  - Scripts: `/membership/viral-recipe-book?tab=scripts&templateId={id}`
  - Optimize: `/membership/viral-recipe-book?tab=optimization&templateId={id}`
  - A/B: `/membership/viral-recipe-book?tab=abtesting&templateId={id}`
  - Inception: `/membership/viral-recipe-book?tab=inception&templateId={id}`
  - Validate: `/membership/viral-recipe-book?tab=validation&templateId={id}`

- Supabase signal bridge
  - Channel: `template:{templateId}` (Supabase Realtime broadcast)
  - Event: `slot_update`
  - Payload: `{ templateId: string, slot: 'hook'|'onScreenText'|'captions'|'hashtags'|'shotList'|'thumbnailBrief'|'first3sCue', value: string|string[], ts: number, source?: string }`
  - Behavior: optimistic local patch + triggers incremental preview render

- Preview kernel
  - Cancel tokens: new renders cancel in‑flight ones
  - Skeleton: shown if render exceeds ~250 ms
  - Goal: supports P95 full refresh ≤ 500 ms; used by e2e perf assertions

- Validation + 1‑click fixes
  - Rules:
    - Hashtag count limits per platform (TikTok 3, Instagram 5, YouTube 15)
    - First‑3s cue required
    - TikTok on‑screen text length guidance (≤ ~80 chars)
  - Fixes:
    - Trim hashtags to platform limit
    - Auto‑seed a first‑3s cue text

- Telemetry v1 (client → API → Supabase)
  - Emitted now:
    - `open` on mount: `{ event_type:'open', template_id, user_id?, platform?, cohort_snapshot?, ts }`
    - `apply_fix` on 1‑click fix: same envelope + `metrics_payload: { id: rule_id }`
    - `outcome` (for token usage) via `logTokenUsage`: `metrics_payload: { type:'token_usage', tokens, phase }`
  - Scaffolded but not yet emitted in UI: `variant`, `export`, `publish` (API supports them)

- Token metering
  - Implemented in `tokenMeter.ts`; currently applied in `previewKernel.ts` (charges ~250 tokens per render and logs usage)
  - Not yet wrapping LLM calls for scripts/captions/thumbnails

---

### Tests & gates

- Playwright (E2E)
  - File: `tests/e2e/template-mini-ui.spec.ts`
  - Asserts:
    - Hash routing for panels and Esc navigation
    - Perf approximations: P95 slot edit ≤ 150 ms; P95 preview refresh ≤ 500 ms
  - Run:
    - `npx playwright test tests/e2e/template-mini-ui.spec.ts`
    - Or project script: `npm run test:e2e` (runs whole suite)

- Unit tests
  - File: `src/components/templateMiniUI/__tests__/telemetry.test.ts`
  - Notes: Uses `vi` mock (Vitest style). Repo primarily uses Jest; without Vitest setup this may fail. Recommend converting to Jest or adding Vitest infra.

- Current status (local)
  - TypeScript type‑check has pre‑existing errors across the repo; unrelated to Mini‑UI code. E2E spec is additive, but CI stability depends on isolating/running only the Mini‑UI spec.

---

### Built vs Not Built matrix

| Capability | Status |
|---|---|
| Mini‑router + hashes + shortcuts | ✅ Built & integrated |
| Per‑instance store (undo/redo) | ✅ Built & integrated |
| Right‑rail panels (summary + 1 primary action + deep links) | ✅ Built & integrated |
| Supabase signal bridge (slot updates) | ✅ Built & integrated |
| Preview kernel (cancel + skeleton, perf) | ✅ Built & integrated |
| Validation engine + 1‑click fixes | ✅ Built & integrated (basic rules) |
| Telemetry (open, variant, apply_fix, export, publish, outcome) | 🔧 Scaffolded; UI emits `open`, `apply_fix`, `outcome(token_usage)` only |
| Token metering (enforcement + logging) | ⚠️ Built in demo (preview only); not applied to LLM calls |
| A/B panel (create test, splits, status, auto‑promote/rollback) | ⚠️ Panel summary + deep link only (use full page) |
| Calibration jobs + reliability plots + Algorithm Weather alerts | ❌ Not built in Mini‑UI (handled elsewhere) |
| Warehouse ELT + dbt models + accuracy/ECE dashboards | ❌ Not built in Mini‑UI (handled elsewhere) |
| Feature flag ON/OFF path (env + code) | ✅ Built & integrated |
| Membership page integration (Template card → Mini‑UI route) | ✅ Built & integrated |

Legend: ✅ Built & integrated · ⚠️ Built in demo only · 🔧 Scaffolding exists but incomplete · ❌ Not built

---

### Design preservation check
- Additive: Legacy detail/editor pages are preserved. No removals.
- Files changed outside Mini‑UI (for integration):
  - `src/config/flags.ts` — new helper `isTemplateMiniUIEnabled()`
  - `src/components/admin/viral-recipe-book/TemplateGallery.tsx` — click handler routes to Mini‑UI when flag ON
  - `src/app/membership/viral-recipe-book/templates/[id]/page.tsx` — new route mounting Mini‑UI
  - `src/app/api/telemetry/template-event/route.ts` — new API route for telemetry ingestion
  - (Demo) `src/app/template-mini-ui-demo/page.tsx` — optional showcase
- Styles/themes: Mini‑UI uses existing UI primitives (Radix/Dialog, Buttons, Tailwind). No known theme conflicts.

---

### Admin / Feature‑toggle readiness
- Current infra: flag reads from `NEXT_PUBLIC_FEATURE_TEMPLATE_MINI_UI`; no admin UI present for toggling.
- Minimal Feature Switchboard (spec only):
  - Route: `/admin/features` (super‑admin only)
  - Backing store:
    - `.env` for build‑time defaults
    - Supabase table `feature_flags(workspace_id text, name text, enabled boolean, updated_at timestamptz)` for runtime overrides
  - Operations:
    - List global + per‑workspace flags; search; toggle with audit trail
  - Files to create (proposal):
    - `src/app/admin/features/page.tsx` — UI
    - `src/app/api/admin/feature-flags/route.ts` — CRUD endpoints
    - `src/lib/flags/runtimeFlags.ts` — read/merge env + DB flags with simple cache

---

### Risks & recommended next steps

P0 (ship blockers)
- Ensure E2E perf spec is run in CI as a standalone job; gate on P95 thresholds.
- Convert telemetry unit test to Jest or add Vitest infra to avoid CI noise.
- Add `variant`, `export`, `publish` emissions in Mini‑UI flows where applicable.

P1 (close the loop)
- Wrap LLM‑based operations (scripts/captions/thumbnails) with token metering + telemetry.
- Add basic UI for A/B panel within Mini‑UI (or keep deep‑link only but capture telemetry actions).
- Add debounce (100–150 ms) in signal bridge if realtime chatter increases; keep cancel tokens.

P2 (analytics/accuracy)
- Wire `outcome` events to post‑publish metrics pipeline; add calibration jobs and reliability plots.
- Surface ECE/AUC dashboards; ensure warehouse ELT/dbt are feeding product dashboards.


