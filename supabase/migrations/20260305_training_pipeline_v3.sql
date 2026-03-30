-- Training Pipeline V3: Discovery Scanner + Command Center
-- 2026-03-05
--
-- Replaces the broken niche-creator-scraper approach with a proper
-- fresh-video discovery system. Two tracks:
--   Track 1: Discover freshly-posted videos, get initial VPS, track 4 checkpoints
--   Track 2: Track user-posted videos through the same 4 checkpoints

-- ============================================================================
-- Table: discovery_scan_config
-- User-controllable scanner configuration per niche.
-- Replaces hardcoded hashtag mappings. Dashboard is the single control point.
-- ============================================================================

CREATE TABLE IF NOT EXISTS discovery_scan_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  niche_key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,

  -- Search configuration (user editable via Command Center dashboard)
  search_mode TEXT NOT NULL DEFAULT 'hashtag'
    CHECK (search_mode IN ('hashtag', 'search_query', 'both')),
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  search_queries TEXT[] NOT NULL DEFAULT '{}',

  -- Freshness + engagement filters
  max_age_minutes INT NOT NULL DEFAULT 5,
  min_hearts INT DEFAULT 0,
  min_views INT DEFAULT 0,

  -- Polling configuration
  poll_interval_minutes INT NOT NULL DEFAULT 30,
  last_polled_at TIMESTAMPTZ,
  next_poll_at TIMESTAMPTZ,

  -- Budget controls (prevents runaway Apify spending)
  max_apify_calls_per_day INT NOT NULL DEFAULT 10,
  apify_calls_today INT NOT NULL DEFAULT 0,
  apify_calls_reset_at DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Apify configuration
  results_per_page INT NOT NULL DEFAULT 20,
  apify_actor TEXT NOT NULL DEFAULT 'clockworks~tiktok-scraper',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dsc_enabled ON discovery_scan_config(enabled);
CREATE INDEX IF NOT EXISTS idx_dsc_next_poll ON discovery_scan_config(next_poll_at) WHERE enabled = true;

-- ============================================================================
-- Table: discovery_scan_runs
-- Audit trail for every scan execution. Used by Command Center for monitoring.
-- ============================================================================

CREATE TABLE IF NOT EXISTS discovery_scan_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES discovery_scan_config(id),
  niche_key TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Result counters
  videos_found INT NOT NULL DEFAULT 0,
  videos_fresh INT NOT NULL DEFAULT 0,
  videos_new INT NOT NULL DEFAULT 0,
  videos_predicted INT NOT NULL DEFAULT 0,
  schedules_created INT NOT NULL DEFAULT 0,
  apify_calls_made INT NOT NULL DEFAULT 0,

  -- Error tracking
  error_message TEXT,

  -- Snapshot of search params used (for debugging)
  search_params JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_dsr_status ON discovery_scan_runs(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_dsr_niche ON discovery_scan_runs(niche_key, started_at DESC);

-- ============================================================================
-- Column additions to existing tables
-- ============================================================================

-- Track source of metric schedules (discovery vs user vs manual)
ALTER TABLE metric_check_schedule
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Link prediction runs back to discovery scans (with FK for referential integrity)
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS discovery_scan_run_id UUID
  REFERENCES discovery_scan_runs(id) ON DELETE SET NULL;

-- ============================================================================
-- Seed: default side-hustle config (DISABLED — user enables via dashboard)
-- ============================================================================

INSERT INTO discovery_scan_config
  (niche_key, enabled, search_mode, hashtags, search_queries, poll_interval_minutes, max_apify_calls_per_day)
VALUES
  ('side-hustles', false, 'both',
   ARRAY['sidehustle', 'makemoneyonline', 'sidehustleideas'],
   ARRAY['side hustle ideas 2026', 'make money online', 'passive income'],
   30, 10)
ON CONFLICT (niche_key) DO NOTHING;
