-- =====================================================
-- FEAT-003: Pattern Extraction System
-- =====================================================
-- Migration to create tables for viral pattern extraction from high-DPS videos
-- Author: Trendzo Data Engineering
-- Date: 2025-10-03

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text similarity search

-- =====================================================
-- 1. Viral Patterns Table (Primary Pattern Storage)
-- =====================================================

CREATE TABLE IF NOT EXISTS viral_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pattern Classification
  niche TEXT NOT NULL, -- e.g., "personal-finance", "fitness", "comedy"
  pattern_type TEXT NOT NULL CHECK (
    pattern_type IN (
      'topic',
      'angle', 
      'hook_structure',
      'story_structure',
      'visual_format',
      'key_visuals',
      'audio'
    )
  ),
  
  -- Pattern Content
  pattern_description TEXT NOT NULL,
  pattern_details JSONB DEFAULT '{}', -- Structured pattern data (optional)
  
  -- Statistical Measures
  frequency_count INTEGER NOT NULL DEFAULT 1 CHECK (frequency_count >= 0),
  avg_dps_score DECIMAL(5,2) CHECK (avg_dps_score IS NULL OR (avg_dps_score >= 0 AND avg_dps_score <= 100)),
  success_rate DECIMAL(5,4) CHECK (success_rate IS NULL OR (success_rate >= 0 AND success_rate <= 1)),
  total_videos_analyzed INTEGER NOT NULL DEFAULT 0,
  viral_videos_count INTEGER NOT NULL DEFAULT 0,
  
  -- Time Tracking
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  extraction_version TEXT DEFAULT 'v1',
  
  -- Constraints
  CONSTRAINT unique_pattern_per_niche_type UNIQUE (niche, pattern_type, pattern_description),
  CONSTRAINT valid_success_rate CHECK (viral_videos_count <= total_videos_analyzed)
);

-- Indexes for viral_patterns
CREATE INDEX IF NOT EXISTS idx_viral_patterns_niche ON viral_patterns(niche);
CREATE INDEX IF NOT EXISTS idx_viral_patterns_type ON viral_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_viral_patterns_niche_type ON viral_patterns(niche, pattern_type);
CREATE INDEX IF NOT EXISTS idx_viral_patterns_success_rate ON viral_patterns(success_rate DESC NULLS LAST) WHERE success_rate IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_viral_patterns_avg_dps ON viral_patterns(avg_dps_score DESC NULLS LAST) WHERE avg_dps_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_viral_patterns_frequency ON viral_patterns(frequency_count DESC);
CREATE INDEX IF NOT EXISTS idx_viral_patterns_last_seen ON viral_patterns(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_viral_patterns_description_trgm ON viral_patterns USING gin (pattern_description gin_trgm_ops);

-- Comments for documentation
COMMENT ON TABLE viral_patterns IS 'FEAT-003: Stores extracted viral patterns from high-DPS videos across 7 Idea Legos';
COMMENT ON COLUMN viral_patterns.niche IS 'Content niche/category (e.g., personal-finance, fitness)';
COMMENT ON COLUMN viral_patterns.pattern_type IS 'One of 7 Idea Legos: topic, angle, hook_structure, story_structure, visual_format, key_visuals, audio';
COMMENT ON COLUMN viral_patterns.pattern_description IS 'Human-readable description of the pattern';
COMMENT ON COLUMN viral_patterns.frequency_count IS 'Number of times this pattern has been observed';
COMMENT ON COLUMN viral_patterns.avg_dps_score IS 'Average DPS score of videos containing this pattern';
COMMENT ON COLUMN viral_patterns.success_rate IS 'Percentage (0-1) of videos with this pattern that went viral (>= 95th percentile)';
COMMENT ON COLUMN viral_patterns.total_videos_analyzed IS 'Total number of videos analyzed that contained this pattern';
COMMENT ON COLUMN viral_patterns.viral_videos_count IS 'Number of viral videos that contained this pattern';

-- =====================================================
-- 2. Pattern Video Junction Table (Many-to-Many)
-- =====================================================

CREATE TABLE IF NOT EXISTS pattern_video_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES viral_patterns(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL, -- References scraped_videos.video_id
  
  -- Relationship metadata
  confidence_score DECIMAL(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  extraction_batch_id TEXT,
  
  -- Constraints
  CONSTRAINT unique_pattern_video UNIQUE (pattern_id, video_id)
);

-- Indexes for pattern_video_associations
CREATE INDEX IF NOT EXISTS idx_pattern_video_pattern_id ON pattern_video_associations(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_video_video_id ON pattern_video_associations(video_id);
CREATE INDEX IF NOT EXISTS idx_pattern_video_batch ON pattern_video_associations(extraction_batch_id) WHERE extraction_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pattern_video_extracted_at ON pattern_video_associations(extracted_at DESC);

-- Comments for documentation
COMMENT ON TABLE pattern_video_associations IS 'FEAT-003: Junction table linking patterns to videos that exhibit them';
COMMENT ON COLUMN pattern_video_associations.confidence_score IS 'LLM confidence score (0-1) for pattern extraction';

-- =====================================================
-- 3. Pattern Extraction Jobs Table (Job Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS pattern_extraction_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL UNIQUE,
  
  -- Job Parameters
  niche TEXT NOT NULL,
  min_dps_score DECIMAL(5,2) NOT NULL,
  date_range_days INTEGER NOT NULL,
  
  -- Job Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  
  -- Job Results
  total_videos_queried INTEGER DEFAULT 0,
  videos_processed INTEGER DEFAULT 0,
  patterns_extracted INTEGER DEFAULT 0,
  patterns_updated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  
  -- Performance Metrics
  processing_time_ms INTEGER,
  llm_calls_count INTEGER DEFAULT 0,
  llm_tokens_used INTEGER DEFAULT 0,
  llm_cost_usd DECIMAL(10,4) DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Error tracking
  error_message TEXT,
  error_stack TEXT
);

-- Indexes for pattern_extraction_jobs
CREATE INDEX IF NOT EXISTS idx_pattern_jobs_batch_id ON pattern_extraction_jobs(batch_id);
CREATE INDEX IF NOT EXISTS idx_pattern_jobs_status ON pattern_extraction_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pattern_jobs_created_at ON pattern_extraction_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_jobs_niche ON pattern_extraction_jobs(niche);

-- Comments for documentation
COMMENT ON TABLE pattern_extraction_jobs IS 'FEAT-003: Tracks pattern extraction job executions and performance metrics';
COMMENT ON COLUMN pattern_extraction_jobs.batch_id IS 'Unique identifier for the extraction batch';
COMMENT ON COLUMN pattern_extraction_jobs.date_range_days IS 'Number of days in the past to analyze videos from';

-- =====================================================
-- 4. Pattern Extraction Errors Table (Error Tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS pattern_extraction_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  
  -- Error Details
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  
  -- Context
  video_data JSONB,
  llm_response TEXT,
  
  -- Metadata
  failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0
);

-- Indexes for pattern_extraction_errors
CREATE INDEX IF NOT EXISTS idx_pattern_errors_batch_id ON pattern_extraction_errors(batch_id);
CREATE INDEX IF NOT EXISTS idx_pattern_errors_video_id ON pattern_extraction_errors(video_id);
CREATE INDEX IF NOT EXISTS idx_pattern_errors_error_code ON pattern_extraction_errors(error_code);
CREATE INDEX IF NOT EXISTS idx_pattern_errors_failed_at ON pattern_extraction_errors(failed_at DESC);

-- Comments for documentation
COMMENT ON TABLE pattern_extraction_errors IS 'FEAT-003: Tracks failed pattern extractions for debugging';
COMMENT ON COLUMN pattern_extraction_errors.error_code IS 'Standardized error code (e.g., LLM_TIMEOUT, INVALID_RESPONSE, MISSING_VIDEO_DATA)';

-- =====================================================
-- 5. Helper Functions
-- =====================================================

-- Function to get top patterns by success rate for a niche
CREATE OR REPLACE FUNCTION get_top_patterns_by_niche(
  p_niche TEXT,
  p_pattern_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  pattern_id UUID,
  pattern_type TEXT,
  pattern_description TEXT,
  frequency_count INTEGER,
  avg_dps_score DECIMAL(5,2),
  success_rate DECIMAL(5,4),
  total_videos INTEGER,
  viral_videos INTEGER,
  last_seen_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vp.id,
    vp.pattern_type,
    vp.pattern_description,
    vp.frequency_count,
    vp.avg_dps_score,
    vp.success_rate,
    vp.total_videos_analyzed,
    vp.viral_videos_count,
    vp.last_seen_at
  FROM viral_patterns vp
  WHERE vp.niche = p_niche
    AND (p_pattern_type IS NULL OR vp.pattern_type = p_pattern_type)
    AND vp.success_rate IS NOT NULL
  ORDER BY vp.success_rate DESC, vp.frequency_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_top_patterns_by_niche IS 'FEAT-003: Retrieve top performing patterns for a given niche';

-- Function to update pattern statistics
CREATE OR REPLACE FUNCTION update_pattern_statistics(p_pattern_id UUID) 
RETURNS void AS $$
DECLARE
  v_avg_dps DECIMAL(5,2);
  v_total_videos INTEGER;
  v_viral_videos INTEGER;
  v_success_rate DECIMAL(5,4);
  v_frequency INTEGER;
BEGIN
  -- Calculate statistics from associated videos
  SELECT 
    AVG(sv.dps_score)::DECIMAL(5,2),
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE sv.dps_percentile >= 95.0)::INTEGER,
    COUNT(*)::INTEGER
  INTO v_avg_dps, v_total_videos, v_viral_videos, v_frequency
  FROM pattern_video_associations pva
  JOIN scraped_videos sv ON pva.video_id = sv.video_id
  WHERE pva.pattern_id = p_pattern_id
    AND sv.dps_score IS NOT NULL;
  
  -- Calculate success rate
  IF v_total_videos > 0 THEN
    v_success_rate := (v_viral_videos::DECIMAL / v_total_videos::DECIMAL)::DECIMAL(5,4);
  ELSE
    v_success_rate := NULL;
  END IF;
  
  -- Update pattern record
  UPDATE viral_patterns
  SET 
    avg_dps_score = v_avg_dps,
    total_videos_analyzed = COALESCE(v_total_videos, 0),
    viral_videos_count = COALESCE(v_viral_videos, 0),
    success_rate = v_success_rate,
    frequency_count = COALESCE(v_frequency, 1),
    last_seen_at = NOW(),
    updated_at = NOW()
  WHERE id = p_pattern_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_pattern_statistics IS 'FEAT-003: Recalculate statistics for a pattern based on associated videos';

-- Function to find similar patterns (for deduplication)
CREATE OR REPLACE FUNCTION find_similar_patterns(
  p_niche TEXT,
  p_pattern_type TEXT,
  p_description TEXT,
  p_similarity_threshold REAL DEFAULT 0.7
) RETURNS TABLE (
  pattern_id UUID,
  pattern_description TEXT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vp.id,
    vp.pattern_description,
    similarity(vp.pattern_description, p_description) AS sim_score
  FROM viral_patterns vp
  WHERE vp.niche = p_niche
    AND vp.pattern_type = p_pattern_type
    AND similarity(vp.pattern_description, p_description) >= p_similarity_threshold
  ORDER BY sim_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_similar_patterns IS 'FEAT-003: Find patterns with similar descriptions using trigram similarity';

-- =====================================================
-- 6. Triggers
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pattern_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_viral_patterns_updated_at
  BEFORE UPDATE ON viral_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_updated_at();

CREATE TRIGGER trigger_pattern_extraction_jobs_updated_at
  BEFORE UPDATE ON pattern_extraction_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_updated_at();

-- =====================================================
-- 7. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on tables
ALTER TABLE viral_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_video_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_extraction_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_extraction_errors ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access to all tables
CREATE POLICY "Service role has full access to viral_patterns" 
  ON viral_patterns FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to pattern_video_associations" 
  ON pattern_video_associations FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to pattern_extraction_jobs" 
  ON pattern_extraction_jobs FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to pattern_extraction_errors" 
  ON pattern_extraction_errors FOR ALL 
  USING (auth.role() = 'service_role');

-- Policy: Allow authenticated users to read patterns
CREATE POLICY "Authenticated users can read viral_patterns" 
  ON viral_patterns FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to read associations
CREATE POLICY "Authenticated users can read pattern_video_associations" 
  ON pattern_video_associations FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to read jobs
CREATE POLICY "Authenticated users can read pattern_extraction_jobs" 
  ON pattern_extraction_jobs FOR SELECT 
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 8. Verification
-- =====================================================

-- Verify table creation
DO $$ 
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'viral_patterns',
      'pattern_video_associations',
      'pattern_extraction_jobs',
      'pattern_extraction_errors'
    );
  
  IF table_count = 4 THEN
    RAISE NOTICE '✅ FEAT-003 Migration Success: All 4 pattern extraction tables created';
  ELSE
    RAISE WARNING '⚠️  FEAT-003 Migration Warning: Expected 4 tables, found %', table_count;
  END IF;
END $$;

-- Log migration completion
SELECT 'FEAT-003: Pattern Extraction System migration completed successfully' AS status;

