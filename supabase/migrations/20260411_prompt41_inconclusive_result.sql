-- =============================================
-- Prompt 41 follow-up — honest proxy-eval result labels
--
-- Feature Discovery evaluates the deployed model's stored predictions
-- on deterministic subsamples. On tiny samples (n<10) the resulting
-- Spearman is pure noise — a perfect 1.0 on 3 data points is a 1-in-6
-- random event, not a real signal. Writing "improved" for these runs
-- is misleading, so we add a new honest bucket.
--
-- Extends training_experiments.result CHECK to include
-- 'inconclusive_tiny_sample'. No other result values change.
-- =============================================

ALTER TABLE training_experiments
  DROP CONSTRAINT IF EXISTS training_experiments_result_check;

ALTER TABLE training_experiments
  ADD CONSTRAINT training_experiments_result_check
  CHECK (result IN (
    'improved',
    'no_change',
    'degraded',
    'error',
    'pending_promotion',
    'inconclusive_tiny_sample'
  ));

COMMENT ON COLUMN training_experiments.result IS
  'Outcome classification. inconclusive_tiny_sample (Prompt 41) means the proxy evaluator ran but had fewer than 10 rows in the validation subsample, so the reported Spearman is statistical noise. The Chairman finalizer must NOT promote/reject candidate_features based on inconclusive rows.';
