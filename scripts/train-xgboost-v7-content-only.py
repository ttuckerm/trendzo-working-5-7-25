# -*- coding: utf-8 -*-
"""
Retrain XGBoost v7 Model — Content-Only Features (70 features)

Removes 4 account/metadata bias features:
  - meta_creator_followers (bigger accounts get higher scores regardless of content)
  - meta_creator_followers_log (same bias, log-transformed)
  - meta_hashtag_count (TikTok metadata, not content quality)
  - meta_has_viral_hashtag (TikTok metadata, not content quality)

Keeps meta_duration_seconds and meta_words_per_second (come from the video itself).

Uses EXACT same hyperparameters as previous v7:
  n_estimators=98, learning_rate=0.05, max_depth=4, min_child_weight=5,
  subsample=0.8, colsample_bytree=0.7, reg_alpha=0.5, reg_lambda=2.0

Excludes holdout videos.
Saves over v7 model files.
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

# Same hyperparameters as original v7 (locked — do not change)
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

# 4 REMOVED bias features (account metadata, not content quality):
REMOVED_FEATURES = [
    "meta_creator_followers",
    "meta_creator_followers_log",
    "meta_hashtag_count",
    "meta_has_viral_hashtag",
]

# 70 content-only features (74 - 4 removed)
V7_FEATURES = [
    # FFmpeg (12)
    "ffmpeg_scene_changes", "ffmpeg_cuts_per_second", "ffmpeg_avg_motion",
    "ffmpeg_color_variance", "ffmpeg_brightness_avg", "ffmpeg_contrast_score",
    "ffmpeg_resolution_width", "ffmpeg_resolution_height", "ffmpeg_duration_seconds",
    "ffmpeg_bitrate", "ffmpeg_fps", "ffmpeg_has_audio",
    # Audio Prosodic (10)
    "audio_pitch_mean_hz", "audio_pitch_variance", "audio_pitch_range",
    "audio_pitch_std_dev", "audio_pitch_contour_slope",
    "audio_loudness_mean_lufs", "audio_loudness_range", "audio_loudness_variance",
    "audio_silence_ratio", "audio_silence_count",
    # Audio Classifier (4)
    "audio_music_ratio", "audio_speech_ratio", "audio_type_encoded", "audio_energy_variance",
    # Speaking Rate (6)
    "speaking_rate_wpm", "speaking_rate_wpm_variance", "speaking_rate_wpm_acceleration",
    "speaking_rate_wpm_peak_count", "speaking_rate_fast_segments", "speaking_rate_slow_segments",
    # Visual Scene (3)
    "visual_scene_count", "visual_avg_scene_duration", "visual_score",
    # Thumbnail (4)
    "thumb_brightness", "thumb_contrast", "thumb_colorfulness",
    "thumb_overall_score", "thumb_confidence",
    # Hook Scorer (8)
    "hook_score", "hook_confidence", "hook_text_score", "hook_audio_score",
    "hook_visual_score", "hook_pace_score", "hook_tone_score", "hook_type_encoded",
    # Text (13)
    "text_word_count", "text_sentence_count", "text_question_mark_count",
    "text_exclamation_count", "text_transcript_length", "text_avg_sentence_length",
    "text_unique_word_ratio", "text_avg_word_length", "text_syllable_count",
    "text_flesch_reading_ease", "text_has_cta",
    "text_positive_word_count", "text_negative_word_count", "text_emoji_count",
    # Metadata — content-derived only (2)
    "meta_duration_seconds", "meta_words_per_second",
    # FFmpeg Segment (5)
    "hook_motion_ratio", "audio_energy_buildup", "scene_rate_first_half_vs_second",
    "visual_variety_score", "hook_audio_intensity",
    # Vision Hook (3) — hook_composition_score removed (zero importance in prior run)
    "hook_face_present", "hook_text_overlay", "hook_emotion_intensity",
]

# 77 original script features - 4 removed bias - 1 removed zero-importance (hook_composition_score) = 72
# Actual model will use fewer (present filter drops features missing from DB)
assert len(V7_FEATURES) == 72, f"Expected 72 features, got {len(V7_FEATURES)}"
# Verify no bias features leaked in
for rf in REMOVED_FEATURES:
    assert rf not in V7_FEATURES, f"Bias feature {rf} still in feature list!"


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
    print('  XGBoost v7 Retraining — 70 content-only features')
    print('  Removed: meta_creator_followers, meta_creator_followers_log,')
    print('           meta_hashtag_count, meta_has_viral_hashtag')
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

    # ── 4. Prepare features
    present = [f for f in V7_FEATURES if f in df_train.columns]
    missing = [f for f in V7_FEATURES if f not in df_train.columns]

    print(f'\n  Features: {len(present)}/{len(V7_FEATURES)} present')
    if missing:
        print(f'  Missing: {missing}')

    # Verify bias features are NOT present
    for rf in REMOVED_FEATURES:
        if rf in present:
            print(f'  WARNING: Bias feature {rf} found in data but excluded from feature list')

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
    print(f'\n  Training XGBoost v7 with {len(present)} features...')
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

    # Load prior model baseline for comparison
    baseline_meta_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-metadata.json')
    baseline_cv_spearman = None
    baseline_holdout_spearman = None
    baseline_feature_count = None
    if os.path.exists(baseline_meta_path):
        with open(baseline_meta_path) as f:
            baseline = json.load(f)
        baseline_feature_count = baseline.get('feature_count')
        if 'performance' in baseline:
            perf = baseline['performance']
            if 'cv_5fold' in perf:
                baseline_cv_spearman = perf['cv_5fold'].get('spearman_mean')
            if 'holdout' in perf:
                baseline_holdout_spearman = perf['holdout'].get('spearman_rho')

    bl_label = f'{baseline_feature_count}-feat baseline' if baseline_feature_count else 'prior baseline'
    print(f'\n  Performance ({len(present)} features vs {bl_label}):')
    print(f'                       Train       Holdout     {bl_label}')
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

    # ── 9. Save artifacts (overwrites v7 model files)
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
        'changes': f'Removed 4 account-bias features (followers, hashtags). {len(present)} content-only features.',
        'removed_features': REMOVED_FEATURES,
        'holdout_split': True,
        'holdout_count': len(holdout_ids),
        'holdout_file': 'models/holdout-video-ids.json',
        'feature_count': len(present),
        'feature_names': present,
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
            'prior_baseline': {
                'feature_count': baseline_feature_count,
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
    }

    meta_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(sanitize(metadata), f, indent=2)
    print(f'  Saved: {meta_path}')

    print(f'\n  ✅ Model retrained with {len(present)} content-only features')
    print(f'     Removed: {", ".join(REMOVED_FEATURES)}')
    print('=' * 60)


if __name__ == '__main__':
    main()
