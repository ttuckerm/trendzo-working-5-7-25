-- Bulk Download Predictions Schema Update
-- Adds prediction-related columns to bulk_download_items table

-- Add prediction columns to bulk_download_items
ALTER TABLE bulk_download_items 
ADD COLUMN IF NOT EXISTS predicted_range_low FLOAT,
ADD COLUMN IF NOT EXISTS predicted_range_high FLOAT,
ADD COLUMN IF NOT EXISTS confidence FLOAT,
ADD COLUMN IF NOT EXISTS viral_potential TEXT,
ADD COLUMN IF NOT EXISTS components_used TEXT[],
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS prediction_data JSONB DEFAULT '{}';

-- Add actual metrics columns (for DPS calculation)
ALTER TABLE bulk_download_items
ADD COLUMN IF NOT EXISTS actual_views INTEGER,
ADD COLUMN IF NOT EXISTS actual_likes INTEGER,
ADD COLUMN IF NOT EXISTS actual_comments INTEGER,
ADD COLUMN IF NOT EXISTS actual_shares INTEGER,
ADD COLUMN IF NOT EXISTS actual_saves INTEGER,
ADD COLUMN IF NOT EXISTS comparison_data JSONB DEFAULT '{}';

-- Remove metadata columns that shouldn't be there (RAW video only)
-- These may already not exist, so we use IF EXISTS
ALTER TABLE bulk_download_items 
DROP COLUMN IF EXISTS views,
DROP COLUMN IF EXISTS likes,
DROP COLUMN IF EXISTS comments,
DROP COLUMN IF EXISTS shares,
DROP COLUMN IF EXISTS author_username,
DROP COLUMN IF EXISTS author_display_name,
DROP COLUMN IF EXISTS description;

-- Comments
COMMENT ON COLUMN bulk_download_items.predicted_range_low IS 'Lower bound of prediction range';
COMMENT ON COLUMN bulk_download_items.predicted_range_high IS 'Upper bound of prediction range';
COMMENT ON COLUMN bulk_download_items.confidence IS 'Prediction confidence (0-1)';
COMMENT ON COLUMN bulk_download_items.viral_potential IS 'Viral potential: mega-viral, viral, good, average, low';
COMMENT ON COLUMN bulk_download_items.components_used IS 'Array of Kai components used in prediction';
COMMENT ON COLUMN bulk_download_items.processing_time_ms IS 'Time to process prediction in milliseconds';
COMMENT ON COLUMN bulk_download_items.prediction_data IS 'Full prediction response JSON';
COMMENT ON COLUMN bulk_download_items.actual_views IS 'Actual views for DPS calculation';
COMMENT ON COLUMN bulk_download_items.actual_likes IS 'Actual likes for DPS calculation';
COMMENT ON COLUMN bulk_download_items.actual_comments IS 'Actual comments for DPS calculation';
COMMENT ON COLUMN bulk_download_items.actual_shares IS 'Actual shares for DPS calculation';
COMMENT ON COLUMN bulk_download_items.actual_saves IS 'Actual saves for DPS calculation';
COMMENT ON COLUMN bulk_download_items.comparison_data IS 'Prediction vs actual comparison JSON';










