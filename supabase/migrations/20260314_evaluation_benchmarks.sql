-- =====================================================
-- Model Evaluation Benchmarks & Runs
-- =====================================================
-- Benchmark video set + evaluation run history for
-- tracking prediction accuracy across model versions.
--
-- Author: Trendzo ML Pipeline
-- Date: 2026-03-14
-- =====================================================

-- ─── Benchmark Videos ────────────────────────────────────────────────────────
-- 30 curated videos (6 per DPS tier) used as a fixed evaluation set.
-- Ground truth DPS + metadata stored so evaluations are reproducible.

CREATE TABLE IF NOT EXISTS evaluation_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES scraped_videos(video_id),
  actual_dps NUMERIC NOT NULL,
  niche TEXT NOT NULL,
  transcript_text TEXT,
  caption TEXT,
  hashtags TEXT[],
  creator_followers INTEGER,
  duration_seconds NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(video_id)
);

CREATE INDEX IF NOT EXISTS idx_evaluation_benchmarks_niche
  ON evaluation_benchmarks(niche);

-- ─── Evaluation Runs ─────────────────────────────────────────────────────────
-- Each row = one full evaluation of a model version against the benchmark set.

CREATE TABLE IF NOT EXISTS evaluation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  spearman_rho NUMERIC,
  mae NUMERIC,
  within_5_pct NUMERIC,
  within_10_pct NUMERIC,
  tier_accuracy_pct NUMERIC,
  notes TEXT,
  feature_importance_top10 JSONB,
  predictions JSONB,
  UNIQUE(model_version, run_at)
);

CREATE INDEX IF NOT EXISTS idx_evaluation_runs_run_at
  ON evaluation_runs(run_at DESC);

CREATE INDEX IF NOT EXISTS idx_evaluation_runs_model_version
  ON evaluation_runs(model_version);
