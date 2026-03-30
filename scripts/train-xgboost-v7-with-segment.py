# -*- coding: utf-8 -*-
"""
Retrain XGBoost v7 Model with 73 features (68 original + 5 FFmpeg segment)

Uses the EXACT same hyperparameters as the original v7:
  n_estimators=98, learning_rate=0.05, max_depth=4, min_child_weight=5,
  subsample=0.8, colsample_bytree=0.7, reg_alpha=0.5, reg_lambda=2.0

Excludes 50 holdout videos.
Reports Spearman delta vs the 68-feature baseline.

Output: models/xgboost-v7-model.json, xgboost-v7-scaler.json,
        xgboost-v7-features.json, xgboost-v7-metadata.json
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

# Force UTF-8 on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ── Constants ────────────────────────────────────────────────────────────────

MODEL_VERSION = 'v7'
RANDOM_STATE = 42
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
HOLDOUT_PATH = os.path.join(OUTPUT_DIR, 'holdout-video-ids.json')

# Original v7 hyperparameters (locked — do not change)
HYPERPARAMETERS = {
    'objective': 'reg:squarederror',
    'n_estimators': 98,
    'learning_rate': 0.05,
    'max_depth': 4,
    'min_child_weight': 5,
    'subsample': 0.8,
    'colsample_bytree': 0.7,
    'reg_alpha': 0.5,
    'reg_lambda': 2.0,
}

# Original 68 + 5 FFmpeg segment features = 73 total
V7_FEATURES = [
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
    # 5 FFmpeg segment features (new)
    "hook_motion_ratio", "audio_energy_buildup", "scene_rate_first_half_vs_second",
    "visual_variety_score", "hook_audio_intensity",
]


def classify_tier(dps):
    if dps >= 90: return 'mega-viral'
    if dps >= 70: return 'viral'
    if dps >= 60: return 'good'
    if dps >= 40: return 'average'
    return 'low'


def load_env():
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()


def fetch_from_supabase():
    from supabase import create_client

    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')

    if not url or not key:
        print('  ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY')
        sys.exit(1)

    sb = create_client(url, key)

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

    video_map = {v['video_id']: v for v in all_videos}
    rows = []
    for feat in all_features:
        vid = feat.get('video_id')
        if vid and vid in video_map:
            row = {**feat}
            row['dps_score'] = video_map[vid]['dps_score']
            row['niche_key'] = video_map[vid].get('niche', 'side-hustles')
            rows.append(row)

    return pd.DataFrame(rows)


def main():
    print('=' * 60)
    print('  XGBoost v7 Retraining — 73 features (68 + 5 FFmpeg segment)')
    print('  Fixed hyperparameters | Holdout split')
    print('=' * 60)

    # ── 1. Load holdout IDs
    if not os.path.exists(HOLDOUT_PATH):
        print(f'\n  ERROR: {HOLDOUT_PATH} not found.')
        sys.exit(1)

    with open(HOLDOUT_PATH) as f:
        holdout_data = json.load(f)

    holdout_ids = set(holdout_data['video_ids'])
    print(f'\n  Holdout set: {len(holdout_ids)} videos (excluded from training)')

    # ── 2. Load data
    load_env()
    df = fetch_from_supabase()
    print(f'  Loaded {len(df)} total rows')

    if 'niche_key' in df.columns:
        df = df[df['niche_key'] == 'side-hustles']
    df = df.dropna(subset=['dps_score'])
    print(f'  Side-hustles with DPS: {len(df)} rows')

    # ── 3. Split
    df_train = df[~df['video_id'].isin(holdout_ids)].copy()
    df_holdout = df[df['video_id'].isin(holdout_ids)].copy()

    print(f'\n  Training set:  {len(df_train)} videos')
    print(f'  Holdout set:   {len(df_holdout)} videos')

    # Check segment feature coverage
    segment_features = ["hook_motion_ratio", "audio_energy_buildup",
                        "scene_rate_first_half_vs_second", "visual_variety_score",
                        "hook_audio_intensity"]
    for sf in segment_features:
        if sf in df_train.columns:
            non_null = df_train[sf].notna().sum()
            print(f'    {sf}: {non_null}/{len(df_train)} non-null ({non_null/len(df_train)*100:.1f}%)')
        else:
            print(f'    {sf}: NOT IN COLUMNS')

    # ── 4. Prepare features
    present = [f for f in V7_FEATURES if f in df_train.columns]
    missing = [f for f in V7_FEATURES if f not in df_train.columns]

    print(f'\n  Features: {len(present)}/{len(V7_FEATURES)} present')
    if missing:
        print(f'  Missing: {missing}')

    X_train = df_train[present].copy()
    X_holdout = df_holdout[present].copy()

    for col in X_train.columns:
        if X_train[col].dtype == 'bool' or X_train[col].dtype == 'object':
            X_train[col] = X_train[col].astype(float)
            X_holdout[col] = X_holdout[col].astype(float)

    X_train = X_train.fillna(0).astype(float)
    X_holdout = X_holdout.fillna(0).astype(float)

    y_train = df_train['dps_score'].astype(float).values
    y_holdout = df_holdout['dps_score'].astype(float).values

    # ── 5. Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_holdout_scaled = scaler.transform(X_holdout)

    # ── 6. Train model
    print(f'\n  Training XGBoost v7 with 73 features...')
    model = xgb.XGBRegressor(
        **HYPERPARAMETERS,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbosity=0,
    )
    model.fit(X_train_scaled, y_train)

    # ── 7. Evaluate
    y_pred_train = np.clip(model.predict(X_train_scaled), 0, 100)
    y_pred_holdout = np.clip(model.predict(X_holdout_scaled), 0, 100)

    train_mae = mean_absolute_error(y_train, y_pred_train)
    holdout_mae = mean_absolute_error(y_holdout, y_pred_holdout)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    holdout_rmse = np.sqrt(mean_squared_error(y_holdout, y_pred_holdout))
    train_r2 = r2_score(y_train, y_pred_train)
    holdout_r2 = r2_score(y_holdout, y_pred_holdout)
    train_spearman, _ = spearmanr(y_train, y_pred_train)
    holdout_spearman, holdout_spearman_p = spearmanr(y_holdout, y_pred_holdout)
    within_5_train = np.mean(np.abs(y_train - y_pred_train) <= 5) * 100
    within_5_holdout = np.mean(np.abs(y_holdout - y_pred_holdout) <= 5) * 100
    within_10_train = np.mean(np.abs(y_train - y_pred_train) <= 10) * 100
    within_10_holdout = np.mean(np.abs(y_holdout - y_pred_holdout) <= 10) * 100

    actual_tiers = [classify_tier(d) for d in y_holdout]
    pred_tiers = [classify_tier(d) for d in y_pred_holdout]
    tier_accuracy = sum(a == p for a, p in zip(actual_tiers, pred_tiers)) / len(y_holdout) * 100

    # 5-fold CV
    kf = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    cv_spearman_scores = []
    cv_mae_scores = []
    cv_r2_scores = []
    for train_idx, val_idx in kf.split(X_train_scaled):
        model_cv = xgb.XGBRegressor(**HYPERPARAMETERS, random_state=RANDOM_STATE, n_jobs=-1, verbosity=0)
        model_cv.fit(X_train_scaled[train_idx], y_train[train_idx])
        y_cv_pred = model_cv.predict(X_train_scaled[val_idx])
        rho, _ = spearmanr(y_train[val_idx], y_cv_pred)
        cv_spearman_scores.append(rho)
        cv_mae_scores.append(mean_absolute_error(y_train[val_idx], y_cv_pred))
        cv_r2_scores.append(r2_score(y_train[val_idx], y_cv_pred))

    # Load 68-feature baseline for comparison
    baseline_meta_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-metadata.json')
    baseline_cv_spearman = None
    baseline_holdout_spearman = None
    if os.path.exists(baseline_meta_path):
        with open(baseline_meta_path) as f:
            baseline = json.load(f)
        if 'performance' in baseline:
            perf = baseline['performance']
            if 'cv_5fold' in perf:
                baseline_cv_spearman = perf['cv_5fold'].get('spearman_mean')
            if 'holdout' in perf:
                baseline_holdout_spearman = perf['holdout'].get('spearman_rho')

    print(f'\n  Performance (73 features vs 68 baseline):')
    print(f'                       Train       Holdout     68-feat baseline')
    bl_holdout = f'{baseline_holdout_spearman:.4f}' if baseline_holdout_spearman else 'N/A'
    print(f'    Spearman rho     : {train_spearman:7.4f}    {holdout_spearman:7.4f}      {bl_holdout}')
    print(f'    MAE              : {train_mae:7.2f}    {holdout_mae:7.2f}')
    print(f'    RMSE             : {train_rmse:7.2f}    {holdout_rmse:7.2f}')
    print(f'    R2               : {train_r2:7.3f}    {holdout_r2:7.3f}')
    print(f'    Within +/-5 DPS  : {within_5_train:6.1f}%    {within_5_holdout:6.1f}%')
    print(f'    Within +/-10 DPS : {within_10_train:6.1f}%    {within_10_holdout:6.1f}%')
    print(f'    Tier accuracy    :    --      {tier_accuracy:6.1f}%')

    cv_spearman_mean = np.mean(cv_spearman_scores)
    bl_cv = f'{baseline_cv_spearman:.4f}' if baseline_cv_spearman else 'N/A'
    print(f'\n    CV Spearman (5f) : {cv_spearman_mean:.4f} +/- {np.std(cv_spearman_scores):.4f}  (baseline: {bl_cv})')

    if baseline_cv_spearman:
        delta_cv = cv_spearman_mean - baseline_cv_spearman
        delta_holdout = holdout_spearman - (baseline_holdout_spearman or 0)
        print(f'\n    DELTA CV Spearman:  {delta_cv:+.4f}')
        print(f'    DELTA Holdout Spearman: {delta_holdout:+.4f}')

    # ── 8. Feature importance
    importance = pd.DataFrame({
        'feature': present,
        'importance': model.feature_importances_,
    }).sort_values('importance', ascending=False)

    print(f'\n  Top 15 features:')
    for _, row in importance.head(15).iterrows():
        bar = '#' * int(row['importance'] * 200)
        print(f'    {row["feature"]:<40} {row["importance"]:.4f}  {bar}')

    # Show new feature rankings
    print(f'\n  New FFmpeg segment feature rankings:')
    for sf in segment_features:
        if sf in importance['feature'].values:
            rank = importance[importance['feature'] == sf].index[0]
            imp_val = importance[importance['feature'] == sf]['importance'].values[0]
            rank_pos = list(importance['feature']).index(sf) + 1
            print(f'    {sf:<40} rank #{rank_pos}, importance={imp_val:.4f}')

    # ── 9. Save artifacts
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    model_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-model.json')
    model.save_model(model_path)
    print(f'\n  Saved: {model_path}')

    scaler_json = {
        'mean': scaler.mean_.tolist(),
        'std': scaler.scale_.tolist(),
        'feature_names': present,
    }
    scaler_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-scaler.json')
    with open(scaler_path, 'w') as f:
        json.dump(scaler_json, f, indent=2)
    print(f'  Saved: {scaler_path}')

    features_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-features.json')
    with open(features_path, 'w') as f:
        json.dump(present, f, indent=2)
    print(f'  Saved: {features_path}')

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

    metadata = {
        'model_version': MODEL_VERSION,
        'trained_at': datetime.now().isoformat(),
        'source': 'supabase:training_features+scraped_videos',
        'changes': 'Added 5 FFmpeg segment features to original 68 (73 total)',
        'holdout_split': True,
        'holdout_count': len(holdout_ids),
        'holdout_file': 'models/holdout-video-ids.json',
        'feature_count': len(present),
        'feature_names': present,
        'new_features': segment_features,
        'dataset': {
            'total_rows': len(df),
            'train_rows': len(df_train),
            'holdout_rows': len(df_holdout),
            'split': f'{len(df_train)} train + {len(df_holdout)} holdout (explicit split)',
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
            'train': {
                'spearman_rho': float(train_spearman),
                'mae': float(train_mae),
                'rmse': float(train_rmse),
                'r2': float(train_r2),
                'within_5_dps_pct': float(within_5_train),
                'within_10_dps_pct': float(within_10_train),
            },
            'holdout': {
                'spearman_rho': float(holdout_spearman),
                'spearman_p_value': float(holdout_spearman_p),
                'mae': float(holdout_mae),
                'rmse': float(holdout_rmse),
                'r2': float(holdout_r2),
                'within_5_dps_pct': float(within_5_holdout),
                'within_10_dps_pct': float(within_10_holdout),
                'tier_accuracy_pct': float(tier_accuracy),
            },
            'cv_5fold': {
                'spearman_mean': float(cv_spearman_mean),
                'spearman_std': float(np.std(cv_spearman_scores)),
                'mae_mean': float(np.mean(cv_mae_scores)),
                'mae_std': float(np.std(cv_mae_scores)),
                'r2_mean': float(np.mean(cv_r2_scores)),
                'r2_std': float(np.std(cv_r2_scores)),
            },
            'baseline_68_features': {
                'cv_spearman': baseline_cv_spearman,
                'holdout_spearman': baseline_holdout_spearman,
            },
            'delta': {
                'cv_spearman': float(cv_spearman_mean - (baseline_cv_spearman or 0)),
                'holdout_spearman': float(holdout_spearman - (baseline_holdout_spearman or 0)),
            },
        },
        'hyperparameters': HYPERPARAMETERS,
        'top_features': importance.head(20).to_dict('records'),
        'new_feature_importance': [
            {'feature': sf, 'importance': float(importance[importance['feature'] == sf]['importance'].values[0])}
            for sf in segment_features if sf in importance['feature'].values
        ],
    }

    meta_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(sanitize(metadata), f, indent=2)
    print(f'  Saved: {meta_path}')

    print(f'\n{"=" * 60}')
    print(f'  XGBoost v7 retraining complete (73 features).')
    print(f'  {len(present)} features | {len(df_train)} train | {len(df_holdout)} holdout')
    print(f'  Holdout Spearman: {holdout_spearman:.4f}')
    if baseline_holdout_spearman:
        print(f'  Delta vs 68-feat:  {holdout_spearman - baseline_holdout_spearman:+.4f}')
    print(f'{"=" * 60}')


if __name__ == '__main__':
    main()
