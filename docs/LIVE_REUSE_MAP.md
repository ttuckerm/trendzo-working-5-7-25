# LIVE Reuse Map — Starter Pack Path (Step 1)

Scope: Inventory only. No UI changes.

## Gallery / Recipe Book
- Template Gallery (admin): `src/components/admin/viral-recipe-book/TemplateGallery.tsx`
- Recipe Book page: `src/app/admin/viral-recipe-book/page.tsx`
- Template Viewer: `src/components/admin/viral-recipe-book/TemplateViewer.tsx`
- Dataset/API: `src/app/api/recipe-book/route.ts`, `src/lib/templates/service.ts`, `src/lib/templates/cache.ts`

## UI Tokens / Components
- Badge: `@/components/ui/badge`
- Button: `@/components/ui/button`
- Card: `@/components/ui/card`
- Tabs: `@/components/ui/tabs`
- Toast: `@/components/ui/use-toast`
- Dialog: `@/components/ui/dialog`

## Workflow (existing references)
- Zustand reference: `src/lib/state/windowStore.ts`
- Existing workflow store (legacy/demo): `src/lib/state/workflowStore.ts`

## Starter Path Routes (allowed)
- `/admin/studio`
- `/admin/studio/script`
- `/admin/studio/analysis`
- `/admin/studio/schedule`
- `/admin/studio/receipt`
- `/admin/viral-recipe-book`

## Feature Flags
- Evaluator (Supabase-backed): `src/lib/flags/evaluator.ts`
- Hook facade: `src/hooks/useFeature.ts`
- New static flag (this step): `src/config/flags.ts`

## Persistence
- Scoped localStorage helpers: `src/workflow/persist.ts`

## URL Helpers
- New utilities: `src/workflow/url.ts`

## Route Guard
- New guard: `src/workflow/routeGuard.ts`

Notes
- Reuse-first: badges/buttons/cards/tabs come from existing shadcn UI.
- No new atoms added. Chip/ribbons for Step 2 will be variants of existing tokens.
- No UI is introduced in Step 1; only utilities, store, and tests.


