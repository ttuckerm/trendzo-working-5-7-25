# Tier-Based Prediction System Migration Guide

## Overview

The prediction system has been upgraded from exact score predictions to **tier-based classification** for improved accuracy and interpretability.

---

## What Changed

### OLD Format (Deprecated)
```json
{
  "predictedViralScore": 73,
  "predictedDPS": 73.2,
  "confidence": 0.85,
  "viralProbability": 0.85
}
```

### NEW Format (Current)
```json
{
  "predictedTier": "viral",
  "confidence": 0.87,
  "tierProbabilities": {
    "mega_viral": 0.05,
    "hyper_viral": 0.18,
    "viral": 0.64,
    "strong": 0.11,
    "average": 0.02
  },
  "reasoning": "Strong pattern match (8/9 Legos), matches Framework #1. Predicted Top 5% performance."
}
```

---

## Tier Definitions

| Tier | DPS Range | Percentile | Description |
|------|-----------|------------|-------------|
| **mega_viral** | 90-100 | Top 0.1% | Exceptional viral potential - extremely rare |
| **hyper_viral** | 80-89 | Top 1% | Very high viral potential - rare |
| **viral** | 70-79 | Top 5% | Strong viral potential - good odds |
| **strong** | 60-69 | Top 10% | Solid performance expected |
| **average** | 0-59 | Below Top 10% | Standard performance expected |

---

## Pattern Matching Logic

The tier prediction is based on:

1. **Pattern Match Count** (Idea Legos matched):
   - **Strong match** (8-9 Legos) → `viral` or `hyper_viral` tier
   - **Medium match** (6-7 Legos) → `strong` tier  
   - **Weak match** (4-5 Legos) → `average` tier

2. **LLM Consensus Score**: Adjusts probability within each tier

---

## Database Changes

### New Columns Added to `pre_content_predictions`

```sql
-- Tier prediction fields
predicted_tier TEXT CHECK (predicted_tier IN ('mega_viral', 'hyper_viral', 'viral', 'strong', 'average'))
tier_probabilities JSONB
tier_confidence DECIMAL(4, 3)
tier_reasoning TEXT
pattern_lego_match_count INTEGER

-- Actual performance (for accuracy tracking)
actual_tier TEXT
tier_prediction_correct BOOLEAN
```

### Migration File

Run: `supabase/migrations/20251007_tier_based_predictions.sql`

---

## Accuracy Tracking Changes

### OLD Metrics (Deprecated)
- `avgPredictionError`: Average absolute error between predicted and actual DPS
- `predictionCorrelation`: Correlation coefficient between predicted and actual DPS

### NEW Metrics (Current)
- `tierAccuracyPercentage`: % of exact tier matches
- `tierCloseAccuracyPercentage`: % of predictions within one tier
- `avgTierConfidence`: Average confidence in tier predictions
- `avgLegoMatches`: Average number of Idea Legos matched

### Accuracy Calculation

**Success** = `predicted_tier === actual_tier`

Example: If we predict "viral" and the content actually performs in the "viral" tier (DPS 70-79), the prediction is **correct**.

**Target Accuracy**: 80-90% tier prediction accuracy means we correctly predict the tier 80-90% of the time.

---

## API Response Structure

```typescript
interface PreContentPredictionResponse {
  // NEW TIER-BASED FIELDS
  predictedTier: 'mega_viral' | 'hyper_viral' | 'viral' | 'strong' | 'average';
  confidence: number;  // 0-1 confidence in predicted tier
  tierProbabilities: {
    mega_viral: number;
    hyper_viral: number;
    viral: number;
    strong: number;
    average: number;
  };
  reasoning: string;  // Human-readable explanation

  // LEGACY FIELDS (deprecated but still present for backward compatibility)
  predictedViralScore?: number;  // @deprecated
  predictedDPS?: number;         // @deprecated

  // Unchanged fields
  predictions: PredictionEstimates;
  breakdown: PredictionBreakdown;
  ideaLegos: IdeaLegos;
  recommendations: string[];
  topMatchingPatterns: PatternMatch[];
}
```

---

## Migration Checklist

### Backend
- ✅ Update `pre_content_predictions` table schema
- ✅ Create tier classification utility (`tier-classifier.ts`)
- ✅ Update prediction service to output tiers
- ✅ Update accuracy stats view
- ✅ Update `updatePredictionWithActual()` to classify actual tier

### Frontend (if consuming the API)
- [ ] Update UI to display `predictedTier` instead of `predictedViralScore`
- [ ] Add tier probability visualization
- [ ] Update accuracy dashboards to show tier accuracy
- [ ] Remove or mark deprecated exact score displays

### Testing
- [x] Update test scripts to display tier predictions
- [ ] Test tier classification logic
- [ ] Verify accuracy tracking with real data

---

## Example Usage

### Making a Prediction

```typescript
import { predictPreContentSuccess } from '@/lib/services/pre-content/pre-content-prediction-service';

const prediction = await predictPreContentSuccess({
  script: "Your script here...",
  niche: "fitness",
  platform: "tiktok"
});

console.log(`Predicted Tier: ${prediction.predictedTier}`);
console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
console.log(`Reasoning: ${prediction.reasoning}`);
```

### Updating with Actual Performance

```typescript
import { 
  updatePredictionWithActual 
} from '@/lib/services/pre-content/pre-content-prediction-service';

// After content is published and has actual DPS
await updatePredictionWithActual(
  predictionId,
  videoId,
  actualDPS  // e.g., 75.3
);

// This will automatically:
// 1. Classify actualDPS to actual tier (e.g., "viral" for DPS 75.3)
// 2. Compare with predicted tier
// 3. Set tier_prediction_correct = true/false
```

### Getting Accuracy Statistics

```typescript
import { 
  getPredictionAccuracyStats 
} from '@/lib/services/pre-content/pre-content-prediction-service';

const stats = await getPredictionAccuracyStats('fitness', 'tiktok');

console.log(`Tier Accuracy: ${stats.tierAccuracyPercentage}%`);
console.log(`Close Accuracy: ${stats.tierCloseAccuracyPercentage}%`);
console.log(`Avg Confidence: ${(stats.avgTierConfidence * 100).toFixed(1)}%`);
```

---

## Backward Compatibility

The legacy fields (`predictedViralScore`, `predictedDPS`) are **still included** in the response for backward compatibility, but they are marked as `@deprecated`.

**Recommendation**: Update consuming code to use the new tier-based fields as soon as possible.

---

## Benefits of Tier-Based Classification

1. **More Interpretable**: "Viral tier" is easier to understand than "DPS 73.2"
2. **Better Accuracy**: Predicting a tier range is more achievable than exact scores
3. **Action-Oriented**: Each tier implies specific expectations and strategies
4. **Probabilistic**: Shows confidence distribution across all tiers
5. **Flexible**: Can adjust tier boundaries based on platform/niche

---

## Questions?

See the implementation in:
- `src/lib/utils/tier-classifier.ts` - Core tier classification logic
- `src/lib/services/pre-content/pre-content-prediction-service.ts` - Prediction service
- `supabase/migrations/20251007_tier_based_predictions.sql` - Database migration










