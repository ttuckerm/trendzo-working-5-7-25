# LIVE REUSE MAP — Starter Pack Path (LIVE)

This document lists the production components and utilities reused for the LIVE Starter Pack Path. No new atoms were introduced; only variants/props added where needed.

## Page Chrome
- `src/app/components/MasterNavigation.tsx`
- `src/components/layout/AdminSidebar.tsx`
- `src/components/studio/StudioSidebar.tsx`
- `src/components/studio/NetflixSidebar.tsx`

## Gallery
- Container and grid
  - `src/app/admin/studio/page.tsx` (Gallery section)
  - `src/components/value-template-editor/ViralVideoGallery.tsx`
- Cards + pills/chips/tags/overlay/success %/7-day Δ indicator
  - `src/components/templates/TemplateCard.tsx`
  - `src/components/templates/ViralTemplateCard.tsx`
  - `src/components/ui/badge.tsx` (badge variants used as ribbons/pills)
  - `src/components/ui/ui-compatibility.tsx` (Badge compatibility wrapper, where applicable)

## Script Editor & Tools
- Script Intelligence
  - `src/components/admin/ScriptIntelligenceDashboard.tsx`
  - `src/app/api/admin/script-intelligence/route.ts`
- Teleprompter + SRT export
  - SRT: `src/app/sandbox/workflow/_services/exports.ts` (exportSRT)

## Instant Analysis Widgets
- Analysis UI
  - `src/app/admin/analysis/page.tsx`
- Widgets (score gauge, confidence bands, fixes)
  - Within `src/app/admin/analysis/page.tsx` and associated UI primitives

## UI Primitives (Drawer/Modal, Toast, Buttons, Progress, KPI tiles, Charts, Table)
- Buttons: `src/components/ui/button.tsx`, `src/components/ui/enhanced-button.tsx`
- Badges/Pills/Tags: `src/components/ui/badge.tsx`, `src/components/ui/os/Pill.tsx`
- Cards/Toasts: `src/components/ui/card.tsx`, `src/components/ui/use-toast.ts`

## Schedule & Exports
- Rollout Planner (reference): `src/app/sandbox/workflow/schedule/page.tsx`
- Exporters (LIVE adapters)
  - ICS: `src/app/sandbox/workflow/_services/exports.ts` (exportICS)
  - CSV/TXT: `src/app/sandbox/workflow/_services/exports.ts` (exportCSV, exportTXT)
  - SRT: `src/app/sandbox/workflow/_services/exports.ts` (exportSRT)

## Feature Flags
- `src/hooks/useFeature.ts`
- `src/lib/flags/evaluator.ts`
- `src/lib/utils/featureFlags.ts`

## Shared Store
- Zustand pattern reference: `src/lib/state/windowStore.ts`
- New store (added): `src/lib/state/workflowStore.ts`

## Receipt & Persistence
- UI: `src/components/ui/card.tsx`, `src/components/ui/use-toast.ts`
- Persistence: localStorage per Starter Pack spec (persist niche/goal/starterEnabled/receipts)

Notes
- All visuals use existing components; no new atoms. Ribbons and chip are implemented as variants of existing Badge/Button components.
- Motion/tokens follow production styles; keyboard/focus/ARIA added where necessary.
