-- Create viral_pool, negative_pool, and viral_filter_runs tables for FEAT-003

-- Viral Pool
CREATE TABLE IF NOT EXISTS viral_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  follower_bucket TEXT NOT NULL,
  engagement_score NUMERIC NOT NULL,
  views_1h NUMERIC NOT NULL,
  likes_1h NUMERIC NOT NULL,
  creator_followers NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT viral_pool_video_id_unique UNIQUE (video_id)
);

-- Negative Pool
CREATE TABLE IF NOT EXISTS negative_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  follower_bucket TEXT NOT NULL,
  engagement_score NUMERIC NOT NULL,
  views_1h NUMERIC NOT NULL,
  likes_1h NUMERIC NOT NULL,
  creator_followers NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT negative_pool_video_id_unique UNIQUE (video_id)
);

-- Viral Filter Runs
CREATE TABLE IF NOT EXISTS viral_filter_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL UNIQUE,
  total_processed INTEGER NOT NULL,
  viral_count INTEGER NOT NULL,
  neg_count INTEGER NOT NULL,
  run_timestamp TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'insufficient_data', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_viral_pool_created ON viral_pool(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_viral_pool_bucket ON viral_pool(follower_bucket);
CREATE INDEX IF NOT EXISTS idx_negative_pool_created ON negative_pool(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_negative_pool_bucket ON negative_pool(follower_bucket);
CREATE INDEX IF NOT EXISTS idx_viral_filter_runs_timestamp ON viral_filter_runs(run_timestamp DESC);
