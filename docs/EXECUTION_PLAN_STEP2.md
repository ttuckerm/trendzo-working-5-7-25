# Execution Plan — Step 2 (Gallery-only Starter Pack UI)

Scope: Add chip + ribbons to Gallery/Recipe Book only. No changes to other tabs or pages.

## Route Guarding
- Use `isGalleryRoute()` from `src/workflow/routeGuard.ts` before mounting any Starter UI.
- Approved routes:
  - `/admin/viral-recipe-book`
- Explicitly deny: any other `/admin/*`, `/sandbox/*`, `/app/*` unless listed above.

## File-by-File Changes

1) `src/app/admin/viral-recipe-book/page.tsx`
- Add Starter chip button using existing `Badge`/`Button` styles.
- Conditions:
  - Only render when `isGalleryRoute(routerPathname)` is true.
  - Chip toggles `starterEnabled` via `useWorkflowStore().enableStarter(on)`.
  - When enabled, compute `starterTemplates` (current logic already present) and show “ribbons” on the top 3 in `TemplateGallery` via props.
- Props/variants to extend:
  - Pass `starterEnabled` (boolean) and `starterIds` (string[]) to `TemplateGallery` (already used in current code path).
  - Ensure `data-testid="starter-chip"` present for QA.

2) `src/components/admin/viral-recipe-book/TemplateGallery.tsx`
- Accept additional props if needed for ribbons: `starterEnabled: boolean`, `starterIds: string[]` (already in file), and ensure safe defaults.
- Render ribbons using existing `Badge` component variants; no new atoms.
- Add test IDs on ribbons: `data-testid="starter-ribbon"` on those cards whose ids are in `starterIds`.

3) Navigation to Script
- On click of a Starter card in `TemplateGallery`, call `onStarterSelect(template)` (already present) which should:
  - `enableStarter(true)`
  - `selectTemplate(id)`
  - `router.push('/admin/studio/script?starter=on')`

## Acceptance Criteria
- No Starter visuals outside `/admin/viral-recipe-book`.
- Chip toggles Starter state with visual feedback.
- Ribbons appear only on top 3 when enabled.
- Clicking a ribboned card navigates to Script with `?starter=on` param.
- All pre-existing functionality unaffected.

## Tests (to add in Step 2)
- e2e: visibility of chip and ribbons only on gallery route; navigation includes `starter=on`.
- unit: verify `TemplateGallery` renders `starter-ribbon` only for allowed IDs.

## Rollback
- Revert the file edits above; utilities and store from Step 1 remain safe and inert.
