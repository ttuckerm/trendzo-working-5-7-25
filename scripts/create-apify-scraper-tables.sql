-- ApifyScraper Database Schema
-- Creates tables for storing scraped TikTok video data and scraping operations

-- Scraping Jobs: Track batch scraping operations
CREATE TABLE IF NOT EXISTS scraping_jobs (
    job_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keywords TEXT[] NOT NULL, -- Keywords used for scraping
    platform VARCHAR(50) NOT NULL DEFAULT 'tiktok', -- 'tiktok', 'instagram', 'youtube'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'error'
    total_videos_requested INTEGER DEFAULT 0,
    total_videos_scraped INTEGER DEFAULT 0,
    total_videos_downloaded INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    apify_actor_id VARCHAR(255), -- Apify actor used
    apify_run_id VARCHAR(255), -- Apify run ID for tracking
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scraped Videos: Raw data from scraping before processing
CREATE TABLE IF NOT EXISTS scraped_videos (
    video_id VARCHAR(255) PRIMARY KEY,
    scraping_job_id UUID REFERENCES scraping_jobs(job_id) ON DELETE CASCADE,
    
    -- Basic video metadata
    title VARCHAR(500),
    description TEXT,
    original_url VARCHAR(1000) NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'tiktok',
    platform_video_id VARCHAR(255), -- Platform-specific ID
    
    -- Creator information
    creator_id VARCHAR(255),
    creator_username VARCHAR(255),
    creator_display_name VARCHAR(255),
    creator_followers_count BIGINT DEFAULT 0,
    creator_verified BOOLEAN DEFAULT false,
    
    -- Video metrics at time of scraping
    views_count BIGINT DEFAULT 0,
    likes_count BIGINT DEFAULT 0,
    shares_count BIGINT DEFAULT 0,
    comments_count BIGINT DEFAULT 0,
    
    -- Video technical details
    duration_seconds INTEGER,
    video_url VARCHAR(1000), -- Direct video file URL
    thumbnail_url VARCHAR(1000),
    
    -- Content metadata
    hashtags TEXT[],
    mentions TEXT[],
    music_title VARCHAR(255),
    music_artist VARCHAR(255),
    music_url VARCHAR(1000),
    
    -- Upload information
    upload_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Download status
    download_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'downloading', 'completed', 'failed'
    local_file_path VARCHAR(500),
    file_size_bytes BIGINT,
    download_error TEXT,
    
    -- Raw scraping data
    raw_scraping_data JSONB DEFAULT '{}', -- Original JSON from Apify
    
    -- Processing flags
    needs_processing BOOLEAN DEFAULT true,
    processing_priority INTEGER DEFAULT 1, -- 1=low, 5=high
    
    -- Timestamps
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Download Queue: Manage video download operations
CREATE TABLE IF NOT EXISTS download_queue (
    queue_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL REFERENCES scraped_videos(video_id) ON DELETE CASCADE,
    video_url VARCHAR(1000) NOT NULL,
    priority INTEGER DEFAULT 1, -- 1=low, 5=high
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'downloading', 'completed', 'failed', 'retry'
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    file_size_bytes BIGINT,
    download_speed_kbps DECIMAL(10,2),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scraping Keywords: Track which keywords are being monitored
CREATE TABLE IF NOT EXISTS scraping_keywords (
    keyword_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100), -- 'trending', 'niche', 'brand', etc.
    is_active BOOLEAN DEFAULT true,
    scraping_frequency VARCHAR(50) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
    max_videos_per_scrape INTEGER DEFAULT 100,
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    total_videos_scraped INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_platform ON scraping_jobs(platform);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scraped_videos_creator_id ON scraped_videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_platform ON scraped_videos(platform);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_upload_timestamp ON scraped_videos(upload_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_views_count ON scraped_videos(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_likes_count ON scraped_videos(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_download_status ON scraped_videos(download_status);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_needs_processing ON scraped_videos(needs_processing);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_processing_priority ON scraped_videos(processing_priority DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_scraped_at ON scraped_videos(scraped_at DESC);

CREATE INDEX IF NOT EXISTS idx_download_queue_status ON download_queue(status);
CREATE INDEX IF NOT EXISTS idx_download_queue_priority ON download_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_download_queue_created_at ON download_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scraping_keywords_is_active ON scraping_keywords(is_active);
CREATE INDEX IF NOT EXISTS idx_scraping_keywords_category ON scraping_keywords(category);
CREATE INDEX IF NOT EXISTS idx_scraping_keywords_last_scraped ON scraping_keywords(last_scraped_at DESC);

-- GIN indexes for array and JSON fields
CREATE INDEX IF NOT EXISTS idx_scraped_videos_hashtags_gin ON scraped_videos USING GIN (hashtags);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_mentions_gin ON scraped_videos USING GIN (mentions);
CREATE INDEX IF NOT EXISTS idx_scraped_videos_raw_data_gin ON scraped_videos USING GIN (raw_scraping_data);

-- Row Level Security (RLS)
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_keywords ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS scraping_jobs_policy ON scraping_jobs;
DROP POLICY IF EXISTS scraped_videos_policy ON scraped_videos;
DROP POLICY IF EXISTS download_queue_policy ON download_queue;
DROP POLICY IF EXISTS scraping_keywords_policy ON scraping_keywords;

-- Create RLS Policies (Allow all for authenticated users)
CREATE POLICY scraping_jobs_policy ON scraping_jobs FOR ALL USING (true);
CREATE POLICY scraped_videos_policy ON scraped_videos FOR ALL USING (true);
CREATE POLICY download_queue_policy ON download_queue FOR ALL USING (true);
CREATE POLICY scraping_keywords_policy ON scraping_keywords FOR ALL USING (true);

-- Add helpful comments
COMMENT ON TABLE scraping_jobs IS 'Batch scraping operations tracking keywords and results';
COMMENT ON TABLE scraped_videos IS 'Raw scraped video data before feature decomposition';
COMMENT ON TABLE download_queue IS 'Queue for downloading video files from scraped URLs';
COMMENT ON TABLE scraping_keywords IS 'Keywords being monitored for regular scraping';

COMMENT ON COLUMN scraped_videos.raw_scraping_data IS 'Original JSON response from Apify scraping';
COMMENT ON COLUMN scraped_videos.needs_processing IS 'Flag indicating if video needs feature decomposition';
COMMENT ON COLUMN download_queue.download_speed_kbps IS 'Download speed in kilobytes per second';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_scraped_videos_updated_at ON scraped_videos;
DROP TRIGGER IF EXISTS update_scraping_keywords_updated_at ON scraping_keywords;

-- Create triggers
CREATE TRIGGER update_scraped_videos_updated_at 
    BEFORE UPDATE ON scraped_videos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraping_keywords_updated_at 
    BEFORE UPDATE ON scraping_keywords 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default scraping keywords
INSERT INTO scraping_keywords (keyword, category, scraping_frequency, max_videos_per_scrape) VALUES
('viral video', 'trending', 'daily', 50),
('trending tiktok', 'trending', 'daily', 50),
('fyp', 'trending', 'daily', 100),
('viral trend', 'trending', 'daily', 50),
('tiktok viral', 'trending', 'daily', 50)
ON CONFLICT (keyword) DO NOTHING;

-- Example queries for verification
/*
-- View scraping jobs summary
SELECT job_id, array_length(keywords, 1) as keyword_count, status, 
       total_videos_scraped, total_videos_downloaded, created_at
FROM scraping_jobs 
ORDER BY created_at DESC;

-- View scraped videos summary
SELECT platform, COUNT(*) as video_count, 
       COUNT(*) FILTER (WHERE download_status = 'completed') as downloaded_count
FROM scraped_videos 
GROUP BY platform;

-- Top performing scraped videos
SELECT video_id, title, creator_username, views_count, likes_count, upload_timestamp
FROM scraped_videos
WHERE views_count > 10000
ORDER BY views_count DESC
LIMIT 10;

-- Download queue status
SELECT status, COUNT(*) as count
FROM download_queue
GROUP BY status;

-- Active scraping keywords
SELECT keyword, category, total_videos_scraped, last_scraped_at
FROM scraping_keywords
WHERE is_active = true
ORDER BY total_videos_scraped DESC;
*/