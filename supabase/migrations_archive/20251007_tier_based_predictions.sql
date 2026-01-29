-- ============================================================================
-- TIER-BASED PREDICTION SYSTEM MIGRATION
-- ============================================================================
-- Adds tier-based classification columns to pre_content_predictions
-- Updates accuracy tracking to measure tier prediction accuracy instead of exact DPS
-- Migration Date: 2025-10-07
-- ============================================================================

-- Add new tier-based columns to pre_content_predictions table
ALTER TABLE public.pre_content_predictions
  ADD COLUMN IF NOT EXISTS predicted_tier TEXT CHECK (predicted_tier IN ('mega_viral', 'hyper_viral', 'viral', 'strong', 'average')),
  ADD COLUMN IF NOT EXISTS tier_probabilities JSONB,
  ADD COLUMN IF NOT EXISTS tier_confidence DECIMAL(4, 3) CHECK (tier_confidence >= 0 AND tier_confidence <= 1),
  ADD COLUMN IF NOT EXISTS tier_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS pattern_lego_match_count INTEGER,
  
  -- Actual performance tier (filled when content is published)
  ADD COLUMN IF NOT EXISTS actual_tier TEXT CHECK (actual_tier IN ('mega_viral', 'hyper_viral', 'viral', 'strong', 'average')),
  ADD COLUMN IF NOT EXISTS tier_prediction_correct BOOLEAN;

-- Make legacy columns nullable (for backward compatibility)
ALTER TABLE public.pre_content_predictions
  ALTER COLUMN predicted_viral_score DROP NOT NULL,
  ALTER COLUMN predicted_dps DROP NOT NULL;

-- Create indexes for tier-based queries
CREATE INDEX IF NOT EXISTS idx_pre_content_predictions_predicted_tier 
  ON public.pre_content_predictions(predicted_tier);

CREATE INDEX IF NOT EXISTS idx_pre_content_predictions_actual_tier 
  ON public.pre_content_predictions(actual_tier) 
  WHERE actual_tier IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pre_content_predictions_tier_correct 
  ON public.pre_content_predictions(tier_prediction_correct) 
  WHERE tier_prediction_correct IS NOT NULL;

-- Create composite index for accuracy analysis
CREATE INDEX IF NOT EXISTS idx_pre_content_predictions_tier_accuracy 
  ON public.pre_content_predictions(niche, platform, predicted_tier, actual_tier) 
  WHERE actual_tier IS NOT NULL;

-- ============================================================================
-- Update accuracy stats view to track tier-based accuracy
-- ============================================================================

-- Drop old view
DROP VIEW IF EXISTS public.prediction_accuracy_stats;

-- Create new tier-based accuracy stats view
CREATE OR REPLACE VIEW public.prediction_accuracy_stats AS
SELECT
    niche,
    platform,
    
    -- Overall statistics
    COUNT(*) as total_predictions,
    COUNT(actual_tier) as predictions_with_actuals,
    
    -- Tier-based accuracy (NEW)
    COUNT(CASE WHEN tier_prediction_correct = true THEN 1 END) as tier_exact_matches,
    ROUND(
      COUNT(CASE WHEN tier_prediction_correct = true THEN 1 END)::numeric / 
      NULLIF(COUNT(actual_tier), 0) * 100, 
      2
    ) as tier_accuracy_percentage,
    
    -- Close accuracy (within one tier)
    COUNT(CASE 
      WHEN actual_tier IS NOT NULL AND (
        -- Calculate tier distance
        ABS(
          CASE predicted_tier 
            WHEN 'mega_viral' THEN 4 
            WHEN 'hyper_viral' THEN 3 
            WHEN 'viral' THEN 2 
            WHEN 'strong' THEN 1 
            WHEN 'average' THEN 0 
          END -
          CASE actual_tier 
            WHEN 'mega_viral' THEN 4 
            WHEN 'hyper_viral' THEN 3 
            WHEN 'viral' THEN 2 
            WHEN 'strong' THEN 1 
            WHEN 'average' THEN 0 
          END
        ) <= 1
      )
      THEN 1 
    END) as tier_close_matches,
    
    ROUND(
      COUNT(CASE 
        WHEN actual_tier IS NOT NULL AND (
          ABS(
            CASE predicted_tier 
              WHEN 'mega_viral' THEN 4 
              WHEN 'hyper_viral' THEN 3 
              WHEN 'viral' THEN 2 
              WHEN 'strong' THEN 1 
              WHEN 'average' THEN 0 
            END -
            CASE actual_tier 
              WHEN 'mega_viral' THEN 4 
              WHEN 'hyper_viral' THEN 3 
              WHEN 'viral' THEN 2 
              WHEN 'strong' THEN 1 
              WHEN 'average' THEN 0 
            END
          ) <= 1
        )
        THEN 1 
      END)::numeric / NULLIF(COUNT(actual_tier), 0) * 100,
      2
    ) as tier_close_accuracy_percentage,
    
    -- Average tier confidence
    AVG(tier_confidence) as avg_tier_confidence,
    
    -- Average pattern match count
    AVG(pattern_lego_match_count) as avg_lego_matches,
    
    -- Legacy DPS-based accuracy (for comparison)
    AVG(ABS(predicted_dps - actual_dps)) as avg_dps_error,
    CORR(predicted_dps, actual_dps) as dps_correlation,
    
    -- Breakdown by predicted tier
    COUNT(CASE WHEN predicted_tier = 'mega_viral' THEN 1 END) as predicted_mega_viral_count,
    COUNT(CASE WHEN predicted_tier = 'hyper_viral' THEN 1 END) as predicted_hyper_viral_count,
    COUNT(CASE WHEN predicted_tier = 'viral' THEN 1 END) as predicted_viral_count,
    COUNT(CASE WHEN predicted_tier = 'strong' THEN 1 END) as predicted_strong_count,
    COUNT(CASE WHEN predicted_tier = 'average' THEN 1 END) as predicted_average_count,
    
    -- Breakdown by actual tier (for verified predictions only)
    COUNT(CASE WHEN actual_tier = 'mega_viral' THEN 1 END) as actual_mega_viral_count,
    COUNT(CASE WHEN actual_tier = 'hyper_viral' THEN 1 END) as actual_hyper_viral_count,
    COUNT(CASE WHEN actual_tier = 'viral' THEN 1 END) as actual_viral_count,
    COUNT(CASE WHEN actual_tier = 'strong' THEN 1 END) as actual_strong_count,
    COUNT(CASE WHEN actual_tier = 'average' THEN 1 END) as actual_average_count

FROM public.pre_content_predictions
GROUP BY niche, platform;

-- Create a more detailed tier confusion matrix view
CREATE OR REPLACE VIEW public.tier_confusion_matrix AS
SELECT
    niche,
    platform,
    predicted_tier,
    actual_tier,
    COUNT(*) as count,
    ROUND(AVG(tier_confidence), 3) as avg_confidence,
    ROUND(AVG(pattern_lego_match_count), 1) as avg_lego_matches
FROM public.pre_content_predictions
WHERE actual_tier IS NOT NULL
GROUP BY niche, platform, predicted_tier, actual_tier
ORDER BY niche, platform, predicted_tier, actual_tier;

-- ============================================================================
-- Add comments
-- ============================================================================

COMMENT ON COLUMN public.pre_content_predictions.predicted_tier IS 
  'Tier-based viral classification: mega_viral (top 0.1%), hyper_viral (top 1%), viral (top 5%), strong (top 10%), average (below top 10%)';

COMMENT ON COLUMN public.pre_content_predictions.tier_probabilities IS 
  'Probability distribution across all tiers as JSON: {mega_viral: 0.05, hyper_viral: 0.18, viral: 0.64, strong: 0.11, average: 0.02}';

COMMENT ON COLUMN public.pre_content_predictions.tier_confidence IS 
  'Confidence in the predicted tier (highest probability from tierProbabilities)';

COMMENT ON COLUMN public.pre_content_predictions.tier_reasoning IS 
  'Human-readable explanation of why this tier was predicted';

COMMENT ON COLUMN public.pre_content_predictions.actual_tier IS 
  'Actual tier classification based on real DPS performance after content is published';

COMMENT ON COLUMN public.pre_content_predictions.tier_prediction_correct IS 
  'Boolean flag: true if predicted_tier matches actual_tier';

COMMENT ON VIEW public.prediction_accuracy_stats IS 
  'Tier-based prediction accuracy statistics grouped by niche and platform. Tracks exact tier matches and close matches (within one tier).';

COMMENT ON VIEW public.tier_confusion_matrix IS 
  'Confusion matrix showing predicted vs actual tier distributions for accuracy analysis';










