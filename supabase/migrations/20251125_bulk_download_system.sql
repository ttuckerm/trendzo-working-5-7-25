-- Bulk TikTok Download System
-- Tracks download jobs, individual video downloads, and batch test runs

-- =====================================================
-- Table: bulk_download_jobs
-- Tracks batch download requests
-- =====================================================
CREATE TABLE IF NOT EXISTS bulk_download_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job details
  job_name TEXT,
  total_urls INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Progress tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadata
  created_by TEXT,
  source TEXT DEFAULT 'manual', -- 'manual', 'csv_upload', 'scraper'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for status lookups
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_status ON bulk_download_jobs(status);
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_created ON bulk_download_jobs(created_at DESC);

-- =====================================================
-- Table: bulk_download_items
-- Individual video download tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS bulk_download_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job reference
  job_id UUID NOT NULL REFERENCES bulk_download_jobs(id) ON DELETE CASCADE,
  
  -- Video info
  tiktok_url TEXT NOT NULL,
  video_id TEXT, -- extracted TikTok video ID
  
  -- Download status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'downloading', 'completed', 'failed', 'skipped')),
  
  -- Downloaded file info
  local_path TEXT,
  file_size_bytes BIGINT,
  duration_seconds FLOAT,
  
  -- Video metadata (from TikTok)
  author_username TEXT,
  author_display_name TEXT,
  description TEXT,
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Prediction integration
  prediction_id UUID,
  predicted_dps FLOAT,
  actual_dps FLOAT,
  
  -- Timestamps
  downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_download_items_job ON bulk_download_items(job_id);
CREATE INDEX IF NOT EXISTS idx_download_items_status ON bulk_download_items(status);
CREATE INDEX IF NOT EXISTS idx_download_items_video ON bulk_download_items(video_id);

-- =====================================================
-- Table: batch_test_runs
-- Track "Test All" batch prediction runs
-- =====================================================
CREATE TABLE IF NOT EXISTS batch_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  job_id UUID REFERENCES bulk_download_jobs(id),
  
  -- Run details
  total_videos INTEGER NOT NULL DEFAULT 0,
  tested_count INTEGER NOT NULL DEFAULT 0,
  
  -- Aggregated results
  avg_predicted_dps FLOAT,
  avg_confidence FLOAT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Results summary
  results_summary JSONB DEFAULT '{}',
  -- Format: {
  --   "viral_count": 5,
  --   "good_count": 20,
  --   "average_count": 15,
  --   "low_count": 10,
  --   "distribution": { "0-20": 5, "21-40": 10, ... }
  -- }
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_batch_runs_job ON batch_test_runs(job_id);

-- =====================================================
-- Function: update_job_progress
-- Called after each item completes to update job counters
-- =====================================================
CREATE OR REPLACE FUNCTION update_job_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent job's counters
  UPDATE bulk_download_jobs
  SET 
    processed_count = (
      SELECT COUNT(*) FROM bulk_download_items 
      WHERE job_id = NEW.job_id AND status IN ('completed', 'failed', 'skipped')
    ),
    success_count = (
      SELECT COUNT(*) FROM bulk_download_items 
      WHERE job_id = NEW.job_id AND status = 'completed'
    ),
    failed_count = (
      SELECT COUNT(*) FROM bulk_download_items 
      WHERE job_id = NEW.job_id AND status = 'failed'
    )
  WHERE id = NEW.job_id;
  
  -- Check if job is complete
  IF (SELECT processed_count = total_urls FROM bulk_download_jobs WHERE id = NEW.job_id) THEN
    UPDATE bulk_download_jobs
    SET status = 'completed', completed_at = NOW()
    WHERE id = NEW.job_id AND status = 'processing';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update job progress
DROP TRIGGER IF EXISTS trigger_update_job_progress ON bulk_download_items;
CREATE TRIGGER trigger_update_job_progress
AFTER UPDATE OF status ON bulk_download_items
FOR EACH ROW
EXECUTE FUNCTION update_job_progress();

-- Comments
COMMENT ON TABLE bulk_download_jobs IS 'Batch TikTok video download jobs';
COMMENT ON TABLE bulk_download_items IS 'Individual video download tracking within a job';
COMMENT ON TABLE batch_test_runs IS 'Batch prediction test runs on downloaded videos';














