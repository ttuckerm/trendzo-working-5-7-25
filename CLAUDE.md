# Trendzo Project Operating System

**Last Updated:** 2026-03-10
**Purpose:** Persistent project guardrails for AI-assisted development
**Audience:** Claude Code, GitHub Copilot, and future AI developers

---

## Project North Star

Trendzo is a viral video prediction platform with a **canonical prediction pipeline** architecture:

- **Single Source of Truth:** [src/lib/prediction/runPredictionPipeline.ts](src/lib/prediction/runPredictionPipeline.ts)
- **Canonical Database Tables:**
  - `prediction_runs` - Every prediction creates one immutable run record
  - `run_component_results` - Every component execution writes results here
  - `artifact_cache` - Content-based caching for transcripts and FFmpeg analysis
- **Orchestration Layer:** [src/lib/orchestration/kai-orchestrator.ts](src/lib/orchestration/kai-orchestrator.ts)
- **System Registry:** [src/lib/prediction/system-registry.ts](src/lib/prediction/system-registry.ts) — single source of truth for ALL components, packs, tiers, weights, niches, constants (D11)
- **Component System:** 20 active components (2 disabled: feature-extraction, niche-keywords) — see [docs/COMPONENT_DEEP_ANALYSIS.md](docs/COMPONENT_DEEP_ANALYSIS.md)

### Architecture Principles

1. **Canonical Pipeline First:** All predictions flow through `runPredictionPipeline()`
2. **Traceability:** Every prediction has a `run_id` that traces component execution
3. **Immutable Runs:** `prediction_runs` records are append-only (status updates allowed)
4. **Component Isolation:** Components are registered, versioned, and independently testable
5. **Artifact Caching:** Content-based hashing prevents redundant API calls (Ticket B1)

---

## Future Vision: Cultural Intelligence System (The "Brief Generator")

**Status:** Vision / R&D Phase
**Goal:** Move beyond "predicting scores" to "generating actionable briefs" based on real-time cultural events.

### Core Thesis
Virality is a function of **Content Quality** (the artifact) + **Audience Fit** (the creator) + **Cultural Timing** (the context).
Current system solves Quality + Audience. The next layer solves Timing.

### The "Dak Prescott" Layer
A system that detects cultural updrafts (news, trends, sentiment) and generates specific briefs for creators who have the "Right To Win" on that topic.

**Architecture (Planned):**
1.  **Event Classifier:** Ingests trends, classifies via "Who/What/Where/When/Why/How" schema + "Right To Win".
2.  **Brief Generator:** Combines Event + Creator Baseline + Quality Targets into a text output.
3.  **Output:** "Make a video about [Event]. Hook: [Specific Hook]. Post by [Time]."

**Note:** This does NOT replace VPS. It enhances it.
- **VPS (The Pulse):** "Is this video good?" (Quality Gate)
- **Brief (Agency OS):** "What video should I make right now?" (Opportunity Engine)

---

## Multi-Session Workflow

Per Boris Cherny (Claude Code creator), parallel Claude sessions maximize productivity.

### Local Sessions (Terminal Tabs)

Run up to 5 Claude sessions in numbered terminal tabs:

| Tab | Name | Purpose | Typical Tasks |
|-----|------|---------|---------------|
| 1 | **Main** | Active feature development | Current sprint work, new features |
| 2 | **Verify** | Testing and verification | Run tests, type checks, smoke tests |
| 3 | **Docs** | Documentation updates | CLAUDE.md, comments, README |
| 4 | **Hotfix** | Bug fixes and quick patches | Production issues, urgent fixes |
| 5 | **Explore** | Research and exploration | Code analysis, refactoring plans |

### Web Sessions (claude.ai/code)

Use web sessions for:
- Long-running tasks (check from phone later)
- Background processing while local sessions work
- Teleporting between environments

### Session Handoff

When continuing work from another session:
```
Continuing from commit [hash] on branch [branch]. Goal: [X]. Last state: [Y]
```

**Reference:** [.claude/workflows/parallel-sessions.md](.claude/workflows/parallel-sessions.md)

---

## Session Workflow (Plan Mode First)

Boris's most important tip: "A good plan is really important!"

### Starting a Session

1. **Enter Plan Mode:** Press `shift+tab` twice
2. **State your goal clearly**
3. **Review Claude's plan** - iterate until complete
4. **Switch to auto-accept edits mode**
5. **Let Claude execute** (usually 1-shots with good plan)

### When to Use Plan Mode

- New features
- Refactoring (any multi-file change)
- Bug fixes touching multiple files
- Database schema changes
- API endpoint changes

### When to Skip Plan Mode

- Single-line fixes
- Typo corrections
- Adding console.logs for debugging
- Documentation-only changes

### Plan Quality Checklist

Before approving a plan, verify:
- [ ] Files to be changed are clearly listed
- [ ] Order of operations makes sense
- [ ] No architectural violations (check Non-Negotiable Rules)
- [ ] Test strategy is included
- [ ] Rollback approach is clear

---

## Non-Negotiable Rules

### 0. Mandatory Bug Fix Protocol (NEVER SKIP)

**Every bug fix MUST follow this exact sequence. No exceptions. No shortcuts.**

#### Step 1: FULL CHAIN READ (before any edit)
- Identify every file in the affected chain (UI component → API endpoint → database/service)
- Read ALL of them. Not just the file you think has the bug.
- Example: If chat isn't saving, read: DetailPanel.tsx → page.tsx (save logic) → /api/canvas/projects/[id]/route.ts → the Supabase schema

#### Step 2: DIAGNOSE — confirm root cause with evidence
- Add diagnostic logging (console.log in browser, console.error on server) if needed
- Ask the user to reproduce and report what they see in console/network tab/server logs
- State the root cause clearly: "The insert fails because X, here is the evidence"
- Do NOT guess. Do NOT assume. If you don't know, say so and investigate further.

#### Step 3: STATE THE FIX and get confirmation before writing code
- Tell the user: "The root cause is X. I will change Y in file Z. This will fix it because..."
- Wait for the user to say proceed. Do NOT start editing on your own assumption.

#### Step 4: MAKE THE EDIT — surgical, minimal
- Change only what is necessary. Do not refactor, clean up, or "improve" surrounding code.
- Do not touch files outside the scope of the reported bug.

#### Step 5: PROVIDE EXACT TEST STEPS
- Tell the user exactly what to do: which page, which button, what to type, what to look for
- Example: "Go to /admin/canvas, click project X, type 'hello' in chat, click Send, wait for response, click Save Project, navigate to home, re-enter the project, verify the chat shows 'hello'"

#### Step 6: WAIT FOR USER CONFIRMATION
- Do NOT claim the fix works.
- Do NOT say "this should work" or "the issue is resolved."
- Say: "Please test and let me know what you see."
- The fix is NOT done until the user confirms it works.

#### Step 7: If the user says it's still broken — START OVER from Step 1
- Re-read the files (they may have changed)
- Add more logging
- Do NOT repeat the same failed approach

**CRITICAL RULES:**
- Never say "fixed" or "resolved" until the USER confirms it
- Never make edits based on guesses — always confirm root cause first
- Never ignore when the user reports the same issue again — it means the previous fix did not work
- If you already tried a fix and it didn't work, say so explicitly and try a different approach
- Track every issue the user reports in the current session — do not "forget" earlier complaints

### 1. Single Pipeline Entry Point

**DO:**
```typescript
// ✅ CORRECT: Route handlers delegate to canonical pipeline
import { runPredictionPipeline } from '@/lib/prediction/runPredictionPipeline';

export async function POST(request: Request) {
  const { videoId } = await request.json();
  const result = await runPredictionPipeline(videoId, { mode: 'standard' });
  return Response.json(result);
}
```

**DON'T:**
```typescript
// ❌ WRONG: Creating new prediction logic in routes
export async function POST(request: Request) {
  const orchestrator = new KaiOrchestrator();
  const result = await orchestrator.predict(...);  // Missing run_id, no traceability
  return Response.json(result);
}
```

**Rule:** All prediction endpoints MUST call `runPredictionPipeline()`. No direct orchestrator calls from routes.

### 2. No New "Predict" Endpoints Without Approval

Existing prediction endpoints (see Ticket A2):
- `/api/predict/route.ts` - Standard prediction
- `/api/predict/pre-content/route.ts` - Pre-content analysis
- `/api/admin/predict/route.ts` - Admin mode prediction
- `/api/admin/super-admin/quick-predict/route.ts` - Quick prediction
- `/api/bulk-download/predict/route.ts` - Bulk prediction

**Rule:** Do not create new prediction endpoints. If a new use case emerges, discuss extending existing endpoints or adding a new `mode` parameter to `runPredictionPipeline()`.

### 3. No Direct Database Writes from Routes

**DO:**
```typescript
// ✅ CORRECT: Route delegates to pipeline, pipeline writes to canonical tables
export async function POST(request: Request) {
  const { videoId } = await request.json();
  const result = await runPredictionPipeline(videoId, options);
  // Pipeline writes to prediction_runs and run_component_results internally
  return Response.json(result);
}
```

**DON'T:**
```typescript
// ❌ WRONG: Route writes to prediction tables directly
export async function POST(request: Request) {
  const supabase = getServerSupabase();
  await supabase.from('prediction_runs').insert({ ... });  // Pipeline should do this
  return Response.json({ success: true });
}
```

**Rule:** Route handlers must NOT write to `prediction_runs` or `run_component_results`. Only the canonical pipeline (`runPredictionPipeline.ts`) writes to these tables. Routes should only write to user-facing tables (e.g., `user_videos`, `user_predictions`).

### 4. Don't Write to Legacy Scattered Tables

**Deprecated Tables (DO NOT USE):**
- `component_results` - Replaced by `run_component_results` (keyed by `run_id`)
- `prediction_results` - Replaced by `prediction_runs`
- Any table not documented in the canonical schema

**Rule:** If you see code writing to deprecated tables, flag it for removal. New code MUST use the canonical tables.

---

## Safe Edit Policy

### Small Diffs, Big Trust

**Principle:** AI-assisted changes should be surgical, not sweeping.

**DO:**
- Fix specific bugs in isolation
- Add new features to existing files (1-3 files changed)
- Refactor within a single function or class
- Add tests alongside code changes

**DON'T:**
- Rename variables across 50+ files without explicit ticket
- Rewrite entire modules "for consistency"
- Change patterns across the codebase without architectural approval
- Delete code "because it looks unused" without verification

### Pre-Flight Check: Verify Before Modifying

Before making ANY change (even simple ones):

1. **Read the current state first** - Use Read tool on files you're about to modify
2. **Check if it already works** - The user may not know the feature exists
3. **Verify the problem exists** - Run the command/test that's reportedly broken
4. **Report findings before editing** - If it already works, tell the user (don't silently skip)

**Example: User says "add npm test script"**
```bash
# ✅ CORRECT: Check first
npm test  # See if it already works
# If it works, report "Script already exists at package.json:10"

# ❌ WRONG: Blindly add duplicate
# Editing package.json without checking current state
```

**Rule:** Always verify current behavior before proposing changes. The issue may be:
- Already fixed
- Different than described
- A misunderstanding of existing features

### Refactor Checklist

Before making large structural changes:

1. **Is there a ticket?** If not, create one (use `.claude/commands/ticket.md`)
2. **Is this the smallest possible change?** Can you solve it with a 10-line diff instead of 500?
3. **Can you test the change?** (see verification section below)
4. **Does it preserve existing behavior?** If not, document breaking changes

### Git Commit Strategy

- **One logical change per commit**
- **Descriptive commit messages** (what + why)
- **Tests pass before commit** (see verification section)

---

## Required Verification Steps

### 0. Pre-Change Verification (BEFORE writing code)

Before making any changes:

**For features:** Check if it already exists
```bash
# Example: Before adding test script, check package.json
npm test  # Does it already work?
```

**For bugs:** Reproduce the bug first
```bash
# Example: Before fixing "tests fail", run tests
npm test  # Does the bug actually occur?
```

**For refactors:** Profile the current behavior
```bash
# Example: Before "optimizing", measure current performance
time npm run build  # What's the baseline?
```

**Rule:** No code changes until you've verified the current state and confirmed the work is needed.

---

After ANY code change (bug fix, feature, refactor), you MUST:

### 1. TypeScript Type Check

```bash
npx tsc --noEmit
```

**Expected Output:** `No errors found`

**If errors:** Fix them before proceeding. Do not commit code with type errors.

### 2. Run Tests

Run the full test suite:

```bash
npm test
```

Or for specific test files:

```bash
npx jest src/lib/prediction/__tests__/runPredictionPipeline.test.ts
```

**Expected Output:** All tests pass (0 failures)

**If failures:** Fix the tests or update them if behavior intentionally changed.

### 3. Endpoint Smoke Test

Pick at least ONE prediction endpoint and verify it works:

**Option A: Standard Prediction**
```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"videoId": "test_video_123"}'
```

**Option B: Quick Win Mode**
```bash
curl -X POST http://localhost:3000/api/admin/super-admin/quick-predict \
  -H "Content-Type: application/json" \
  -d '{"videoId": "test_video_123"}'
```

**Expected Output:**
```json
{
  "run_id": "...",
  "predicted_dps_7d": 65.5,
  "predicted_tier_7d": "Good - Top 25%",
  "success": true
}
```
Note: `predicted_tier_7d` uses System 1 labels from `VPS_TIERS` in registry (Viral Potential / Excellent - Top 10% / Good - Top 25% / Average / Needs Work). DB write maps these to legacy constraint values via `tierLabelToDbValue()`.

**If error:** Check logs for stack trace and fix before committing.

### 4. Training Pipeline Verification

```bash
# Check training pipeline status
curl http://localhost:3000/api/training/pipeline-status

# Run a specific training pipeline step
curl "http://localhost:3000/api/cron/training-pipeline?step=all"
```

**Expected Output:** JSON with status of each cron job (backfill, collector, labeler, evaluator, scraper).

**Verify in Supabase:**
```sql
-- Check auto-labeled videos
SELECT COUNT(*), labeling_mode FROM prediction_runs
WHERE actual_dps IS NOT NULL
GROUP BY labeling_mode;

-- Check Spearman evaluation results
SELECT * FROM vps_evaluation ORDER BY created_at DESC LIMIT 5;

-- Check cohort medians
SELECT * FROM cohort_medians ORDER BY updated_at DESC LIMIT 5;
```

### 5. Pack Health Dashboard Verification

Navigate to `/admin/operations/system-health` and verify:
- Component status grid shows 22 components with correct active/conditional/disabled status
- Pack status cards show source distribution from recent runs
- API key indicators reflect actual environment state

### 6. Build Verification (Optional for CI)

```bash
npm run build
```

**Expected Output:** Build completes without errors

---

## How to Run Tests in This Repo

### Test Configuration

- **Test Runner:** Jest (v29.7.0)
- **Config File:** `jest.config.js` (if exists) or inline in `package.json`
- **Test Pattern:** `**/*.test.{ts,tsx,js,jsx}` or `**/*.spec.{ts,tsx,js,jsx}`

### Running Tests

**All tests:**
```bash
npx jest
```

**Specific test file:**
```bash
npx jest src/lib/prediction/__tests__/runPredictionPipeline.test.ts
```

**Watch mode (for development):**
```bash
npx jest --watch
```

**Coverage report:**
```bash
npx jest --coverage
```

### Test Organization

Tests should be colocated near the code they test:

```
src/lib/prediction/
  ├── runPredictionPipeline.ts
  ├── __tests__/
  │   └── runPredictionPipeline.test.ts
  └── artifact-cache.ts
      └── __tests__/
          └── artifact-cache.test.ts
```

### Writing New Tests

When adding a new feature:

1. **Create test file** in `__tests__/` directory
2. **Test happy path** (feature works as expected)
3. **Test error cases** (graceful failure)
4. **Test edge cases** (empty inputs, null values, etc.)

Example test structure:

```typescript
import { runPredictionPipeline } from '../runPredictionPipeline';

describe('runPredictionPipeline', () => {
  it('should create a prediction run and return run_id', async () => {
    const result = await runPredictionPipeline('test_video_123');
    expect(result.run_id).toBeDefined();
    expect(result.success).toBe(true);
  });

  it('should handle missing video gracefully', async () => {
    const result = await runPredictionPipeline('nonexistent_video');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

---

## Key Files Reference

### Core Pipeline
- [src/lib/prediction/runPredictionPipeline.ts](src/lib/prediction/runPredictionPipeline.ts) - Canonical entry point
- [src/lib/prediction/prediction-calibrator.ts](src/lib/prediction/prediction-calibrator.ts) - VPS calibration (Rules 1-5)
- [src/lib/prediction/concept-scorer.ts](src/lib/prediction/concept-scorer.ts) - Two-mode prediction (Quality Gate + Distribution Potential)
- [src/lib/prediction/prediction-config.ts](src/lib/prediction/prediction-config.ts) - Component input validation (`checkComponentInputs`)

### Orchestration
- [src/lib/orchestration/kai-orchestrator.ts](src/lib/orchestration/kai-orchestrator.ts) - Component orchestration, timeout calculation, component registry (types are inline, no separate types.ts)

### Foundation Layer (Batch A — Complete)
- [src/lib/services/ffmpeg-canonical-analyzer.ts](src/lib/services/ffmpeg-canonical-analyzer.ts) - **Single source of truth** for all FFmpeg video analysis (ffprobe + signalstats + scene filter)
- [src/lib/services/whisper-service.ts](src/lib/services/whisper-service.ts) - Whisper API (verbose_json, native confidence)
- [src/lib/services/transcription-pipeline.ts](src/lib/services/transcription-pipeline.ts) - 4-stage transcript resolution
- [src/lib/components/audio-analyzer.ts](src/lib/components/audio-analyzer.ts) - Audio analysis (FFmpeg + prosodic + sound classification + speaking rate)
- [src/lib/services/audio-prosodic-analyzer.ts](src/lib/services/audio-prosodic-analyzer.ts) - Prosodic measurement (ebur128 volume dynamics, YIN pitch, silence patterns)
- [src/lib/services/speaking-rate-analyzer.ts](src/lib/services/speaking-rate-analyzer.ts) - WPM variance from Whisper segments
- [src/lib/services/audio-classifier.ts](src/lib/services/audio-classifier.ts) - Music/speech classification + audio fingerprinting
- [src/lib/components/visual-scene-detector.ts](src/lib/components/visual-scene-detector.ts) - Scene detection (thin wrapper over canonical analyzer)
- [src/lib/components/thumbnail-analyzer.ts](src/lib/components/thumbnail-analyzer.ts) - First-frame visual quality (thin wrapper over canonical analyzer)
- ~~src/lib/services/training/ffmpeg-training-features.ts~~ — DEPRECATED (use canonical analyzer)
- ~~src/lib/services/ffmpeg-full-analyzer.ts~~ — DEPRECATED (use canonical analyzer)
- ~~src/lib/services/ffmpeg-service.ts~~ — DEPRECATED for analysis (still used for frame extraction)

### Prediction Endpoints (Ticket A2)
- [src/app/api/predict/route.ts](src/app/api/predict/route.ts) - Standard prediction
- [src/app/api/predict/pre-content/route.ts](src/app/api/predict/pre-content/route.ts) - Pre-content analysis
- [src/app/api/admin/predict/route.ts](src/app/api/admin/predict/route.ts) - Admin mode
- [src/app/api/admin/super-admin/quick-predict/route.ts](src/app/api/admin/super-admin/quick-predict/route.ts) - Quick prediction
- [src/app/api/bulk-download/predict/route.ts](src/app/api/bulk-download/predict/route.ts) - Bulk prediction

### Viral Studio & Calibration
- [src/app/admin/viral-studio/page.tsx](src/app/admin/viral-studio/page.tsx) - Viral Studio orchestrator (phases: Entry → Onboarding → Signal Calibration → Profile → Gallery → Analysis → Lab 1/2/3)
- [src/app/admin/studio/page.tsx](src/app/admin/studio/page.tsx) - The Studio (parent page, embeds viral-studio as `ViralWorkflowComponent`)
- [src/lib/onboarding/calibration-scorer.ts](src/lib/onboarding/calibration-scorer.ts) - Scores swipe decisions across 6 dimensions
- [src/lib/onboarding/calibration-video-pool.ts](src/lib/onboarding/calibration-video-pool.ts) - 160 calibration videos (8 per niche × 20 niches)
- [src/lib/onboarding/calibration-db.ts](src/lib/onboarding/calibration-db.ts) - Save/load calibration profiles to Supabase
- [src/app/admin/viral-studio/components/phases/SignalCalibrationPhase.tsx](src/app/admin/viral-studio/components/phases/SignalCalibrationPhase.tsx) - TikTok-style swipe UI
- [src/app/admin/viral-studio/components/phases/CalibrationProfilePhase.tsx](src/app/admin/viral-studio/components/phases/CalibrationProfilePhase.tsx) - Inferred profile with editable cards
- **DB table:** `calibration_profiles` — user_id (unique), 6 JSONB dimension scores, inferred profile fields, offer, exclusions

### System Registry & Integrity
- [src/lib/prediction/system-registry.ts](src/lib/prediction/system-registry.ts) - Single source of truth (D11): components, packs, tiers, niches, weights, constants
- [src/lib/prediction/__tests__/system-integrity.test.ts](src/lib/prediction/__tests__/system-integrity.test.ts) - 37 integrity tests (D12)

### Training Pipeline (Bucket 3)
- [src/lib/training/scheduler.ts](src/lib/training/scheduler.ts) - 5 cron jobs: backfill, metric collection, auto-labeler, Spearman eval, niche creator scrape
- [src/lib/training/auto-labeler.ts](src/lib/training/auto-labeler.ts) - Automatic labeling with hybrid mode (lenient now, strict later)
- [src/lib/training/spearman-evaluator.ts](src/lib/training/spearman-evaluator.ts) - Spearman rank correlation accuracy evaluation
- [src/lib/training/schedule-backfill.ts](src/lib/training/schedule-backfill.ts) - Schedules post-publication metric collection
- [src/app/api/cron/training-pipeline/route.ts](src/app/api/cron/training-pipeline/route.ts) - Training pipeline cron API
- [src/app/api/training/pipeline-status/route.ts](src/app/api/training/pipeline-status/route.ts) - Pipeline health status

### Creator Intelligence
- [src/lib/prediction/creator-context.ts](src/lib/prediction/creator-context.ts) — Creator context resolver
- [src/lib/patterns/pattern-extractor.ts](src/lib/patterns/pattern-extractor.ts) — Pattern extraction from videos
- [src/lib/patterns/pattern-metrics.ts](src/lib/patterns/pattern-metrics.ts) — Pattern performance aggregation
- [src/lib/onboarding/creator-stage.ts](src/lib/onboarding/creator-stage.ts) — 5-dimension creator staging
- [src/lib/content/content-calendar.ts](src/lib/content/content-calendar.ts) — AI content calendar generation
- [src/lib/prediction/concept-scorer.ts](src/lib/prediction/concept-scorer.ts) — Pre-mortem concept scoring
- [src/app/api/creator/predict/route.ts](src/app/api/creator/predict/route.ts) — Creator-facing prediction (with context)
- [src/app/api/creator/concept-score/route.ts](src/app/api/creator/concept-score/route.ts) — Concept scoring endpoint

### Onboarding & Calibration
- [src/lib/onboarding/delivery-analyzer.ts](src/lib/onboarding/delivery-analyzer.ts) — FFmpeg + Gemini delivery analysis
- [src/lib/onboarding/delivery-baseline.ts](src/lib/onboarding/delivery-baseline.ts) — Delivery baseline type and scoring (4 features)
- [src/lib/onboarding/channel-verifier.ts](src/lib/onboarding/channel-verifier.ts) — Channel verification with delivery baseline
- [src/lib/onboarding/calibration-scorer.ts](src/lib/onboarding/calibration-scorer.ts) — 6-dimension calibration + hook taxonomy + quality discernment

### Feature Extraction & ML (AUDIT: mostly broken/disconnected)
- [src/lib/services/feature-extraction/](src/lib/services/feature-extraction/) — 106-feature extraction service (DISCONNECTED — output is orphaned)
- [src/lib/services/virality-indicator/xgboost-virality-service.ts](src/lib/services/virality-indicator/xgboost-virality-service.ts) — XGBoost v6 (42 internal features, R²=0.0 on eval)
- [models/xgboost-v6-metadata.json](models/xgboost-v6-metadata.json) — XGBoost v6 metadata (27 training samples)

### Pack Health & Operations
- [src/app/admin/operations/system-health/page.tsx](src/app/admin/operations/system-health/page.tsx) - Pack Health Dashboard
- [src/app/api/admin/operations/system-health/route.ts](src/app/api/admin/operations/system-health/route.ts) - Pack health data API

### Pack V Vision
- [src/lib/rubric-engine/gemini-vision-scorer.ts](src/lib/rubric-engine/gemini-vision-scorer.ts) - Gemini Vision frame analysis for Pack V (D13)

### Documentation
- [docs/COMPONENT_RUBRIC_AUDIT.md](docs/COMPONENT_RUBRIC_AUDIT.md) - Component status and rubric needs
- [docs/Trendzo Methodology Pack v1.1.md](docs/Trendzo Methodology Pack v1.1.md) - System architecture and methodology
- [.planning/accuracy-roadmap.md](.planning/accuracy-roadmap.md) - Comprehensive plan for 80-90% accuracy (with theoretical ceiling analysis)
- [.planning/prediction-audit.md](.planning/prediction-audit.md) - Full prediction system audit (Bucket 1)
- [CLAUDE.md](CLAUDE.md) - This file (project operating system)

### Agent Playbooks
- [.claude/agents/verify-app.md](.claude/agents/verify-app.md) - Verification agent
- [.claude/agents/refactor-guardian.md](.claude/agents/refactor-guardian.md) - Refactor safety checks
- [.claude/agents/rubric-builder.md](.claude/agents/rubric-builder.md) - Rubric generation (future)

### Command Templates
- [.claude/commands/verify.md](.claude/commands/verify.md) - Verification commands
- [.claude/commands/ticket.md](.claude/commands/ticket.md) - Ticket template
- [.claude/commands/pr-checklist.md](.claude/commands/pr-checklist.md) - Pre-merge checklist

---

## Agent Usage

This repository includes specialized AI agent playbooks:

### Verify Agent
Use when you need to verify changes work:
```bash
# Future: Run via Claude Code
# For now: Manually follow .claude/agents/verify-app.md
```

### Refactor Guardian
Use before making large structural changes:
```bash
# Future: Consult before refactoring
# For now: Manually review .claude/agents/refactor-guardian.md
```

### Rubric Builder
Use when building LLM rubrics for components:
```bash
# Future: Generate rubrics
# For now: Manually review .claude/agents/rubric-builder.md
```

---

## Quick Reference Commands

```bash
# Type check
npx tsc --noEmit

# Run tests
npx jest

# Run specific test
npx jest path/to/test.test.ts

# Build
npm run build

# Dev server
npm run dev

# Lint
npm run lint
```

---

## Emergency Contacts

If you're stuck or need architectural guidance:

1. **Read the audit:** [docs/COMPONENT_RUBRIC_AUDIT.md](docs/COMPONENT_RUBRIC_AUDIT.md)
2. **Check methodology:** [docs/Trendzo Methodology Pack v1.1.md](docs/Trendzo Methodology Pack v1.1.md)
3. **Review pipeline:** [src/lib/prediction/runPredictionPipeline.ts](src/lib/prediction/runPredictionPipeline.ts)
4. **Consult refactor guardian:** [.claude/agents/refactor-guardian.md](.claude/agents/refactor-guardian.md)

---

## Changelog

- **2026-01-05:** Initial project operating system created
- **Ticket A2:** Refactored all prediction endpoints to use `runPredictionPipeline()`
- **Ticket B1:** Added artifact caching for transcripts and FFmpeg analysis
- **2026-01-05 (Pilot):** Added "Pre-Flight Check" policy - verify current state before making changes
- **Ticket R0:** Operating System Accuracy + Smoke Tests
  - Fixed Rule #3 to clarify pipeline vs routes (pipeline writes to canonical tables, routes must not)
  - Added `npm run test:smoke` for quick verification (runs only critical passing tests)
  - Updated quick verification workflow to use smoke tests
- **2026-01-08:** Boris Cherny Workflow Implementation
  - Added Multi-Session Workflow and Plan Mode sections
  - Added 5 Trendzo-specific slash commands: `/run-prediction`, `/check-pipeline`, `/commit-push-pr`, `/validate-features`, `/debug-prediction`
  - Added background-runner agent for long-running tasks
  - Added parallel-sessions workflow documentation
  - Added Claude PR Review GitHub Action (`.github/workflows/claude-pr-review.yml`)
  - Added `/pr-review` slash command
  - Added `scripts/verify-completion.ts` for post-task verification
  - Added `.mcp.json` for Supabase MCP server integration
  - Added Prettier + format scripts to package.json
- **2026-01-13:** Pack 1/2 Core Implementation
  - Created `src/lib/rubric-engine/` with Pack 1 (Unified Grading) and Pack 2 (Editing Coach)
  - Registered components 28 (unified-grading) and 29 (editing-coach) in KaiOrchestrator
  - Integrated into runPredictionPipeline.ts with extraction logic
  - Added Pack 1/2 display UI to `/admin/viral-prediction-hub`
  - Added `/api/predict` Pack 1/2 response fields
  - Discovered integration gap: `/admin/upload-test` uses different API endpoint
- **2026-01-14:** Pack 1/2 Full Integration + Codebase Mapping
  - Fixed `/api/kai/predict` to return `unified_grading` and `editing_suggestions`
  - Added Pack 1/2 display panels to `/admin/upload-test` (primary workflow page)
  - Added "Pack 1/2 not available" hints with reason detection
  - Created `.planning/codebase/` documentation: STACK.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, INTEGRATIONS.md, CONCERNS.md
- **2026-01-15:** Prediction Calibrator Implementation
  - Created `src/lib/prediction/prediction-calibrator.ts` with 3 calibration rules
  - Rule 1: Confidence penalty (0.7x) when no speech detected
  - Rule 2: Soft DPS cap for silent videos (55 standard, 65 for visual-first)
  - Rule 3: Log Pack V training features for future model retraining
  - Guardrail 1: Gate DPS cap behind "no language signal" detection
  - Guardrail 2: Style-aware visual-first classification (style priority over niche)
  - Created `scripts/eval-calibrator-silent-vs-speech.ts` evaluation script
  - Created Supabase migration for transcription status columns
- **2026-01-16:** Run Finalization Fix + Verification
  - Fixed `prediction_runs` rows stuck at `status='running'` with `raw_result=NULL`
  - Added `finally` block to `runPredictionPipeline.ts` for guaranteed DB finalization
  - Consolidated all DB updates into finally block with explicit logging
  - Added raw_result truncation (>500KB → compact summary)
  - Created `scripts/verify-run-finalization.mjs` verification script
- **2026-01-17:** v1.0 Production Readiness Milestone Complete
  - **Phase 01:** Pipeline Verification - 26/26 pack tests passing, TypeScript compilation fixed
  - **Phase 02:** Supabase Migration - Transcription status columns applied
  - **Phase 03:** Calibrator Validation - Unit tests, eval script, smoke tests approved
  - **Phase 04:** API Response Standardization - All packs return `_meta` metadata
  - **Phase 05:** UI Polish - Pack 3 panel with strength indicators, loading skeletons added
  - **Pack 3:** Viral Mechanics implementation complete - rule-based viral trigger detection
  - **Pack V:** Visual Rubric verified - frame-based visual analysis working
  - All documentation updated to reflect complete system
- **2026-01-21:** Admin Authentication System (Supabase OAuth)
  - Migrated admin auth from disabled Firebase to Supabase Google OAuth
  - Created dedicated admin login page at `/admin/login` with localStorage intent tracking
  - Created `/auth/callback-handler` for post-OAuth routing (admin vs user platform)
  - Fixed conflicting admin detection: consolidated to use `NEXT_PUBLIC_ADMIN_EMAIL` env var
  - Updated `AuthContext.tsx` isAdmin logic (lines 128-129, 144-145)
  - Added `AuthProvider` to provider chain in `providers.tsx`
  - **Admin flow:** `/admin/login` → Google OAuth → `/auth/callback` → `/auth/callback-handler` → `/admin/studio`
  - **User flow:** `/auth` → Google OAuth → `/auth/callback` → `/auth/callback-handler` → `/dashboard`
- **2026-02-11:** Training Pipeline & Readiness Fixes
  - Fixed summary cards not updating: Next.js Data Cache was caching Supabase fetch() calls
  - Applied `noStore()` + Supabase `cache: 'no-store'` fetch wrapper to readiness-summary and not-ready routes
  - Fixed table/card divergence: replaced local row deletion with server-driven refetch
  - Added "last synced" timestamp to readiness bar
  - Added consistency check (table rows vs summary gap)
  - Added Playwright E2E tests: `playwright/tests/training-readiness.spec.ts`
- **2026-02-27:** Prediction System Audit — 5 phases, 1,903 lines, 15 locked decisions (Bucket 1)
  - Full audit at `.planning/prediction-audit.md`, decisions tracked in Claude memory files
  - Key decisions: D11 (system-registry.ts), D4 (System 2 retired), D8 (fake modes removed), D15 (flat niche list)
- **2026-02-28:** Bucket 2 Code Fixes — all 15 decisions implemented
  - Created `src/lib/prediction/system-registry.ts` (D11) — single source of truth
  - Created `src/lib/prediction/__tests__/system-integrity.test.ts` (D12) — 37 tests
  - System 2 retired, fake pipeline modes removed, honest labels, flat niche dropdown
  - See `~/.claude/projects/C--Users-thoma/memory/bucket2-summary.md` for full details
- **2026-03-01:** Bucket 3 — Training Pipeline Automation
  - Auto pipeline: backfill schedules → collect metrics (Apify) → auto-label → Spearman eval
  - Migration: `20260301_training_labeling_mode.sql`
- **2026-03-01:** Pack 1/2 Fix — migrated from deprecated `@google/generative-ai` to `@google/genai` SDK
- **2026-03-02:** XGBoost Fake Features Fix (D1 prep)
  - Moved `xgboost-virality-ml` to Phase 2 (DEPENDENT_COMPONENTS) to read real component outputs
  - v6 retrain unblocked on feature pipeline side; still blocked on 100+ labeled videos
- **2026-03-02:** Prompt 4 — Calibration Profile Persistence
  - Migration: `supabase/migrations/20260302_calibration_profiles.sql`
  - New file: `src/lib/onboarding/calibration-db.ts` (save/load helpers)
  - Modified: `SignalCalibrationPhase.tsx` (passes raw CalibrationProfile scores)
  - Modified: `viral-studio/page.tsx` (saves profile to Supabase on "THIS LOOKS RIGHT")
  - Prediction pipeline NOT modified (per D6 deferral)
- **2026-03-02:** Fixed infinite re-render loop in `/admin/studio`
  - Root cause: inline callbacks passed to `useWorkflowPersistenceLocal` created new references every render
  - Fix: extracted to `useCallback` in `studio/page.tsx`
- **2026-03-02:** Prompt 5 — Gemini Vision for Pack V (D13)
  - New file: `src/lib/rubric-engine/gemini-vision-scorer.ts` — extracts 5 key frames, sends to Gemini Vision
  - Blending: 40% rule-based + 60% Gemini Vision per dimension. Graceful fallback to 100% rule-based.
  - Pack V provider tracking: `'google-ai+rule-based'` when blended, `'rule-based'` when fallback
- **2026-03-03:** Bucket 3 Complete — All 10 items implemented
  - **High Leverage (5):**
    1. Automated training pipeline — `scheduler.ts` with 5 cron jobs (backfill, metric collection/12h, auto-labeler nightly, Spearman eval weekly, niche creator scrape weekly). API: `/api/cron/training-pipeline`
    2. DynamicPercentileSystem connected — fixed to `scraped_videos` table, follower-resolver created, `dps-percentile` API route, auto-labeler computes DPS percentile, cohort medians updated weekly
    3. XGBoost fake features fixed — moved to Phase 2, pulls real component results from `input.componentResults` instead of keyword heuristics. Export script updated.
    4. Calibration profile saved to DB — migration `20260302_calibration_profiles.sql`, viral-studio saves on profile confirmation
    5. Gemini Vision for Pack V — frame extraction + Gemini 2.5 Flash analysis, 40/60 blend, graceful fallback
  - **Medium Priority (5):**
    6. Calibration video pool expanded — 160 videos (8 per niche × 20 niches), placeholder flag for future replacement
    7. Pre-scrape top creators per niche — migration `20260302_niche_top_creators.sql`, API route, scraper, weekly cron
    8. Pack Health Dashboard — `/admin/operations/system-health`, shows pack status, component grid, API key indicators
    9. Studio mega-file decomposed — `page.tsx` now ~100 lines, 10 extracted components in `studio/components/`
    10. Methodology & Ops Packs updated with Trendzo-specific verified data
  - **Additional fixes:**
    - Gemini SDK migrated from deprecated `@google/generative-ai` to `@google/genai`, model updated to `gemini-2.5-flash` (3 files)
    - DB constraint updated to System 1 tier labels
    - 2 broken API routes fixed (`viral-prediction/analyze`, `predict/pre-content`) to use System 1 labels
    - Hybrid labeling mode implemented (lenient now, strict later) with `labeling_mode` column
  - **Remaining items:** See audit-decisions.md for blocked/deferred/actionable items
- **2026-03-04:** Bucket 4 — Creator-Facing Intelligence Layer (6 Prompts)
  - **Prompt 1:** Creator Context Integration — `src/lib/prediction/creator-context.ts` with `resolveCreatorContext()`. New `/api/creator/predict` route for personalized predictions. `/api/kai/predict` kept clean (no creator context — testing pipeline integrity preserved). Migration: `creator_context_active`, `creator_stage` columns on `prediction_runs`.
  - **Prompt 2:** Pattern Library — `pattern_archetypes`, `archetype_instances`, `archetype_niche_metrics` tables. `src/lib/patterns/pattern-extractor.ts` and `pattern-metrics.ts`. Nightly extraction cron + weekly metrics aggregation. `/api/patterns/library` route.
  - **Prompt 3:** Creator Staging — `src/lib/onboarding/creator-stage.ts` with 5-dimension scoring (Niche Authority, Audience Clarity, Content Maturity, Style Definition, Technical Competency). Viral studio routes creators by stage.
  - **Prompt 4:** Quick Win Enhancement — Pattern Library integration for template ranking. Personalized script generation using creator context. `content_briefs` table with First Win detection (VPS >= 65 for new creators). Uses `/api/quick-win/analyze` (not `/api/kai/predict`).
  - **Prompt 5:** Content Calendar — `src/lib/content/content-calendar.ts`. `creator_pattern_performance` table for tracking. Calendar UI phase in viral studio. Pattern performance tracking on brief completion.
  - **Prompt 6:** Pre-Mortem Concept Scoring — `src/lib/prediction/concept-scorer.ts`. `concept_scores` table. ConceptScorerTab in studio (not on upload-test). Uses `/api/creator/concept-score`.

- **2026-03-05:** Training Pipeline V3 — Discovery Scanner + Command Center
  - Migration: `supabase/migrations/20260305_training_pipeline_v3.sql` — `discovery_scan_config` and `discovery_scan_runs` tables
  - Discovery scanner architecture for automatically finding training-worthy videos
- **2026-03-05 to 2026-03-07:** God's Eye Forensic Audit — Comprehensive 6-Phase System Diagnosis
  - **Phase 1 — Ground Truth:** 73.5% accuracy claim is fabricated (hardcoded 73.2 mock data). No real Spearman evaluation produces this number. Real baseline is UNKNOWN.
  - **Phase 2 — Contamination:** XGBoost v6 trained on 27 samples, Eval R²=0.0. Legacy model trained on post-pub metrics (views_count 73.9%). Feature extraction pipeline (106 features) feeds nothing.
  - **Phase 3 — Effective Weights:** Documented 35/25/25/15 vs. registry 15/25/45/15 vs. effective ~15/15/70/0. Gemini double-counted (~35-40% total). Historical dimension at 0%.
  - **Phase 4 — Score Dynamics:** Rule 4 compresses VPS into 35-60 range. Consensus gate includes 7 components (should be 3). Pattern boost adds up to +5 on top of path averages.
  - **Phase 5 — Training Loop:** Auto-labeler, backfill, metric collection, Spearman eval all architecturally sound. Blocked on data volume (need 100+ labeled).
  - **Phase 6 — Theoretical Ceiling:** Content-only signals max ~ρ=0.55-0.65 (literature). With platform signals ~0.70-0.75. Within-creator ranking ~0.70-0.80 (achievable goal).
  - Full audit chat: see agent transcript `f5a22e73-d70e-47ed-846d-34ec1dc73c4c`
- **2026-03-06:** Onboarding Pipeline Overhaul — Research-Validated Redesign
  - Two-mode prediction architecture (Quality Gate + Distribution Potential) in `concept-scorer.ts`
  - 10-type hook taxonomy with 5 psychological clusters in `system-registry.ts` and `calibration-scorer.ts`
  - Delivery baseline (4 prosodic features) in `delivery-analyzer.ts` and `delivery-baseline.ts`
  - Creator story/expertise, subtopic scope, audience enrichment added to calibration profiles
  - Performance-weighted swipes and quality discernment scoring
  - Delivery hard gate (Rule 5) in `prediction-calibrator.ts`
  - 5 Supabase migrations for new calibration profile columns
- **2026-03-08:** Layer 1 Foundation — Batch A Fixes Complete (14 Issues Fixed)
  - **Prompt 1:** Removed dead/broken code — Math.random() text detection (VSD-003), fake cut constant (VSD-002), 128 lines dead Whisper code from orchestrator (WSP-001)
  - **Prompt 2:** Created `src/lib/services/ffmpeg-canonical-analyzer.ts` — single source of truth for all FFmpeg analysis. 6 placeholder features (scene_changes, cuts_per_second, avg_motion, color_variance, brightness_avg, contrast_score) replaced with real FFmpeg filters. `calculateVisualScore()` rewritten from constant ~100 to multi-factor formula.
  - **Prompt 3:** Fixed 3 critical Pack V mapping bugs: VSD-001 (feature name mismatch), AUD-001 (string vs number type), AUD-002 (0-1 vs 0-100 scale). Rewired visual-scene-detector and thumbnail-analyzer as thin wrappers over canonical analyzer. Real SATAVG colorfulness.
  - **Prompt 4:** Whisper switched to `verbose_json` for native segment-level confidence. `noSpeechProbability` propagated through pipeline to calibrator. Thumbnail confidence made dynamic. Full verification: tsc clean, 274 tests pass.
  - Tracking: [docs/COMPONENT_DEEP_ANALYSIS.md](docs/COMPONENT_DEEP_ANALYSIS.md) — full audit with fix logs
- **2026-03-07:** God's Eye Audit Directive — Component Audit Framework Established
  - "God's Eye" directive prompt assessed and rewritten into 4 discrete sprints
  - Chicken-and-egg problem identified: training a model on LLM opinions creates a prompt calibration tool, not a prediction engine
  - 22-component classification completed (8 fully LLM-dependent, 2 broken/disabled, 5 partial algorithmic, 4 fully algorithmic, 3 hybrid)
  - Component-by-component audit framework established: concept → reality → algorithmic feasibility → keep/remove/fix/merge
  - Strategic reframe: "predict absolute virality" → "predict within-niche ranking" + "empirically validated coaching"
- **2026-03-08:** Layer 1 Batch B — Audio Intelligence & Pipeline Integration
  - **Prompt 1:** Created `audio-prosodic-analyzer.ts` — volume dynamics (ebur128), pitch analysis (YIN F0), silence pattern mapping
  - **Prompt 2:** Created `speaking-rate-analyzer.ts` (WPM variance from Whisper segments), `audio-classifier.ts` (music/speech classification + fingerprinting), `20260308_sound_metadata.sql` migration
  - **Prompt 3:** Full integration — enhanced audio-analyzer with prosodic/sound/speaking rate signals, wired speaking rate from Whisper through transcription pipeline → VideoInput → orchestrator, updated Pack V audio mapping (richer prosodic data), added 13 prosodic features to training export, renamed `toDPS()` → `toPrediction()` across 6 components. Layer 1 Foundation COMPLETE.
- **2026-03-09:** Layer 1+2 Runtime Verification & Fixes — 7 Issues Fixed
  - **Issue 1 (audio-analyzer timeout):** Component was timing out at 5000ms because avgLatency=3000 gave timeout=5000ms. Audio analysis (extractAudio + volumedetect + prosodic + classification + fingerprinting) needs 10-30s. Fixed: avgLatency→30000.
  - **Issue 2 (thumbnail-analyzer timeout):** Same 5000ms timeout, but canonical FFmpeg analysis takes ~5-6s (same as visual-scene-detector). Fixed: avgLatency→35000.
  - **Issue 3 (visual-scene-detector timeout):** Under I/O contention from audio-analyzer, canonical FFmpeg analysis takes 30s+. Fixed: avgLatency→40000.
  - **Issue 4 (phantom components):** 24 components shown instead of 20. Root cause: `historical` path still listed `['historical', 'niche-keywords', 'trend-timing-analyzer', 'posting-time-optimizer']` — 3 were commented out of registry but still in the path. Fixed: emptied historical path component list.
  - **Issue 5 (virality-indicator bug):** `checkComponentInputs('virality-indicator', input, ['either'])` — 'either' was treated as property key `input['either']` which is always undefined. Fixed: added 'either' handling to `prediction-config.ts`.
  - **Issue 6 (unified-grading timeout):** Gemini API call timing out at 20000ms. Fixed: avgLatency→25000.
  - **Issue 7 (systemic timeout floor):** All component timeouts used floors of 5000ms (non-qualitative) and 20000ms (qualitative), too tight for real-world I/O contention. Fixed: universal 45000ms floor, multipliers 1.5x/2.0x.
  - **Result:** All 19 active components now showing OK. 20 total (1 disabled feature-extraction). All 4 Packs working. Hook scorer 4/5 channels active (audio 52, pace 90, tone 40 — were all zero before).
  - **Lesson:** Component timeouts must account for I/O contention when multiple FFmpeg processes run in parallel. A 6-second FFmpeg pass becomes 30+ seconds under contention. Use generous floors (45s+).
- **2026-03-08:** Layer 2 Analysis — Feature & Pattern Components (4/4 Complete)
  - **Component 3 (Feature Extraction):** THREE dead systems — 106-feature service (orphaned), 152-feature unified (runs 60s, output unused), enhanced (dead Python dep). Returns `prediction: undefined` — zero VPS. Recommendation: disable in pipeline, salvage 106-feature extractors for XGBoost retraining.
  - **Component 9 (24-Styles):** Re-enabled with GPT-4o-mini (NOT hardcoded anymore). Fully LLM-dependent, viralWeights have no empirical basis, no API key fallback. 8-10 of 24 styles detectable algorithmically. D11 violation: styles hardcoded in orchestrator.
  - **Component 10 (Hook Scorer):** HIGHEST LEVERAGE component — 45% of Quality Gate weight but only 4 of 10 hook types, 1.7pt score variance (ML can't learn), no audio/visual hook signals, word-count timing instead of Whisper timestamps, LLM upgrade exists but unused. This is the #1 priority fix.
  - **Component 11 (Pattern Extraction):** 10 overly broad regexes match common English ("when", "but", "get", "like") — generic transcripts score 65-75. Overlaps with hook-scorer. Pattern library (Bucket 4) not connected. No position awareness.
  - **Cross-component issues:** CCI-003 (hook/pattern overlap), CCI-004 (Layer 1 signals not wired to Layer 2), CCI-005 (duplicate systems everywhere), CCI-006 (generic transcript inflation)
- **2026-03-09:** Raw VPS Clean Room — Upload-Test Page Purification
  - Removed auto-fill from `@textplanation` channel (useEffect + channelInfo state + blue banner from `upload-test/page.tsx`)
  - Removed Account Size dropdown from manual/auto/batch forms (UI elements + state + submit payloads)
  - Made `accountSize` optional in `/api/kai/predict` route validation (was mandatory alongside niche + goal)
  - Added early return `1.0` in `getAccountSizeAdjustment()` when no accountSize/followerCount provided
  - Replaced "Account Size Cohort Context" panel with "Raw VPS — Content Quality Score" panel
  - **Architecture decision:** Two-tier VPS: Raw VPS (upload-test, content-only) vs Contextualized VPS (premium users, onboarding + channel + model)
- **2026-03-09:** Layer 2 Batch Fixes — 4 Prompts Executed
  - **Prompt 1:** Feature Extraction (#3) disabled — moved to `disabledComponents` in orchestrator. 60s of wasted latency removed.
  - **Prompt 2:** Hook Scorer (#10) rebuilt — 5-channel multi-modal analyzer (text + audio + visual + pace + tone), 10-type hook taxonomy from system-registry, 0-100 weighted fusion, Whisper timestamps for real first-3s analysis. Phase 2 (reads audio-analyzer results). No LLM dependency.
  - **Prompt 3:** Pattern Extraction (#11) tightened — 9 contextual regexes (removed hook-opening overlap with CCI-003), positional weighting (hook/body/CTA zones), base score 30, co-occurrence bonuses, cap 85. Generic transcripts now score ~30-40 instead of 65-75.
  - **Prompt 4:** 24-Styles (#9) converted to hybrid — Tier 1 deterministic keyword+structural classifier (24 styles with keywords in system-registry), Tier 2 LLM refinement for ambiguous cases. viralWeights reset to 1.0 (no fake empirical weights). D11 compliance.
- **2026-03-10:** Layer 4 Fixes — Packs & Synthesis (3 Prompts)
  - **Prompt 1 — Virality Indicator (#16):** VPS floor of 60 eliminated. All 6 factors rebased from 50→30. Penalty conditions added (no hook -10, no CTA -5, short transcript -10, no faces+scenes -10, low brightness -5, no speech -15, no audio variety -5, too long/short -10, no engagement signals -10). Timing factor removed (always 50, no data). Weight redistributed: Text 28%, Visual 22%, Audio 17%, Pacing 17%, Engagement 16%. VPS mapping changed from `25 + (indicator * 0.70)` to direct pass-through. Duration fallback fixed (unknown → base 30, not fake optimal bonus). New VPS range: ~19-77 (was 60-95).
  - **Prompt 2 — Pack 3 (#22):** Confidence-as-VPS bug fixed. Replaced `prediction = confidence * 100` (always 80-95) with mechanic-strength formula: `avgStrength` when ≥2 mechanics detected, `min(avgStrength, 40)` when <2 mechanics. Dead component references removed from `detectTrendAlignment()` (virality-matrix, historical-analyzer, trend-timing) and `detectTimingAdvantage()` (posting-optimizer). Confidence field preserved for metadata.
  - **Prompt 3 — Pack V (#21):** Hardcoded confidence 0.8 replaced with dynamic calculation: 0.3 base + video(+0.25) + FFmpeg(+0.15) + audio(+0.10) + scene(+0.10) + thumbnail(+0.05) + hook(+0.05), capped 0.95. Transcript-only: ~0.3-0.4. Full video: ~0.85-0.95.
- **2026-03-10:** Layer 5 Analysis — Aggregation (XGBoost + Niche Keywords)
  - **Component 18 (XGBoost Virality ML):** Full 3-step deep-dive with 9 findings (XGB-001 through XGB-009). THREE model systems all broken: v6 (R²=0.0, 27 samples, text_avg_word_length=42.4%), legacy (contaminated with views_count=73.9%), v5-simplified (hand-tuned heuristic, not ML). Feature vector 50% zeros (8 disabled components) + coach-lane leakage (gpt4/claude). Python fallback silently returns 53.77. Reliability 0.85 inflates noise. Export pipeline has 13 prosodic features ready for v7. **Verdict: DISABLE immediately, rebuild when N≥200 labeled videos.**
  - **Component 17 (Niche Keywords):** Confirmed permanently dead. 4 findings (NK-001 through NK-004). Always disabled, duplicated by 24-styles + pattern-extraction, ghost reference in XGBoost feature vector. Clean up on v7 rebuild.
  - **5 new cross-component issues:** CCI-L5-001 (XGBoost noise with 0.85 reliability), CCI-L5-002 (coach-lane leakage via gpt4/claude features), CCI-L5-003 (8 ghost feature slots), CCI-L5-004 (heuristic mixed with real measurements in path), CCI-L5-005 (silent failure returns constant 53.77)
  - **XGBoost disable fix pending:** Move to disabledComponents, remove from pattern_based path, remove from DEPENDENT_COMPONENTS, set reliability to 0.0
  - **XGBoost rebuild path defined:** v7 feature vector (35 clean features), N≥200 labeled prerequisite, acceptance criteria (Eval R²≥0.15, Spearman ρ≥0.3), A/B validation protocol

---

**Remember:** The goal is safe, incremental progress with full traceability. When in doubt, make smaller changes and verify thoroughly.

---

## Lessons Learned

### 2026-02-11: Next.js Data Cache + Supabase Stale Data

**What Went Wrong:**
- Training Readiness summary cards didn't update after labeling a run with actual_dps
- `dynamic = 'force-dynamic'` was set on the API route but data was still stale
- Supabase JS client's internal `fetch()` calls were being cached by Next.js 14 Data Cache

**Fix (required for ALL Supabase API routes that must return fresh data):**
```typescript
import { unstable_noStore as noStore } from 'next/cache';

function getSupabase() {
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
}

export async function GET(request) {
  noStore(); // BOTH noStore() AND the fetch wrapper are required
  const supabase = getSupabase();
  // ...
}
```

**Lesson:** `dynamic = 'force-dynamic'` only prevents full-page caching. Supabase client's internal `fetch()` still gets cached by Next.js Data Cache. You need both `noStore()` AND a custom fetch wrapper.

### 2026-02-11: Don't Remove Rows Locally After Mutations

**What Went Wrong:**
- `handleLabelSaved` did `setRows(prev => prev.filter(r => r.id !== runId))` — blindly removing rows
- Reprocess completion handler did the same
- This caused table count to diverge from summary cards

**Fix:** After any mutation (label, reprocess), refetch BOTH endpoints from the server:
```typescript
await onLabeled?.();   // refetches summary cards
await fetchRows();     // refetches table rows
```
The server decides which rows are still not-ready — never assume locally.

### 2026-03-02: AuthUser Uses `uid` NOT `id`

**What Went Wrong:**
- Code used `user?.id` to access Supabase user UUID from `useAuth()` hook
- `AuthUser` type maps Supabase `user.id` → `uid` (legacy compatibility with Firebase)
- `user.id` is `undefined` at runtime despite typechecking (due to `[key: string]: any` index signature)
- Save to Supabase silently failed because the condition `if (user?.id)` was always false

**Fix:** Always use `user?.uid` when accessing the user's UUID from `useAuth()`.

### 2026-03-02: Never Silently Skip User Workflows

**What Went Wrong:**
- Added "load on return" feature that auto-skipped Entry → Onboarding → Calibration when a saved profile existed
- No UI indicator, no "welcome back" screen, no way to recalibrate
- User saw their entire workflow vanish — thought it was broken

**Lesson:** Auto-skip features need explicit UX (welcome back screen, start fresh option). Never silently bypass the user's workflow.

### 2026-03-07: Never Trust Documented Accuracy Without Evidence

**What Went Wrong:**
- The system claimed 73.5% accuracy across documentation, presentations, and project planning
- This number was a hardcoded mock value (`accuracy: 73.2`) in a dashboard component
- No real Spearman evaluation had ever produced this number
- Development decisions (component weights, calibration thresholds, architecture) were made against a false baseline

**Lesson:** Any accuracy claim must be traceable to a specific Spearman evaluation run in the `vps_evaluation` table with a specific date, sample size, and methodology. "The Spearman eval says ρ=0.73 on N=150 videos evaluated on 2026-03-15" is evidence. A number in a UI component is not.

### 2026-03-07: LLM Scores Are Opinions, Not Measurements

**What Went Wrong:**
- The 22-component "ensemble" was treated as if each component contributed independent signal
- In reality, 8 components are fully LLM-dependent and many share the same LLM (Gemini), creating correlated errors
- "9 attributes scored by Pack 1" and "Gemini evaluator" are the same Gemini call counted twice
- Averaging correlated LLM opinions doesn't reduce uncertainty the way averaging independent measurements does

**Lesson:** Ensemble value comes from **diversity of signal sources**, not from asking the same model the same question multiple ways. A deterministic word count and an LLM opinion are two diverse signals. Two Gemini calls are one signal counted twice. Component conversion to algorithmic/deterministic signals is a prerequisite for meaningful ensemble learning.

### 2026-03-07: High-VPS Scaling Can Destroy Predictive Power

**What Went Wrong:**
- Rule 4 in the calibrator applies progressive scaling: VPS >80 → ×0.75, >70 → ×0.80, >60 → ×0.85
- This compresses all VPS scores into the 35-60 range regardless of raw prediction
- A video the model is highly confident about (raw VPS=85) gets squeezed to 63.75
- This makes it impossible to predict that anything will go viral (VPS >80 is unreachable)

**Lesson:** Calibration should correct systematic bias, not cap the output range. If calibration makes the top tier unreachable, it's destroying signal rather than refining it. Re-evaluate Rule 4 once real Spearman data is available — if top predictions consistently overpredict, the rule may be justified, but it should be data-driven, not assumption-driven.

### 2026-03-08: DPS and VPS Are Not Interchangeable Terms

**What Went Wrong:**
- AI agent repeatedly said "DPS" when meaning "VPS" (the prediction score) or when referring to general virality/performance
- DPS = Dynamic Percentile System — the actual post-publication performance measurement based on real views and engagement data
- VPS = Viral Potential Score — the pre-publication prediction (0-100)
- These are fundamentally different: DPS is ground truth, VPS is a guess. Conflating them creates confusion about what the system is predicting vs. measuring.

**Lesson:** Always use the correct term. VPS when discussing predictions. DPS when discussing actual measured performance. "Sound performance" or "actual views" when discussing training labels. Never use DPS as a generic synonym for "virality score."

### 2026-03-09: Channel Auto-Fill Contaminated Upload-Test VPS Scores

**What Went Wrong:**
- The upload-test page silently called `/api/channel/me` on load and auto-filled niche + account size from a verified TikTok channel (@textplanation)
- Account size adjustment in the orchestrator applied multipliers from 0.68x (Mega 1M+) to 1.25x (Small 0-10K) on the final VPS score
- The same identical video content could swing 40 VPS points depending on which account size was selected — not because the content differed, but because of creator metadata
- The test page was supposed to measure pure content quality (Raw VPS) but was instead measuring content + creator context (Contextualized VPS)

**Fix:** Removed auto-fill, removed account size from all prediction forms on upload-test, made accountSize optional in `/api/kai/predict`, and added early return of 1.0 in `getAccountSizeAdjustment()` when no accountSize is provided.

**Lesson — Two-Tier VPS Architecture:**
- **Raw VPS** (upload-test / The Pulse free tier): Content quality only. Niche required (structural), account size omitted. `accountFactor = 1.0`.
- **Contextualized VPS** (Agency OS / premium): Full prediction with niche + account size + creator context + calibration profile.
- Never inject creator metadata into content-quality measurement pipelines. The leaderboard must be fair — a video's quality is independent of who uploads it.

### 2026-03-09: Component Timeouts Must Account for I/O Contention

**What Went Wrong:**
- `audio-analyzer`, `thumbnail-analyzer`, and `visual-scene-detector` all failed with timeouts during runtime verification
- Root cause: avgLatency settings (2000-3000ms) were set for isolated execution, but in practice 3-5 FFmpeg processes run in parallel
- A single canonical FFmpeg analysis pass (signalstats + scene filter + ffprobe) takes ~6 seconds in isolation, but 30+ seconds under I/O contention with other FFmpeg processes
- The timeout formula `Math.max(FLOOR, avgLatency × MULTIPLIER)` with a 5000ms floor was insufficient

**Fix:** Raised systemic timeout floor to 45000ms for all components, increased multipliers to 1.5x (non-qualitative) and 2.0x (qualitative). Individual avgLatency values updated to realistic estimates.

**Lesson:** Never set component timeouts based on isolated benchmarks. In production, the parallel-execution pattern creates I/O contention that can 5-10x individual operation latency. Use a generous floor (45s+) and realistic multipliers. Timeout failures masquerade as component bugs when they're actually infrastructure bottlenecks.

### 2026-03-09: Phantom Components from Stale Prediction Path Definitions

**What Went Wrong:**
- User saw 24 components in Pipeline Diagnostics instead of the expected 20-22
- Root cause: The `historical` prediction path listed 4 components (`historical`, `niche-keywords`, `trend-timing-analyzer`, `posting-time-optimizer`) that had been commented out of the component registry but never removed from the path definition
- The orchestrator iterated the path's component list, tried to find each in the registry, failed silently, and counted them as "attempted but failed" — inflating the component count

**Fix:** Emptied the `historical` path's component list to `[]` in both `kai-orchestrator.ts` and `system-registry.ts`.

**Lesson:** When disabling/removing components, always check BOTH the component registry AND the prediction paths. A component removed from the registry but still listed in a path becomes a phantom — silently attempted, silently failed, and inflating counts.

### 2026-01-13 @ 10:45 PM EST: Pack 1/2 Integration Failure Analysis

**What Went Wrong:**
- Agent claimed Pack 1/2 was "integrated" but only checked `/admin/viral-prediction-hub`
- User's actual workflow page is `/admin/upload-test` which uses a DIFFERENT API endpoint
- `/admin/upload-test` uses `/api/kai/predict`, NOT `/api/predict`
- The API endpoint `/api/kai/predict` does NOT return Pack 1/2 results
- The page `/admin/upload-test` has NO UI to display Pack 1/2 results

**Lessons:**
- Pack 1/2 must be integrated into EVERY page that runs predictions, not just one page
- The user's actual test page is `/admin/upload-test` - this is the PRIMARY workflow page
- Always check which API endpoint a page uses before claiming something is integrated
- Never claim something "works" without verifying the FULL chain: files → orchestrator → pipeline → API response → UI display
- Ask the user which page they use BEFORE doing integration work

### 2026-03-09: LLM Scoring Guidelines Must Not Enforce Floor Scores

**What Went Wrong:**
- Gemini's VIRAL_SCORING_GUIDELINES had explicit minimum score rules (question = min 55, emotion = min 65, etc.)
- Combined with additive execution quality boost (+15 max), ordinary videos routinely scored 85-97
- This inflated the qualitative path, triggered the consensus gate on every run, and distorted final VPS

**Fix:** Removed floor rules, made execution adjustment multiplicative (±10% max), added explicit instruction to be honest about average content. Fallback scores reduced to 0/45 instead of 55/60.

**Lesson:** LLM scoring prompts must never enforce minimum scores. Floors create systematic upward bias that compounds through the aggregation pipeline. Let the model be honest — average content should score average.

---

## Pack 1/2 System (Methodology Rubrics)

### What Are Packs?
Packs are LLM-based rubric systems that grade content and provide actionable feedback. They are part of the 20+ "components" designed to predict TikTok video virality at 80%+ accuracy.

| Pack | Name | Status | Purpose |
|------|------|--------|---------|
| **Pack 1** | Unified Grading Rubric | ✅ Complete | LLM-based content scoring: 9 attribute scores (1-10), 7 idea legos (boolean), hook analysis, pacing/clarity/novelty |
| **Pack 2** | Editing Coach | ✅ Complete | Takes Pack 1 output → generates max 3 improvement suggestions with estimated DPS lift |
| **Pack 3** | Viral Mechanics | ✅ Complete | Rule-based viral trigger detection from Pack 1/2/V signals |
| **Pack V** | Visual Rubric | ✅ Complete | Frame-based visual analysis: hook, pacing, pattern interrupts, clarity, style fit |

### Pack 1 Output Structure
```typescript
{
  attribute_scores: [{ attribute: string, score: 1-10, evidence: string }], // 9 attributes
  idea_legos: { lego_1: boolean, lego_2: boolean, ..., lego_7: boolean, notes: string },
  hook: { type: string, clarity_score: 1-10, pattern: string },
  pacing: { score: 1-10, evidence: string },
  clarity: { score: 1-10, evidence: string },
  novelty: { score: 1-10, evidence: string },
  grader_confidence: 0-1,
  warnings: string[]
}
```

### Pack 2 Output Structure
```typescript
{
  pack: "editing-coach",
  predicted_before: number,  // Current DPS
  predicted_after_estimate: number,  // Potential DPS after changes
  changes: [
    { target_field: string, suggestion: string, estimated_lift: number, priority: 1|2|3 }
  ],  // Max 3 suggestions
  notes: string
}
```

### Pack 3 Output Structure
```typescript
{
  pack: "3",
  mechanics: [
    { name: string, strength: 0-100, evidence: string[], signals_used: string[] }
  ],  // Max 5 mechanics
  summary: string,  // Max 500 chars
  confidence: 0-1,
  limited_signal_mode: boolean,
  missing_signals?: string[],
  _meta: { source: "real" | "mock", provider: string, latency_ms: number }
}
```

### Pack V Output Structure
```typescript
{
  pack: "V",
  visual_hook_score: { score: 1-10, evidence: string },
  pacing_score: { score: 1-10, evidence: string },
  pattern_interrupts_score: { score: 1-10, evidence: string },
  visual_clarity_score: { score: 1-10, evidence: string },
  style_fit_score: { score: 1-10, evidence: string },
  overall_visual_score: 0-100,
  _meta: { source: "real" | "mock", provider: string, latency_ms: number }
}
```

### Pack File Locations
```
src/lib/rubric-engine/
├── unified-grading-types.ts       # Pack 1 TypeScript types
├── unified-grading-schema.ts      # Pack 1 Zod validation schema
├── unified-grading-runner.ts      # Pack 1 LLM runner with retry/repair
├── editing-coach-types.ts         # Pack 2 TypeScript types
├── editing-coach-runner.ts        # Pack 2 runner with lift estimation
├── viral-mechanics-types.ts       # Pack 3 TypeScript types + Zod schemas
├── viral-mechanics-runner.ts      # Pack 3 rule-based runner
├── visual-rubric-types.ts         # Pack V TypeScript types + Zod schemas
├── visual-rubric-runner.ts        # Pack V visual analysis runner
├── pack-metadata.ts               # Shared _meta type definitions
├── index.ts                       # Barrel exports
├── __tests__/                     # Test files
│   └── pack-gating.test.ts        # Pack 1/2/3/V integration tests (26 tests)
└── prompts/
    ├── unified-grading-prompt.ts  # Pack 1 LLM prompt template
    └── editing-coach-prompt.ts    # Pack 2 LLM prompt template
```

### Pack Integration Status (Updated: 2026-03-03)

| Layer | Pack 1 | Pack 2 | Pack 3 | Pack V | Notes |
|-------|--------|--------|--------|--------|-------|
| Files exist | ✅ | ✅ | ✅ | ✅ | `src/lib/rubric-engine/` |
| KaiOrchestrator | ✅ | ✅ | ✅ | ✅ | All registered in component registry |
| runPredictionPipeline | ✅ | ✅ | ✅ | ✅ | Returns `qualitative_analysis` object |
| `/api/predict` | ✅ | ✅ | ✅ | ✅ | All packs in response |
| `/api/kai/predict` | ✅ | ✅ | ✅ | ✅ | All packs in response |
| `/admin/upload-test` UI | ✅ | ✅ | ✅ | ✅ | Panels with source badges |
| Tests | ✅ | ✅ | ✅ | ✅ | 37 integrity tests + 26 pack tests |
| SDK | Gemini (`@google/genai`) | Rule-based templates | Rule-based synthesis | Rule-based + Gemini Vision | Migrated from deprecated `@google/generative-ai` |
| Pack Health Dashboard | ✅ | ✅ | ✅ | ✅ | `/admin/operations/system-health` |

---

## Prediction Calibrator (Added 2026-01-15)

### Purpose
Prevent silent/no-speech videos from being overpredicted while not penalizing legitimate visual-first content (ASMR, cooking, art process, etc.).

### Calibration Rules

| Rule | Trigger | Action |
|------|---------|--------|
| **Rule 1** | No speech detected | Confidence penalty: `confidence × 0.7` |
| **Rule 2** | Silent video + no language signal | Soft DPS cap: 55 (standard) or 65 (visual-first) |
| **Rule 3** | Pack V present | Log training features for future model retrain |
| **Rule 4** | VPS > 60 | Conservative scaling: >80 VPS → 0.75x, >70 → 0.80x, >60 → 0.85x (compresses scores into 35-60 range — AUDIT FINDING: may be over-aggressive) |
| **Rule 5** | Low delivery score | Delivery hard gate: <30 → -8 VPS, 30-50 → -4 VPS |

### Visual-First Classification

**Style Allowlist (PRIMARY):**
```
meme_edit, satisfying, asmr, cooking_montage, product_demo,
timelapse, cinematic, tutorial_silent, art_process, transformation
```

**Niche Fallback (only if style missing):**
```
asmr, satisfying, cooking, art_process, product_demo
```

**Logic:** If `detected_style` exists but is NOT in allowlist → NOT visual-first (don't fall back to niche).

### File Locations
```
src/lib/prediction/
├── prediction-calibrator.ts     # Core calibration logic
├── __tests__/
│   └── calibrator.test.ts       # 14 unit tests
scripts/
├── eval-calibrator-silent-vs-speech.ts  # Evaluation script
├── verify-run-finalization.mjs          # Run status verification
docs/
└── CALIBRATOR_EVAL_REPORT.md            # Evaluation output
```

### Supabase Columns for Calibration

Added via migration `20260115_transcription_status_tracking.sql`:

| Column | Type | Purpose |
|--------|------|---------|
| `transcription_source` | VARCHAR(50) | user_provided, whisper, fallback_title, none |
| `transcription_confidence` | NUMERIC(5,4) | 0.0-1.0 |
| `transcription_skipped` | BOOLEAN | Whether transcription was skipped |
| `transcription_skip_reason` | TEXT | Why skipped |
| `resolved_transcript_length` | INTEGER | Final transcript length sent to components |
| `pack1_meta` | JSONB | Pack 1 execution metadata |
| `pack2_meta` | JSONB | Pack 2 execution metadata |

---

## God's Eye Audit — Critical Findings (2026-03-07)

A comprehensive 6-phase forensic audit of the entire prediction system was completed. Key findings:

### The Core Finding
The "22-component ensemble" is effectively **"what do 3-4 LLMs think about this transcript?"** The VPS score is dominated by Gemini 2.5 Flash (~35-40% effective weight through multiple paths), GPT-4o-mini (~15%), Claude (~10-15%), and rule-based synthesis of those same LLM opinions.

### Critical Issues Found
1. **73.5% accuracy is fabricated** — `src/app/admin/operations/page.tsx` line 104 has `accuracy: 73.2` as hardcoded mock data. No real Spearman evaluation has produced this number.
2. **XGBoost v6 has zero generalization** — trained on 27 samples, Eval R²=0.0, CV R²=-164,094. Only 4 of 42 features have non-zero importance. Top feature: `text_avg_word_length` (42.4%).
3. **Legacy XGBoost trained on contaminated data** — `training-metrics.json` top features: `views_count` (73.9%), `engagement_rate` (13.8%). Post-pub metrics predicting post-pub metrics.
4. **106-feature extraction pipeline feeds nothing** — XGBoost v6 builds its own 42-feature vector internally in `executeXGBoostViralityML`. The feature service is orphaned.
5. **Rule 4 compresses VPS into 35-60 range** — any VPS > 60 gets 15-25% reduction. A raw VPS of 85 becomes 63.75.
6. **Gemini double-counted** — used in qualitative path (QL2) AND Pack 1/2/V, giving ~35-40% total influence.
7. **Consensus gate includes 7 components** — `['gpt4', 'gemini', 'claude', 'unified-grading', 'editing-coach', '9-attributes', '7-legos']` instead of just the 3 qualitative evaluators.
8. **Historical dimension entirely disabled** — H1/H2 are static lookup tables at 0% actual weight.
9. **Documented weights don't match actual weights** — docs say 35/25/25/15, registry says 15/25/45/15, effective is ~15/15/70/0.
10. **Referenced files don't exist** — `artifact-cache.ts`, `video-hash.ts`, `orchestration/types.ts` are documented but not in the repo.

### Theoretical Accuracy Ceiling
- Content signals alone: ρ ≈ 0.55-0.65 (academic literature: content explains ~20-40% of engagement variance)
- With platform signals: ρ ≈ 0.70-0.75
- Within-creator relative ranking: ρ ≈ 0.70-0.80 (achievable)
- 80% absolute prediction: **structurally unreachable** from content signals alone

### Strategic Direction
The system should reframe from "predict absolute virality" to "predict within-niche ranking" and "provide empirically validated coaching." Components must become real measurements (deterministic, repeatable) before model training is meaningful. Currently training would just build a correction layer on LLM guesses.

### Next Step: Component-by-Component Algorithmic Conversion
Each of the 22 components must be audited using this framework:
1. What should this component measure? (concept)
2. What does it actually do right now? (reality)
3. Can it become deterministic/formulaic? (engineering decision)
4. Keep / Remove / Fix / Merge verdict

---

## 22-Component Real Status (Updated 2026-03-10 — Post Layer 1+2+3+4 Fixes)

| # | ID | Name | Current State | Layer | Runtime Status | Influences VPS? |
|---|---|---|---|---|---|---|
| 1 | `ffmpeg` | FFmpeg Video Analysis | **FIXED:** Real signalstats + scene filter + ffprobe via canonical analyzer | L1 | ✅ OK | Indirectly (feeds downstream) |
| 2 | `whisper` | Whisper Transcription | **FIXED:** verbose_json, native confidence, speaking rate extraction | L1 | ✅ OK (infra) | Indirectly (transcript to 11 components) |
| 3 | `feature-extraction` | Feature Extraction (106 features) | **DISABLED:** Moved to disabledComponents. 60s wasted latency eliminated. | L2 | ⛔ Disabled | No |
| 4 | `gpt4` | GPT-4o-mini Evaluator | Demoted to coach lane — runs but does not influence VPS | L3 | ✅ OK (70.0, 80%) | No (coach lane) |
| 5 | `gemini` | Gemini 2.5 Flash Evaluator | Fully LLM-dependent (multimodal) | L3 | ✅ OK (82.0, 85%) | Yes ~35-40% (double-counted) |
| 6 | `claude` | Claude 3 Haiku Evaluator | Demoted to coach lane — runs but does not influence VPS | L3 | ✅ OK (72.0, 85%) | No (coach lane) |
| 7 | `9-attributes` | 9 Attributes Scorer | Fully LLM-dependent (via Pack 1/Gemini) | L4 | ✅ OK (71.1, 80%) | Yes (through Pack 1) |
| 8 | `7-legos` | 7 Idea Legos | Fully LLM-dependent (via Pack 1/Gemini) | L4 | ✅ OK (57.1, 80%) | Yes (through Pack 1) |
| 9 | `24-styles` | 24 Video Styles Classifier | **FIXED:** Hybrid — Tier 1 keyword+structural, Tier 2 LLM. D11 compliant. | L2 | ✅ OK (50.0, 60%) | Yes |
| 10 | `hook-scorer` | Hook Strength Scorer | **REBUILT:** 5-channel multi-modal (text/audio/visual/pace/tone), 10-type taxonomy | L2 | ✅ OK (63.0, 77%) | Yes (highest leverage) |
| 11 | `pattern-extraction` | Pattern Extraction | **TIGHTENED:** 9 contextual regexes, positional weighting, base 30, cap 85 | L2 | ✅ OK (35.0, 55%) | Yes |
| 12 | `audio-analyzer` | Audio Analysis | **FIXED:** FFmpeg + prosodic (ebur128, YIN pitch) + speaking rate + classification | L1 | ✅ OK (75.0, 98%) | Feeds Pack V/P3/training |
| 13 | `visual-scene-detector` | Visual Scene Detection | **FIXED:** Thin wrapper over canonical analyzer, real scene data | L1 | ✅ OK (54.0, 35%) | Feeds Pack V |
| 14 | `thumbnail-analyzer` | Thumbnail Analyzer | **FIXED:** Thin wrapper over canonical analyzer, real SATAVG colorfulness | L1 | ✅ OK (62.0, 80%) | Feeds Pack V |
| 15 | `virality-matrix` | TikTok Virality Matrix | DISABLED — 100% regex, duplicative, mislabeled | L3 | ⛔ Disabled | No |
| 16 | `virality-indicator` | Virality Indicator | **FIXED:** Factors rebased to 30, penalties added, timing removed, VPS direct pass-through | L4 | ✅ OK | Yes |
| 17 | `niche-keywords` | Niche Keywords | **CONFIRMED DEAD (L5 Analysis):** Permanently disabled, duplicated by 24-styles+pattern-extraction | Dead | ⛔ Disabled | No |
| 18 | `xgboost-virality-ml` | XGBoost Virality ML v6 | **L5 ANALYSIS COMPLETE:** 3 model systems all broken. v5-simplified heuristic runs, adds noise. Verdict: DISABLE, rebuild on 200+ labels | L5 | ✅ Runs (noise — disable pending) | Adds noise |
| 19 | `unified-grading` | Pack 1 (Unified Grading) | Fully LLM-dependent (Gemini) — timeout fixed | L4 | ✅ OK (81.0, 90%) | Major contributor |
| 20 | `editing-coach` | Pack 2 (Editing Coach) | Hybrid (Gemini + rule-based) | L4 | ✅ OK (90.0, 85%) | Coaching output |
| 21 | `visual-rubric` | Pack V (Visual Rubric) | **FIXED:** Dynamic confidence based on upstream signal availability | L4 | ✅ OK | Yes |
| 22 | `viral-mechanics` | Pack 3 (Viral Mechanics) | **FIXED:** VPS from avg mechanic strength (not confidence), dead refs removed | L4 | ✅ OK | Yes |

**Summary (post Layer 1-5 analysis):** 18 active components executing. Layers 1-5 COMPLETE (all fixes applied). XGBoost DISABLED (2026-03-10) — moved to disabledComponents, removed from all paths, reliability 0.0. Niche Keywords confirmed dead. XGBoost rebuild blocked until 200+ labeled videos with clean deterministic features.

---

## Onboarding Pipeline Overhaul (2026-03-06)

### Two-Mode Prediction Architecture
Implemented in `src/lib/prediction/concept-scorer.ts`:

**Mode 1 — Quality Gate:** "Will this pass TikTok's batch test?"
- Hook retention (45%), delivery baseline (25%), content structure (20%), production floor (10%)
- Gate: <35 fail, 35-50 borderline, >50 pass

**Mode 2 — Distribution Potential:** "How far will it travel?"
- Niche saturation (25%), trend alignment (20%), share probability (25%), creator momentum (15%), audience fit (15%)

**VPS Combination:**
- Fail: VPS = qualityGate × 0.6
- Borderline: VPS = qualityGate × 0.5 + distributionPotential × 0.5
- Pass: VPS = qualityGate × 0.3 + distributionPotential × 0.7

### 10-Type Hook Taxonomy (5 Psychological Clusters)
Defined in `system-registry.ts` and used by `calibration-scorer.ts`:
- **Curiosity Trigger:** question, list_preview
- **Cognitive Challenge:** contrarian, myth_bust
- **Credibility Signal:** statistic, authority, result_preview
- **Emotional Connection:** personal_story, problem_identification
- **Urgency/Scarcity:** urgency

### Delivery Baseline (4 Features)
Analyzed via FFmpeg + Gemini from creator's existing videos (`delivery-analyzer.ts`, `delivery-baseline.ts`):
- `speakingRateWpm` (30% weight), `energyLevel` (30%), `silenceRatio` (20%), `speakingRateVariance` (20%)
- Stored in `user_channels.delivery_baseline` (JSONB)

### Creator Story
- Transformation narrative, niche myths, audience desired result
- Stored in `calibration_profiles.creator_story` (JSONB)

### Quality Discernment
- `(highAccepted + underperformerRejected) / totalSwipes × 100`
- Measures calibration swipe accuracy
- Stored in `calibration_profiles.quality_discernment_score`

### Delivery Hard Gate (Rule 5 in prediction-calibrator.ts)
- Delivery score <30 → -8 VPS penalty
- Delivery score 30-50 → -4 VPS penalty

### New Files
```
src/lib/onboarding/delivery-analyzer.ts     # FFmpeg + Gemini delivery analysis
src/lib/onboarding/delivery-baseline.ts     # Delivery baseline type and scoring
src/lib/onboarding/channel-verifier.ts      # Channel verification with delivery baseline
src/lib/prediction/concept-scorer.ts        # Two-mode prediction (Quality Gate + Distribution Potential)
```

### Migrations (March 6, 2026)
- `20260306_creator_story.sql` — creator_story JSONB on calibration_profiles
- `20260306_subtopic_scope.sql` — selected_subtopics text[] on calibration_profiles
- `20260306_audience_enrichment.sql` — audience_location, audience_occupation on calibration_profiles
- `20260306_delivery_baseline.sql` — delivery_baseline JSONB on user_channels
- `20260306_validation_fixes.sql` — quality_discernment_score, hook_usage_log on calibration_profiles

---

## Run Finalization (Fixed 2026-01-16)

### Problem
`prediction_runs` rows were stuck at `status='running'` with `raw_result=NULL` because the DB update was inside the try block and could be skipped if later code threw.

### Solution
Added `finally` block to `runPredictionPipeline.ts` that:
1. **Always runs** - even if try/catch throws
2. **Logs explicitly** - with run_id before/after DB update
3. **Handles truncation** - raw_result > 500KB → compact summary
4. **Updates atomically** - all fields in one update

### Verification SQL
```sql
SELECT
  id AS run_id,
  status,
  predicted_dps_7d,
  CASE WHEN raw_result IS NOT NULL THEN 'PRESENT' ELSE 'NULL' END AS raw_result,
  completed_at
FROM prediction_runs
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** `status='completed'` or `status='failed'` (NOT `'running'`), `raw_result='PRESENT'`

---

## Admin Authentication System (Added 2026-01-21)

### Overview
Supabase Google OAuth with separate flows for admin (`/admin/studio`) and user (`/dashboard`) platforms.

### Key Files
```
src/app/admin/login/page.tsx        # Dedicated admin login with localStorage intent
src/app/auth/callback-handler/page.tsx  # Client-side post-OAuth router
src/app/auth/callback/route.ts      # Server-side OAuth code exchange
src/lib/contexts/AuthContext.tsx    # Supabase auth context with isAdmin detection
src/app/providers.tsx               # Provider hierarchy (includes AuthProvider)
src/app/admin/AdminProtectionWrapper.tsx  # Admin route protection
```

### Environment Variables
```bash
NEXT_PUBLIC_ADMIN_EMAIL=ttucker.m@gmail.com  # Admin user's email (exact match required)
NEXT_PUBLIC_DISABLE_AUTH=true                 # Bypasses AdminProtectionWrapper (dev only)
```

### Auth Flows

**Admin Login Flow:**
1. User visits `/admin/login`
2. Clicks "Sign in with Google"
3. `localStorage.setItem('admin_login_intent', '/admin/studio')` - stores intent
4. Supabase OAuth redirects to Google
5. Google redirects to `/auth/callback` with code
6. Server exchanges code for session
7. Redirects to `/auth/callback-handler?fallback=/dashboard`
8. Client reads `localStorage.getItem('admin_login_intent')` → `/admin/studio`
9. Clears intent, redirects to `/admin/studio`

**User Login Flow:**
1. User visits `/auth` (or any auth page)
2. Completes OAuth
3. No admin intent in localStorage
4. Redirects to `/dashboard` (fallback)

### Admin Detection Logic
```typescript
// In AuthContext.tsx (lines 128-129, 144-145)
const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
setIsAdmin(adminEmail ? session.user.email === adminEmail : false);
```

**Important:** Both `AuthContext.tsx` and `AdminProtectionWrapper.tsx` use `NEXT_PUBLIC_ADMIN_EMAIL` for admin detection. If this env var is not set, no one will be recognized as admin.

### Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "You don't have admin access" | Email doesn't match `NEXT_PUBLIC_ADMIN_EMAIL` | Update env var to user's email |
| OAuth button does nothing | AuthProvider not mounted | Ensure AuthProvider is in providers.tsx |
| redirect_uri_mismatch | Missing Google Console config | Add redirect URI to Google Cloud Console |
| Redirects to /dashboard instead of /admin/studio | localStorage intent not set | Use `/admin/login` page, not `/auth` |

---

## Primary Workflow Pages

**CRITICAL:** Know which pages the user actually uses for their workflow.

| Page | Purpose | API Endpoint | VPS Mode |
|------|---------|--------------|----------|
| `/admin/upload-test` | **PRIMARY** - Upload videos, run predictions. **Raw VPS mode** (no account size adjustment) | `/api/kai/predict` | Raw VPS (content quality only) |
| `/admin/viral-prediction-hub` | Dashboard, system overview, secondary testing | `/api/predict` | Contextualized (has account size) |
| `/admin/testing-accuracy` | Validation workflow, accuracy testing | Various | Unknown |
| `/admin/calibration` | Component calibration | Various | Unknown |

**RULE:** Any new prediction feature MUST work on `/admin/upload-test` first because that's the primary user workflow.

---

## Current Sprint (Updated 2026-03-10)

### v1.0 Production Readiness — COMPLETE (Jan 13-18)
All Pack 1/2/3/V implemented, integrated, tested. 26/26 pack tests passing. See Changelog for details.

### God's Eye Audit — COMPLETE (Mar 5-7)
Comprehensive forensic audit of the entire prediction system. See "God's Eye Audit — Critical Findings" section above.
- [x] 6-phase diagnostic audit (ground truth, contamination, weights, score dynamics, training, ceiling)
- [x] God's Eye directive prompt assessed and rewritten
- [x] Chicken-and-egg problem identified and strategic direction agreed
- [x] 22-component classification completed
- [x] Component audit framework established

### Onboarding Pipeline Overhaul — COMPLETE (Mar 6)
Research-validated redesign of onboarding and prediction pipeline. See "Onboarding Pipeline Overhaul" section above.
- [x] Two-mode prediction architecture (Quality Gate + Distribution Potential)
- [x] 10-type hook taxonomy with 5 psychological clusters
- [x] Delivery baseline (4 prosodic features)
- [x] Creator story, subtopic scope, audience enrichment
- [x] Quality discernment scoring
- [x] Delivery hard gate (Rule 5)
- [x] 5 Supabase migrations

### Component Algorithmic Conversion — IN PROGRESS (Layers 1-2 Complete)
Converting LLM-dependent components to deterministic/formulaic measurements.
- [x] Layer 1 (Foundation) — 5/5 components analyzed, Batch A+B fixes complete, runtime verified
  - Batch A (14 issues): FFmpeg canonical analyzer, Whisper verbose_json, Pack V mapping fixes, Math.random removal
  - Batch B (audio intelligence): prosodic analyzer (ebur128 + YIN pitch + silence patterns), speaking rate variance from Whisper, music/speech classifier + fingerprinting, full pipeline integration, toDPS→toPrediction rename, 13 new training features
  - Runtime verification: All 5 components executing successfully (audio-analyzer 75/98%, visual-scene-detector 54/35%, thumbnail-analyzer 62/80%, ffmpeg OK, whisper infra OK)
- [x] Layer 2 (Feature & Pattern): Components 3, 9, 10, 11 — ANALYSIS + FIXES + RUNTIME VERIFICATION COMPLETE
  - Component 3 (Feature Extraction): DISABLED — moved to disabledComponents. 60s of wasted latency eliminated.
  - Component 9 (24-Styles): HYBRID conversion complete — Tier 1 deterministic keyword+structural, Tier 2 LLM refinement. viralWeights reset. D11 compliance.
  - Component 10 (Hook Scorer): REBUILT — 5-channel multi-modal (text/audio/visual/pace/tone), 10-type taxonomy, 0-100 weighted fusion, Whisper timestamps. Now producing real scores (audio 52, pace 90, tone 40 — were all zero before).
  - Component 11 (Pattern Extraction): TIGHTENED — 9 contextual regexes, positional weighting, base 30, cap 85. Generic transcripts ~30-40 (was 65-75).
  - Cross-component fixes: Hook/pattern overlap resolved (CCI-003), phantom components removed (24→20), virality-indicator 'either' bug fixed, systemic timeout floor raised to 45s.
  - Runtime result: 19/20 active components executing successfully (1 disabled). All 4 Packs working.
- [x] Raw VPS Clean Room — Upload-test page purified (no auto-fill, no account size adjustment, content-only scoring)
- [x] Layer 3 (LLM Evaluators): Components 4, 5, 6, 15 — ANALYSIS + FIXES COMPLETE (2026-03-09)
  - GPT-4/Claude demoted to coach lane (weight=0), Virality Matrix disabled
  - Consensus gate fixed: LLM_COMPONENT_IDS reduced 7→3
  - Gemini inflation stripped: all floor rules removed, execution quality multiplicative (±10%)
  - Stale fallback bug fixed (CCI-L3-002), weight boosts removed (2.5x/1.2x/3x all gone)
- [x] Layer 4 (Packs & Synthesis): Components 7, 8, 16, 19-22 — ANALYSIS + FIXES COMPLETE (2026-03-10)
  - Components 7 (9-Attributes), 8 (7-Legos), 19 (Pack 1), 20 (Pack 2): KEEP — correctly in coach lane
  - Component 16 (Virality Indicator): FIXED — factors rebased 50→30, penalties added, timing removed, VPS direct pass-through (VIR-002/004/005/006)
  - Component 21 (Pack V): FIXED — dynamic confidence based on upstream signals (PV-006)
  - Component 22 (Pack 3): FIXED — VPS from avg mechanic strength, dead refs removed (PM-001/003)
- [x] Layer 5 (Aggregation): Component 18 + Component 17 — ANALYSIS COMPLETE (2026-03-10)
  - Component 18 (XGBoost Virality ML): 9 findings — THREE model systems all broken (v6 R²=0.0, legacy contaminated, v5-simplified is hand-tuned heuristic). Verdict: DISABLE immediately, rebuild when N≥200 labeled videos
  - Component 17 (Niche Keywords): CONFIRMED DEAD — permanently disabled, duplicated by 24-styles + pattern-extraction
  - 5 cross-component issues (CCI-L5-001 through CCI-L5-005): noise injection, coach-lane leakage, ghost features, silent failure mode
  - Export pipeline ready with 13 prosodic features for future v7 retraining
  - XGBoost DISABLED (2026-03-10): moved to disabledComponents, removed from all paths, reliability 0.0
- [ ] Gate: XGBoost retrain blocked until 200+ labeled videos with clean deterministic features
- [ ] **FUTURE: Search Alignment Component** (replaces dead `niche-keywords` #17)
  - Real keyword data exists: `frameworks-and-research/POC Research & Framework Data/Framework- Niche Keywords 11-16-25.md` — ~240 manually curated TikTok search terms across 4/20 niches
  - ⚠️ `src/data/niche-keywords.json` and `config/niche-keywords.json` are AI-generated — NOT authoritative
  - Proposed: deterministic `search-alignment` scorer (exact/partial match × rank weight × freshness), output 0-85, fills `trend_alignment` 20% slot in Distribution Potential mode (`concept-scorer.ts`)
  - **Blocked on:** Owner completing keyword collection for all 20 niches + establishing weekly TikTok search recording cadence
  - **Does NOT affect Raw VPS** — only Distribution Potential mode
  - Full design spec: `docs/COMPONENT_DEEP_ANALYSIS.md` → Component 17 → "FUTURE: Search Alignment Component"

### Bucket 4 — Creator Intelligence Layer — COMPLETE (Mar 2026)
- [x] Creator Context integration with clean pipeline separation
- [x] Pattern Library with extraction pipeline and metrics
- [x] Creator Staging with 5-dimension classification
- [x] Quick Win enhancement with Pattern Library + First Win detection
- [x] Content Calendar with pattern performance tracking
- [x] Pre-Mortem Concept Scoring in Studio

### Training Pipeline & Readiness — COMPLETE (Feb 2026)
- [x] Training Readiness tab at `/admin/operations/training`
- [x] Label drawer: compute actual_dps via percentile-rank, write to prediction_runs
- [x] Reprocess queue: 3 fix strategies (status_fix, synthesize_raw_result, rerun)
- [x] Summary cards (Total Runs, Completed, Labeled, Training Ready, gap cards)
- [x] Fix: Next.js Data Cache busting for all Supabase route handlers
- [x] Fix: Server-driven refetch after label/reprocess (no local row deletion)
- [x] "Last synced" timestamp display
- [x] Consistency check: table row count vs summary gap assertion
- [x] Playwright E2E tests for label + reprocess flows

### Training Pipeline Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/training/readiness-summary` | GET | Training readiness summary view |
| `/api/training/readiness-summary/not-ready` | GET | Not-ready rows from prediction_runs_enriched |
| `/api/operations/training/label` | POST | Compute + save actual_dps for a run |
| `/api/operations/training/reprocess` | POST/GET | Fix non-training-ready runs |
| `/api/admin/reprocess-queue` | GET/POST | Dashboard stats + batch fix runs |
| `/api/admin/operations/system-health` | GET | Pack Health Dashboard — component/pack status from real prediction data |

### How to Verify Pipeline Works
1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000/admin/upload-test`
3. Enter transcript text (minimum 10 characters required)
4. Select niche and submit
5. **SUCCESS CRITERIA:**
   - Pack 1 panel: 9 attribute scores, 7 idea lego checkmarks, hook analysis
   - Pack 2 panel: Before/After DPS, 3 improvement suggestions
   - Pack 3 panel: Viral mechanics with colored strength bars (green/yellow/red)
   - Pack V panel: Visual scores (hook, pacing, pattern interrupts, clarity, style fit)
   - Run query in Supabase: `SELECT status, raw_result IS NOT NULL as has_result FROM prediction_runs ORDER BY created_at DESC LIMIT 1;`
   - Should show `status='completed'` and `has_result=true`

---

## Working With AI Agents

### Context Handoff Between Sessions
When starting a new chat, provide this context:
```
Read CLAUDE.md first.

Current state (as of 2026-03-09):
- v1.0 Production Readiness milestone COMPLETE (Jan 17)
- Pack 1/2/3/V all implemented and integrated
- Buckets 1-4 COMPLETE (Prediction Audit → Code Fixes → Training Pipeline → Creator Intelligence)
- God's Eye Forensic Audit COMPLETE (Mar 5-7) — 73.5% accuracy is fabricated, XGBoost broken, VPS dominated by LLM opinions
- Onboarding Pipeline Overhaul COMPLETE (Mar 6) — two-mode prediction, hook taxonomy, delivery baseline, creator story
- 22-component classification COMPLETE — 8 fully LLM, 2 broken, 5 partial algo, 4 fully algo, 3 hybrid
- Layer 1 (Foundation) Batch A+B COMPLETE (Mar 8) + runtime verified (Mar 9):
  - Batch A: Canonical FFmpeg analyzer, 6 real features, Pack V mapping fixes, Whisper verbose_json, dead code removal
  - Batch B: Prosodic analysis (ebur128, YIN pitch, silence patterns), speaking rate variance from Whisper, music/speech classification + fingerprinting, full pipeline integration, toDPS→toPrediction rename, 13 new training features
  - Runtime: All 5 foundation components executing and producing real scores
- Layer 2 (Feature & Pattern) COMPLETE (Mar 8-9) — analysis + batch fixes + runtime verification:
  - Component 3 disabled (60s wasted), Hook Scorer rebuilt (5-channel 0-100), Pattern Extraction tightened (base 30, cap 85), 24-Styles hybrid (keyword+LLM)
  - 7 runtime issues fixed: timeouts (audio/thumbnail/VSD/unified-grading), phantom components (24→20), virality-indicator 'either' bug, systemic 45s timeout floor
  - All 19/20 active components now executing successfully, all 4 Packs working
- Raw VPS Clean Room COMPLETE (Mar 9) — upload-test purified: no auto-fill, no account size, content-only scoring
- Strategic reframe: "predict absolute virality" → "predict within-niche ranking"
- system-registry.ts is single source of truth for all components, packs, tiers, niches (D11)

- Layer 3 (LLM Evaluators) COMPLETE (Mar 9): GPT-4/Claude→coach lane, VM disabled, consensus gate 7→3, Gemini inflation stripped, stale fallback fixed
- Layer 4 (Packs & Synthesis) COMPLETE (Mar 10):
  - #16 (Virality Indicator): FIXED — factors rebased 50→30, penalties added, timing removed, VPS direct pass-through. New range ~19-77 (was 60-95)
  - #21 (Pack V): FIXED — dynamic confidence (0.3 base + upstream signals, was hardcoded 0.8)
  - #22 (Pack 3): FIXED — VPS from avg mechanic strength (was confidence*100 → always 80-95), dead refs removed
  - #7, #8, #19, #20: KEEP (coach lane, no VPS contribution)
- Vision: "Cultural Intelligence System" / "Brief Generator" noted for future (VPS + Briefs, not replacement)

Active work area: Layer 5 COMPLETE — XGBoost DISABLED, all layers done
Tracking document: docs/COMPONENT_DEEP_ANALYSIS.md
Decision tracker: ~/.claude/projects/C--Users-thoma/memory/audit-decisions.md
God's Eye audit: agent transcript f5a22e73-d70e-47ed-846d-34ec1dc73c4c
Layer 1-2 runtime verification: agent transcript bec607db-8f15-46eb-a7c4-c0daabe23dc1
Layer 3+4 analysis: agent transcript 00b0801d-0e33-4b96-856f-52ec9ec5ec98
```

### When Agent Makes a Mistake
Tell the agent:
```
Add to CLAUDE.md Lessons Learned with today's date: "[What went wrong and the correct approach]"
```

### Verification Before Claiming "Done"
Before any agent claims something is complete, they MUST:
1. Identify the ACTUAL page/workflow the user uses (ask if unsure)
2. Verify the feature works on THAT specific page (not some other page)
3. Test with real input, not assumptions or mock data
4. Show evidence: screenshots, API responses, console output, test results
5. Have the user confirm it works from their perspective