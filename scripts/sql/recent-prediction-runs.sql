-- ============================================================================
-- Query: Recent Prediction Runs with Transcription and Pack Metadata
-- ============================================================================
-- Purpose: Verify transcription_status and Pack 1/2 _meta persistence
-- Usage: Run in Supabase SQL Editor or psql
-- ============================================================================

-- Last 10 runs with full transcription and pack metadata
SELECT
  id AS run_id,
  video_id,
  status,
  predicted_dps_7d,
  predicted_tier_7d,
  confidence,
  latency_ms_total,
  -- Transcription status
  transcription_source,
  transcription_confidence,
  transcription_latency_ms,
  transcription_skipped,
  transcription_skip_reason,
  transcription_fallback_components,
  -- Pack 1 metadata
  pack1_meta->>'source' AS pack1_source,
  pack1_meta->>'provider' AS pack1_provider,
  (pack1_meta->>'latency_ms')::INTEGER AS pack1_latency_ms,
  -- Pack 2 metadata
  pack2_meta->>'source' AS pack2_source,
  pack2_meta->>'provider' AS pack2_provider,
  (pack2_meta->>'latency_ms')::INTEGER AS pack2_latency_ms,
  -- Timestamps
  created_at,
  completed_at
FROM prediction_runs
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- Summary: Count by transcription source
-- ============================================================================

SELECT
  transcription_source,
  COUNT(*) AS run_count,
  AVG(transcription_confidence) AS avg_confidence,
  AVG(transcription_latency_ms) AS avg_latency_ms
FROM prediction_runs
WHERE transcription_source IS NOT NULL
GROUP BY transcription_source
ORDER BY run_count DESC;

-- ============================================================================
-- Summary: Count by Pack 1/2 source (real vs mock)
-- ============================================================================

SELECT
  pack1_meta->>'source' AS pack1_source,
  pack2_meta->>'source' AS pack2_source,
  COUNT(*) AS run_count
FROM prediction_runs
WHERE pack1_meta IS NOT NULL OR pack2_meta IS NOT NULL
GROUP BY pack1_meta->>'source', pack2_meta->>'source'
ORDER BY run_count DESC;

-- ============================================================================
-- Runs where Pack 1/2 was skipped (null metadata)
-- ============================================================================

SELECT
  id AS run_id,
  status,
  predicted_dps_7d,
  transcription_source,
  transcription_skipped,
  transcription_skip_reason,
  created_at
FROM prediction_runs
WHERE pack1_meta IS NULL
ORDER BY created_at DESC
LIMIT 10;
