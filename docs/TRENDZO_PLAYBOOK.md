# TRENDZO PRODUCT PLAYBOOK v1.0

**Generated:** 2026-03-10
**Source:** Master Playbook System Prompt v2.0
**Status:** Product Formalization — 22-component algorithmic conversion COMPLETE

---

## PHASE 0: PRODUCT DEFINITION

### 0.1 — One-Line Description

"A system that helps TikTok creators predict how their video will perform before publishing so they can iterate with confidence and stop wasting effort on content that flops."

### 0.2 — Core Value Propositions

| Value Prop | Description | Status |
|------------|-------------|--------|
| **Predict** | Upload video or transcript → honest VPS (0-100) + confidence range within 60s | ✅ Live — 18-component pipeline, calibrated, honest scores |
| **Analyze** | Component-level breakdown: 9 attributes, 7 legos, visual rubric, hook analysis, viral mechanics | ✅ Live — Pack 1/V/3 all producing real output |
| **Recommend** | Top 3 actionable editing suggestions with estimated lift | ✅ Live — Pack 2 (Editing Coach) |
| **Generate** | Content calendar, script generation, concept pre-mortem scoring | ⚠️ Partial — concept scorer + calendar exist, not in primary workflow |
| **Track** | Predicted VPS vs actual post-publish performance over time | ⚠️ Partial — training pipeline automated, labeling works, but no creator-facing tracking UI |

### 0.3 — User Personas

- **Primary: The Aspiring Creator**
  - TikTok creator with 1K–100K followers, posting 3–7× per week
  - Wants to grow but doesn't know which videos will perform
  - Fears wasting effort on content that flops
  - Needs confidence before hitting publish — "Is this video good enough?"
  - Values specificity over encouragement — "Tell me exactly what to fix, not that I'm doing great"

- **Secondary: The Admin/Operator**
  - Project owner managing prediction accuracy and system health
  - Labels training data, monitors component status, tracks pipeline health
  - Needs dashboards showing what's working, what's broken, and data volume milestones
  - Values transparency — needs to see real metrics, not fabricated numbers

### 0.4 — Product Boundaries

**Does:**
- Score video content quality on a 0-100 VPS scale using 18 deterministic + LLM components
- Provide Pack 1 grading (9 attributes, 7 legos, hook, pacing, clarity, novelty)
- Provide Pack 2 coaching (top 3 specific improvement suggestions with estimated lift)
- Provide Pack V visual analysis (hook, pacing, pattern interrupts, clarity, style fit)
- Provide Pack 3 viral mechanics detection (structural patterns that correlate with virality)
- Accept video file uploads (FFmpeg analysis, Whisper transcription) or text-only transcripts
- Distinguish Raw VPS (content quality only) from Contextualized VPS (creator context applied)
- Track predicted vs actual performance for training data collection
- Automate training pipeline: backfill → metric collection → auto-labeling → Spearman evaluation
- Provide system health monitoring for admin

**Does NOT:**
- Guarantee virality — VPS is a quality signal, not a prophecy
- Publish or schedule videos to TikTok (no TikTok API integration)
- Provide real-time trending topic alerts (Cultural Intelligence System is future vision)
- Support platforms other than TikTok (content model is TikTok-specific)
- Auto-edit or re-cut videos based on coaching output
- Replace human creative judgment — coaching is advisory, not prescriptive
- Claim accuracy numbers without traceable Spearman evaluation evidence

### 0.5 — Page / Surface Inventory

| Page | URL Pattern | Purpose | Key APIs | Status |
|------|-------------|---------|----------|--------|
| Upload Test | `/admin/upload-test` | **PRIMARY** — upload video or paste transcript, get Raw VPS + coaching | `/api/kai/predict` | ✅ Live |
| Viral Studio | `/admin/viral-studio` | Full creator onboarding: niche → calibration → story → analysis | `/api/creator/predict`, `/api/creator/concept-score` | ✅ Live |
| Studio | `/admin/studio` | Hub with tabs: template library, armory, concept scorer | Various | ✅ Live |
| System Health | `/admin/operations/system-health` | Pack Health Dashboard: component status grid, pack cards, API keys | `/api/admin/operations/system-health` | ✅ Live |
| Training Readiness | `/admin/operations/training` | Training data management: label, reprocess, milestone tracking | `/api/training/*` | ✅ Live |
| Operations Center | `/admin/operations` | Admin hub for system monitoring | Various | ✅ Live |
| Dashboard | `/dashboard` | User-facing main dashboard | — | ❌ Shell only — no prediction integration |
| Creator Workflow | `/creator-workflow` | User-facing prediction workflow | — | ❌ Not built |

---

## PHASE 1: OBJECTIVE ARCHITECTURE

### 1.1 — Objective Tree

```
OBJ-01: Honest VPS Delivery
  KPI: VPS returned within 60s of submission, p95
  SLO: p95 latency < 60s | Error rate < 5% | Availability 99%
  Success evidence: Upload-test page shows VPS score + confidence range + component breakdown
  Anti-goals: Never inflate scores. Never show fake accuracy. Never skip calibration rules.

OBJ-02: Actionable Coaching
  KPI: ≥3 specific suggestions per prediction with estimated lift
  SLO: Pack 1 + Pack 2 return real results (not template fallback) > 90% of runs
  Success evidence: Pack 1 grading panel + Pack 2 suggestions visible on upload-test
  Anti-goals: Never give generic advice ("make it better"). Never show coaching without grading context.

OBJ-03: Performance Learning Loop
  KPI: Predicted VPS vs actual VPS correlation (Spearman ρ) measurable and improving
  SLO: Labeled videos ≥ 200 within 90 days | Auto-labeler running nightly | Spearman eval weekly
  Success evidence: vps_evaluation table with ρ values, milestone tracker on training readiness page
  Anti-goals: Never claim accuracy without evidence. Never train on contaminated data (post-pub metrics predicting post-pub metrics).

OBJ-04: System Health Visibility
  KPI: Admin can assess full system status within 30 seconds
  SLO: All 18 active components visible on health dashboard | Pack status updated from last 100 runs
  Success evidence: System Health page loads with real data, no mock/hardcoded values
  Anti-goals: Never fabricate health metrics. Never show "OK" for a component that's failing.
```

### 1.2 — Objective Canons

```
# OBJ-01 Canon — Honest VPS Delivery
KPI: VPS returned within 60s | Owner: Engineering
Key APIs: POST /api/kai/predict (Raw), POST /api/creator/predict (Contextualized)
Key UI TestIDs: [populated after Phase 2.5]
Feature Flags: FF-RawVPS (default: on), FF-ContextualizedVPS (default: on, auth-gated)
Acceptance: Creator submits video → sees VPS 0-100 with tier label and confidence range within 60s
Gold-Path Demo:
  1. Navigate to /admin/upload-test
  2. Paste a TikTok transcript (≥10 chars)
  3. Select niche "side-hustles", goal "Grow"
  4. Click "Run Prediction"
  5. Within 60s: VPS gauge shows score, tier badge appears, Pack panels populate
  6. Verify: prediction_runs row has status='completed', raw_result IS NOT NULL
```

```
# OBJ-02 Canon — Actionable Coaching
KPI: ≥3 suggestions per run | Owner: Engineering
Key APIs: POST /api/kai/predict (includes Pack 1/2 in response)
Key UI TestIDs: [populated after Phase 2.5]
Feature Flags: FF-PackCoaching (default: on)
Acceptance: Every successful prediction shows Pack 1 grading (9 attributes) + Pack 2 suggestions (≤3 items with lift)
Gold-Path Demo:
  1. Run prediction on /admin/upload-test
  2. Scroll to Pack 1 panel: 9 attribute scores (1-10 each), 7 legos, hook type, pacing, clarity, novelty
  3. Scroll to Pack 2 panel: Before/After VPS, 3 prioritized suggestions
  4. Scroll to Pack 3 panel: Viral mechanics with strength bars
  5. Scroll to Pack V panel: Visual scores (5 dimensions)
```

```
# OBJ-03 Canon — Performance Learning Loop
KPI: Spearman ρ measurable | Owner: Admin/Operator
Key APIs: POST /api/operations/training/label, GET /api/training/pipeline-status
Key UI TestIDs: [populated after Phase 2.5]
Feature Flags: FF-AutoLabeler (default: on), FF-SpearmanEval (default: on)
Acceptance: Training readiness page shows milestone tracker, auto-labeler runs nightly, Spearman eval runs weekly
Gold-Path Demo:
  1. Navigate to /admin/operations/training
  2. See milestone tracker: current labeled count vs 100/300/500 targets
  3. See automation health: last run times for backfill, collector, labeler, evaluator
  4. Click a prediction run → label it with actual performance data
  5. Verify: prediction_runs.actual_dps updated, labeling_mode set
```

```
# OBJ-04 Canon — System Health Visibility
KPI: Full status in <30s | Owner: Admin/Operator
Key APIs: GET /api/admin/operations/system-health
Key UI TestIDs: [populated after Phase 2.5]
Feature Flags: None (always on for admin)
Acceptance: System Health page shows all 18 active components, 4 pack status cards, API key indicators
Gold-Path Demo:
  1. Navigate to /admin/operations/system-health
  2. See component status grid: 18 active (green), 4 disabled (red), API key indicators
  3. See pack cards: success rate, avg latency, source distribution (real vs template)
  4. Verify: Data comes from last 100 real prediction runs, not mock
```

---

## PHASE 2: CAPABILITY MAP

### 2.1 — Capability Sheets

```
# CAP-101 — Video Prediction Pipeline
Owner surface: src/lib/prediction/runPredictionPipeline.ts
Data path:
  Video/Transcript (upload) →
  Whisper transcription (if video) →
  KaiOrchestrator (18 components, Phase 1 parallel + Phase 2 dependent) →
  Calibrator (5 rules) →
  prediction_runs + run_component_results (Supabase) →
  /api/kai/predict response →
  Upload-test UI panels
Contracts:
  APIs: POST /api/kai/predict, POST /api/creator/predict
  Events: EVT.Prediction.Started, EVT.Prediction.Completed, EVT.Prediction.Failed
  Schemas: PredictionPipelineOptions, PredictionResult
Dependencies:
  [Whisper API] → [FFmpeg binary] → [Gemini API] → [GPT-4 API] → [this] → [Upload-test UI]
SLOs: Latency p95 60s | Error rate <5% | Availability 99%
RBAC/Audit:
  /api/kai/predict: no auth required (admin testing)
  /api/creator/predict: auth required (creator must be logged in)
  Audit fields: run_id, userId (if auth), niche, mode, timing_ms
Privacy: Transcripts stored in prediction_runs.raw_result. Video files stored temporarily for FFmpeg/Whisper. No PII in transcripts by design (content analysis only).
Versioning: Pipeline version tracked via component registry. Rollback = revert code + registry.
Runbook:
  Detect: prediction_runs.status='running' for >5min, or error_rate spike on /api/kai/predict
  Fix: Check component timeouts (45s floor), check API keys (Gemini, OpenAI), check FFmpeg binary
  Verify: Run prediction on upload-test, confirm status='completed' in DB
```

```
# CAP-102 — Coaching Engine (Packs 1-3 + V)
Owner surface: src/lib/rubric-engine/
Data path:
  Transcript + component results →
  Pack V (visual, no transcript needed) →
  Pack 1 (Gemini grading: 9 attrs, 7 legos, hook, pacing, clarity, novelty) →
  Pack 2 (Gemini + rule-based: 3 suggestions with lift, depends on Pack 1) →
  Pack 3 (rule-based synthesis: viral mechanics from all signals) →
  qualitative_analysis in pipeline result →
  Upload-test UI panels
Contracts:
  APIs: Embedded in prediction pipeline response
  Schemas: UnifiedGradingResult, EditingCoachResult, ViralMechanicsResult, VisualRubricResult
Dependencies: [Gemini API] → [Pack 1] → [Pack 2, Pack 3]
SLOs: Pack 1 p95 <25s | Pack 2 p95 <25s | Pack V p95 <20s | Pack 3 p95 <1s
RBAC/Audit: Inherits from prediction pipeline
Privacy: LLM inputs are transcripts (no PII). Pack outputs stored in run_component_results.
Versioning: Pack versions tracked in _meta.provider field
Runbook:
  Detect: Pack returns template/mock instead of real results (check _meta.source)
  Fix: Verify GOOGLE_GEMINI_AI_API_KEY or GOOGLE_AI_API_KEY env var
  Verify: Run prediction, check Pack panels show "real" source badge
```

```
# CAP-103 — Training Data Pipeline
Owner surface: src/lib/training/scheduler.ts
Data path:
  prediction_runs (completed) →
  schedule-backfill (mark for metric collection) →
  metric-scheduler (Apify scrapes TikTok post-pub metrics) →
  auto-labeler (compute actual_dps from post-pub metrics) →
  spearman-evaluator (correlate predicted vs actual VPS) →
  vps_evaluation table + training readiness UI
Contracts:
  APIs: POST /api/cron/training-pipeline, GET /api/training/pipeline-status
  Events: EVT.Training.BackfillScheduled, EVT.Training.MetricsCollected, EVT.Training.Labeled, EVT.Training.Evaluated
Dependencies: [Apify API] → [Supabase] → [this] → [Training Readiness UI]
SLOs: Cron jobs complete within 5min each | Auto-labeler processes all eligible runs nightly
RBAC/Audit: Cron endpoints are admin-only. Audit: labeling_mode column tracks source.
Privacy: Post-pub metrics are public TikTok data. No PII.
Versioning: Pipeline steps versioned by scheduler.ts
Runbook:
  Detect: /api/training/pipeline-status shows stale last-run times
  Fix: Check Apify API key, check Supabase connectivity, run step manually
  Verify: Check vps_evaluation table for recent entries
```

```
# CAP-104 — System Health Monitoring
Owner surface: src/app/admin/operations/system-health/page.tsx
Data path:
  prediction_runs + run_component_results (last 100 runs) →
  /api/admin/operations/system-health (aggregation) →
  System Health page (component grid + pack cards + API key indicators)
Contracts:
  APIs: GET /api/admin/operations/system-health
Dependencies: [prediction_runs] → [run_component_results] → [this]
SLOs: Page load <3s | Data freshness: reflects last 100 runs
RBAC/Audit: Admin-only (NEXT_PUBLIC_ADMIN_EMAIL check)
Privacy: No PII — shows component IDs, success rates, latencies
Versioning: Component list from system-registry.ts
Runbook:
  Detect: Components showing as "failed" or "stub"
  Fix: Check env vars for API keys, check component timeout settings
  Verify: Run prediction, refresh health page, confirm component status updated
```

```
# CAP-105 — Creator Onboarding & Calibration
Owner surface: src/app/admin/viral-studio/page.tsx
Data path:
  Creator selects niche + goal →
  Signal Calibration (swipe 8 videos per niche) →
  CalibrationProfile computed (6 dimensions + hook taxonomy + quality discernment) →
  Saved to calibration_profiles table →
  Creator Story + Audience Diagnostic →
  Gallery → Analysis (personalized prediction via /api/creator/predict)
Contracts:
  APIs: POST /api/creator/predict, POST /api/creator/concept-score
  Schemas: CalibrationProfile, CreatorContext, CreatorStage
Dependencies: [Supabase Auth] → [calibration_profiles] → [creator-context.ts] → [prediction pipeline]
SLOs: Calibration flow completes in <3min | Profile saves successfully
RBAC/Audit: Auth required. Profile scoped to authenticated user via RLS.
Privacy: Creator story is PII-adjacent (personal narrative). Stored in calibration_profiles with RLS.
Versioning: Calibration scorer version tracked in profile metadata
Runbook:
  Detect: Profile save fails silently (check network tab)
  Fix: Verify Supabase auth, check calibration_profiles RLS policies
  Verify: Complete calibration, navigate away and back, verify profile loads
```

### 2.2 — Traceability Matrix

| Objective | Capability | Feature | User Flows | System Flows | API/Actions | Events | Tests | Flag |
|-----------|------------|---------|------------|--------------|-------------|--------|-------|------|
| OBJ-01 | CAP-101 | FEAT-001 (Video Prediction) | UF-01 | SF-01 | POST /api/kai/predict | EVT.Prediction.* | AT-OBJ01-01 | FF-RawVPS |
| OBJ-01 | CAP-101 | FEAT-002 (Contextualized Prediction) | UF-02 | SF-01 | POST /api/creator/predict | EVT.Prediction.* | AT-OBJ01-02 | FF-ContextualizedVPS |
| OBJ-02 | CAP-102 | FEAT-003 (Pack 1 Grading) | UF-01 | SF-02 | Embedded in predict | EVT.Pack.Graded | AT-OBJ02-01 | FF-PackCoaching |
| OBJ-02 | CAP-102 | FEAT-004 (Pack 2 Coaching) | UF-01 | SF-02 | Embedded in predict | EVT.Pack.Coached | AT-OBJ02-02 | FF-PackCoaching |
| OBJ-02 | CAP-102 | FEAT-005 (Pack V Visual) | UF-01 | SF-02 | Embedded in predict | EVT.Pack.VisualScored | AT-OBJ02-03 | FF-PackCoaching |
| OBJ-02 | CAP-102 | FEAT-006 (Pack 3 Mechanics) | UF-01 | SF-02 | Embedded in predict | EVT.Pack.MechanicsDetected | AT-OBJ02-04 | FF-PackCoaching |
| OBJ-03 | CAP-103 | FEAT-007 (Auto Training Pipeline) | — | SF-03 | POST /api/cron/training-pipeline | EVT.Training.* | AT-OBJ03-01 | FF-AutoLabeler |
| OBJ-03 | CAP-103 | FEAT-008 (Manual Labeling) | UF-03 | SF-04 | POST /api/operations/training/label | EVT.Training.Labeled | AT-OBJ03-02 | — |
| OBJ-04 | CAP-104 | FEAT-009 (System Health Dashboard) | UF-04 | SF-05 | GET /api/admin/operations/system-health | — | AT-OBJ04-01 | — |
| OBJ-01 | CAP-105 | FEAT-010 (Creator Onboarding) | UF-02 | SF-06 | POST /api/creator/predict | EVT.Creator.Onboarded | AT-OBJ01-03 | FF-ContextualizedVPS |

---

## PHASE 2.5: UX & DESIGN

### 2.5.1 — Emotional Journey Map

```
EMOTIONAL JOURNEY MAP — Video Prediction (Primary Workflow)

Moment 1: SUBMISSION — Creator pastes transcript or uploads video
  They feel:          Anxious uncertainty — "Is this video worth publishing?"
  We want them to feel: Cautious hope — "Let's find out together"
  Design achieves this by: Clean, focused upload area. No clutter. One clear action.
  Copy that carries this: "Drop your video or paste your script" (inviting, not clinical)
  If we fail here:    Creator thinks "this looks complicated" and leaves
  Stakes:             First impression — determines if they trust the tool

Moment 2: WAITING — Pipeline is processing (up to 60 seconds)
  They feel:          Impatience + anxiety — "Did it break? Is it working?"
  We want them to feel: Informed anticipation — "I can see it working"
  Design achieves this by: Progressive status updates showing which components are running. Not a spinner — a timeline.
  Copy that carries this: "Analyzing hook strength..." → "Scoring visual quality..." → "Generating coaching..."
  If we fail here:    Creator refreshes the page, loses the run, thinks tool is broken
  Stakes:             60 seconds is a long wait — every second without feedback erodes trust

Moment 3: SCORE REVEAL — VPS number appears
  They feel:          Dread or hope depending on score — "Is it bad news?"
  We want them to feel: Clarity — "I know exactly where I stand and what to do next"
  Design achieves this by: Score is the single dominant element. Color-coded tier. Confidence range visible but secondary. No noise.
  Copy that carries this: Tier label is honest: "Trending" (not "Almost Viral!"), "Needs Work" (not "Fail")
  If we fail here:    Creator doesn't trust the score (too high = flattery, too low = discouraging)
  Stakes:             THE moment that determines if they come back. Honesty builds trust.

Moment 4: COACHING — Pack 1/2/3/V panels load
  They feel:          "OK, now what do I do with this score?"
  We want them to feel: Empowered specificity — "I know exactly what to fix and why"
  Design achieves this by: Coaching is organized by priority. Top suggestion is the highest-leverage fix. Each suggestion is specific (not "improve your hook" but "your hook is a question-type at 6/10 clarity — try a contrarian hook with a specific claim").
  Copy that carries this: "Fix this first" (priority 1 heading), "Your hook → Their hook" (before/after framing)
  If we fail here:    Creator sees generic advice and stops reading — "just another AI tool"
  Stakes:             This is the value prop. Generic coaching = churn. Specific coaching = retention.

Moment 5: DECISION — Creator decides whether to revise or publish
  They feel:          Informed confidence — "I know what I'm working with"
  We want them to feel: Agency — "I choose to improve or publish, and either choice is informed"
  Design achieves this by: Clear re-submit path. No judgment on their decision. Score history visible for iteration.
  Copy that carries this: "Revise and re-score" (CTA) or implicit "you have the data, you decide"
  If we fail here:    Creator feels judged by a low score and disengages
  Stakes:             Retention. Creators who iterate come back. Creators who feel judged don't.
```

### 2.5.2 — UX Principles

```
UX PRINCIPLES — Trendzo Prediction Workflow

1. HONESTY OVER ENCOURAGEMENT
   Scores are calibrated to reality. A VPS of 45 means "Needs Work" — not "Great start!"
   The system earns trust by being right, not by being nice.
   Test: Show 5 predictions to a creator — they should agree the tier labels match their intuition for ≥3 of 5.

2. SPECIFICITY OVER GENERALITY
   Every coaching suggestion references a specific part of their content.
   "Your hook uses a question pattern at 6/10 clarity" — not "Improve your hook."
   Test: Every Pack 2 suggestion contains a target_field and a specific action. Zero generic sentences.

3. SCORE FIRST, COACHING SECOND
   The VPS score is the first thing the eye lands on. Coaching is below, supporting.
   Creator should absorb their score in <2 seconds before scrolling to details.
   Test: Cover the bottom 80% of the results page — the remaining 20% must convey the VPS score, tier, and confidence.

4. PROGRESSIVE DISCLOSURE
   Don't overwhelm. Score → tier → coaching → detailed breakdown → raw component data.
   Each level is opt-in. Most creators stop at coaching. Power users explore deeper.
   Test: A first-time user can understand their result without scrolling past the coaching panels.

5. NO FABRICATED METRICS
   Every number shown traces to a real computation or measurement.
   No hardcoded accuracy claims. No mock data in production. No "powered by AI" without substance.
   Test: Click any metric → it traces to a specific DB query, component result, or Spearman evaluation run.
```

### 2.5.3 — Screen Inventory & State Map

```
SCREEN: /admin/upload-test (PRIMARY WORKFLOW)
Purpose: Upload video or paste transcript → get Raw VPS + coaching
Entry points: Direct navigation, admin sidebar, operations center
Exit points: Re-submit (loop), navigate to training readiness (label), system health

States:
┌─────────────────┬──────────────────────────┬────────────────────────────────┬──────────────────────────────────┐
│ State Name      │ Trigger                  │ Design Requirement             │ TestID                           │
├─────────────────┼──────────────────────────┼────────────────────────────────┼──────────────────────────────────┤
│ Ready           │ Initial page load        │ Upload area prominent, form    │ data-testid="UploadTest-Ready"   │
│                 │                          │ fields visible, submit enabled │                                  │
│                 │                          │ only when niche+content valid  │                                  │
├─────────────────┼──────────────────────────┼────────────────────────────────┼──────────────────────────────────┤
│ Processing      │ Submit clicked           │ Progress timeline showing      │ data-testid="UploadTest-Process" │
│                 │                          │ component stages, not spinner. │                                  │
│                 │                          │ Elapsed time visible.          │                                  │
├─────────────────┼──────────────────────────┼────────────────────────────────┼──────────────────────────────────┤
│ Results         │ Prediction returned      │ VPS gauge dominant. Tier badge.│ data-testid="UploadTest-Results" │
│                 │                          │ Pack panels below. Re-submit   │                                  │
│                 │                          │ CTA visible.                   │                                  │
├─────────────────┼──────────────────────────┼────────────────────────────────┼──────────────────────────────────┤
│ Error           │ API failure or timeout   │ Error message with retry CTA.  │ data-testid="UploadTest-Error"   │
│                 │                          │ Never blank. Show what failed. │                                  │
├─────────────────┼──────────────────────────┼────────────────────────────────┼──────────────────────────────────┤
│ History         │ Previous runs exist      │ Recent runs table below form.  │ data-testid="UploadTest-History" │
│                 │                          │ Score, niche, timestamp, link. │                                  │
└─────────────────┴──────────────────────────┴────────────────────────────────┴──────────────────────────────────┘

COMPONENT: VPSGauge
Role: Communicate the single most important number — the VPS score
Visual hierarchy rule: Largest element on results screen. Score number > tier label > confidence range.

States:
┌─────────────────┬──────────────────────────┬────────────────────────────────┬───────────────────────────────────────┐
│ State Name      │ Trigger                  │ Design Requirement             │ TestID                                │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Scoring         │ Prediction in progress   │ Animated fill or skeleton      │ data-testid="VPSGauge-Scoring"        │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Scored          │ VPS returned             │ Number + tier + color + range  │ data-testid="VPSGauge-Scored"         │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ MegaViral       │ VPS ≥ 85                 │ Purple/gold accent, tier text  │ data-testid="VPSGauge-MegaViral"      │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ HyperViral      │ VPS 70-84                │ Blue accent, tier text         │ data-testid="VPSGauge-HyperViral"     │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Viral           │ VPS 55-69                │ Green accent, tier text        │ data-testid="VPSGauge-Viral"          │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Trending        │ VPS 40-54                │ Yellow accent, tier text       │ data-testid="VPSGauge-Trending"       │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ NeedsWork       │ VPS < 40                 │ Red accent, tier text          │ data-testid="VPSGauge-NeedsWork"      │
└─────────────────┴──────────────────────────┴────────────────────────────────┴───────────────────────────────────────┘

COMPONENT: PackPanel (×4: Pack1, Pack2, Pack3, PackV)
Role: Show coaching output organized by pack
Visual hierarchy rule: Pack title > key metric > detailed breakdown

States:
┌─────────────────┬──────────────────────────┬────────────────────────────────┬───────────────────────────────────────┐
│ State Name      │ Trigger                  │ Design Requirement             │ TestID                                │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Loading         │ Prediction in progress   │ Skeleton cards, not spinner    │ data-testid="Pack{N}-Loading"         │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Real            │ Pack returned real data   │ Full panel with "real" badge   │ data-testid="Pack{N}-Real"            │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Fallback        │ Pack fell back to rules   │ Panel with "template" badge    │ data-testid="Pack{N}-Fallback"        │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Unavailable     │ Pack failed entirely     │ "Unavailable" message, reason  │ data-testid="Pack{N}-Unavailable"     │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ TextOnly        │ No video file provided   │ Visual panels hidden/guidance  │ data-testid="Pack{N}-TextOnly"        │
└─────────────────┴──────────────────────────┴────────────────────────────────┴───────────────────────────────────────┘

SCREEN: /admin/operations/system-health
Purpose: Admin views component and pack health at a glance
Entry points: Operations center, admin sidebar
Exit points: Individual component drill-down (future), training readiness

States:
┌─────────────────┬──────────────────────────┬────────────────────────────────┬───────────────────────────────────────┐
│ State Name      │ Trigger                  │ Design Requirement             │ TestID                                │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Loading         │ Initial page load        │ Skeleton grid                  │ data-testid="SysHealth-Loading"       │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Populated       │ Data returned            │ Component grid + pack cards    │ data-testid="SysHealth-Populated"     │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ NoData          │ No prediction runs exist │ "No prediction data yet" msg   │ data-testid="SysHealth-NoData"        │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Error           │ API failure              │ Error with retry CTA           │ data-testid="SysHealth-Error"         │
└─────────────────┴──────────────────────────┴────────────────────────────────┴───────────────────────────────────────┘

SCREEN: /admin/operations/training
Purpose: Admin manages training data pipeline and monitors readiness milestones
Entry points: Operations center, system health page
Exit points: Labeling drawer, system health

States:
┌─────────────────┬──────────────────────────┬────────────────────────────────┬───────────────────────────────────────┐
│ State Name      │ Trigger                  │ Design Requirement             │ TestID                                │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Loading         │ Initial page load        │ Skeleton cards + table         │ data-testid="Training-Loading"        │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Populated       │ Data returned            │ Summary cards + not-ready table│ data-testid="Training-Populated"      │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ LabelDrawer     │ Label button clicked     │ Slide-out with actual perf     │ data-testid="Training-LabelDrawer"    │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Error           │ API failure              │ Error with retry CTA           │ data-testid="Training-Error"          │
└─────────────────┴──────────────────────────┴────────────────────────────────┴───────────────────────────────────────┘

SCREEN: /admin/viral-studio (Creator Onboarding)
Purpose: Full creator onboarding flow — niche → calibration → story → analysis
Entry points: Studio page, direct navigation
Exit points: Gallery (template browsing), analysis (prediction), content calendar

States:
┌─────────────────┬──────────────────────────┬────────────────────────────────┬───────────────────────────────────────┐
│ State Name      │ Trigger                  │ Design Requirement             │ TestID                                │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Entry           │ Initial load             │ Choose path: templates vs      │ data-testid="Studio-Entry"            │
│                 │                          │ from-scratch                   │                                       │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Onboarding      │ Path selected            │ Niche + goal selection         │ data-testid="Studio-Onboarding"       │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Calibration     │ Niche selected           │ TikTok-style swipe UI (8 vids)│ data-testid="Studio-Calibration"      │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Profile         │ Calibration complete     │ Inferred profile with editable │ data-testid="Studio-Profile"          │
│                 │                          │ cards, "THIS LOOKS RIGHT" CTA  │                                       │
├─────────────────┼──────────────────────────┼────────────────────────────────┼───────────────────────────────────────┤
│ Analysis        │ Profile confirmed        │ Personalized prediction result │ data-testid="Studio-Analysis"         │
└─────────────────┴──────────────────────────┴────────────────────────────────┴───────────────────────────────────────┘
```

### 2.5.4 — Copy & Label Spec

```
COPY SPEC — Trendzo Prediction Workflow

Component / State              | Copy / Label
───────────────────────────────┼──────────────────────────────────────────────
Upload Area - Ready            | "Drop your video or paste your script"
Upload Area - Drag Active      | "Drop it here"
Submit CTA - Ready             | "Score My Content"
Submit CTA - Processing        | "Scoring..."
Submit CTA - Disabled          | "Score My Content" (greyed, tooltip: "Select a niche and add content first")
VPS Gauge - MegaViral          | "Mega Viral"
VPS Gauge - HyperViral         | "Hyper Viral"
VPS Gauge - Viral              | "Viral"
VPS Gauge - Trending           | "Trending"
VPS Gauge - NeedsWork          | "Needs Work"
Confidence Range               | "VPS range: {low}–{high}"
Pack 1 Panel - Title           | "Content Grading"
Pack 2 Panel - Title           | "What to Fix"
Pack 3 Panel - Title           | "Viral Mechanics"
Pack V Panel - Title           | "Visual Analysis"
Pack Panel - Real Badge        | "Gemini" or "Rule-based" (actual source)
Pack Panel - Fallback Badge    | "Template"
Pack Panel - Unavailable       | "Unavailable — {reason}"
Pack 2 - Suggestion Header     | "Fix this first" (priority 1), "Also consider" (priority 2-3)
Pack 2 - Lift Estimate         | "+{lift} VPS estimated"
Error - Timeout                | "Analysis took too long. Try a shorter video or text-only."
Error - API Failure            | "Something went wrong. Try again."
Error - No Content             | "Paste a transcript or upload a video to get started."
Toast - Success                | "Prediction complete"
Toast - Error                  | "Prediction failed — try again"
History - Empty                | "No predictions yet. Score your first video above."
History - Row                  | "{niche} · VPS {score} · {relative_time}"
Resubmit CTA                  | "Score Again"
Raw VPS Panel Title            | "Raw VPS — Content Quality Score"
Raw VPS Explanation            | "This score measures content quality only. No creator context applied."
Aria-label - Upload            | "Upload video file or paste transcript text"
Aria-label - Submit            | "Submit content for viral potential scoring"
Aria-label - VPS Gauge         | "Viral Potential Score: {score} out of 100, tier: {tier}"

SYSTEM HEALTH COPY:
Component Grid - Active        | "Active"
Component Grid - Disabled      | "Disabled"
Component Grid - Conditional   | "Conditional — needs {api_key}"
Pack Card - Title              | "Pack {N}: {name}"
Pack Card - Success Rate       | "{rate}% success"
Pack Card - Avg Latency        | "{ms}ms avg"
API Key Indicator - Present    | "✓ Connected"
API Key Indicator - Missing    | "✗ Missing"

TRAINING READINESS COPY:
Milestone Tracker - Title      | "Training Milestones"
Milestone - 100                | "100 labeled videos — XGBoost v7 retrain"
Milestone - 300                | "300 labeled — niche-specific models"
Milestone - 500                | "500 labeled — ensemble learning"
Auto-Labeler Status            | "Last run: {relative_time}"
Spearman Eval                  | "ρ = {value} on N={count} videos ({date})"
```

### 2.5.5 — Interaction Design Spec

```
INTERACTION: Score Reveal
Trigger: Prediction API returns successfully
User intent: See their score immediately

Sequence:
1. VPS gauge fills from 0 to final score — 800ms ease-out-cubic
2. Tier badge fades in — 200ms ease-in, starts at step 1 complete
3. Confidence range text appears — 150ms fade-in, starts 100ms after step 2
4. Pack panels slide up sequentially — 300ms each, 100ms stagger, ease-out

Key timing rationale: 800ms gauge fill creates anticipation without frustration.
Sequential pack reveal prevents cognitive overload.

Reduced motion alternative:
Score, tier, range, and all pack panels appear instantly (no animation).
VPS gauge shows final state directly.

Failure state:
If score but no coaching data: show score immediately, pack panels show Loading
then transition to Unavailable if timeout. Never show partial animation.
```

```
INTERACTION: Processing Progress
Trigger: Submit button clicked
User intent: Know the system is working and see progress

Sequence:
1. Form area slides up and compresses — 300ms ease-out
2. Progress timeline appears — 200ms fade-in
3. Component stages light up as they complete — 150ms each, staggered by actual completion
4. Elapsed timer ticks every second — no animation, just number update

Key timing rationale: Real component completion drives progress bar — not fake timers.
Creator sees actual system work, building trust.

Reduced motion alternative:
Form hides instantly. Progress bar appears. Text updates show current stage.
No sliding or fading.

Failure state:
If prediction fails mid-processing: progress bar shows red at failure point.
Error message appears below with retry CTA. Progress does not disappear.
```

### 2.5.6 — Visual Hierarchy Rules

```
VISUAL HIERARCHY — Upload Test Results

1st: VPS Score Number — the single most important data point — 48px bold, tier color
2nd: Tier Badge — provides category context — 18px semibold, tier color background
3rd: Pack 2 "What to Fix" — the actionable next step — card with border-left accent
Background: Component breakdown, run metadata, history table — 14px regular, muted colors

Color semantics:
- Purple (#8B5CF6) = Mega Viral (VPS ≥ 85) — extraordinary, rare
- Blue (#3B82F6) = Hyper Viral (VPS 70-84) — excellent performance expected
- Green (#22C55E) = Viral (VPS 55-69) — solid, should spread
- Yellow (#EAB308) = Trending (VPS 40-54) — decent, room to improve
- Red (#EF4444) = Needs Work (VPS < 40) — significant issues to address
- Gray (#6B7280) = Disabled/Unavailable — component not running

Urgency progression (Pack 2 suggestions):
- Green border-left = Priority 3 (nice-to-have)
- Yellow border-left = Priority 2 (should fix)
- Red border-left = Priority 1 (fix this first)
  Triggers: priority field from Pack 2 response (1=red, 2=yellow, 3=green)
```

```
VISUAL HIERARCHY — System Health Dashboard

1st: Pack Status Cards — 4 cards across, each showing name + success rate + latest run
2nd: Component Grid — 22 items in grid, color-coded by status (active/conditional/disabled)
3rd: API Key Indicators — which keys are connected vs missing
Background: Detailed metrics, latency breakdowns, source distribution

Color semantics:
- Green (#22C55E) = Active, healthy, real data flowing
- Yellow (#EAB308) = Conditional — needs API key, may use fallback
- Red (#EF4444) = Disabled or failing
- Gray (#9CA3AF) = Not applicable or no data
```

### 2.5.7 — Design → PRD Handoff Contract

```
DESIGN HANDOFF — ALL FEATURES

Design source: AI-generated via Master Playbook v2.0
Handoff date: 2026-03-10

What Phase 3 PRDs inherit from Phase 2.5 (do not re-generate):
✅ All screen states and component states (Section 2.5.3)
✅ All TestIDs (Section 2.5.3 — naming convention enforced)
✅ All copy and labels (Section 2.5.4 — exact strings, no paraphrasing)
✅ All animation specs (Section 2.5.5)
✅ Visual hierarchy and color semantics (Section 2.5.6)
✅ Urgency thresholds and color triggers (Section 2.5.6)

What Phase 3 adds independently (not in design):
⚙️ API contracts and response shapes
⚙️ Idempotency and retry logic
⚙️ Rate limits and security enforcement
⚙️ Event emission and audit trail
⚙️ Data model and schema
⚙️ RBAC matrix and auth rules

Conflict resolution rule:
If a Cursor implementation deviates from a design spec, the design spec wins.
If a technical constraint requires deviation, write an ADR and update Phase 2.5.
Design is never silently overridden by implementation convenience.
```

---

## PHASE 3: FEATURE PRDs

### FEAT-001 — Raw Video Prediction (Upload-Test)

#### 1. Purpose & Objective
- Objective(s): OBJ-01
- Job-to-be-done: Creator submits content and receives an honest, calibrated VPS score within 60 seconds
- Non-goals: No creator context, no account size adjustment, no personalization. This is the clean room.

#### 2. User Stories & Edge Cases
- As a creator, I can paste a transcript so that I get a content quality score without uploading a video.
- As a creator, I can upload a video file so that I get visual + audio + content analysis.
- As an admin, I can select different niches so that scoring accounts for niche-specific calibration.
- Edge cases: Empty transcript (<10 chars → reject), video >100MB (→ reject with size error), API key missing (→ Pack falls back or shows "Unavailable"), timeout >60s (→ show error with retry), duplicate submission (→ create new run, no dedup), Whisper failure (→ fall back to title or show error)

#### 3. UI Contract
[INHERITS FROM PHASE 2.5]
- Screen: /admin/upload-test — states from Phase 2.5.3 (Ready, Processing, Results, Error, History)
- Components: VPSGauge (Phase 2.5.3), PackPanel×4 (Phase 2.5.3)
- TestIDs: All from Phase 2.5.3 Screen and Component tables
- Copy: All from Phase 2.5.4
- Animations: Score Reveal + Processing Progress from Phase 2.5.5
- Accessibility: aria-labels from Phase 2.5.4, tab order: upload → niche → goal → submit → results → packs

#### 4. Contracts

```
POST /api/kai/predict
Purpose: Run prediction pipeline in Raw VPS mode (no creator context)
Auth: None required (admin testing endpoint)
Security: Rate limit enforced, no PII in response

Request:
{
  transcript?: string,          // ≥10 chars if provided
  videoFilePath?: string,       // Server-side file path (after upload)
  niche: string,                // Required — from NICHE_REGISTRY
  goal?: string,                // Optional
  title?: string,
  description?: string,
  hashtags?: string[],
  mode?: "standard" | "validation"  // Default: standard
}

Response (success):
{
  success: true,
  run_id: string,               // UUID — traces to prediction_runs
  predicted_vps: number,        // 0-100 (calibrated)
  predicted_tier: string,       // From VPS_TIERS (system-registry.ts)
  confidence: number,           // 0.0-1.0
  range: [number, number],      // [low, high] confidence range
  components_used: number,      // Count of components that ran
  timing_ms: number,            // Total pipeline duration
  qualitative_analysis: {
    unified_grading: UnifiedGradingResult | null,
    editing_suggestions: EditingCoachResult | null,
    viral_mechanics: ViralMechanicsResult | null,
    visual_rubric: VisualRubricResult | null
  },
  debug?: {                     // Only in dev/admin mode
    component_results: Record<string, any>,
    calibration_applied: string[],
    pack1_error?: string,
    pack2_error?: string
  }
}

Response (error):
{
  success: false,
  error: string,
  code: "INVALID_INPUT" | "PIPELINE_ERROR" | "TIMEOUT",
  run_id?: string               // If run was created before failure
}

SLO: p95 < 60s | Error rate < 5%
```

Event: `EVT.Prediction.Completed v1`
```json
{
  "auditId": "run_id",
  "ts": "2026-03-10T12:00:00Z",
  "version": 1,
  "source": "kai-predict",
  "payload": {
    "run_id": "uuid",
    "niche": "side-hustles",
    "vps": 52,
    "tier": "Trending",
    "components_used": 18,
    "timing_ms": 45000,
    "mode": "standard",
    "has_video": true,
    "has_transcript": true
  }
}
```

#### 5. Data Model & Events

**prediction_runs** (append-only, status updates allowed)
| Field | Type | PII | Notes |
|-------|------|-----|-------|
| id | UUID PK | No | run_id |
| status | VARCHAR | No | 'running' → 'completed' / 'failed' |
| predicted_dps_7d | NUMERIC | No | VPS score (legacy column name) |
| predicted_tier_7d | VARCHAR | No | Tier label (DB constraint: legacy values via tierLabelToDbValue) |
| confidence | NUMERIC | No | 0.0-1.0 |
| niche | VARCHAR | No | Selected niche key |
| raw_result | JSONB | No | Full pipeline output (truncated if >500KB) |
| created_at | TIMESTAMPTZ | No | |
| completed_at | TIMESTAMPTZ | No | |
| transcription_source | VARCHAR | No | user_provided / whisper / fallback_title / none |
| transcription_confidence | NUMERIC | No | 0.0-1.0 |
| creator_context_active | BOOLEAN | No | false for Raw VPS |

RLS: Currently open for admin testing. Creator-facing endpoints will require auth + user_id scoping.

**run_component_results** (append-only)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID PK | |
| run_id | UUID FK | → prediction_runs |
| component_id | VARCHAR | From COMPONENT_REGISTRY |
| prediction | NUMERIC | Component's VPS contribution |
| confidence | NUMERIC | Component's confidence |
| features | JSONB | Raw component output |
| latency_ms | INTEGER | Execution time |

Events emitted: EVT.Prediction.Started, EVT.Prediction.Completed, EVT.Prediction.Failed

#### 6. Acceptance Checks
- [ ] DOM: data-testid="UploadTest-Ready" present on initial load
- [ ] DOM: data-testid="VPSGauge-Scored" appears after prediction with score value
- [ ] DOM: data-testid="Pack1-Real" or data-testid="Pack1-Fallback" present (never missing)
- [ ] API: POST /api/kai/predict returns 200 with run_id, predicted_vps, qualitative_analysis
- [ ] API: Empty transcript (<10 chars) returns 400 with code "INVALID_INPUT"
- [ ] API: Response time < 60s for transcript-only prediction (p95)
- [ ] Database: prediction_runs row has status='completed', raw_result IS NOT NULL
- [ ] Database: run_component_results has ≥15 rows for the run_id
- [ ] No creator_context_active=true on Raw VPS runs

#### 7. Permissions / RBAC & Audit
| Action | Admin | Creator (future) | Anonymous |
|--------|-------|-------------------|-----------|
| POST /api/kai/predict | ✅ | ❌ (use /api/creator/predict) | ❌ |
| View results | ✅ | Own runs only (future) | ❌ |
| View component debug | ✅ | ❌ | ❌ |

Audit fields: { run_id, niche, mode, timing_ms, status, components_used }

#### 8. Non-Functionals
- p95 latency: 60s per prediction, 3s per page load
- Error rate: <5%
- Availability: 99% (serverless, auto-scales)
- Rate limits: 10 req/min per IP (enforced server-side)
- Privacy: No PII. Transcripts are content, not personal data.

#### 9. Failure Modes & Runbook
| Symptom | Cause | Fix | Verify |
|---------|-------|-----|--------|
| Prediction stuck at "Processing" | Component timeout | Check FFmpeg binary, increase timeout floor | Run prediction, confirm <60s |
| Pack panels show "Unavailable" | Missing API key | Set GOOGLE_GEMINI_AI_API_KEY in env | Restart server, re-run prediction |
| VPS always ~53 | XGBoost returning fallback | Confirm XGBoost is in disabledComponents (already done) | Check system health dashboard |
| DB row stuck at status='running' | Pipeline crash before finally block | Check server logs, manually update row | Query prediction_runs for stuck rows |

#### 10. Rollout & Versioning
- Feature flag: FF-RawVPS (default: on)
- Kill switch: FF-RawVPS=false → pipeline still runs but returns error to UI
- Currently live for admin use. No canary needed (admin-only).
- Promotion to creator-facing: requires FEAT-002 (auth-gated /api/creator/predict)

#### 11. RACI & Approvals
- Owner: Engineering (solo developer)
- Approver (PRD): Product Owner
- Approver (release): Product Owner
- On-call: Product Owner

#### 12. ADRs & Dependencies
- Depends on: CAP-101 (Pipeline), CAP-102 (Coaching Engine)
- ADR-001: Raw VPS uses no creator context — accountSize factor always 1.0
- ADR-002: Upload-test page is admin-only, no auth required
- ADR-003: XGBoost disabled until 200+ labeled videos — does not affect VPS

#### 13. Security & Privacy Mini-Threat Model
| Threat | Surface | Mitigation |
|--------|---------|------------|
| Spoofing | /api/kai/predict | Admin-only endpoint, will require auth for creator-facing |
| Info Disclosure | Debug data in response | debug field only returned in development mode |
| Tampering | VPS score manipulation | Server-side computation only, no client-side scoring |
| DoS | High-latency predictions | Rate limiting (10 req/min), video size limit (100MB) |
| Elevation of Privilege | N/A | Single admin user, no role escalation possible |

---

### FEAT-002 — Contextualized Prediction (Creator-Facing)

#### 1. Purpose & Objective
- Objective(s): OBJ-01
- Job-to-be-done: Authenticated creator gets personalized prediction with their calibration profile, channel data, and creator context applied
- Non-goals: Not available on upload-test page. Not available without auth.

#### 2. User Stories & Edge Cases
- As an authenticated creator, I can submit content and get a VPS that accounts for my follower count, niche expertise, and delivery baseline.
- As a creator who completed onboarding, my calibration profile influences my prediction.
- Edge cases: No calibration profile (→ Raw VPS fallback), expired auth token (→ 401), missing niche in profile (→ require selection)

#### 3. UI Contract
[INHERITS FROM PHASE 2.5 — Viral Studio Analysis phase]
- Screen: /admin/viral-studio (Analysis phase) — states from Phase 2.5.3
- TestIDs: data-testid="Studio-Analysis"

#### 4. Contracts

```
POST /api/creator/predict
Purpose: Run prediction with creator context (personalized)
Auth: Required — userId from session token
Security: Auth enforced, creator_context loaded server-side (never from request body)

Request:
{
  transcript?: string,
  videoFilePath?: string,
  niche: string,
  goal?: string,
  title?: string,
  description?: string
}

Response: Same shape as /api/kai/predict + creatorContext fields
SLO: p95 < 60s | Error rate < 5%
```

#### 5. Data Model
Same as FEAT-001, with additional fields:
- `creator_context_active`: true
- `creator_stage`: VARCHAR (from creator staging calculation)

#### 6-13. [Same structure as FEAT-001 with auth-required differences]

---

### FEAT-003 through FEAT-006 — Pack Coaching (1/2/V/3)

These are embedded in the prediction pipeline response. No separate endpoints. PRD details are the Pack output structures documented in CLAUDE.md (Pack 1/2 System section). Key acceptance checks:

- [ ] Pack 1: 9 attribute_scores present (score 1-10 each), 7 idea_legos (boolean), hook.type from 10-type taxonomy
- [ ] Pack 2: ≤3 changes, each with target_field + suggestion + estimated_lift + priority
- [ ] Pack V: 5 visual dimension scores + overall_visual_score (0-100)
- [ ] Pack 3: ≤5 mechanics with strength (0-100) + evidence arrays
- [ ] All packs: _meta.source is "real" or "mock" or "template" (never missing)

---

### FEAT-007 — Automated Training Pipeline

#### 1. Purpose & Objective
- Objective(s): OBJ-03
- Job-to-be-done: System automatically collects post-publication metrics, labels training data, and evaluates prediction accuracy without manual intervention

#### 2. User Stories
- As the system, I automatically schedule metric collection for completed predictions.
- As the system, I automatically label predictions when post-pub metrics are available.
- As the system, I run weekly Spearman correlation evaluation and store results.

#### 4. Contracts

```
POST /api/cron/training-pipeline?step=all|backfill|collector|labeler|evaluator|scraper
Purpose: Execute training pipeline cron steps
Auth: Admin-only (cron authentication)

GET /api/training/pipeline-status
Purpose: Check health of all 5 cron jobs
Auth: Admin-only
Response: { backfill, collector, labeler, evaluator, scraper } with lastRun, status, nextRun
```

#### 5. Data Model
- `prediction_runs.actual_dps`: Post-publication actual VPS (ground truth)
- `prediction_runs.labeling_mode`: 'manual' | 'auto_cron' | 'auto_lenient'
- `vps_evaluation`: Spearman ρ, sample size, date, methodology
- `cohort_medians`: Niche-level baseline statistics

---

### FEAT-009 — System Health Dashboard

#### 1. Purpose & Objective
- Objective(s): OBJ-04
- Job-to-be-done: Admin sees full system status (18 components, 4 packs, API keys) in one page within 30 seconds

#### 3. UI Contract
[INHERITS FROM PHASE 2.5]
- Screen: /admin/operations/system-health — states from Phase 2.5.3
- TestIDs: data-testid="SysHealth-*"
- Copy: from Phase 2.5.4 System Health section

#### 4. Contracts

```
GET /api/admin/operations/system-health
Purpose: Aggregate component and pack health from last 100 prediction runs
Auth: Admin-only
Response: {
  components: Array<{ id, name, type, status, successRate, avgLatency, lastRun }>,
  packs: Array<{ id, name, successRate, avgLatency, sourceDistribution }>,
  apiKeys: Record<string, boolean>,
  xgboostVersion: string,
  totalRuns: number,
  lastRunAt: string
}
SLO: p95 < 3s
```

---

## PHASE 4: WORKFLOW SPECIFICATIONS

### User Flows

```
# UF-01 — Raw Video Prediction (Primary Workflow)
Purpose: Creator submits content and gets honest VPS + coaching
Objective: OBJ-01, OBJ-02
Design reference: Phase 2.5.3 — /admin/upload-test

STEP 1: Content Input
- User action: Paste transcript text (≥10 chars) OR upload video file OR paste YouTube URL
- Accepted inputs: Text (≥10 chars), video file (mp4/mov, ≤100MB), YouTube URL
- System action: Validate input, show form fields
- Success state: Submit button enabled (Phase 2.5.3 Ready state)
- Error state: Validation message below input field
- TestIDs visible: data-testid="UploadTest-Ready"
- Copy displayed: "Drop your video or paste your script"
- API called: None yet

STEP 2: Niche Selection
- User action: Select niche from dropdown (20+ options, flat list per D15)
- Accepted inputs: One niche key from NICHE_REGISTRY
- System action: Store niche selection
- Success state: Niche badge shown, submit still requires content
- Error state: None (dropdown always has valid options)
- TestIDs visible: data-testid="UploadTest-Ready"
- API called: None yet

STEP 3: Submit
- User action: Click "Score My Content"
- System action: POST /api/kai/predict with transcript/videoFilePath + niche + goal
- Success state: Transition to Processing state (Phase 2.5.3)
- Error state: Toast "Prediction failed — try again"
- TestIDs visible: data-testid="UploadTest-Process"
- Copy displayed: "Scoring..." on button, component progress timeline
- API called: POST /api/kai/predict

STEP 4: Results
- User action: Wait (up to 60s), then review score and coaching
- System action: Pipeline completes, returns VPS + Pack data
- Success state: VPS gauge + tier badge + Pack panels (Phase 2.5.3 Results)
- Error state: Error panel with retry CTA (Phase 2.5.3 Error)
- TestIDs visible: data-testid="UploadTest-Results", data-testid="VPSGauge-Scored"
- Copy displayed: VPS score, tier label, Pack panel titles
- API called: Response from step 3

STEP 5: Review Coaching (Optional)
- User action: Scroll through Pack 1 (grading), Pack 2 (suggestions), Pack V (visual), Pack 3 (mechanics)
- System action: Display coaching panels
- Success state: All Pack panels populated with real or fallback data
- Error state: Individual Pack panels show "Unavailable" with reason

STEP 6: Iterate (Optional)
- User action: Click "Score Again" to re-submit with changes
- System action: Scroll to top, clear results, ready for new input
- Success state: Back to Ready state

Acceptance Criteria:
[x] Inputs validated before submission
[x] Submit disabled until niche + content valid
[x] Loading state visible (progress timeline, not spinner)
[x] Completes within 60s
[x] No silent failures — error state always shown
[x] Results match Phase 2.5 visual hierarchy
[x] At least 3 actionable recommendations (Pack 2)
[x] run_id traceable in prediction_runs
[x] No console errors
[x] Reduced motion: animation replaced with instant state change
```

```
# UF-03 — Training Data Labeling
Purpose: Admin labels a prediction with actual post-publication performance
Objective: OBJ-03
Design reference: Phase 2.5.3 — /admin/operations/training

STEP 1: View Not-Ready Runs
- User action: Navigate to /admin/operations/training
- System action: Load summary cards + not-ready table
- Success state: Table shows runs that need labeling
- TestIDs visible: data-testid="Training-Populated"

STEP 2: Open Label Drawer
- User action: Click "Label" button on a run row
- System action: Slide-out drawer with run details
- Success state: Drawer shows predicted VPS, niche, timestamp, input for actual performance
- TestIDs visible: data-testid="Training-LabelDrawer"

STEP 3: Submit Label
- User action: Enter actual performance metrics, click save
- System action: POST /api/operations/training/label
- Success state: Drawer closes, table refetches, summary cards refetch
- Error state: Error message in drawer
```

```
# UF-04 — System Health Check
Purpose: Admin assesses system status in <30 seconds
Objective: OBJ-04
Design reference: Phase 2.5.3 — /admin/operations/system-health

STEP 1: Load Dashboard
- User action: Navigate to /admin/operations/system-health
- System action: GET /api/admin/operations/system-health
- Success state: Component grid + pack cards + API indicators
- TestIDs visible: data-testid="SysHealth-Populated"

STEP 2: Assess Status
- User action: Scan component grid for red (disabled/failing) items
- System action: None (read-only)
- Success state: All active components green, disabled components clearly marked
```

### System Flows

```
# SF-01 — Prediction Pipeline Execution
Trigger: POST /api/kai/predict or POST /api/creator/predict
Objective: OBJ-01

STEP 1: Run Creation
- Input: transcript, videoFilePath, niche, goal, mode
- Action: Create prediction_runs row with status='running'
- Output: run_id (UUID)
- Failure: DB insert fails → return 500

STEP 2: Transcription (if video)
- Input: videoFilePath
- Action: Whisper API → verbose_json response
- Retries: 1 retry with backoff
- Output: Transcript text + confidence + segments
- Failure: Fall back to title/description, mark transcription_source='fallback_title'

STEP 3: Component Orchestration
- Input: VideoInput (transcript, niche, videoFilePath, etc.)
- Action: KaiOrchestrator runs 18 components (Phase 1 parallel, Phase 2 dependent)
- Output: ComponentResult[] (18 results with prediction, confidence, features)
- Failure: Individual component failure → skip and log. Pipeline continues.

STEP 4: Calibration
- Input: Raw VPS, component results, transcription metadata
- Action: Apply 5 calibration rules (confidence penalty, silent cap, Pack V logging, conservative scaling, delivery gate)
- Output: Calibrated VPS
- Failure: Calibration error → use raw VPS

STEP 5: Finalization
- Input: All results
- Action: Update prediction_runs (status='completed', raw_result, predicted_dps_7d, etc.)
- Output: PredictionResult
- Failure: DB update in finally block — always attempts

Events emitted: EVT.Prediction.Started, EVT.Prediction.Completed (or .Failed)
```

```
# SF-03 — Training Pipeline Automation
Trigger: Cron schedule (5 jobs, see scheduler.ts)
Objective: OBJ-03

STEP 1: Backfill (01:00 UTC daily)
- Action: Mark recent prediction_runs for metric collection
- Output: Runs flagged for collection

STEP 2: Metric Collection (00:30 + 12:30 UTC daily)
- Action: Apify scrapes TikTok for post-publication metrics
- Output: Metrics attached to prediction_runs

STEP 3: Auto-Labeling (03:30 UTC daily)
- Action: Compute actual_dps from collected metrics, write to prediction_runs
- Output: Labeled runs, labeling_mode='auto_cron'

STEP 4: Spearman Evaluation (Sunday 05:00 UTC weekly)
- Action: Correlate predicted_dps_7d vs actual_dps across all labeled runs
- Output: vps_evaluation row with Spearman ρ, sample size, date

STEP 5: Niche Creator Scrape (weekly)
- Action: Discover top creators per niche for training data sourcing
- Output: niche_top_creators rows
```

### Algorithm Contract

```
# ALG-001 — VPS Prediction Engine v1.0
Inputs: Transcript (text), Video file (optional), Niche (required), Goal (optional)
Outputs: VPS (0-100), Tier (5 levels), Confidence (0-1), Range [low, high]
Determinism: Non-deterministic (LLM components). Same input may produce ±5 VPS variance.

Quality Gates:
- VPS must be 0-100 (clamped)
- Confidence must be 0.0-1.0
- Range must be [VPS-margin, VPS+margin] where margin is proportional to (1-confidence)
- Tier must match VPS_TIERS thresholds from system-registry.ts

Cost Caps:
- Gemini: ~$0.01 per prediction (2.5 Flash pricing)
- GPT-4o-mini: ~$0.002 per prediction
- Claude Haiku: ~$0.001 per prediction
- Total: ~$0.015 per prediction

Versioning: Pipeline version = hash of system-registry.ts component definitions
Changelog: docs/COMPONENT_DEEP_ANALYSIS.md fix logs

Drift Monitors:
- Metric: Average VPS across last 100 predictions
- Threshold: If avg VPS drifts >10 points from baseline → alert
- Alert: Admin notification on training readiness page

Observability: { run_id, niche, vps, confidence, timing_ms, components_used, component_results }
```

---

## PHASE 5: TECHNICAL CONTRACTS

### 5.1 — API Specifications

[Documented in Phase 3 FEAT-001 through FEAT-009 contracts above]

Key endpoints summary:

| Endpoint | Method | Auth | Purpose | SLO (p95) |
|----------|--------|------|---------|-----------|
| /api/kai/predict | POST | None (admin) | Raw VPS prediction | 60s |
| /api/creator/predict | POST | Required | Personalized prediction | 60s |
| /api/creator/concept-score | POST | Required | Pre-mortem concept scoring | 10s |
| /api/admin/operations/system-health | GET | Admin | Component health dashboard | 3s |
| /api/training/pipeline-status | GET | Admin | Training pipeline health | 2s |
| /api/cron/training-pipeline | POST | Admin/Cron | Execute training steps | 5min |
| /api/operations/training/label | POST | Admin | Label prediction with actuals | 2s |
| /api/training/readiness-summary | GET | Admin | Training readiness overview | 3s |

### 5.2 — Event Dictionary

```
# EVT.Prediction.Started v1
Purpose: Mark beginning of prediction pipeline execution
Producer: runPredictionPipeline.ts
Consumers: Logging, metrics dashboard (future)
Schema: { auditId: run_id, ts, version: 1, source: "pipeline", payload: { niche, mode, has_video, has_transcript } }

# EVT.Prediction.Completed v1
Purpose: Mark successful completion of prediction
Producer: runPredictionPipeline.ts
Consumers: Logging, training pipeline (backfill scheduler), health dashboard
Schema: { auditId: run_id, ts, version: 1, source: "pipeline", payload: { niche, vps, tier, confidence, components_used, timing_ms } }

# EVT.Prediction.Failed v1
Purpose: Mark failed prediction
Producer: runPredictionPipeline.ts
Consumers: Logging, alerting (future)
Schema: { auditId: run_id, ts, version: 1, source: "pipeline", payload: { niche, error, error_code, timing_ms } }

# EVT.Training.Labeled v1
Purpose: Mark prediction as labeled with actual performance
Producer: auto-labeler.ts or /api/operations/training/label
Consumers: Training readiness dashboard, Spearman evaluator
Schema: { auditId: run_id, ts, version: 1, source: "training", payload: { labeling_mode, actual_dps, niche } }
```

### 5.3 — RBAC Matrix

| Action | Admin | Creator (authenticated) | Anonymous |
|--------|-------|------------------------|-----------|
| POST /api/kai/predict | ✅ | ❌ | ❌ |
| POST /api/creator/predict | ✅ | ✅ (own runs) | ❌ |
| POST /api/creator/concept-score | ✅ | ✅ | ❌ |
| GET /api/admin/operations/system-health | ✅ | ❌ | ❌ |
| GET /api/training/pipeline-status | ✅ | ❌ | ❌ |
| POST /api/operations/training/label | ✅ | ❌ | ❌ |
| POST /api/cron/training-pipeline | ✅ (cron) | ❌ | ❌ |
| View /admin/* pages | ✅ | ❌ | ❌ |
| View /dashboard | ✅ | ✅ | ❌ |

---

## PHASE 6: QUALITY & VERIFICATION

### 6.1 — Test Strategy

- **Integrity tests (37):** `src/lib/prediction/__tests__/system-integrity.test.ts` — enforce D11 registry as contract, catch drift at build time. Run on every commit.
- **Pack tests (26):** `src/lib/rubric-engine/__tests__/pack-gating.test.ts` — Pack 1/2/3/V integration, gating logic, fallback behavior.
- **Contract tests:** TypeScript compilation (`npx tsc --noEmit`) enforces API response shapes.
- **E2E smokes:** Playwright tests for training readiness label + reprocess flows.
- **Trace-based checks:** Every prediction has run_id traceable through prediction_runs → run_component_results.
- **Design compliance:** Key screens checked against Phase 2.5 visual hierarchy (manual review for now).
- **Security gate:** Required before any creator-facing launch.

### 6.2 — Acceptance Tests

```
# AT-OBJ01-01 — "Creator gets honest VPS within 60 seconds"
Pre-conditions: Dev server running, Gemini API key set, FFmpeg available

Steps:
1. Navigate to /admin/upload-test → see data-testid="UploadTest-Ready"
2. Paste transcript (≥100 chars) → text area populates
3. Select niche "side-hustles" from dropdown
4. Click data-testid="SubmitBtn" → see data-testid="UploadTest-Process"
5. Wait → within 60s: data-testid="UploadTest-Results" appears
6. See data-testid="VPSGauge-Scored" with numeric VPS and tier badge

Verify:
- VPS is between 0-100
- Tier matches VPS_TIERS thresholds (e.g., VPS 52 → "Trending")
- Pack 1 panel shows 9 attribute scores
- Pack 2 panel shows ≤3 suggestions
- prediction_runs row: status='completed', raw_result IS NOT NULL
- run_component_results: ≥15 rows for this run_id
- Response time < 60s
```

```
# AT-OBJ02-01 — "Creator gets ≥3 specific coaching suggestions"
Pre-conditions: Same as AT-OBJ01-01

Steps:
1. Complete AT-OBJ01-01 steps 1-6
2. Scroll to Pack 2 panel → see data-testid="Pack2-Real" or "Pack2-Fallback"
3. Verify ≤3 suggestion cards with target_field, suggestion text, estimated_lift

Verify:
- Each suggestion references a specific content element (not generic advice)
- Lift estimates are numeric and positive
- Priority ordering: 1 (most impactful) → 3 (least)
```

```
# AT-OBJ03-01 — "Training pipeline produces Spearman evaluation"
Pre-conditions: ≥10 labeled prediction_runs exist, cron endpoint accessible

Steps:
1. POST /api/cron/training-pipeline?step=evaluator
2. Wait for response (≤5min)
3. Query vps_evaluation table

Verify:
- New vps_evaluation row created
- spearman_rho is a number between -1 and 1
- sample_size matches count of labeled runs
- created_at is today
```

```
# AT-OBJ04-01 — "Admin assesses system health in <30 seconds"
Pre-conditions: ≥1 prediction_run exists

Steps:
1. Navigate to /admin/operations/system-health → see data-testid="SysHealth-Populated"
2. Count visible component cards → expect 22 (18 active + 4 disabled)
3. See 4 pack status cards with success rates

Verify:
- Page loads in <3s
- No "mock" or hardcoded data visible
- Active components show green status
- Disabled components (feature-extraction, virality-matrix, niche-keywords, xgboost-virality-ml) show red/gray
- API key indicators match actual env vars
```

### 6.3 — Feature Verification Checklist

```
FEATURE VERIFICATION — FEAT-001 Raw Video Prediction
======================================
Date: 2026-03-10
Feature: FEAT-001
Environment: development

DESIGN COMPLIANCE
[ ] PASS/FAIL — Upload-test page matches Phase 2.5 emotional intent (Moment 1-5)
[ ] PASS/FAIL — Visual hierarchy: VPS score is dominant element (Phase 2.5.6)
[ ] PASS/FAIL — Copy matches Phase 2.5.4 exact strings
[ ] PASS/FAIL — Score reveal animation matches Phase 2.5.5 (or reduced motion)
[ ] PASS/FAIL — All component states from Phase 2.5.3 are implemented

FUNCTIONALITY
[ ] PASS/FAIL — All Phase 2.5.3 TestIDs present in DOM
[ ] PASS/FAIL — API requests match spec (POST /api/kai/predict)
[ ] PASS/FAIL — Response contains score + confidence + range + qualitative_analysis
[ ] PASS/FAIL — Response time within SLO (p95 < 60s)
[ ] PASS/FAIL — Data persisted correctly (prediction_runs + run_component_results)
[ ] PASS/FAIL — No silent failures — error states render correctly
[ ] PASS/FAIL — No console errors

SECURITY GATE (required before creator-facing)
[ ] PASS/FAIL — 401 returned for unauthenticated /api/creator/predict
[ ] PASS/FAIL — No PII in API responses or logs
[ ] PASS/FAIL — Rate limit: exceeding 10 req/min returns 429
[ ] PASS/FAIL — Malformed POST body returns 400
[ ] PASS/FAIL — No sensitive data in client-side JavaScript

PERFORMANCE
[ ] PASS/FAIL — Page load p95 < 3s
[ ] PASS/FAIL — API p95 < 60s (10 consecutive runs)

ACCESSIBILITY
[ ] PASS/FAIL — Tab navigation through all interactive elements
[ ] PASS/FAIL — aria-labels on upload area and submit button
[ ] PASS/FAIL — Screen reader announces VPS score and tier

Evidence: [screenshots, network tab, DB query results]
Result: PASS / FAIL / CONDITIONAL
Blocking issues:
```

### 6.4 — NFR Checklist
- [x] 12-factor config (env vars for all API keys, no hardcoded secrets)
- [x] Stateless processes (serverless Next.js API routes)
- [ ] Performance budgets per view and API (p95 defined, monitoring not yet implemented)
- [ ] Golden Signals: latency/traffic/errors/saturation (partial — component latency tracked, no global dashboard)
- [x] Privacy: No PII in prediction data. Creator profiles RLS-scoped.
- [ ] Rate limits enforced server-side (not yet implemented on all endpoints)
- [x] PII masked in logs (no PII to mask — content analysis only)
- [x] RLS policies on calibration_profiles (user_id scoped)

---

## PHASE 7: ROLLOUT & OPERATIONS

### 7.1 — Priority Roadmap (Dependency-First)

```
Priority 0: Data Quality / Labeling
  ✅ DONE — Training pipeline automated (5 cron jobs)
  ✅ DONE — Auto-labeler running nightly
  🔄 IN PROGRESS — Reaching 100 labeled videos (currently ~27)
  Blocks: XGBoost v7 retrain, component efficacy evaluation, calibration redesign

Priority 1: Core Model / Algorithm Quality
  ✅ DONE — 22-component algorithmic conversion complete (all 5 layers fixed)
  ✅ DONE — XGBoost disabled (noise removed)
  ✅ DONE — Gemini inflation stripped, consensus gate fixed
  ✅ DONE — VPS floors eliminated, honest scoring
  BLOCKED — XGBoost v7 retrain (needs 200+ labeled videos)
  BLOCKED — Calibration redesign to cohort-aware baselines (needs 50+ videos across 3+ niches)

Priority 2: Primary Workflow (End-to-End Critical Path)
  ✅ DONE — /admin/upload-test with Raw VPS
  ✅ DONE — Pack 1/2/3/V coaching panels
  ⚠️ GAP — No creator-facing prediction page (/dashboard has no prediction integration)
  ⚠️ GAP — No predicted-vs-actual tracking UI for creators

Priority 3: Creator Experience
  ✅ DONE — Viral Studio onboarding (13 phases)
  ✅ DONE — Creator context integration (/api/creator/predict)
  ✅ DONE — Concept pre-mortem scoring
  ✅ DONE — Content calendar
  ⚠️ GAP — These features are admin-only, not creator-facing

Priority 4: Operations & Monitoring
  ✅ DONE — System Health Dashboard
  ✅ DONE — Training Readiness with milestone tracker
  ⚠️ GAP — No alerting system (component failures silently logged)
  ⚠️ GAP — No real-time accuracy dashboard (fabricated 73.5% replaced, nothing in its place)

Priority 5+: Edge Cases & Polish
  - Search Alignment Component (replaces niche-keywords, blocked on keyword data)
  - Cultural Intelligence System / Brief Generator (future vision)
  - Multi-platform support (beyond TikTok)
  - Real-time trending topics
```

### 7.2 — Rollout Plan

```
Feature: FEAT-001 Raw Prediction | Flag: FF-RawVPS
Phase 1 — Internal (current): Admin-only on /admin/upload-test. No auth. No rate limits.
  Success criteria: p95 < 60s, error rate < 5%, VPS distribution 15-85 (not compressed)
Phase 2 — Auth-gated creator access: Require login, rate limit 10/min, RLS on prediction data
  Promotion gates: Security gate passed, RLS policies tested, rate limiting active
Phase 3 — Public: /dashboard integration, onboarding flow, predicted-vs-actual tracking
  Gates: 100+ labeled videos, Spearman ρ > 0.3, Pack coaching quality verified

Kill Switch: FF-RawVPS=false → API returns 503 Service Unavailable
On-call: Product Owner
```

### 7.3 — Observability Pack

```
SLOs:
  - Prediction p95: < 60s (alert at > 90s)
  - Error rate: < 5% (alert at > 10%)
  - Pack 1 real source rate: > 90% (alert at < 70%)
  - Auto-labeler: runs daily (alert if >48h since last run)

Log fields: { run_id, niche, mode, timing_ms, status, components_used, vps, tier }

Traces: Component-level timing in run_component_results. run_id links all rows.

Runbooks:
  1. Prediction timeout: Check FFmpeg binary → check API keys → check component timeouts → restart server
  2. Pack shows "template": Check GOOGLE_GEMINI_AI_API_KEY → check model name → check rate limits
  3. Training pipeline stale: Check Apify API key → check cron schedule → run step manually
```

---

## PHASE 8: GOVERNANCE & SIGN-OFF

### 8.1 — ADR Log

```
# ADR-001 — Raw VPS vs Contextualized VPS Separation
Status: Accepted
Date: 2026-03-09 | Owner: Engineering
Context: Account size adjustment was contaminating content quality measurement on upload-test page
Decision: Two-tier VPS — Raw (content only, no creator context) and Contextualized (full context with auth)
Consequences: Upload-test always shows Raw VPS. Creator-facing endpoints require auth.
Alternatives: Single VPS with "ignore context" toggle — rejected (too easy to accidentally include context)
Rationale: The test page must be a clean room. Creator context is personalization, not quality measurement.

# ADR-002 — XGBoost Disabled Until Data Milestone
Status: Accepted
Date: 2026-03-10 | Owner: Engineering
Context: XGBoost v5-simplified is a hand-tuned heuristic (R²=0.0), injects noise at reliability 0.85
Decision: Disable XGBoost entirely. Remove from all paths. Set reliability to 0.0. Rebuild when N≥200 labeled videos.
Consequences: 18 active components instead of 19. Quantitative path reduced to feature-extraction (also disabled).
Alternatives: Keep running with lower reliability — rejected (noise at any weight is harmful)
Rationale: A heuristic masquerading as ML adds systematic noise. Better to remove entirely than attenuate.

# ADR-003 — Gemini as Primary LLM (Not Ensemble)
Status: Accepted
Date: 2026-03-09 | Owner: Engineering
Context: GPT-4 and Claude were duplicate transcript-only evaluators, inflating the qualitative path
Decision: Gemini is the sole VPS evaluator. GPT-4 and Claude demoted to coach lane (weight=0).
Consequences: Qualitative VPS signal comes from one source, reducing correlated noise.
Alternatives: Keep ensemble with decorrelated prompts — rejected (same transcript in, correlated opinions out)
Rationale: Ensemble value requires diversity. Three LLMs reading the same transcript are one signal, not three.

# ADR-004 — No Fabricated Accuracy Claims
Status: Accepted
Date: 2026-03-07 | Owner: Engineering
Context: System claimed 73.5% accuracy — this was a hardcoded mock value, never measured
Decision: All accuracy claims must trace to vps_evaluation table with date, sample size, methodology
Consequences: No accuracy number displayed until real Spearman evaluation produces one
Alternatives: Show "unknown" placeholder — accepted as interim state
Rationale: False accuracy claims erode trust with the creator and misinform development decisions

# ADR-005 — Content Signals Ceiling at ρ ≈ 0.55-0.65
Status: Accepted
Date: 2026-03-07 | Owner: Engineering
Context: Academic literature shows content alone explains 20-40% of engagement variance
Decision: Reframe from "predict absolute virality" to "predict within-niche relative ranking"
Consequences: VPS is "will this content quality pass the bar" not "will this get 1M views"
Alternatives: Claim higher accuracy — rejected (dishonest and structurally impossible)
Rationale: Honest framing builds trust and sets achievable engineering targets
```

### 8.2 — Risk & DR Register

| Risk | Likelihood | Impact | Mitigation | RTO | RPO |
|------|-----------|--------|------------|-----|-----|
| Gemini API outage | Medium | High — Pack 1/V stop producing real output | Fallback to template/rule-based. No VPS impact from Pack 1 (coach lane). Pack V falls back to 100% rule-based. | 0 (auto-fallback) | N/A |
| FFmpeg binary missing | Low | High — no video analysis, no audio | Docker image includes FFmpeg. Error message surfaces on upload-test. | Manual fix | N/A |
| Supabase outage | Low | Critical — no DB writes, pipeline fails | Pipeline has finally block for guaranteed status update. Serverless function retries. | Supabase SLA | Last committed run |
| Training data contamination | Medium | High — model trained on wrong signals | contamination_lock column, auto-labeler uses only post-pub metrics from Apify (public data) | Data audit | Re-label from scratch |
| VPS score inflation returns | Medium | Medium — erodes trust | 41 integrity tests catch registry drift. Calibrator rules enforce caps. No LLM floor rules. | Code fix | Revert commit |

### 8.3 — Definition of Done (All must be ✅ to ship creator-facing)

- [x] Phase 2.5 complete: Emotional Journey Map, UX Principles, State Map, Copy Spec, Interaction Specs, Handoff Contract
- [ ] Design compliance verified: all screens pass Phase 2.5 principles (manual review needed)
- [x] Objective mapping: FEAT-001→OBJ-01, FEAT-003→OBJ-02, FEAT-007→OBJ-03, FEAT-009→OBJ-04
- [x] Capability Sheets: CAP-101 through CAP-105 with data paths, SLOs, runbooks
- [x] PRDs: FEAT-001 through FEAT-009 with contracts, acceptance checks, threat models
- [x] Contracts: API specs defined, TypeScript enforces response shapes
- [ ] Security gate: 8 checks required before creator-facing launch
- [x] Tests: 37 integrity + 26 pack + TypeScript compilation
- [ ] Preview env: Not yet — admin-only dev server
- [ ] Observability: SLOs defined, alerting not yet wired
- [ ] Resilience: No chaos testing (admin-only product)
- [x] FinOps: ~$0.015 per prediction (Gemini + GPT + Claude)
- [x] Release: FF-RawVPS live, canary not needed (admin-only)
- [x] ADRs: 5 contentious decisions recorded
- [x] RACI: Solo developer, all roles

### 8.4 — Production Readiness Sign-Off

```
PRODUCTION READINESS — Trendzo Prediction Platform
Date: 2026-03-10
Verified by: Claude Code (automated) + Product Owner (pending)

[x] Phase 2.5 design intent documented (this playbook)
[x] Core API stable: /api/kai/predict producing honest VPS scores
[x] Primary workflow passes: upload-test → VPS + coaching in <60s
[ ] Security gate: NOT YET — auth, rate limits, RLS not enforced on primary endpoint
[x] No silent failures: error states render, component failures logged
[x] Events: run_id traces through prediction_runs + run_component_results
[x] Model versioned: system-registry.ts is single source of truth
[ ] Verification evidence: manual testing — no automated E2E for prediction flow

Status: READY for admin use | NOT READY for creator-facing public launch
Blocking issues:
  1. Auth + rate limiting on prediction endpoints (FEAT-002)
  2. Creator-facing dashboard (/dashboard) has no prediction integration
  3. Predicted-vs-actual tracking UI for creators (OBJ-03 creator experience)
  4. Security gate: 8 checks need to pass before public launch
  5. Alerting: component failures logged but no notifications
```

### 8.5 — Devil's Advocate Checklist

- **Does the shipped product create the emotional response defined in Phase 2.5.1?**
  Partially. Admin upload-test creates "clarity" (Moment 3) and "empowered specificity" (Moment 4). But "informed anticipation" during wait (Moment 2) is weak — progress timeline exists but is basic.

- **Can a newcomer find each capability's owner and data path in 60 seconds?**
  Yes — CLAUDE.md Key Files Reference section, system-registry.ts, and this playbook provide clear paths.

- **Do UI states reflect real system status — not optimistic UI?**
  Yes, post-audit. All mock data removed. VPS scores are honest (no floors, no inflation). Pack badges show real source. System Health shows real component status.

- **Which contract tests fail if an API changes today?**
  37 integrity tests enforce registry contract. TypeScript compilation catches response shape changes. No dedicated API contract tests yet.

- **What's the kill switch and who executes rollback at 2am?**
  FF-RawVPS=false disables the prediction endpoint. Solo developer is the only on-call. Rollback = git revert + deploy.

- **Is the Gold-Path demo green in the preview env?**
  No preview env — dev server only. Gold-path works in dev.

- **Are sensitive fields actually null in API responses?**
  No PII in prediction data by design. Debug field only in dev mode (not enforced — needs security gate).

- **Which privacy/PII rules apply?**
  Transcripts are content, not PII. Creator profiles (calibration_profiles) are RLS-scoped by user_id. No email/phone/financial data in prediction pipeline.

---

## APPENDIX: CURRENT SYSTEM ARCHITECTURE SNAPSHOT

### 18 Active Components (Post Layer 1-5 Fixes)

| # | ID | Type | Signal Source | VPS Influence |
|---|---|---|---|---|
| 1 | ffmpeg | quantitative | FFmpeg signalstats + scene filter + ffprobe | Indirect (feeds downstream) |
| 2 | whisper | quantitative | OpenAI Whisper API (verbose_json) | Indirect (transcript to 11 components) |
| 5 | gemini | qualitative | Gemini 2.5 Flash (multimodal) | Primary VPS evaluator (~35-40%) |
| 7 | 9-attributes | pattern | Via Pack 1 / Gemini | Through Pack 1 (coach lane) |
| 8 | 7-legos | pattern | Via Pack 1 / Gemini | Through Pack 1 (coach lane) |
| 9 | 24-styles | pattern | Hybrid (keyword + LLM) | Yes |
| 10 | hook-scorer | pattern | 5-channel multi-modal (text/audio/visual/pace/tone) | Yes (highest leverage) |
| 11 | pattern-extraction | pattern | 9 contextual regexes with positional weighting | Yes |
| 12 | audio-analyzer | quantitative | FFmpeg + prosodic + speaking rate + classification | Feeds Pack V/P3/training |
| 13 | visual-scene-detector | quantitative | Canonical FFmpeg analyzer (scene detection) | Feeds Pack V |
| 14 | thumbnail-analyzer | quantitative | Canonical FFmpeg analyzer (first-frame quality) | Feeds Pack V |
| 16 | virality-indicator | pattern | 6-factor algorithmic (text/visual/audio/pacing/engagement/format) | Yes (direct pass-through) |
| 4 | gpt4 | qualitative | GPT-4o-mini (transcript analysis) | No (coach lane, weight=0) |
| 6 | claude | qualitative | Claude 3 Haiku (transcript analysis) | No (coach lane, weight=0) |
| 19 | unified-grading | qualitative | Pack 1 — Gemini grading rubric | Coach lane (indirect via Pack 3) |
| 20 | editing-coach | qualitative | Pack 2 — Gemini + rules | Coach lane (coaching output only) |
| 21 | visual-rubric | qualitative | Pack V — Gemini Vision + rules (40/60 blend) | Yes |
| 22 | viral-mechanics | pattern | Pack 3 — Rule-based synthesis | Yes |

### 4 Disabled Components

| # | ID | Reason | Disabled Date |
|---|---|---|---|
| 3 | feature-extraction | 60s wasted latency, output orphaned | 2026-03-08 |
| 15 | virality-matrix | 100% regex, duplicative, mislabeled | 2026-03-09 |
| 17 | niche-keywords | Confirmed dead, duplicated by #9 + #11 | Always disabled |
| 18 | xgboost-virality-ml | 3 broken model systems, adds noise | 2026-03-10 |

### Key Files

| Purpose | File |
|---------|------|
| Pipeline entry point | `src/lib/prediction/runPredictionPipeline.ts` |
| Component registry (D11) | `src/lib/prediction/system-registry.ts` |
| Orchestrator | `src/lib/orchestration/kai-orchestrator.ts` |
| Calibrator | `src/lib/prediction/prediction-calibrator.ts` |
| Integrity tests (D12) | `src/lib/prediction/__tests__/system-integrity.test.ts` |
| Component audit | `docs/COMPONENT_DEEP_ANALYSIS.md` |
| Project operating system | `CLAUDE.md` |

---

*Trendzo Product Playbook v1.0 — Generated 2026-03-10*
*Master Playbook System Prompt v2.0 — Methodology Pack v2.1 + Product Operations Pack v1.0 + UX/Design Layer*
