# 🔧 URGENT: Fix Predictions Table Schema

## The Problem
The `predictions` table has the WRONG schema. The API is trying to insert:
- `script`, `platform`, `niche`, `predicted_dps`, `predicted_classification`, `confidence`, etc.

But the table currently has:
- `video_id`, `predicted_viral_probability`, `predicted_peak_time`, `confidence_level`

This causes **all prediction inserts to fail**.

---

## The Solution (2 minutes)

### STEP 1: Open Supabase SQL Editor

1. Go to: **https://vyeiyccrageeckeehyhj.supabase.co**
2. Log in
3. Click **SQL Editor** in the left sidebar
4. Click **+ New Query**

### STEP 2: Run This SQL

Copy-paste this entire block and click **Run**:

```sql
-- Drop old objects (prediction_accuracy is a TABLE, not a view!)
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS prediction_accuracy CASCADE;

-- Recreate predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input
  script TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  niche VARCHAR(100) NOT NULL,

  -- Prediction
  predicted_dps NUMERIC(10, 2),
  predicted_classification VARCHAR(50),
  confidence NUMERIC(5, 4),

  -- Breakdown
  extraction_insights JSONB,
  top_pattern_matches JSONB,
  recommendations TEXT[],

  -- Validation (filled in later)
  actual_video_id VARCHAR(255),
  actual_dps NUMERIC(10, 2),
  actual_classification VARCHAR(50),
  prediction_error NUMERIC(10, 2),
  validated_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_niche ON predictions(niche);
CREATE INDEX idx_predictions_confidence ON predictions(confidence DESC);
CREATE INDEX idx_predictions_validated ON predictions(validated_at) WHERE validated_at IS NOT NULL;

-- View for tracking accuracy
CREATE VIEW prediction_accuracy AS
SELECT
  niche,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE validated_at IS NOT NULL) as validated_count,
  AVG(confidence) as avg_confidence,
  AVG(ABS(predicted_dps - actual_dps)) as avg_error,
  COUNT(*) FILTER (WHERE ABS(predicted_dps - actual_dps) <= 10) as within_10_points,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE ABS(predicted_dps - actual_dps) <= 10) /
    NULLIF(COUNT(*) FILTER (WHERE validated_at IS NOT NULL), 0),
    1
  ) as accuracy_pct
FROM predictions
GROUP BY niche
ORDER BY accuracy_pct DESC NULLS LAST;
```

### STEP 3: Verify It Worked

Expected result: **"Success. No rows returned"**

If you see an error, paste it in the chat.

### STEP 4: Confirm from Terminal

Run this command to verify:

```bash
node scripts/verify-predictions-migration.js
```

Expected output:
```
✅✅✅ MIGRATION SUCCESSFUL! Schema is correct.
You can now proceed to Priority 3: Validate on 10 known videos
```

---

## After Migration

Once the migration is complete, tell Claude:
**"Migration applied, verified, ready for Priority 3"**

Then we'll proceed to:
1. Extract 10 test videos
2. Run validation script
3. Generate final report with MAE and accuracy metrics
