# -*- coding: utf-8 -*-
"""Run a single v14 experiment by name (A/B/C/D). Much simpler than the unified script."""

import sys, os, json, gc
import numpy as np

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SANDBOX_DIR = os.path.join(PROJECT_ROOT, 'data', 'sandbox')
MODELS_DIR = os.path.join(PROJECT_ROOT, 'models')
os.makedirs(SANDBOX_DIR, exist_ok=True)

LOG = os.path.join(SANDBOX_DIR, f'exp-{sys.argv[1] if len(sys.argv) > 1 else "X"}-log.txt')
_lf = open(LOG, 'w', encoding='utf-8')

# Redirect stderr to log file to prevent broken pipe crashes
sys.stderr = open(os.path.join(SANDBOX_DIR, f'exp-{sys.argv[1] if len(sys.argv) > 1 else "X"}-stderr.txt'), 'w', encoding='utf-8')

def log(msg):
    _lf.write(msg + '\n')
    _lf.flush()
    os.fsync(_lf.fileno())
    try:
        sys.stdout.write(msg + '\n')
        sys.stdout.flush()
    except:
        pass

RANDOM_STATE = 42

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


def main():
    exp = sys.argv[1].upper() if len(sys.argv) > 1 else None
    if exp not in ('A', 'B', 'C', 'D'):
        log(f'Usage: python run-one-experiment.py [A|B|C|D]')
        return

    log(f'=== EXPERIMENT {exp} ===')

    import time as _time

    log('Importing pandas...')
    import pandas as pd
    log(f'  pandas {pd.__version__}')

    log('Importing xgboost...')
    import xgboost as xgb
    log(f'  xgboost {xgb.__version__}')

    log('Importing sklearn...')
    from sklearn.model_selection import KFold
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    log('  sklearn OK')

    log('Importing scipy...')
    from scipy.stats import spearmanr
    log('  scipy OK')

    log('Importing optuna...')
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    log(f'  optuna {optuna.__version__}')

    log('All imports done.')

    log('Loading env...')
    env_path = os.path.join(PROJECT_ROOT, '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()

    log('Connecting to Supabase...')
    from supabase import create_client
    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    sb = create_client(url, key)

    log('Fetching training_features...')
    all_features = []
    offset = 0
    while True:
        resp = sb.table('training_features').select('*').range(offset, offset + 999).execute()
        if not resp.data: break
        all_features.extend(resp.data)
        if len(resp.data) < 1000: break
        offset += 1000
    log(f'Got {len(all_features)} training_features')

    log('Fetching scraped_videos...')
    all_videos = []
    offset = 0
    while True:
        resp = sb.table('scraped_videos').select('video_id, dps_score, niche').not_.is_('dps_score', 'null').range(offset, offset + 999).execute()
        if not resp.data: break
        all_videos.extend(resp.data)
        if len(resp.data) < 1000: break
        offset += 1000
    log(f'Got {len(all_videos)} scraped_videos')

    log('Fetching labeled prediction_runs...')
    labeled_runs = []
    offset = 0
    while True:
        resp = sb.table('prediction_runs').select('video_id, actual_dps').not_.is_('actual_dps', 'null').range(offset, offset + 999).execute()
        if not resp.data: break
        labeled_runs.extend(resp.data)
        if len(resp.data) < 1000: break
        offset += 1000

    actual_dps_map = {r['video_id']: r['actual_dps'] for r in labeled_runs if r.get('video_id') and r.get('actual_dps') is not None}
    video_map = {v['video_id']: v for v in all_videos}

    rows = []
    for feat in all_features:
        vid = feat.get('video_id')
        if vid and vid in video_map:
            row = {**feat}
            row['dps_score'] = actual_dps_map.get(vid, video_map[vid]['dps_score'])
            row['niche_key'] = video_map[vid].get('niche', 'side-hustles')
            rows.append(row)

    df_all = pd.DataFrame(rows)
    df_all = df_all[df_all['niche_key'] == 'side-hustles'].dropna(subset=['dps_score'])
    log(f'Total side-hustles: {len(df_all)}')

    df_all['_extracted_at'] = pd.to_datetime(df_all['extracted_at'], utc=True, errors='coerce')
    cutoff = pd.Timestamp('2026-03-15', tz='UTC')
    original_ids = set(df_all[df_all['_extracted_at'] < cutoff]['video_id'])
    log(f'Original rows (Mar 13-14): {len(original_ids)}')

    # Prepare data based on experiment
    def stratified_holdout(df, n, seed):
        df = df.copy()
        df['_tier'] = df['dps_score'].apply(classify_tier)
        tiers = df['_tier'].unique()
        per_tier = max(1, n // len(tiers))
        hids = []
        for t in tiers:
            tdf = df[df['_tier'] == t]
            s = tdf.sample(n=min(per_tier, len(tdf)), random_state=seed)
            hids.extend(s['video_id'].tolist())
        rem = n - len(hids)
        if rem > 0:
            rest = df[~df['video_id'].isin(hids)]
            extra = rest.sample(n=min(rem, len(rest)), random_state=seed)
            hids.extend(extra['video_id'].tolist())
        return set(hids)

    df_orig = df_all[df_all['video_id'].isin(original_ids)].copy()

    if exp == 'A':
        holdout_ids = stratified_holdout(df_orig, 50, RANDOM_STATE)
        df_train = df_orig[~df_orig['video_id'].isin(holdout_ids)]
        df_holdout = df_orig[df_orig['video_id'].isin(holdout_ids)]
        desc = 'Original 963 rows with v13 fixes'

    elif exp == 'B':
        n_features = len(FEATURES)
        threshold = int(n_features * 0.90)
        newer = df_all[~df_all['video_id'].isin(original_ids)].copy()
        pcols = [f for f in FEATURES if f in newer.columns]
        newer['_fill'] = newer[pcols].notna().sum(axis=1)
        hq = newer[newer['_fill'] >= threshold]
        log(f'High-quality newer rows (90%+ fill): {len(hq)}')
        pool = pd.concat([df_orig, hq[df_orig.columns]], ignore_index=True)
        holdout_ids = stratified_holdout(pool, 50, RANDOM_STATE + 1)
        df_train = pool[~pool['video_id'].isin(holdout_ids)]
        df_holdout = pool[pool['video_id'].isin(holdout_ids)]
        desc = f'963 + {len(hq)} high-fill rows'

    elif exp == 'C':
        holdout_ids = stratified_holdout(df_all, 200, RANDOM_STATE + 2)
        df_train = df_all[~df_all['video_id'].isin(holdout_ids)]
        df_holdout = df_all[df_all['video_id'].isin(holdout_ids)]
        desc = f'Full {len(df_all)}, 200-video stratified holdout'

    elif exp == 'D':
        filtered = df_all[(df_all['dps_score'] >= 5) & (df_all['dps_score'] <= 99)].copy()
        removed = len(df_all) - len(filtered)
        log(f'Removed {removed} outliers, {len(filtered)} remain')
        holdout_ids = stratified_holdout(filtered, 200, RANDOM_STATE + 3)
        df_train = filtered[~filtered['video_id'].isin(holdout_ids)]
        df_holdout = filtered[filtered['video_id'].isin(holdout_ids)]
        desc = f'{len(filtered)} rows after removing outliers'

    log(f'Train: {len(df_train)}, Holdout: {len(df_holdout)}')

    # Prepare features
    present = [f for f in FEATURES if f in df_train.columns]
    X_train = df_train[present].copy()
    for col in X_train.columns:
        if X_train[col].dtype == 'bool': X_train[col] = X_train[col].astype(float)
        elif X_train[col].dtype == 'object': X_train[col] = pd.to_numeric(X_train[col], errors='coerce')
        else: X_train[col] = X_train[col].astype(float)

    X_holdout = df_holdout[present].copy()
    for col in X_holdout.columns:
        if X_holdout[col].dtype == 'bool': X_holdout[col] = X_holdout[col].astype(float)
        elif X_holdout[col].dtype == 'object': X_holdout[col] = pd.to_numeric(X_holdout[col], errors='coerce')
        else: X_holdout[col] = X_holdout[col].astype(float)

    y_train = df_train['dps_score'].astype(float).values
    y_holdout = df_holdout['dps_score'].astype(float).values

    log(f'Features: {len(present)}/{len(FEATURES)}')
    log(f'Target: mean={y_train.mean():.2f} std={y_train.std():.2f}')
    nan_count = X_train.isna().any(axis=1).sum()
    log(f'Rows with NaN: {nan_count}/{len(X_train)} ({nan_count/len(X_train)*100:.1f}%)')

    # Free memory before Optuna
    del df_all, all_features, all_videos, labeled_runs, rows
    gc.collect()
    log('Freed data memory, starting Optuna...')

    # Optuna tuning
    n_rows = len(X_train)
    n_jobs = 1
    max_est = 500 if n_rows > 3000 else 1000
    max_depth = 8 if n_rows > 3000 else 10

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
        kf = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
        X_np = X_train.values
        y_np = y_train
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
            gc.collect()
            return float('-inf')
        return float(np.mean(fold_rhos))

    study = optuna.create_study(direction='maximize',
        sampler=optuna.samplers.TPESampler(seed=RANDOM_STATE))

    for trial_num in range(100):
        study.optimize(objective, n_trials=1)
        if (trial_num + 1) % 10 == 0:
            log(f'  Optuna trial {trial_num + 1}/100, best so far: {study.best_value:.4f}')

    best_params = {
        'objective': 'reg:squarederror', 'tree_method': 'hist',
        'random_state': RANDOM_STATE, 'n_jobs': n_jobs, 'verbosity': 0,
        **study.best_params,
    }
    log(f'Optuna best: ρ={study.best_value:.4f} (trial {study.best_trial.number})')

    # Train final model
    model = xgb.XGBRegressor(**best_params)
    model.fit(X_train.values, y_train)

    y_pred_train = np.clip(model.predict(X_train.values), 0, 100)
    y_pred_holdout = np.clip(model.predict(X_holdout.values), 0, 100)

    rho_train, _ = spearmanr(y_train, y_pred_train)
    rho_holdout, _ = spearmanr(y_holdout, y_pred_holdout)
    mae_train = mean_absolute_error(y_train, y_pred_train)
    mae_holdout = mean_absolute_error(y_holdout, y_pred_holdout)

    log(f'Train  ρ={rho_train:.4f}  MAE={mae_train:.2f}')
    log(f'Holdout ρ={rho_holdout:.4f}  MAE={mae_holdout:.2f}')

    # CV with best params
    kf = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    cv_rhos = []
    cv_maes = []
    for ti, vi in kf.split(X_train.values):
        m = xgb.XGBRegressor(**best_params)
        m.fit(X_train.values[ti], y_train[ti])
        yp = np.clip(m.predict(X_train.values[vi]), 0, 100)
        rho, _ = spearmanr(y_train[vi], yp)
        cv_rhos.append(rho)
        cv_maes.append(mean_absolute_error(y_train[vi], yp))
        del m
    gc.collect()
    cv_rho = float(np.mean(cv_rhos))
    cv_std = float(np.std(cv_rhos))
    log(f'CV     ρ={cv_rho:.4f}±{cv_std:.4f}  MAE={np.mean(cv_maes):.2f}')

    # Feature importance
    imp = pd.DataFrame({'feature': present, 'importance': model.feature_importances_}).sort_values('importance', ascending=False)
    log('Top 10 features:')
    for i, (_, row) in enumerate(imp.head(10).iterrows()):
        log(f'  {i+1:2d}. {row["feature"]:<35s} {row["importance"]:.4f}')

    # Serialize params
    ser_params = {}
    for k, v in best_params.items():
        if isinstance(v, (np.integer,)): ser_params[k] = int(v)
        elif isinstance(v, (np.floating,)): ser_params[k] = float(v)
        else: ser_params[k] = v

    # Save
    name = f'v14{exp.lower()}-sandbox'
    prefix = os.path.join(SANDBOX_DIR, f'xgboost-{name}')
    model.save_model(f'{prefix}-model.json')
    with open(f'{prefix}-features.json', 'w') as f:
        json.dump(present, f, indent=2)

    meta = {
        'model_version': name,
        'trained_at': __import__('datetime').datetime.now().isoformat(),
        'implementation': f'Python XGBoost {xgb.__version__}',
        'WARNING': 'SANDBOX ONLY',
        'description': desc,
        'feature_count': len(present),
        'dataset': {'train_rows': len(df_train), 'holdout_rows': len(df_holdout)},
        'target_stats': {'mean': float(y_train.mean()), 'std': float(y_train.std()), 'min': float(y_train.min()), 'max': float(y_train.max())},
        'performance': {
            'train': {'spearman_rho': float(rho_train), 'mae': float(mae_train), 'rmse': float(np.sqrt(mean_squared_error(y_train, y_pred_train))), 'r2': float(r2_score(y_train, y_pred_train)), 'n': len(y_train)},
            'holdout': {'spearman_rho': float(rho_holdout), 'mae': float(mae_holdout), 'rmse': float(np.sqrt(mean_squared_error(y_holdout, y_pred_holdout))), 'r2': float(r2_score(y_holdout, y_pred_holdout)), 'n': len(y_holdout)},
            'cv_5fold': {'spearman_mean': cv_rho, 'spearman_std': cv_std, 'mae_mean': float(np.mean(cv_maes))},
        },
        'hyperparameters': ser_params,
        'top_features': [{'feature': row['feature'], 'importance': float(row['importance'])} for _, row in imp.head(15).iterrows()],
    }
    with open(f'{prefix}-metadata.json', 'w') as f:
        json.dump(meta, f, indent=2)

    log(f'Saved: {prefix}-model.json, -metadata.json, -features.json')
    log(f'=== EXPERIMENT {exp} COMPLETE ===')
    _lf.close()


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        log(f'FATAL: {type(e).__name__}: {e}')
        import traceback
        log(traceback.format_exc())
        _lf.close()
