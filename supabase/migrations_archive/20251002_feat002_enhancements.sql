-- =====================================================
-- FEAT-002 Enhancements Migration
-- =====================================================
-- Adds three enhancements to the DPS Calculation Engine:
-- 1. Blockchain timestamp integration (blockchain_tx field)
-- 2. Identity Container scoring (identity_container_score field)
-- 3. Prediction mode flag (prediction_mode ENUM)
--
-- Author: Trendzo Data Engineering
-- Date: 2025-10-02

-- =====================================================
-- 1. Add Identity Container Score Column
-- =====================================================

ALTER TABLE dps_calculations 
ADD COLUMN IF NOT EXISTS identity_container_score DECIMAL(5,2) 
  CHECK (identity_container_score IS NULL OR (identity_container_score >= 0 AND identity_container_score <= 100));

COMMENT ON COLUMN dps_calculations.identity_container_score IS 
  'FEAT-002 Enhancement: Identity Container score (0-100) measuring caption mirror quality - how well content reflects authentic creator identity';

-- =====================================================
-- 2. Add Blockchain Transaction Hash Column
-- =====================================================

ALTER TABLE dps_calculations 
ADD COLUMN IF NOT EXISTS blockchain_tx TEXT;

-- Create index for blockchain transaction lookups
CREATE INDEX IF NOT EXISTS idx_dps_calc_blockchain_tx 
  ON dps_calculations(blockchain_tx) 
  WHERE blockchain_tx IS NOT NULL;

COMMENT ON COLUMN dps_calculations.blockchain_tx IS 
  'FEAT-002 Enhancement: Blockchain transaction hash for immutable audit trail of calculation';

-- =====================================================
-- 3. Add Prediction Mode ENUM Column
-- =====================================================

-- Create prediction mode type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE prediction_mode_enum AS ENUM ('reactive', 'predictive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE dps_calculations 
ADD COLUMN IF NOT EXISTS prediction_mode prediction_mode_enum NOT NULL DEFAULT 'reactive';

-- Create index for prediction mode filtering
CREATE INDEX IF NOT EXISTS idx_dps_calc_prediction_mode 
  ON dps_calculations(prediction_mode);

COMMENT ON COLUMN dps_calculations.prediction_mode IS 
  'FEAT-002 Enhancement: Prediction mode - reactive (post-publish analysis) or predictive (pre-publish forecasting)';

-- =====================================================
-- 4. Create Blockchain Audit View
-- =====================================================

-- View for quick blockchain audit trail queries
CREATE OR REPLACE VIEW dps_blockchain_audit AS
SELECT 
  id,
  video_id,
  platform,
  viral_score,
  classification,
  blockchain_tx,
  calculated_at,
  audit_id,
  prediction_mode
FROM dps_calculations
WHERE blockchain_tx IS NOT NULL
ORDER BY calculated_at DESC;

COMMENT ON VIEW dps_blockchain_audit IS 
  'FEAT-002 Enhancement: Quick view of all blockchain-timestamped calculations for audit purposes';

-- =====================================================
-- 5. Create Identity Container Analysis View
-- =====================================================

-- View for analyzing Identity Container scores
CREATE OR REPLACE VIEW dps_identity_analysis AS
SELECT 
  platform,
  classification,
  prediction_mode,
  COUNT(*) as calculation_count,
  AVG(identity_container_score) as avg_identity_score,
  AVG(viral_score) as avg_viral_score,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY identity_container_score) as median_identity_score,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY viral_score) as median_viral_score
FROM dps_calculations
WHERE identity_container_score IS NOT NULL
GROUP BY platform, classification, prediction_mode
ORDER BY platform, classification;

COMMENT ON VIEW dps_identity_analysis IS 
  'FEAT-002 Enhancement: Analysis view showing correlation between Identity Container scores and viral performance';

-- =====================================================
-- 6. Create Helper Function: Get Calculations by Mode
-- =====================================================

CREATE OR REPLACE FUNCTION get_calculations_by_mode(
  p_prediction_mode prediction_mode_enum,
  p_limit INTEGER DEFAULT 100
) RETURNS TABLE (
  video_id TEXT,
  platform TEXT,
  viral_score DECIMAL(5,2),
  percentile_rank DECIMAL(5,2),
  classification TEXT,
  identity_container_score DECIMAL(5,2),
  blockchain_tx TEXT,
  calculated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.video_id,
    dc.platform,
    dc.viral_score,
    dc.percentile_rank,
    dc.classification,
    dc.identity_container_score,
    dc.blockchain_tx,
    dc.calculated_at
  FROM dps_calculations dc
  WHERE dc.prediction_mode = p_prediction_mode
  ORDER BY dc.calculated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_calculations_by_mode IS 
  'FEAT-002 Enhancement: Retrieve calculations filtered by prediction mode (reactive vs predictive)';

-- =====================================================
-- 7. Create Helper Function: Verify Blockchain Timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION has_blockchain_timestamp(
  p_video_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  tx_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM dps_calculations 
    WHERE video_id = p_video_id 
      AND blockchain_tx IS NOT NULL
    LIMIT 1
  ) INTO tx_exists;
  
  RETURN tx_exists;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION has_blockchain_timestamp IS 
  'FEAT-002 Enhancement: Check if a video calculation has blockchain timestamp';

-- =====================================================
-- 8. Update Statistics Tracking
-- =====================================================

-- Add trigger to track identity container score statistics
CREATE OR REPLACE FUNCTION update_identity_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder for future analytics triggers
  -- Could be expanded to maintain running statistics
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. Seed Data Update
-- =====================================================

-- Update any existing records to have default prediction_mode
UPDATE dps_calculations 
SET prediction_mode = 'reactive'
WHERE prediction_mode IS NULL;

-- =====================================================
-- 10. Verification
-- =====================================================

DO $$ 
DECLARE
  enhancement_count INTEGER;
BEGIN
  -- Check if all three enhancement columns exist
  SELECT COUNT(*) INTO enhancement_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'dps_calculations'
    AND column_name IN ('identity_container_score', 'blockchain_tx', 'prediction_mode');
  
  IF enhancement_count = 3 THEN
    RAISE NOTICE '✅ FEAT-002 Enhancements Migration Success: All 3 enhancement columns added';
    RAISE NOTICE '   - identity_container_score: Caption mirror quality (0-100)';
    RAISE NOTICE '   - blockchain_tx: Immutable audit trail';
    RAISE NOTICE '   - prediction_mode: Reactive vs Predictive classification';
  ELSE
    RAISE WARNING '⚠️  FEAT-002 Enhancements Migration Warning: Expected 3 columns, found %', enhancement_count;
  END IF;
  
  -- Verify views created
  SELECT COUNT(*) INTO enhancement_count
  FROM information_schema.views
  WHERE table_schema = 'public'
    AND table_name IN ('dps_blockchain_audit', 'dps_identity_analysis');
  
  IF enhancement_count = 2 THEN
    RAISE NOTICE '✅ Analysis views created successfully';
  END IF;
END $$;

-- Log migration completion
SELECT 
  'FEAT-002 Enhancements migration completed successfully' AS status,
  NOW() AS completed_at,
  '3 enhancements: Identity Container, Blockchain Timestamp, Prediction Mode' AS summary;


