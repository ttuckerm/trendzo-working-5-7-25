# Tier-Based Prediction System - Quick Reference

## 🎯 What Changed

**Before:** Exact score predictions (e.g., "Viral Score: 73")  
**After:** Tier-based classification (e.g., "Viral Tier with 87% confidence")

---

## 📊 Tier Definitions

```
MEGA_VIRAL  ██████████ 90-100 DPS | Top 0.1%  | Exceptional
HYPER_VIRAL ████████   80-89 DPS  | Top 1%    | Very High
VIRAL       ██████     70-79 DPS  | Top 5%    | Strong
STRONG      ████       60-69 DPS  | Top 10%   | Solid
AVERAGE     ██         0-59 DPS   | <Top 10%  | Standard
```

---

## 🔍 Pattern Matching Logic

```
8-9 Legos matched → VIRAL/HYPER_VIRAL tier
6-7 Legos matched → STRONG tier
4-5 Legos matched → AVERAGE tier

+ LLM consensus adjusts probabilities
```

---

## 📝 Example Response

```json
{
  "predictedTier": "viral",
  "confidence": 0.87,
  "tierProbabilities": {
    "mega_viral": 0.05,
    "hyper_viral": 0.18,
    "viral": 0.64,      ← Most likely
    "strong": 0.11,
    "average": 0.02
  },
  "reasoning": "Strong pattern match (8/9 Legos), matches Framework #1"
}
```

---

## ✅ Accuracy Tracking

**Success** = Predicted tier matches actual tier

Example:
- Predict: `"viral"` (70-79 DPS)
- Actual: 75.3 DPS → `"viral"` tier
- Result: ✅ **CORRECT**

**Target:** 80-90% tier accuracy

---

## 🗄️ Database Migration

```bash
# Run migration
supabase db push

# Or manually
psql $DB_URL -f supabase/migrations/20251007_tier_based_predictions.sql
```

**New columns:**
- `predicted_tier`
- `tier_probabilities`
- `tier_confidence`
- `tier_reasoning`
- `actual_tier`
- `tier_prediction_correct`

---

## 🧪 Testing

```bash
node scripts/test-pre-content-prediction.js
```

Expected output:
```
🎯 PREDICTED TIER: VIRAL
🎲 CONFIDENCE: 87.0%
💭 REASONING: Strong pattern match (8/9 Legos)...

📊 TIER PROBABILITIES:
   viral: 64.0% ████████████████████████████████
```

---

## 📚 Files Changed

| File | Change |
|------|--------|
| `src/lib/utils/tier-classifier.ts` | ✨ NEW - Core logic |
| `src/types/pre-content-prediction.ts` | ✏️ Updated types |
| `src/lib/services/pre-content/pre-content-prediction-service.ts` | ✏️ Tier predictions |
| `src/app/api/predict/pre-content/route.ts` | ✏️ Updated logging |
| `supabase/migrations/20251007_tier_based_predictions.sql` | ✨ NEW - DB schema |
| `scripts/test-pre-content-prediction.js` | ✏️ Display tiers |

---

## 🔄 Backward Compatibility

Legacy fields **still present** but deprecated:
- `predictedViralScore` → Use `predictedTier` instead
- `predictedDPS` → Use `tierProbabilities` instead

---

## 📖 Full Documentation

- **Migration Guide:** `TIER_PREDICTION_MIGRATION_GUIDE.md`
- **Implementation Summary:** `TIER_PREDICTION_IMPLEMENTATION_SUMMARY.md`
- **Quick Reference:** `TIER_PREDICTION_QUICK_REFERENCE.md` (this file)

---

**Status:** ✅ COMPLETE & READY FOR DEPLOYMENT










