# -*- coding: utf-8 -*-
"""
Train XGBoost v7 Model — DPS Prediction from Training Features

Loads training_features JOIN scraped_videos.dps_score from Supabase,
trains an XGBoost regressor on 60+ deterministic features.

Usage:
    python scripts/train-model.py                    # Load from Supabase
    python scripts/train-model.py --input data.csv   # Load from CSV
    python scripts/train-model.py --dry-run           # Validate data only

Requirements:
    pip install xgboost scikit-learn pandas numpy scipy requests python-dotenv
"""

import sys
import io
import os
import json
import argparse
import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import StratifiedKFold, cross_val_score
import xgboost as xgb
import pickle
from datetime import datetime

# Force UTF-8 on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ── CLI ────────────────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description='Train XGBoost v7 for DPS prediction')
parser.add_argument('--input', default=None, help='Path to training CSV (skip Supabase)')
parser.add_argument('--output-dir', default='models', help='Output directory')
parser.add_argument('--dry-run', action='store_true', help='Validate data only')
args = parser.parse_args()

# ── Constants ──────────────────────────────────────────────────────────────────

MODEL_VERSION = 'v7'
SPLIT_RATIO = 0.80
RANDOM_STATE = 42

# All numeric feature columns from training_features (63 features)
# Excludes: video_id, extracted_at, extraction_version, extraction_duration_ms, extraction_errors
FEATURE_COLS = [
    # FFmpeg (12)
    'ffmpeg_scene_changes', 'ffmpeg_cuts_per_second', 'ffmpeg_avg_motion',
    'ffmpeg_color_variance', 'ffmpeg_brightness_avg', 'ffmpeg_contrast_score',
    'ffmpeg_resolution_width', 'ffmpeg_resolution_height', 'ffmpeg_duration_seconds',
    'ffmpeg_bitrate', 'ffmpeg_fps', 'ffmpeg_has_audio',
    # Audio Prosodic (10)
    'audio_pitch_mean_hz', 'audio_pitch_variance', 'audio_pitch_range',
    'audio_pitch_std_dev', 'audio_pitch_contour_slope', 'audio_loudness_mean_lufs',
    'audio_loudness_range', 'audio_loudness_variance', 'audio_silence_ratio',
    'audio_silence_count',
    # Audio Classifier (4)
    'audio_music_ratio', 'audio_speech_ratio', 'audio_type_encoded',
    'audio_energy_variance',
    # Speaking Rate (6)
    'speaking_rate_wpm', 'speaking_rate_wpm_variance', 'speaking_rate_wpm_acceleration',
    'speaking_rate_wpm_peak_count', 'speaking_rate_fast_segments', 'speaking_rate_slow_segments',
    # Visual Scene (3)
    'visual_scene_count', 'visual_avg_scene_duration', 'visual_score',
    # Thumbnail (5)
    'thumb_brightness', 'thumb_contrast', 'thumb_colorfulness',
    'thumb_overall_score', 'thumb_confidence',
    # Hook Scorer (8)
    'hook_score', 'hook_confidence', 'hook_text_score', 'hook_audio_score',
    'hook_visual_score', 'hook_pace_score', 'hook_tone_score', 'hook_type_encoded',
    # Text (14)
    'text_word_count', 'text_sentence_count', 'text_question_mark_count',
    'text_exclamation_count', 'text_transcript_length', 'text_avg_sentence_length',
    'text_unique_word_ratio', 'text_avg_word_length', 'text_syllable_count',
    'text_flesch_reading_ease', 'text_has_cta', 'text_positive_word_count',
    'text_negative_word_count', 'text_emoji_count',
    # Metadata (6)
    'meta_duration_seconds', 'meta_hashtag_count', 'meta_has_viral_hashtag',
    'meta_creator_followers', 'meta_creator_followers_log', 'meta_words_per_second',
]

# Boolean columns that need 0/1 conversion
BOOL_COLS = ['ffmpeg_has_audio', 'text_has_cta', 'meta_has_viral_hashtag']

TARGET_COL = 'dps_score'

# ── Tier helpers ───────────────────────────────────────────────────────────────

def classify_tier(dps):
    """DPS tier classification matching system-registry.ts"""
    if dps is None or np.isnan(dps):
        return 'unknown'
    if dps >= 90: return 'mega-viral'
    if dps >= 70: return 'viral'
    if dps >= 60: return 'good'
    if dps >= 40: return 'average'
    return 'low'


# ── Data loading ───────────────────────────────────────────────────────────────

def load_from_supabase():
    """Load training data from Supabase via PostgREST API."""
    try:
        import requests
        from dotenv import load_dotenv
    except ImportError:
        print('ERROR: Install requests and python-dotenv:')
        print('  pip install requests python-dotenv')
        sys.exit(1)

    # Load .env.local from project root
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(project_root, '.env.local')
    load_dotenv(env_path)

    supabase_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')

    if not supabase_url or not supabase_key:
        print('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY')
        print(f'  Checked: {env_path}')
        sys.exit(1)

    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Prefer': 'count=exact',
    }

    # Fetch training_features with embedded scraped_videos (FK join)
    url = (
        f"{supabase_url}/rest/v1/training_features"
        f"?select=*,scraped_videos(dps_score,dps_classification,niche)"
        f"&limit=5000"
    )

    print('  Fetching from Supabase...')
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    data = resp.json()
    print(f'  Raw rows from API: {len(data)}')

    # Flatten the joined data
    rows = []
    skipped_no_dps = 0
    for row in data:
        sv = row.pop('scraped_videos', None)
        if sv and sv.get('dps_score') is not None:
            row['dps_score'] = float(sv['dps_score'])
            row['dps_classification'] = sv.get('dps_classification')
            row['niche'] = sv.get('niche')
            rows.append(row)
        else:
            skipped_no_dps += 1

    if skipped_no_dps > 0:
        print(f'  Skipped {skipped_no_dps} rows with no dps_score')

    return pd.DataFrame(rows)


def load_from_csv(path):
    """Load training data from CSV file."""
    if not os.path.exists(path):
        print(f'ERROR: CSV not found: {path}')
        sys.exit(1)
    return pd.read_csv(path)


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print('=' * 64)
    print(f'  XGBoost {MODEL_VERSION} Training — DPS from Training Features')
    print('=' * 64)

    # ── 1. Load data ──────────────────────────────────────────────────────────

    if args.input:
        df = load_from_csv(args.input)
        print(f'\n  Loaded {len(df)} rows from {args.input}')
    else:
        df = load_from_supabase()
        print(f'\n  Loaded {len(df)} rows with dps_score')

    # ── 2. Validate ───────────────────────────────────────────────────────────

    if TARGET_COL not in df.columns:
        print(f'  ERROR: Missing target column "{TARGET_COL}"')
        sys.exit(1)

    # Drop rows with missing target
    df = df.dropna(subset=[TARGET_COL])
    print(f'  Rows with valid {TARGET_COL}: {len(df)}')

    if len(df) < 20:
        print(f'  ERROR: Need at least 20 rows, got {len(df)}')
        sys.exit(1)

    # Check which features are present
    present = [c for c in FEATURE_COLS if c in df.columns]
    missing = [c for c in FEATURE_COLS if c not in df.columns]
    print(f'  Features: {len(present)}/{len(FEATURE_COLS)} present')
    if missing:
        print(f'  Missing: {missing[:10]}{"..." if len(missing) > 10 else ""}')

    # ── 3. Prepare features ───────────────────────────────────────────────────

    X = df[present].copy()

    # Convert booleans to 0/1
    for col in BOOL_COLS:
        if col in X.columns:
            X[col] = X[col].apply(lambda v: 1 if v is True or v == 't' or v == 1 else 0)

    # Report NaN stats
    nan_counts = X.isna().sum()
    nan_cols = nan_counts[nan_counts > 0]
    if len(nan_cols) > 0:
        print(f'\n  Columns with missing values (filled with median):')
        for col, cnt in nan_cols.head(10).items():
            pct = cnt / len(X) * 100
            print(f'    {col}: {cnt}/{len(X)} ({pct:.0f}%)')
        if len(nan_cols) > 10:
            print(f'    ... and {len(nan_cols) - 10} more')

    # Fill NaN with column median (better than 0 for features like pitch_mean_hz)
    for col in X.columns:
        if X[col].isna().any():
            median_val = X[col].median()
            X[col] = X[col].fillna(median_val if not np.isnan(median_val) else 0)

    X = X.astype(float)
    y = df[TARGET_COL].astype(float).values

    print(f'\n  Target ({TARGET_COL}) stats:')
    print(f'    Range: [{y.min():.1f}, {y.max():.1f}]')
    print(f'    Mean:  {y.mean():.1f} ± {y.std():.1f}')
    print(f'    Median: {np.median(y):.1f}')

    # Tier distribution
    tiers = [classify_tier(d) for d in y]
    tier_counts = pd.Series(tiers).value_counts()
    print(f'\n  Tier distribution:')
    for tier, count in tier_counts.items():
        print(f'    {tier:12s}: {count:4d} ({count/len(y)*100:.1f}%)')

    # Niche distribution (if available)
    if 'niche' in df.columns:
        niche_counts = df['niche'].value_counts()
        print(f'\n  Niche distribution:')
        for niche, count in niche_counts.items():
            print(f'    {niche:20s}: {count:4d}')

    # ── 4. Stratified split ───────────────────────────────────────────────────
    #    Stratify by DPS tier so train/test have balanced tier representation.

    tier_labels = [classify_tier(d) for d in y]
    tier_series = pd.Series(tier_labels)

    # Handle small tiers: merge tiers with < 3 samples into 'other'
    tier_for_strat = tier_series.copy()
    small_tiers = tier_series.value_counts()
    small_tiers = small_tiers[small_tiers < 3].index
    tier_for_strat[tier_for_strat.isin(small_tiers)] = 'other'

    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X, y, np.arange(len(y)),
        test_size=1 - SPLIT_RATIO,
        random_state=RANDOM_STATE,
        stratify=tier_for_strat,
    )

    tier_train = [tier_labels[i] for i in idx_train]
    tier_test = [tier_labels[i] for i in idx_test]

    print(f'\n  Stratified split:')
    print(f'    Train: {len(X_train)} rows')
    print(f'    Test:  {len(X_test)} rows')
    print(f'    Test tiers: {pd.Series(tier_test).value_counts().to_dict()}')

    if args.dry_run:
        print('\n  [DRY RUN] Data validated. Exiting without training.')
        return

    # ── 5. Scale features ─────────────────────────────────────────────────────

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── 6. Train XGBoost ──────────────────────────────────────────────────────
    #    With 500+ rows we can use slightly more complexity than v6's max_depth=2.

    print(f'\n  Training XGBoost regressor ({len(present)} features, {len(X_train)} rows)...')

    model = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=200,
        learning_rate=0.05,
        max_depth=4,
        min_child_weight=5,
        subsample=0.8,
        colsample_bytree=0.7,
        reg_alpha=0.5,
        reg_lambda=2.0,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        early_stopping_rounds=20,
    )

    model.fit(
        X_train_scaled, y_train,
        eval_set=[(X_test_scaled, y_test)],
        verbose=False,
    )

    best_iter = model.best_iteration if hasattr(model, 'best_iteration') and model.best_iteration else model.n_estimators
    print(f'  Best iteration: {best_iter}')

    # ── 7. Evaluate ───────────────────────────────────────────────────────────

    y_pred_train = np.clip(model.predict(X_train_scaled), 0, 100)
    y_pred_test = np.clip(model.predict(X_test_scaled), 0, 100)

    # Core metrics
    train_mae = mean_absolute_error(y_train, y_pred_train)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)

    # Spearman rank correlation (primary metric per audit)
    spearman_train, p_train = spearmanr(y_train, y_pred_train)
    spearman_test, p_test = spearmanr(y_test, y_pred_test)

    # Within ±5 DPS
    within5_train = np.mean(np.abs(y_train - y_pred_train) <= 5) * 100
    within5_test = np.mean(np.abs(y_test - y_pred_test) <= 5) * 100

    # Within ±10 DPS
    within10_train = np.mean(np.abs(y_train - y_pred_train) <= 10) * 100
    within10_test = np.mean(np.abs(y_test - y_pred_test) <= 10) * 100

    # Per-tier accuracy
    pred_tiers_test = [classify_tier(d) for d in y_pred_test]
    tier_correct = sum(a == p for a, p in zip(tier_test, pred_tiers_test))
    tier_accuracy = tier_correct / len(y_test) * 100

    print(f'\n  ┌─────────────────────────────────────────────┐')
    print(f'  │           Performance Results                │')
    print(f'  ├─────────────────────────────────────────────┤')
    print(f'  │  Metric           Train        Test         │')
    print(f'  │  ─────────────    ─────────    ─────────    │')
    print(f'  │  Spearman rho   : {spearman_train:7.4f}      {spearman_test:7.4f}      │')
    print(f'  │  p-value        : {p_train:10.2e}   {p_test:10.2e}   │')
    print(f'  │  MAE            : {train_mae:7.2f}      {test_mae:7.2f}      │')
    print(f'  │  RMSE           : {train_rmse:7.2f}      {test_rmse:7.2f}      │')
    print(f'  │  R²             : {train_r2:7.4f}      {test_r2:7.4f}      │')
    print(f'  │  Within ±5 DPS  : {within5_train:6.1f}%      {within5_test:6.1f}%      │')
    print(f'  │  Within ±10 DPS : {within10_train:6.1f}%      {within10_test:6.1f}%      │')
    print(f'  │  Tier accuracy  :    --        {tier_accuracy:6.1f}%      │')
    print(f'  └─────────────────────────────────────────────┘')

    # Spearman success check
    if spearman_test > 0.30:
        print(f'\n  ✓ SUCCESS: Spearman rho {spearman_test:.4f} > 0.30 threshold')
    else:
        print(f'\n  ✗ BELOW TARGET: Spearman rho {spearman_test:.4f} < 0.30 threshold')

    # Per-tier breakdown
    print(f'\n  Per-tier accuracy (test set):')
    for tier in ['mega-viral', 'viral', 'good', 'average', 'low']:
        actual_mask = [t == tier for t in tier_test]
        if sum(actual_mask) == 0:
            continue
        pred_for_tier = [pred_tiers_test[i] for i, m in enumerate(actual_mask) if m]
        correct = sum(1 for p in pred_for_tier if p == tier)
        total = len(pred_for_tier)
        print(f'    {tier:12s}: {correct}/{total} correct ({correct/total*100:.0f}%)')

    # ── 8. 5-fold cross-validation on full dataset ────────────────────────────

    print(f'\n  5-fold cross-validation (full dataset):')

    # Re-fit on full data for CV
    X_all_scaled = scaler.fit_transform(X)

    cv_model = xgb.XGBRegressor(
        objective='reg:squarederror',
        n_estimators=best_iter,
        learning_rate=0.05,
        max_depth=4,
        min_child_weight=5,
        subsample=0.8,
        colsample_bytree=0.7,
        reg_alpha=0.5,
        reg_lambda=2.0,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    # Spearman via manual CV (sklearn doesn't have Spearman scorer built-in)
    n_splits = min(5, len(tier_for_strat.unique()) + 1)
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=RANDOM_STATE)

    cv_spearman = []
    cv_mae = []
    cv_r2 = []
    for fold_i, (train_idx, val_idx) in enumerate(skf.split(X_all_scaled, tier_for_strat)):
        cv_model.fit(X_all_scaled[train_idx], y[train_idx], verbose=False)
        y_val_pred = np.clip(cv_model.predict(X_all_scaled[val_idx]), 0, 100)
        rho, _ = spearmanr(y[val_idx], y_val_pred)
        mae = mean_absolute_error(y[val_idx], y_val_pred)
        r2 = r2_score(y[val_idx], y_val_pred)
        cv_spearman.append(rho)
        cv_mae.append(mae)
        cv_r2.append(r2)
        print(f'    Fold {fold_i+1}: rho={rho:.4f}  MAE={mae:.2f}  R²={r2:.4f}')

    cv_spearman = np.array(cv_spearman)
    cv_mae = np.array(cv_mae)
    cv_r2 = np.array(cv_r2)

    print(f'    ────────────────────────────────────────')
    print(f'    Mean:  rho={cv_spearman.mean():.4f} ± {cv_spearman.std():.4f}  '
          f'MAE={cv_mae.mean():.2f} ± {cv_mae.std():.2f}  '
          f'R²={cv_r2.mean():.4f} ± {cv_r2.std():.4f}')

    # ── 9. Baseline comparison ────────────────────────────────────────────────
    #    Heuristic baseline: predict the mean DPS for all videos

    baseline_pred = np.full_like(y_test, y_train.mean())
    baseline_mae = mean_absolute_error(y_test, baseline_pred)
    baseline_rho, _ = spearmanr(y_test, baseline_pred)

    print(f'\n  Comparison vs baseline (predict mean):')
    print(f'    Baseline MAE:  {baseline_mae:.2f}  →  Model MAE: {test_mae:.2f}  '
          f'({"↓" if test_mae < baseline_mae else "↑"} {abs(baseline_mae - test_mae):.2f})')
    print(f'    Baseline rho:  {baseline_rho:.4f}  →  Model rho: {spearman_test:.4f}')

    # Also compare with v6 (if metadata exists)
    v6_meta_path = os.path.join(args.output_dir, 'xgboost-v6-metadata.json')
    if os.path.exists(v6_meta_path):
        with open(v6_meta_path, 'r') as f:
            v6 = json.load(f)
        v6_cv_r2 = v6.get('performance', {}).get('cv_r2_mean')
        v6_eval_mae = v6.get('performance', {}).get('eval', {}).get('mae')
        print(f'\n  Comparison vs v6 (27 videos, 42 features):')
        if v6_eval_mae is not None:
            print(f'    v6 eval MAE: {v6_eval_mae:.2f}  →  v7 test MAE: {test_mae:.2f}')
        if v6_cv_r2 is not None:
            print(f'    v6 CV R²: {v6_cv_r2:.4f}  →  v7 CV R²: {cv_r2.mean():.4f}')

    # ── 10. Feature importance ────────────────────────────────────────────────

    importance = pd.DataFrame({
        'feature': present,
        'importance': model.feature_importances_,
    }).sort_values('importance', ascending=False)

    print(f'\n  Top 15 features by importance:')
    print(f'  {"Rank":>4}  {"Feature":<36} {"Importance":>10}')
    print(f'  {"─"*4}  {"─"*36} {"─"*10}')
    for rank, (_, row) in enumerate(importance.head(15).iterrows(), 1):
        bar = '█' * int(row['importance'] * 80)
        print(f'  {rank:4d}  {row["feature"]:<36} {row["importance"]:10.4f}  {bar}')

    # Features with zero importance
    zero_features = importance[importance['importance'] == 0]
    if len(zero_features) > 0:
        print(f'\n  Features with zero importance: {len(zero_features)}/{len(present)}')
        for _, row in zero_features.iterrows():
            print(f'    - {row["feature"]}')

    # ── 11. Save artifacts ────────────────────────────────────────────────────

    out_dir = args.output_dir
    os.makedirs(out_dir, exist_ok=True)

    # Model
    model_path = os.path.join(out_dir, 'xgboost-v7-model.json')
    model.save_model(model_path)
    print(f'\n  Saved: {model_path}')

    # Scaler
    scaler_path = os.path.join(out_dir, 'xgboost-v7-scaler.pkl')
    # Re-fit scaler on training split only (not full data)
    final_scaler = StandardScaler()
    final_scaler.fit(X_train)
    with open(scaler_path, 'wb') as f:
        pickle.dump(final_scaler, f)
    print(f'  Saved: {scaler_path}')

    # Feature names
    names_path = os.path.join(out_dir, 'xgboost-v7-features.json')
    with open(names_path, 'w') as f:
        json.dump(present, f, indent=2)
    print(f'  Saved: {names_path}')

    # Metadata
    metadata = {
        'model_version': MODEL_VERSION,
        'trained_at': datetime.now().isoformat(),
        'source': args.input or 'supabase:training_features+scraped_videos',
        'feature_count': len(present),
        'feature_names': present,
        'dataset': {
            'total_rows': len(df),
            'train_rows': len(X_train),
            'test_rows': len(X_test),
            'split': f'stratified {SPLIT_RATIO*100:.0f}/{(1-SPLIT_RATIO)*100:.0f}',
            'niches': df['niche'].value_counts().to_dict() if 'niche' in df.columns else {},
        },
        'target_stats': {
            'min': float(y.min()),
            'max': float(y.max()),
            'mean': float(y.mean()),
            'std': float(y.std()),
            'median': float(np.median(y)),
        },
        'performance': {
            'train': {
                'spearman_rho': float(spearman_train),
                'mae': float(train_mae),
                'rmse': float(train_rmse),
                'r2': float(train_r2),
                'within_5_dps_pct': float(within5_train),
                'within_10_dps_pct': float(within10_train),
            },
            'test': {
                'spearman_rho': float(spearman_test),
                'spearman_p_value': float(p_test),
                'mae': float(test_mae),
                'rmse': float(test_rmse),
                'r2': float(test_r2),
                'within_5_dps_pct': float(within5_test),
                'within_10_dps_pct': float(within10_test),
                'tier_accuracy_pct': float(tier_accuracy),
            },
            'cv_5fold': {
                'spearman_mean': float(cv_spearman.mean()),
                'spearman_std': float(cv_spearman.std()),
                'mae_mean': float(cv_mae.mean()),
                'mae_std': float(cv_mae.std()),
                'r2_mean': float(cv_r2.mean()),
                'r2_std': float(cv_r2.std()),
            },
            'baseline_mean_predictor': {
                'mae': float(baseline_mae),
            },
        },
        'hyperparameters': {
            'objective': 'reg:squarederror',
            'n_estimators': int(best_iter),
            'learning_rate': 0.05,
            'max_depth': 4,
            'min_child_weight': 5,
            'subsample': 0.8,
            'colsample_bytree': 0.7,
            'reg_alpha': 0.5,
            'reg_lambda': 2.0,
        },
        'top_features': importance.head(20).to_dict('records'),
    }

    meta_path = os.path.join(out_dir, 'xgboost-v7-metadata.json')

    def sanitize(obj):
        if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
            return None
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, dict):
            return {k: sanitize(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [sanitize(v) for v in obj]
        return obj

    with open(meta_path, 'w') as f:
        json.dump(sanitize(metadata), f, indent=2)
    print(f'  Saved: {meta_path}')

    # ── 12. Summary ───────────────────────────────────────────────────────────

    print(f'\n{"=" * 64}')
    print(f'  XGBoost {MODEL_VERSION} training complete.')
    print(f'  Dataset: {len(df)} videos, {len(present)} features')
    print(f'  Test Spearman rho: {spearman_test:.4f} (p={p_test:.2e})')
    print(f'  Test MAE: {test_mae:.2f} DPS | Within ±5: {within5_test:.1f}%')
    print(f'  Tier accuracy: {tier_accuracy:.1f}%')
    print(f'  CV Spearman: {cv_spearman.mean():.4f} ± {cv_spearman.std():.4f}')
    print(f'{"=" * 64}\n')


if __name__ == '__main__':
    main()
