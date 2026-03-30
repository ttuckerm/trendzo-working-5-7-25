-- Add columns to track DPS v2 scoring completeness.
-- Rows scored without follower_count are "incomplete" — view_to_follower_ratio
-- (weight 0.12 in Tier 1) could not be computed.

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_v2_incomplete BOOLEAN DEFAULT FALSE;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_v2_incomplete_reason TEXT DEFAULT NULL;
