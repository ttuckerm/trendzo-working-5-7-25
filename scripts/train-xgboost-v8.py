# -*- coding: utf-8 -*-
"""
Train XGBoost v8 Model for DPS Prediction (Side Hustles)

v8 changes from v7:
  - Removed 4 metadata features (not available at upload prediction time)
  - Removed 16 zero-importance features from v7
  - 48 content-only features remain
  - Optuna 200-trial hyperparameter optimization (maximizes 5-fold CV Spearman rho)

Input:  Supabase training_features + scraped_videos (joined on video_id)
Output: models/xgboost-v8-model.json, xgboost-v8-scaler.json,
        xgboost-v8-features.json, xgboost-v8-metadata.json

Usage:
    python scripts/train-xgboost-v8.py
    python scripts/train-xgboost-v8.py --input /path/to/cached.csv

Requirements:
    pip install xgboost scikit-learn pandas numpy scipy supabase optuna
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
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from scipy.stats import spearmanr
import xgboost as xgb
import optuna
from datetime import datetime

# Force UTF-8 on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Suppress Optuna's per-trial logging (we print our own summary)
optuna.logging.set_verbosity(optuna.logging.WARNING)

# ── CLI ────────────────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description='Train XGBoost v8 for Side Hustles DPS')
parser.add_argument('--input', default=None, help='Path to cached CSV (skip Supabase fetch)')
parser.add_argument('--output-dir', default='models', help='Output directory')
parser.add_argument('--trials', type=int, default=200, help='Number of Optuna trials')
args = parser.parse_args()

# ── Constants ──────────────────────────────────────────────────────────────────

MODEL_VERSION = 'v8'
RANDOM_STATE = 42

# 48 content-only features (removed 4 meta + 16 zero-importance from v7's 68)
FEATURES_TO_REMOVE = {
    # Metadata: not available at prediction time for uploaded videos
    'meta_creator_followers',
    'meta_creator_followers_log',
    'meta_hashtag_count',
    'meta_has_viral_hashtag',
    # Zero importance in v7: model never split on these
    'speaking_rate_wpm_acceleration',
    'speaking_rate_wpm_peak_count',
    'speaking_rate_fast_segments',
    'speaking_rate_slow_segments',
    'audio_speech_ratio',
    'audio_type_encoded',
    'audio_energy_variance',
    'speaking_rate_wpm_variance',
    'audio_music_ratio',
    'ffmpeg_has_audio',
    'hook_pace_score',
    'hook_audio_score',
    'hook_visual_score',
    'hook_tone_score',
    'thumb_confidence',
    'text_positive_word_count',
}

# All 68 v7 feature names in canonical order
ALL_V7_FEATURES = [
    "ffmpeg_scene_changes", "ffmpeg_cuts_per_second", "ffmpeg_avg_motion",
    "ffmpeg_color_variance", "ffmpeg_brightness_avg", "ffmpeg_contrast_score",
    "ffmpeg_resolution_width", "ffmpeg_resolution_height", "ffmpeg_duration_seconds",
    "ffmpeg_bitrate", "ffmpeg_fps", "ffmpeg_has_audio",
    "audio_pitch_mean_hz", "audio_pitch_variance", "audio_pitch_range",
    "audio_pitch_std_dev", "audio_pitch_contour_slope",
    "audio_loudness_mean_lufs", "audio_loudness_range", "audio_loudness_variance",
    "audio_silence_ratio", "audio_silence_count",
    "audio_music_ratio", "audio_speech_ratio", "audio_type_encoded", "audio_energy_variance",
    "speaking_rate_wpm", "speaking_rate_wpm_variance", "speaking_rate_wpm_acceleration",
    "speaking_rate_wpm_peak_count", "speaking_rate_fast_segments", "speaking_rate_slow_segments",
    "visual_scene_count", "visual_avg_scene_duration", "visual_score",
    "thumb_brightness", "thumb_contrast", "thumb_colorfulness",
    "thumb_overall_score", "thumb_confidence",
    "hook_score", "hook_confidence", "hook_text_score", "hook_audio_score",
    "hook_visual_score", "hook_pace_score", "hook_tone_score", "hook_type_encoded",
    "text_word_count", "text_sentence_count", "text_question_mark_count",
    "text_exclamation_count", "text_transcript_length", "text_avg_sentence_length",
    "text_unique_word_ratio", "text_avg_word_length", "text_syllable_count",
    "text_flesch_reading_ease", "text_has_cta",
    "text_positive_word_count", "text_negative_word_count", "text_emoji_count",
    "meta_duration_seconds", "meta_hashtag_count", "meta_has_viral_hashtag",
    "meta_creator_followers", "meta_creator_followers_log", "meta_words_per_second",
]

V8_FEATURES = [f for f in ALL_V7_FEATURES if f not in FEATURES_TO_REMOVE]

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
    print(f'  {len(V8_FEATURES)} content-only features (removed {len(FEATURES_TO_REMOVE)} from v7)')
    print(f'  Optuna {args.trials}-trial optimization (5-fold CV Spearman rho)')
    print('=' * 60)

    # ── 1. Load data ──────────────────────────────────────────────────────────

    if args.input and os.path.exists(args.input):
        print(f'\n  Loading from CSV: {args.input}')
        df = pd.read_csv(args.input)
    else:
        print('\n  Fetching from Supabase...')
        df = fetch_from_supabase()

    print(f'  Loaded {len(df)} rows')

    # Filter to side-hustles with valid DPS
    if 'niche_key' in df.columns:
        df = df[df['niche_key'] == 'side-hustles']
        print(f'  Filtered to side-hustles: {len(df)} rows')

    if 'dps_score' in df.columns:
        df = df.dropna(subset=['dps_score'])
        target_col = 'dps_score'
    elif 'actual_dps' in df.columns:
        df = df.dropna(subset=['actual_dps'])
        target_col = 'actual_dps'
    else:
        print('  ERROR: No target column (dps_score or actual_dps) found')
        sys.exit(1)

    print(f'  Rows with {target_col}: {len(df)}')

    # ── 2. Prepare features ───────────────────────────────────────────────────

    present = [f for f in V8_FEATURES if f in df.columns]
    missing = [f for f in V8_FEATURES if f not in df.columns]

    print(f'\n  Features: {len(present)}/{len(V8_FEATURES)} present')
    if missing:
        print(f'  Missing: {missing}')

    X = df[present].copy()

    # Convert booleans to int
    for col in X.columns:
        if X[col].dtype == 'bool' or X[col].dtype == 'object':
            X[col] = X[col].astype(float)

    # Fill NaN with 0
    nan_counts = X.isna().sum()
    nan_cols = nan_counts[nan_counts > 0]
    if len(nan_cols) > 0:
        print(f'\n  NaN columns (filled with 0):')
        for col, cnt in list(nan_cols.items())[:10]:
            print(f'    {col}: {cnt}/{len(X)} NaN')
        if len(nan_cols) > 10:
            print(f'    ... and {len(nan_cols) - 10} more')
    X = X.fillna(0).astype(float)

    y = df[target_col].astype(float).values

    print(f'\n  Target stats:')
    print(f'    Range:  [{y.min():.2f}, {y.max():.2f}]')
    print(f'    Mean:   {y.mean():.2f} +/- {y.std():.2f}')
    print(f'    Median: {np.median(y):.2f}')

    # ── 3. Stratified split ───────────────────────────────────────────────────

    # Stratify by DPS quintiles for balanced representation
    y_bins = pd.qcut(y, q=5, labels=False, duplicates='drop')

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y_bins
    )

    print(f'\n  Stratified split (80/20):')
    print(f'    Train: {len(X_train)} rows')
    print(f'    Test:  {len(X_test)} rows')

    # ── 4. Scale features ──────────────────────────────────────────────────────

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── 5. Optuna hyperparameter search ───────────────────────────────────────

    print(f'\n  Running Optuna ({args.trials} trials, 5-fold CV Spearman rho)...')

    kf = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    def objective(trial):
        params = {
            'n_estimators': trial.suggest_int('n_estimators', 50, 500),
            'max_depth': trial.suggest_int('max_depth', 3, 8),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
            'reg_alpha': trial.suggest_float('reg_alpha', 0.0, 2.0),
            'reg_lambda': trial.suggest_float('reg_lambda', 0.5, 5.0),
        }

        spearman_scores = []
        for train_idx, val_idx in kf.split(X_train_scaled):
            model = xgb.XGBRegressor(
                **params,
                objective='reg:squarederror',
                random_state=RANDOM_STATE,
                n_jobs=-1,
                verbosity=0,
            )
            model.fit(X_train_scaled[train_idx], y_train[train_idx])
            y_pred = model.predict(X_train_scaled[val_idx])
            rho, _ = spearmanr(y_train[val_idx], y_pred)
            spearman_scores.append(rho)

        return np.mean(spearman_scores)

    study = optuna.create_study(direction='maximize', sampler=optuna.samplers.TPESampler(seed=RANDOM_STATE))
    study.optimize(objective, n_trials=args.trials, show_progress_bar=True)

    best_params = study.best_params
    best_cv_spearman = study.best_value

    print(f'\n  Optuna best CV Spearman: {best_cv_spearman:.4f}')
    print(f'  Best parameters:')
    for k, v in sorted(best_params.items()):
        if isinstance(v, float):
            print(f'    {k}: {v:.6f}')
        else:
            print(f'    {k}: {v}')

    # ── 6. Train final model with best params ─────────────────────────────────

    model = xgb.XGBRegressor(
        **best_params,
        objective='reg:squarederror',
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbosity=0,
    )
    model.fit(X_train_scaled, y_train)

    # ── 7. Evaluate ────────────────────────────────────────────────────────────

    y_pred_train = np.clip(model.predict(X_train_scaled), 0, 100)
    y_pred_test = np.clip(model.predict(X_test_scaled), 0, 100)

    train_mae = mean_absolute_error(y_train, y_pred_train)
    test_mae = mean_absolute_error(y_test, y_pred_test)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
    train_r2 = r2_score(y_train, y_pred_train)
    test_r2 = r2_score(y_test, y_pred_test)

    train_spearman, _ = spearmanr(y_train, y_pred_train)
    test_spearman, test_spearman_p = spearmanr(y_test, y_pred_test)

    within_5_train = np.mean(np.abs(y_train - y_pred_train) <= 5) * 100
    within_5_test = np.mean(np.abs(y_test - y_pred_test) <= 5) * 100
    within_10_train = np.mean(np.abs(y_train - y_pred_train) <= 10) * 100
    within_10_test = np.mean(np.abs(y_test - y_pred_test) <= 10) * 100

    actual_tiers = [classify_tier(d) for d in y_test]
    pred_tiers = [classify_tier(d) for d in y_pred_test]
    tier_accuracy = sum(a == p for a, p in zip(actual_tiers, pred_tiers)) / len(y_test) * 100

    # Final 5-fold CV on training set with best params
    cv_spearman_scores = []
    for train_idx, val_idx in kf.split(X_train_scaled):
        model_cv = xgb.XGBRegressor(**best_params, objective='reg:squarederror',
                                     random_state=RANDOM_STATE, n_jobs=-1, verbosity=0)
        model_cv.fit(X_train_scaled[train_idx], y_train[train_idx])
        y_cv_pred = model_cv.predict(X_train_scaled[val_idx])
        rho, _ = spearmanr(y_train[val_idx], y_cv_pred)
        cv_spearman_scores.append(rho)

    cv_mae_scores = cross_val_score(model, X_train_scaled, y_train, cv=5,
                                     scoring='neg_mean_absolute_error')
    cv_r2_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='r2')

    print(f'\n  Performance:')
    print(f'                       Train       Test        v7 Test')
    print(f'    Spearman rho     : {train_spearman:7.4f}    {test_spearman:7.4f}      0.7709')
    print(f'    MAE              : {train_mae:7.2f}    {test_mae:7.2f}       9.44')
    print(f'    RMSE             : {train_rmse:7.2f}    {test_rmse:7.2f}      12.29')
    print(f'    R2               : {train_r2:7.3f}    {test_r2:7.3f}       0.574')
    print(f'    Within +/-5 DPS  : {within_5_train:6.1f}%    {within_5_test:6.1f}%      39.9%')
    print(f'    Within +/-10 DPS : {within_10_train:6.1f}%    {within_10_test:6.1f}%      58.4%')
    print(f'    Tier accuracy    :    --      {tier_accuracy:6.1f}%      53.2%')
    print(f'\n    CV Spearman (5f) : {np.mean(cv_spearman_scores):.4f} +/- {np.std(cv_spearman_scores):.4f}')
    print(f'    CV MAE (5f)      : {-cv_mae_scores.mean():.2f} +/- {cv_mae_scores.std():.2f}')
    print(f'    CV R2 (5f)       : {cv_r2_scores.mean():.3f} +/- {cv_r2_scores.std():.3f}')

    # Baseline: predict mean
    baseline_mae = mean_absolute_error(y_test, np.full_like(y_test, y_train.mean()))
    print(f'\n    Baseline (mean)  : MAE = {baseline_mae:.2f}')

    # ── 8. Feature importance ──────────────────────────────────────────────────

    importance = pd.DataFrame({
        'feature': present,
        'importance': model.feature_importances_,
    }).sort_values('importance', ascending=False)

    print(f'\n  Top 15 features:')
    for _, row in importance.head(15).iterrows():
        bar = '#' * int(row['importance'] * 200)
        print(f'    {row["feature"]:<35} {row["importance"]:.4f}  {bar}')

    zero_imp = importance[importance['importance'] == 0.0]
    if len(zero_imp) > 0:
        print(f'\n  Zero-importance features ({len(zero_imp)}):')
        for _, row in zero_imp.iterrows():
            print(f'    {row["feature"]}')

    # ── 9. Save artifacts ──────────────────────────────────────────────────────

    out_dir = args.output_dir
    os.makedirs(out_dir, exist_ok=True)

    # Model (JSON)
    model_path = os.path.join(out_dir, 'xgboost-v8-model.json')
    model.save_model(model_path)
    print(f'\n  Saved: {model_path}')

    # Scaler (JSON directly — no pickle needed)
    scaler_json = {
        'mean': scaler.mean_.tolist(),
        'std': scaler.scale_.tolist(),
        'feature_names': present,
    }
    scaler_path = os.path.join(out_dir, 'xgboost-v8-scaler.json')
    with open(scaler_path, 'w') as f:
        json.dump(scaler_json, f, indent=2)
    print(f'  Saved: {scaler_path}')

    # Feature names
    features_path = os.path.join(out_dir, 'xgboost-v8-features.json')
    with open(features_path, 'w') as f:
        json.dump(present, f, indent=2)
    print(f'  Saved: {features_path}')

    # Training metadata
    metadata = {
        'model_version': MODEL_VERSION,
        'trained_at': datetime.now().isoformat(),
        'source': 'supabase:training_features+scraped_videos',
        'optimization': f'Optuna {args.trials} trials, 5-fold CV Spearman rho (TPE sampler)',
        'changes_from_v7': (
            'Removed 4 metadata features (not available at prediction time) '
            'and 16 zero-importance features. 48 content-only features remain. '
            f'Optuna {args.trials}-trial optimization replaces RandomizedSearchCV.'
        ),
        'features_removed': sorted(FEATURES_TO_REMOVE),
        'feature_count': len(present),
        'feature_names': present,
        'dataset': {
            'total_rows': len(df),
            'train_rows': len(X_train),
            'test_rows': len(X_test),
            'split': 'stratified 80/20',
            'niches': {'side-hustles': len(df)},
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
                'spearman_rho': float(train_spearman),
                'mae': float(train_mae),
                'rmse': float(train_rmse),
                'r2': float(train_r2),
                'within_5_dps_pct': float(within_5_train),
                'within_10_dps_pct': float(within_10_train),
            },
            'test': {
                'spearman_rho': float(test_spearman),
                'spearman_p_value': float(test_spearman_p),
                'mae': float(test_mae),
                'rmse': float(test_rmse),
                'r2': float(test_r2),
                'within_5_dps_pct': float(within_5_test),
                'within_10_dps_pct': float(within_10_test),
                'tier_accuracy_pct': float(tier_accuracy),
            },
            'cv_5fold': {
                'spearman_mean': float(np.mean(cv_spearman_scores)),
                'spearman_std': float(np.std(cv_spearman_scores)),
                'mae_mean': float(-cv_mae_scores.mean()),
                'mae_std': float(cv_mae_scores.std()),
                'r2_mean': float(cv_r2_scores.mean()),
                'r2_std': float(cv_r2_scores.std()),
            },
            'baseline_mean_predictor': {
                'mae': float(baseline_mae),
            },
        },
        'hyperparameters': best_params,
        'optuna_best_cv_spearman': float(best_cv_spearman),
        'optuna_trials': args.trials,
        'top_features': importance.head(20).to_dict('records'),
    }

    # Sanitize NaN/Inf
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

    meta_path = os.path.join(out_dir, 'xgboost-v8-metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(sanitize(metadata), f, indent=2)
    print(f'  Saved: {meta_path}')

    # ── 10. Summary ─────────────────────────────────────────────────────────────

    print(f'\n{"=" * 60}')
    print(f'  XGBoost {MODEL_VERSION} training complete (Optuna {args.trials} trials).')
    print(f'  {len(present)} features | {len(df)} videos | Spearman={test_spearman:.4f}')
    print(f'  Test MAE: {test_mae:.2f} | R2: {test_r2:.3f} | Within +/-10: {within_10_test:.1f}%')
    print(f'{"=" * 60}\n')

    # ── 11. v7 vs v8 comparison ──────────────────────────────────────────────
    print(f'\n  {"=" * 55}')
    print(f'  v7 vs v8 COMPARISON (test set)')
    print(f'  {"=" * 55}')
    print(f'  {"Metric":<25} {"v7":>10} {"v8":>10} {"Delta":>10}')
    print(f'  {"-" * 55}')

    v7_spearman = 0.7709
    v7_mae = 9.44
    v7_r2 = 0.5742
    v7_within_10 = 58.4
    v7_tier = 53.2

    def delta(v8, v7, higher_is_better=True):
        d = v8 - v7
        sign = '+' if d > 0 else ''
        good = (d > 0) == higher_is_better
        return f'{sign}{d:.4f}' if abs(d) < 1 else f'{sign}{d:.2f}'

    print(f'  {"Spearman rho":<25} {v7_spearman:>10.4f} {test_spearman:>10.4f} {delta(test_spearman, v7_spearman):>10}')
    print(f'  {"MAE":<25} {v7_mae:>10.2f} {test_mae:>10.2f} {delta(test_mae, v7_mae, False):>10}')
    print(f'  {"R2":<25} {v7_r2:>10.4f} {test_r2:>10.4f} {delta(test_r2, v7_r2):>10}')
    print(f'  {"Within +/-10 DPS %":<25} {v7_within_10:>10.1f} {within_10_test:>10.1f} {delta(within_10_test, v7_within_10):>10}')
    print(f'  {"Tier accuracy %":<25} {v7_tier:>10.1f} {tier_accuracy:>10.1f} {delta(tier_accuracy, v7_tier):>10}')
    print(f'  {"=" * 55}\n')


def fetch_from_supabase():
    """Fetch training data from Supabase (same source as v7)."""
    from supabase import create_client

    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')

    if not url or not key:
        # Try loading from .env.local
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if '=' in line and not line.startswith('#'):
                        k, v = line.split('=', 1)
                        os.environ[k.strip()] = v.strip()
            url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
            key = os.environ.get('SUPABASE_SERVICE_KEY')

    if not url or not key:
        print('  ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY')
        sys.exit(1)

    sb = create_client(url, key)

    # Fetch training_features
    print('  Fetching training_features...')
    all_features = []
    offset = 0
    batch_size = 1000
    while True:
        resp = sb.table('training_features').select('*').range(offset, offset + batch_size - 1).execute()
        if not resp.data:
            break
        all_features.extend(resp.data)
        if len(resp.data) < batch_size:
            break
        offset += batch_size

    print(f'  Got {len(all_features)} training_features rows')

    # Fetch scraped_videos for DPS scores and niche
    print('  Fetching scraped_videos (dps_score, niche)...')
    all_videos = []
    offset = 0
    while True:
        resp = sb.table('scraped_videos').select(
            'video_id, dps_score, niche'
        ).not_.is_('dps_score', 'null').range(offset, offset + batch_size - 1).execute()
        if not resp.data:
            break
        all_videos.extend(resp.data)
        if len(resp.data) < batch_size:
            break
        offset += batch_size

    print(f'  Got {len(all_videos)} scraped_videos with dps_score')

    # Join on video_id
    video_map = {v['video_id']: v for v in all_videos}
    rows = []
    for feat in all_features:
        vid = feat.get('video_id')
        if vid and vid in video_map:
            row = {**feat}
            row['dps_score'] = video_map[vid]['dps_score']
            row['niche_key'] = video_map[vid].get('niche', 'side-hustles')
            rows.append(row)

    df = pd.DataFrame(rows)
    print(f'  Joined: {len(df)} rows with both features and DPS')

    # Cache for re-runs
    cache_path = os.path.join(os.environ.get('TEMP', '/tmp'), 'trendzo_v8_training_data.csv')
    df.to_csv(cache_path, index=False)
    print(f'  Cached to {cache_path}')

    return df


if __name__ == '__main__':
    main()
