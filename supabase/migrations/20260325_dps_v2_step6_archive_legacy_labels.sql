-- ============================================================================
-- DPS v2 Step 6: Archive Legacy Labels
-- ============================================================================
-- One-time archival of all pre-v2 labels. After this runs:
--   - Every labeled row has explicit dps_formula_version
--   - Legacy values are preserved in legacy_actual_dps / legacy_actual_tier
--   - training_label_eligible = FALSE for all legacy rows
--   - Any existing dps_v2 rows from dev/testing are untouched
--
-- Idempotency: Only touches rows with actual_dps IS NOT NULL AND
--              dps_formula_version IS NULL. Re-running is a no-op.
--
-- Date: 2026-03-25
-- ============================================================================

-- ============================================================================
-- 1. Archive legacy labels
-- ============================================================================
-- Scope: rows with actual_dps that were never tagged with a formula version.
-- These are definitively pre-v2 labels (old percentile-rank script, old manual
-- entry, or old auto-labeler before v2 was wired in).
--
-- This UPDATE is safe because:
--   - dps_formula_version defaults to NULL (Step 1)
--   - All v2 labelers set dps_formula_version='2.0.0' via buildDpsV2LabelPayload()
--   - So dps_formula_version IS NULL ↔ "never touched by v2"

UPDATE prediction_runs
SET
  -- 1a. Preserve original values for audit trail
  --     Only copy if not already archived (idempotent for partial reruns)
  legacy_actual_dps          = COALESCE(legacy_actual_dps, actual_dps),
  legacy_actual_tier         = COALESCE(legacy_actual_tier, actual_tier),

  -- 1b. Infer legacy formula version from available provenance
  legacy_dps_formula_version = COALESCE(legacy_dps_formula_version, CASE
    WHEN labeling_mode = 'auto_cron'      THEN 'legacy_auto_cron'
    WHEN labeling_mode = 'scrape_ingest'  THEN 'legacy_scrape_ingest'
    WHEN labeling_mode = 'manual_ui'      THEN 'legacy_manual_entry'
    WHEN labeling_mode = 'bulk_download'  THEN 'legacy_bulk_download'
    WHEN labeling_mode = 'metric_attach'  THEN 'legacy_metric_attach'
    WHEN labeling_mode IS NOT NULL        THEN 'legacy_' || labeling_mode
    WHEN actual_views IS NOT NULL
     AND actual_views > 0                 THEN 'legacy_engagement_path'
    ELSE                                       'legacy_unknown'
  END),

  -- 1c. Tag as legacy v1 — NOT '2%', so training_label_eligible = FALSE
  dps_formula_version = 'legacy_v1',

  -- 1d. Mark untrusted for training — these used the old percentile-rank formula
  --     or unknown provenance, so they should never enter v2 training.
  dps_label_trust     = 'legacy_untrusted',
  dps_training_weight = 0.0

WHERE actual_dps IS NOT NULL       -- has a label
  AND dps_formula_version IS NULL; -- never tagged by v2 (or by a prior run of this migration)

-- ============================================================================
-- 2. Update training_readiness_summary view to account for 'legacy_untrusted'
-- ============================================================================
-- The Step 1 view counts trust='untrusted' via COALESCE but 'legacy_untrusted'
-- would fall through uncounted. Add a trust_legacy counter and fix trust_untrusted
-- to include legacy_untrusted in the "excluded" bucket.

CREATE OR REPLACE VIEW training_readiness_summary AS
SELECT
  e.niche,
  count(*)::integer                                     AS total_runs,
  count(*) FILTER (
    WHERE e.status = ANY (ARRAY['completed'::text, 'success'::text])
  )::integer                                            AS completed_runs,
  count(*) FILTER (
    WHERE e.actual_dps IS NOT NULL
  )::integer                                            AS labeled_runs,
  count(*) FILTER (
    WHERE e.training_ready
  )::integer                                            AS training_ready_runs,
  count(*) FILTER (
    WHERE
      (e.status = ANY (ARRAY['completed'::text, 'success'::text]))
      AND e.actual_dps IS NOT NULL
      AND NOT e.has_components
  )::integer                                            AS missing_components,
  count(*) FILTER (
    WHERE
      (e.status = ANY (ARRAY['completed'::text, 'success'::text]))
      AND e.actual_dps IS NOT NULL
      AND NOT e.has_raw_result
  )::integer                                            AS missing_raw_result,
  count(*) FILTER (
    WHERE
      (e.status = ANY (ARRAY['completed'::text, 'success'::text]))
      AND e.actual_dps IS NULL
  )::integer                                            AS missing_actual_dps,
  count(*) FILTER (WHERE
    e.status <> ALL (ARRAY['completed'::text, 'success'::text])
  )::integer                                            AS non_completed,

  -- DPS v2 aggregates
  count(*) FILTER (WHERE
    e.dps_formula_version IS NOT NULL
    AND e.dps_formula_version LIKE '2%'
  )::integer                                            AS v2_labeled_runs,
  count(*) FILTER (
    WHERE e.training_label_eligible
  )::integer                                            AS v2_training_eligible_runs,

  -- Trust breakdown (updated to handle 'legacy_untrusted')
  count(*) FILTER (WHERE e.dps_label_trust = 'high')::integer              AS trust_high,
  count(*) FILTER (WHERE e.dps_label_trust = 'medium')::integer            AS trust_medium,
  count(*) FILTER (WHERE e.dps_label_trust = 'low')::integer               AS trust_low,
  count(*) FILTER (WHERE
    COALESCE(e.dps_label_trust, 'untrusted') IN ('untrusted', 'legacy_untrusted')
  )::integer                                            AS trust_untrusted,

  -- Step 6: explicit legacy count
  count(*) FILTER (WHERE
    e.dps_formula_version = 'legacy_v1'
  )::integer                                            AS legacy_archived
FROM prediction_runs_enriched e
GROUP BY e.niche;

-- ============================================================================
-- 3. Verification: count what we archived
-- ============================================================================

DO $$
DECLARE
  archived_count   INTEGER;
  v2_count         INTEGER;
  unlabeled_count  INTEGER;
  provenance_json  JSONB;
BEGIN
  -- Count archived legacy rows
  SELECT COUNT(*) INTO archived_count
  FROM prediction_runs
  WHERE dps_formula_version = 'legacy_v1';

  -- Count already-v2 rows (should be unchanged)
  SELECT COUNT(*) INTO v2_count
  FROM prediction_runs
  WHERE dps_formula_version IS NOT NULL
    AND dps_formula_version LIKE '2%';

  -- Count rows with no label at all
  SELECT COUNT(*) INTO unlabeled_count
  FROM prediction_runs
  WHERE actual_dps IS NULL;

  -- Provenance breakdown
  SELECT jsonb_object_agg(
    COALESCE(legacy_dps_formula_version, 'null'),
    cnt
  ) INTO provenance_json
  FROM (
    SELECT legacy_dps_formula_version, COUNT(*) AS cnt
    FROM prediction_runs
    WHERE dps_formula_version = 'legacy_v1'
    GROUP BY legacy_dps_formula_version
  ) sub;

  RAISE NOTICE 'Step 6 Archive Summary:';
  RAISE NOTICE '  Legacy rows archived:  %', archived_count;
  RAISE NOTICE '  V2 rows (untouched):   %', v2_count;
  RAISE NOTICE '  Unlabeled rows:        %', unlabeled_count;
  RAISE NOTICE '  Provenance breakdown:  %', provenance_json;

  -- Verify: no rows should have actual_dps without a formula version
  IF EXISTS (
    SELECT 1 FROM prediction_runs
    WHERE actual_dps IS NOT NULL AND dps_formula_version IS NULL
  ) THEN
    RAISE WARNING 'UNEXPECTED: Some labeled rows still have NULL dps_formula_version!';
  ELSE
    RAISE NOTICE '  Verification PASSED: all labeled rows have explicit dps_formula_version.';
  END IF;

  -- Verify: legacy rows should have training_weight = 0
  IF EXISTS (
    SELECT 1 FROM prediction_runs
    WHERE dps_formula_version = 'legacy_v1'
      AND dps_training_weight > 0
  ) THEN
    RAISE WARNING 'UNEXPECTED: Some legacy_v1 rows have training_weight > 0!';
  ELSE
    RAISE NOTICE '  Verification PASSED: all legacy_v1 rows have training_weight = 0.';
  END IF;
END $$;
