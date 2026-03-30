-- Sound Metadata & Audio Fingerprinting
-- Adds sound identification fields to scraped_videos for training correlation.
--
-- Purpose: When training on 50,000+ scraped videos, we need to:
-- 1. Identify what sound/music is in each video (TikTok sound_id)
-- 2. Group non-scraped/uploaded videos by similar audio (fingerprint)
-- 3. Correlate sound clusters with actual DPS performance
--
-- Created: 2026-03-08 (Batch B, Prompt 2, Part B2/B3)

-- Add sound metadata columns to scraped_videos
-- These come from TikTok's API via Apify (musicMeta / music object)
ALTER TABLE scraped_videos
  ADD COLUMN IF NOT EXISTS sound_id TEXT,
  ADD COLUMN IF NOT EXISTS sound_name TEXT,
  ADD COLUMN IF NOT EXISTS sound_author TEXT,
  ADD COLUMN IF NOT EXISTS is_original_sound BOOLEAN,
  ADD COLUMN IF NOT EXISTS audio_fingerprint TEXT;

-- Index on sound_id for clustering queries (e.g., "avg DPS for videos using this sound")
CREATE INDEX IF NOT EXISTS idx_scraped_videos_sound_id
  ON scraped_videos(sound_id)
  WHERE sound_id IS NOT NULL;

-- Index on audio_fingerprint for matching uploaded videos to known sounds
CREATE INDEX IF NOT EXISTS idx_scraped_videos_audio_fingerprint
  ON scraped_videos(audio_fingerprint)
  WHERE audio_fingerprint IS NOT NULL;

-- Index on is_original_sound for filtering original vs. trending sounds
CREATE INDEX IF NOT EXISTS idx_scraped_videos_original_sound
  ON scraped_videos(is_original_sound)
  WHERE is_original_sound IS NOT NULL;

COMMENT ON COLUMN scraped_videos.sound_id IS 'TikTok music/sound ID — unique identifier for the sound used in the video';
COMMENT ON COLUMN scraped_videos.sound_name IS 'Name/title of the TikTok sound or music track';
COMMENT ON COLUMN scraped_videos.sound_author IS 'Creator/artist of the sound';
COMMENT ON COLUMN scraped_videos.is_original_sound IS 'Whether the creator made this sound (true) or used an existing one (false)';
COMMENT ON COLUMN scraped_videos.audio_fingerprint IS 'Spectral centroid hash (32-char hex) for matching videos with similar audio';
