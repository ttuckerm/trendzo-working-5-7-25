#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v14-sandbox: XGBoost retrain on CLEANED training data only.

Uses training_eligible=true rows from training_features.
Real XGBoost, NaN native handling, Optuna 100 trials, 200-video stratified holdout.
Compares against v10 baseline.

SANDBOX ONLY — does NOT touch production.
"""

import sys, os, json, gc
import functools
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold
from scipy.stats import spearmanr
import xgboost as xgb
import optuna
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SANDBOX_DIR = os.path.join(PROJECT_ROOT, 'data', 'sandbox')
MODELS_DIR = os.path.join(PROJECT_ROOT, 'models')
LOG_PATH = os.path.join(SANDBOX_DIR, 'v14-clean-log.txt')
os.makedirs(SANDBOX_DIR, exist_ok=True)

_log_file = open(LOG_PATH, 'w', encoding='utf-8')
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

V10_FEATURES = [
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
    'text_flesch_reading_ease', 'text_has_cta', 'text_negative_word_count',
    'text_emoji_count',
    'meta_duration_seconds', 'meta_words_per_second',
    'text_overlay_density', 'visual_proof_ratio', 'vocal_confidence_composite',
    'creator_followers_log', 'post_hour_utc', 'post_day_of_week',
    'specificity_score', 'instructional_density', 'has_step_structure', 'hedge_word_density',
]

EXCLUDED_FEATURES = {
    'speaking_rate_wpm_variance', 'speaking_rate_wpm_acceleration',
    'speaking_rate_wpm_peak_count', 'speaking_rate_wpm_fast_segments',
    'speaking_rate_wpm_slow_segments', 'visual_to_verbal_ratio',
}

FEATURES = [f for f in V10_FEATURES if f not in EXCLUDED_FEATURES]


def load_env():
    env_path = os.path.join(PROJECT_ROOT, '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()


def classify_tier(dps):
    if dps >= 90: return 'mega-viral'
    if dps >= 70: return 'viral'
    if dps >= 60: return 'good'
    if dps >= 40: return 'average'
    return 'low'


def paginated_fetch(sb, table, select_str, extra_filter=None):
    all_rows = []
    offset = 0
    while True:
        q = sb.table(table).select(select_str).range(offset, offset + 999)
        if extra_filter:
            q = extra_filter(q)
        resp = q.execute()
        if not resp.data:
            break
        all_rows.extend(resp.data)
        if len(resp.data) < 1000:
            break
        offset += 1000
    return all_rows


def fetch_eligible_data(sb):
    """Fetch ONLY training_eligible=true rows, joined with DPS scores."""
    print('  Fetching eligible training_features...')
    tf_rows = paginated_fetch(sb, 'training_features', '*',
        extra_filter=lambda q: q.eq('training_eligible', True))
    print(f'  Got {len(tf_rows)} eligible rows')

    print('  Fetching scraped_videos with dps_score...')
    sv_rows = paginated_fetch(sb, 'scraped_videos',
        'video_id, dps_score, niche, creator_followers_count')
    sv_map = {r['video_id']: r for r in sv_rows}
    print(f'  Got {len(sv_rows)} scraped_videos')

    rows = []
    for feat in tf_rows:
        vid = feat.get('video_id')
        sv = sv_map.get(vid)
        if sv and sv.get('dps_score') is not None:
            row = {**feat}
            row['dps_score'] = float(sv['dps_score'])
            row['niche_key'] = sv.get('niche', 'side-hustles')
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


def stratified_holdout(df, n_holdout, random_state=RANDOM_STATE):
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
    return set(holdout_ids)


def optuna_tune(X_train, y_train, label=''):
    n_rows = X_train.shape[0]
    n_jobs = 1 if n_rows > 2000 else 2
    max_est = 500 if n_rows > 3000 else 1000
    max_depth = 8 if n_rows > 3000 else 10
    print(f'  Running Optuna ({N_OPTUNA_TRIALS} trials, n_jobs={n_jobs}) for {label}...')

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
        X_np = X_train.values
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

    print(f'  Optuna best: rho={study.best_value:.4f} (trial {study.best_trial.number})')
    best = {
        'objective': 'reg:squarederror', 'tree_method': 'hist',
        'random_state': RANDOM_STATE, 'n_jobs': n_jobs, 'verbosity': 0,
        **study.best_params,
    }
    return best, study


def cross_validate(X, y, params):
    kf = KFold(n_splits=N_CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    X_np = X.values
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


def main():
    print('=' * 70)
    print('  v14-sandbox: CLEANED DATA RETRAIN')
    print(f'  {datetime.now().isoformat()}')
    print(f'  XGBoost {xgb.__version__} | Optuna {optuna.__version__}')
    print('=' * 70)

    load_env()
    from supabase import create_client
    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        print('ERROR: Missing Supabase credentials')
        sys.exit(1)
    sb = create_client(url, key)

    # Load v10 baseline
    v10_path = os.path.join(MODELS_DIR, 'xgboost-v10-metadata.json')
    with open(v10_path) as f:
        v10_meta = json.load(f)
    v10_cv = v10_meta['performance']['cv_5fold']['spearman_mean']
    v10_holdout = v10_meta['performance']['holdout']['spearman_rho']
    v10_mae = v10_meta['performance']['holdout']['mae']
    print(f'\n  v10 baseline: CV rho={v10_cv:.4f}, holdout rho={v10_holdout:.4f}, MAE={v10_mae:.2f} (N=813, holdout=50)')

    # Fetch eligible data
    df_all = fetch_eligible_data(sb)
    df_all = df_all[df_all['niche_key'] == 'side-hustles'].dropna(subset=['dps_score'])
    print(f'\n  Eligible side-hustles with DPS: {len(df_all)}')

    if len(df_all) < 100:
        print(f'  ERROR: Only {len(df_all)} eligible rows — need at least 100 for meaningful training')
        sys.exit(1)

    # Target stats
    y_all = df_all['dps_score'].astype(float)
    print(f'  Target: mean={y_all.mean():.2f} median={y_all.median():.2f} std={y_all.std():.2f} min={y_all.min():.2f} max={y_all.max():.2f}')

    # Feature fill rate check
    present = [f for f in FEATURES if f in df_all.columns]
    fill_rates = {}
    for col in present:
        rate = df_all[col].notna().mean() * 100
        fill_rates[col] = rate
    avg_fill = np.mean(list(fill_rates.values()))
    print(f'  Features present: {len(present)}/{len(FEATURES)}')
    print(f'  Average fill rate: {avg_fill:.1f}%')
    low_fill = {k: v for k, v in fill_rates.items() if v < 50}
    if low_fill:
        print(f'  Low fill features (<50%):')
        for k, v in sorted(low_fill.items(), key=lambda x: x[1]):
            print(f'    {k}: {v:.1f}%')

    # Create 200-video stratified holdout
    holdout_ids = stratified_holdout(df_all, 200, random_state=RANDOM_STATE)
    df_train = df_all[~df_all['video_id'].isin(holdout_ids)]
    df_holdout = df_all[df_all['video_id'].isin(holdout_ids)]

    print(f'\n  Train: {len(df_train)} rows')
    print(f'  Holdout: {len(df_holdout)} rows (stratified by DPS tier)')

    # Holdout tier balance
    holdout_tiers = df_holdout['dps_score'].apply(classify_tier).value_counts()
    print(f'  Holdout tier balance:')
    for tier, count in holdout_tiers.items():
        print(f'    {tier}: {count}')

    # ── Prepare features ──
    X_train, used_features = prepare_features(df_train, FEATURES)
    X_holdout, _ = prepare_features(df_holdout, used_features)
    y_train = df_train['dps_score'].astype(float).values
    y_holdout = df_holdout['dps_score'].astype(float).values

    nan_count = X_train.isna().any(axis=1).sum()
    print(f'\n  Train rows with any NaN: {nan_count}/{len(X_train)} ({nan_count/len(X_train)*100:.1f}%)')

    # ── Optuna hyperparameter tuning ──
    best_params, study = optuna_tune(X_train, y_train, 'v14-clean')

    # ── Train final model ──
    safe_params = {**best_params, 'n_jobs': 1 if len(X_train) > 2000 else best_params.get('n_jobs', 1)}
    model = xgb.XGBRegressor(**safe_params)
    model.fit(X_train.values, y_train)

    # ── Evaluate ──
    y_pred_train = np.clip(model.predict(X_train.values), 0, 100)
    y_pred_holdout = np.clip(model.predict(X_holdout.values), 0, 100)

    metrics_train = evaluate_model(y_train, y_pred_train)
    metrics_holdout = evaluate_model(y_holdout, y_pred_holdout)

    # ── 5-fold CV ──
    cv_folds = cross_validate(X_train, y_train, best_params)
    cv_rho = float(np.mean([f['spearman'] for f in cv_folds]))
    cv_rho_std = float(np.std([f['spearman'] for f in cv_folds]))
    cv_mae = float(np.mean([f['mae'] for f in cv_folds]))

    # ── Feature importance ──
    importance = pd.DataFrame({
        'feature': used_features,
        'importance': model.feature_importances_,
    }).sort_values('importance', ascending=False)

    # ── Print results ──
    print('\n' + '=' * 70)
    print('  RESULTS: v14-sandbox (cleaned data)')
    print('=' * 70)
    print(f'  Train  rho={metrics_train["spearman_rho"]:.4f}  MAE={metrics_train["mae"]:.2f}  R2={metrics_train["r2"]:.4f}')
    print(f'  Holdout rho={metrics_holdout["spearman_rho"]:.4f}  MAE={metrics_holdout["mae"]:.2f}  R2={metrics_holdout["r2"]:.4f}')
    print(f'  CV     rho={cv_rho:.4f}+/-{cv_rho_std:.4f}  MAE={cv_mae:.2f}')
    print(f'  Within 5 DPS: {metrics_holdout["within_5_pct"]:.1f}% | Within 10 DPS: {metrics_holdout["within_10_pct"]:.1f}%')

    print(f'\n  Top 15 features:')
    for i, (_, row) in enumerate(importance.head(15).iterrows()):
        print(f'    {i+1:2d}. {row["feature"]:<35s} {row["importance"]:.4f}')

    # ── Comparison table ──
    print('\n' + '=' * 70)
    print('  COMPARISON: v14-sandbox vs v10 baseline')
    print('=' * 70)
    print(f'  {"Metric":<25s} {"v10":>12s} {"v14-clean":>12s} {"Delta":>10s}')
    print(f'  {"-"*25} {"-"*12} {"-"*12} {"-"*10}')
    print(f'  {"Train rows":<25s} {813:>12d} {len(df_train):>12d} {len(df_train)-813:>+10d}')
    print(f'  {"Holdout rows":<25s} {50:>12d} {len(df_holdout):>12d} {len(df_holdout)-50:>+10d}')
    print(f'  {"CV rho":<25s} {v10_cv:>12.4f} {cv_rho:>12.4f} {cv_rho-v10_cv:>+10.4f}')
    print(f'  {"Holdout rho":<25s} {v10_holdout:>12.4f} {metrics_holdout["spearman_rho"]:>12.4f} {metrics_holdout["spearman_rho"]-v10_holdout:>+10.4f}')
    print(f'  {"Holdout MAE":<25s} {v10_mae:>12.2f} {metrics_holdout["mae"]:>12.2f} {metrics_holdout["mae"]-v10_mae:>+10.2f}')
    print(f'  {"Holdout R2":<25s} {v10_meta["performance"]["holdout"]["r2"]:>12.4f} {metrics_holdout["r2"]:>12.4f} {metrics_holdout["r2"]-v10_meta["performance"]["holdout"]["r2"]:>+10.4f}')

    dcv = cv_rho - v10_cv
    dho = metrics_holdout['spearman_rho'] - v10_holdout
    verdict = 'IMPROVED' if dcv > 0.005 and dho > 0 else 'DEGRADED' if dcv < -0.005 else 'NEUTRAL'
    print(f'\n  VERDICT: {verdict} (dCV={dcv:+.4f}, dHoldout={dho:+.4f})')

    # ── Save artifacts ──
    prefix = os.path.join(SANDBOX_DIR, 'xgboost-v14-clean-sandbox')
    model.save_model(f'{prefix}-model.json')
    with open(f'{prefix}-features.json', 'w') as f:
        json.dump(used_features, f, indent=2)

    ser_params = {}
    for k, v in best_params.items():
        if isinstance(v, (np.integer,)): ser_params[k] = int(v)
        elif isinstance(v, (np.floating,)): ser_params[k] = float(v)
        else: ser_params[k] = v

    meta = {
        'model_version': 'v14-clean-sandbox',
        'trained_at': datetime.now().isoformat(),
        'implementation': f'Python XGBoost {xgb.__version__}',
        'WARNING': 'SANDBOX ONLY — DO NOT DEPLOY',
        'description': 'Retrained on cleaned training data (3 filters: no-video, sub-1K followers, low fill rate)',
        'cleaning_filters': {
            'filter_1': 'ffmpeg_resolution_height IS NULL (failed video analysis)',
            'filter_2': 'scraped_videos.creator_followers_count < 1000',
            'filter_3': '>=20% of 58 core features NULL',
        },
        'feature_count': len(used_features),
        'feature_names': used_features,
        'dataset': {
            'total_eligible': len(df_all),
            'train_rows': len(df_train),
            'holdout_rows': len(df_holdout),
            'holdout_method': '200-video stratified by DPS tier',
            'avg_fill_rate': avg_fill,
        },
        'target_stats': {
            'mean': float(y_train.mean()), 'std': float(y_train.std()),
            'min': float(y_train.min()), 'max': float(y_train.max()),
            'median': float(np.median(y_train)),
        },
        'performance': {
            'train': metrics_train,
            'holdout': metrics_holdout,
            'cv_5fold': {
                'spearman_mean': cv_rho, 'spearman_std': cv_rho_std,
                'mae_mean': cv_mae,
                'per_fold': cv_folds,
            },
        },
        'comparison_vs_v10': {
            'v10_cv_spearman': v10_cv,
            'v10_holdout_spearman': v10_holdout,
            'delta_cv': cv_rho - v10_cv,
            'delta_holdout': metrics_holdout['spearman_rho'] - v10_holdout,
            'verdict': verdict,
        },
        'hyperparameters': ser_params,
        'top_features': [
            {'feature': row['feature'], 'importance': float(row['importance'])}
            for _, row in importance.head(20).iterrows()
        ],
    }
    with open(f'{prefix}-metadata.json', 'w') as f:
        json.dump(meta, f, indent=2)

    # Save holdout IDs for reproducibility
    with open(f'{prefix}-holdout-ids.json', 'w') as f:
        json.dump(list(holdout_ids), f)

    print(f'\n  Saved: {prefix}-model.json')
    print(f'         {prefix}-metadata.json')
    print(f'         {prefix}-features.json')
    print(f'         {prefix}-holdout-ids.json')
    print(f'  Log:   {LOG_PATH}')

    print('\n' + '=' * 70)
    print('  v14-sandbox COMPLETE — production v10 is untouched')
    print('=' * 70)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'\nFATAL ERROR: {type(e).__name__}: {e}')
        import traceback
        print(traceback.format_exc())
