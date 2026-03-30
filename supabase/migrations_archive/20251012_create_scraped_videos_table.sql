-- =====================================================
-- Create scraped_videos table for TikTok Apify Integration
-- =====================================================
-- This table stores raw scraped video data from Apify actors
-- Used by the apify-ingest Edge Function (Option A: Hosted Pipeline)
-- Author: Trendzo Data Engineering
-- Date: 2025-10-12

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================
-- 1. Scraped Videos Table (Primary Storage)
-- =====================================================

CREATE TABLE IF NOT EXISTS scraped_videos (
    -- Primary Key
    video_id TEXT PRIMARY KEY,
    
    -- Scraping Job Reference (optional)
    scraping_job_id UUID,
    
    -- Basic video metadata
    title TEXT,
    description TEXT,
    url TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'tiktok',
    tiktok_id TEXT, -- Platform-specific ID (same as video_id for TikTok)
    
    -- Creator information (from authorMeta)
    creator_id TEXT,
    creator_username TEXT,
    creator_nickname TEXT,
    creator_followers_count BIGINT DEFAULT 0,
    creator_verified BOOLEAN DEFAULT false,
    
    -- Video metrics (from stats)
    views_count BIGINT DEFAULT 0,
    likes_count BIGINT DEFAULT 0,
    shares_count BIGINT DEFAULT 0,
    comments_count BIGINT DEFAULT 0,
    
    -- Video technical details
    duration_seconds INTEGER,
    video_url TEXT, -- Direct video file URL (webVideoUrl)
    thumbnail_url TEXT,
    
    -- Content metadata
    caption TEXT,
    hashtags TEXT[],
    mentions TEXT[],
    
    -- Music/Sound metadata (from musicMeta)
    music_id TEXT,
    music_name TEXT,
    music_author TEXT,
    music_is_original BOOLEAN,
    
    -- Upload information
    upload_timestamp TIMESTAMPTZ,
    created_at_utc TIMESTAMPTZ,
    
    -- Transcript/Subtitles
    subtitles JSONB,
    transcript_text TEXT,
    
    -- Download/Processing status
    download_status TEXT DEFAULT 'pending', -- 'pending', 'downloading', 'completed', 'failed'
    needs_processing BOOLEAN DEFAULT true,
    processing_priority INTEGER DEFAULT 1, -- 1=low, 5=high
    
    -- Raw data storage
    raw_scraping_data JSONB DEFAULT '{}', -- Original JSON from Apify
    
    -- Timestamps
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    downloaded_at TIMESTAMPTZ,
    inserted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Scraping Jobs Table (Optional - for tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS scraping_jobs (
    job_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keywords TEXT[],
    platform TEXT NOT NULL DEFAULT 'tiktok',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'error'
    total_videos_requested INTEGER DEFAULT 0,
    total_videos_scraped INTEGER DEFAULT 0,
    apify_actor_id TEXT,
    apify_run_id TEXT,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. Performance Indexes
-- =====================================================

-- Core lookup indexes
CREATE INDEX IF NOT EXISTS idx_scraped_videos_tiktok_id ON scraped_videos(tiktok_id);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_creator_id ON scraped_videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_creator_username ON scraped_videos(creator_username);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_platform ON scraped_videos(platform);

-- Timestamp indexes for time-based queries
CREATE INDEX IF NOT EXISTS idx_scraped_videos_upload_timestamp ON scraped_videos(upload_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_scraped_at ON scraped_videos(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_inserted_at ON scraped_videos(inserted_at DESC);

-- Metrics indexes for analytics
CREATE INDEX IF NOT EXISTS idx_scraped_videos_views_count ON scraped_videos(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_likes_count ON scraped_videos(likes_count DESC);

-- Processing queue indexes
CREATE INDEX IF NOT EXISTS idx_scraped_videos_needs_processing ON scraped_videos(needs_processing);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_processing_priority ON scraped_videos(processing_priority DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_download_status ON scraped_videos(download_status);

-- GIN indexes for array and JSONB fields
CREATE INDEX IF NOT EXISTS idx_scraped_videos_hashtags_gin ON scraped_videos USING GIN (hashtags);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_mentions_gin ON scraped_videos USING GIN (mentions);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_raw_data_gin ON scraped_videos USING GIN (raw_scraping_data);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_subtitles_gin ON scraped_videos USING GIN (subtitles);

-- Scraping jobs indexes
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_platform ON scraping_jobs(platform);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_apify_run_id ON scraping_jobs(apify_run_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at DESC);

-- =====================================================
-- 4. Foreign Key Constraints
-- =====================================================

-- Add FK to scraping_jobs if needed
ALTER TABLE scraped_videos 
ADD CONSTRAINT fk_scraped_videos_job 
FOREIGN KEY (scraping_job_id) 
REFERENCES scraping_jobs(job_id) 
ON DELETE SET NULL;

-- =====================================================
-- 5. Row Level Security (RLS)
-- =====================================================

ALTER TABLE scraped_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role has full access to scraped_videos" 
  ON scraped_videos FOR ALL 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to scraping_jobs" 
  ON scraping_jobs FOR ALL 
  USING (auth.role() = 'service_role');

-- Authenticated users read access
CREATE POLICY "Authenticated users can read scraped_videos" 
  ON scraped_videos FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read scraping_jobs" 
  ON scraping_jobs FOR SELECT 
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 6. Helper Functions
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_scraped_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS trigger_scraped_videos_updated_at ON scraped_videos;
CREATE TRIGGER trigger_scraped_videos_updated_at 
    BEFORE UPDATE ON scraped_videos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_scraped_videos_updated_at();

-- =====================================================
-- 7. Table Comments (Documentation)
-- =====================================================

COMMENT ON TABLE scraped_videos IS 'Raw scraped video data from Apify TikTok actors - primary ingestion point for viral prediction pipeline';
COMMENT ON TABLE scraping_jobs IS 'Tracks batch scraping operations and their results';

COMMENT ON COLUMN scraped_videos.video_id IS 'Primary key - TikTok video ID from Apify (same as id field)';
COMMENT ON COLUMN scraped_videos.tiktok_id IS 'TikTok platform video ID (duplicate of video_id for clarity)';
COMMENT ON COLUMN scraped_videos.url IS 'Public video URL (webVideoUrl from Apify)';
COMMENT ON COLUMN scraped_videos.caption IS 'Video caption/description text (text field from Apify)';
COMMENT ON COLUMN scraped_videos.created_at_utc IS 'Video creation time on platform (createTime from Apify)';
COMMENT ON COLUMN scraped_videos.hashtags IS 'Array of hashtags extracted from video';
COMMENT ON COLUMN scraped_videos.music_id IS 'Music/sound ID (musicMeta.musicId from Apify)';
COMMENT ON COLUMN scraped_videos.subtitles IS 'Raw subtitles array from Apify (if available)';
COMMENT ON COLUMN scraped_videos.transcript_text IS 'Processed transcript text (from subtitles or Whisper)';
COMMENT ON COLUMN scraped_videos.raw_scraping_data IS 'Complete original JSON payload from Apify for debugging';
COMMENT ON COLUMN scraped_videos.needs_processing IS 'Flag indicating if video needs DPS calculation and feature extraction';

-- =====================================================
-- 8. Verification
-- =====================================================

DO $$ 
DECLARE
  table_exists BOOLEAN;
  index_count INTEGER;
BEGIN
  -- Check if scraped_videos table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'scraped_videos'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ scraped_videos table created successfully';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'scraped_videos';
    
    RAISE NOTICE '✅ Created % indexes on scraped_videos', index_count;
  ELSE
    RAISE WARNING '⚠️  scraped_videos table creation failed';
  END IF;
END $$;

-- Log migration completion
SELECT 
  'scraped_videos table migration completed' AS status,
  NOW() AS completed_at,
  'Ready for Apify TikTok webhook integration' AS notes;

