-- FeatureDecomposer Database Schema
-- Creates tables for storing decomposed video features

-- Video Features: Core video analysis data
CREATE TABLE IF NOT EXISTS video_features (
    video_id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500),
    description TEXT,
    duration INTEGER, -- Duration in seconds
    views BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    shares BIGINT DEFAULT 0,
    comments BIGINT DEFAULT 0,
    creator_id VARCHAR(255),
    creator_name VARCHAR(255),
    creator_followers BIGINT DEFAULT 0,
    upload_date TIMESTAMP WITH TIME ZONE,
    
    -- Video technical features
    resolution VARCHAR(20), -- e.g., "1080x1920"
    fps INTEGER, -- Frames per second
    bitrate INTEGER, -- Video bitrate
    file_size BIGINT, -- File size in bytes
    
    -- Audio features
    audio_duration INTEGER, -- Audio duration in seconds
    audio_channels INTEGER DEFAULT 2,
    audio_sample_rate INTEGER DEFAULT 44100,
    audio_bitrate INTEGER,
    
    -- Visual features
    dominant_colors JSONB DEFAULT '[]', -- RGB color values
    brightness_avg DECIMAL(5,2),
    contrast_avg DECIMAL(5,2),
    saturation_avg DECIMAL(5,2),
    motion_intensity DECIMAL(5,2), -- Motion analysis score
    
    -- Text features
    caption TEXT,
    transcript TEXT,
    ocr_text TEXT,
    hashtags TEXT[],
    mentions TEXT[],
    
    -- Engagement metrics (time-based)
    likes_1h BIGINT DEFAULT 0,
    views_1h BIGINT DEFAULT 0,
    comments_1h BIGINT DEFAULT 0,
    shares_1h BIGINT DEFAULT 0,
    
    -- Processing metadata
    processing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
    error_message TEXT,
    features_extracted JSONB DEFAULT '{}', -- Which features were successfully extracted
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Feature Extraction Runs: Audit log of feature decomposition runs
CREATE TABLE IF NOT EXISTS feature_extraction_runs (
    run_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL,
    extraction_type VARCHAR(50) NOT NULL, -- 'full', 'visual', 'audio', 'text'
    status VARCHAR(50) NOT NULL, -- 'completed', 'error', 'processing'
    features_extracted TEXT[], -- List of features successfully extracted
    processing_time_ms INTEGER NOT NULL DEFAULT 0,
    file_paths JSONB DEFAULT '{}', -- Paths to generated files (frames, audio, etc.)
    error_message TEXT,
    run_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raw Video Metadata: Store original video file information
CREATE TABLE IF NOT EXISTS raw_videos (
    video_id VARCHAR(255) PRIMARY KEY,
    original_url VARCHAR(1000),
    local_file_path VARCHAR(500),
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_hash VARCHAR(64), -- SHA-256 hash for deduplication
    source_platform VARCHAR(50), -- 'tiktok', 'instagram', 'youtube', etc.
    scraping_metadata JSONB DEFAULT '{}', -- Original scraping data
    download_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_video_features_creator_id ON video_features(creator_id);
CREATE INDEX IF NOT EXISTS idx_video_features_upload_date ON video_features(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_video_features_views ON video_features(views DESC);
CREATE INDEX IF NOT EXISTS idx_video_features_likes ON video_features(likes DESC);
CREATE INDEX IF NOT EXISTS idx_video_features_processing_status ON video_features(processing_status);
CREATE INDEX IF NOT EXISTS idx_video_features_created_at ON video_features(created_at DESC);

-- Engagement metrics indexes
CREATE INDEX IF NOT EXISTS idx_video_features_likes_1h ON video_features(likes_1h DESC);
CREATE INDEX IF NOT EXISTS idx_video_features_views_1h ON video_features(views_1h DESC);
CREATE INDEX IF NOT EXISTS idx_video_features_creator_followers ON video_features(creator_followers DESC);

-- Feature extraction runs indexes
CREATE INDEX IF NOT EXISTS idx_feature_extraction_runs_video_id ON feature_extraction_runs(video_id);
CREATE INDEX IF NOT EXISTS idx_feature_extraction_runs_status ON feature_extraction_runs(status);
CREATE INDEX IF NOT EXISTS idx_feature_extraction_runs_timestamp ON feature_extraction_runs(run_timestamp DESC);

-- Raw videos indexes
CREATE INDEX IF NOT EXISTS idx_raw_videos_source_platform ON raw_videos(source_platform);
CREATE INDEX IF NOT EXISTS idx_raw_videos_file_hash ON raw_videos(file_hash);
CREATE INDEX IF NOT EXISTS idx_raw_videos_download_timestamp ON raw_videos(download_timestamp DESC);

-- GIN indexes for JSON fields
CREATE INDEX IF NOT EXISTS idx_video_features_hashtags_gin ON video_features USING GIN (hashtags);
CREATE INDEX IF NOT EXISTS idx_video_features_features_extracted_gin ON video_features USING GIN (features_extracted);
CREATE INDEX IF NOT EXISTS idx_raw_videos_scraping_metadata_gin ON raw_videos USING GIN (scraping_metadata);

-- Row Level Security (RLS)
ALTER TABLE video_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_extraction_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS video_features_policy ON video_features;
DROP POLICY IF EXISTS feature_extraction_runs_policy ON feature_extraction_runs;
DROP POLICY IF EXISTS raw_videos_policy ON raw_videos;

-- Create RLS Policies (Allow all for authenticated users)
CREATE POLICY video_features_policy ON video_features FOR ALL USING (true);
CREATE POLICY feature_extraction_runs_policy ON feature_extraction_runs FOR ALL USING (true);
CREATE POLICY raw_videos_policy ON raw_videos FOR ALL USING (true);

-- Add helpful comments
COMMENT ON TABLE video_features IS 'Decomposed features from video analysis including visual, audio, and text data';
COMMENT ON TABLE feature_extraction_runs IS 'Audit log of feature decomposition processing runs';
COMMENT ON TABLE raw_videos IS 'Original video file metadata and storage information';

COMMENT ON COLUMN video_features.dominant_colors IS 'RGB color values extracted from video frames';
COMMENT ON COLUMN video_features.motion_intensity IS 'Calculated motion analysis score (0.0 to 1.0)';
COMMENT ON COLUMN video_features.features_extracted IS 'JSON object tracking which features were successfully extracted';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_video_features_updated_at ON video_features;
DROP TRIGGER IF EXISTS update_raw_videos_updated_at ON raw_videos;

-- Create triggers
CREATE TRIGGER update_video_features_updated_at 
    BEFORE UPDATE ON video_features 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Example queries for verification
/*
-- View video features summary
SELECT video_id, title, duration, views, likes, processing_status, created_at
FROM video_features 
ORDER BY created_at DESC 
LIMIT 10;

-- View feature extraction runs
SELECT run_id, video_id, extraction_type, status, processing_time_ms, run_timestamp
FROM feature_extraction_runs
ORDER BY run_timestamp DESC;

-- Find videos by processing status
SELECT COUNT(*), processing_status
FROM video_features
GROUP BY processing_status;

-- Top performing videos by engagement
SELECT video_id, title, views, likes, (likes::float / GREATEST(views, 1)) as engagement_rate
FROM video_features
WHERE views > 1000
ORDER BY engagement_rate DESC
LIMIT 10;
*/