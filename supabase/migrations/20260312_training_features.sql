-- =====================================================
-- Training Features Table
-- =====================================================
-- Stores flat feature vectors extracted from scraped_videos
-- for ML model training. Each row = one video's features.
-- JOIN with scraped_videos ON video_id to get dps_score target label.
--
-- Author: Trendzo ML Pipeline
-- Date: 2026-03-12
-- =====================================================

CREATE TABLE IF NOT EXISTS training_features (
  video_id TEXT PRIMARY KEY REFERENCES scraped_videos(video_id),
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  extraction_version INTEGER NOT NULL DEFAULT 1,
  extraction_duration_ms INTEGER,
  extraction_errors TEXT[],

  -- ===== FFmpeg Canonical Features (12) =====
  ffmpeg_scene_changes NUMERIC,
  ffmpeg_cuts_per_second NUMERIC,
  ffmpeg_avg_motion NUMERIC,
  ffmpeg_color_variance NUMERIC,
  ffmpeg_brightness_avg NUMERIC,
  ffmpeg_contrast_score NUMERIC,
  ffmpeg_resolution_width NUMERIC,
  ffmpeg_resolution_height NUMERIC,
  ffmpeg_duration_seconds NUMERIC,
  ffmpeg_bitrate NUMERIC,
  ffmpeg_fps NUMERIC,
  ffmpeg_has_audio BOOLEAN,

  -- ===== Audio Prosodic Features (10) =====
  audio_pitch_mean_hz NUMERIC,
  audio_pitch_variance NUMERIC,
  audio_pitch_range NUMERIC,
  audio_pitch_std_dev NUMERIC,
  audio_pitch_contour_slope NUMERIC,
  audio_loudness_mean_lufs NUMERIC,
  audio_loudness_range NUMERIC,
  audio_loudness_variance NUMERIC,
  audio_silence_ratio NUMERIC,
  audio_silence_count NUMERIC,

  -- ===== Audio Classifier Features (4) =====
  audio_music_ratio NUMERIC,
  audio_speech_ratio NUMERIC,
  audio_type_encoded NUMERIC,  -- 1=speech-only, 2=music-only, 3=speech-over-music, 4=mixed, 5=silent
  audio_energy_variance NUMERIC,

  -- ===== Speaking Rate Features (6) =====
  speaking_rate_wpm NUMERIC,
  speaking_rate_wpm_variance NUMERIC,
  speaking_rate_wpm_acceleration NUMERIC,
  speaking_rate_wpm_peak_count NUMERIC,
  speaking_rate_fast_segments NUMERIC,
  speaking_rate_slow_segments NUMERIC,

  -- ===== Visual Scene Features (3) =====
  visual_scene_count NUMERIC,
  visual_avg_scene_duration NUMERIC,
  visual_score NUMERIC,

  -- ===== Thumbnail Features (5) =====
  thumb_brightness NUMERIC,
  thumb_contrast NUMERIC,
  thumb_colorfulness NUMERIC,
  thumb_overall_score NUMERIC,
  thumb_confidence NUMERIC,

  -- ===== Hook Scorer Features (8) =====
  hook_score NUMERIC,
  hook_confidence NUMERIC,
  hook_text_score NUMERIC,
  hook_audio_score NUMERIC,
  hook_visual_score NUMERIC,
  hook_pace_score NUMERIC,
  hook_tone_score NUMERIC,
  hook_type_encoded NUMERIC,  -- 0=weak/null, 1=question, 2=list_preview, 3=contrarian, 4=myth_bust, 5=statistic, 6=authority, 7=result_preview, 8=personal_story, 9=problem_identification, 10=urgency

  -- ===== Text / Transcript Features (14) =====
  text_word_count NUMERIC,
  text_sentence_count NUMERIC,
  text_question_mark_count NUMERIC,
  text_exclamation_count NUMERIC,
  text_transcript_length NUMERIC,
  text_avg_sentence_length NUMERIC,
  text_unique_word_ratio NUMERIC,
  text_avg_word_length NUMERIC,
  text_syllable_count NUMERIC,
  text_flesch_reading_ease NUMERIC,
  text_has_cta BOOLEAN,
  text_positive_word_count NUMERIC,
  text_negative_word_count NUMERIC,
  text_emoji_count NUMERIC,

  -- ===== Metadata Features (6) =====
  meta_duration_seconds NUMERIC,
  meta_hashtag_count NUMERIC,
  meta_has_viral_hashtag BOOLEAN,
  meta_creator_followers NUMERIC,
  meta_creator_followers_log NUMERIC,
  meta_words_per_second NUMERIC
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_training_features_extracted_at
ON training_features(extracted_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_features_version
ON training_features(extraction_version);

-- Verify
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'training_features';

  RAISE NOTICE 'training_features table created with % columns', col_count;
END $$;
