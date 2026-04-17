-- Performance measurement loop — actuals captured after a brief is published.
-- Parallel to the existing predicted_vps / actual_vps columns; these track views
-- and engagement rather than VPS scores so the feedback loop closes on raw metrics.

ALTER TABLE content_briefs
  ADD COLUMN IF NOT EXISTS vps_prediction          numeric,
  ADD COLUMN IF NOT EXISTS actual_views            integer,
  ADD COLUMN IF NOT EXISTS actual_engagement_rate  numeric,
  ADD COLUMN IF NOT EXISTS performance_delta       numeric,
  ADD COLUMN IF NOT EXISTS performance_measured_at timestamptz,
  ADD COLUMN IF NOT EXISTS performance_source      text DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS idx_content_briefs_performance_measured_at
  ON content_briefs(performance_measured_at DESC)
  WHERE performance_measured_at IS NOT NULL;
