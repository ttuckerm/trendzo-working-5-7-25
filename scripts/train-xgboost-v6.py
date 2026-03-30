# -*- coding: utf-8 -*-
"""
Train XGBoost v6 Model for DPS Prediction (Side Hustles)

Input:  /tmp/trendzo_side_hustles_training.csv  (from export-training-dataset.ts)
Split:  Time-based — oldest 80% train, newest 20% eval
Output: models/xgboost-v6-model.json + models/xgboost-v6-scaler.pkl + metadata

Usage:
    python scripts/train-xgboost-v6.py
    python scripts/train-xgboost-v6.py --input /path/to/custom.csv

Requirements:
    pip install xgboost scikit-learn pandas numpy
"""

import sys
import io
import os
import json
import argparse
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score
import xgboost as xgb
import pickle
from datetime import datetime

# Force UTF-8 on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ── CLI ────────────────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description='Train XGBoost v6 for Side Hustles DPS')
parser.add_argument('--input', default='/tmp/trendzo_side_hustles_training.csv',
                    help='Path to training CSV')
parser.add_argument('--output-dir', default='models', help='Output directory')
parser.add_argument('--dry-run', action='store_true', help='Validate data only, do not train')
args = parser.parse_args()

# ── Constants ──────────────────────────────────────────────────────────────────

MODEL_VERSION = 'v6'
SPLIT_RATIO = 0.80  # 80% train, 20% eval (time-based)
RANDOM_STATE = 42

# The 42 XGBoost features (41 v5 originals + 1 data-quality signal)
FEATURE_NAMES = [
    # FFmpeg (14)
    'duration_seconds', 'resolution_width', 'resolution_height', 'fps',
    'motion_score', 'has_faces', 'face_time_ratio', 'has_music',
    'avg_volume', 'brightness_avg', 'contrast_ratio', 'saturation_avg',
    'visual_complexity', 'hook_scene_changes',
    # Text (7)
    'text_word_count', 'text_char_count', 'text_sentence_count',
    'text_avg_word_length', 'text_question_count', 'text_exclamation_count',
    'text_hashtag_count',
    # Component predictions (18)
    'hook_scorer_pred', 'hook_scorer_conf', '7_legos_pred', '7_legos_conf',
    '9_attributes_pred', '9_attributes_conf', '24_styles_pred', '24_styles_conf',
    'niche_keywords_pred', 'niche_keywords_conf', 'virality_matrix_pred',
    'virality_matrix_conf', 'pattern_extraction_pred', 'pattern_extraction_conf',
    'trend_timing_pred', 'trend_timing_conf', 'posting_time_pred', 'posting_time_conf',
    # LLM (2)
    'gpt4_score', 'claude_score',
    # Data quality (1)
    'feature_coverage_ratio',
]

TARGET_COL = 'actual_dps'

# ── Tier helpers ───────────────────────────────────────────────────────────────

def classify_tier(dps):
    if dps >= 90: return 'mega-viral'
    if dps >= 70: return 'viral'
    if dps >= 60: return 'good'
    if dps >= 40: return 'average'
    return 'low'

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print('=' * 60)
    print(f'  XGBoost {MODEL_VERSION} Training — Side Hustles DPS')
    print('=' * 60)

    # ── 1. Load CSV ────────────────────────────────────────────────────────────

    csv_path = args.input
    if not os.path.exists(csv_path):
        print(f'\nERROR: Input CSV not found: {csv_path}')
        print('Run first: npx tsx scripts/export-training-dataset.ts')
        sys.exit(1)

    df = pd.read_csv(csv_path)
    print(f'\n  Loaded {len(df)} rows from {csv_path}')

    # Validate required columns
    missing_target = TARGET_COL not in df.columns
    if missing_target:
        print(f'  ERROR: Missing target column "{TARGET_COL}"')
        sys.exit(1)

    present_features = [f for f in FEATURE_NAMES if f in df.columns]
    missing_features = [f for f in FEATURE_NAMES if f not in df.columns]
    print(f'  Features: {len(present_features)}/{len(FEATURE_NAMES)} present')
    if missing_features:
        print(f'  Missing features: {missing_features[:5]}{"..." if len(missing_features) > 5 else ""}')

    # Drop rows with missing target
    df = df.dropna(subset=[TARGET_COL])
    print(f'  Rows with actual_dps: {len(df)}')

    if len(df) < 10:
        print(f'  ERROR: Need at least 10 rows with actual_dps, got {len(df)}')
        sys.exit(1)

    # ── 2. Prepare features ────────────────────────────────────────────────────

    # Use only present features
    X = df[present_features].copy()

    # Fill NaN with 0 (missing features = zero signal)
    nan_counts = X.isna().sum()
    nan_cols = nan_counts[nan_counts > 0]
    if len(nan_cols) > 0:
        print(f'\n  NaN columns (filled with 0):')
        for col, cnt in nan_cols.items():
            print(f'    {col}: {cnt}/{len(X)} NaN')
    X = X.fillna(0).astype(float)

    y = df[TARGET_COL].astype(float).values

    print(f'\n  Target stats:')
    print(f'    Range: [{y.min():.1f}, {y.max():.1f}]')
    print(f'    Mean:  {y.mean():.1f} +/- {y.std():.1f}')

    # ── 3. Time-based split ────────────────────────────────────────────────────
    #    Data is assumed sorted by created_at (oldest first) from the export script.
    #    Oldest 80% → train, newest 20% → eval.

    split_idx = int(len(df) * SPLIT_RATIO)
    X_train, X_eval = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_eval = y[:split_idx], y[split_idx:]

    print(f'\n  Time-based split:')
    print(f'    Train: {len(X_train)} rows (oldest {SPLIT_RATIO*100:.0f}%)')
    print(f'    Eval:  {len(X_eval)} rows (newest {(1-SPLIT_RATIO)*100:.0f}%)')

    if args.dry_run:
        print('\n  [DRY RUN] Data validated. Exiting without training.')
        return

    # ── 4. Scale features ──────────────────────────────────────────────────────

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_eval_scaled = scaler.transform(X_eval)

    # ── 5. Train XGBoost ───────────────────────────────────────────────────────

    print(f'\n  Training XGBoost regressor...')

    model = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=50,     # Reduced from 200 to prevent overfitting on small datasets
        learning_rate=0.05,
        max_depth=2,         # Reduced from 6 — max 4 leaves, appropriate for N<100
        min_child_weight=3,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,       # L1 regularization
        reg_lambda=1.0,      # L2 regularization
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    model.fit(
        X_train_scaled, y_train,
        eval_set=[(X_eval_scaled, y_eval)],
        verbose=False,
    )

    # ── 6. Evaluate ────────────────────────────────────────────────────────────

    y_pred_train = model.predict(X_train_scaled)
    y_pred_eval = model.predict(X_eval_scaled)

    # Clamp predictions to [0, 100]
    y_pred_train = np.clip(y_pred_train, 0, 100)
    y_pred_eval = np.clip(y_pred_eval, 0, 100)

    train_mae = mean_absolute_error(y_train, y_pred_train)
    eval_mae = mean_absolute_error(y_eval, y_pred_eval)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    eval_rmse = np.sqrt(mean_squared_error(y_eval, y_pred_eval))
    train_r2 = r2_score(y_train, y_pred_train)
    eval_r2 = r2_score(y_eval, y_pred_eval)

    # Accuracy within +/- 5 DPS
    within_5_train = np.mean(np.abs(y_train - y_pred_train) <= 5) * 100
    within_5_eval = np.mean(np.abs(y_eval - y_pred_eval) <= 5) * 100

    # Tier accuracy
    actual_tiers_eval = [classify_tier(d) for d in y_eval]
    pred_tiers_eval = [classify_tier(d) for d in y_pred_eval]
    tier_exact = sum(a == p for a, p in zip(actual_tiers_eval, pred_tiers_eval)) / len(y_eval) * 100

    print(f'\n  Performance:')
    print(f'                   Train       Eval')
    print(f'    MAE          : {train_mae:7.2f}    {eval_mae:7.2f}')
    print(f'    RMSE         : {train_rmse:7.2f}    {eval_rmse:7.2f}')
    print(f'    R2           : {train_r2:7.3f}    {eval_r2:7.3f}')
    print(f'    Within +/-5  : {within_5_train:6.1f}%    {within_5_eval:6.1f}%')
    print(f'    Tier accuracy:    --      {tier_exact:6.1f}%')

    # Cross-validation on train set
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=min(5, len(X_train)), scoring='r2')
    print(f'    CV R2 (5-fold): {cv_scores.mean():.3f} +/- {cv_scores.std():.3f}')

    # ── 7. Feature importance ──────────────────────────────────────────────────

    importance = pd.DataFrame({
        'feature': present_features,
        'importance': model.feature_importances_,
    }).sort_values('importance', ascending=False)

    print(f'\n  Top 10 features:')
    for _, row in importance.head(10).iterrows():
        bar = '#' * int(row['importance'] * 100)
        print(f'    {row["feature"]:<28} {row["importance"]:.4f}  {bar}')

    # ── 8. Save artifacts ──────────────────────────────────────────────────────

    out_dir = args.output_dir
    os.makedirs(out_dir, exist_ok=True)

    # Model
    model_path = os.path.join(out_dir, 'xgboost-v6-model.json')
    model.save_model(model_path)
    print(f'\n  Saved: {model_path}')

    # Scaler
    scaler_path = os.path.join(out_dir, 'xgboost-v6-scaler.pkl')
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    print(f'  Saved: {scaler_path}')

    # Feature names (only the features actually used)
    names_path = os.path.join(out_dir, 'xgboost-v6-features.json')
    with open(names_path, 'w') as f:
        json.dump(present_features, f, indent=2)
    print(f'  Saved: {names_path}')

    # Training metadata
    metadata = {
        'model_version': MODEL_VERSION,
        'trained_at': datetime.now().isoformat(),
        'input_csv': csv_path,
        'feature_count': len(present_features),
        'feature_names': present_features,
        'dataset': {
            'total_rows': len(df),
            'train_rows': len(X_train),
            'eval_rows': len(X_eval),
            'split': 'time-based 80/20',
        },
        'target_stats': {
            'min': float(y.min()),
            'max': float(y.max()),
            'mean': float(y.mean()),
            'std': float(y.std()),
        },
        'performance': {
            'train': {
                'mae': float(train_mae),
                'rmse': float(train_rmse),
                'r2': float(train_r2),
                'within_5_dps_pct': float(within_5_train),
            },
            'eval': {
                'mae': float(eval_mae),
                'rmse': float(eval_rmse),
                'r2': float(eval_r2),
                'within_5_dps_pct': float(within_5_eval),
                'tier_accuracy_pct': float(tier_exact),
            },
            'cv_r2_mean': float(cv_scores.mean()),
            'cv_r2_std': float(cv_scores.std()),
        },
        'hyperparameters': model.get_params(),
        'top_features': importance.head(20).to_dict('records'),
    }

    meta_path = os.path.join(out_dir, 'xgboost-v6-metadata.json')
    # Sanitize NaN/Inf → null for valid JSON
    def sanitize(obj):
        if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
            return None
        if isinstance(obj, dict):
            return {k: sanitize(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [sanitize(v) for v in obj]
        return obj
    with open(meta_path, 'w') as f:
        json.dump(sanitize(metadata), f, indent=2)
    print(f'  Saved: {meta_path}')

    # ── 9. Summary ─────────────────────────────────────────────────────────────

    print(f'\n{"=" * 60}')
    print(f'  XGBoost {MODEL_VERSION} training complete.')
    print(f'  Eval MAE: {eval_mae:.2f} DPS | Within +/-5: {within_5_eval:.1f}%')
    print(f'  Tier accuracy: {tier_exact:.1f}%')
    print(f'{"=" * 60}\n')


if __name__ == '__main__':
    main()
