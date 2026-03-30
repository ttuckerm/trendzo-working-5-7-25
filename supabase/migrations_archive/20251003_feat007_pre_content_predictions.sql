-- FEAT-007: Pre-Content Prediction System
-- Migration to create pre_content_predictions table for storing viral predictions before filming

-- Create pre_content_predictions table
CREATE TABLE IF NOT EXISTS public.pre_content_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Input data
    script TEXT NOT NULL,
    storyboard TEXT,
    niche TEXT NOT NULL,
    platform TEXT NOT NULL,
    creator_followers INTEGER,

    -- Prediction results
    predicted_viral_score INTEGER NOT NULL CHECK (predicted_viral_score >= 0 AND predicted_viral_score <= 100),
    predicted_dps DECIMAL(5, 2) NOT NULL,
    confidence DECIMAL(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),

    -- LLM scores
    llm_scores JSONB NOT NULL, -- { gpt4: number, claude: number, gemini: number }
    llm_consensus_score DECIMAL(5, 2) NOT NULL,

    -- Pattern matching
    pattern_match_score DECIMAL(5, 2) NOT NULL,
    top_matching_patterns JSONB, -- Array of pattern matches

    -- Idea Legos breakdown
    idea_legos JSONB NOT NULL, -- { topic, angle, hookStructure, storyStructure, visualFormat, keyVisuals, audio }

    -- Predictions and estimates
    predictions JSONB, -- { estimatedViews, estimatedLikes, estimatedDPSPercentile }

    -- Recommendations
    recommendations JSONB, -- Array of improvement suggestions

    -- Feature flag
    feature_flag TEXT DEFAULT 'FF-PreContentAnalyzer-v1',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Optional: Link to actual content if created later
    actual_content_video_id VARCHAR(255), -- References scraped_videos.video_id (no FK constraint to avoid dependency issues)
    actual_dps DECIMAL(5, 2), -- Fill in later to measure prediction accuracy

    -- Indexes
    CONSTRAINT valid_platform CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'twitter', 'linkedin'))
);

-- Create indexes for performance
CREATE INDEX idx_pre_content_predictions_niche ON public.pre_content_predictions(niche);
CREATE INDEX idx_pre_content_predictions_platform ON public.pre_content_predictions(platform);
CREATE INDEX idx_pre_content_predictions_created_at ON public.pre_content_predictions(created_at DESC);
CREATE INDEX idx_pre_content_predictions_predicted_dps ON public.pre_content_predictions(predicted_dps DESC);
CREATE INDEX idx_pre_content_predictions_confidence ON public.pre_content_predictions(confidence DESC);
CREATE INDEX idx_pre_content_predictions_actual_content ON public.pre_content_predictions(actual_content_video_id) WHERE actual_content_video_id IS NOT NULL;

-- Create composite index for niche + platform queries
CREATE INDEX idx_pre_content_predictions_niche_platform ON public.pre_content_predictions(niche, platform);

-- Add RLS policies (if RLS is enabled)
ALTER TABLE public.pre_content_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read their own predictions
CREATE POLICY "Users can read their own predictions"
    ON public.pre_content_predictions
    FOR SELECT
    USING (true); -- Adjust based on your auth model

-- Policy: Allow authenticated users to insert predictions
CREATE POLICY "Users can create predictions"
    ON public.pre_content_predictions
    FOR INSERT
    WITH CHECK (true); -- Adjust based on your auth model

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_pre_content_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pre_content_predictions_updated_at
    BEFORE UPDATE ON public.pre_content_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_pre_content_predictions_updated_at();

-- Create view for prediction accuracy analysis (when actual DPS is available)
CREATE OR REPLACE VIEW public.prediction_accuracy_stats AS
SELECT
    niche,
    platform,
    COUNT(*) as total_predictions,
    COUNT(actual_dps) as predictions_with_actuals,
    AVG(ABS(predicted_dps - actual_dps)) as avg_prediction_error,
    AVG(confidence) as avg_confidence,
    CORR(predicted_dps, actual_dps) as prediction_correlation
FROM public.pre_content_predictions
WHERE actual_dps IS NOT NULL
GROUP BY niche, platform;

-- Add comment
COMMENT ON TABLE public.pre_content_predictions IS 'FEAT-007: Stores predictions for scripts/storyboards before content creation. Proprietary training data for viral prediction model.';
