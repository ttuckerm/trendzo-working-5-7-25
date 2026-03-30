# -*- coding: utf-8 -*-
"""
Post-Backfill Retrain: v7 with full backfill data

Steps:
  1. Check coverage: count rows with hook_face_present NOT NULL and hook_motion_ratio NOT NULL
  2. Retrain v7 with clean 74-feature set using specified hyperparameters
  3. Print comparison table and top 15 feature importances

Hyperparameters: n_estimators=98, learning_rate=0.05, max_depth=4,
min_child_weight=5, subsample=0.8, colsample_bytree=0.7, reg_alpha=0.5, reg_lambda=2.0

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

# The 74 clean features (from phase1-final)
V7_74_FEATURES = [
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
    # 6 Phase 1 new features (kept after cleanup)
    "hook_motion_ratio", "audio_energy_buildup", "hook_audio_intensity",
    "hook_face_present", "hook_text_overlay", "hook_emotion_intensity",
]

# The 6 new features from Phase 1
NEW_FEATURES = [
    "hook_motion_ratio", "audio_energy_buildup", "hook_audio_intensity",
    "hook_face_present", "hook_text_overlay", "hook_emotion_intensity",
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

    return pd.DataFrame(rows), all_features


def check_coverage(all_features):
    """Step 1: Check coverage of backfilled features."""
    total = len(all_features)
    face_present = sum(1 for f in all_features if f.get('hook_face_present') is not None)
    motion_ratio = sum(1 for f in all_features if f.get('hook_motion_ratio') is not None)
    both = sum(1 for f in all_features
               if f.get('hook_face_present') is not None and f.get('hook_motion_ratio') is not None)

    # Also check all 6 new features
    coverage = {}
    for feat_name in NEW_FEATURES:
        count = sum(1 for f in all_features if f.get(feat_name) is not None)
        coverage[feat_name] = count

    print(f'\n{"=" * 70}')
    print(f'  STEP 1: BACKFILL COVERAGE CHECK')
    print(f'{"=" * 70}')
    print(f'  Total training_features rows: {total}')
    print(f'')
    print(f'  {"Feature":<30} {"Count":<10} {"Pct":<10}')
    print(f'  {"-"*30} {"-"*10} {"-"*10}')
    print(f'  {"hook_face_present NOT NULL":<30} {face_present:<10} {face_present/total*100:.1f}%')
    print(f'  {"hook_motion_ratio NOT NULL":<30} {motion_ratio:<10} {motion_ratio/total*100:.1f}%')
    print(f'  {"BOTH not null":<30} {both:<10} {both/total*100:.1f}%')
    print(f'')
    print(f'  All 6 new features:')
    for feat_name in NEW_FEATURES:
        count = coverage[feat_name]
        print(f'    {feat_name:<30} {count:<10} {count/total*100:.1f}%')

    return {
        'total': total,
        'hook_face_present': face_present,
        'hook_motion_ratio': motion_ratio,
        'both': both,
        'all_features': coverage,
    }


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
    print('  POST-BACKFILL RETRAIN: v7 with full backfill data')
    print('  74 features | Locked hyperparameters | Holdout evaluation')
    print('=' * 70)

    # ── Load holdout IDs
    if not os.path.exists(HOLDOUT_PATH):
        print(f'\n  ERROR: {HOLDOUT_PATH} not found.')
        sys.exit(1)

    with open(HOLDOUT_PATH) as f:
        holdout_data = json.load(f)
    holdout_ids = set(holdout_data['video_ids'])
    print(f'\n  Holdout set: {len(holdout_ids)} videos')

    # ── Load previous metadata for comparison
    meta_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-metadata.json')
    prev_meta = None
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            prev_meta = json.load(f)

    # ── Load data
    load_env()
    df, all_features_raw = fetch_from_supabase()

    # ══════════════════════════════════════════════════════════════════════════
    # STEP 1: Coverage check
    # ══════════════════════════════════════════════════════════════════════════
    coverage = check_coverage(all_features_raw)

    # ══════════════════════════════════════════════════════════════════════════
    # STEP 2: Retrain v7
    # ══════════════════════════════════════════════════════════════════════════

    print(f'\n{"=" * 70}')
    print(f'  STEP 2: RETRAIN v7 (74 features, full backfill)')
    print(f'{"=" * 70}')

    if 'niche_key' in df.columns:
        df = df[df['niche_key'] == 'side-hustles']
    df = df.dropna(subset=['dps_score'])
    print(f'  Side-hustles with DPS: {len(df)} rows')

    df_train = df[~df['video_id'].isin(holdout_ids)].copy()
    df_holdout = df[df['video_id'].isin(holdout_ids)].copy()
    print(f'  Training: {len(df_train)} | Holdout: {len(df_holdout)}')

    present_features = [f for f in V7_74_FEATURES if f in df_train.columns]
    print(f'  Features available: {len(present_features)}/{len(V7_74_FEATURES)}')

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

    X_train, X_holdout = prepare_data(df_train, df_holdout, present_features)
    result = train_and_evaluate(X_train.values, y_train, X_holdout.values, y_holdout, present_features, 'full-backfill')
    m = result['metrics']

    print(f'\n  Retrained model metrics:')
    print(f'    Train Spearman:   {m["train_spearman"]:.4f}')
    print(f'    Holdout Spearman: {m["holdout_spearman"]:.4f} (p={m["holdout_spearman_p"]:.2e})')
    print(f'    Holdout MAE:      {m["holdout_mae"]:.2f}')
    print(f'    Holdout RMSE:     {m["holdout_rmse"]:.2f}')
    print(f'    Holdout R²:       {m["holdout_r2"]:.4f}')
    print(f'    Within ±5 DPS:    {m["within_5_holdout"]:.1f}%')
    print(f'    Within ±10 DPS:   {m["within_10_holdout"]:.1f}%')
    print(f'    Tier accuracy:    {m["tier_accuracy"]:.1f}%')
    print(f'    CV Spearman (5f): {m["cv_spearman_mean"]:.4f} ± {m["cv_spearman_std"]:.4f}')
    print(f'    CV MAE (5f):      {m["cv_mae_mean"]:.2f} ± {m["cv_mae_std"]:.2f}')

    # ── Save model artifacts
    print(f'\n  Saving model artifacts...')
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    model = result['model']
    scaler = result['scaler']

    model_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-model.json')
    model.save_model(model_path)
    print(f'  Saved: {model_path}')

    scaler_json = {
        'mean': scaler.mean_.tolist(),
        'std': scaler.scale_.tolist(),
        'feature_names': present_features,
    }
    scaler_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-scaler.json')
    with open(scaler_path, 'w') as f:
        json.dump(scaler_json, f, indent=2)
    print(f'  Saved: {scaler_path}')

    features_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-features.json')
    with open(features_path, 'w') as f:
        json.dump(present_features, f, indent=2)
    print(f'  Saved: {features_path}')

    # Build baselines from previous metadata
    baselines = {}
    if prev_meta and 'performance' in prev_meta:
        baselines['pre_backfill_74'] = {
            'cv_spearman': prev_meta['performance'].get('cv_5fold', {}).get('spearman_mean'),
            'holdout_spearman': prev_meta['performance'].get('holdout', {}).get('spearman_rho'),
            'holdout_mae': prev_meta['performance'].get('holdout', {}).get('mae'),
            'within_10_holdout': prev_meta['performance'].get('holdout', {}).get('within_10_dps_pct'),
            'tier_accuracy': prev_meta['performance'].get('holdout', {}).get('tier_accuracy_pct'),
        }
        if 'baselines' in prev_meta['performance']:
            for bk, bv in prev_meta['performance']['baselines'].items():
                baselines[bk] = bv

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

    importance = result['importance']

    # Compute deltas vs pre-backfill
    prev_ho = baselines.get('pre_backfill_74', {})
    delta = {}
    if prev_ho.get('holdout_spearman') is not None:
        delta['holdout_spearman'] = m['holdout_spearman'] - prev_ho['holdout_spearman']
    if prev_ho.get('cv_spearman') is not None:
        delta['cv_spearman'] = m['cv_spearman_mean'] - prev_ho['cv_spearman']
    if prev_ho.get('holdout_mae') is not None:
        delta['holdout_mae'] = m['holdout_mae'] - prev_ho['holdout_mae']
    if prev_ho.get('within_10_holdout') is not None:
        delta['within_10_holdout'] = m['within_10_holdout'] - prev_ho['within_10_holdout']
    if prev_ho.get('tier_accuracy') is not None:
        delta['tier_accuracy'] = m['tier_accuracy'] - prev_ho['tier_accuracy']

    metadata = {
        'model_version': MODEL_VERSION,
        'trained_at': datetime.now().isoformat(),
        'source': 'supabase:training_features+scraped_videos',
        'changes': f'Full backfill retrain. FFmpeg segment: {coverage["hook_motion_ratio"]}/{coverage["total"]} videos. Vision hook: {coverage["hook_face_present"]}/{coverage["total"]} videos. Same 74 features, same hyperparameters.',
        'full_backfill': True,
        'holdout_split': True,
        'holdout_count': len(holdout_ids),
        'holdout_file': 'models/holdout-video-ids.json',
        'feature_count': len(present_features),
        'feature_names': present_features,
        'backfill_coverage': {
            'total_rows': coverage['total'],
            'hook_face_present': coverage['hook_face_present'],
            'hook_motion_ratio': coverage['hook_motion_ratio'],
            'both_not_null': coverage['both'],
            'all_features': coverage['all_features'],
        },
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
                'spearman_rho': m['train_spearman'],
                'mae': m['train_mae'],
                'rmse': m['train_rmse'],
                'r2': m['train_r2'],
                'within_10_dps_pct': m['within_10_train'],
            },
            'holdout': {
                'spearman_rho': m['holdout_spearman'],
                'spearman_p_value': m['holdout_spearman_p'],
                'mae': m['holdout_mae'],
                'rmse': m['holdout_rmse'],
                'r2': m['holdout_r2'],
                'within_5_dps_pct': m['within_5_holdout'],
                'within_10_dps_pct': m['within_10_holdout'],
                'tier_accuracy_pct': m['tier_accuracy'],
            },
            'cv_5fold': {
                'spearman_mean': m['cv_spearman_mean'],
                'spearman_std': m['cv_spearman_std'],
                'mae_mean': m['cv_mae_mean'],
                'mae_std': m['cv_mae_std'],
            },
            'baselines': baselines,
            'delta_vs_pre_backfill': delta,
        },
        'hyperparameters': HYPERPARAMETERS,
        'top_features': importance.head(20).to_dict('records'),
        'all_feature_importance': importance.to_dict('records'),
    }

    meta_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(sanitize(metadata), f, indent=2)
    print(f'  Saved: {meta_path}')

    # ══════════════════════════════════════════════════════════════════════════
    # STEP 4: Comparison table + Top 15 feature importances
    # ══════════════════════════════════════════════════════════════════════════

    print(f'\n{"=" * 70}')
    print(f'  COMPARISON: Pre-Backfill vs Post-Backfill')
    print(f'{"=" * 70}')

    def fmt(v, f_str='.4f'):
        if v is None or v == 'N/A':
            return 'N/A'
        return f'{v:{f_str}}'

    pre = baselines.get('pre_backfill_74', {})

    print(f'\n  {"Metric":<25} {"Pre-Backfill":<16} {"Post-Backfill":<16} {"Delta":<12}')
    print(f'  {"-"*25} {"-"*16} {"-"*16} {"-"*12}')

    rows_table = [
        ('Spearman (CV 5-fold)', pre.get('cv_spearman'), m['cv_spearman_mean'], '.4f'),
        ('Spearman (holdout)', pre.get('holdout_spearman'), m['holdout_spearman'], '.4f'),
        ('MAE (holdout)', pre.get('holdout_mae'), m['holdout_mae'], '.2f'),
        ('Within ±10 DPS', pre.get('within_10_holdout'), m['within_10_holdout'], '.1f'),
        ('Tier accuracy', pre.get('tier_accuracy'), m['tier_accuracy'], '.1f'),
    ]

    for label, pre_val, post_val, f_str in rows_table:
        pre_s = fmt(pre_val, f_str) if pre_val is not None else 'N/A'
        post_s = fmt(post_val, f_str)
        if pre_val is not None:
            d = post_val - pre_val
            if f_str == '.4f':
                delta_s = f'{d:+.4f}'
            elif f_str == '.2f':
                delta_s = f'{d:+.2f}'
            else:
                delta_s = f'{d:+.1f}'
        else:
            delta_s = '—'
        # Add % suffix for percentage metrics
        if 'Within' in label or 'accuracy' in label:
            pre_s = pre_s + '%' if pre_s != 'N/A' else pre_s
            post_s = post_s + '%'
            delta_s = delta_s + '%' if delta_s != '—' else delta_s
        print(f'  {label:<25} {pre_s:<16} {post_s:<16} {delta_s:<12}')

    print(f'  {"Train rows":<25} {prev_meta["dataset"]["train_rows"] if prev_meta else "N/A":<16} {len(df_train):<16} {"—":<12}')
    print(f'  {"Holdout rows":<25} {prev_meta["dataset"]["holdout_rows"] if prev_meta else "N/A":<16} {len(df_holdout):<16} {"—":<12}')

    # Top 15 feature importances
    print(f'\n{"=" * 70}')
    print(f'  TOP 15 FEATURE IMPORTANCES')
    print(f'{"=" * 70}')

    # Load previous importances for comparison
    prev_importance_map = {}
    if prev_meta and 'all_feature_importance' in prev_meta:
        for i, fi in enumerate(prev_meta['all_feature_importance']):
            prev_importance_map[fi['feature']] = {
                'rank': i + 1,
                'importance': fi['importance'],
            }

    top15 = importance.head(15)
    print(f'\n  {"Rank":<6} {"Feature":<35} {"Importance":<12} {"Prev Rank":<12} {"New?":<6}')
    print(f'  {"-"*6} {"-"*35} {"-"*12} {"-"*12} {"-"*6}')

    new_feature_appearances = []
    for rank, (_, row) in enumerate(top15.iterrows(), 1):
        feat = row['feature']
        imp = row['importance']
        is_new = feat in NEW_FEATURES
        prev_info = prev_importance_map.get(feat)
        if prev_info:
            prev_rank = str(prev_info['rank'])
            rank_delta = prev_info['rank'] - rank
            if rank_delta > 0:
                prev_rank += f' (↑{rank_delta})'
            elif rank_delta < 0:
                prev_rank += f' (↓{abs(rank_delta)})'
        else:
            prev_rank = 'NEW'
        new_flag = '★' if is_new else ''
        print(f'  {rank:<6} {feat:<35} {imp:<12.6f} {prev_rank:<12} {new_flag:<6}')
        if is_new:
            new_feature_appearances.append((rank, feat, imp))

    if new_feature_appearances:
        print(f'\n  New features in top 15:')
        for rank, feat, imp in new_feature_appearances:
            print(f'    #{rank}: {feat} (importance: {imp:.6f})')
    else:
        print(f'\n  No new features appeared in top 15.')

    # Show where all 6 new features rank
    print(f'\n  All 6 new feature rankings:')
    all_ranked = importance.reset_index(drop=True)
    for feat in NEW_FEATURES:
        match = all_ranked[all_ranked['feature'] == feat]
        if not match.empty:
            idx = match.index[0]
            imp = match['importance'].values[0]
            prev_info = prev_importance_map.get(feat)
            prev_rank_str = f' (was #{prev_info["rank"]})' if prev_info else ''
            print(f'    #{idx+1}: {feat:<30} {imp:.6f}{prev_rank_str}')

    # ══════════════════════════════════════════════════════════════════════════
    # Summary
    # ══════════════════════════════════════════════════════════════════════════

    print(f'\n{"=" * 70}')
    print(f'  POST-BACKFILL RETRAIN COMPLETE')
    print(f'  {len(present_features)} features | {len(df_train)} train | {len(df_holdout)} holdout')
    print(f'  Backfill coverage: {coverage["both"]}/{coverage["total"]} ({coverage["both"]/coverage["total"]*100:.1f}%) have both vision + segment features')
    print(f'  Holdout Spearman: {m["holdout_spearman"]:.4f}' + (f' (delta: {delta.get("holdout_spearman", 0):+.4f})' if delta.get('holdout_spearman') is not None else ''))
    print(f'  CV Spearman:      {m["cv_spearman_mean"]:.4f}' + (f' (delta: {delta.get("cv_spearman", 0):+.4f})' if delta.get('cv_spearman') is not None else ''))
    print(f'{"=" * 70}')
    print(f'\n  Next: Run benchmark + log experiment:')
    print(f'    npx tsx scripts/log-experiment-full-backfill.ts')


if __name__ == '__main__':
    main()
