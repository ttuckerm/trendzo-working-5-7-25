-- =====================================================
-- ENHANCED VIDEO PATTERNS SCHEMA
-- =====================================================
-- Stores detailed 9-field breakdown for EACH video
-- Replaces aggregated viral_patterns with per-video granular data
-- Created: 2025-10-06

-- =====================================================
-- 1. Enhanced Video Patterns Table (Per-Video Detail)
-- =====================================================

CREATE TABLE IF NOT EXISTS video_patterns_detailed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Video Reference
  video_id TEXT NOT NULL UNIQUE,
  niche TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  
  -- DPS Metrics
  dps_score DECIMAL(5,2),
  dps_percentile DECIMAL(5,2),
  
  -- 7 Idea Legos Breakdown (9 fields with Hook split into 3)
  topic TEXT NOT NULL,                    -- Core subject matter
  angle TEXT NOT NULL,                    -- Unique perspective/approach
  hook_spoken TEXT NOT NULL,              -- Exact/paraphrased verbal hook
  hook_text TEXT NOT NULL,                -- On-screen text that appears
  hook_visual TEXT NOT NULL,              -- What's shown visually in hook
  story_structure TEXT NOT NULL,          -- Narrative structure type
  visual_format TEXT NOT NULL,            -- Overall visual format/style
  key_visual_elements JSONB NOT NULL DEFAULT '[]', -- Array of specific elements
  audio_description TEXT NOT NULL,        -- Music/sound description
  
  -- Metadata
  extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  extraction_batch_id TEXT,
  extraction_version TEXT DEFAULT 'v2',
  
  -- Video Metadata (cached for quick access)
  video_title TEXT,
  creator_username TEXT,
  views_count BIGINT,
  likes_count INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for video_patterns_detailed
CREATE INDEX IF NOT EXISTS idx_video_patterns_video_id ON video_patterns_detailed(video_id);
CREATE INDEX IF NOT EXISTS idx_video_patterns_niche ON video_patterns_detailed(niche);
CREATE INDEX IF NOT EXISTS idx_video_patterns_dps ON video_patterns_detailed(dps_score DESC NULLS LAST) WHERE dps_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_patterns_batch ON video_patterns_detailed(extraction_batch_id) WHERE extraction_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_patterns_created ON video_patterns_detailed(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE video_patterns_detailed IS 'Enhanced per-video pattern extraction with detailed 9-field breakdown of 7 Idea Legos';
COMMENT ON COLUMN video_patterns_detailed.topic IS 'Core subject matter of the video';
COMMENT ON COLUMN video_patterns_detailed.angle IS 'Unique perspective or approach taken';
COMMENT ON COLUMN video_patterns_detailed.hook_spoken IS 'Exact or paraphrased verbal hook (first 3 seconds spoken)';
COMMENT ON COLUMN video_patterns_detailed.hook_text IS 'On-screen text that appears during the hook';
COMMENT ON COLUMN video_patterns_detailed.hook_visual IS 'Visual elements shown during the hook (e.g., talking head, product close-up)';
COMMENT ON COLUMN video_patterns_detailed.story_structure IS 'Type of narrative structure (e.g., problem-solution, list format, before-after)';
COMMENT ON COLUMN video_patterns_detailed.visual_format IS 'Overall visual format/style (e.g., talking head with text overlays, B-roll montage)';
COMMENT ON COLUMN video_patterns_detailed.key_visual_elements IS 'Array of specific visual elements ["hand gestures", "product shots", "text overlays"]';
COMMENT ON COLUMN video_patterns_detailed.audio_description IS 'Music/sound strategy (e.g., trending sound, original voiceover, upbeat background music)';

-- =====================================================
-- 2. Pattern Aggregation View (For Quick Queries)
-- =====================================================

CREATE OR REPLACE VIEW viral_patterns_aggregated AS
SELECT
  niche,
  topic,
  angle,
  story_structure,
  visual_format,
  audio_description,
  COUNT(*) as frequency_count,
  AVG(dps_score)::DECIMAL(5,2) as avg_dps_score,
  MIN(dps_score) as min_dps_score,
  MAX(dps_score) as max_dps_score,
  COUNT(*) FILTER (WHERE dps_percentile >= 95.0)::INTEGER as viral_videos_count,
  COUNT(*)::INTEGER as total_videos,
  (COUNT(*) FILTER (WHERE dps_percentile >= 95.0)::DECIMAL / NULLIF(COUNT(*), 0))::DECIMAL(5,4) as success_rate,
  ARRAY_AGG(DISTINCT video_id ORDER BY video_id) as video_ids,
  MAX(extracted_at) as last_seen_at
FROM video_patterns_detailed
GROUP BY niche, topic, angle, story_structure, visual_format, audio_description
HAVING COUNT(*) >= 2  -- Only show patterns that appear in at least 2 videos
ORDER BY success_rate DESC NULLS LAST, frequency_count DESC;

COMMENT ON VIEW viral_patterns_aggregated IS 'Aggregated view of patterns across videos for pattern analysis';

-- =====================================================
-- 3. Helper Functions
-- =====================================================

-- Function to get top performing patterns by niche
CREATE OR REPLACE FUNCTION get_top_video_patterns(
  p_niche TEXT,
  p_min_dps DECIMAL DEFAULT 70.0,
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
  video_id TEXT,
  topic TEXT,
  angle TEXT,
  hook_spoken TEXT,
  hook_text TEXT,
  hook_visual TEXT,
  story_structure TEXT,
  visual_format TEXT,
  key_visual_elements JSONB,
  audio_description TEXT,
  dps_score DECIMAL(5,2),
  dps_percentile DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vpd.video_id,
    vpd.topic,
    vpd.angle,
    vpd.hook_spoken,
    vpd.hook_text,
    vpd.hook_visual,
    vpd.story_structure,
    vpd.visual_format,
    vpd.key_visual_elements,
    vpd.audio_description,
    vpd.dps_score,
    vpd.dps_percentile
  FROM video_patterns_detailed vpd
  WHERE vpd.niche = p_niche
    AND (p_min_dps IS NULL OR vpd.dps_score >= p_min_dps)
  ORDER BY vpd.dps_score DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_top_video_patterns IS 'Retrieve detailed patterns for top performing videos in a niche';

-- Function to find similar patterns
CREATE OR REPLACE FUNCTION find_similar_video_patterns(
  p_topic TEXT,
  p_angle TEXT,
  p_niche TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  video_id TEXT,
  topic TEXT,
  angle TEXT,
  dps_score DECIMAL(5,2),
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vpd.video_id,
    vpd.topic,
    vpd.angle,
    vpd.dps_score,
    (
      similarity(vpd.topic, p_topic) * 0.5 + 
      similarity(vpd.angle, p_angle) * 0.5
    ) as sim_score
  FROM video_patterns_detailed vpd
  WHERE (p_niche IS NULL OR vpd.niche = p_niche)
    AND (
      similarity(vpd.topic, p_topic) > 0.3 OR
      similarity(vpd.angle, p_angle) > 0.3
    )
  ORDER BY sim_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_similar_video_patterns IS 'Find videos with similar topic/angle combinations';

-- =====================================================
-- 4. Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_video_patterns_updated_at
  BEFORE UPDATE ON video_patterns_detailed
  FOR EACH ROW
  EXECUTE FUNCTION update_video_patterns_updated_at();

-- =====================================================
-- 5. Row Level Security
-- =====================================================

ALTER TABLE video_patterns_detailed ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to video_patterns_detailed" 
  ON video_patterns_detailed FOR ALL 
  USING (auth.role() = 'service_role');

-- Authenticated users can read
CREATE POLICY "Authenticated users can read video_patterns_detailed" 
  ON video_patterns_detailed FOR SELECT 
  USING (auth.role() = 'authenticated');

-- =====================================================
-- 6. Verification
-- =====================================================

DO $$ 
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'video_patterns_detailed'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ Enhanced video patterns schema created successfully';
  ELSE
    RAISE WARNING '⚠️  Failed to create video_patterns_detailed table';
  END IF;
END $$;

-- Log migration completion
SELECT 'Enhanced Video Patterns Schema (v2) migration completed successfully' AS status;

