-- Add permanent video storage columns to scraped_videos
-- Run this in Supabase SQL Editor

ALTER TABLE scraped_videos
ADD COLUMN IF NOT EXISTS permanent_video_url TEXT,
ADD COLUMN IF NOT EXISTS video_stored_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS video_file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS video_storage_path TEXT;

CREATE INDEX IF NOT EXISTS idx_scraped_videos_permanent_url
ON scraped_videos(permanent_video_url)
WHERE permanent_video_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scraped_videos_stored_at
ON scraped_videos(video_stored_at)
WHERE video_stored_at IS NOT NULL;

COMMENT ON COLUMN scraped_videos.permanent_video_url IS 'Permanent Supabase Storage URL for the video file';
COMMENT ON COLUMN scraped_videos.video_stored_at IS 'Timestamp when video was uploaded to permanent storage';
COMMENT ON COLUMN scraped_videos.video_file_size_bytes IS 'Size of stored video file in bytes';
COMMENT ON COLUMN scraped_videos.video_storage_path IS 'Storage path in bucket';
