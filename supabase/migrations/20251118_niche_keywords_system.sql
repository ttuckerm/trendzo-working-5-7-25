-- ============================================================================
-- Niche Keywords System: Timestamped Keywords with Archive/Reserve
-- ============================================================================
-- Purpose: Manage 1000+ viral keywords across 20 niches with temporal tracking
-- Date: 2025-11-18
-- Current Status: ~250 keywords across 4 niches → expand to 1000+ across 20
-- ============================================================================

-- ============================================================================
-- Table 1: niches (Reference table for 20 niches)
-- ============================================================================

CREATE TABLE IF NOT EXISTS niches (
  id VARCHAR(50) PRIMARY KEY,  -- e.g., "personal-finance", "fitness-health"
  name VARCHAR(100) NOT NULL UNIQUE,  -- e.g., "Personal Finance & Money"
  description TEXT,
  category VARCHAR(50),  -- e.g., "money", "health", "business" (for grouping)
  target_keyword_count INTEGER NOT NULL DEFAULT 50,  -- Goal: 50 keywords per niche
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_niches_category ON niches(category);

-- Comments
COMMENT ON TABLE niches IS 'Reference table for 20 viral content niches';
COMMENT ON COLUMN niches.target_keyword_count IS 'Target number of active keywords per niche (50 × 20 = 1000 total)';

-- ============================================================================
-- Table 2: niche_keywords (Main keywords table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS niche_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id VARCHAR(50) NOT NULL REFERENCES niches(id) ON DELETE CASCADE,

  -- Keyword data
  keyword TEXT NOT NULL,  -- e.g., "#passiveincome", "how to invest for beginners"
  keyword_type VARCHAR(20) NOT NULL CHECK (keyword_type IN ('hashtag', 'phrase', 'question')),

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'archived', 'testing')),

  -- Temporal tracking
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_used_at TIMESTAMPTZ,  -- When first used in scraping
  last_used_at TIMESTAMPTZ,  -- Most recent use
  last_verified_at TIMESTAMPTZ,  -- Last time performance was verified
  archived_at TIMESTAMPTZ,  -- When moved to archive (if archived)

  -- Performance metrics (for prioritization)
  estimated_search_volume INTEGER,  -- Monthly search volume estimate
  trending_score NUMERIC(3,2),  -- 0.00-1.00, how "hot" the keyword is now
  virality_correlation NUMERIC(3,2),  -- 0.00-1.00, how well it correlates with viral content
  scrape_success_rate NUMERIC(3,2),  -- 0.00-1.00, % of searches that return quality results

  -- Usage stats
  times_used INTEGER NOT NULL DEFAULT 0,  -- How many times used in scraping
  videos_found INTEGER NOT NULL DEFAULT 0,  -- Total videos found using this keyword
  viral_videos_found INTEGER NOT NULL DEFAULT 0,  -- Videos with DPS > 70

  -- Archive reason (if archived)
  archive_reason TEXT,  -- e.g., "low performance", "trend ended", "superseded by X"
  replaced_by_keyword_id UUID REFERENCES niche_keywords(id),  -- If keyword was replaced

  -- Metadata
  source VARCHAR(50) DEFAULT 'manual',  -- How keyword was discovered (manual, trend_api, competitor_analysis)
  notes TEXT,  -- Admin notes about this keyword

  -- Uniqueness constraint
  UNIQUE(niche_id, keyword, status)  -- Same keyword can exist in active + archived states
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_niche_keywords_niche_id ON niche_keywords(niche_id);
CREATE INDEX IF NOT EXISTS idx_niche_keywords_status ON niche_keywords(status);
CREATE INDEX IF NOT EXISTS idx_niche_keywords_trending_score ON niche_keywords(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_niche_keywords_added_at ON niche_keywords(added_at DESC);
CREATE INDEX IF NOT EXISTS idx_niche_keywords_last_used_at ON niche_keywords(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_niche_keywords_virality_correlation ON niche_keywords(virality_correlation DESC);
CREATE INDEX IF NOT EXISTS idx_niche_keywords_keyword_type ON niche_keywords(keyword_type);

-- Full-text search on keywords
CREATE INDEX IF NOT EXISTS idx_niche_keywords_keyword_search ON niche_keywords USING gin(to_tsvector('english', keyword));

-- Comments
COMMENT ON TABLE niche_keywords IS 'Master table for 1000+ timestamped viral keywords across 20 niches';
COMMENT ON COLUMN niche_keywords.status IS 'active = in use, reserved = planned for future, archived = no longer used, testing = being evaluated';
COMMENT ON COLUMN niche_keywords.trending_score IS 'Decay over time - recalculated weekly based on recent performance';
COMMENT ON COLUMN niche_keywords.virality_correlation IS 'Historical correlation: videos found with this keyword → DPS > 70';
COMMENT ON COLUMN niche_keywords.archive_reason IS 'Why archived: low_performance, trend_ended, superseded, seasonal, duplicate';

-- ============================================================================
-- Table 3: keyword_performance_snapshots (Historical performance tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS keyword_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES niche_keywords(id) ON DELETE CASCADE,

  -- Snapshot metadata
  snapshot_date DATE NOT NULL,
  snapshot_type VARCHAR(20) NOT NULL DEFAULT 'weekly' CHECK (snapshot_type IN ('daily', 'weekly', 'monthly')),

  -- Performance metrics at this point in time
  search_volume INTEGER,
  trending_score NUMERIC(3,2),
  scrape_results_count INTEGER,  -- How many videos found in this period
  viral_results_count INTEGER,  -- How many were viral (DPS > 70)
  avg_dps_of_results NUMERIC(5,2),  -- Average DPS of videos found

  -- Trend indicators
  velocity VARCHAR(20),  -- 'rising', 'stable', 'declining', 'dead'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(keyword_id, snapshot_date, snapshot_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_keyword_snapshots_keyword_id ON keyword_performance_snapshots(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_snapshots_date ON keyword_performance_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_snapshots_velocity ON keyword_performance_snapshots(velocity);

-- Comments
COMMENT ON TABLE keyword_performance_snapshots IS 'Time-series data showing keyword performance over time';
COMMENT ON COLUMN keyword_performance_snapshots.velocity IS 'Trend direction for archiving decisions';

-- ============================================================================
-- Table 4: keyword_rotation_log (Audit trail for active → archived)
-- ============================================================================

CREATE TABLE IF NOT EXISTS keyword_rotation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES niche_keywords(id) ON DELETE CASCADE,

  -- Status change
  old_status VARCHAR(20) NOT NULL,
  new_status VARCHAR(20) NOT NULL,

  -- Reason for rotation
  rotation_reason TEXT NOT NULL,

  -- Performance data at time of rotation
  final_trending_score NUMERIC(3,2),
  final_virality_correlation NUMERIC(3,2),
  total_videos_found INTEGER,
  total_viral_videos INTEGER,

  -- Admin action
  rotated_by VARCHAR(100),  -- Admin user who initiated rotation
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Replacement (if keyword was replaced)
  replaced_by_keyword_id UUID REFERENCES niche_keywords(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_keyword_rotation_keyword_id ON keyword_rotation_log(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_rotation_date ON keyword_rotation_log(rotated_at DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_rotation_new_status ON keyword_rotation_log(new_status);

-- Comments
COMMENT ON TABLE keyword_rotation_log IS 'Audit trail for keyword lifecycle changes (active → archived → replaced)';

-- ============================================================================
-- View 1: active_keywords_by_niche (Quick lookup for scraping)
-- ============================================================================

CREATE OR REPLACE VIEW active_keywords_by_niche AS
SELECT
  n.id as niche_id,
  n.name as niche_name,
  nk.id as keyword_id,
  nk.keyword,
  nk.keyword_type,
  nk.trending_score,
  nk.virality_correlation,
  nk.times_used,
  nk.viral_videos_found,
  nk.last_used_at
FROM niches n
LEFT JOIN niche_keywords nk ON nk.niche_id = n.id AND nk.status = 'active'
ORDER BY n.id, nk.trending_score DESC NULLS LAST;

COMMENT ON VIEW active_keywords_by_niche IS 'Active keywords ready for scraping, sorted by trending score';

-- ============================================================================
-- View 2: keyword_health_dashboard (Admin monitoring)
-- ============================================================================

CREATE OR REPLACE VIEW keyword_health_dashboard AS
SELECT
  n.id as niche_id,
  n.name as niche_name,
  n.target_keyword_count,
  COUNT(CASE WHEN nk.status = 'active' THEN 1 END) as active_count,
  COUNT(CASE WHEN nk.status = 'reserved' THEN 1 END) as reserved_count,
  COUNT(CASE WHEN nk.status = 'archived' THEN 1 END) as archived_count,
  COUNT(CASE WHEN nk.status = 'testing' THEN 1 END) as testing_count,
  AVG(CASE WHEN nk.status = 'active' THEN nk.trending_score END) as avg_trending_score,
  AVG(CASE WHEN nk.status = 'active' THEN nk.virality_correlation END) as avg_virality_correlation,
  SUM(CASE WHEN nk.status = 'active' THEN nk.viral_videos_found ELSE 0 END) as total_viral_videos,
  MAX(nk.last_used_at) as last_scrape_date
FROM niches n
LEFT JOIN niche_keywords nk ON nk.niche_id = n.id
GROUP BY n.id, n.name, n.target_keyword_count
ORDER BY n.name;

COMMENT ON VIEW keyword_health_dashboard IS 'Niche-level keyword inventory and health metrics for admin monitoring';

-- ============================================================================
-- View 3: keywords_needing_rotation (Decision support)
-- ============================================================================

CREATE OR REPLACE VIEW keywords_needing_rotation AS
SELECT
  nk.id,
  nk.niche_id,
  nk.keyword,
  nk.status,
  nk.trending_score,
  nk.virality_correlation,
  nk.times_used,
  nk.viral_videos_found,
  nk.last_used_at,
  CASE
    WHEN nk.trending_score < 0.20 THEN 'low_trending'
    WHEN nk.virality_correlation < 0.15 THEN 'low_correlation'
    WHEN nk.times_used > 100 AND nk.viral_videos_found < 5 THEN 'exhausted'
    WHEN nk.last_used_at < NOW() - INTERVAL '90 days' THEN 'stale'
    ELSE 'other'
  END as rotation_reason,
  CASE
    WHEN nk.trending_score < 0.10 THEN 'high'
    WHEN nk.trending_score < 0.20 THEN 'medium'
    ELSE 'low'
  END as rotation_priority
FROM niche_keywords nk
WHERE nk.status = 'active'
  AND (
    nk.trending_score < 0.20  -- Trending score too low
    OR nk.virality_correlation < 0.15  -- Poor viral correlation
    OR (nk.times_used > 100 AND nk.viral_videos_found < 5)  -- Exhausted
    OR nk.last_used_at < NOW() - INTERVAL '90 days'  -- Not used in 90 days
  )
ORDER BY rotation_priority, nk.trending_score ASC;

COMMENT ON VIEW keywords_needing_rotation IS 'Active keywords that should be archived and replaced (decision support)';

-- ============================================================================
-- Seed Data: Insert 20 Niches
-- ============================================================================

INSERT INTO niches (id, name, description, category, target_keyword_count) VALUES
  ('personal-finance', 'Personal Finance & Money', 'Money-making, investing, side hustles, financial freedom', 'money', 50),
  ('self-improvement', 'Self-Improvement & Productivity', 'Mindset, habits, personal growth, time management', 'lifestyle', 50),
  ('fitness-health', 'Fitness & Health', 'Workouts, nutrition, weight loss, wellness', 'health', 50),
  ('dating-relationships', 'Dating & Relationships', 'Dating advice, relationship tips, social dynamics', 'lifestyle', 50),
  ('tech-ai', 'Technology & AI', 'Tech reviews, AI tools, software tutorials', 'tech', 50),
  ('business-entrepreneurship', 'Business & Entrepreneurship', 'Startups, business ideas, entrepreneur mindset', 'money', 50),
  ('content-creation', 'Content Creation & Social Media', 'Growing on social media, content strategy', 'creator', 50),
  ('cooking-food', 'Cooking & Food', 'Recipes, food hacks, meal prep', 'lifestyle', 50),
  ('psychology-mind', 'Psychology & Human Behavior', 'Psychology facts, human behavior, mental models', 'education', 50),
  ('career-work', 'Career & Professional Development', 'Job advice, career growth, workplace tips', 'career', 50),
  ('real-estate', 'Real Estate & Property', 'Real estate investing, property flipping, rentals', 'money', 50),
  ('travel-adventure', 'Travel & Adventure', 'Travel tips, destinations, adventure stories', 'lifestyle', 50),
  ('fashion-style', 'Fashion & Style', 'Outfit ideas, fashion tips, style guides', 'lifestyle', 50),
  ('parenting-kids', 'Parenting & Kids', 'Parenting tips, child development, family activities', 'family', 50),
  ('education-learning', 'Education & Learning', 'Study tips, learning strategies, education hacks', 'education', 50),
  ('home-diy', 'Home & DIY', 'Home improvement, DIY projects, organization hacks', 'lifestyle', 50),
  ('cars-automotive', 'Cars & Automotive', 'Car reviews, maintenance tips, automotive news', 'tech', 50),
  ('pets-animals', 'Pets & Animals', 'Pet care, training tips, animal videos', 'lifestyle', 50),
  ('comedy-entertainment', 'Comedy & Entertainment', 'Funny skits, comedy, entertainment content', 'entertainment', 50),
  ('storytelling-true-crime', 'Storytelling & True Crime', 'True crime stories, narratives, story-driven content', 'entertainment', 50)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Function: Auto-update trending_score based on recent performance
-- ============================================================================

CREATE OR REPLACE FUNCTION update_keyword_trending_scores()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update trending scores based on recent activity (last 30 days)
  -- Formula: (viral_videos_found_recent / times_used_recent) * recency_weight

  UPDATE niche_keywords
  SET
    trending_score = LEAST(1.00, GREATEST(0.00,
      CASE
        WHEN times_used = 0 THEN 0.50  -- New keywords start at 0.50
        WHEN last_used_at IS NULL THEN 0.10  -- Never used = low score
        WHEN last_used_at < NOW() - INTERVAL '90 days' THEN 0.05  -- Stale
        WHEN last_used_at < NOW() - INTERVAL '30 days' THEN 0.20  -- Aging
        ELSE (viral_videos_found::NUMERIC / GREATEST(times_used, 1)) *
             (1.0 - EXTRACT(EPOCH FROM (NOW() - last_used_at)) / (30 * 86400))  -- Decay factor
      END
    )),
    updated_at = NOW()
  WHERE status IN ('active', 'testing');

END;
$$;

COMMENT ON FUNCTION update_keyword_trending_scores IS 'Recalculates trending_score for all active/testing keywords based on recent performance';

-- ============================================================================
-- Function: Auto-archive low-performing keywords
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_archive_underperforming_keywords()
RETURNS TABLE(archived_count INTEGER, keywords_archived TEXT[])
LANGUAGE plpgsql
AS $$
DECLARE
  archived_keyword_ids UUID[];
  archived_keywords TEXT[];
  count INTEGER;
BEGIN
  -- Archive keywords meeting any of these criteria:
  -- 1. Trending score < 0.10 (dead)
  -- 2. Used 50+ times but viral_correlation < 0.10 (poor performer)
  -- 3. Not used in 180 days (abandoned)

  WITH archived AS (
    UPDATE niche_keywords
    SET
      status = 'archived',
      archived_at = NOW(),
      archive_reason = CASE
        WHEN trending_score < 0.10 THEN 'low_trending_score'
        WHEN times_used >= 50 AND virality_correlation < 0.10 THEN 'poor_virality_correlation'
        WHEN last_used_at < NOW() - INTERVAL '180 days' THEN 'not_used_180_days'
        ELSE 'auto_archived'
      END
    WHERE status = 'active'
      AND (
        trending_score < 0.10
        OR (times_used >= 50 AND virality_correlation < 0.10)
        OR last_used_at < NOW() - INTERVAL '180 days'
      )
    RETURNING id, keyword
  )
  SELECT array_agg(id), array_agg(keyword) INTO archived_keyword_ids, archived_keywords
  FROM archived;

  -- Log the rotation
  INSERT INTO keyword_rotation_log (keyword_id, old_status, new_status, rotation_reason, rotated_by)
  SELECT
    id,
    'active',
    'archived',
    'auto_archive: ' || archive_reason,
    'system'
  FROM niche_keywords
  WHERE id = ANY(archived_keyword_ids);

  count := array_length(archived_keyword_ids, 1);

  RETURN QUERY SELECT count, COALESCE(archived_keywords, ARRAY[]::TEXT[]);
END;
$$;

COMMENT ON FUNCTION auto_archive_underperforming_keywords IS 'Automatically archives keywords that are dead/poor-performing/abandoned';

-- ============================================================================
-- Grant Permissions (Placeholder - will be set with roles)
-- ============================================================================

-- NOTE: Will be configured in separate migration with proper role-based access control

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON SCHEMA public IS 'Niche Keywords System: 1000+ timestamped keywords with archive/reserve system for viral content scraping';
