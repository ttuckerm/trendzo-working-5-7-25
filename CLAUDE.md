# Trendzo Project Operating System

**Last Updated:** 2026-01-21
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
- **Component System:** 27 registered components (15 active, 12 disabled) - see [docs/COMPONENT_RUBRIC_AUDIT.md](docs/COMPONENT_RUBRIC_AUDIT.md)

### Architecture Principles

1. **Canonical Pipeline First:** All predictions flow through `runPredictionPipeline()`
2. **Traceability:** Every prediction has a `run_id` that traces component execution
3. **Immutable Runs:** `prediction_runs` records are append-only (status updates allowed)
4. **Component Isolation:** Components are registered, versioned, and independently testable
5. **Artifact Caching:** Content-based hashing prevents redundant API calls (Ticket B1)

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
  "predicted_tier_7d": "good",
  "success": true
}
```

**If error:** Check logs for stack trace and fix before committing.

### 4. Build Verification (Optional for CI)

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
- [src/lib/prediction/artifact-cache.ts](src/lib/prediction/artifact-cache.ts) - Content-based caching (Ticket B1)
- [src/lib/prediction/video-hash.ts](src/lib/prediction/video-hash.ts) - Video content hashing

### Orchestration
- [src/lib/orchestration/kai-orchestrator.ts](src/lib/orchestration/kai-orchestrator.ts) - Component orchestration
- [src/lib/orchestration/types.ts](src/lib/orchestration/types.ts) - Shared types

### Prediction Endpoints (Ticket A2)
- [src/app/api/predict/route.ts](src/app/api/predict/route.ts) - Standard prediction
- [src/app/api/predict/pre-content/route.ts](src/app/api/predict/pre-content/route.ts) - Pre-content analysis
- [src/app/api/admin/predict/route.ts](src/app/api/admin/predict/route.ts) - Admin mode
- [src/app/api/admin/super-admin/quick-predict/route.ts](src/app/api/admin/super-admin/quick-predict/route.ts) - Quick prediction
- [src/app/api/bulk-download/predict/route.ts](src/app/api/bulk-download/predict/route.ts) - Bulk prediction

### Documentation
- [docs/COMPONENT_RUBRIC_AUDIT.md](docs/COMPONENT_RUBRIC_AUDIT.md) - Component status and rubric needs
- [docs/Trendzo Methodology Pack v1.1.md](docs/Trendzo Methodology Pack v1.1.md) - System architecture and methodology
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

---

**Remember:** The goal is safe, incremental progress with full traceability. When in doubt, make smaller changes and verify thoroughly.

---

## Lessons Learned

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

### Pack Integration Status (Updated: 2026-01-17)

| Layer | Pack 1 | Pack 2 | Pack 3 | Pack V | Notes |
|-------|--------|--------|--------|--------|-------|
| Files exist | ✅ | ✅ | ✅ | ✅ | `src/lib/rubric-engine/` |
| KaiOrchestrator | ✅ | ✅ | ✅ | ✅ | Components 28, 29, 30 registered |
| runPredictionPipeline | ✅ | ✅ | ✅ | ✅ | Returns `qualitative_analysis` object |
| `/api/predict` | ✅ | ✅ | ✅ | ✅ | All packs in response |
| `/api/kai/predict` | ✅ | ✅ | ✅ | ✅ | All packs in response |
| `/admin/upload-test` UI | ✅ | ✅ | ✅ | ✅ | Panels with source badges |
| Tests | ✅ | ✅ | ✅ | ✅ | 26/26 tests passing |

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

| Page | Purpose | API Endpoint | Pack Status |
|------|---------|--------------|-------------|
| `/admin/upload-test` | **PRIMARY** - Upload videos, enter transcripts, run predictions | `/api/kai/predict` | ✅ All Packs (1/2/3/V) |
| `/admin/viral-prediction-hub` | Dashboard, system overview, secondary testing | `/api/predict` | ✅ All Packs (1/2/3/V) |
| `/admin/testing-accuracy` | Validation workflow, accuracy testing | Various | Unknown |
| `/admin/calibration` | Component calibration | Various | Unknown |

**RULE:** Any new prediction feature MUST work on `/admin/upload-test` first because that's the primary user workflow.

---

## Current Sprint: v1.0 Production Readiness Complete (Updated 2026-01-18)

### v1.0 Milestone Complete

All phases of v1.0 Production Readiness milestone have been successfully completed.

### Completed (Jan 13-17)
- [x] Pack 1/2 Core Implementation (Jan 13)
- [x] Pack 1/2 Full Integration into `/admin/upload-test` (Jan 14)
- [x] Codebase Mapping documentation (Jan 14)
- [x] Prediction Calibrator for silent video overprediction (Jan 15)
- [x] Supabase migration for transcription status columns (Jan 15)
- [x] Fix `prediction_runs` stuck at `status='running'` (Jan 16)
- [x] Phase 01: Pipeline Verification - 26/26 pack tests passing (Jan 17)
- [x] Phase 02: Supabase Migration - Transcription status columns applied (Jan 17)
- [x] Phase 03: Calibrator Validation - Unit tests, eval script, smoke tests approved (Jan 17)
- [x] Phase 04: API Response Standardization - All packs return `_meta` metadata (Jan 17)
- [x] Phase 05: UI Polish - Pack 3 panel with strength indicators, loading skeletons (Jan 17)
- [x] Pack 3 (Viral Mechanics) implementation - Rule-based viral trigger detection (Jan 17)
- [x] Phase 06: Documentation - CLAUDE.md, API docs, component registry updated (Jan 18)

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

Current state (as of 2026-01-17):
- v1.0 Production Readiness milestone COMPLETE
- Pack 1/2/3/V all implemented and integrated
- All prediction endpoints return qualitative_analysis with all packs
- UI displays all pack panels with source badges and loading skeletons
- 26/26 pack tests passing
- Prediction Calibrator validated with smoke tests

Ready for:
1. Next milestone planning
2. Pack refinement based on production feedback
3. Additional features or improvements
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