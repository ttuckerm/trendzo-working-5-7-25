# Roadmap

## Milestone: v1.0 - Production Readiness

**Goal**: Stabilize Pack 1/2/3/V system for production deployment with full reliability

**Status**: Complete

---

### Phase 1: Pipeline Verification
**Status**: Pending
**Description**: Verify all packs execute correctly in production-like conditions

**Deliverables**:
- [ ] All Pack tests passing (unit + integration)
- [ ] Smoke test on `/admin/upload-test` with real transcripts
- [ ] Verify `prediction_runs` completing with status='completed'
- [ ] Confirm raw_result populated for all runs

---

### Phase 2: Supabase Migration
**Status**: Pending
**Description**: Apply transcription status tracking columns to production

**Deliverables**:
- [ ] Run `20260115_transcription_status_tracking.sql` in Supabase SQL Editor
- [ ] Verify columns created: transcription_source, transcription_confidence, etc.
- [ ] Test prediction run with new columns populated

---

### Phase 3: Calibrator Validation
**Status**: Pending
**Description**: Validate silent video calibration rules work in production

**Deliverables**:
- [ ] Test with silent video (no speech detected)
- [ ] Verify confidence penalty applied (0.7x)
- [ ] Verify DPS cap applied (55 standard, 65 visual-first)
- [ ] Run eval script against production data sample

---

### Phase 4: API Response Standardization
**Status**: Pending
**Description**: Ensure all prediction endpoints return consistent Pack data

**Deliverables**:
- [ ] `/api/predict` returns qualitative_analysis with all packs
- [ ] `/api/kai/predict` returns qualitative_analysis with all packs
- [ ] Pack metadata (_meta) included for source/provider tracking
- [ ] Backward compat maintained (unified_grading, editing_suggestions fields)

---

### Phase 5: UI Polish
**Status**: Pending
**Description**: Enhance Pack display panels in admin interface

**Deliverables**:
- [ ] Pack 3 panel displaying viral mechanics with strength indicators
- [ ] Source badges showing real vs mock data
- [ ] Loading states for each pack
- [ ] Error states with retry capability

---

### Phase 6: Documentation Update
**Status**: Pending
**Description**: Update all documentation to reflect current system state

**Deliverables**:
- [ ] CLAUDE.md current sprint updated
- [ ] API documentation for pack responses
- [ ] Component registry documentation updated

---

---

## Milestone: v1.1 - Workflow 1 (Viral Content Creator)

**Goal**: Implement 6-phase Viral Content Creator workflow with full persistence, TikTok integration, and prediction pipeline connection

**Status**: In Progress

---

### Phase 71: Data Model & Schema
**Status**: Complete
**Description**: Create Supabase schema for workflow persistence

**Deliverables**:
- [x] 7 workflow tables created (workflow_runs, workflow_run_steps, workflow_run_artifacts, exemplar_library, workflow_exemplars, tiktok_drafts, workflow_performance)
- [x] RLS policies for user data isolation
- [x] Triggers for active workflow limit and auto-create steps
- [x] TypeScript types and Zod schemas
- [x] Database helper functions (22+)

---

### Phase 72: API Routes & Services
**Status**: Complete
**Description**: Build REST API endpoints for workflow operations

**Deliverables**:
- [x] Core CRUD: GET/POST /api/workflows, GET/PATCH/DELETE /api/workflows/:id
- [x] Phase navigation: POST /api/workflows/:id/advance
- [x] Step management: GET/PUT /api/workflows/:id/steps/:phase
- [x] Artifact management: GET/POST /api/workflows/:id/artifacts
- [x] Exemplar endpoints: GET/POST/DELETE /api/workflows/exemplars, /api/workflows/:id/exemplars
- [x] Optimize endpoint: POST/GET /api/workflows/:id/optimize
- [x] WorkflowService business logic layer

---

### Phase 73: Research & Plan UI
**Status**: Complete
**Description**: Build UI for Research (Phase 1) and Plan (Phase 2) workflow phases

**Deliverables**:
- [x] useWorkflow hook for state management
- [x] WorkflowStepper component (6-phase horizontal stepper)
- [x] WorkflowLayout component
- [x] /workflows list page with filtering
- [x] /workflows/:id detail page
- [x] ResearchPhase: NicheSelector, DemographicsChips, ContentPurposeSelector, GoalsKPIs
- [x] PlanPhase: GoldenPillars, TikTokSEO, FourByFourMethod
- [x] useExemplars hook and ExemplarCard component

---

### Phase 74: Create & Optimize Phases
**Status**: Complete (Pending Human Verification)
**Description**: Build UI for Create (Phase 3) and Optimize (Phase 4) workflow phases

**Deliverables**:
- [x] CreatePhase container with video upload/recording
- [x] VideoInput component (upload + webcam + screen capture)
- [x] ScriptEditor with side-by-side 4x4 Method view
- [x] ContentMetadata (title, description, duration target)
- [x] OptimizePhase with prediction integration
- [x] DPSScoreCard with section breakdown
- [x] GateAWarnings with inline editing
- [x] AIRecommendations (Pack 2 suggestions)

**Human Verification Required:**
- 74-02: VideoInput (upload, webcam, screen capture modes)
- 74-04: OptimizePhase (prediction display, re-analyze, soft gates)

---

### Phase 75: Publish & Engage Phases
**Status**: Pending
**Description**: Build UI for Publish (Phase 5) and Engage & Learn (Phase 6) workflow phases

**Deliverables**:
- [ ] PublishPhase with TikTok draft creation
- [ ] Scheduling options
- [ ] EngagePhase with performance metrics
- [ ] TikTok API integration for metrics pull
- [ ] Improvement recommendations based on actual vs predicted

---

### Phase 76: Frontend Integration & Polish
**Status**: Pending
**Description**: End-to-end integration and UI polish

**Deliverables**:
- [ ] Full workflow flow testing
- [ ] Loading states and error handling
- [ ] Mobile responsiveness
- [ ] Dark theme consistency
- [ ] Navigation edge cases

---

### Phase 77: Validation & Acceptance
**Status**: Pending
**Description**: User acceptance testing and final validation

**Deliverables**:
- [ ] Complete workflow walkthrough
- [ ] Prediction accuracy validation
- [ ] TikTok integration testing
- [ ] Performance optimization
- [ ] Documentation update

---

### Phase 78: Wire Existing Creator Workflow to Database Persistence
**Status**: Planned (4 Plans Ready)
**Description**: Integrate existing `/admin/studio` Creator tab UI with database tables and API endpoints

**Goal**: Connect the EXISTING Creator workflow UI (not create new pages) to the database schema from Phase 71.

**Plans**:
- **78-01**: Database migration + TypeScript types + useWorkflowPersistence hook
- **78-02**: API routes for workflow CRUD and step updates
- **78-03**: Wire Creator tab state to database with auto-save + workflow picker modal
- **78-04**: Wire Optimize phase to real Pack 1/2/3/V prediction pipeline

**Deliverables**:
- [ ] Apply database migration to Supabase (7 workflow tables)
- [ ] useWorkflowPersistence hook with auto-save + save indicator
- [ ] API routes: /api/creator-workflows/* for CRUD operations
- [ ] WorkflowPicker modal for selecting/creating workflows
- [ ] Replace local React state with database-backed state
- [ ] Connect Optimize phase to runPredictionPipeline()
- [ ] Gate A warnings from real pack analysis
- [ ] Maintain existing UI/UX exactly as designed

---

*Last Updated: 2026-01-21*
