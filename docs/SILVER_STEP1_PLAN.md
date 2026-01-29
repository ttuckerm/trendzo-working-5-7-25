## SILVER Step 1 Plan — Gallery UI Entry

Scope: Add Starter Pack chip + helper line + compute 3 HOT IDs + prop-driven ribbons only in Studio/Viral Workflow gallery, without touching Admin/Recipe Book or other tabs.

### Files to edit (only)
1. `src/app/admin/viral-studio/components/phases/GalleryPhase.tsx`
   - Add Starter Pack chip control in the header area.
   - Add helper line beneath header explaining Starter mode.
   - Compute and memoize three HOT template IDs (local-only for display).
   - Pass `starterRibbon={true}` to rendered cards when the Starter mode is enabled.
2. `src/components/common/VideoCard.tsx`
   - Already supports optional `starterRibbon?: boolean` (no visual in Step 0). In Step 1, no style changes yet; only prop plumb-through validation if needed.

### Files explicitly NOT touched in Step 1
- `src/app/admin/viral-recipe-book/page.tsx`
- `src/app/admin/studio/page.tsx`
- Any components under `src/components/admin/viral-recipe-book/`
- Any analytics or validation dashboard pages

### Acceptance criteria (Step 1)
- Only the Studio/Viral Workflow gallery displays the Starter Pack chip and helper line.
- Computing 3 HOT IDs is deterministic and performed client-side without network calls.
- Cards accept `starterRibbon` prop; no visual ribbon yet.
- No changes to Admin/Recipe Book or other tabs.

### Test IDs to add in Step 1
- Header chip: `data-testid="starter-chip"`
- Helper line: `data-testid="starter-helper"`
- Each HOT card annotated with `data-testid="hot-card"` when selected as HOT.


