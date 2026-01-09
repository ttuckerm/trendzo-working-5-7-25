# Trendzo Project Operating System

**Last Updated:** 2026-01-05
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

---

**Remember:** The goal is safe, incremental progress with full traceability. When in doubt, make smaller changes and verify thoroughly.
