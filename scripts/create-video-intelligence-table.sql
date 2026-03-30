-- Create the core video_intelligence table for storing all scraped video data
-- This table will be the lifeblood of our entire viral prediction platform

CREATE TABLE IF NOT EXISTS video_intelligence (
    -- Primary identification
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    
    -- Video source information
    video_url text UNIQUE NOT NULL,
    platform text NOT NULL,
    
    -- Content metadata
    author text,
    thumbnail_url text,
    
    -- Engagement metrics
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    share_count integer DEFAULT 0,
    view_count bigint DEFAULT 0,
    engagement_score integer DEFAULT 0,
    
    -- Content analysis
    hashtags jsonb,
    
    -- System tracking
    status text DEFAULT 'unverified',
    
    -- Raw data storage for future analysis
    raw_scraper_payload jsonb
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_video_intelligence_url ON video_intelligence(video_url);
CREATE INDEX IF NOT EXISTS idx_video_intelligence_platform ON video_intelligence(platform);
CREATE INDEX IF NOT EXISTS idx_video_intelligence_created_at ON video_intelligence(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_intelligence_status ON video_intelligence(status);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_video_intelligence_platform_created_at 
ON video_intelligence(platform, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE video_intelligence IS 'Central table storing all scraped video data and metrics';
COMMENT ON COLUMN video_intelligence.video_url IS 'Original video URL - must be unique';
COMMENT ON COLUMN video_intelligence.platform IS 'Video platform (TikTok, YouTube, Instagram, etc.)';
COMMENT ON COLUMN video_intelligence.thumbnail_url IS 'URL of the video thumbnail image';
COMMENT ON COLUMN video_intelligence.engagement_score IS 'Calculated viral engagement score (0-100)';
COMMENT ON COLUMN video_intelligence.status IS 'Verification status for tracking prediction accuracy';
COMMENT ON COLUMN video_intelligence.raw_scraper_payload IS 'Full raw data from scraper for future analysis';

-- Grant appropriate permissions (adjust based on your Supabase setup)
-- These would typically be handled through Supabase RLS policies in production