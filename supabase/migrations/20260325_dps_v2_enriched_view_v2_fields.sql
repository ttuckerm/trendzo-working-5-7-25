-- ============================================================================
-- DPS v2: Append v2 signal/decomposition fields to prediction_runs_enriched
-- ============================================================================
-- Closes the read-model gap where DPS v2 fields exist on prediction_runs
-- but are not exposed by the enriched view. Consumers (export route,
-- training dataset script) need these for stratified training exports.
--
-- Strategy: CREATE OR REPLACE to add 11 new columns at the end.
-- All existing columns remain in their original order and types.
-- No data is modified — this is a view-only change.
--
-- New columns appended:
--   actual_completion_rate, actual_share_rate, actual_save_rate,
--   actual_velocity_score, actual_view_to_follower_ratio, actual_comment_rate,
--   dps_signal_confidence, dps_cohort_sample_size, dps_threshold_version,
--   dps_within_cohort_percentile, dps_population_percentile
--
-- Date: 2026-03-25
-- ============================================================================

CREATE OR REPLACE VIEW prediction_runs_enriched AS
SELECT
  -- ══ Original columns (unchanged order) ═══════════════════════════════════
  r.id,
  r.video_id,
  r.mode,
  r.status,
  r.error_message,
  r.predicted_dps_7d,
  r.predicted_percentile_7d,
  r.predicted_tier_7d,
  r.confidence,
  r.prediction_range_low,
  r.prediction_range_high,
  r.components_used,
  r.components_count,
  r.latency_ms_total,
  r.raw_result,
  r.started_at,
  r.completed_at,
  r.created_at,
  r.actual_views,
  r.actual_likes,
  r.actual_comments,
  r.actual_shares,
  r.actual_saves,
  r.actual_dps,
  r.prediction_error,
  r.prediction_error_pct,
  r.within_range,
  r.actuals_entered_at,
  r.transcription_source,
  r.transcription_confidence,
  r.transcription_latency_ms,
  r.transcription_skipped,
  r.transcription_skip_reason,
  r.transcription_fallback_components,
  r.resolved_transcript_length,
  r.pack1_meta,
  r.pack2_meta,
  r.qc_flags,
  r.llm_spread,
  r.llm_influence_applied,
  r.score_version,
  r.coach_version,
  r.llm_excluded_reason,
  r.actual_tier,

  -- video_files join
  vf.niche,
  vf.goal,
  vf.platform,
  vf.account_size_band,
  vf.tiktok_url,

  -- component count
  COALESCE(comp.cnt, 0)::integer AS component_rows_count,
  COALESCE(comp.cnt, 0) > 0      AS has_components,
  r.raw_result IS NOT NULL        AS has_raw_result,

  -- training_ready (legacy compat)
  (r.status = ANY(ARRAY['completed','success']))
    AND r.actual_dps IS NOT NULL
    AND COALESCE(comp.cnt, 0) > 0
    AND r.raw_result IS NOT NULL  AS training_ready,

  -- DPS v2 core (existing)
  r.dps_formula_version,
  r.dps_label_trust,
  r.dps_training_weight,

  -- training_label_eligible (existing)
  r.dps_formula_version IS NOT NULL
    AND r.dps_formula_version LIKE '2%'
    AND COALESCE(r.dps_label_trust, 'untrusted') <> 'untrusted'
    AND COALESCE(r.dps_training_weight, 0) > 0
  AS training_label_eligible,

  -- ══ NEW: DPS v2 signal rates ═════════════════════════════════════════════
  r.actual_completion_rate,
  r.actual_share_rate,
  r.actual_save_rate,
  r.actual_velocity_score,
  r.actual_view_to_follower_ratio,
  r.actual_comment_rate,

  -- ══ NEW: DPS v2 decomposition / quality ══════════════════════════════════
  r.dps_signal_confidence,
  r.dps_cohort_sample_size,
  r.dps_threshold_version,
  r.dps_within_cohort_percentile,
  r.dps_population_percentile

FROM prediction_runs r
JOIN video_files vf ON vf.id::text = r.video_id
LEFT JOIN (
  SELECT run_id, count(*) AS cnt
  FROM run_component_results
  GROUP BY run_id
) comp ON comp.run_id = r.id;
