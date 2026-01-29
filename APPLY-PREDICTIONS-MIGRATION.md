# Fix Predictions Table Schema - Manual Migration Guide

## Problem
The `predictions` table has an OLD schema from a previous system that's incompatible with the new FEAT-007 pre-content prediction API.

## Solution
Apply the migration: `20251008_predictions_table.sql`

---

## Method 1: Via Supabase Dashboard (RECOMMENDED)

1. Go to: https://vyeiyccrageeckeehyhj.supabase.co
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy-paste this SQL:

```sql
-- Step 1: Drop old predictions table
DROP TABLE IF EXISTS predictions CASCADE;
DROP VIEW IF EXISTS prediction_accuracy CASCADE;

-- Step 2: Create new predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input
  script TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  niche VARCHAR(100) NOT NULL,

  -- Prediction
  predicted_dps NUMERIC(10, 2),
  predicted_classification VARCHAR(50),
  confidence NUMERIC(5, 4), -- 0.0-1.0

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

-- View: Prediction accuracy by niche
CREATE OR REPLACE VIEW prediction_accuracy AS
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

5. Click **Run**
6. Verify success: Should see "Success. No rows returned"

---

## Method 2: Via Supabase CLI

If you have Supabase CLI installed:

```bash
cd c:\Projects\CleanCopy
supabase db reset
```

This will apply ALL migrations in order, including the predictions table migration.

---

## Verification

After applying the migration, run this verification script:

```bash
node scripts/verify-predictions-migration.js
```

Expected output:
✅ Table has correct columns: script, platform, niche, predicted_dps, predicted_classification, confidence, extraction_insights, top_pattern_matches, recommendations

---

## Next Steps

Once migration is applied:
1. Test API insert with a sample prediction
2. Proceed to Priority 3: Validate on 10 known videos
