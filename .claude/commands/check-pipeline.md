# /check-pipeline

End-to-end health check for Trendzo prediction system.

## Usage

```
/check-pipeline
```

---

## Checks Performed

### 1. TypeScript Type Check

```bash
npx tsc --noEmit
```

**Pass Criteria:** Exit code 0, no type errors

### 2. Smoke Tests

```bash
npm run test:smoke
```

**Pass Criteria:** All tests pass (runs critical suites only)

### 3. API Endpoints (if dev server running)

Check if server is available:
```bash
curl -s http://localhost:3000/api/health || echo "Server not running"
```

If running, test prediction endpoint:
```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"videoId": "test_health_check"}'
```

**Pass Criteria:** Response includes `run_id` and doesn't error

### 4. Database Connectivity

```sql
-- Test read access
SELECT COUNT(*) FROM prediction_runs WHERE created_at > NOW() - INTERVAL '24 hours';

-- Test run_component_results access
SELECT COUNT(*) FROM run_component_results WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check for recent failures
SELECT COUNT(*) as failures
FROM prediction_runs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '1 hour';
```

**Pass Criteria:** Queries execute without error, failure rate < 10%

### 5. Component Registry Check

Verify all expected components are registered:

```typescript
// Check kai-orchestrator.ts for registered components
const expectedComponents = [
  'feature-extraction',
  'xgboost',
  'gpt4',
  'gemini',
  'claude',
  // ... all 15 active components
];
```

**Pass Criteria:** All active components registered and enabled

### 6. Environment Variables

Check required env vars are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_AI_API_KEY` (for Gemini)
- `ANTHROPIC_API_KEY` (for Claude)

```bash
# Check if vars are set (don't print values)
[ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && echo "✅ SUPABASE_URL" || echo "❌ SUPABASE_URL"
[ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "✅ SERVICE_KEY" || echo "❌ SERVICE_KEY"
[ -n "$OPENAI_API_KEY" ] && echo "✅ OPENAI_KEY" || echo "❌ OPENAI_KEY"
```

**Pass Criteria:** All required env vars set

---

## Output Report

```
============================================
TRENDZO PIPELINE HEALTH CHECK
============================================
Date: [timestamp]
Branch: [current git branch]

--- CHECKS ---
TypeScript:     ✅ PASS (0 errors)
Smoke Tests:    ✅ PASS (2/2 suites)
API Health:     ✅ PASS / ⏭️ SKIP (server not running)
Database:       ✅ PASS (connected, 0 failures in last hour)
Components:     ✅ PASS (15/15 registered)
Environment:    ✅ PASS (5/5 vars set)

--- METRICS ---
Predictions (24h):      142
Success Rate:           98.6%
Avg Latency:            2.3s
Component Failures:     3

--- RECENT ERRORS ---
[Last 3 errors from prediction_runs where status='failed']

============================================
Overall Status: HEALTHY / DEGRADED / CRITICAL
============================================
```

---

## Status Definitions

| Status | Criteria |
|--------|----------|
| **HEALTHY** | All checks pass, success rate > 95% |
| **DEGRADED** | 1-2 non-critical checks fail, or success rate 80-95% |
| **CRITICAL** | Type check fails, tests fail, or success rate < 80% |

---

## Quick Fix Guide

### TypeScript Errors
```bash
npx tsc --noEmit 2>&1 | head -20
# Fix the errors shown
```

### Test Failures
```bash
npm run test:smoke -- --verbose
# Check which test failed and why
```

### Database Connection Issues
```bash
# Verify Supabase credentials
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

### Missing Environment Variables
```bash
# Copy from .env.example if available
cp .env.example .env.local
# Edit and add missing values
```

---

## Automated Health Check Script

For CI/CD integration:

```bash
#!/bin/bash
# scripts/health-check.sh

set -e

echo "Running pipeline health check..."

# Type check
echo "1. Type check..."
npx tsc --noEmit

# Tests
echo "2. Smoke tests..."
npm run test:smoke

# Build
echo "3. Build check..."
npm run build

echo "✅ All checks passed!"
```

---

## Related Commands

- [/run-prediction](./run-prediction.md) - Test single prediction
- [/verify](./verify.md) - Quick verification
- [/debug-prediction](./debug-prediction.md) - Debug failures

---

## Reference

- [CLAUDE.md](../../CLAUDE.md) § Required Verification Steps
- [.claude/agents/verify-app.md](../agents/verify-app.md) - Verification agent
