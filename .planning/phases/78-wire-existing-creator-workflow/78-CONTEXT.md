# Phase 78: Wire Existing Creator Workflow to Database Persistence - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<vision>
## How This Should Work

The existing Creator tab at `/admin/studio` already has the full 6-phase UI built (Research, Plan, Create, Optimize, Publish, Engage). The UI should NOT change fundamentally — we're wiring the backend, not rebuilding the frontend.

When a user opens the Creator tab, they see a **workflow picker** — a dropdown or modal showing:
- "Start New Workflow" option
- Up to 10 most recent workflows with status (active/completed) and last edited date

Once they select or create a workflow:
- **Seamless persistence**: Everything saves automatically as they work. No save buttons. No "are you sure you want to leave?" warnings. It just works.
- **Resume anywhere**: They can close the browser, switch devices, come back days later — their workflow is exactly where they left it.
- **Workflow lifecycle**: Clear indication of which phase they're on, what's completed, what's next.

The Optimize phase MUST trigger real predictions through the Pack 1/2/3/V pipeline and display actual results — not mock data.

</vision>

<essential>
## What Must Be Nailed

1. **Never lose data** — Auto-save everything with debounce. User should never lose work even if browser crashes.

2. **Prediction integration** — Optimize phase triggers `runPredictionPipeline()` and displays real Pack 1/2/3/V results with DPS scores.

3. **Workflow lifecycle** — Clear status tracking: active vs completed. User always knows where they are and can resume.

4. **Intuitive UX** — Improve the existing flow where obvious improvements exist. Don't just wire it — make it feel polished.

</essential>

<specifics>
## Specific Ideas

- **Workflow picker on entry**: Dropdown/modal to select from recent workflows or start new
- **10 most recent workflows**: Show in picker with status and timestamp
- **Auto-save with indicator**: Small "Saving..." → "Saved" indicator somewhere visible
- **Phase completion tracking**: Visual indicator of which phases are complete
- **Back-navigation**: User can click previous phases to review/edit (existing stepper supports this)

</specifics>

<notes>
## Additional Context

**CRITICAL BACKGROUND**: Phases 72-74 previously built standalone `/workflows` pages that were WRONG. Those pages have been deleted. Phase 78 takes the correct approach: wire the EXISTING `/admin/studio` Creator tab to the database.

**What already exists:**
- Database schema (Phase 71): `workflow_runs`, `workflow_run_steps`, `workflow_run_artifacts`, `exemplar_library`, `workflow_exemplars`, `tiktok_drafts`, `workflow_performance`
- The existing Creator tab UI at `/admin/studio` with all 6 phases visually built
- Pack 1/2/3/V prediction pipeline fully working

**What needs to happen:**
- Replace local React state (`creatorData`, `creatorPhase`) with database-backed state
- API calls to persist each phase's data
- Wire Optimize phase to prediction pipeline
- Add workflow picker for entry point

</notes>

---

*Phase: 78-wire-existing-creator-workflow*
*Context gathered: 2026-01-21*
