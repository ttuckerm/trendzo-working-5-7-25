-- =====================================================
-- Video Visual Analysis Table - FFmpeg Intelligence Layer
-- =====================================================
-- Stores visual analysis data extracted via FFmpeg for viral prediction
-- Author: CleanCopy Engineering
-- Date: 2025-10-28
-- Purpose: Transform from "prediction-only" to "prediction + optimization"

-- =====================================================
-- 1. Video Visual Analysis Table
-- =====================================================

CREATE TABLE IF NOT EXISTS video_visual_analysis (
    -- Primary Key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Foreign Key to scraped_videos
    video_id TEXT NOT NULL REFERENCES scraped_videos(video_id) ON DELETE CASCADE,

    -- Technical Metrics (extracted from FFmpeg/ffprobe)
    duration_ms INTEGER, -- Duration in milliseconds
    resolution_width INTEGER,
    resolution_height INTEGER,
    fps DECIMAL(10,3), -- Frames per second (e.g., 29.970)
    bitrate INTEGER, -- Bits per second
    codec TEXT, -- Video codec (e.g., 'h264', 'vp9')
    format TEXT, -- Container format (e.g., 'mp4', 'webm')
    file_size_bytes BIGINT,
    aspect_ratio TEXT, -- e.g., '16:9', '9:16'
    has_audio BOOLEAN DEFAULT true,
    audio_codec TEXT,

    -- Frame Analysis
    total_frames INTEGER,
    scene_changes INTEGER[], -- Array of frame numbers where scenes change
    avg_frame_size_kb DECIMAL(10,2), -- Average frame size for quality estimation

    -- Thumbnail URLs (stored in Supabase Storage)
    hook_thumbnail_url TEXT, -- Thumbnail at ~1.5s (typical hook moment)
    mid_thumbnail_url TEXT, -- Thumbnail at 50% duration
    end_thumbnail_url TEXT, -- Thumbnail at ~last second

    -- Color Analysis (JSONB for flexibility)
    dominant_colors JSONB, -- [{color: '#FF5733', percentage: 45, name: 'vibrant_red'}, ...]
    color_variance DECIMAL(10,4), -- Measure of visual variety (0-1)
    saturation_avg DECIMAL(10,4), -- Average saturation (0-1)
    brightness_avg DECIMAL(10,4), -- Average brightness (0-1)
    contrast_ratio DECIMAL(10,4), -- Contrast measure (0-1)

    -- Visual Style Classification (will be computed from frames)
    style_tags TEXT[], -- ['high_saturation', 'fast_paced', 'text_heavy', 'face_centered']
    visual_complexity DECIMAL(10,4), -- Complexity score (0-1, based on edge detection)
    motion_intensity DECIMAL(10,4), -- Motion level (0-1, based on frame diff)

    -- Hook Analysis (first 3 seconds)
    hook_scene_changes INTEGER, -- Number of cuts in first 3s
    hook_has_text BOOLEAN, -- Text overlay detected in hook
    hook_has_faces BOOLEAN, -- Face detected in hook
    hook_motion_level TEXT, -- 'static', 'moderate', 'high'

    -- Processing Metadata
    extraction_method TEXT DEFAULT 'ffmpeg', -- Future: 'ffmpeg', 'cv', 'ai'
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    processing_duration_ms INTEGER, -- How long did analysis take
    ffmpeg_version TEXT, -- For debugging/compatibility

    -- Status & Quality Control
    extraction_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    extraction_error TEXT, -- Error message if failed
    quality_score DECIMAL(10,4), -- Overall video quality score (0-1)

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one analysis per video
    UNIQUE(video_id)
);

-- =====================================================
-- 2. Video Frame Signatures Table (for micro-moment analysis)
-- =====================================================

CREATE TABLE IF NOT EXISTS video_frame_signatures (
    -- Primary Key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Foreign Keys
    video_id TEXT NOT NULL REFERENCES scraped_videos(video_id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES video_visual_analysis(id) ON DELETE CASCADE,

    -- Frame Identification
    frame_number INTEGER NOT NULL,
    timestamp_ms INTEGER NOT NULL, -- Milliseconds from start

    -- Frame Storage
    frame_url TEXT, -- URL to stored frame image (optional)
    frame_hash TEXT, -- MD5 hash for deduplication

    -- Visual Features (computed from frame)
    dominant_color TEXT, -- Hex color code
    has_text BOOLEAN DEFAULT false,
    text_content TEXT, -- Extracted text via OCR (future)
    has_faces BOOLEAN DEFAULT false,
    face_count INTEGER DEFAULT 0,

    -- Composition Analysis
    composition_type TEXT, -- 'centered', 'rule_of_thirds', 'dynamic', 'chaotic'
    motion_level TEXT, -- 'static', 'moderate', 'high'
    brightness DECIMAL(10,4),
    saturation DECIMAL(10,4),
    edge_density DECIMAL(10,4), -- Measure of visual complexity

    -- Object Detection (future AI integration)
    detected_objects JSONB, -- [{label: 'person', confidence: 0.95}, ...]

    -- Engagement Correlation (if available from TikTok metrics)
    engagement_spike BOOLEAN, -- True if engagement increased at this moment
    predicted_retention DECIMAL(10,4), -- ML-predicted retention at this frame

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Composite unique constraint
    UNIQUE(video_id, frame_number)
);

-- =====================================================
-- 3. Viral Pattern Library (discovered patterns from high-DPS videos)
-- =====================================================

CREATE TABLE IF NOT EXISTS viral_visual_patterns (
    -- Primary Key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Pattern Classification
    pattern_name TEXT NOT NULL, -- e.g., 'fast_cut_hook', 'text_reveal_3s', 'zoom_transition'
    pattern_category TEXT, -- 'hook', 'transition', 'pacing', 'color_scheme', 'composition'

    -- Pattern Definition
    description TEXT, -- Human-readable description
    signature_data JSONB, -- Pattern signature (frame characteristics, timing, etc.)

    -- Pattern Performance
    avg_dps_boost DECIMAL(10,4), -- Average DPS improvement when pattern is used
    confidence_score DECIMAL(10,4), -- Statistical confidence (0-1)
    sample_size INTEGER, -- Number of videos this pattern was found in

    -- Discovery Metadata
    discovered_from_video_ids TEXT[], -- Source videos
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    last_validated TIMESTAMPTZ,

    -- Usage Stats
    times_recommended INTEGER DEFAULT 0,
    times_applied INTEGER DEFAULT 0,
    success_rate DECIMAL(10,4), -- When applied, did DPS improve?

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(pattern_name)
);

-- =====================================================
-- 4. Performance Indexes
-- =====================================================

-- video_visual_analysis indexes
CREATE INDEX IF NOT EXISTS idx_video_visual_analysis_video_id ON video_visual_analysis(video_id);
CREATE INDEX IF NOT EXISTS idx_video_visual_analysis_status ON video_visual_analysis(extraction_status);
CREATE INDEX IF NOT EXISTS idx_video_visual_analysis_processed_at ON video_visual_analysis(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_visual_analysis_style_tags_gin ON video_visual_analysis USING GIN (style_tags);
CREATE INDEX IF NOT EXISTS idx_video_visual_analysis_quality ON video_visual_analysis(quality_score DESC);

-- video_frame_signatures indexes
CREATE INDEX IF NOT EXISTS idx_video_frame_signatures_video_id ON video_frame_signatures(video_id);
CREATE INDEX IF NOT EXISTS idx_video_frame_signatures_timestamp ON video_frame_signatures(timestamp_ms);
CREATE INDEX IF NOT EXISTS idx_video_frame_signatures_engagement ON video_frame_signatures(engagement_spike) WHERE engagement_spike = true;
CREATE INDEX IF NOT EXISTS idx_video_frame_signatures_has_text ON video_frame_signatures(has_text) WHERE has_text = true;
CREATE INDEX IF NOT EXISTS idx_video_frame_signatures_has_faces ON video_frame_signatures(has_faces) WHERE has_faces = true;

-- viral_visual_patterns indexes
CREATE INDEX IF NOT EXISTS idx_viral_visual_patterns_category ON viral_visual_patterns(pattern_category);
CREATE INDEX IF NOT EXISTS idx_viral_visual_patterns_dps_boost ON viral_visual_patterns(avg_dps_boost DESC);
CREATE INDEX IF NOT EXISTS idx_viral_visual_patterns_confidence ON viral_visual_patterns(confidence_score DESC);

-- =====================================================
-- 5. Row Level Security (RLS)
-- =====================================================

ALTER TABLE video_visual_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_frame_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_visual_patterns ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role has full access to video_visual_analysis"
  ON video_visual_analysis FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to video_frame_signatures"
  ON video_frame_signatures FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to viral_visual_patterns"
  ON viral_visual_patterns FOR ALL
  USING (auth.role() = 'service_role');

-- Authenticated users read access
CREATE POLICY "Authenticated users can read video_visual_analysis"
  ON video_visual_analysis FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read video_frame_signatures"
  ON video_frame_signatures FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read viral_visual_patterns"
  ON viral_visual_patterns FOR SELECT
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 6. Helper Functions & Triggers
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_video_visual_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS trigger_video_visual_analysis_updated_at ON video_visual_analysis;
CREATE TRIGGER trigger_video_visual_analysis_updated_at
    BEFORE UPDATE ON video_visual_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_video_visual_analysis_updated_at();

-- Same for viral_visual_patterns
DROP TRIGGER IF EXISTS trigger_viral_visual_patterns_updated_at ON viral_visual_patterns;
CREATE TRIGGER trigger_viral_visual_patterns_updated_at
    BEFORE UPDATE ON viral_visual_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_video_visual_analysis_updated_at();

-- Function to get visual analysis summary for a video
CREATE OR REPLACE FUNCTION get_video_visual_summary(p_video_id TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'video_id', v.video_id,
        'duration_s', ROUND(v.duration_ms / 1000.0, 2),
        'resolution', v.resolution_width || 'x' || v.resolution_height,
        'fps', v.fps,
        'quality_score', v.quality_score,
        'dominant_colors', v.dominant_colors,
        'style_tags', v.style_tags,
        'hook_analysis', jsonb_build_object(
            'scene_changes', v.hook_scene_changes,
            'has_text', v.hook_has_text,
            'has_faces', v.hook_has_faces,
            'motion_level', v.hook_motion_level
        ),
        'thumbnails', jsonb_build_object(
            'hook', v.hook_thumbnail_url,
            'mid', v.mid_thumbnail_url,
            'end', v.end_thumbnail_url
        )
    ) INTO result
    FROM video_visual_analysis v
    WHERE v.video_id = p_video_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Table Comments (Documentation)
-- =====================================================

COMMENT ON TABLE video_visual_analysis IS 'FFmpeg-extracted visual intelligence data for viral prediction enhancement';
COMMENT ON TABLE video_frame_signatures IS 'Frame-by-frame visual signatures for micro-moment engagement analysis';
COMMENT ON TABLE viral_visual_patterns IS 'Library of discovered viral patterns from high-DPS videos';

COMMENT ON COLUMN video_visual_analysis.hook_thumbnail_url IS 'Thumbnail extracted at ~1.5s (typical hook payoff moment)';
COMMENT ON COLUMN video_visual_analysis.dominant_colors IS 'JSON array of dominant colors with percentages: [{color: "#FF5733", percentage: 45}, ...]';
COMMENT ON COLUMN video_visual_analysis.style_tags IS 'Visual style classification tags for pattern matching';
COMMENT ON COLUMN video_visual_analysis.quality_score IS 'Overall technical video quality (0-1) based on bitrate, resolution, consistency';

COMMENT ON COLUMN video_frame_signatures.engagement_spike IS 'True if TikTok engagement metrics show spike at this frame timestamp';
COMMENT ON COLUMN video_frame_signatures.predicted_retention IS 'ML model prediction of viewer retention at this frame';

COMMENT ON COLUMN viral_visual_patterns.signature_data IS 'JSONB pattern signature including frame characteristics, timing sequences, visual features';
COMMENT ON COLUMN viral_visual_patterns.avg_dps_boost IS 'Average DPS improvement when this pattern is present (experimental)';

-- =====================================================
-- 8. Verification
-- =====================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('video_visual_analysis', 'video_frame_signatures', 'viral_visual_patterns');

  IF table_count = 3 THEN
    RAISE NOTICE '✅ FFmpeg Intelligence tables created successfully';
    RAISE NOTICE '   - video_visual_analysis';
    RAISE NOTICE '   - video_frame_signatures';
    RAISE NOTICE '   - viral_visual_patterns';
  ELSE
    RAISE WARNING '⚠️  Expected 3 tables, found %', table_count;
  END IF;
END $$;

-- Log migration completion
SELECT
  'FFmpeg Intelligence Layer migration completed' AS status,
  NOW() AS completed_at,
  'Ready for visual analysis and pattern extraction' AS notes;
