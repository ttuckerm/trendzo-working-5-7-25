# -*- coding: utf-8 -*-
"""
Phase 1 Final Cleanup: Feature importance analysis + retrain without zero-importance features

Steps:
  1. Load current v7 model (77 features), print ALL features ranked by importance
  2. Flag which of the 9 new features (5 FFmpeg + 4 Vision) have zero importance
  3. Retrain WITHOUT zero-importance features using original v7 hyperparameters
  4. Report comparison vs previous iterations

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

# The 9 new features added in Phase 1
FFMPEG_SEGMENT_FEATURES = [
    "hook_motion_ratio", "audio_energy_buildup", "scene_rate_first_half_vs_second",
    "visual_variety_score", "hook_audio_intensity",
]

VISION_FEATURES = [
    "hook_face_present", "hook_text_overlay",
    "hook_composition_score", "hook_emotion_intensity",
]

ALL_NEW_FEATURES = FFMPEG_SEGMENT_FEATURES + VISION_FEATURES

# Full 77-feature list (current v7)
V7_77_FEATURES = [
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
    # 5 FFmpeg segment features
    "hook_motion_ratio", "audio_energy_buildup", "scene_rate_first_half_vs_second",
    "visual_variety_score", "hook_audio_intensity",
    # 4 Vision hook features
    "hook_face_present", "hook_text_overlay", "hook_composition_score",
    "hook_emotion_intensity",
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


def train_and_evaluate(X_train, y_train, X_holdout, y_holdout, feature_names, label):
    """Train model and return all metrics."""
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_holdout_s = scaler.transform(X_holdout)

    model = xgb.XGBRegressor(
        **HYPERPARAMETERS,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbosity=0,
    )
    model.fit(X_train_s, y_train)

    y_pred_train = np.clip(model.predict(X_train_s), 0, 100)
    y_pred_holdout = np.clip(model.predict(X_holdout_s), 0, 100)

    train_spearman, _ = spearmanr(y_train, y_pred_train)
    holdout_spearman, holdout_spearman_p = spearmanr(y_holdout, y_pred_holdout)
    train_mae = mean_absolute_error(y_train, y_pred_train)
    holdout_mae = mean_absolute_error(y_holdout, y_pred_holdout)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
    holdout_rmse = np.sqrt(mean_squared_error(y_holdout, y_pred_holdout))
    train_r2 = r2_score(y_train, y_pred_train)
    holdout_r2 = r2_score(y_holdout, y_pred_holdout)
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
    for train_idx, val_idx in kf.split(X_train_s):
        model_cv = xgb.XGBRegressor(**HYPERPARAMETERS, random_state=RANDOM_STATE, n_jobs=-1, verbosity=0)
        model_cv.fit(X_train_s[train_idx], y_train[train_idx])
        y_cv_pred = model_cv.predict(X_train_s[val_idx])
        rho, _ = spearmanr(y_train[val_idx], y_cv_pred)
        cv_spearman_scores.append(rho)
        cv_mae_scores.append(mean_absolute_error(y_train[val_idx], y_cv_pred))

    importance = pd.DataFrame({
        'feature': feature_names,
        'importance': model.feature_importances_,
    }).sort_values('importance', ascending=False)

    return {
        'model': model,
        'scaler': scaler,
        'importance': importance,
        'feature_names': feature_names,
        'metrics': {
            'train_spearman': float(train_spearman),
            'holdout_spearman': float(holdout_spearman),
            'holdout_spearman_p': float(holdout_spearman_p),
            'train_mae': float(train_mae),
            'holdout_mae': float(holdout_mae),
            'train_rmse': float(train_rmse),
            'holdout_rmse': float(holdout_rmse),
            'train_r2': float(train_r2),
            'holdout_r2': float(holdout_r2),
            'within_5_holdout': float(within_5_holdout),
            'within_10_train': float(within_10_train),
            'within_10_holdout': float(within_10_holdout),
            'tier_accuracy': float(tier_accuracy),
            'cv_spearman_mean': float(np.mean(cv_spearman_scores)),
            'cv_spearman_std': float(np.std(cv_spearman_scores)),
            'cv_mae_mean': float(np.mean(cv_mae_scores)),
            'cv_mae_std': float(np.std(cv_mae_scores)),
        },
    }


def main():
    print('=' * 70)
    print('  PHASE 1 FINAL CLEANUP')
    print('  Feature importance analysis → Remove zeros → Retrain → Evaluate')
    print('=' * 70)

    # ── 1. Load holdout IDs
    if not os.path.exists(HOLDOUT_PATH):
        print(f'\n  ERROR: {HOLDOUT_PATH} not found.')
        sys.exit(1)

    with open(HOLDOUT_PATH) as f:
        holdout_data = json.load(f)
    holdout_ids = set(holdout_data['video_ids'])
    print(f'\n  Holdout set: {len(holdout_ids)} videos')

    # ── 2. Load previous metadata for baselines
    meta_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-metadata.json')
    prev_meta = None
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            prev_meta = json.load(f)

    # ── 3. Load data
    load_env()
    df = fetch_from_supabase()
    print(f'  Loaded {len(df)} total rows')

    if 'niche_key' in df.columns:
        df = df[df['niche_key'] == 'side-hustles']
    df = df.dropna(subset=['dps_score'])
    print(f'  Side-hustles with DPS: {len(df)} rows')

    df_train = df[~df['video_id'].isin(holdout_ids)].copy()
    df_holdout = df[df['video_id'].isin(holdout_ids)].copy()
    print(f'  Training: {len(df_train)} | Holdout: {len(df_holdout)}')

    # ── 4. Prepare full 77-feature data
    present_77 = [f for f in V7_77_FEATURES if f in df_train.columns]
    print(f'\n  Features available: {len(present_77)}/{len(V7_77_FEATURES)}')

    def prepare_data(df_tr, df_ho, features):
        X_tr = df_tr[features].copy()
        X_ho = df_ho[features].copy()
        for col in X_tr.columns:
            if X_tr[col].dtype == 'bool' or X_tr[col].dtype == 'object':
                X_tr[col] = X_tr[col].astype(float)
                X_ho[col] = X_ho[col].astype(float)
        X_tr = X_tr.fillna(0).astype(float)
        X_ho = X_ho.fillna(0).astype(float)
        return X_tr, X_ho

    y_train = df_train['dps_score'].astype(float).values
    y_holdout = df_holdout['dps_score'].astype(float).values

    # ══════════════════════════════════════════════════════════════════════════
    # STEP 1: Feature importance analysis on current 77-feature model
    # ══════════════════════════════════════════════════════════════════════════

    print(f'\n{"=" * 70}')
    print(f'  STEP 1: Feature Importance Analysis (77 features)')
    print(f'{"=" * 70}')

    X_train_77, X_holdout_77 = prepare_data(df_train, df_holdout, present_77)
    result_77 = train_and_evaluate(X_train_77.values, y_train, X_holdout_77.values, y_holdout, present_77, '77-feat')

    importance = result_77['importance']

    print(f'\n  ALL {len(present_77)} features ranked by importance:')
    print(f'  {"Rank":<6} {"Feature":<45} {"Importance":<12} {"Source":<15}')
    print(f'  {"-"*6} {"-"*45} {"-"*12} {"-"*15}')
    for rank, (_, row) in enumerate(importance.iterrows(), 1):
        feat = row['feature']
        imp = row['importance']
        if feat in FFMPEG_SEGMENT_FEATURES:
            source = 'FFmpeg segment'
        elif feat in VISION_FEATURES:
            source = 'Vision hook'
        else:
            source = 'Original v7'
        flag = ' *** ZERO ***' if imp == 0 else ''
        print(f'  {rank:<6} {feat:<45} {imp:<12.6f} {source:<15}{flag}')

    # Identify zero-importance features among new features
    zero_new = []
    nonzero_new = []
    print(f'\n  Phase 1 new features summary:')
    print(f'  {"Feature":<45} {"Importance":<12} {"Rank":<6} {"Verdict":<10}')
    print(f'  {"-"*45} {"-"*12} {"-"*6} {"-"*10}')
    for feat in ALL_NEW_FEATURES:
        if feat in importance['feature'].values:
            imp = importance[importance['feature'] == feat]['importance'].values[0]
            rank_pos = list(importance['feature']).index(feat) + 1
            if imp == 0:
                zero_new.append(feat)
                verdict = 'REMOVE'
            else:
                nonzero_new.append(feat)
                verdict = 'KEEP'
            print(f'  {feat:<45} {imp:<12.6f} {rank_pos:<6} {verdict:<10}')

    print(f'\n  Zero-importance new features: {len(zero_new)}')
    for f in zero_new:
        print(f'    - {f}')
    print(f'  Non-zero new features (kept): {len(nonzero_new)}')
    for f in nonzero_new:
        print(f'    + {f}')

    if not zero_new:
        print(f'\n  No zero-importance features found. Skipping retrain.')
        return

    # ══════════════════════════════════════════════════════════════════════════
    # STEP 2: Retrain without zero-importance features
    # ══════════════════════════════════════════════════════════════════════════

    clean_features = [f for f in present_77 if f not in zero_new]
    print(f'\n{"=" * 70}')
    print(f'  STEP 2: Retrain — {len(clean_features)} features (removed {len(zero_new)})')
    print(f'{"=" * 70}')

    X_train_clean, X_holdout_clean = prepare_data(df_train, df_holdout, clean_features)
    result_clean = train_and_evaluate(X_train_clean.values, y_train, X_holdout_clean.values, y_holdout, clean_features, 'clean')

    m_clean = result_clean['metrics']
    m_77 = result_77['metrics']

    print(f'\n  Clean model ({len(clean_features)} features) vs 77-feature model:')
    print(f'                       77-feat      Clean       Delta')
    d_sp = m_clean['holdout_spearman'] - m_77['holdout_spearman']
    d_mae = m_clean['holdout_mae'] - m_77['holdout_mae']
    d_w10 = m_clean['within_10_holdout'] - m_77['within_10_holdout']
    d_tier = m_clean['tier_accuracy'] - m_77['tier_accuracy']
    d_cv = m_clean['cv_spearman_mean'] - m_77['cv_spearman_mean']
    print(f'    Holdout Spearman : {m_77["holdout_spearman"]:7.4f}    {m_clean["holdout_spearman"]:7.4f}    {d_sp:+.4f}')
    print(f'    Holdout MAE      : {m_77["holdout_mae"]:7.2f}    {m_clean["holdout_mae"]:7.2f}    {d_mae:+.2f}')
    print(f'    Within +/-10 DPS : {m_77["within_10_holdout"]:6.1f}%    {m_clean["within_10_holdout"]:6.1f}%    {d_w10:+.1f}%')
    print(f'    Tier accuracy    : {m_77["tier_accuracy"]:6.1f}%    {m_clean["tier_accuracy"]:6.1f}%    {d_tier:+.1f}%')
    print(f'    CV Spearman (5f) : {m_77["cv_spearman_mean"]:7.4f}    {m_clean["cv_spearman_mean"]:7.4f}    {d_cv:+.4f}')

    # Top 10 features of clean model
    clean_importance = result_clean['importance']
    print(f'\n  Top 10 features (clean model):')
    for rank, (_, row) in enumerate(clean_importance.head(10).iterrows(), 1):
        bar = '#' * int(row['importance'] * 200)
        print(f'    {rank:>2}. {row["feature"]:<40} {row["importance"]:.4f}  {bar}')

    # ══════════════════════════════════════════════════════════════════════════
    # STEP 3: Save clean model artifacts
    # ══════════════════════════════════════════════════════════════════════════

    print(f'\n{"=" * 70}')
    print(f'  STEP 3: Save clean model artifacts')
    print(f'{"=" * 70}')

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    model = result_clean['model']
    scaler = result_clean['scaler']

    model_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-model.json')
    model.save_model(model_path)
    print(f'  Saved: {model_path}')

    scaler_json = {
        'mean': scaler.mean_.tolist(),
        'std': scaler.scale_.tolist(),
        'feature_names': clean_features,
    }
    scaler_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-scaler.json')
    with open(scaler_path, 'w') as f:
        json.dump(scaler_json, f, indent=2)
    print(f'  Saved: {scaler_path}')

    features_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-features.json')
    with open(features_path, 'w') as f:
        json.dump(clean_features, f, indent=2)
    print(f'  Saved: {features_path}')

    # Build baselines chain
    baselines = {}
    if prev_meta and 'performance' in prev_meta:
        # Current 77-feature model becomes a baseline
        baselines['77_features'] = {
            'cv_spearman': prev_meta['performance'].get('cv_5fold', {}).get('spearman_mean'),
            'holdout_spearman': prev_meta['performance'].get('holdout', {}).get('spearman_rho'),
        }
        # Preserve 73-feature baseline if it exists
        if 'baseline_73_features' in prev_meta['performance']:
            baselines['73_features'] = prev_meta['performance']['baseline_73_features']

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
        'changes': f'Phase 1 final cleanup: removed {len(zero_new)} zero-importance features ({", ".join(zero_new)}). {len(clean_features)} features total.',
        'phase1_final': True,
        'holdout_split': True,
        'holdout_count': len(holdout_ids),
        'holdout_file': 'models/holdout-video-ids.json',
        'feature_count': len(clean_features),
        'feature_names': clean_features,
        'features_removed': zero_new,
        'features_kept_new': nonzero_new,
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
                'spearman_rho': m_clean['train_spearman'],
                'mae': m_clean['train_mae'],
                'rmse': m_clean['train_rmse'],
                'r2': m_clean['train_r2'],
                'within_10_dps_pct': m_clean['within_10_train'],
            },
            'holdout': {
                'spearman_rho': m_clean['holdout_spearman'],
                'spearman_p_value': m_clean['holdout_spearman_p'],
                'mae': m_clean['holdout_mae'],
                'rmse': m_clean['holdout_rmse'],
                'r2': m_clean['holdout_r2'],
                'within_5_dps_pct': m_clean['within_5_holdout'],
                'within_10_dps_pct': m_clean['within_10_holdout'],
                'tier_accuracy_pct': m_clean['tier_accuracy'],
            },
            'cv_5fold': {
                'spearman_mean': m_clean['cv_spearman_mean'],
                'spearman_std': m_clean['cv_spearman_std'],
                'mae_mean': m_clean['cv_mae_mean'],
                'mae_std': m_clean['cv_mae_std'],
            },
            'baselines': baselines,
            'delta_vs_77': {
                'cv_spearman': d_cv,
                'holdout_spearman': d_sp,
                'holdout_mae': d_mae,
                'within_10_dps': d_w10,
                'tier_accuracy': d_tier,
            },
        },
        'hyperparameters': HYPERPARAMETERS,
        'top_features': clean_importance.head(20).to_dict('records'),
        'all_feature_importance': clean_importance.to_dict('records'),
    }

    meta_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(sanitize(metadata), f, indent=2)
    print(f'  Saved: {meta_path}')

    # ══════════════════════════════════════════════════════════════════════════
    # STEP 4: Comparison table
    # ══════════════════════════════════════════════════════════════════════════

    print(f'\n{"=" * 70}')
    print(f'  PHASE 1 COMPARISON TABLE')
    print(f'{"=" * 70}')

    # Reconstruct baseline numbers
    b73_cv = baselines.get('73_features', {}).get('cv_spearman', 'N/A')
    b73_ho = baselines.get('73_features', {}).get('holdout_spearman', 'N/A')
    b77_cv = baselines.get('77_features', {}).get('cv_spearman', 'N/A')
    b77_ho = baselines.get('77_features', {}).get('holdout_spearman', 'N/A')

    print(f'\n  {"Metric":<22} {"Orig v7(68)":<14} {"+FFmpeg(73)":<14} {"+Vision(77)":<14} {"Final Clean":<14} {"Delta(77→C)":<12}')
    print(f'  {"-"*22} {"-"*14} {"-"*14} {"-"*14} {"-"*14} {"-"*12}')

    def fmt(v, f_str='.4f'):
        if v is None or v == 'N/A':
            return 'N/A'
        return f'{v:{f_str}}'

    # We have: 73-feat baseline, 77-feat baseline, clean results
    # 68-feat baseline is not preserved in current metadata chain
    print(f'  {"Spearman (CV)":<22} {"—":<14} {fmt(b73_cv):<14} {fmt(b77_cv):<14} {fmt(m_clean["cv_spearman_mean"]):<14} {d_cv:+.4f}')
    print(f'  {"Spearman (holdout)":<22} {"—":<14} {fmt(b73_ho):<14} {fmt(b77_ho):<14} {fmt(m_clean["holdout_spearman"]):<14} {d_sp:+.4f}')
    print(f'  {"MAE (holdout)":<22} {"—":<14} {"—":<14} {fmt(m_77["holdout_mae"], ".2f"):<14} {fmt(m_clean["holdout_mae"], ".2f"):<14} {d_mae:+.2f}')
    print(f'  {"Within ±10 (holdout)":<22} {"—":<14} {"—":<14} {fmt(m_77["within_10_holdout"], ".1f")+"%":<14} {fmt(m_clean["within_10_holdout"], ".1f")+"%":<14} {d_w10:+.1f}%')
    print(f'  {"Tier accuracy":<22} {"—":<14} {"—":<14} {fmt(m_77["tier_accuracy"], ".1f")+"%":<14} {fmt(m_clean["tier_accuracy"], ".1f")+"%":<14} {d_tier:+.1f}%')
    print(f'  {"Feature count":<22} {"68":<14} {"73":<14} {"77":<14} {str(len(clean_features)):<14} {len(clean_features)-77:+d}')
    print(f'\n  Top 10 features (final clean model):')
    for rank, (_, row) in enumerate(clean_importance.head(10).iterrows(), 1):
        print(f'    {rank:>2}. {row["feature"]}')

    # ══════════════════════════════════════════════════════════════════════════
    # Summary
    # ══════════════════════════════════════════════════════════════════════════

    print(f'\n{"=" * 70}')
    print(f'  PHASE 1 FINAL CLEANUP COMPLETE')
    print(f'  {len(clean_features)} features | {len(df_train)} train | {len(df_holdout)} holdout')
    print(f'  Removed: {", ".join(zero_new)}')
    print(f'  Kept new: {", ".join(nonzero_new)}')
    print(f'  Holdout Spearman: {m_clean["holdout_spearman"]:.4f} (delta vs 77: {d_sp:+.4f})')
    print(f'  CV Spearman:      {m_clean["cv_spearman_mean"]:.4f} (delta vs 77: {d_cv:+.4f})')
    print(f'{"=" * 70}')


if __name__ == '__main__':
    main()
