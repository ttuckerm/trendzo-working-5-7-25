-- Video Generation Job Queue
-- Track async video generation jobs with Kling AI

CREATE TABLE IF NOT EXISTS video_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job identification
  job_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',

  -- Input data
  script_text TEXT NOT NULL,
  platform TEXT NOT NULL,
  length INTEGER NOT NULL,
  niche TEXT NOT NULL,
  predicted_dps DECIMAL(5, 2),

  -- Kling API data
  kling_task_id TEXT,
  kling_request_id TEXT,

  -- Output data
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,

  -- Metadata
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_video_jobs_status
  ON video_generation_jobs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_jobs_job_id
  ON video_generation_jobs(job_id);

CREATE INDEX IF NOT EXISTS idx_video_jobs_kling_task_id
  ON video_generation_jobs(kling_task_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER video_jobs_updated_at
  BEFORE UPDATE ON video_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_video_job_updated_at();

-- Job status values:
-- 'pending' - Job created, waiting to be sent to Kling
-- 'submitted' - Sent to Kling, waiting for processing
-- 'processing' - Kling is generating the video
-- 'completed' - Video generated successfully
-- 'failed' - Generation failed
-- 'cancelled' - Job was cancelled

COMMENT ON TABLE video_generation_jobs IS 'Async job queue for Kling AI video generation';
COMMENT ON COLUMN video_generation_jobs.job_id IS 'Client-facing job ID for polling';
COMMENT ON COLUMN video_generation_jobs.status IS 'Current status: pending, submitted, processing, completed, failed, cancelled';
COMMENT ON COLUMN video_generation_jobs.kling_task_id IS 'Kling API task ID for polling';
COMMENT ON COLUMN video_generation_jobs.attempts IS 'Number of generation attempts (for retry logic)';
