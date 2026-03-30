-- Migration: P8 Audience Enrichment
-- Adds region to user_channels (inferred from Apify) and
-- audience_location / audience_occupation to calibration_profiles (progressive capture)

-- Region extracted from TikTok author metadata during channel verification
ALTER TABLE user_channels ADD COLUMN IF NOT EXISTS region text;

-- Progressive audience enrichment captured during Audience Diagnostic phase
ALTER TABLE calibration_profiles ADD COLUMN IF NOT EXISTS audience_location text;
ALTER TABLE calibration_profiles ADD COLUMN IF NOT EXISTS audience_occupation text;
