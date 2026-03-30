-- =====================================================
-- Content Strategy Features (Phase 1)
-- =====================================================
-- Adds 7 text-based content strategy features to training_features.
-- These measure content STRATEGY signals (retention, shareability,
-- psychological triggers) — not just content quality.
--
-- Date: 2026-03-15
-- =====================================================

-- B4: Open loop / curiosity gap count in transcript
ALTER TABLE training_features
ADD COLUMN IF NOT EXISTS retention_open_loop_count NUMERIC;

-- C1: Relatability score (0-100, signal density per 100 words)
ALTER TABLE training_features
ADD COLUMN IF NOT EXISTS share_relatability_score NUMERIC;

-- C2: Utility/actionable value score (0-100)
ALTER TABLE training_features
ADD COLUMN IF NOT EXISTS share_utility_score NUMERIC;

-- F1: Curiosity gap score (0-100, weighted toward first 20%)
ALTER TABLE training_features
ADD COLUMN IF NOT EXISTS psych_curiosity_gap_score NUMERIC;

-- F2: Power word density per 100 words (0-20 typical)
ALTER TABLE training_features
ADD COLUMN IF NOT EXISTS psych_power_word_density NUMERIC;

-- F3: Direct address ratio (second-person pronouns / total words, 0-1)
ALTER TABLE training_features
ADD COLUMN IF NOT EXISTS psych_direct_address_ratio NUMERIC;

-- F4: Social proof signal count
ALTER TABLE training_features
ADD COLUMN IF NOT EXISTS psych_social_proof_count NUMERIC;

-- Verify
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'training_features'
    AND column_name IN (
      'retention_open_loop_count', 'share_relatability_score',
      'share_utility_score', 'psych_curiosity_gap_score',
      'psych_power_word_density', 'psych_direct_address_ratio',
      'psych_social_proof_count'
    );

  RAISE NOTICE 'Content strategy columns added: % of 7', col_count;
END $$;
