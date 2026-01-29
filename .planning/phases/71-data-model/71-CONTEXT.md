# Phase 71: Data Model & Schema - Context

**Phase**: 71 - Data Model & Schema
**Milestone**: v1.1 - Workflow 1 (Viral Content Creator)
**Captured**: 2026-01-19

---

## Vision Summary

Build the Supabase data model to support a 6-phase content creation workflow with full persistence, TikTok API integration, and connection to the existing prediction pipeline.

---

## Key Decisions

### Core Priorities
- **Resume anywhere**: User can close browser, return later, pick up exactly where they left off
- **Full history**: Every workflow run saved with all artifacts for review
- **Prediction integration**: Optimize phase connects to existing Pack 1/2/3/V pipeline

### Navigation & Gates
- **Phase navigation**: Back allowed (can edit earlier phases, cannot skip ahead)
- **Gate A Checks**: Soft gates (show warnings if checks fail, but user can still proceed)

### Data Relationships
- **Exemplar Swoop**: Both - save exemplars to a global library AND link to current workflow
- **4×4 Method flow**: Connected - Plan phase pre-fills Create, Optimize scores each section (Hook/Proof/Value/CTA)
- **DPS Score updates**: Live updates as content changes, but show 0 until actual content exists in Create phase

### Workflow Management
- **Multi-workflow**: Limited parallel - cap at 3-5 active workflows to prevent overwhelm
- **Video storage**: Temporary only - videos are for prediction, not permanently stored

### TikTok Integration
- **Publishing**: Scheduled draft - create draft on TikTok via API, user publishes from TikTok app
- **Performance metrics**: API integration - automatically pull views, engagement, watch time, shares from TikTok
- **Video Recording**: Support both in-browser recording (webcam/screen) AND file upload

### Engage & Learn Phase
- **Improvement insights**: Performance analysis - new AI analysis comparing predicted vs actual performance (not just resurfacing Pack 2)

---

## Data Model Requirements

### Tables Needed

1. **workflow_runs** - Master record for each workflow execution
   - Track user, status, current phase, timestamps
   - Store workflow-level metadata

2. **workflow_run_steps** - Individual phase records
   - Track each phase's status, timing, input/output data
   - Support back-navigation (editing previous phases)

3. **workflow_run_artifacts** - Phase outputs
   - Research summary, content plan, video script, prediction results, publish data, engagement data
   - JSONB for flexible artifact storage

4. **exemplar_library** (NEW) - Global exemplar collection
   - Shared across workflows
   - Link table to connect exemplars to workflows

5. **tiktok_connections** (NEW or existing?) - OAuth tokens for TikTok API
   - Store access/refresh tokens per user
   - Track connection status

---

## Schema Implications from Decisions

### Back Navigation Support
- Steps must be editable after completion
- Need to track "last_edited_at" separate from "completed_at"
- Artifacts may be overwritten when phase is re-edited

### Soft Gates
- No database-level enforcement of phase order
- Application logic handles gate check warnings
- Store gate check results in step output_data

### Connected 4×4 Method
- Plan phase output_data must have structured Hook/Proof/Value/CTA fields
- Create phase can read from Plan's output_data
- Optimize phase scores each section (store in prediction artifact)

### Limited Parallel Workflows
- Need to count active workflows per user
- Application logic enforces 3-5 cap
- Consider: status='active' count check on workflow creation

### Temporary Video Storage
- Videos uploaded to temp storage during prediction
- Auto-cleanup after workflow completes or after X days
- Don't need permanent video_files table

### TikTok Scheduled Drafts
- Store TikTok draft_id when created
- Track scheduled_for datetime
- Store published video URL once user confirms publication

### Performance Analysis AI
- Store both predicted metrics (from Optimize phase) and actual metrics (from TikTok API)
- New AI component to analyze delta and generate insights
- Store insights as artifact in Engage phase

---

## UI Reference

The designs show 6 phases with specific UI elements:

1. **Research**: Niche dropdown, demographics chips, content purpose (Know/Like/Trust), goals/KPIs, Exemplar Swoop
2. **Plan**: Golden Pillars (Education/Entertainment/Inspiration/Validation), TikTok SEO, 4×4 Method
3. **Create**: Video recording/upload, title, description, duration target, proof assets
4. **Optimize**: Gate A Checks (Hook/Proof/CTA), AI Recommendations
5. **Publish**: Platform selection (TikTok connected), scheduling
6. **Engage & Learn**: Performance metrics cards, improvement recommendations

---

## Next Steps

1. Create detailed execution plan (Phase 71 PLAN.md)
2. Design final schema with all tables
3. Create Supabase migration
4. Generate TypeScript types

---

*Created from discuss-phase session on 2026-01-19*
