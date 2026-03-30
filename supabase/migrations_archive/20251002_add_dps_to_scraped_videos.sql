-- Add DPS (Dynamic Percentile System) columns to scraped_videos table
-- This allows tracking of viral score calculations directly on scraped videos

ALTER TABLE scraped_videos 
ADD COLUMN IF NOT EXISTS dps_score DECIMAL(5,2) CHECK (dps_score IS NULL OR (dps_score >= 0 AND dps_score <= 100)),
ADD COLUMN IF NOT EXISTS dps_percentile DECIMAL(5,2) CHECK (dps_percentile IS NULL OR (dps_percentile >= 0 AND dps_percentile <= 100)),
ADD COLUMN IF NOT EXISTS dps_classification VARCHAR(50) CHECK (dps_classification IS NULL OR dps_classification IN ('normal', 'viral', 'hyper-viral', 'mega-viral')),
ADD COLUMN IF NOT EXISTS dps_calculated_at TIMESTAMP WITH TIME ZONE;

-- Create index for querying processed videos by DPS score
CREATE INDEX IF NOT EXISTS idx_scraped_videos_dps_score 
ON scraped_videos(dps_score DESC) 
WHERE dps_score IS NOT NULL;

-- Create index for querying by classification
CREATE INDEX IF NOT EXISTS idx_scraped_videos_dps_classification 
ON scraped_videos(dps_classification) 
WHERE dps_classification IS NOT NULL;

-- Create index for processing queue (videos needing DPS calculation)
CREATE INDEX IF NOT EXISTS idx_scraped_videos_needs_dps 
ON scraped_videos(needs_processing, processing_priority DESC, scraped_at) 
WHERE needs_processing = TRUE;

COMMENT ON COLUMN scraped_videos.dps_score IS 'Dynamic Percentile System viral score (0-100)';
COMMENT ON COLUMN scraped_videos.dps_percentile IS 'Percentile rank within cohort (0-100)';
COMMENT ON COLUMN scraped_videos.dps_classification IS 'Viral classification: normal, viral, hyper-viral, mega-viral';
COMMENT ON COLUMN scraped_videos.dps_calculated_at IS 'Timestamp when DPS score was calculated';


