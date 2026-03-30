# DPS Classification Threshold Fix

**Date:** 2025-10-08
**Issue:** Backend classification thresholds miscalibrated
**Status:** ✅ FIXED

---

## 🔍 Problem Identified

### Root Cause
Classification was based on **PERCENTILE RANK** instead of **VIRAL SCORE**.

```typescript
// BEFORE (WRONG):
const classification = classifyVirality(percentileRank); // ❌ Uses percentile

// AFTER (CORRECT):
const classification = classifyVirality(viralScore); // ✅ Uses score
```

### Evidence
**Current State (Before Fix):**
- 28 videos labeled "mega-viral" with scores 66-80 (avg: 73.72)
- 4 videos labeled "viral" with scores 61-71 (avg: 68.09)
- 29 videos labeled "normal" with scores 34-62 (avg: 43.85)

**Expected Behavior:**
- mega-viral: viral_score >= 80
- viral: viral_score >= 70 AND < 80
- normal: viral_score < 70

---

## 🛠️ Changes Made

### 1. Updated Threshold Constants
**File:** [dps-calculation-engine.ts:118-122](src/lib/services/dps/dps-calculation-engine.ts#L118-122)

```typescript
// BEFORE:
export const VIRALITY_THRESHOLDS = {
  MEGA_VIRAL: 99.9,   // Top 0.1% (percentile)
  HYPER_VIRAL: 99.0,  // Top 1% (percentile)
  VIRAL: 95.0,        // Top 5% (percentile)
  NORMAL: 0,
} as const;

// AFTER:
export const VIRALITY_THRESHOLDS = {
  MEGA_VIRAL: 80,   // Score-based threshold
  VIRAL: 70,        // Score-based threshold
  NORMAL: 0,
} as const;
```

### 2. Updated Classification Function
**File:** [dps-calculation-engine.ts:226-230](src/lib/services/dps/dps-calculation-engine.ts#L226-230)

```typescript
// BEFORE:
export function classifyVirality(percentile: number): 'normal' | 'viral' | 'hyper-viral' | 'mega-viral' {
  if (percentile >= VIRALITY_THRESHOLDS.MEGA_VIRAL) return 'mega-viral';
  if (percentile >= VIRALITY_THRESHOLDS.HYPER_VIRAL) return 'hyper-viral';
  if (percentile >= VIRALITY_THRESHOLDS.VIRAL) return 'viral';
  return 'normal';
}

// AFTER:
export function classifyVirality(viralScore: number): 'normal' | 'viral' | 'mega-viral' {
  if (viralScore >= VIRALITY_THRESHOLDS.MEGA_VIRAL) return 'mega-viral';
  if (viralScore >= VIRALITY_THRESHOLDS.VIRAL) return 'viral';
  return 'normal';
}
```

### 3. Updated Classification Call
**File:** [dps-calculation-engine.ts:443](src/lib/services/dps/dps-calculation-engine.ts#L443)

```typescript
// BEFORE:
const classification = classifyVirality(percentileRank);

// AFTER:
const classification = classifyVirality(viralScore); // Use viral score, not percentile
```

### 4. Removed hyper-viral Category
**Files Modified:**
- [dps-calculation-engine.ts:36](src/lib/services/dps/dps-calculation-engine.ts#L36) - DPSResult interface
- [dps-database-service.ts:387](src/lib/services/dps/dps-database-service.ts#L387) - Stats distribution

**Rationale:** Simplified to 3 tiers matching DPS documentation standards.

---

## 📊 Impact Analysis

### Videos Affected: 28 out of 61 (45.9%)

**Classification Changes:**
```
mega-viral → viral:   24 videos (scores 70-79)
mega-viral → normal:   2 videos (scores 66-69)
viral → normal:        2 videos (scores 61-69)
```

### Sample Changes:
| Video ID | Old | New | Score | Percentile |
|----------|-----|-----|-------|------------|
| 7548964286287170847 | mega-viral | viral | 73.02 | 100 |
| 7556261323248635150 | mega-viral | viral | 79.32 | 100 |
| 7554477254974180622 | mega-viral | viral | 78.81 | 100 |
| 7553976195860270358 | mega-viral | normal | 69.90 | 100 |
| 7553639891611962636 | viral | normal | 68.28 | 97.63 |

---

## ✅ User Interface Confirmation

**CRITICAL:** This fix does NOT change the user-facing interface.

- ✅ Users still only see classification labels (not scores)
- ✅ No frontend changes required
- ✅ No API response structure changes
- ✅ Purely backend classification logic fix

**User Experience:**
- Users will see more accurate classifications
- Videos previously mislabeled as "mega-viral" will now show correct tier
- No breaking changes to any UI components

---

## 🔄 Next Steps Required

### 1. Re-run Pattern Extraction (FEAT-003)
**Why:** Pattern extraction filters videos by classification. With corrected classifications, patterns may change.

**Command:**
```bash
curl -X POST http://localhost:3002/api/patterns/extract \
  -H "Content-Type: application/json" \
  -d '{"niche":"personal-finance","minDPSScore":70,"dateRange":"365d","limit":50}'
```

### 2. Re-calculate DPS for Existing Videos
**Why:** Existing `dps_calculations` records still have old classifications.

**Command:**
```bash
node scripts/batch-calculate-dps.js
```

### 3. Verify FEAT-007 Still Works
**Why:** Pre-content prediction relies on pattern matching with classifications.

**Command:**
```bash
node scripts/test-pre-content-prediction.js
```

---

## 🧪 Testing

### Manual Test: Verify New Classification Logic
```bash
node scripts/analyze-classification-mismatch.js
```

**Expected Results:**
- All mega-viral videos should have score >= 80
- All viral videos should have score >= 70 AND < 80
- All normal videos should have score < 70

### Integration Test: DPS Calculation
```bash
npm test -- dps-calculation-engine.test
```

---

## 📝 Technical Notes

### Why Percentile vs Score?

**Percentile-based (OLD):**
- ✅ Relative to cohort (adaptive)
- ❌ Same score can get different classification based on cohort
- ❌ Inconsistent across time periods
- ❌ Confusing for users ("Why did my 75 score become 'normal'?")

**Score-based (NEW):**
- ✅ Absolute thresholds (predictable)
- ✅ Consistent across all cohorts
- ✅ Easier to explain to users
- ✅ Matches DPS documentation standards
- ❌ Less adaptive to cohort shifts

**Decision:** Score-based is more appropriate for a classification system. Percentile rank is still calculated and stored for analytics purposes.

---

## 🔒 Backward Compatibility

### Database Schema
✅ No changes required - `classification` column already exists as TEXT

### API Responses
✅ No breaking changes - response structure identical

### Existing Data
⚠️ Existing `dps_calculations` records will have old classifications. Run batch recalculation to update.

---

## 📚 Related Documentation

- [DPS Calculation Engine](src/lib/services/dps/README.md)
- [FEAT-002 Implementation Summary](FEAT-002-IMPLEMENTATION-SUMMARY.md)
- [FEAT-003 Pattern Extraction](FEAT-003-IMPLEMENTATION-SUMMARY.md)

---

## ✅ Completion Checklist

- [x] Identified root cause (percentile vs score)
- [x] Updated threshold constants
- [x] Updated classifyVirality function
- [x] Updated classification call in calculateDPS
- [x] Removed hyper-viral category
- [x] Verified no user-facing changes
- [x] Analyzed impact (28 videos affected)
- [ ] Re-run pattern extraction
- [ ] Re-calculate existing DPS scores
- [ ] Verify FEAT-007 predictions still work
- [ ] Run integration tests

---

**Fix Applied By:** Claude Code Assistant
**Reviewed By:** [Pending]
**Deployed:** [Pending]
