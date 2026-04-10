# -*- coding: utf-8 -*-
"""
v14 Sandbox Experiments A/B/C/D — Isolating what matters

All use v13 fixes: real XGBoost, NaN native, Optuna 100 trials.
All compare against v10 baseline. NEVER touch production.

Experiment A: Original 963 rows (Mar 13-14) + new random 50-holdout
Experiment B: 963 + rows with 90%+ feature fill rate
Experiment C: Full 6679 + new 200-video stratified holdout
Experiment D: Full 6679 minus outliers (DPS < 5 or > 99)
"""

import sys, io, os, json, gc
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold
from scipy.stats import spearmanr
import xgboost as xgb
import optuna
from datetime import datetime

PROJECT_ROOT_EARLY = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_PATH = os.path.join(PROJECT_ROOT_EARLY, 'data', 'sandbox', 'v14-log.txt')
os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
_log_file = open(LOG_PATH, 'w', encoding='utf-8')

import functools
_original_print = __builtins__['print'] if isinstance(__builtins__, dict) else __builtins__.print
@functools.wraps(_original_print)
def print(*args, **kwargs):
    kwargs.setdefault('flush', True)
    _original_print(*args, **kwargs)
    try:
        _log_file.write(' '.join(str(a) for a in args) + '\n')
        _log_file.flush()
    except:
        pass

optuna.logging.set_verbosity(optuna.logging.WARNING)

RANDOM_STATE = 42
N_OPTUNA_TRIALS = 100
N_CV_FOLDS = 5
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(PROJECT_ROOT, 'models')
SANDBOX_DIR = os.path.join(PROJECT_ROOT, 'data', 'sandbox')

EXCLUDED_FEATURES = {
    'speaking_rate_wpm_variance', 'speaking_rate_wpm_acceleration',
    'speaking_rate_wpm_peak_count', 'speaking_rate_wpm_fast_segments',
    'speaking_rate_wpm_slow_segments', 'visual_to_verbal_ratio',
}

V10_ALL_FEATURES = [
    'ffmpeg_scene_changes', 'ffmpeg_cuts_per_second', 'ffmpeg_avg_motion',
    'ffmpeg_color_variance', 'ffmpeg_brightness_avg', 'ffmpeg_contrast_score',
    'ffmpeg_resolution_width', 'ffmpeg_resolution_height', 'ffmpeg_duration_seconds',
    'ffmpeg_bitrate', 'ffmpeg_fps',
    'audio_pitch_mean_hz', 'audio_pitch_variance', 'audio_pitch_range',
    'audio_pitch_std_dev', 'audio_pitch_contour_slope',
    'audio_loudness_mean_lufs', 'audio_loudness_range', 'audio_loudness_variance',
    'audio_silence_ratio', 'audio_silence_count', 'speaking_rate_wpm',
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

FEATURES = [f for f in V10_ALL_FEATURES if f not in EXCLUDED_FEATURES]

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

def fetch_all_data():
    """Fetch training_features with extracted_at + scraped_videos + prediction_runs."""
    from supabase import create_client
    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        print('  ERROR: Missing Supabase credentials')
        sys.exit(1)
    sb = create_client(url, key)

    print('  Fetching training_features...')
    all_features = []
    offset = 0
    while True:
        resp = sb.table('training_features').select('*').range(offset, offset + 999).execute()
        if not resp.data: break
        all_features.extend(resp.data)
        if len(resp.data) < 1000: break
        offset += 1000
    print(f'  Got {len(all_features)} training_features rows')

    print('  Fetching scraped_videos with dps_score...')
    all_videos = []
    offset = 0
    while True:
        resp = sb.table('scraped_videos').select(
            'video_id, dps_score, niche'
        ).not_.is_('dps_score', 'null').range(offset, offset + 999).execute()
        if not resp.data: break
        all_videos.extend(resp.data)
        if len(resp.data) < 1000: break
        offset += 1000
    print(f'  Got {len(all_videos)} scraped_videos with dps_score')

    print('  Fetching labeled prediction_runs...')
    labeled_runs = []
    offset = 0
    while True:
        resp = sb.table('prediction_runs').select(
            'video_id, actual_dps'
        ).not_.is_('actual_dps', 'null').range(offset, offset + 999).execute()
        if not resp.data: break
        labeled_runs.extend(resp.data)
        if len(resp.data) < 1000: break
        offset += 1000

    actual_dps_map = {}
    for run in labeled_runs:
        vid = run.get('video_id')
        if vid and run.get('actual_dps') is not None:
            actual_dps_map[vid] = run['actual_dps']

    video_map = {v['video_id']: v for v in all_videos}
    rows = []
    for feat in all_features:
        vid = feat.get('video_id')
        if vid and vid in video_map:
            row = {**feat}
            if vid in actual_dps_map:
                row['dps_score'] = actual_dps_map[vid]
            else:
                row['dps_score'] = video_map[vid]['dps_score']
            row['niche_key'] = video_map[vid].get('niche', 'side-hustles')
            rows.append(row)

    return pd.DataFrame(rows)


def prepare_features(df, feature_list):
    present = [f for f in feature_list if f in df.columns]
    X = df[present].copy()
    for col in X.columns:
        if X[col].dtype == 'bool':
            X[col] = X[col].astype(float)
        elif X[col].dtype == 'object':
            X[col] = pd.to_numeric(X[col], errors='coerce')
        else:
            X[col] = X[col].astype(float)
    return X, present


def evaluate_model(y_true, y_pred):
    rho, p = spearmanr(y_true, y_pred)
    return {
        'spearman_rho': float(rho), 'spearman_p': float(p),
        'mae': float(mean_absolute_error(y_true, y_pred)),
        'rmse': float(np.sqrt(mean_squared_error(y_true, y_pred))),
        'r2': float(r2_score(y_true, y_pred)),
        'within_5_pct': float(np.mean(np.abs(y_true - y_pred) <= 5) * 100),
        'within_10_pct': float(np.mean(np.abs(y_true - y_pred) <= 10) * 100),
        'n': len(y_true),
    }


def optuna_tune(X_train, y_train, label=''):
    n_rows = len(X_train) if hasattr(X_train, '__len__') else X_train.shape[0]
    n_jobs = 1 if n_rows > 2000 else 2
    max_est = 500 if n_rows > 3000 else 1000
    max_depth = 8 if n_rows > 3000 else 10
    print(f'  Running Optuna (100 trials, n_jobs={n_jobs}) for {label}...')

    def objective(trial):
        params = {
            'objective': 'reg:squarederror', 'tree_method': 'hist',
            'random_state': RANDOM_STATE, 'n_jobs': n_jobs, 'verbosity': 0,
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
            'max_depth': trial.suggest_int('max_depth', 3, max_depth),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
            'reg_alpha': trial.suggest_float('reg_alpha', 0.0, 10.0),
            'reg_lambda': trial.suggest_float('reg_lambda', 0.0, 10.0),
            'n_estimators': trial.suggest_int('n_estimators', 100, max_est),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
        }
        kf = KFold(n_splits=N_CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
        X_np = X_train.values if hasattr(X_train, 'values') else X_train
        y_np = y_train if isinstance(y_train, np.ndarray) else y_train.values
        fold_rhos = []
        try:
            for ti, vi in kf.split(X_np):
                m = xgb.XGBRegressor(**params)
                m.fit(X_np[ti], y_np[ti])
                yp = np.clip(m.predict(X_np[vi]), 0, 100)
                rho, _ = spearmanr(y_np[vi], yp)
                fold_rhos.append(rho)
                del m
            gc.collect()
        except (xgb.core.XGBoostError, MemoryError, OSError) as e:
            print(f'    [OOM] trial {trial.number}: {e}')
            gc.collect()
            return float('-inf')
        return float(np.mean(fold_rhos))

    study = optuna.create_study(direction='maximize',
        sampler=optuna.samplers.TPESampler(seed=RANDOM_STATE))
    study.optimize(objective, n_trials=N_OPTUNA_TRIALS)

    print(f'  Optuna best: ρ={study.best_value:.4f} (trial {study.best_trial.number})')
    best = {
        'objective': 'reg:squarederror', 'tree_method': 'hist',
        'random_state': RANDOM_STATE, 'n_jobs': n_jobs, 'verbosity': 0,
        **study.best_params,
    }
    return best, study


def cross_validate(X, y, params):
    kf = KFold(n_splits=N_CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    X_np = X.values if hasattr(X, 'values') else X
    y_np = y if isinstance(y, np.ndarray) else y.values
    safe_params = {**params, 'n_jobs': 1 if len(X_np) > 2000 else params.get('n_jobs', 1)}
    folds = []
    for ti, vi in kf.split(X_np):
        m = xgb.XGBRegressor(**safe_params)
        m.fit(X_np[ti], y_np[ti])
        yp = np.clip(m.predict(X_np[vi]), 0, 100)
        rho, _ = spearmanr(y_np[vi], yp)
        mae = mean_absolute_error(y_np[vi], yp)
        folds.append({'spearman': rho, 'mae': mae})
        del m
    gc.collect()
    return folds


def stratified_holdout(df, n_holdout, random_state=RANDOM_STATE):
    """Create a stratified holdout by DPS tier."""
    df = df.copy()
    df['_tier'] = df['dps_score'].apply(classify_tier)
    tiers = df['_tier'].unique()
    per_tier = max(1, n_holdout // len(tiers))
    holdout_ids = []
    for tier in tiers:
        tier_df = df[df['_tier'] == tier]
        n = min(per_tier, len(tier_df))
        sampled = tier_df.sample(n=n, random_state=random_state)
        holdout_ids.extend(sampled['video_id'].tolist())
    remainder = n_holdout - len(holdout_ids)
    if remainder > 0:
        remaining = df[~df['video_id'].isin(holdout_ids)]
        extra = remaining.sample(n=min(remainder, len(remaining)), random_state=random_state)
        holdout_ids.extend(extra['video_id'].tolist())
    df.drop(columns=['_tier'], inplace=True)
    return set(holdout_ids)


def run_experiment(df_train, df_holdout, features, label):
    """Run a single experiment: Optuna tune, train, evaluate, return results."""
    print(f'\n{"="*70}')
    print(f'  EXPERIMENT {label}')
    print(f'  Train: {len(df_train)} | Holdout: {len(df_holdout)}')
    print(f'{"="*70}')

    X_train, present = prepare_features(df_train, features)
    X_holdout, _ = prepare_features(df_holdout, present)
    y_train = df_train['dps_score'].astype(float).values
    y_holdout = df_holdout['dps_score'].astype(float).values

    print(f'  Features present: {len(present)}/{len(features)}')
    print(f'  Target: mean={y_train.mean():.2f} std={y_train.std():.2f} min={y_train.min():.2f} max={y_train.max():.2f}')

    nan_count = X_train.isna().any(axis=1).sum()
    print(f'  Rows with any NaN: {nan_count}/{len(X_train)} ({nan_count/len(X_train)*100:.1f}%)')

    best_params, study = optuna_tune(X_train, y_train, label)

    safe_params = {**best_params, 'n_jobs': 1 if len(X_train) > 2000 else best_params.get('n_jobs', 1)}
    model = xgb.XGBRegressor(**safe_params)
    model.fit(X_train.values, y_train)

    y_pred_train = np.clip(model.predict(X_train.values), 0, 100)
    y_pred_holdout = np.clip(model.predict(X_holdout.values), 0, 100)

    metrics_train = evaluate_model(y_train, y_pred_train)
    metrics_holdout = evaluate_model(y_holdout, y_pred_holdout)

    cv_folds = cross_validate(X_train, y_train, best_params)
    cv_rho = float(np.mean([f['spearman'] for f in cv_folds]))
    cv_rho_std = float(np.std([f['spearman'] for f in cv_folds]))
    cv_mae = float(np.mean([f['mae'] for f in cv_folds]))

    importance = pd.DataFrame({
        'feature': present,
        'importance': model.feature_importances_,
    }).sort_values('importance', ascending=False)

    print(f'  Train  ρ={metrics_train["spearman_rho"]:.4f}  MAE={metrics_train["mae"]:.2f}')
    print(f'  Holdout ρ={metrics_holdout["spearman_rho"]:.4f}  MAE={metrics_holdout["mae"]:.2f}')
    print(f'  CV     ρ={cv_rho:.4f}±{cv_rho_std:.4f}  MAE={cv_mae:.2f}')
    print(f'  Top 10 features:')
    for i, (_, row) in enumerate(importance.head(10).iterrows()):
        print(f'    {i+1:2d}. {row["feature"]:<35s} {row["importance"]:.4f}')

    # Serialize params
    ser_params = {}
    for k, v in best_params.items():
        if isinstance(v, (np.integer,)): ser_params[k] = int(v)
        elif isinstance(v, (np.floating,)): ser_params[k] = float(v)
        else: ser_params[k] = v

    return {
        'model': model,
        'metrics_train': metrics_train,
        'metrics_holdout': metrics_holdout,
        'cv_rho': cv_rho, 'cv_rho_std': cv_rho_std, 'cv_mae': cv_mae,
        'importance': importance,
        'params': ser_params,
        'features': present,
        'train_rows': len(df_train),
        'holdout_rows': len(df_holdout),
        'study': study,
        'target_stats': {
            'mean': float(y_train.mean()), 'std': float(y_train.std()),
            'min': float(y_train.min()), 'max': float(y_train.max()),
        },
    }


def save_experiment(name, result, description):
    """Save model + metadata for a single experiment."""
    prefix = os.path.join(SANDBOX_DIR, f'xgboost-{name}')
    result['model'].save_model(f'{prefix}-model.json')
    with open(f'{prefix}-features.json', 'w') as f:
        json.dump(result['features'], f, indent=2)
    meta = {
        'model_version': name,
        'trained_at': datetime.now().isoformat(),
        'implementation': f'Python XGBoost {xgb.__version__}',
        'WARNING': 'SANDBOX ONLY',
        'description': description,
        'feature_count': len(result['features']),
        'dataset': {
            'train_rows': result['train_rows'],
            'holdout_rows': result['holdout_rows'],
        },
        'target_stats': result['target_stats'],
        'performance': {
            'train': result['metrics_train'],
            'holdout': result['metrics_holdout'],
            'cv_5fold': {
                'spearman_mean': result['cv_rho'],
                'spearman_std': result['cv_rho_std'],
                'mae_mean': result['cv_mae'],
            },
        },
        'hyperparameters': result['params'],
        'top_features': [
            {'feature': row['feature'], 'importance': float(row['importance'])}
            for _, row in result['importance'].head(15).iterrows()
        ],
    }
    with open(f'{prefix}-metadata.json', 'w') as f:
        json.dump(meta, f, indent=2)
    print(f'  Saved: {prefix}-model.json, -metadata.json, -features.json')


def main():
    print('='*70)
    print('  v14 SANDBOX EXPERIMENTS A/B/C/D')
    print('  All use v13 fixes: real XGBoost, NaN native, Optuna 100 trials')
    print('='*70)
    print(f'  XGBoost: {xgb.__version__} | Optuna: {optuna.__version__}')

    load_env()
    df_all = fetch_all_data()
    df_all = df_all[df_all['niche_key'] == 'side-hustles'].dropna(subset=['dps_score'])
    print(f'\n  Total side-hustles with DPS: {len(df_all)}')

    # Identify original 963 rows (extracted Mar 13-14, 2026)
    df_all['_extracted_at'] = pd.to_datetime(df_all['extracted_at'], utc=True, errors='coerce')
    cutoff = pd.Timestamp('2026-03-15', tz='UTC')
    original_ids = set(df_all[df_all['_extracted_at'] < cutoff]['video_id'])
    print(f'  Original rows (Mar 13-14): {len(original_ids)}')
    print(f'  [debug] about to read v10 metadata...')
    v10_meta_path = os.path.join(MODELS_DIR, 'xgboost-v10-metadata.json')
    print(f'  [debug] v10 path: {v10_meta_path}, exists: {os.path.exists(v10_meta_path)}')
    with open(v10_meta_path) as f:
        v10_meta = json.load(f)
    print(f'  [debug] v10 meta loaded, keys: {list(v10_meta.keys())}')
    v10_cv = v10_meta['performance']['cv_5fold']['spearman_mean']
    v10_holdout = v10_meta['performance']['holdout']['spearman_rho']
    print(f'  v10 baseline: CV ρ={v10_cv:.4f}, holdout ρ={v10_holdout:.4f} (N=813, holdout=50)')

    os.makedirs(SANDBOX_DIR, exist_ok=True)
    results = {}

    print(f'  Memory check: df_all shape={df_all.shape}, memory={df_all.memory_usage(deep=True).sum()/1024/1024:.1f} MB')

    # Check which experiments already completed (resume support)
    skip_a = os.path.exists(os.path.join(SANDBOX_DIR, 'xgboost-v14a-sandbox-metadata.json'))
    skip_b = os.path.exists(os.path.join(SANDBOX_DIR, 'xgboost-v14b-sandbox-metadata.json'))
    skip_c = os.path.exists(os.path.join(SANDBOX_DIR, 'xgboost-v14c-sandbox-metadata.json'))
    skip_d = os.path.exists(os.path.join(SANDBOX_DIR, 'xgboost-v14d-sandbox-metadata.json'))

    # ══════════════════════════════════════════════════════════════════
    # EXPERIMENT A: Original 963, new random 50-holdout, Optuna retuned
    # ══════════════════════════════════════════════════════════════════
    df_orig = df_all[df_all['video_id'].isin(original_ids)].copy()
    holdout_a_ids = stratified_holdout(df_orig, 50, random_state=RANDOM_STATE)
    df_train_a = df_orig[~df_orig['video_id'].isin(holdout_a_ids)]
    df_holdout_a = df_orig[df_orig['video_id'].isin(holdout_a_ids)]
    if skip_a:
        print('\n  EXPERIMENT A: SKIPPED (already completed)')
        with open(os.path.join(SANDBOX_DIR, 'xgboost-v14a-sandbox-metadata.json')) as f:
            meta_a = json.load(f)
        results['A'] = {
            'cv_rho': meta_a['performance']['cv_5fold']['spearman_mean'],
            'cv_rho_std': meta_a['performance']['cv_5fold']['spearman_std'],
            'cv_mae': meta_a['performance']['cv_5fold']['mae_mean'],
            'metrics_holdout': meta_a['performance']['holdout'],
            'metrics_train': meta_a['performance']['train'],
            'train_rows': meta_a['dataset']['train_rows'],
            'holdout_rows': meta_a['dataset']['holdout_rows'],
            'params': meta_a['hyperparameters'],
            'features': [f['feature'] for f in meta_a['top_features']],
            'importance': pd.DataFrame(meta_a['top_features']),
            'target_stats': meta_a['target_stats'],
        }
    else:
        results['A'] = run_experiment(df_train_a, df_holdout_a, FEATURES,
            'A: Original 963, new holdout, Optuna retuned')
        save_experiment('v14a-sandbox', results['A'],
            'Original 963 rows with v13 fixes (Optuna retuned, NaN native)')

    # ══════════════════════════════════════════════════════════════════
    # EXPERIMENT B: 963 + high-quality rows (90%+ feature fill)
    # ══════════════════════════════════════════════════════════════════
    n_features = len(FEATURES)
    threshold_90 = int(n_features * 0.90)  # 52 of 58 features non-null
    newer_rows = df_all[~df_all['video_id'].isin(original_ids)].copy()

    present_cols = [f for f in FEATURES if f in newer_rows.columns]
    newer_rows['_fill_count'] = newer_rows[present_cols].notna().sum(axis=1)
    high_quality = newer_rows[newer_rows['_fill_count'] >= threshold_90]
    print(f'\n  Exp B: {len(high_quality)} newer rows have 90%+ fill ({threshold_90}+ of {n_features} features)')

    df_b_pool = pd.concat([df_orig, high_quality[df_orig.columns]], ignore_index=True)
    holdout_b_ids = stratified_holdout(df_b_pool, 50, random_state=RANDOM_STATE + 1)
    df_train_b = df_b_pool[~df_b_pool['video_id'].isin(holdout_b_ids)]
    df_holdout_b = df_b_pool[df_b_pool['video_id'].isin(holdout_b_ids)]
    if skip_b:
        print(f'\n  EXPERIMENT B: SKIPPED (already completed)')
        with open(os.path.join(SANDBOX_DIR, 'xgboost-v14b-sandbox-metadata.json')) as f:
            meta_b = json.load(f)
        results['B'] = {
            'cv_rho': meta_b['performance']['cv_5fold']['spearman_mean'],
            'cv_rho_std': meta_b['performance']['cv_5fold']['spearman_std'],
            'cv_mae': meta_b['performance']['cv_5fold']['mae_mean'],
            'metrics_holdout': meta_b['performance']['holdout'],
            'metrics_train': meta_b['performance']['train'],
            'train_rows': meta_b['dataset']['train_rows'],
            'holdout_rows': meta_b['dataset']['holdout_rows'],
            'params': meta_b['hyperparameters'],
            'features': [f['feature'] for f in meta_b['top_features']],
            'importance': pd.DataFrame(meta_b['top_features']),
            'target_stats': meta_b['target_stats'],
        }
    else:
        results['B'] = run_experiment(df_train_b, df_holdout_b, FEATURES,
            f'B: 963 + {len(high_quality)} high-fill rows = {len(df_b_pool)}')
        save_experiment('v14b-sandbox', results['B'],
            f'963 original + {len(high_quality)} rows with 90%+ feature fill')

    # ══════════════════════════════════════════════════════════════════
    # EXPERIMENT C: Full 6679, new 200-video stratified holdout
    # ══════════════════════════════════════════════════════════════════
    holdout_c_ids = stratified_holdout(df_all, 200, random_state=RANDOM_STATE + 2)
    df_train_c = df_all[~df_all['video_id'].isin(holdout_c_ids)]
    df_holdout_c = df_all[df_all['video_id'].isin(holdout_c_ids)]
    if skip_c:
        print(f'\n  EXPERIMENT C: SKIPPED (already completed)')
        with open(os.path.join(SANDBOX_DIR, 'xgboost-v14c-sandbox-metadata.json')) as f:
            meta_c = json.load(f)
        results['C'] = {
            'cv_rho': meta_c['performance']['cv_5fold']['spearman_mean'],
            'cv_rho_std': meta_c['performance']['cv_5fold']['spearman_std'],
            'cv_mae': meta_c['performance']['cv_5fold']['mae_mean'],
            'metrics_holdout': meta_c['performance']['holdout'],
            'metrics_train': meta_c['performance']['train'],
            'train_rows': meta_c['dataset']['train_rows'],
            'holdout_rows': meta_c['dataset']['holdout_rows'],
            'params': meta_c['hyperparameters'],
            'features': [f['feature'] for f in meta_c['top_features']],
            'importance': pd.DataFrame(meta_c['top_features']),
            'target_stats': meta_c['target_stats'],
        }
    else:
        results['C'] = run_experiment(df_train_c, df_holdout_c, FEATURES,
            f'C: Full {len(df_all)}, 200-video stratified holdout')
        save_experiment('v14c-sandbox', results['C'],
            f'Full {len(df_all)} rows, new 200-video stratified holdout')

    # ══════════════════════════════════════════════════════════════════
    # EXPERIMENT D: Full 6679 minus outliers (DPS < 5 or > 99)
    # ══════════════════════════════════════════════════════════════════
    df_filtered = df_all[(df_all['dps_score'] >= 5) & (df_all['dps_score'] <= 99)].copy()
    removed = len(df_all) - len(df_filtered)
    print(f'\n  Exp D: Removed {removed} outliers (DPS < 5 or > 99), {len(df_filtered)} remain')

    holdout_d_ids = stratified_holdout(df_filtered, 200, random_state=RANDOM_STATE + 3)
    df_train_d = df_filtered[~df_filtered['video_id'].isin(holdout_d_ids)]
    df_holdout_d = df_filtered[df_filtered['video_id'].isin(holdout_d_ids)]
    if skip_d:
        print(f'\n  EXPERIMENT D: SKIPPED (already completed)')
        with open(os.path.join(SANDBOX_DIR, 'xgboost-v14d-sandbox-metadata.json')) as f:
            meta_d = json.load(f)
        results['D'] = {
            'cv_rho': meta_d['performance']['cv_5fold']['spearman_mean'],
            'cv_rho_std': meta_d['performance']['cv_5fold']['spearman_std'],
            'cv_mae': meta_d['performance']['cv_5fold']['mae_mean'],
            'metrics_holdout': meta_d['performance']['holdout'],
            'metrics_train': meta_d['performance']['train'],
            'train_rows': meta_d['dataset']['train_rows'],
            'holdout_rows': meta_d['dataset']['holdout_rows'],
            'params': meta_d['hyperparameters'],
            'features': [f['feature'] for f in meta_d['top_features']],
            'importance': pd.DataFrame(meta_d['top_features']),
            'target_stats': meta_d['target_stats'],
        }
    else:
        results['D'] = run_experiment(df_train_d, df_holdout_d, FEATURES,
            f'D: {len(df_filtered)} (outliers removed), 200-holdout')
        save_experiment('v14d-sandbox', results['D'],
            f'{len(df_filtered)} rows after removing DPS outliers (<5 or >99)')

    # ══════════════════════════════════════════════════════════════════
    # COMPARISON TABLE
    # ══════════════════════════════════════════════════════════════════
    print('\n' + '='*70)
    print('  FULL COMPARISON — ALL EXPERIMENTS vs v10 BASELINE')
    print('='*70)

    header = f'  {"Exp":<6s} {"Train":<8s} {"Hold":<6s} {"CV ρ":<14s} {"Holdout ρ":<12s} {"Δ CV vs v10":<14s} {"Δ Hold vs v10":<14s}'
    print(header)
    print(f'  {"-"*74}')
    print(f'  {"v10":<6s} {"813":<8s} {"50":<6s} {v10_cv:<14.4f} {v10_holdout:<12.4f} {"—":<14s} {"—":<14s}')

    for exp_name in ['A', 'B', 'C', 'D']:
        r = results[exp_name]
        dcv = r['cv_rho'] - v10_cv
        dho = r['metrics_holdout']['spearman_rho'] - v10_holdout
        print(f'  {exp_name:<6s} {r["train_rows"]:<8d} {r["holdout_rows"]:<6d} '
              f'{r["cv_rho"]:.4f}±{r["cv_rho_std"]:.4f} '
              f'{r["metrics_holdout"]["spearman_rho"]:<12.4f} '
              f'{dcv:+.4f}       {dho:+.4f}')

    # Save combined report
    report_path = os.path.join(SANDBOX_DIR, 'v14-experiments-report.json')
    report = {
        'generated_at': datetime.now().isoformat(),
        'v10_baseline': {'cv_spearman': v10_cv, 'holdout_spearman': v10_holdout, 'train_rows': 813},
    }
    for exp_name in ['A', 'B', 'C', 'D']:
        r = results[exp_name]
        report[f'experiment_{exp_name}'] = {
            'train_rows': r['train_rows'],
            'holdout_rows': r['holdout_rows'],
            'cv_spearman': r['cv_rho'],
            'cv_spearman_std': r['cv_rho_std'],
            'holdout_spearman': r['metrics_holdout']['spearman_rho'],
            'holdout_mae': r['metrics_holdout']['mae'],
            'delta_cv_vs_v10': r['cv_rho'] - v10_cv,
            'delta_holdout_vs_v10': r['metrics_holdout']['spearman_rho'] - v10_holdout,
            'hyperparameters': r['params'],
            'top_10_features': [
                {'feature': row['feature'], 'importance': float(row['importance'])}
                for _, row in r['importance'].head(10).iterrows()
            ],
            'target_stats': r['target_stats'],
        }
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    print(f'\n  Combined report: {report_path}')

    print('\n' + '='*70)
    print('  ALL 4 EXPERIMENTS COMPLETE — v10 production is untouched')
    print('='*70)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'\n  FATAL ERROR: {type(e).__name__}: {e}')
        import traceback
        print(traceback.format_exc())
