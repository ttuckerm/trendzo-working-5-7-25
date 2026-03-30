-- Adds a new column to store the direct URL for video previews, separate from the source URL.
ALTER TABLE video_intelligence
ADD COLUMN video_preview_url TEXT;

COMMENT ON COLUMN video_intelligence.video_preview_url IS 'Direct URL to the video file for previews (e.g., .mp4)';