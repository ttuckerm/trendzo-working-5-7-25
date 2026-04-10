-- =============================================
-- Atlas feedback hook: prediction_log
-- Records every VPS prediction for future feedback collection
-- =============================================

CREATE TABLE IF NOT EXISTS prediction_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id uuid,
  creator_id uuid,
  content_id text,
  predicted_vps numeric NOT NULL,
  predicted_at timestamptz DEFAULT now(),
  niche text,
  content_format text,
  -- Filled later by the Feedback Collector (Atlas S1):
  actual_performance numeric,
  actual_measured_at timestamptz,
  delta numeric,
  feedback_collected boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_prediction_log_creator ON prediction_log(creator_id);
CREATE INDEX IF NOT EXISTS idx_prediction_log_feedback ON prediction_log(feedback_collected);
