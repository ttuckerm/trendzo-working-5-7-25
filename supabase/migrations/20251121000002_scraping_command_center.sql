-- Scraping Command Center Database Schema
-- Tracks scraping jobs, results, and pattern insights

-- ============================================================================
-- SCRAPING JOBS TABLE
-- ============================================================================
DROP TABLE IF EXISTS scraping_jobs CASCADE;
CREATE TABLE scraping_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job configuration
  type TEXT NOT NULL CHECK (type IN ('channel', 'keyword')),
  target TEXT NOT NULL, -- @username or keyword
  platform TEXT NOT NULL DEFAULT 'tiktok',

  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'complete', 'failed', 'cancelled')),

  -- Progress tracking
  videos_found INTEGER DEFAULT 0,
  videos_processed INTEGER DEFAULT 0,
  videos_analyzed INTEGER DEFAULT 0, -- Videos sent to Kai

  -- Results
  avg_dps DECIMAL(5, 2),
  viral_count INTEGER DEFAULT 0, -- Videos with DPS >= 70
  good_count INTEGER DEFAULT 0,  -- Videos with DPS 50-70
  poor_count INTEGER DEFAULT 0,  -- Videos with DPS < 50

  -- Metadata
  niche TEXT,
  date_range JSONB, -- { from: ISO, to: ISO }
  filters JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  cost_usd DECIMAL(10, 4), -- Apify cost tracking

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for scraping_jobs
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status
  ON scraping_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_type
  ON scraping_jobs(type, target);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_platform
  ON scraping_jobs(platform, created_at DESC);

-- ============================================================================
-- PATTERN INSIGHTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pattern_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source information
  scraping_job_id UUID REFERENCES scraping_jobs(id) ON DELETE CASCADE,
  source_channel TEXT, -- @username
  niche TEXT NOT NULL,

  -- Pattern details
  pattern_type TEXT NOT NULL, -- 'hook', 'length', 'timing', 'keywords', 'visual', 'audio'
  pattern_name TEXT NOT NULL, -- 'Question Hook', '15-second videos', etc.
  pattern_description TEXT,

  -- Statistical comparison
  viral_occurrence FLOAT NOT NULL, -- % of viral videos (DPS >= 70) with this pattern
  good_occurrence FLOAT,           -- % of good videos (DPS 50-70) with this pattern
  poor_occurrence FLOAT NOT NULL,  -- % of poor videos (DPS < 50) with this pattern
  lift_factor FLOAT GENERATED ALWAYS AS (
    CASE WHEN poor_occurrence > 0
    THEN viral_occurrence / poor_occurrence
    ELSE NULL END
  ) STORED,

  -- Sample size
  viral_sample_size INTEGER NOT NULL,
  poor_sample_size INTEGER NOT NULL,
  total_videos_analyzed INTEGER NOT NULL,

  -- Confidence metrics
  statistical_significance FLOAT, -- p-value
  confidence_level TEXT, -- 'high', 'medium', 'low'

  -- Actionable insights
  recommendation TEXT, -- "Use question hooks to increase viral potential by 6.1x"
  priority INTEGER DEFAULT 5, -- 1-10, higher = more impactful

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for pattern_insights
CREATE INDEX IF NOT EXISTS idx_pattern_insights_job
  ON pattern_insights(scraping_job_id);
CREATE INDEX IF NOT EXISTS idx_pattern_insights_niche
  ON pattern_insights(niche, lift_factor DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_insights_lift
  ON pattern_insights(lift_factor DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_pattern_insights_priority
  ON pattern_insights(priority DESC, lift_factor DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_insights_type
  ON pattern_insights(pattern_type, niche);

-- ============================================================================
-- SCRAPING METRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS scraping_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Time bucket
  date DATE NOT NULL,
  hour INTEGER, -- 0-23, NULL for daily aggregates

  -- Metrics
  jobs_started INTEGER DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  jobs_failed INTEGER DEFAULT 0,
  total_videos_scraped INTEGER DEFAULT 0,
  total_videos_analyzed INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10, 4) DEFAULT 0,

  -- By platform
  tiktok_videos INTEGER DEFAULT 0,
  instagram_videos INTEGER DEFAULT 0,
  youtube_videos INTEGER DEFAULT 0,

  -- By niche (top 5)
  top_niches JSONB DEFAULT '[]'::jsonb, -- [{ niche, count }]

  -- Averages
  avg_dps DECIMAL(5, 2),
  avg_videos_per_job DECIMAL(8, 2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(date, hour)
);

-- Index for metrics queries
CREATE INDEX IF NOT EXISTS idx_scraping_metrics_date
  ON scraping_metrics(date DESC);

-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scraping_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for scraping_jobs
CREATE TRIGGER scraping_jobs_updated_at
  BEFORE UPDATE ON scraping_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_scraping_job_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate DPS bucket counts
CREATE OR REPLACE FUNCTION calculate_dps_buckets(job_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE scraping_jobs
  SET
    viral_count = (
      SELECT COUNT(*)
      FROM creator_video_history cvh
      WHERE cvh.metadata->>'scraping_job_id' = job_uuid::text
        AND cvh.actual_dps >= 70
    ),
    good_count = (
      SELECT COUNT(*)
      FROM creator_video_history cvh
      WHERE cvh.metadata->>'scraping_job_id' = job_uuid::text
        AND cvh.actual_dps >= 50
        AND cvh.actual_dps < 70
    ),
    poor_count = (
      SELECT COUNT(*)
      FROM creator_video_history cvh
      WHERE cvh.metadata->>'scraping_job_id' = job_uuid::text
        AND cvh.actual_dps < 50
    ),
    avg_dps = (
      SELECT AVG(cvh.actual_dps)
      FROM creator_video_history cvh
      WHERE cvh.metadata->>'scraping_job_id' = job_uuid::text
    )
  WHERE id = job_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE scraping_jobs IS 'Tracks video scraping jobs from Apify';
COMMENT ON TABLE pattern_insights IS 'Statistical patterns discovered from scraped videos';
COMMENT ON TABLE scraping_metrics IS 'Time-series metrics for scraping operations';
COMMENT ON FUNCTION calculate_dps_buckets IS 'Recalculates viral/good/poor counts for a scraping job';
