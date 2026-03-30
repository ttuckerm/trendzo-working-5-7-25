-- =====================================================
-- Training Data Pipeline Migration
-- =====================================================
-- Adds columns to scraped_videos for DPS scoring, niche classification,
-- and pattern extraction tracking.
-- Author: Trendzo Data Engineering
-- Date: 2025-12-01

-- =====================================================
-- 1. Add missing columns to scraped_videos
-- =====================================================

-- Add niche column for content categorization
ALTER TABLE scraped_videos 
ADD COLUMN IF NOT EXISTS niche TEXT;

-- Add source column to track data origin
ALTER TABLE scraped_videos 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'apify';

-- Add DPS scoring columns
ALTER TABLE scraped_videos 
ADD COLUMN IF NOT EXISTS dps_score DECIMAL;

ALTER TABLE scraped_videos 
ADD COLUMN IF NOT EXISTS dps_classification TEXT;

ALTER TABLE scraped_videos 
ADD COLUMN IF NOT EXISTS dps_breakdown JSONB;

-- Add saves_count (Apify may provide as collectCount)
ALTER TABLE scraped_videos 
ADD COLUMN IF NOT EXISTS saves_count BIGINT DEFAULT 0;

-- Add pattern extraction tracking
ALTER TABLE scraped_videos 
ADD COLUMN IF NOT EXISTS pattern_extraction_status TEXT DEFAULT 'not_required';

-- Add creator followers (may already exist as creator_followers_count, but ensure consistency)
ALTER TABLE scraped_videos 
ADD COLUMN IF NOT EXISTS creator_followers BIGINT DEFAULT 0;

-- Add imported_at timestamp for bulk imports
ALTER TABLE scraped_videos 
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

-- =====================================================
-- 2. Create indexes for new columns
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_scraped_videos_niche 
ON scraped_videos(niche);

CREATE INDEX IF NOT EXISTS idx_scraped_videos_source 
ON scraped_videos(source);

CREATE INDEX IF NOT EXISTS idx_scraped_videos_dps_score 
ON scraped_videos(dps_score DESC);

CREATE INDEX IF NOT EXISTS idx_scraped_videos_dps_classification 
ON scraped_videos(dps_classification);

CREATE INDEX IF NOT EXISTS idx_scraped_videos_pattern_status 
ON scraped_videos(pattern_extraction_status);

-- Composite index for pattern extraction queries
CREATE INDEX IF NOT EXISTS idx_scraped_videos_pattern_queue 
ON scraped_videos(pattern_extraction_status, dps_score DESC)
WHERE pattern_extraction_status = 'pending';

-- =====================================================
-- 3. Ensure viral_genomes has source_video_id column
-- =====================================================

-- Check if source_video_id column exists, add if not
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'viral_genomes' AND column_name = 'source_video_id'
  ) THEN
    ALTER TABLE viral_genomes ADD COLUMN source_video_id TEXT;
  END IF;
END $$;

-- Add index on source_video_id for lookups
CREATE INDEX IF NOT EXISTS idx_viral_genomes_source_video_id 
ON viral_genomes(source_video_id);

-- =====================================================
-- 4. Update sync function for creator_followers
-- =====================================================

-- Sync creator_followers from creator_followers_count where needed
UPDATE scraped_videos 
SET creator_followers = creator_followers_count 
WHERE creator_followers IS NULL OR creator_followers = 0 
AND creator_followers_count > 0;

-- =====================================================
-- 5. Verification
-- =====================================================

DO $$ 
DECLARE
  col_count INTEGER;
BEGIN
  -- Count new columns
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'scraped_videos'
  AND column_name IN ('niche', 'source', 'dps_score', 'dps_classification', 'dps_breakdown', 'pattern_extraction_status');
  
  IF col_count >= 5 THEN
    RAISE NOTICE '✅ Training data pipeline columns added successfully (% columns)', col_count;
  ELSE
    RAISE WARNING '⚠️  Some columns may not have been added. Found % of expected columns', col_count;
  END IF;
END $$;

-- Log migration completion
SELECT 
  'Training data pipeline migration completed' AS status,
  NOW() AS completed_at,
  'Ready for Apify bulk imports with DPS calculation' AS notes;



