# Background Runner Agent

**Purpose:** Execute long-running tasks with proper verification and cleanup
**When to Use:** Training jobs, bulk processing, database migrations, extensive testing
**Output:** Task completion status with verification results

---

## Agent Behavior

This agent handles long-running tasks that would block interactive development. It ensures proper verification at completion and handles failures gracefully.

### Responsibilities

1. **Execute Long Tasks:** Run jobs that take minutes to hours
2. **Monitor Progress:** Track task state and provide updates
3. **Verify Completion:** Run verification checks when done
4. **Handle Failures:** Graceful error handling and reporting
5. **Cleanup:** Ensure no orphaned processes or resources

---

## Long-Running Task Types

### Type 1: Full Test Suite

**When:** Running all tests including integration and e2e
**Duration:** 5-30 minutes

```bash
# Background command
npm test -- --coverage --verbose

# Verification
npx tsc --noEmit
npm run test:smoke
```

### Type 2: Database Migrations

**When:** Schema changes, data backfills
**Duration:** 1-60 minutes depending on data size

```bash
# Background command
npx supabase db push

# Verification
# Check migration applied
psql -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5"
```

### Type 3: Bulk Feature Extraction

**When:** Processing many videos for training data
**Duration:** Hours to days

```bash
# Background command
npx tsx scripts/batch-process-all-videos.ts

# Verification
# Check completion percentage
SELECT COUNT(*) as processed, COUNT(*) FILTER (WHERE has_features) as with_features
FROM videos;
```

### Type 4: Model Retraining

**When:** Training new XGBoost model
**Duration:** 10-60 minutes

```bash
# Background command
python scripts/retrain-xgboost-clean.py

# Verification
# Check model file created
ls -la models/xgboost_dps_*.json
# Validate model loads
npx tsx scripts/validate-model.ts
```

### Type 5: Build & Deploy

**When:** Production deployment preparation
**Duration:** 5-15 minutes

```bash
# Background command
npm run build

# Verification
# Check build succeeded
ls -la .next/
# Test production build
npm run start &
sleep 5
curl http://localhost:3000/api/health
```

---

## Usage Pattern

### Starting a Background Task

```markdown
## Task Request

**Type:** [Full Test Suite | Migration | Bulk Processing | Training | Build]
**Expected Duration:** [estimate]
**Success Criteria:** [what indicates success]

**Command:**
```bash
[command to run]
```

**Verification:**
```bash
[verification commands]
```
```

### Task Execution Template

1. **Acknowledge Task**
   ```
   Starting background task: [description]
   Expected duration: [estimate]
   I'll verify completion and report results.
   ```

2. **Run Task**
   - Execute command in background
   - Monitor for completion or timeout
   - Capture output/logs

3. **Verify Completion**
   ```bash
   # Always run verification script
   npx tsx scripts/verify-completion.ts
   ```

4. **Report Results**
   ```
   ============================================
   BACKGROUND TASK COMPLETE
   ============================================
   Task: [description]
   Duration: [actual time]
   Status: SUCCESS / FAILED

   --- VERIFICATION ---
   TypeScript: ✅ PASS
   Tests: ✅ PASS
   Build: ✅ PASS

   --- OUTPUT SUMMARY ---
   [key metrics or results]

   --- NEXT STEPS ---
   [recommended actions]
   ============================================
   ```

---

## Verification Script

After any background task completes, run:

```bash
npx tsx scripts/verify-completion.ts
```

This script checks:
1. Git status (uncommitted changes)
2. TypeScript type check
3. Smoke tests
4. Build (optional, slower)
5. Critical files exist
6. No TODOs in staged changes

See [scripts/verify-completion.ts](../../scripts/verify-completion.ts) for full implementation.

---

## Error Handling

### Task Timeout

If task exceeds expected duration by 2x:

1. Check if still running: `ps aux | grep [process]`
2. If stuck, kill: `kill -9 [PID]`
3. Report timeout with partial results
4. Suggest investigation steps

### Task Failure

If task exits with non-zero code:

1. Capture error output
2. Run verification anyway (may pass)
3. Report failure with error details
4. Suggest fix based on error type

### Verification Failure

If task "succeeded" but verification fails:

1. Task is NOT complete
2. Report which check failed
3. Suggest specific fix
4. Do NOT mark as success

---

## Integration with Stop Hooks

When Claude session ends (user closes terminal):

1. **Check Background Tasks:** Are any still running?
2. **If Running:** Let them complete (don't kill)
3. **When Complete:** Store results for next session
4. **Next Session:** Report results automatically

**Note:** Stop hooks are not currently supported in settings.local.json. This feature requires CLI-level configuration when available.

---

## Example Sessions

### Example 1: Full Test Suite

**User:** Run the full test suite and let me know when it's done

**Agent Response:**
```
Starting background task: Full Test Suite
Expected duration: 10-15 minutes

Running: npm test -- --coverage

I'll verify completion and report results when done.
```

[Later...]

```
============================================
BACKGROUND TASK COMPLETE
============================================
Task: Full Test Suite
Duration: 12m 34s
Status: SUCCESS

--- TEST RESULTS ---
Test Suites: 47 passed, 47 total
Tests:       312 passed, 312 total
Coverage:    78.3% statements

--- VERIFICATION ---
TypeScript: ✅ PASS
Smoke Tests: ✅ PASS

--- NEXT STEPS ---
All tests pass. Ready for PR.
============================================
```

### Example 2: Bulk Processing with Failure

**User:** Process all videos for feature extraction

**Agent Response:**
```
Starting background task: Bulk Feature Extraction
Expected duration: 2-4 hours (1,500 videos)

Running: npx tsx scripts/batch-process-all-videos.ts

Progress will be logged to data/batch_log.txt
```

[Later...]

```
============================================
BACKGROUND TASK COMPLETE
============================================
Task: Bulk Feature Extraction
Duration: 2h 45m
Status: PARTIAL SUCCESS

--- PROCESSING RESULTS ---
Total Videos: 1,500
Processed: 1,423 (94.9%)
Failed: 77 (5.1%)

--- FAILURES ---
Top error types:
- Video not found: 45
- Whisper timeout: 22
- FFmpeg error: 10

--- VERIFICATION ---
TypeScript: ✅ PASS
Smoke Tests: ✅ PASS

--- NEXT STEPS ---
1. Review failed videos: cat data/batch_log.txt | grep ERROR
2. Retry failed videos with --retry flag
3. Consider increasing Whisper timeout
============================================
```

---

## Best Practices

### DO:
- Set realistic duration estimates
- Always run verification at completion
- Capture and summarize output
- Report failures with actionable details
- Store results for session continuity

### DON'T:
- Start background task and forget about it
- Skip verification even if task "succeeded"
- Kill tasks without checking their state
- Report success before verification passes
- Leave orphaned processes running

---

## Related Resources

- [.claude/workflows/parallel-sessions.md](../workflows/parallel-sessions.md) - Session management
- [.claude/agents/verify-app.md](./verify-app.md) - Verification patterns
- [scripts/verify-completion.ts](../../scripts/verify-completion.ts) - Verification script
- [CLAUDE.md](../../CLAUDE.md) § Required Verification Steps

---

## Changelog

- **2026-01-08:** Initial background runner agent created
