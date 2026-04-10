-- =============================================
-- v13 Trainer Program: Side-Hustles Niche
-- Configures the default experiment program with the
-- v13 fix instructions and A/B test parameters.
-- =============================================

-- Deactivate any existing programs first
UPDATE trainer_programs SET is_active = false WHERE is_active = true;

-- Insert the v13 experiment program
INSERT INTO trainer_programs (program_name, program_content, is_active, created_by)
VALUES (
  'v13 Side-Hustles Retrain Program',
  '# v13 Trainer Program — Side-Hustles Niche

## Scope
- Niche: side-hustles
- Data source: training_features + scraped_videos + prediction_runs (learning loop)
- Holdout: 50 videos from models/holdout-video-ids.json

## Thresholds
- Global feedback data > 500 for global retrain
- Niche has > 200 feedback rows for niche experiment
- Spearman must improve by > 0.005 for global
- Improve by > 0.01 on niche to justify niche variant
- 3 consecutive experiments without improvement triggers Chairman review

## Feature Exclusions
Exclude the 6 always-empty features:
- speaking_rate_wpm_variance
- speaking_rate_wpm_acceleration
- speaking_rate_wpm_peak_count
- speaking_rate_wpm_fast_segments
- speaking_rate_wpm_slow_segments
- visual_to_verbal_ratio

## A/B Variant: Timing Features
Test two variants:
1. WITH timing features (post_hour_utc, post_day_of_week)
2. WITHOUT timing features

Timing features correlate with engagement but are NOT content quality signals.
We need to know if they help or hurt prediction accuracy.

## NaN Handling (CRITICAL)
DO NOT fillna(0) — XGBoost handles NaN natively by learning the optimal
split direction for missing data. A pitch_mean_hz=0 means "no pitch detected"
which is different from "unknown/missing."

## Hyperparameter Tuning
Use Optuna to re-tune hyperparameters for the full dataset:
- learning_rate: [0.01, 0.3] (log scale)
- max_depth: [3, 10]
- min_child_weight: [1, 10]
- reg_alpha: [0, 10]
- reg_lambda: [0, 10]
- n_estimators: [100, 1000]
- subsample: [0.6, 1.0]
- colsample_bytree: [0.6, 1.0]
Use 5-fold cross-validation with Spearman rho as optimization metric.
Run at least 100 Optuna trials.

## Execution Script
Run: python scripts/train-v13-sandbox.py
',
  true,
  'chairman'
);
