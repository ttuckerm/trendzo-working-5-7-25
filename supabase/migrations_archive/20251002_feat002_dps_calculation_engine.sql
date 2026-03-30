-- =====================================================
-- FEAT-002: DPS Calculation Engine
-- =====================================================
-- Migration to create tables for Dynamic Percentile System viral score calculations
-- Author: Trendzo Data Engineering
-- Date: 2025-10-02

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- 1. DPS Calculations Table (Primary Results Storage)
-- =====================================================

CREATE TABLE IF NOT EXISTS dps_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  
  -- Viral Score Results
  viral_score DECIMAL(5,2) NOT NULL CHECK (viral_score >= 0 AND viral_score <= 100),
  percentile_rank DECIMAL(5,2) NOT NULL CHECK (percentile_rank >= 0 AND percentile_rank <= 100),
  classification TEXT NOT NULL CHECK (classification IN ('normal', 'viral', 'hyper-viral', 'mega-viral')),
  z_score DECIMAL(8,4),
  decay_factor DECIMAL(6,4),
  platform_weight DECIMAL(4,2),
  cohort_median INTEGER,
  confidence DECIMAL(4,3) CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Input Data Snapshot (for reproducibility)
  view_count BIGINT NOT NULL,
  like_count INTEGER,
  comment_count INTEGER,
  share_count INTEGER,
  follower_count INTEGER NOT NULL,
  hours_since_upload DECIMAL(8,2),
  published_at TIMESTAMPTZ,
  
  -- Metadata
  batch_id TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  audit_id TEXT NOT NULL,
  processing_time_ms INTEGER,
  
  -- Constraints
  CONSTRAINT unique_video_calculation UNIQUE (video_id, calculated_at)
);

-- Indexes for dps_calculations
CREATE INDEX IF NOT EXISTS idx_dps_calc_platform_score ON dps_calculations(platform, viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_dps_calc_classification ON dps_calculations(classification);
CREATE INDEX IF NOT EXISTS idx_dps_calc_batch ON dps_calculations(batch_id);
CREATE INDEX IF NOT EXISTS idx_dps_calc_calculated_at ON dps_calculations(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_dps_calc_video_id ON dps_calculations(video_id);
CREATE INDEX IF NOT EXISTS idx_dps_calc_confidence ON dps_calculations(confidence DESC);

-- Comments for documentation
COMMENT ON TABLE dps_calculations IS 'FEAT-002: Stores Dynamic Percentile System viral score calculations for all processed videos';
COMMENT ON COLUMN dps_calculations.viral_score IS 'Master viral score (0-100) calculated using DPS algorithm';
COMMENT ON COLUMN dps_calculations.percentile_rank IS 'Percentile rank within cohort (0-100)';
COMMENT ON COLUMN dps_calculations.classification IS 'Viral classification: normal (<95th), viral (95-99th), hyper-viral (99-99.9th), mega-viral (>99.9th)';
COMMENT ON COLUMN dps_calculations.z_score IS 'Statistical z-score vs cohort median';
COMMENT ON COLUMN dps_calculations.decay_factor IS 'Time decay factor based on hours since upload';
COMMENT ON COLUMN dps_calculations.confidence IS 'Calculation confidence score (0-1) based on data completeness and cohort sample size';

-- =====================================================
-- 2. DPS Cohort Statistics Table (Cached Cohort Data)
-- =====================================================

CREATE TABLE IF NOT EXISTS dps_cohort_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  
  -- Follower Bracket Definition
  follower_min INTEGER NOT NULL,
  follower_max INTEGER NOT NULL,
  
  -- Statistical Measures
  cohort_median INTEGER NOT NULL,
  cohort_mean DECIMAL(12,2),
  cohort_stddev DECIMAL(12,2),
  sample_size INTEGER NOT NULL,
  
  -- Metadata
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  calculation_version TEXT DEFAULT 'v1',
  
  -- Constraints
  CONSTRAINT unique_cohort UNIQUE (platform, follower_min, follower_max),
  CONSTRAINT valid_follower_range CHECK (follower_max >= follower_min)
);

-- Indexes for dps_cohort_stats
CREATE INDEX IF NOT EXISTS idx_dps_cohort_lookup ON dps_cohort_stats(platform, follower_min, follower_max);
CREATE INDEX IF NOT EXISTS idx_dps_cohort_updated ON dps_cohort_stats(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_dps_cohort_sample_size ON dps_cohort_stats(sample_size DESC);

-- Comments for documentation
COMMENT ON TABLE dps_cohort_stats IS 'FEAT-002: Cached cohort statistics for DPS calculations, updated weekly';
COMMENT ON COLUMN dps_cohort_stats.follower_min IS 'Minimum follower count for cohort (inclusive)';
COMMENT ON COLUMN dps_cohort_stats.follower_max IS 'Maximum follower count for cohort (inclusive)';
COMMENT ON COLUMN dps_cohort_stats.cohort_median IS 'Median view count for videos in this cohort';
COMMENT ON COLUMN dps_cohort_stats.sample_size IS 'Number of videos used to calculate cohort statistics';

-- =====================================================
-- 3. DPS Calculation Errors Table (Failure Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS dps_calculation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  batch_id TEXT,
  
  -- Error Details
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  
  -- Input Data (for debugging)
  input_data JSONB,
  
  -- Metadata
  failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  audit_id TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0
);

-- Indexes for dps_calculation_errors
CREATE INDEX IF NOT EXISTS idx_dps_error_video_id ON dps_calculation_errors(video_id);
CREATE INDEX IF NOT EXISTS idx_dps_error_batch ON dps_calculation_errors(batch_id);
CREATE INDEX IF NOT EXISTS idx_dps_error_code ON dps_calculation_errors(error_code);
CREATE INDEX IF NOT EXISTS idx_dps_error_failed_at ON dps_calculation_errors(failed_at DESC);

-- Comments for documentation
COMMENT ON TABLE dps_calculation_errors IS 'FEAT-002: Tracks failed DPS calculations for debugging and monitoring';
COMMENT ON COLUMN dps_calculation_errors.error_code IS 'Standardized error code (e.g., MISSING_COHORT, INVALID_INPUT, DB_TIMEOUT)';
COMMENT ON COLUMN dps_calculation_errors.retry_count IS 'Number of retry attempts for this calculation';

-- =====================================================
-- 4. Helper Functions
-- =====================================================

-- Function to get cohort stats for a given platform and follower count
CREATE OR REPLACE FUNCTION get_dps_cohort_stats(
  p_platform TEXT,
  p_follower_count INTEGER
) RETURNS TABLE (
  cohort_median INTEGER,
  cohort_mean DECIMAL(12,2),
  cohort_stddev DECIMAL(12,2),
  sample_size INTEGER
) AS $$
DECLARE
  follower_min_val INTEGER;
  follower_max_val INTEGER;
BEGIN
  -- Calculate cohort bounds (±20% of follower count)
  follower_min_val := FLOOR(p_follower_count * 0.8);
  follower_max_val := CEIL(p_follower_count * 1.2);
  
  -- Return cohort stats
  RETURN QUERY
  SELECT 
    cs.cohort_median,
    cs.cohort_mean,
    cs.cohort_stddev,
    cs.sample_size
  FROM dps_cohort_stats cs
  WHERE cs.platform = p_platform
    AND cs.follower_min <= follower_max_val
    AND cs.follower_max >= follower_min_val
  ORDER BY cs.sample_size DESC
  LIMIT 1;
  
  -- If no cohort found, return NULL
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_dps_cohort_stats IS 'FEAT-002: Retrieve cohort statistics for a given platform and follower count';

-- Function to classify virality based on percentile rank
CREATE OR REPLACE FUNCTION classify_virality(p_percentile DECIMAL) 
RETURNS TEXT AS $$
BEGIN
  IF p_percentile >= 99.9 THEN
    RETURN 'mega-viral';
  ELSIF p_percentile >= 99.0 THEN
    RETURN 'hyper-viral';
  ELSIF p_percentile >= 95.0 THEN
    RETURN 'viral';
  ELSE
    RETURN 'normal';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION classify_virality IS 'FEAT-002: Classify viral status based on percentile rank';

-- =====================================================
-- 5. Initial Seed Data (Sample Cohort Stats)
-- =====================================================

-- Insert sample cohort stats for TikTok (will be replaced with real data)
INSERT INTO dps_cohort_stats (platform, follower_min, follower_max, cohort_median, cohort_mean, cohort_stddev, sample_size)
VALUES 
  ('tiktok', 0, 1000, 500, 750, 500, 100),
  ('tiktok', 1000, 10000, 5000, 7500, 5000, 500),
  ('tiktok', 10000, 100000, 50000, 75000, 50000, 1000),
  ('tiktok', 100000, 1000000, 500000, 750000, 500000, 500),
  ('tiktok', 1000000, 10000000, 5000000, 7500000, 5000000, 100)
ON CONFLICT (platform, follower_min, follower_max) DO NOTHING;

-- Insert sample cohort stats for Instagram
INSERT INTO dps_cohort_stats (platform, follower_min, follower_max, cohort_median, cohort_mean, cohort_stddev, sample_size)
VALUES 
  ('instagram', 0, 1000, 400, 600, 400, 100),
  ('instagram', 1000, 10000, 4000, 6000, 4000, 500),
  ('instagram', 10000, 100000, 40000, 60000, 40000, 1000),
  ('instagram', 100000, 1000000, 400000, 600000, 400000, 500),
  ('instagram', 1000000, 10000000, 4000000, 6000000, 4000000, 100)
ON CONFLICT (platform, follower_min, follower_max) DO NOTHING;

-- Insert sample cohort stats for YouTube
INSERT INTO dps_cohort_stats (platform, follower_min, follower_max, cohort_median, cohort_mean, cohort_stddev, sample_size)
VALUES 
  ('youtube', 0, 1000, 300, 500, 300, 100),
  ('youtube', 1000, 10000, 3000, 5000, 3000, 500),
  ('youtube', 10000, 100000, 30000, 50000, 30000, 1000),
  ('youtube', 100000, 1000000, 300000, 500000, 300000, 500),
  ('youtube', 1000000, 10000000, 3000000, 5000000, 3000000, 100)
ON CONFLICT (platform, follower_min, follower_max) DO NOTHING;

-- =====================================================
-- 6. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on tables
ALTER TABLE dps_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dps_cohort_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE dps_calculation_errors ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access to all tables
CREATE POLICY "Service role has full access to dps_calculations" 
  ON dps_calculations FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to dps_cohort_stats" 
  ON dps_cohort_stats FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to dps_calculation_errors" 
  ON dps_calculation_errors FOR ALL 
  USING (auth.role() = 'service_role');

-- Policy: Allow authenticated users to read calculations
CREATE POLICY "Authenticated users can read dps_calculations" 
  ON dps_calculations FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to read cohort stats
CREATE POLICY "Authenticated users can read dps_cohort_stats" 
  ON dps_cohort_stats FOR SELECT 
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 7. Verification
-- =====================================================

-- Verify table creation
DO $$ 
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('dps_calculations', 'dps_cohort_stats', 'dps_calculation_errors');
  
  IF table_count = 3 THEN
    RAISE NOTICE '✅ FEAT-002 Migration Success: All 3 DPS tables created';
  ELSE
    RAISE WARNING '⚠️  FEAT-002 Migration Warning: Expected 3 tables, found %', table_count;
  END IF;
END $$;

-- Log migration completion
SELECT 'FEAT-002: DPS Calculation Engine migration completed successfully' AS status;


