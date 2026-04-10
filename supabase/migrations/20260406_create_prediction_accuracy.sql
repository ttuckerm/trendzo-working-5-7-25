-- Atlas Subsystem 1: Accuracy aggregation table
-- Named atlas_accuracy_summary to avoid conflict with existing prediction_accuracy table/view
CREATE TABLE IF NOT EXISTS atlas_accuracy_summary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start date NOT NULL,
  period_end date NOT NULL,
  niche text,
  total_predictions integer DEFAULT 0,
  avg_delta numeric,
  median_delta numeric,
  spearman_correlation numeric,
  accuracy_bucket jsonb, -- {"within_10pct": N, "within_25pct": N, "over_25pct": N}
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atlas_accuracy_summary_period ON atlas_accuracy_summary(period_end DESC);
