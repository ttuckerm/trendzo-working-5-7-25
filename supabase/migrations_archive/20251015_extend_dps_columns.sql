-- Extend DPS columns in scraped_videos table
-- Add z_score and confidence columns needed by orchestrator

ALTER TABLE scraped_videos
ADD COLUMN IF NOT EXISTS dps_z_score DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS dps_confidence DECIMAL(4,3) CHECK (dps_confidence IS NULL OR (dps_confidence >= 0 AND dps_confidence <= 1));

COMMENT ON COLUMN scraped_videos.dps_z_score IS 'Z-score (standard deviations from cohort mean)';
COMMENT ON COLUMN scraped_videos.dps_confidence IS 'Confidence score for DPS calculation (0-1)';

-- Create index for querying by z-score
CREATE INDEX IF NOT EXISTS idx_scraped_videos_dps_z_score
ON scraped_videos(dps_z_score DESC)
WHERE dps_z_score IS NOT NULL;
