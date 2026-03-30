-- Migration: Add permanent video storage support
-- Created: 2025-10-29
-- Purpose: Store TikTok videos permanently to enable delayed FFmpeg processing

-- 1. Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('tiktok-videos', 'tiktok-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up storage policies (allow authenticated access)
CREATE POLICY "Allow authenticated uploads to tiktok-videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tiktok-videos');

CREATE POLICY "Allow public read access to tiktok-videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tiktok-videos');

CREATE POLICY "Allow authenticated delete from tiktok-videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tiktok-videos');

-- 3. Add permanent_video_url field to scraped_videos
ALTER TABLE scraped_videos
ADD COLUMN IF NOT EXISTS permanent_video_url TEXT;

-- 4. Add storage metadata fields
ALTER TABLE scraped_videos
ADD COLUMN IF NOT EXISTS video_stored_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS video_file_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS video_storage_path TEXT;

-- 5. Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_scraped_videos_permanent_url
ON scraped_videos(permanent_video_url)
WHERE permanent_video_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scraped_videos_stored_at
ON scraped_videos(video_stored_at)
WHERE video_stored_at IS NOT NULL;

-- 6. Add comments for documentation
COMMENT ON COLUMN scraped_videos.permanent_video_url IS 'Permanent Supabase Storage URL for the video file';
COMMENT ON COLUMN scraped_videos.video_stored_at IS 'Timestamp when video was uploaded to permanent storage';
COMMENT ON COLUMN scraped_videos.video_file_size_bytes IS 'Size of stored video file in bytes';
COMMENT ON COLUMN scraped_videos.video_storage_path IS 'Storage path in bucket (e.g., videos/123456789.mp4)';
