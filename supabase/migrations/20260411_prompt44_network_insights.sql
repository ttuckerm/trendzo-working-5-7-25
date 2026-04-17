-- =====================================================================
-- Prompt 44 — Network Intelligence insights
-- Atlas subsystem: Network Intelligence (Scale feature)
--
-- Stores statistically-grounded, LLM-phrased aggregate findings across
-- all agencies. Strict k-anonymity-lite: supporting_agency_count must
-- be >= 10 for every row written (enforced in application code, not DB).
--
-- insight_type:
--   timing_optimization    — posting hour × VPS correlation
--   format_effectiveness   — duration bucket × VPS comparison
--   retention_correlation  — posting consistency × completion rate
--   posting_frequency      — posts per week × VPS, diminishing returns
--
-- niche_scope: specific niche id (e.g. 'fitness') or the literal 'cross_niche'
--
-- confidence_score: transparent formula, bounded [0,1]:
--   min(1, (1 - p_value) * log(n) / log(100))
--
-- No RLS — the API route enforces tier gating. Service-key writes only.
-- =====================================================================

CREATE TABLE IF NOT EXISTS network_insights (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type            TEXT NOT NULL CHECK (insight_type IN (
    'timing_optimization',
    'format_effectiveness',
    'retention_correlation',
    'posting_frequency'
  )),
  insight_text            TEXT NOT NULL,
  statistical_payload     JSONB NOT NULL,
  confidence_score        DOUBLE PRECISION NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  supporting_agency_count INTEGER NOT NULL CHECK (supporting_agency_count >= 10),
  supporting_run_count    INTEGER NOT NULL CHECK (supporting_run_count >= 0),
  niche_scope             TEXT NOT NULL,
  generation_run_id       UUID,
  llm_model               TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS network_insights_type_created_idx
  ON network_insights (insight_type, created_at DESC);

CREATE INDEX IF NOT EXISTS network_insights_niche_created_idx
  ON network_insights (niche_scope, created_at DESC);

CREATE INDEX IF NOT EXISTS network_insights_run_idx
  ON network_insights (generation_run_id);
