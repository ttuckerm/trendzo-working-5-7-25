# -*- coding: utf-8 -*-
"""
v13 Sandbox: Full retrain with 3 critical fixes over v10/v12

Fix 1: Real Python XGBoost (not Node.js substitute)
Fix 2: NaN passed as-is (XGBoost learns optimal split for missing data)
Fix 3: Optuna re-tuned for full dataset (100 trials, 5-fold CV, Spearman ρ)

Additional:
  - Excludes 6 always-empty speaking_rate_wpm_* features
  - Tests WITH vs WITHOUT timing features (post_hour_utc, post_day_of_week)
  - Uses same 50 holdout IDs from v10/v12
  - Saves as v13-sandbox — NEVER touches production v10

Output:
  - data/sandbox/xgboost-v13-sandbox-model.json
  - data/sandbox/xgboost-v13-sandbox-metadata.json
  - data/sandbox/xgboost-v13-sandbox-features.json
  - data/sandbox/v13-sandbox-report.md
"""

import sys
import io
import os
import json
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold
from scipy.stats import spearmanr
import xgboost as xgb
import optuna
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import functools
_original_print = print
@functools.wraps(_original_print)
def print(*args, **kwargs):
    kwargs.setdefault('flush', True)
    _original_print(*args, **kwargs)

optuna.logging.set_verbosity(optuna.logging.WARNING)

RANDOM_STATE = 42
N_OPTUNA_TRIALS = 100
N_CV_FOLDS = 5
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(PROJECT_ROOT, 'models')
SANDBOX_DIR = os.path.join(PROJECT_ROOT, 'data', 'sandbox')
HOLDOUT_PATH = os.path.join(MODELS_DIR, 'holdout-video-ids.json')

# ── Feature definitions ──────────────────────────────────────────────────

# v10 features (58 total) minus 6 always-empty speaking_rate_wpm_* features
EXCLUDED_FEATURES = {
    'speaking_rate_wpm_variance',
    'speaking_rate_wpm_acceleration',
    'speaking_rate_wpm_peak_count',
    'speaking_rate_wpm_fast_segments',
    'speaking_rate_wpm_slow_segments',
    'visual_to_verbal_ratio',
}

TIMING_FEATURES = {'post_hour_utc', 'post_day_of_week'}

# All v10 features (from models/xgboost-v10-features.json)
V10_ALL_FEATURES = [
    'ffmpeg_scene_changes', 'ffmpeg_cuts_per_second', 'ffmpeg_avg_motion',
    'ffmpeg_color_variance', 'ffmpeg_brightness_avg', 'ffmpeg_contrast_score',
    'ffmpeg_resolution_width', 'ffmpeg_resolution_height', 'ffmpeg_duration_seconds',
    'ffmpeg_bitrate', 'ffmpeg_fps',
    'audio_pitch_mean_hz', 'audio_pitch_variance', 'audio_pitch_range',
    'audio_pitch_std_dev', 'audio_pitch_contour_slope',
    'audio_loudness_mean_lufs', 'audio_loudness_range', 'audio_loudness_variance',
    'audio_silence_ratio', 'audio_silence_count',
    'speaking_rate_wpm',
    'visual_scene_count', 'visual_avg_scene_duration', 'visual_score',
    'thumb_brightness', 'thumb_contrast', 'thumb_colorfulness', 'thumb_overall_score',
    'hook_score', 'hook_confidence', 'hook_text_score', 'hook_type_encoded',
    'text_word_count', 'text_sentence_count', 'text_question_mark_count',
    'text_exclamation_count', 'text_transcript_length', 'text_avg_sentence_length',
    'text_unique_word_ratio', 'text_avg_word_length', 'text_syllable_count',
    'text_flesch_reading_ease', 'text_has_cta',
    'text_negative_word_count', 'text_emoji_count',
    'meta_duration_seconds', 'meta_words_per_second',
    'text_overlay_density', 'visual_proof_ratio', 'vocal_confidence_composite',
    'creator_followers_log', 'post_hour_utc', 'post_day_of_week',
    'specificity_score', 'instructional_density', 'has_step_structure', 'hedge_word_density',
]

V13_FEATURES_WITH_TIMING = [f for f in V10_ALL_FEATURES if f not in EXCLUDED_FEATURES]
V13_FEATURES_NO_TIMING = [f for f in V13_FEATURES_WITH_TIMING if f not in TIMING_FEATURES]


def classify_tier(dps):
    if dps >= 90: return 'mega-viral'
    if dps >= 70: return 'viral'
    if dps >= 60: return 'good'
    if dps >= 40: return 'average'
    return 'low'


def load_env():
    env_path = os.path.join(PROJECT_ROOT, '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()


def fetch_data():
    """Fetch training_features + scraped_videos + prediction_runs."""
    from supabase import create_client

    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        print('  ERROR: Missing Supabase credentials in .env.local')
        sys.exit(1)

    sb = create_client(url, key)

    print('  Fetching training_features...')
    all_features = []
    offset = 0
    while True:
        resp = sb.table('training_features').select('*').range(offset, offset + 999).execute()
        if not resp.data:
            break
        all_features.extend(resp.data)
        if len(resp.data) < 1000:
            break
        offset += 1000
    print(f'  Got {len(all_features)} training_features rows')

    print('  Fetching scraped_videos with dps_score...')
    all_videos = []
    offset = 0
    while True:
        resp = sb.table('scraped_videos').select(
            'video_id, dps_score, niche, creator_id, creator_username'
        ).not_.is_('dps_score', 'null').range(offset, offset + 999).execute()
        if not resp.data:
            break
        all_videos.extend(resp.data)
        if len(resp.data) < 1000:
            break
        offset += 1000
    print(f'  Got {len(all_videos)} scraped_videos with dps_score')

    print('  Fetching labeled prediction_runs...')
    labeled_runs = []
    offset = 0
    while True:
        resp = sb.table('prediction_runs').select(
            'video_id, actual_dps'
        ).not_.is_('actual_dps', 'null').range(offset, offset + 999).execute()
        if not resp.data:
            break
        labeled_runs.extend(resp.data)
        if len(resp.data) < 1000:
            break
        offset += 1000

    actual_dps_map = {}
    for run in labeled_runs:
        vid = run.get('video_id')
        if vid and run.get('actual_dps') is not None:
            actual_dps_map[vid] = run['actual_dps']
    print(f'  Got {len(actual_dps_map)} videos with user-labeled actual_dps')

    video_map = {v['video_id']: v for v in all_videos}
    rows = []
    actual_used = 0
    for feat in all_features:
        vid = feat.get('video_id')
        if vid and vid in video_map:
            row = {**feat}
            if vid in actual_dps_map:
                row['dps_score'] = actual_dps_map[vid]
                actual_used += 1
            else:
                row['dps_score'] = video_map[vid]['dps_score']
            row['niche_key'] = video_map[vid].get('niche', 'side-hustles')
            rows.append(row)

    print(f'  Ground truth: {actual_used} from learning loop, {len(rows) - actual_used} from scraped dps_score')
    return pd.DataFrame(rows)


# ── FIX 2: Prepare features WITHOUT fillna(0) ──────────────────────────
# XGBoost handles NaN natively by learning the optimal split direction.

def prepare_features_native_nan(df, feature_list):
    """Extract feature matrix, preserving NaN for XGBoost native handling."""
    present = [f for f in feature_list if f in df.columns]
    X = df[present].copy()
    for col in X.columns:
        if X[col].dtype == 'bool':
            X[col] = X[col].astype(float)
        elif X[col].dtype == 'object':
            X[col] = pd.to_numeric(X[col], errors='coerce')
        else:
            X[col] = X[col].astype(float)
    # DO NOT fillna(0) — XGBoost handles NaN natively
    return X, present


def evaluate_model(y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    rho, p = spearmanr(y_true, y_pred)
    within_5 = np.mean(np.abs(y_true - y_pred) <= 5) * 100
    within_10 = np.mean(np.abs(y_true - y_pred) <= 10) * 100
    actual_tiers = [classify_tier(d) for d in y_true]
    pred_tiers = [classify_tier(d) for d in y_pred]
    tier_acc = sum(a == p for a, p in zip(actual_tiers, pred_tiers)) / len(y_true) * 100
    return {
        'spearman_rho': float(rho), 'spearman_p': float(p),
        'mae': float(mae), 'rmse': float(rmse), 'r2': float(r2),
        'within_5_dps_pct': float(within_5),
        'within_10_dps_pct': float(within_10),
        'tier_accuracy_pct': float(tier_acc), 'n': len(y_true),
    }


# ── FIX 3: Optuna hyperparameter tuning with Spearman ρ ────────────────

def optuna_tune(X_train, y_train, n_trials=N_OPTUNA_TRIALS, n_folds=N_CV_FOLDS):
    """Run Optuna hyperparameter search optimizing Spearman ρ on 5-fold CV."""

    def objective(trial):
        params = {
            'objective': 'reg:squarederror',
            'tree_method': 'hist',
            'random_state': RANDOM_STATE,
            'n_jobs': 2,
            'verbosity': 0,
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
            'max_depth': trial.suggest_int('max_depth', 3, 10),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
            'reg_alpha': trial.suggest_float('reg_alpha', 0.0, 10.0),
            'reg_lambda': trial.suggest_float('reg_lambda', 0.0, 10.0),
            'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
        }

        kf = KFold(n_splits=n_folds, shuffle=True, random_state=RANDOM_STATE)
        fold_spearmans = []

        X_np = X_train.values if hasattr(X_train, 'values') else X_train
        y_np = y_train if isinstance(y_train, np.ndarray) else y_train.values

        try:
            import gc
            for train_idx, val_idx in kf.split(X_np):
                model = xgb.XGBRegressor(**params)
                model.fit(X_np[train_idx], y_np[train_idx])
                y_pred = np.clip(model.predict(X_np[val_idx]), 0, 100)
                rho, _ = spearmanr(y_np[val_idx], y_pred)
                fold_spearmans.append(rho)
                del model
            gc.collect()
        except (xgb.core.XGBoostError, MemoryError):
            import gc
            gc.collect()
            return float('-inf')

        return float(np.mean(fold_spearmans))

    study = optuna.create_study(
        direction='maximize',
        sampler=optuna.samplers.TPESampler(seed=RANDOM_STATE),
    )
    study.optimize(objective, n_trials=n_trials)

    print(f'\n  Optuna completed: {n_trials} trials')
    print(f'  Best Spearman ρ: {study.best_value:.4f}')
    print(f'  Best params: {json.dumps(study.best_params, indent=4)}')

    best_params = {
        'objective': 'reg:squarederror',
        'tree_method': 'hist',
        'random_state': RANDOM_STATE,
        'n_jobs': 2,
        'verbosity': 0,
        **study.best_params,
    }
    return best_params, study


def cross_validate(X, y, params, n_splits=N_CV_FOLDS):
    """5-fold CV with given params, return per-fold metrics."""
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=RANDOM_STATE)
    fold_metrics = []
    X_np = X.values if hasattr(X, 'values') else X
    y_np = y if isinstance(y, np.ndarray) else y.values

    for train_idx, val_idx in kf.split(X_np):
        model = xgb.XGBRegressor(**params)
        model.fit(X_np[train_idx], y_np[train_idx])
        y_pred = np.clip(model.predict(X_np[val_idx]), 0, 100)
        rho, _ = spearmanr(y_np[val_idx], y_pred)
        mae = mean_absolute_error(y_np[val_idx], y_pred)
        within_10 = np.mean(np.abs(y_np[val_idx] - y_pred) <= 10) * 100
        fold_metrics.append({'spearman': rho, 'mae': mae, 'within_10': within_10})
    return fold_metrics


def train_and_evaluate(X_train, y_train, X_holdout, y_holdout, params, label=''):
    """Train model, evaluate on train + holdout + CV, return everything."""
    print(f'\n  ── {label} ──')
    print(f'  Features: {X_train.shape[1]} | Train: {X_train.shape[0]} | Holdout: {X_holdout.shape[0]}')

    nan_counts = X_train.isna().sum()
    nan_features = nan_counts[nan_counts > 0]
    if len(nan_features) > 0:
        print(f'  NaN features (native handling): {len(nan_features)} features have missing values')
        for feat, cnt in nan_features.head(5).items():
            pct = cnt / len(X_train) * 100
            print(f'    {feat}: {cnt} NaN ({pct:.1f}%)')
        if len(nan_features) > 5:
            print(f'    ... and {len(nan_features) - 5} more')

    model = xgb.XGBRegressor(**params)
    model.fit(X_train.values, y_train)

    y_pred_train = np.clip(model.predict(X_train.values), 0, 100)
    y_pred_holdout = np.clip(model.predict(X_holdout.values), 0, 100)

    metrics_train = evaluate_model(y_train, y_pred_train)
    metrics_holdout = evaluate_model(y_holdout, y_pred_holdout)

    cv_results = cross_validate(X_train, y_train, params)
    cv_spearman = float(np.mean([f['spearman'] for f in cv_results]))
    cv_spearman_std = float(np.std([f['spearman'] for f in cv_results]))
    cv_mae = float(np.mean([f['mae'] for f in cv_results]))
    cv_mae_std = float(np.std([f['mae'] for f in cv_results]))
    cv_within10 = float(np.mean([f['within_10'] for f in cv_results]))

    print(f'  Train  ρ={metrics_train["spearman_rho"]:.4f}  MAE={metrics_train["mae"]:.2f}')
    print(f'  Holdout ρ={metrics_holdout["spearman_rho"]:.4f}  MAE={metrics_holdout["mae"]:.2f}')
    print(f'  CV     ρ={cv_spearman:.4f}±{cv_spearman_std:.4f}  MAE={cv_mae:.2f}±{cv_mae_std:.2f}')

    importance = pd.DataFrame({
        'feature': X_train.columns.tolist(),
        'importance': model.feature_importances_,
    }).sort_values('importance', ascending=False)

    return {
        'model': model,
        'metrics_train': metrics_train,
        'metrics_holdout': metrics_holdout,
        'cv_spearman': cv_spearman,
        'cv_spearman_std': cv_spearman_std,
        'cv_mae': cv_mae,
        'cv_mae_std': cv_mae_std,
        'cv_within10': cv_within10,
        'importance': importance,
        'params': params,
    }


def main():
    print('=' * 70)
    print('  v13 SANDBOX — 3-Fix Retrain')
    print('  Fix 1: Real Python XGBoost (not Node.js)')
    print('  Fix 2: NaN preserved for native handling (not fillna(0))')
    print('  Fix 3: Optuna re-tuned for full dataset')
    print('=' * 70)

    print(f'\n  XGBoost version: {xgb.__version__}')
    print(f'  Optuna version: {optuna.__version__}')

    # Load holdout IDs
    with open(HOLDOUT_PATH) as f:
        holdout_data = json.load(f)
    holdout_ids = set(holdout_data['video_ids'])
    print(f'  Holdout: {len(holdout_ids)} videos (same as v10/v12)')

    # Load v10 baseline for comparison
    v10_meta_path = os.path.join(MODELS_DIR, 'xgboost-v10-metadata.json')
    with open(v10_meta_path) as f:
        v10_meta = json.load(f)
    v10_cv = v10_meta['performance']['cv_5fold']['spearman_mean']
    v10_holdout = v10_meta['performance']['holdout']['spearman_rho']
    print(f'  v10 baseline: CV ρ={v10_cv:.4f}, holdout ρ={v10_holdout:.4f}')
    print(f'  v10 dataset: {v10_meta["dataset"]["total_rows"]} rows')

    # Fetch data
    load_env()
    df = fetch_data()
    df = df[df['niche_key'] == 'side-hustles'].dropna(subset=['dps_score'])
    print(f'\n  Total side-hustles with DPS: {len(df)}')

    # Split
    df_train = df[~df['video_id'].isin(holdout_ids)].copy()
    df_holdout = df[df['video_id'].isin(holdout_ids)].copy()
    print(f'  Train: {len(df_train)} | Holdout: {len(df_holdout)}')

    y_train = df_train['dps_score'].astype(float).values
    y_holdout = df_holdout['dps_score'].astype(float).values

    # Target distribution stats
    print(f'\n  Target distribution (train):')
    print(f'    Mean={y_train.mean():.2f}  Std={y_train.std():.2f}  Min={y_train.min():.2f}  Max={y_train.max():.2f}')

    # ═══════════════════════════════════════════════════════════════════
    # VARIANT A: WITH timing features
    # ═══════════════════════════════════════════════════════════════════
    print('\n' + '=' * 70)
    print('  VARIANT A: WITH timing features (post_hour_utc, post_day_of_week)')
    print('=' * 70)

    X_train_a, present_a = prepare_features_native_nan(df_train, V13_FEATURES_WITH_TIMING)
    X_holdout_a, _ = prepare_features_native_nan(df_holdout, present_a)
    print(f'  Features present: {len(present_a)}/{len(V13_FEATURES_WITH_TIMING)}')

    print('\n  Running Optuna (100 trials, WITH timing)...')
    best_params_a, study_a = optuna_tune(X_train_a, y_train)

    result_a = train_and_evaluate(
        X_train_a, y_train, X_holdout_a, y_holdout,
        best_params_a, 'Variant A: WITH timing'
    )

    # ═══════════════════════════════════════════════════════════════════
    # VARIANT B: WITHOUT timing features
    # ═══════════════════════════════════════════════════════════════════
    print('\n' + '=' * 70)
    print('  VARIANT B: WITHOUT timing features')
    print('=' * 70)

    X_train_b, present_b = prepare_features_native_nan(df_train, V13_FEATURES_NO_TIMING)
    X_holdout_b, _ = prepare_features_native_nan(df_holdout, present_b)
    print(f'  Features present: {len(present_b)}/{len(V13_FEATURES_NO_TIMING)}')

    print('\n  Running Optuna (100 trials, WITHOUT timing)...')
    best_params_b, study_b = optuna_tune(X_train_b, y_train)

    result_b = train_and_evaluate(
        X_train_b, y_train, X_holdout_b, y_holdout,
        best_params_b, 'Variant B: WITHOUT timing'
    )

    # ═══════════════════════════════════════════════════════════════════
    # COMPARISON
    # ═══════════════════════════════════════════════════════════════════
    print('\n' + '=' * 70)
    print('  HEAD-TO-HEAD COMPARISON')
    print('=' * 70)

    print(f'\n  {"Metric":<25s} {"v10":<12s} {"A (timing)":<14s} {"B (no timing)":<14s}')
    print(f'  {"-"*65}')
    print(f'  {"CV Spearman":<25s} {v10_cv:<12.4f} {result_a["cv_spearman"]:<14.4f} {result_b["cv_spearman"]:<14.4f}')
    print(f'  {"Holdout Spearman":<25s} {v10_holdout:<12.4f} {result_a["metrics_holdout"]["spearman_rho"]:<14.4f} {result_b["metrics_holdout"]["spearman_rho"]:<14.4f}')
    print(f'  {"Holdout MAE":<25s} {v10_meta["performance"]["holdout"]["mae"]:<12.2f} {result_a["metrics_holdout"]["mae"]:<14.2f} {result_b["metrics_holdout"]["mae"]:<14.2f}')
    print(f'  {"Training rows":<25s} {v10_meta["dataset"]["train_rows"]:<12d} {len(df_train):<14d} {len(df_train):<14d}')
    print(f'  {"Feature count":<25s} {58:<12d} {len(present_a):<14d} {len(present_b):<14d}')

    # Decide which variant is better
    a_better = result_a['cv_spearman'] > result_b['cv_spearman']
    winner = 'A (WITH timing)' if a_better else 'B (WITHOUT timing)'
    winner_result = result_a if a_better else result_b
    winner_features = present_a if a_better else present_b
    winner_params = best_params_a if a_better else best_params_b
    loser_result = result_b if a_better else result_a
    timing_delta = result_a['cv_spearman'] - result_b['cv_spearman']

    print(f'\n  Winner: {winner}')
    print(f'  Timing features {"HELP" if timing_delta > 0 else "HURT"} by {abs(timing_delta):.4f} CV Spearman')

    # ═══════════════════════════════════════════════════════════════════
    # FEATURE IMPORTANCE (winner)
    # ═══════════════════════════════════════════════════════════════════
    importance = winner_result['importance']
    print(f'\n  Top 15 features ({winner}):')
    for i, (_, row) in enumerate(importance.head(15).iterrows()):
        timing_mark = ' ⏰' if row['feature'] in TIMING_FEATURES else ''
        print(f'    {i+1:2d}. {row["feature"]:<35s} {row["importance"]:.4f}{timing_mark}')

    # ═══════════════════════════════════════════════════════════════════
    # SAVE ARTIFACTS
    # ═══════════════════════════════════════════════════════════════════
    os.makedirs(SANDBOX_DIR, exist_ok=True)

    print(f'\n  Saving v13-sandbox artifacts...')

    # Save model
    model_path = os.path.join(SANDBOX_DIR, 'xgboost-v13-sandbox-model.json')
    winner_result['model'].save_model(model_path)
    print(f'    Model: {model_path}')

    # Save features
    features_path = os.path.join(SANDBOX_DIR, 'xgboost-v13-sandbox-features.json')
    with open(features_path, 'w') as f:
        json.dump(winner_features, f, indent=2)
    print(f'    Features: {features_path}')

    # Serialize params for JSON
    serializable_params = {}
    for k, v in winner_params.items():
        if isinstance(v, (np.integer,)):
            serializable_params[k] = int(v)
        elif isinstance(v, (np.floating,)):
            serializable_params[k] = float(v)
        else:
            serializable_params[k] = v

    # Save metadata
    meta_path = os.path.join(SANDBOX_DIR, 'xgboost-v13-sandbox-metadata.json')
    metadata = {
        'model_version': 'v13-sandbox',
        'trained_at': datetime.now().isoformat(),
        'implementation': f'Python XGBoost {xgb.__version__}',
        'WARNING': 'SANDBOX ONLY. Do NOT overwrite v10.',
        'fixes_applied': [
            'Fix 1: Real Python XGBoost (not Node.js histogram GBM)',
            'Fix 2: NaN preserved for native XGBoost handling (not fillna(0))',
            f'Fix 3: Optuna re-tuned for {len(df_train)} rows ({N_OPTUNA_TRIALS} trials, {N_CV_FOLDS}-fold CV)',
        ],
        'excluded_features': sorted(list(EXCLUDED_FEATURES)),
        'timing_features_verdict': {
            'winner': winner,
            'timing_delta_cv_spearman': float(timing_delta),
            'timing_helps': timing_delta > 0,
            'variant_a_with_timing': {
                'cv_spearman': result_a['cv_spearman'],
                'holdout_spearman': result_a['metrics_holdout']['spearman_rho'],
            },
            'variant_b_without_timing': {
                'cv_spearman': result_b['cv_spearman'],
                'holdout_spearman': result_b['metrics_holdout']['spearman_rho'],
            },
        },
        'feature_count': len(winner_features),
        'feature_names': winner_features,
        'dataset': {
            'total_rows': len(df),
            'train_rows': len(df_train),
            'holdout_rows': len(df_holdout),
            'holdout_method': 'explicit ID list (same 50 as v10/v12)',
            'niches': {'side-hustles': len(df)},
        },
        'target_stats': {
            'min': float(y_train.min()),
            'max': float(y_train.max()),
            'mean': float(y_train.mean()),
            'std': float(y_train.std()),
            'median': float(np.median(y_train)),
        },
        'performance': {
            'train': winner_result['metrics_train'],
            'holdout': winner_result['metrics_holdout'],
            'cv_5fold': {
                'spearman_mean': winner_result['cv_spearman'],
                'spearman_std': winner_result['cv_spearman_std'],
                'mae_mean': winner_result['cv_mae'],
                'mae_std': winner_result['cv_mae_std'],
                'within_10_mean': winner_result['cv_within10'],
            },
        },
        'hyperparameters': serializable_params,
        'optuna_study': {
            'n_trials': N_OPTUNA_TRIALS,
            'best_trial': study_a.best_trial.number if a_better else study_b.best_trial.number,
            'best_value': study_a.best_value if a_better else study_b.best_value,
        },
        'comparison_vs_v10': {
            'v10_cv_spearman': v10_cv,
            'v10_holdout_spearman': v10_holdout,
            'v10_train_rows': v10_meta['dataset']['train_rows'],
            'delta_cv': float(winner_result['cv_spearman'] - v10_cv),
            'delta_holdout': float(winner_result['metrics_holdout']['spearman_rho'] - v10_holdout),
        },
        'top_features': [
            {'feature': row['feature'], 'importance': float(row['importance'])}
            for _, row in importance.head(20).iterrows()
        ],
    }
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f'    Metadata: {meta_path}')

    # ═══════════════════════════════════════════════════════════════════
    # GENERATE REPORT
    # ═══════════════════════════════════════════════════════════════════
    now = datetime.now().strftime('%Y-%m-%d %H:%M')

    report = f"""# v13 Sandbox Retrain Report

**Date:** {now}
**Script:** `scripts/train-v13-sandbox.py`
**XGBoost:** {xgb.__version__} (Python — real, not Node.js)
**Optuna:** {optuna.__version__} ({N_OPTUNA_TRIALS} trials)
**NaN handling:** Native XGBoost (NOT fillna(0))

---

## 3 Fixes Applied

| # | Problem | Fix |
|---|---------|-----|
| 1 | v12 used Node.js histogram GBM | Real Python XGBoost {xgb.__version__} |
| 2 | fillna(0) — pitch_mean_hz=0 means "no pitch" to model | NaN preserved — XGBoost learns optimal split for missing |
| 3 | Optuna tuned for 863 rows (v8) | Re-tuned for {len(df_train)} rows ({N_OPTUNA_TRIALS} trials) |

---

## Dataset

| Metric | v10 | v13-sandbox |
|--------|-----|-------------|
| Training rows | {v10_meta['dataset']['train_rows']} | {len(df_train)} |
| Holdout rows | 50 | {len(df_holdout)} |
| Niche | side-hustles | side-hustles |
| DPS mean (train) | {v10_meta['target_stats']['mean']:.2f} | {y_train.mean():.2f} |
| DPS std (train) | {v10_meta['target_stats']['std']:.2f} | {y_train.std():.2f} |

---

## Timing Features A/B Test

| Metric | A (WITH timing) | B (WITHOUT timing) | Delta |
|--------|-----------------|---------------------|-------|
| CV Spearman | {result_a['cv_spearman']:.4f} ± {result_a['cv_spearman_std']:.4f} | {result_b['cv_spearman']:.4f} ± {result_b['cv_spearman_std']:.4f} | {timing_delta:+.4f} |
| Holdout Spearman | {result_a['metrics_holdout']['spearman_rho']:.4f} | {result_b['metrics_holdout']['spearman_rho']:.4f} | {result_a['metrics_holdout']['spearman_rho'] - result_b['metrics_holdout']['spearman_rho']:+.4f} |
| Holdout MAE | {result_a['metrics_holdout']['mae']:.2f} | {result_b['metrics_holdout']['mae']:.2f} | {result_a['metrics_holdout']['mae'] - result_b['metrics_holdout']['mae']:+.2f} |

**Verdict:** Timing features **{'HELP' if timing_delta > 0 else 'HURT'}** by {abs(timing_delta):.4f} CV Spearman. Winner: **{winner}**.

---

## Head-to-Head: v10 vs v13-sandbox

| Metric | v10 | v13-sandbox | Delta |
|--------|-----|-------------|-------|
| CV Spearman | {v10_cv:.4f} | {winner_result['cv_spearman']:.4f} | **{winner_result['cv_spearman'] - v10_cv:+.4f}** |
| Holdout Spearman | {v10_holdout:.4f} | {winner_result['metrics_holdout']['spearman_rho']:.4f} | **{winner_result['metrics_holdout']['spearman_rho'] - v10_holdout:+.4f}** |
| Holdout MAE | {v10_meta['performance']['holdout']['mae']:.2f} | {winner_result['metrics_holdout']['mae']:.2f} | {winner_result['metrics_holdout']['mae'] - v10_meta['performance']['holdout']['mae']:+.2f} |
| Training rows | {v10_meta['dataset']['train_rows']} | {len(df_train)} | +{len(df_train) - v10_meta['dataset']['train_rows']} |
| Features | 58 | {len(winner_features)} | {len(winner_features) - 58:+d} |

---

## Optuna Best Hyperparameters (v13)

| Parameter | v10 (v8-era) | v13-sandbox |
|-----------|-------------|-------------|
"""
    v10_params = v10_meta['hyperparameters']
    for param in ['learning_rate', 'max_depth', 'min_child_weight', 'n_estimators',
                   'subsample', 'colsample_bytree', 'reg_alpha', 'reg_lambda']:
        v10_val = v10_params.get(param, '—')
        v13_val = serializable_params.get(param, '—')
        if isinstance(v10_val, float):
            report += f'| {param} | {v10_val:.6f} | {v13_val:.6f} |\n'
        else:
            report += f'| {param} | {v10_val} | {v13_val} |\n'

    report += f"""
---

## Feature Importance (Top 15)

| Rank | Feature | Importance |
|------|---------|------------|
"""
    for i, (_, row) in enumerate(importance.head(15).iterrows()):
        bar = '█' * int(row['importance'] * 100)
        timing = ' ⏰' if row['feature'] in TIMING_FEATURES else ''
        report += f'| {i+1} | `{row["feature"]}` | {row["importance"]:.4f} {bar}{timing} |\n'

    report += f"""
---

*Generated by `scripts/train-v13-sandbox.py` on {now}*
*XGBoost {xgb.__version__} | Optuna {optuna.__version__} | {N_OPTUNA_TRIALS} trials | {N_CV_FOLDS}-fold CV*
*SANDBOX ONLY — v10 production model is untouched*
"""

    report_path = os.path.join(SANDBOX_DIR, 'v13-sandbox-report.md')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f'    Report: {report_path}')

    # ═══════════════════════════════════════════════════════════════════
    # FINAL SUMMARY
    # ═══════════════════════════════════════════════════════════════════
    print('\n' + '=' * 70)
    print('  v13 SANDBOX COMPLETE')
    print('=' * 70)
    delta_cv = winner_result['cv_spearman'] - v10_cv
    delta_holdout = winner_result['metrics_holdout']['spearman_rho'] - v10_holdout
    print(f'  XGBoost: {xgb.__version__} (Python)')
    print(f'  Training set: {len(df_train)} rows (v10 had {v10_meta["dataset"]["train_rows"]})')
    print(f'  CV Spearman: {winner_result["cv_spearman"]:.4f} (v10: {v10_cv:.4f}, delta: {delta_cv:+.4f})')
    print(f'  Holdout Spearman: {winner_result["metrics_holdout"]["spearman_rho"]:.4f} (v10: {v10_holdout:.4f}, delta: {delta_holdout:+.4f})')
    print(f'  Timing features: {"HELP" if timing_delta > 0 else "HURT"} ({timing_delta:+.4f})')
    print(f'  Winner: {winner}')
    print(f'  Status: SANDBOX — v10 is untouched')
    print('=' * 70)


if __name__ == '__main__':
    main()
