## Sandbox Reuse Map

This map lists existing reusable components/utilities with import paths, and identifies minimal gaps we will fill for the Viral Quick-Win Workflow. Rule: reuse-first; extend via props/variants; only create when nothing equivalent exists.

### Layout shells
- `src/app/(dashboard)/layout.tsx` — dashboard shell (Header/Sidebar)
- `src/app/admin/layout.tsx` — admin shell (MasterNavigation etc.)
- `src/app/sandbox/viral-lab-v2/layout.tsx` — simple sandbox shell using `GlobalStateProvider`
- `src/components/layout/EnhancedLayout.tsx` — enhanced generic layout

Decision: For sandbox, use a lightweight local layout that wraps pages with context; do not alter global shells.

### Grid/stack primitives
- Tailwind utility grid classes throughout (e.g., `TemplateGrid`): `src/components/templates/TemplateGrid.tsx`

### Cards
- `src/components/ui/card` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `src/components/ui/unified-card` — compatible resolver wrapper

### Chips/Badges/Pills
- `src/components/ui/badge`
- `src/components/ui/os/Pill`

### Tabs
- `src/components/ui/tabs` (Radix-based)

### Breadcrumb
- Inline breadcrumb patterns exist (e.g., `src/app/dashboard-view/template-editor/page.tsx`) but no shared component.
Gap: Minimal breadcrumb chip row. Action: implement small inline breadcrumb where needed (no new global component).

### Drawer/Modal
- Modal/Dialog: `src/components/ui/dialog`
- Additional modals: `src/components/studio/Modal`, `src/components/ui/morphing-dialog`
Gap: Drawer/Sheet. Action: implement a simple drawer via `Dialog` + slide-in classes locally in sandbox.

### Tooltip/Toast/Confetti
- Tooltip: `src/components/ui/tooltip`
- Toast: `src/components/ui/use-toast` (and `toast.tsx` infra)
- Confetti: `src/lib/hooks/useConfetti`

### Charts (sparkline/line)
- Simple wrappers: `src/components/ui/chart-wrappers.tsx` (LineChart/BarChart placeholders)
- Rich charts via Recharts examples (e.g., `ImpactTimelineChart.tsx`)

### Validation visuals (calibration/confusion)
- No dedicated reusable confusion matrix/calibration component. Some validation UIs exist (e.g., `src/components/admin/viral-recipe-book/ValidationSystem.tsx`).
Gap: Lightweight, sandbox-only calibration bins + confusion matrix table on the `accuracy` page.

### Gallery cards
- `src/components/templates/TemplateCard.tsx` and `TemplateGrid.tsx`
Decision: For tight control of testIDs and ribbons, use `Card` primitives to render a minimal gallery card while reusing tokens.

### Script tools
- Deterministic script pipeline: `src/lib/script/*` (features, score, recommend, edit)
- No React teleprompter component; a reference exists in `cell phone template editor.html`.
Gap: Minimal Teleprompter dialog (sandbox-only) using `Dialog` + scrolling text.

### Export utilities
- CSV server examples: `src/app/api/public/accuracy/csv/route.ts`, `src/app/api/scale/case-study/[creatorId]/route.ts` (toCSV)
- ZIP/PDF reporting infra exists but not a simple client PDF generator: `src/lib/monitoring/analytics-reporting.ts`, `src/lib/audit/audit_utils.ts`
Gaps to add (sandbox-only, client):
- SRT generator (text → basic SRT blocks)
- ICS generator (single event series)
- CSV/TXT captions export (client)
- PDF report stub (download a simple blob)

### Store/Context
- Multiple contexts exist (e.g., `src/lib/contexts/StateContext.tsx`), but none for sandbox workflow session.
Gap: `SandboxWorkflowContext` with localStorage persistence of niche, goal, templateId, script, analysis, schedule, receipts.

### HTTP/utilities
- `src/lib/api/client.ts`, `src/lib/hooks/useDataFetching.ts`, `src/lib/hooks/useOptimizedDataFetching.ts`
Decision: Sandbox pages use local fixtures via tiny mock services (with timeouts) rather than remote HTTP.

### Feature flags
- Feature frameworks exist: `src/hooks/useFeature`, `src/lib/flags/*`.
Decision: Gate sandbox via a simple env flag `NEXT_PUBLIC_SANDBOX_WORKFLOW=1` for demo isolation.

### Icons & Design tokens
- Icons: `lucide-react`
- Tokens: `src/lib/design-tokens.ts` and Tailwind theme in `tailwind.config.ts`

---

## Gaps and Minimal New Components/Services (sandbox-only)
- `SandboxWorkflowContext` (local state + persistence)
- TeleprompterDialog (Dialog + scroll text)
- Export utils: `srt.ts`, `ics.ts`, `csv.ts`, `pdf.ts`
- Fixture-backed mock services with small timeouts
- Simple drawer via `Dialog` with slide-in panel

All new pieces will live under `src/app/sandbox/workflow/*`, adhere to Unicorn UX (Invisible UI, Emotional Design, Contextual Intelligence, Progressive Disclosure, Sensory Harmony), and reuse tokens/components above.


