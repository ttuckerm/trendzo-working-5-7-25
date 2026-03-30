# Framework 2: Testing & Validation Framework

## Overview

Framework 2 provides 5 comprehensive testing methods to validate The Donna's prediction accuracy before beta testing. These tests ensure predictions are reliable, consistent, and accurate across different scenarios.

## The 5 Testing Methods

### 1. Historical Test
**What it tests**: Accuracy on videos with known outcomes

**How it works**:
1. Fetch 100 videos from database with confirmed DPS scores
2. Generate predictions using The Donna
3. Compare predictions vs actual DPS
4. Calculate accuracy metrics (MAE, RMSE, R², classification accuracy)

**When to run**: Before deploying new model versions

**Expected results**:
- MAE: ≤ 5 DPS points
- RMSE: ≤ 7 DPS points
- R²: ≥ 0.85
- Classification Accuracy: ≥ 85%

### 2. Live Tracking Test
**What it tests**: Real-world prediction accuracy over time

**How it works**:
1. Uses data from Framework 1 (ViralScrapingWorkflow)
2. Scrapes fresh videos → predicts → tracks for 24hr or 7day
3. Compares predicted vs actual DPS at final checkpoint
4. Aggregates accuracy metrics

**When to run**: After Framework 1 has been running for 24hr+

**Expected results**:
- MAE: ≤ 6 DPS points (live is harder than historical)
- Classification Accuracy: ≥ 80%
- Within Range: ≥ 75% of predictions

### 3. Synthetic A/B Test
**What it tests**: Ranking consistency and sensitivity

**How it works**:
1. Take a base video
2. Create variations (change caption, hashtags, hook)
3. Predict DPS for each variation
4. Verify predictions rank variations correctly

**When to run**: To test if The Donna can detect subtle differences

**Expected results**:
- Rank correlation: ≥ 0.90
- Better hooks → higher DPS
- Viral hashtags → higher DPS

*Status: Not yet implemented*

### 4. Cross-Platform Test
**What it tests**: Platform-agnostic prediction

**How it works**:
1. Find same content on TikTok and Instagram
2. Predict DPS for both
3. Verify predictions account for platform differences

**When to run**: Before expanding to Instagram/YouTube

**Expected results**:
- Consistent pattern identification
- Platform-specific adjustments
- Correlation: ≥ 0.70 between platforms

*Status: Not yet implemented*

### 5. Temporal Consistency Test
**What it tests**: Prediction stability over time

**How it works**:
1. Predict same video 10 times with identical input
2. Measure variance in predictions
3. Verify confidence scores are calibrated

**When to run**: After model updates

**Expected results**:
- Standard deviation: ≤ 2 DPS points
- Confidence scores accurate within ±5%

*Status: Not yet implemented*

## Implementation Status

| Test Method | Status | API Endpoint | Database Table |
|-------------|--------|--------------|----------------|
| 1. Historical Test | ✅ Complete | `/api/donna/test/run` | `test_results` |
| 2. Live Tracking Test | ✅ Complete | `/api/donna/test/run` | `test_results` |
| 3. Synthetic A/B Test | ⚠️ Planned | - | - |
| 4. Cross-Platform Test | ⚠️ Planned | - | - |
| 5. Temporal Consistency Test | ⚠️ Planned | - | - |

## Usage

### Run All Tests
```bash
curl -X POST http://localhost:3000/api/donna/test/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "all"
  }'
```

### Run Historical Test Only
```bash
curl -X POST http://localhost:3000/api/donna/test/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "historical",
    "config": {
      "sampleSize": 100,
      "minDPS": 50,
      "maxDPS": 90
    }
  }'
```

### Run Live Tracking Test
```bash
curl -X POST http://localhost:3000/api/donna/test/run \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "live-tracking",
    "config": {
      "duration": "24hr",
      "targetCount": 50,
      "scrapeInterval": 5
    }
  }'
```

## Test Results Structure

```typescript
{
  "success": true,
  "testType": "historical",
  "results": [
    {
      "testId": "hist-1699123456789",
      "testType": "1-historical",
      "testName": "Historical Validation Test",
      "status": "completed",
      "startedAt": "2025-11-07T10:30:00Z",
      "completedAt": "2025-11-07T10:35:00Z",

      "totalSamples": 100,
      "successfulPredictions": 98,
      "failedPredictions": 2,

      "meanAbsoluteError": 4.23,
      "rootMeanSquaredError": 6.15,
      "r2Score": 0.8912,
      "classificationAccuracy": 0.87,
      "withinRangePercent": 82.5,

      "details": {
        "predictions": [72.5, 68.3, ...],
        "actuals": [75.2, 65.8, ...],
        "errors": [2.7, 2.5, ...],
        "avgError": 4.23,
        "medianError": 3.8,
        "minError": 0.5,
        "maxError": 18.2
      },

      "errors": [
        "Video abc123: API timeout"
      ]
    }
  ]
}
```

## Database Schema

### `test_results` Table

```sql
CREATE TABLE test_results (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  test_id TEXT UNIQUE NOT NULL,
  test_type TEXT CHECK (test_type IN (
    '1-historical',
    '2-live-tracking',
    '3-synthetic-ab',
    '4-cross-platform',
    '5-temporal-consistency'
  )),
  test_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),

  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,

  total_samples INTEGER,
  successful_predictions INTEGER,
  failed_predictions INTEGER,

  mean_absolute_error DECIMAL(10,4),
  rmse DECIMAL(10,4),
  r2_score DECIMAL(10,6),
  classification_accuracy DECIMAL(10,6),
  within_range_percent DECIMAL(10,4),

  details JSONB,
  errors TEXT[]
);
```

## Querying Test Results

### Get Latest Test Results
```sql
SELECT
  test_name,
  status,
  mean_absolute_error,
  classification_accuracy,
  within_range_percent,
  completed_at
FROM test_results
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 5;
```

### Get Historical Test Trend
```sql
SELECT
  DATE(completed_at) as test_date,
  AVG(mean_absolute_error) as avg_mae,
  AVG(classification_accuracy) as avg_accuracy
FROM test_results
WHERE test_type = '1-historical'
  AND status = 'completed'
GROUP BY DATE(completed_at)
ORDER BY test_date DESC
LIMIT 30;
```

### Compare Test Types
```sql
SELECT
  test_type,
  COUNT(*) as total_runs,
  AVG(mean_absolute_error) as avg_mae,
  AVG(classification_accuracy) as avg_accuracy,
  AVG(within_range_percent) as avg_within_range
FROM test_results
WHERE status = 'completed'
GROUP BY test_type
ORDER BY test_type;
```

## Accuracy Metrics Explained

### Mean Absolute Error (MAE)
- **What it is**: Average absolute difference between predicted and actual DPS
- **Formula**: `Σ|predicted - actual| / n`
- **Good value**: ≤ 5 DPS points
- **Interpretation**: "On average, predictions are off by X DPS points"

### Root Mean Squared Error (RMSE)
- **What it is**: Square root of average squared errors
- **Formula**: `√(Σ(predicted - actual)² / n)`
- **Good value**: ≤ 7 DPS points
- **Interpretation**: Penalizes large errors more than MAE

### R² Score (Coefficient of Determination)
- **What it is**: How well predictions fit actual values
- **Formula**: `1 - (SS_residual / SS_total)`
- **Range**: 0 to 1 (higher is better)
- **Good value**: ≥ 0.85
- **Interpretation**: "The model explains X% of variance in DPS"

### Classification Accuracy
- **What it is**: % of correct viral/not-viral predictions
- **Formula**: `(correct_classifications / total) * 100`
- **Good value**: ≥ 85%
- **Interpretation**: "X% of viral predictions were correct"

### Within Range Percent
- **What it is**: % of predictions within ±10% of actual
- **Formula**: `(predictions_within_range / total) * 100`
- **Good value**: ≥ 80%
- **Interpretation**: "X% of predictions were close enough"

## Integration with Framework 1

Framework 2 leverages data from Framework 1 (Viral Scraping Workflow):

1. **Historical Test**: Uses `scraped_videos` table for old videos with known DPS
2. **Live Tracking Test**: Uses `prediction_validations` table from Framework 1
3. **Shared Infrastructure**: Both frameworks use The Donna API for predictions

## Testing Schedule

### Before Beta Launch
- Run all tests at least 3 times
- Ensure all metrics meet targets
- Fix any failing tests
- Document any edge cases

### After Beta Launch
- Run Historical Test: Weekly
- Run Live Tracking Test: Daily (automatic from Framework 1)
- Run Synthetic A/B: Monthly
- Run Cross-Platform: When expanding platforms
- Run Temporal Consistency: After model updates

## Troubleshooting

### Low Classification Accuracy
**Problem**: Accuracy < 80%

**Possible causes**:
- Model threshold (70 DPS) may be too strict
- Training data skewed towards high-DPS videos
- Features not capturing viral patterns

**Solutions**:
- Retrain model with more diverse data
- Adjust viral threshold based on distribution
- Add more pattern-based features

### High MAE but Good Classification
**Problem**: MAE > 10 but accuracy > 90%

**Interpretation**: Model is good at viral/not-viral but not precise on exact DPS

**Solutions**:
- Acceptable for classification tasks
- Improve if need precise DPS predictions
- Consider ensemble methods

### Low R² Score
**Problem**: R² < 0.70

**Possible causes**:
- High variance in data
- Model underfitting
- Missing important features

**Solutions**:
- Add more features (visual, audio)
- Try different model architectures
- Increase training data size

## Next Steps

### Implement Tests 3-5
1. **Synthetic A/B Test**:
   - Create caption variation generator
   - Build hashtag swapping logic
   - Implement ranking comparison

2. **Cross-Platform Test**:
   - Add Instagram scraper
   - Map TikTok → Instagram features
   - Calibrate platform adjustments

3. **Temporal Consistency Test**:
   - Run same prediction 10× in parallel
   - Measure variance
   - Test confidence calibration

### Advanced Features
- Automated testing on every model update
- A/B testing between model versions
- Confidence interval testing
- Outlier detection and analysis

## Related Documentation

- [Framework 1: Viral Scraping Workflow](./framework-1-viral-scraping-workflow.md)
- [UNIVERSAL_REASONING_ARCHITECTURE.md](../UNIVERSAL_REASONING_ARCHITECTURE.md)
- [DATASET_EXPANSION_COMPLETE.md](../DATASET_EXPANSION_COMPLETE.md)

## Support

For issues or questions:
1. Check `test_results` table for error details
2. Review test logs in Vercel/console
3. Compare metrics to expected targets
4. Run tests incrementally (start with sampleSize: 10)
