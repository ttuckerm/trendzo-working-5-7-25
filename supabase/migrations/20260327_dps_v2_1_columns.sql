-- Add v2.1.0 columns to prediction_runs for reach_score, view_percentile,
-- weight_tier, and display_score written by buildDpsV2LabelPayload().

ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS actual_reach_score double precision;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS actual_view_percentile_within_cohort double precision;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS dps_v2_weight_tier smallint;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS dps_v2_display_score double precision;
