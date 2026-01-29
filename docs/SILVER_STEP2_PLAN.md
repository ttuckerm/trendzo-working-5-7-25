## SILVER Step 2 Plan — Script Page Behavior

Scope: On `/admin/studio/script?starter=on`, wire the Starter Pack path to prefill, autosave, coach guidance, and export affordances, then enable Save & Analyze → Analysis.

### Files to edit (only)
1. `src/app/admin/studio/script/page.tsx`
   - Read `starter=on` from URL; ensure `enableStarter(true)` is set.
   - Prefill script editor fields based on selected template and niche/goal.
   - Autosave draft to the workflow store on debounce.
   - Add CTA for Export (no new atoms; use existing Button/Tooltip components).
   - Hook up Save & Analyze to navigate to `/admin/studio/analysis?starter=on` with current `templateId`.
2. `src/workflow/workflowStore.ts` and `src/lib/state/workflowStore.ts`
   - Verify getters/setters for template content and autosave slice; add minimal fields if needed (no DB).

### Files NOT to edit
- Any Admin/Recipe Book files.
- Gallery components other than passing through selected state.

### Acceptance criteria
- When arriving with `starter=on`, the script editor is prefilled and `starterEnabled=true`.
- Draft autosaves on each edit without blocking UI.
- Save & Analyze navigates to Analysis view with `starter=on` and the current `templateId`.
- No layout shifts or new atoms.

### Test IDs
- Prefill confirmation: `data-testid="script-prefill"`
- Autosave indicator (existing): ensure visible briefly on edit.
- Save & Analyze button: `data-testid="save-and-analyze"`


