-- Add features column to prediction_events
-- Stores component-specific features (e.g., Gemini visual engagement, audio quality)

ALTER TABLE prediction_events
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

-- Create index for faster feature queries
CREATE INDEX IF NOT EXISTS idx_prediction_events_features
ON prediction_events USING gin(features);

-- Add column to store components used
ALTER TABLE prediction_events
ADD COLUMN IF NOT EXISTS components_used TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index on components_used for filtering
CREATE INDEX IF NOT EXISTS idx_prediction_events_components
ON prediction_events USING gin(components_used);

-- Add column to store component scores
ALTER TABLE prediction_events
ADD COLUMN IF NOT EXISTS component_scores JSONB DEFAULT '{}'::jsonb;

-- Create index for component scores
CREATE INDEX IF NOT EXISTS idx_prediction_events_component_scores
ON prediction_events USING gin(component_scores);
