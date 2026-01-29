-- Creator Predictions Table
-- Tracks predictions made for specific creators with personalized context

CREATE TABLE IF NOT EXISTS creator_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to creator profile
  creator_profile_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,

  -- Link to original prediction
  prediction_id UUID REFERENCES prediction_events(id) ON DELETE SET NULL,
  video_id UUID REFERENCES video_files(id) ON DELETE SET NULL,

  -- Raw prediction
  predicted_dps DECIMAL(5,2) NOT NULL,

  -- Creator context
  relative_score INTEGER NOT NULL, -- 0-10 scale
  improvement_factor DECIMAL(4,2) NOT NULL, -- e.g., 1.5x
  percentile_rank TEXT NOT NULL, -- e.g., "top 10%", "p75-p90"
  adjusted_dps DECIMAL(5,2) NOT NULL, -- DPS after creator adjustment
  contextualized_message TEXT NOT NULL, -- e.g., "🔥 1.5x better than your average"

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creator_predictions_profile ON creator_predictions(creator_profile_id);
CREATE INDEX IF NOT EXISTS idx_creator_predictions_prediction ON creator_predictions(prediction_id);
CREATE INDEX IF NOT EXISTS idx_creator_predictions_created ON creator_predictions(created_at DESC);

COMMENT ON TABLE creator_predictions IS 'Prediction history with creator-specific context and personalization';
