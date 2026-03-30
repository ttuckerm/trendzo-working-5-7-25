# -*- coding: utf-8 -*-
"""
v10 Retrain: v9 features (51) + 7 new features = 58 total

New features:
  Creator + distribution signals (3):
    - creator_followers_log
    - post_hour_utc
    - post_day_of_week
  Fixed Wave 1 features (4):
    - specificity_score
    - instructional_density
    - has_step_structure
    - hedge_word_density

Data: training_features JOIN scraped_videos WHERE dps_score IS NOT NULL
Split: 50-video holdout from models/holdout-video-ids.json
Baseline: v9

Output:
  - models/xgboost-v10-model.json (if improved)
  - models/xgboost-v10-metadata.json
  - models/xgboost-v10-features.json
  - models/xgboost-v10-scaler.json
  - docs/RETRAIN_REPORT_V10.md
"""

import sys
import io
import os
import json
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold
from scipy.stats import spearmanr
import xgboost as xgb
from datetime import datetime

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

RANDOM_STATE = 42
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(PROJECT_ROOT, 'models')
HOLDOUT_PATH = os.path.join(MODELS_DIR, 'holdout-video-ids.json')
REPORT_PATH = os.path.join(PROJECT_ROOT, 'docs', 'RETRAIN_REPORT_V10.md')

# v8 features (48)
V8_FEATURES = [
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
]

# v9 new features (3) — added in v9
V9_NEW_FEATURES = [
    'text_overlay_density',
    'visual_proof_ratio',
    'vocal_confidence_composite',
]

V9_FEATURES = V8_FEATURES + V9_NEW_FEATURES  # 51 total

# v10 new features (7)
V10_NEW_FEATURES = [
    # Creator + distribution signals (3)
    'creator_followers_log',
    'post_hour_utc',
    'post_day_of_week',
    # Fixed Wave 1 features (4)
    'specificity_score',
    'instructional_density',
    'has_step_structure',
    'hedge_word_density',
]

V10_FEATURES = V9_FEATURES + V10_NEW_FEATURES  # 58 total

# v8 Optuna-optimized hyperparameters (reuse as starting point)
V8_HYPERPARAMS = {
    'objective': 'reg:squarederror',
    'n_estimators': 413,
    'max_depth': 8,
    'learning_rate': 0.025847050593221715,
    'min_child_weight': 5,
    'subsample': 0.7064306141071703,
    'colsample_bytree': 0.716878246792974,
    'reg_alpha': 0.6170624733980454,
    'reg_lambda': 4.9455883361853195,
}


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
    """Fetch training_features + scraped_videos (with dps_score).

    Also fetches labeled prediction_runs (where actual_dps is available from
    user feedback or auto-labeler) and uses actual_dps as ground truth where
    it exists. This closes the learning loop: user enters actual metrics on
    upload-test → actual_dps saved to prediction_runs → next retrain uses it.
    """
    from supabase import create_client

    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        print('  ERROR: Missing Supabase credentials in .env.local')
        sys.exit(1)

    sb = create_client(url, key)

    # Fetch training features (paginated)
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

    # Fetch scraped_videos with dps_score (paginated)
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

    # Fetch labeled prediction_runs (actual_dps from user feedback or auto-labeler)
    print('  Fetching labeled prediction_runs (actual_dps)...')
    labeled_runs = []
    offset = 0
    while True:
        resp = sb.table('prediction_runs').select(
            'video_id, actual_dps, niche'
        ).not_.is_('actual_dps', 'null').range(offset, offset + 999).execute()
        if not resp.data:
            break
        labeled_runs.extend(resp.data)
        if len(resp.data) < 1000:
            break
        offset += 1000

    # Build lookup: video_id → actual_dps (user-labeled ground truth)
    actual_dps_map = {}
    for run in labeled_runs:
        vid = run.get('video_id')
        if vid and run.get('actual_dps') is not None:
            actual_dps_map[vid] = run['actual_dps']
    print(f'  Got {len(actual_dps_map)} videos with user-labeled actual_dps (learning loop)')

    # JOIN on video_id — prefer actual_dps over scraped dps_score
    video_map = {v['video_id']: v for v in all_videos}
    rows = []
    actual_used = 0
    for feat in all_features:
        vid = feat.get('video_id')
        if vid and vid in video_map:
            row = {**feat}
            # Use actual_dps from learning loop if available, else scraped dps_score
            if vid in actual_dps_map:
                row['dps_score'] = actual_dps_map[vid]
                actual_used += 1
            else:
                row['dps_score'] = video_map[vid]['dps_score']
            row['niche_key'] = video_map[vid].get('niche', 'side-hustles')
            rows.append(row)

    print(f'  Ground truth: {actual_used} from learning loop, {len(rows) - actual_used} from scraped dps_score')
    return pd.DataFrame(rows)


def prepare_features(df, feature_list):
    """Extract feature matrix, return (X DataFrame, list of present feature names)."""
    present = [f for f in feature_list if f in df.columns]
    X = df[present].copy()
    for col in X.columns:
        if X[col].dtype == 'bool' or X[col].dtype == 'object':
            X[col] = X[col].astype(float)
    X = X.fillna(0).astype(float)
    return X, present


def evaluate_model(y_true, y_pred):
    """Compute all metrics."""
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
        'spearman_rho': float(rho),
        'spearman_p': float(p),
        'mae': float(mae),
        'rmse': float(rmse),
        'r2': float(r2),
        'within_5_dps_pct': float(within_5),
        'within_10_dps_pct': float(within_10),
        'tier_accuracy_pct': float(tier_acc),
        'n': len(y_true),
    }


def cross_validate(X_scaled, y, n_splits=5):
    """5-fold CV, return per-fold metrics."""
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=RANDOM_STATE)
    fold_metrics = []
    for train_idx, val_idx in kf.split(X_scaled):
        model_cv = xgb.XGBRegressor(**V8_HYPERPARAMS, random_state=RANDOM_STATE, n_jobs=-1, verbosity=0)
        model_cv.fit(X_scaled[train_idx], y[train_idx])
        y_pred = np.clip(model_cv.predict(X_scaled[val_idx]), 0, 100)
        rho, _ = spearmanr(y[val_idx], y_pred)
        mae = mean_absolute_error(y[val_idx], y_pred)
        within_10 = np.mean(np.abs(y[val_idx] - y_pred) <= 10) * 100
        fold_metrics.append({'spearman': rho, 'mae': mae, 'within_10': within_10})
    return fold_metrics


def main():
    print('=' * 60)
    print('  v10 Retrain: v9 (51 features) + 7 new features = 58 total')
    print('  New: creator_followers_log, post_hour_utc, post_day_of_week,')
    print('       specificity_score, instructional_density,')
    print('       has_step_structure, hedge_word_density')
    print('=' * 60)

    # Load holdout IDs
    with open(HOLDOUT_PATH) as f:
        holdout_data = json.load(f)
    holdout_ids = set(holdout_data['video_ids'])
    print(f'\n  Holdout: {len(holdout_ids)} videos')

    # Load v9 baseline
    v9_meta_path = os.path.join(MODELS_DIR, 'xgboost-v9-metadata.json')
    with open(v9_meta_path) as f:
        v9_meta = json.load(f)
    v9_baseline = {
        'cv_spearman': v9_meta['performance']['cv_5fold']['spearman_mean'],
        'cv_spearman_std': v9_meta['performance']['cv_5fold']['spearman_std'],
        'cv_mae': v9_meta['performance']['cv_5fold']['mae_mean'],
        'cv_mae_std': v9_meta['performance']['cv_5fold']['mae_std'],
        'test_spearman': v9_meta['performance']['holdout']['spearman_rho'],
        'test_mae': v9_meta['performance']['holdout']['mae'],
        'test_within_10': v9_meta['performance']['holdout']['within_10_dps_pct'],
        'test_tier_acc': v9_meta['performance']['holdout']['tier_accuracy_pct'],
        'train_spearman': v9_meta['performance']['train']['spearman_rho'],
        'train_mae': v9_meta['performance']['train']['mae'],
    }
    print(f'  v9 baseline: CV ρ={v9_baseline["cv_spearman"]:.4f}, holdout ρ={v9_baseline["test_spearman"]:.4f}')

    # Fetch data from Supabase
    load_env()
    df = fetch_data()
    df = df[df['niche_key'] == 'side-hustles'].dropna(subset=['dps_score'])
    print(f'  Total side-hustles with DPS: {len(df)}')

    # Split: holdout vs train
    df_train = df[~df['video_id'].isin(holdout_ids)].copy()
    df_holdout = df[df['video_id'].isin(holdout_ids)].copy()
    print(f'  Train: {len(df_train)} | Holdout: {len(df_holdout)}')

    # Check new feature availability
    print('\n  v10 new feature availability:')
    for feat in V10_NEW_FEATURES:
        if feat in df.columns:
            non_null = df[feat].notna().sum()
            print(f'  {feat}: {non_null}/{len(df)} non-null ({non_null/len(df)*100:.1f}%)')
        else:
            print(f'  {feat}: NOT IN TABLE')

    # ═══════════════════════════════════════════════════════════════
    # MODEL A: v9 baseline (51 features) — reproduced fresh
    # ═══════════════════════════════════════════════════════════════
    print('\n  ── Model A: v9 baseline (51 features, reproduced) ──')
    X_train_v9, present_v9 = prepare_features(df_train, V9_FEATURES)
    X_holdout_v9, _ = prepare_features(df_holdout, present_v9)
    y_train = df_train['dps_score'].astype(float).values
    y_holdout = df_holdout['dps_score'].astype(float).values

    scaler_v9 = StandardScaler()
    X_train_v9_s = scaler_v9.fit_transform(X_train_v9)
    X_holdout_v9_s = scaler_v9.transform(X_holdout_v9)

    model_v9 = xgb.XGBRegressor(**V8_HYPERPARAMS, random_state=RANDOM_STATE, n_jobs=-1, verbosity=0)
    model_v9.fit(X_train_v9_s, y_train)

    y_pred_train_v9 = np.clip(model_v9.predict(X_train_v9_s), 0, 100)
    y_pred_holdout_v9 = np.clip(model_v9.predict(X_holdout_v9_s), 0, 100)

    metrics_train_v9 = evaluate_model(y_train, y_pred_train_v9)
    metrics_holdout_v9 = evaluate_model(y_holdout, y_pred_holdout_v9)

    cv_v9 = cross_validate(X_train_v9_s, y_train)
    cv_v9_spearman = np.mean([f['spearman'] for f in cv_v9])
    cv_v9_spearman_std = np.std([f['spearman'] for f in cv_v9])
    cv_v9_mae = np.mean([f['mae'] for f in cv_v9])
    cv_v9_mae_std = np.std([f['mae'] for f in cv_v9])
    cv_v9_within10 = np.mean([f['within_10'] for f in cv_v9])

    print(f'  v9 reproduced: Train ρ={metrics_train_v9["spearman_rho"]:.4f} | '
          f'Holdout ρ={metrics_holdout_v9["spearman_rho"]:.4f} | CV ρ={cv_v9_spearman:.4f}±{cv_v9_spearman_std:.4f}')

    # ═══════════════════════════════════════════════════════════════
    # MODEL B: v10 candidate (58 features)
    # ═══════════════════════════════════════════════════════════════
    print('\n  ── Model B: v10 candidate (51 + 7 new features) ──')
    X_train_v10, present_v10 = prepare_features(df_train, V10_FEATURES)
    X_holdout_v10, _ = prepare_features(df_holdout, present_v10)
    print(f'  Features present: {len(present_v10)}/{len(V10_FEATURES)}')

    scaler_v10 = StandardScaler()
    X_train_v10_s = scaler_v10.fit_transform(X_train_v10)
    X_holdout_v10_s = scaler_v10.transform(X_holdout_v10)

    model_v10 = xgb.XGBRegressor(**V8_HYPERPARAMS, random_state=RANDOM_STATE, n_jobs=-1, verbosity=0)
    model_v10.fit(X_train_v10_s, y_train)

    y_pred_train_v10 = np.clip(model_v10.predict(X_train_v10_s), 0, 100)
    y_pred_holdout_v10 = np.clip(model_v10.predict(X_holdout_v10_s), 0, 100)

    metrics_train_v10 = evaluate_model(y_train, y_pred_train_v10)
    metrics_holdout_v10 = evaluate_model(y_holdout, y_pred_holdout_v10)

    cv_v10 = cross_validate(X_train_v10_s, y_train)
    cv_v10_spearman = np.mean([f['spearman'] for f in cv_v10])
    cv_v10_spearman_std = np.std([f['spearman'] for f in cv_v10])
    cv_v10_mae = np.mean([f['mae'] for f in cv_v10])
    cv_v10_mae_std = np.std([f['mae'] for f in cv_v10])
    cv_v10_within10 = np.mean([f['within_10'] for f in cv_v10])

    print(f'  v10 candidate: Train ρ={metrics_train_v10["spearman_rho"]:.4f} | '
          f'Holdout ρ={metrics_holdout_v10["spearman_rho"]:.4f} | CV ρ={cv_v10_spearman:.4f}±{cv_v10_spearman_std:.4f}')

    # ═══════════════════════════════════════════════════════════════
    # FEATURE IMPORTANCE (v10)
    # ═══════════════════════════════════════════════════════════════
    importance_v10 = pd.DataFrame({
        'feature': present_v10,
        'importance': model_v10.feature_importances_,
    }).sort_values('importance', ascending=False)

    print('\n  Top 20 features (v10):')
    for i, (_, row) in enumerate(importance_v10.head(20).iterrows()):
        marker = ' ★ NEW' if row['feature'] in V10_NEW_FEATURES else ''
        print(f'    {i+1:2d}. {row["feature"]:<35s} {row["importance"]:.4f}{marker}')

    # New feature importance
    print('\n  New feature importance (v10):')
    for feat in V10_NEW_FEATURES:
        imp = importance_v10[importance_v10['feature'] == feat]['importance'].values
        if len(imp) > 0:
            rank = int((importance_v10['importance'] > imp[0]).sum()) + 1
            print(f'    {feat}: importance={imp[0]:.4f}, rank={rank}/{len(present_v10)}')
        else:
            print(f'    {feat}: NOT IN MODEL')

    # ═══════════════════════════════════════════════════════════════
    # COMPARISON & DECISION
    # ═══════════════════════════════════════════════════════════════
    delta_cv = cv_v10_spearman - cv_v9_spearman
    delta_holdout = metrics_holdout_v10['spearman_rho'] - metrics_holdout_v9['spearman_rho']
    delta_mae = metrics_holdout_v10['mae'] - metrics_holdout_v9['mae']
    delta_within10 = metrics_holdout_v10['within_10_dps_pct'] - metrics_holdout_v9['within_10_dps_pct']

    print(f'\n  ── Comparison: v10 vs v9 (reproduced) ──')
    print(f'  CV Spearman:     {cv_v9_spearman:.4f} → {cv_v10_spearman:.4f}  (Δ={delta_cv:+.4f})')
    print(f'  Holdout Spearman: {metrics_holdout_v9["spearman_rho"]:.4f} → {metrics_holdout_v10["spearman_rho"]:.4f}  (Δ={delta_holdout:+.4f})')
    print(f'  Holdout MAE:     {metrics_holdout_v9["mae"]:.2f} → {metrics_holdout_v10["mae"]:.2f}  (Δ={delta_mae:+.2f})')
    print(f'  Holdout ±10 DPS: {metrics_holdout_v9["within_10_dps_pct"]:.1f}% → {metrics_holdout_v10["within_10_dps_pct"]:.1f}%  (Δ={delta_within10:+.1f}pp)')

    # Decision: improved if CV Spearman or holdout Spearman improved
    improved = (delta_cv > 0.005) or (delta_holdout > 0.01)
    decision = 'IMPROVED — saving as v10' if improved else 'NO IMPROVEMENT — v9 remains production'
    print(f'\n  Decision: {decision}')

    # ═══════════════════════════════════════════════════════════════
    # SAVE MODEL (if improved)
    # ═══════════════════════════════════════════════════════════════
    if improved:
        print('\n  Saving v10 model artifacts...')

        # Save model
        model_path = os.path.join(MODELS_DIR, 'xgboost-v10-model.json')
        model_v10.save_model(model_path)
        print(f'    Model: {model_path}')

        # Save feature list
        features_path = os.path.join(MODELS_DIR, 'xgboost-v10-features.json')
        with open(features_path, 'w') as f:
            json.dump(present_v10, f, indent=2)
        print(f'    Features: {features_path}')

        # Save scaler
        scaler_path = os.path.join(MODELS_DIR, 'xgboost-v10-scaler.json')
        scaler_data = {
            'mean': scaler_v10.mean_.tolist(),
            'std': scaler_v10.scale_.tolist(),
            'feature_names': present_v10,
        }
        with open(scaler_path, 'w') as f:
            json.dump(scaler_data, f, indent=2)
        print(f'    Scaler: {scaler_path}')

        # Save metadata
        meta_path = os.path.join(MODELS_DIR, 'xgboost-v10-metadata.json')
        metadata = {
            'model_version': 'v10',
            'trained_at': datetime.now().isoformat(),
            'source': 'supabase:training_features+scraped_videos',
            'changes_from_v9': f'Added 7 new features: {", ".join(V10_NEW_FEATURES)}. Same Optuna v8 hyperparameters.',
            'new_features_added': V10_NEW_FEATURES,
            'feature_count': len(present_v10),
            'feature_names': present_v10,
            'dataset': {
                'total_rows': len(df),
                'train_rows': len(df_train),
                'holdout_rows': len(df_holdout),
                'holdout_method': 'explicit ID list (stratified by tier: 10 per tier)',
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
                'train': metrics_train_v10,
                'holdout': metrics_holdout_v10,
                'cv_5fold': {
                    'spearman_mean': cv_v10_spearman,
                    'spearman_std': cv_v10_spearman_std,
                    'mae_mean': cv_v10_mae,
                    'mae_std': cv_v10_mae_std,
                    'within_10_mean': cv_v10_within10,
                },
                'baseline_mean_predictor': {
                    'mae': float(mean_absolute_error(y_holdout, np.full_like(y_holdout, y_train.mean()))),
                },
            },
            'hyperparameters': V8_HYPERPARAMS,
            'delta_vs_v9': {
                'cv_spearman': delta_cv,
                'holdout_spearman': delta_holdout,
                'holdout_mae': delta_mae,
                'holdout_within_10_pp': delta_within10,
            },
            'top_features': [
                {'feature': row['feature'], 'importance': float(row['importance'])}
                for _, row in importance_v10.head(20).iterrows()
            ],
            'new_feature_importance': {
                feat: {
                    'importance': float(importance_v10[importance_v10['feature'] == feat]['importance'].values[0]),
                    'rank': int((importance_v10['importance'] > importance_v10[importance_v10['feature'] == feat]['importance'].values[0]).sum()) + 1,
                }
                for feat in V10_NEW_FEATURES
                if feat in present_v10
            },
        }
        with open(meta_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f'    Metadata: {meta_path}')

    # ═══════════════════════════════════════════════════════════════
    # GENERATE REPORT
    # ═══════════════════════════════════════════════════════════════
    print('\n  Generating report...')
    now = datetime.now().strftime('%Y-%m-%d %H:%M')

    # New feature stats
    new_feat_stats = []
    for feat in V10_NEW_FEATURES:
        if feat in df.columns:
            col = df[feat]
            nn = col.notna().sum()
            new_feat_stats.append({
                'name': feat,
                'non_null': nn,
                'pct': nn / len(df) * 100,
                'mean': col.mean() if nn > 0 else 0,
                'median': col.median() if nn > 0 else 0,
            })
        else:
            new_feat_stats.append({
                'name': feat,
                'non_null': 0,
                'pct': 0,
                'mean': 0,
                'median': 0,
            })

    # Importance for new features
    new_feat_imp = {}
    for feat in V10_NEW_FEATURES:
        imp_row = importance_v10[importance_v10['feature'] == feat]
        if len(imp_row) > 0:
            imp_val = imp_row['importance'].values[0]
            rank = int((importance_v10['importance'] > imp_val).sum()) + 1
            new_feat_imp[feat] = {'importance': imp_val, 'rank': rank, 'total': len(present_v10)}

    report = f"""# Retrain Report — v10 (v9 + 7 New Features)

**Date:** {now}
**Script:** `scripts/train-v10-retrain.py`
**Data source:** Supabase `training_features` JOIN `scraped_videos` WHERE `dps_score IS NOT NULL`
**Holdout:** 50 videos from `models/holdout-video-ids.json` (stratified: 10 per tier)

---

## 1. Dataset

| Metric | Value |
|--------|-------|
| Total rows (side-hustles, with DPS) | {len(df)} |
| Training set | {len(df_train)} |
| Holdout set | {len(df_holdout)} |
| v9 features | {len(present_v9)} |
| v10 features (v9 + 7 new) | {len(present_v10)} |
| DPS range (train) | {y_train.min():.1f} – {y_train.max():.1f} |
| DPS mean (train) | {y_train.mean():.1f} ± {y_train.std():.1f} |

### New Feature Availability

| Feature | Non-null | Coverage | Mean | Median |
|---------|----------|----------|------|--------|
"""
    for s in new_feat_stats:
        report += f"| `{s['name']}` | {s['non_null']} | {s['pct']:.1f}% | {s['mean']:.4f} | {s['median']:.4f} |\n"

    report += f"""
---

## 2. v9 Baseline (Reproduced)

| Metric | Train | Holdout | CV (5-fold) |
|--------|-------|---------|-------------|
| Spearman ρ | {metrics_train_v9['spearman_rho']:.4f} | {metrics_holdout_v9['spearman_rho']:.4f} | {cv_v9_spearman:.4f} ± {cv_v9_spearman_std:.4f} |
| MAE | {metrics_train_v9['mae']:.2f} | {metrics_holdout_v9['mae']:.2f} | {cv_v9_mae:.2f} ± {cv_v9_mae_std:.2f} |
| Within ±10 DPS | {metrics_train_v9['within_10_dps_pct']:.1f}% | {metrics_holdout_v9['within_10_dps_pct']:.1f}% | {cv_v9_within10:.1f}% |
| Tier accuracy | — | {metrics_holdout_v9['tier_accuracy_pct']:.1f}% | — |
| R² | {metrics_train_v9['r2']:.3f} | {metrics_holdout_v9['r2']:.3f} | — |

**Stored v9 baseline (from metadata):** CV ρ={v9_baseline['cv_spearman']:.4f}, holdout ρ={v9_baseline['test_spearman']:.4f}

---

## 3. v10 Candidate (51 + 7 New Features)

| Metric | Train | Holdout | CV (5-fold) |
|--------|-------|---------|-------------|
| Spearman ρ | {metrics_train_v10['spearman_rho']:.4f} | {metrics_holdout_v10['spearman_rho']:.4f} | {cv_v10_spearman:.4f} ± {cv_v10_spearman_std:.4f} |
| MAE | {metrics_train_v10['mae']:.2f} | {metrics_holdout_v10['mae']:.2f} | {cv_v10_mae:.2f} ± {cv_v10_mae_std:.2f} |
| Within ±5 DPS | {metrics_train_v10['within_5_dps_pct']:.1f}% | {metrics_holdout_v10['within_5_dps_pct']:.1f}% | — |
| Within ±10 DPS | {metrics_train_v10['within_10_dps_pct']:.1f}% | {metrics_holdout_v10['within_10_dps_pct']:.1f}% | {cv_v10_within10:.1f}% |
| Tier accuracy | {metrics_train_v10['tier_accuracy_pct']:.1f}% | {metrics_holdout_v10['tier_accuracy_pct']:.1f}% | — |
| R² | {metrics_train_v10['r2']:.3f} | {metrics_holdout_v10['r2']:.3f} | — |
| RMSE | {metrics_train_v10['rmse']:.2f} | {metrics_holdout_v10['rmse']:.2f} | — |

---

## 4. Delta: v10 vs v9

| Metric | v9 (reproduced) | v10 | Delta |
|--------|-----------------|-----|-------|
| CV Spearman | {cv_v9_spearman:.4f} | {cv_v10_spearman:.4f} | **{delta_cv:+.4f}** |
| Holdout Spearman | {metrics_holdout_v9['spearman_rho']:.4f} | {metrics_holdout_v10['spearman_rho']:.4f} | **{delta_holdout:+.4f}** |
| Holdout MAE | {metrics_holdout_v9['mae']:.2f} | {metrics_holdout_v10['mae']:.2f} | {delta_mae:+.2f} |
| Holdout ±10 DPS | {metrics_holdout_v9['within_10_dps_pct']:.1f}% | {metrics_holdout_v10['within_10_dps_pct']:.1f}% | {delta_within10:+.1f}pp |
| Holdout Tier Acc | {metrics_holdout_v9['tier_accuracy_pct']:.1f}% | {metrics_holdout_v10['tier_accuracy_pct']:.1f}% | {metrics_holdout_v10['tier_accuracy_pct'] - metrics_holdout_v9['tier_accuracy_pct']:+.1f}pp |

---

## 5. New Feature Importance

| Feature | Importance | Rank (of {len(present_v10)}) |
|---------|------------|------|
"""
    for feat in V10_NEW_FEATURES:
        if feat in new_feat_imp:
            imp = new_feat_imp[feat]
            bar = '█' * int(imp['importance'] * 100)
            report += f"| `{feat}` | {imp['importance']:.4f} {bar} | #{imp['rank']} |\n"
        else:
            report += f"| `{feat}` | N/A | N/A |\n"

    report += f"""
---

## 6. Top 20 Features (v10 Model)

| Rank | Feature | Importance | New? |
|------|---------|------------|------|
"""
    for i, (_, row) in enumerate(importance_v10.head(20).iterrows()):
        is_new = '★' if row['feature'] in V10_NEW_FEATURES else ''
        bar = '█' * int(row['importance'] * 100)
        report += f"| {i+1} | `{row['feature']}` | {row['importance']:.4f} {bar} | {is_new} |\n"

    report += f"""
---

## 7. Decision

"""
    if improved:
        report += f"""**IMPROVED — saved as v10**

The 7 new features improved the model:
- CV Spearman: {cv_v9_spearman:.4f} → {cv_v10_spearman:.4f} ({delta_cv:+.4f})
- Holdout Spearman: {metrics_holdout_v9['spearman_rho']:.4f} → {metrics_holdout_v10['spearman_rho']:.4f} ({delta_holdout:+.4f})

**Artifacts saved:**
- `models/xgboost-v10-model.json`
- `models/xgboost-v10-metadata.json`
- `models/xgboost-v10-features.json`
- `models/xgboost-v10-scaler.json`

**Next steps:**
1. Wire v10 model into `predict-xgboost.py` (update model path + feature list)
2. Ensure the 7 new features are populated in `training_features` for new predictions
3. Monitor holdout drift at next retrain milestone
"""
    else:
        report += f"""**NO IMPROVEMENT — v9 remains production model**

The 7 new features did not meaningfully improve the model:
- CV Spearman: {cv_v9_spearman:.4f} → {cv_v10_spearman:.4f} ({delta_cv:+.4f})
- Holdout Spearman: {metrics_holdout_v9['spearman_rho']:.4f} → {metrics_holdout_v10['spearman_rho']:.4f} ({delta_holdout:+.4f})

**Possible reasons:**
- New features have high null rate (filled with 0) — real signal diluted
- XGBoost already captures similar signal through correlated existing features
- Insufficient data to learn the new feature interactions

**Next steps:**
1. Improve coverage of the 7 new features (backfill nulls)
2. Re-evaluate at next data milestone
3. Consider feature engineering (interactions between new and existing features)
"""

    report += f"""
---

*Generated by `scripts/train-v10-retrain.py` on {now}*
*XGBoost {xgb.__version__} | scikit-learn | Holdout: 50 videos (10 per tier)*
"""

    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f'  Report: {REPORT_PATH}')
    print('=' * 60)
    print('  DONE')


if __name__ == '__main__':
    main()
