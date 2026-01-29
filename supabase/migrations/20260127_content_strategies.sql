-- Migration: Content Strategies for Workflow 1 Redesign
-- Description: Creates tables for Paul's 3-step model (Strategy → Create → Ship)
-- The strategy is reusable (1:many with videos)

-- ============================================================================
-- TABLE: content_strategies
-- Stores reusable content strategies that can spawn multiple videos
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    niche TEXT NOT NULL,
    audience_age_band TEXT,
    content_purpose TEXT NOT NULL CHECK (content_purpose IN ('KNOW', 'LIKE', 'TRUST')),
    goals JSONB DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    exemplar_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_content_strategies_user_id ON content_strategies(user_id);

-- Index for filtering by niche
CREATE INDEX IF NOT EXISTS idx_content_strategies_niche ON content_strategies(niche);

-- ============================================================================
-- TABLE: strategy_videos
-- Links videos to their parent strategy (1:many relationship)
-- Enables "Research once, create many" pattern
-- ============================================================================

CREATE TABLE IF NOT EXISTS strategy_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES content_strategies(id) ON DELETE CASCADE,
    video_data JSONB NOT NULL DEFAULT '{}',
    -- video_data structure:
    -- {
    --   "hook": "text",
    --   "proof": "text",
    --   "value": "text",
    --   "cta": "text",
    --   "caption": "text",
    --   "hashtags": ["tag1", "tag2"],
    --   "dps_score": 72,
    --   "dps_breakdown": { "hook": 8, "proof": 4, "value": 7, "cta": 9 },
    --   "platform": "tiktok",
    --   "results": { "views": 0, "likes": 0, "comments": 0, "shares": 0 }
    -- }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast strategy lookups
CREATE INDEX IF NOT EXISTS idx_strategy_videos_strategy_id ON strategy_videos(strategy_id);

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for content_strategies
DROP TRIGGER IF EXISTS update_content_strategies_updated_at ON content_strategies;
CREATE TRIGGER update_content_strategies_updated_at
    BEFORE UPDATE ON content_strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for strategy_videos
DROP TRIGGER IF EXISTS update_strategy_videos_updated_at ON strategy_videos;
CREATE TRIGGER update_strategy_videos_updated_at
    BEFORE UPDATE ON strategy_videos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE content_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own strategies
DROP POLICY IF EXISTS "Users can view own strategies" ON content_strategies;
CREATE POLICY "Users can view own strategies"
    ON content_strategies
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own strategies
DROP POLICY IF EXISTS "Users can create own strategies" ON content_strategies;
CREATE POLICY "Users can create own strategies"
    ON content_strategies
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own strategies
DROP POLICY IF EXISTS "Users can update own strategies" ON content_strategies;
CREATE POLICY "Users can update own strategies"
    ON content_strategies
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own strategies
DROP POLICY IF EXISTS "Users can delete own strategies" ON content_strategies;
CREATE POLICY "Users can delete own strategies"
    ON content_strategies
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Users can view videos linked to their strategies
DROP POLICY IF EXISTS "Users can view own strategy videos" ON strategy_videos;
CREATE POLICY "Users can view own strategy videos"
    ON strategy_videos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM content_strategies
            WHERE content_strategies.id = strategy_videos.strategy_id
            AND content_strategies.user_id = auth.uid()
        )
    );

-- Policy: Users can create videos for their strategies
DROP POLICY IF EXISTS "Users can create videos for own strategies" ON strategy_videos;
CREATE POLICY "Users can create videos for own strategies"
    ON strategy_videos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM content_strategies
            WHERE content_strategies.id = strategy_videos.strategy_id
            AND content_strategies.user_id = auth.uid()
        )
    );

-- Policy: Users can update videos for their strategies
DROP POLICY IF EXISTS "Users can update own strategy videos" ON strategy_videos;
CREATE POLICY "Users can update own strategy videos"
    ON strategy_videos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM content_strategies
            WHERE content_strategies.id = strategy_videos.strategy_id
            AND content_strategies.user_id = auth.uid()
        )
    );

-- Policy: Users can delete videos for their strategies
DROP POLICY IF EXISTS "Users can delete own strategy videos" ON strategy_videos;
CREATE POLICY "Users can delete own strategy videos"
    ON strategy_videos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM content_strategies
            WHERE content_strategies.id = strategy_videos.strategy_id
            AND content_strategies.user_id = auth.uid()
        )
    );

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE content_strategies IS 'Reusable content strategies for Paul''s 3-step model. One strategy can spawn many videos.';
COMMENT ON COLUMN content_strategies.content_purpose IS 'Know/Like/Trust framework - determines CTA suggestions';
COMMENT ON COLUMN content_strategies.exemplar_ids IS 'References to viral exemplar videos for template extraction';

COMMENT ON TABLE strategy_videos IS 'Videos created from a content strategy. Contains 4x4 beats, DPS scores, and results.';
COMMENT ON COLUMN strategy_videos.video_data IS 'JSONB containing hook, proof, value, cta, caption, dps_score, platform, results';
