# /pr-review

Review a pull request and optionally suggest CLAUDE.md updates based on learnings.

## Usage

```
/pr-review [PR_NUMBER]
/pr-review https://github.com/[org]/[repo]/pull/[number]
```

---

## Review Process

### Step 1: Fetch PR Information

```bash
# Get PR details
gh pr view [NUMBER] --json title,body,files,additions,deletions,author,baseRefName,headRefName

# Get diff
gh pr diff [NUMBER]

# Get changed files list
gh pr view [NUMBER] --json files --jq '.files[].path'
```

### Step 2: Check Against CLAUDE.md Rules

Review each changed file against the Non-Negotiable Rules:

#### Rule 1: Single Pipeline Entry Point

- [ ] No new prediction endpoints created
- [ ] All predictions route through `runPredictionPipeline()`
- [ ] No direct `KaiOrchestrator` calls from routes

```bash
# Check for violations
gh pr diff [NUMBER] | grep -E "(new.*route|orchestrator\.predict|KaiOrchestrator)"
```

#### Rule 2: No New Predict Endpoints

Approved endpoints:
- `/api/predict/route.ts`
- `/api/predict/pre-content/route.ts`
- `/api/admin/predict/route.ts`
- `/api/admin/super-admin/quick-predict/route.ts`
- `/api/bulk-download/predict/route.ts`

```bash
# Check for new prediction endpoints
gh pr view [NUMBER] --json files --jq '.files[].path' | grep -i predict
```

#### Rule 3: No Direct Database Writes from Routes

- [ ] Route handlers don't write to `prediction_runs`
- [ ] Route handlers don't write to `run_component_results`
- [ ] Only pipeline writes to canonical tables

```bash
# Check for database writes in routes
gh pr diff [NUMBER] | grep -E "\.from\('(prediction_runs|run_component_results)'\)\.insert"
```

#### Rule 4: No Legacy Table Writes

- [ ] No writes to `component_results` (deprecated)
- [ ] No writes to `prediction_results` (deprecated)

```bash
# Check for legacy table writes
gh pr diff [NUMBER] | grep -E "from\('component_results'\)|from\('prediction_results'\)"
```

### Step 3: Check Safe Edit Policy

#### Diff Size

```bash
gh pr view [NUMBER] --json additions,deletions,changedFiles
```

Thresholds:
- ✅ Good if ≤ 10 files changed
- ⚠️ Warning if > 10 files changed
- ❌ Flag if > 20 files or > 1000 lines

#### Pre-Flight Verification

```bash
# Checkout PR branch
gh pr checkout [NUMBER]

# Run verification
npx tsc --noEmit
npm run test:smoke
```

### Step 4: Generate Review Summary

```
============================================
PR REVIEW: #[NUMBER]
============================================
Title: [PR Title]
Author: [Author]
Branch: [head] -> [base]
Files: [X] files (+[additions] -[deletions])

--- CLAUDE.md COMPLIANCE ---
Rule 1 (Pipeline Entry):     ✅ PASS / ❌ VIOLATION
Rule 2 (No New Endpoints):   ✅ PASS / ❌ VIOLATION
Rule 3 (No Route DB Writes): ✅ PASS / ❌ VIOLATION
Rule 4 (No Legacy Tables):   ✅ PASS / ❌ VIOLATION

--- SAFE EDIT POLICY ---
Diff Size: ✅ Reasonable / ⚠️ Large / ❌ Too Large
Files Changed: [X] (threshold: 10)
Lines Changed: [Y] (threshold: 500)

--- VERIFICATION ---
Type Check: ✅ / ❌ / ⏭️ Not Run
Tests: ✅ / ❌ / ⏭️ Not Run
Build: ✅ / ❌ / ⏭️ Not Run

--- RECOMMENDATION ---
[APPROVE / REQUEST_CHANGES / COMMENT]

Reason: [Brief explanation]
============================================
```

### Step 5: Suggest CLAUDE.md Updates

If the PR reveals a pattern that should be documented:

#### When to Suggest Updates

1. A bug that could have been prevented by a rule
2. A new pattern that should be standardized
3. A common mistake that keeps recurring
4. A new component or endpoint that should be registered

#### Update Format

```markdown
## Suggested CLAUDE.md Addition

Based on PR #[NUMBER], consider adding:

**Section:** [Where to add]

**Addition:**
```
[Exact text to add]
```

**Rationale:**
[Why this should be documented]
```

#### Auto-Commit CLAUDE.md Update

If the PR author or reviewer agrees:

```bash
# Create a follow-up commit
git checkout [PR_BRANCH]
git pull origin [PR_BRANCH]

# Edit CLAUDE.md with the addition
# ... make changes ...

git add CLAUDE.md
git commit -m "docs: update CLAUDE.md from PR #[NUMBER] learnings

- Added [brief description of addition]
- Prevents [type of issue] in future

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin [PR_BRANCH]
```

---

## Example Review Output

```
============================================
PR REVIEW: #42
============================================
Title: Add caching to prediction pipeline
Author: tommy
Branch: feature/artifact-caching -> main
Files: 4 files (+156 -23)

--- CLAUDE.md COMPLIANCE ---
Rule 1 (Pipeline Entry):     ✅ PASS
  - All changes within runPredictionPipeline.ts
Rule 2 (No New Endpoints):   ✅ PASS
  - No new API routes created
Rule 3 (No Route DB Writes): ✅ PASS
  - Cache writes in pipeline, not routes
Rule 4 (No Legacy Tables):   ✅ PASS
  - Uses artifact_cache (canonical)

--- SAFE EDIT POLICY ---
Diff Size: ✅ Reasonable
Files Changed: 4 (threshold: 10)
Lines Changed: 179 (threshold: 500)

--- VERIFICATION ---
Type Check: ✅ Passed
Tests: ✅ Passed (smoke)
Build: ⏭️ Not Run

--- RECOMMENDATION ---
APPROVE

The PR correctly implements caching within the canonical pipeline.
All changes follow CLAUDE.md guidelines.

--- SUGGESTED CLAUDE.MD UPDATE ---
None needed - PR follows existing patterns.
============================================
```

---

## Review Checklist (Quick Reference)

### For Reviewer

- [ ] No new prediction endpoints
- [ ] All predictions through `runPredictionPipeline()`
- [ ] No direct orchestrator calls from routes
- [ ] No writes to legacy tables
- [ ] Diff < 10 files, < 500 lines
- [ ] Type check passes
- [ ] Tests pass
- [ ] Commit messages are descriptive
- [ ] Changes match PR description

### For Author

- [ ] Ran `/verify` before submitting
- [ ] PR description explains what/why/how
- [ ] Tests added for new functionality
- [ ] CLAUDE.md updated if architectural change
- [ ] No debug code (console.log, etc.)

---

## Common Rejection Reasons

### ❌ New Prediction Endpoint

**Violation:** Creating new prediction endpoint without approval
**Solution:** Use existing endpoint with new mode, or get architectural approval

### ❌ Direct Orchestrator Call

**Violation:** Calling `orchestrator.predict()` directly from route
**Solution:** Route through `runPredictionPipeline()`

### ❌ Legacy Table Write

**Violation:** Writing to deprecated table (`component_results`)
**Solution:** Use canonical table (`run_component_results`)

### ❌ Mass Refactor

**Violation:** Changing 50+ files without ticket
**Solution:** Break into smaller PRs with incremental changes

### ❌ Missing Tests

**Violation:** New feature without test coverage
**Solution:** Add unit/integration tests

### ❌ Type Errors

**Violation:** PR has TypeScript type errors
**Solution:** Fix type errors before requesting review

---

## GitHub Integration

This command works with the Claude PR Review GitHub Action:

```yaml
# .github/workflows/claude-pr-review.yml
# Triggers on PR open and @claude comments
```

**GitHub Commands:**
- `@claude review` - Trigger full review
- `@claude check` - Run type check and tests
- `@claude suggest` - Suggest CLAUDE.md updates
- `@claude help` - Show available commands

**Setup:**
1. Add `ANTHROPIC_API_KEY` to repository secrets
2. Workflow auto-triggers on PR events

---

## Related Commands

- [/verify](./verify.md) - Quick verification
- [/pr-checklist](./pr-checklist.md) - Detailed PR checklist
- [/commit-push-pr](./commit-push-pr.md) - Create new PR

---

## Reference

- [CLAUDE.md](../../CLAUDE.md) § Non-Negotiable Rules
- [.github/workflows/claude-pr-review.yml](../../.github/workflows/claude-pr-review.yml) - GitHub Action
- [.claude/agents/refactor-guardian.md](../agents/refactor-guardian.md) - Refactor safety checks
