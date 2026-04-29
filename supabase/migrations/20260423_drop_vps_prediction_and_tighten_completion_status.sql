-- Substrate cleanup: April 23, 2026
-- 1. Drops the duplicate column `vps_prediction` from `content_briefs`.
--    The canonical column is `predicted_vps`. All writers and readers
--    have been updated in the accompanying code change.
-- 2. Adds a CHECK constraint to `completion_status` restricting it to
--    the four lifecycle values currently in use.
-- Logs the decision to platform_events for auditability.

BEGIN;

-- Pre-flight: verify no unexpected values exist in completion_status
-- before locking it down. This raises if drift is found.
DO $$
DECLARE
  unexpected_count INT;
BEGIN
  SELECT COUNT(*)
  INTO unexpected_count
  FROM content_briefs
  WHERE completion_status IS NOT NULL
    AND completion_status NOT IN ('delivered','acknowledged','in_production','published');

  IF unexpected_count > 0 THEN
    RAISE EXCEPTION 'completion_status contains % unexpected value(s). Aborting migration.', unexpected_count;
  END IF;
END $$;

-- Drop the duplicate VPS column.
ALTER TABLE content_briefs DROP COLUMN IF EXISTS vps_prediction;

-- Tighten completion_status to only the four real lifecycle values.
ALTER TABLE content_briefs
  ADD CONSTRAINT content_briefs_completion_status_check
  CHECK (completion_status IS NULL OR completion_status IN (
    'delivered',
    'acknowledged',
    'in_production',
    'published'
  ));

-- Audit trail.
INSERT INTO platform_events (event_type, actor_type, payload, created_at)
VALUES (
  'substrate.cleanup',
  'system',
  jsonb_build_object(
    'action', 'drop_vps_prediction_and_tighten_completion_status',
    'dropped_column', 'content_briefs.vps_prediction',
    'canonical_column', 'content_briefs.predicted_vps',
    'added_constraint', 'content_briefs_completion_status_check',
    'allowed_values', ARRAY['delivered','acknowledged','in_production','published'],
    'migration_file', '20260423_drop_vps_prediction_and_tighten_completion_status.sql'
  ),
  NOW()
);

COMMIT;
