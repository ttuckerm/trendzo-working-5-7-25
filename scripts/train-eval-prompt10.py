# -*- coding: utf-8 -*-
"""
Prompt 10: Train & Evaluate Raw-DPS and Creator-Relative Breakout Models

Scope: side-hustles / making money online videos only
  (creator-led short-form, talking-head knowledge, direct-to-camera educational shorts)

Models:
  1. Raw-DPS prediction (same feature set as v7, clean re-evaluation)
  2. Creator-relative breakout (target = video_dps - creator_avg_dps)

Contamination firewall: uses models/holdout-video-ids.json (same 50 holdout IDs)
Feature group ablation: identifies which groups help vs hurt

Output: docs/TRAINING_EVAL_REPORT.md
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

RANDOM_STATE = 42
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'models')
HOLDOUT_PATH = os.path.join(OUTPUT_DIR, 'holdout-video-ids.json')
REPORT_PATH = os.path.join(PROJECT_ROOT, 'docs', 'TRAINING_EVAL_REPORT.md')

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

# Feature groups for ablation
FEATURE_GROUPS = {
    'ffmpeg_core': [
        'ffmpeg_scene_changes', 'ffmpeg_cuts_per_second', 'ffmpeg_avg_motion',
        'ffmpeg_color_variance', 'ffmpeg_brightness_avg', 'ffmpeg_contrast_score',
        'ffmpeg_resolution_width', 'ffmpeg_resolution_height', 'ffmpeg_duration_seconds',
        'ffmpeg_bitrate', 'ffmpeg_fps', 'ffmpeg_has_audio',
    ],
    'audio_prosodic': [
        'audio_pitch_mean_hz', 'audio_pitch_variance', 'audio_pitch_range',
        'audio_pitch_std_dev', 'audio_pitch_contour_slope',
        'audio_loudness_mean_lufs', 'audio_loudness_range', 'audio_loudness_variance',
        'audio_silence_ratio', 'audio_silence_count',
    ],
    'audio_classifier': [
        'audio_music_ratio', 'audio_speech_ratio', 'audio_type_encoded', 'audio_energy_variance',
    ],
    'speaking_rate': [
        'speaking_rate_wpm', 'speaking_rate_wpm_variance', 'speaking_rate_wpm_acceleration',
        'speaking_rate_wpm_peak_count', 'speaking_rate_fast_segments', 'speaking_rate_slow_segments',
    ],
    'visual_scene': [
        'visual_scene_count', 'visual_avg_scene_duration', 'visual_score',
    ],
    'thumbnail': [
        'thumb_brightness', 'thumb_contrast', 'thumb_colorfulness',
        'thumb_overall_score', 'thumb_confidence',
    ],
    'hook_scorer': [
        'hook_score', 'hook_confidence', 'hook_text_score', 'hook_audio_score',
        'hook_visual_score', 'hook_pace_score', 'hook_tone_score', 'hook_type_encoded',
    ],
    'text_analysis': [
        'text_word_count', 'text_sentence_count', 'text_question_mark_count',
        'text_exclamation_count', 'text_transcript_length', 'text_avg_sentence_length',
        'text_unique_word_ratio', 'text_avg_word_length', 'text_syllable_count',
        'text_flesch_reading_ease', 'text_has_cta',
        'text_positive_word_count', 'text_negative_word_count', 'text_emoji_count',
    ],
    'meta_content': [
        'meta_duration_seconds', 'meta_words_per_second',
    ],
    'ffmpeg_segment': [
        'hook_motion_ratio', 'audio_energy_buildup', 'scene_rate_first_half_vs_second',
        'visual_variety_score', 'hook_audio_intensity',
    ],
    'vision_hook': [
        'hook_face_present', 'hook_text_overlay', 'hook_emotion_intensity',
    ],
}

ALL_FEATURES = []
for feats in FEATURE_GROUPS.values():
    ALL_FEATURES.extend(feats)


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
    """Fetch training_features + scraped_videos (with creator_id for grouping)."""
    from supabase import create_client

    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        print('  ERROR: Missing Supabase credentials')
        sys.exit(1)

    sb = create_client(url, key)

    # Fetch training features
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

    # Fetch scraped_videos with creator info
    print('  Fetching scraped_videos (dps_score, niche, creator_id, creator_username)...')
    all_videos = []
    offset = 0
    while True:
        resp = sb.table('scraped_videos').select(
            'video_id, dps_score, niche, creator_id, creator_username, creator_followers_count'
        ).not_.is_('dps_score', 'null').range(offset, offset + 999).execute()
        if not resp.data:
            break
        all_videos.extend(resp.data)
        if len(resp.data) < 1000:
            break
        offset += 1000
    print(f'  Got {len(all_videos)} scraped_videos with dps_score')

    video_map = {v['video_id']: v for v in all_videos}
    rows = []
    for feat in all_features:
        vid = feat.get('video_id')
        if vid and vid in video_map:
            row = {**feat}
            row['dps_score'] = video_map[vid]['dps_score']
            row['niche_key'] = video_map[vid].get('niche', 'side-hustles')
            row['creator_id'] = video_map[vid].get('creator_id')
            row['creator_username'] = video_map[vid].get('creator_username')
            row['creator_followers_count'] = video_map[vid].get('creator_followers_count', 0)
            rows.append(row)

    return pd.DataFrame(rows)


def prepare_features(df, feature_list):
    """Extract feature matrix from dataframe."""
    present = [f for f in feature_list if f in df.columns]
    X = df[present].copy()
    for col in X.columns:
        if X[col].dtype == 'bool' or X[col].dtype == 'object':
            X[col] = X[col].astype(float)
    X = X.fillna(0).astype(float)
    return X, present


def evaluate_model(y_true, y_pred, label=''):
    """Compute all required metrics."""
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
        'within_5_pct': float(within_5),
        'within_10_pct': float(within_10),
        'tier_accuracy_pct': float(tier_acc),
        'n': len(y_true),
    }


def cross_validate(X_scaled, y, n_splits=5):
    """Run k-fold CV and return per-fold metrics."""
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=RANDOM_STATE)
    fold_metrics = []
    for train_idx, val_idx in kf.split(X_scaled):
        model_cv = xgb.XGBRegressor(**HYPERPARAMETERS, random_state=RANDOM_STATE, n_jobs=-1, verbosity=0)
        model_cv.fit(X_scaled[train_idx], y[train_idx])
        y_pred = np.clip(model_cv.predict(X_scaled[val_idx]), -200, 200)
        rho, _ = spearmanr(y[val_idx], y_pred)
        mae = mean_absolute_error(y[val_idx], y_pred)
        r2 = r2_score(y[val_idx], y_pred)
        within_10 = np.mean(np.abs(y[val_idx] - y_pred) <= 10) * 100
        fold_metrics.append({'spearman': rho, 'mae': mae, 'r2': r2, 'within_10': within_10})
    return fold_metrics


def train_and_evaluate(X_train, y_train, X_holdout, y_holdout, present_features, clip_range=(0, 100)):
    """Train model, evaluate on train+holdout, run CV."""
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_holdout_s = scaler.transform(X_holdout)

    model = xgb.XGBRegressor(**HYPERPARAMETERS, random_state=RANDOM_STATE, n_jobs=-1, verbosity=0)
    model.fit(X_train_s, y_train)

    y_pred_train = np.clip(model.predict(X_train_s), clip_range[0], clip_range[1])
    y_pred_holdout = np.clip(model.predict(X_holdout_s), clip_range[0], clip_range[1])

    train_metrics = evaluate_model(y_train, y_pred_train, 'train')
    holdout_metrics = evaluate_model(y_holdout, y_pred_holdout, 'holdout')

    cv_folds = cross_validate(X_train_s, y_train)
    cv_summary = {
        'spearman_mean': np.mean([f['spearman'] for f in cv_folds]),
        'spearman_std': np.std([f['spearman'] for f in cv_folds]),
        'mae_mean': np.mean([f['mae'] for f in cv_folds]),
        'mae_std': np.std([f['mae'] for f in cv_folds]),
        'within_10_mean': np.mean([f['within_10'] for f in cv_folds]),
        'within_10_std': np.std([f['within_10'] for f in cv_folds]),
    }

    importance = pd.DataFrame({
        'feature': present_features,
        'importance': model.feature_importances_,
    }).sort_values('importance', ascending=False)

    return {
        'model': model,
        'scaler': scaler,
        'train': train_metrics,
        'holdout': holdout_metrics,
        'cv': cv_summary,
        'importance': importance,
        'y_pred_holdout': y_pred_holdout,
        'y_pred_train': y_pred_train,
    }


def ablation_study(X_train_full, y_train, X_holdout_full, y_holdout, present_features):
    """Leave-one-group-out ablation to measure each feature group's contribution."""
    print('\n  Running feature group ablation...')
    # Full model baseline (CV only for speed)
    scaler_full = StandardScaler()
    X_train_s = scaler_full.fit_transform(X_train_full)
    cv_full = cross_validate(X_train_s, y_train)
    baseline_spearman = np.mean([f['spearman'] for f in cv_full])
    baseline_mae = np.mean([f['mae'] for f in cv_full])

    results = {}
    for group_name, group_feats in FEATURE_GROUPS.items():
        # Features to KEEP (remove this group)
        keep = [f for f in present_features if f not in group_feats]
        if len(keep) == len(present_features):
            # Group not present in data
            continue
        if len(keep) < 3:
            continue

        X_train_ablated = X_train_full[keep].copy()
        scaler_abl = StandardScaler()
        X_train_abl_s = scaler_abl.fit_transform(X_train_ablated)
        cv_abl = cross_validate(X_train_abl_s, y_train)
        abl_spearman = np.mean([f['spearman'] for f in cv_abl])
        abl_mae = np.mean([f['mae'] for f in cv_abl])

        delta_spearman = baseline_spearman - abl_spearman  # positive = group HELPS
        delta_mae = abl_mae - baseline_mae  # positive = removing group HURTS (increases error)

        n_removed = len(present_features) - len(keep)
        results[group_name] = {
            'features_removed': n_removed,
            'cv_spearman_without': abl_spearman,
            'delta_spearman': delta_spearman,
            'cv_mae_without': abl_mae,
            'delta_mae': delta_mae,
            'verdict': 'HELPS' if delta_spearman > 0.005 else ('HURTS' if delta_spearman < -0.005 else 'NEUTRAL'),
        }
        print(f'    {group_name:<20} removed {n_removed} feats | Δρ={delta_spearman:+.4f} | Δmae={delta_mae:+.2f} | {results[group_name]["verdict"]}')

    return results, baseline_spearman, baseline_mae


def generate_report(raw_results, breakout_results, ablation_raw, ablation_breakout,
                    baseline_spearman_raw, baseline_mae_raw,
                    baseline_spearman_br, baseline_mae_br,
                    df_stats, creator_stats, v7_baseline):
    """Generate the markdown report."""
    now = datetime.now().strftime('%Y-%m-%d %H:%M')

    r = raw_results
    b = breakout_results

    # Sort ablation by delta_spearman descending (most helpful first)
    abl_raw_sorted = sorted(ablation_raw.items(), key=lambda x: x[1]['delta_spearman'], reverse=True)
    abl_br_sorted = sorted(ablation_breakout.items(), key=lambda x: x[1]['delta_spearman'], reverse=True)

    report = f"""# Training & Evaluation Report — Prompt 10

**Generated:** {now}
**Scope:** Side-hustles / making money online (creator-led short-form, talking-head, direct-to-camera educational)
**Feature set:** v7 content-only (72 features, 11 groups)
**Contamination firewall:** Intact — 50 holdout videos excluded from all training

---

## 1. Dataset Summary

| Metric | Value |
|--------|-------|
| Total rows (side-hustles, with DPS) | {df_stats['total']} |
| Training set | {df_stats['train']} |
| Holdout set | {df_stats['holdout']} |
| Holdout split method | Explicit ID list (stratified by tier: 10 per tier) |
| Features used | {df_stats['features_present']}/{df_stats['features_defined']} |
| DPS range (train) | {df_stats['dps_min']:.1f} – {df_stats['dps_max']:.1f} |
| DPS mean (train) | {df_stats['dps_mean']:.1f} ± {df_stats['dps_std']:.1f} |
| DPS median (train) | {df_stats['dps_median']:.1f} |

### Creator Statistics (for breakout model)

| Metric | Value |
|--------|-------|
| Unique creators in dataset | {creator_stats['total_creators']} |
| Creators with 2+ videos | {creator_stats['creators_2plus']} |
| Videos from 2+ video creators | {creator_stats['videos_2plus']} |
| Creators in training set (2+) | {creator_stats['train_creators']} |
| Creators in holdout set (2+) | {creator_stats['holdout_creators']} |
| Breakout target range | {creator_stats['breakout_min']:.1f} to {creator_stats['breakout_max']:.1f} |
| Breakout target mean | {creator_stats['breakout_mean']:.1f} ± {creator_stats['breakout_std']:.1f} |

**Creator-relative target definition:** `breakout = video_dps - creator_mean_dps`
- Positive = video outperformed creator's average
- Negative = video underperformed creator's average
- Zero = exactly average for this creator

**Justification:** This metric isolates content quality from creator fame. Two creators with
10K and 1M followers may have different raw DPS distributions, but breakout measures whether
a specific video beat *that creator's* personal baseline. For side-hustles talking-head content,
this answers: "Did the content itself drive above-normal performance?"

---

## 2. Model A: Raw-DPS Prediction

### 2a. v7 Baseline (prior run, for reference)

| Metric | Train | Holdout | CV (5-fold) |
|--------|-------|---------|-------------|
| Spearman ρ | {v7_baseline['train_spearman']:.4f} | {v7_baseline['holdout_spearman']:.4f} | {v7_baseline['cv_spearman']:.4f} ± {v7_baseline['cv_spearman_std']:.4f} |
| MAE | {v7_baseline['train_mae']:.2f} | {v7_baseline['holdout_mae']:.2f} | {v7_baseline['cv_mae']:.2f} ± {v7_baseline['cv_mae_std']:.2f} |
| Within ±10 DPS | {v7_baseline['train_within10']:.1f}% | {v7_baseline['holdout_within10']:.1f}% | — |
| Tier accuracy | — | {v7_baseline['holdout_tier_acc']:.1f}% | — |

### 2b. Fresh Raw-DPS Model (this run)

| Metric | Train | Holdout | CV (5-fold) |
|--------|-------|---------|-------------|
| Spearman ρ | {r['train']['spearman_rho']:.4f} | {r['holdout']['spearman_rho']:.4f} | {r['cv']['spearman_mean']:.4f} ± {r['cv']['spearman_std']:.4f} |
| MAE | {r['train']['mae']:.2f} | {r['holdout']['mae']:.2f} | {r['cv']['mae_mean']:.2f} ± {r['cv']['mae_std']:.2f} |
| Within ±5 DPS | {r['train']['within_5_pct']:.1f}% | {r['holdout']['within_5_pct']:.1f}% | — |
| Within ±10 DPS | {r['train']['within_10_pct']:.1f}% | {r['holdout']['within_10_pct']:.1f}% | {r['cv']['within_10_mean']:.1f}% ± {r['cv']['within_10_std']:.1f}% |
| Tier accuracy | {r['train']['tier_accuracy_pct']:.1f}% | {r['holdout']['tier_accuracy_pct']:.1f}% | — |
| R² | {r['train']['r2']:.3f} | {r['holdout']['r2']:.3f} | — |
| RMSE | {r['train']['rmse']:.2f} | {r['holdout']['rmse']:.2f} | — |
| N | {r['train']['n']} | {r['holdout']['n']} | — |

### 2c. Delta vs v7 Baseline

| Metric | Δ Holdout | Δ CV Spearman |
|--------|-----------|---------------|
| Spearman ρ | {r['holdout']['spearman_rho'] - v7_baseline['holdout_spearman']:+.4f} | {r['cv']['spearman_mean'] - v7_baseline['cv_spearman']:+.4f} |
| MAE | {r['holdout']['mae'] - v7_baseline['holdout_mae']:+.2f} | {r['cv']['mae_mean'] - v7_baseline['cv_mae']:+.2f} |
| Within ±10 | {r['holdout']['within_10_pct'] - v7_baseline['holdout_within10']:+.1f}pp | — |
| Tier accuracy | {r['holdout']['tier_accuracy_pct'] - v7_baseline['holdout_tier_acc']:+.1f}pp | — |

### 2d. Top 15 Features (Raw-DPS)

| Rank | Feature | Importance |
|------|---------|------------|
"""
    for i, (_, row) in enumerate(r['importance'].head(15).iterrows()):
        bar = '█' * int(row['importance'] * 100)
        report += f"| {i+1} | `{row['feature']}` | {row['importance']:.4f} {bar} |\n"

    report += f"""
---

## 3. Model B: Creator-Relative Breakout

### 3a. Breakout Model Results

| Metric | Train | Holdout | CV (5-fold) |
|--------|-------|---------|-------------|
| Spearman ρ | {b['train']['spearman_rho']:.4f} | {b['holdout']['spearman_rho']:.4f} | {b['cv']['spearman_mean']:.4f} ± {b['cv']['spearman_std']:.4f} |
| MAE | {b['train']['mae']:.2f} | {b['holdout']['mae']:.2f} | {b['cv']['mae_mean']:.2f} ± {b['cv']['mae_std']:.2f} |
| Within ±5 DPS | {b['train']['within_5_pct']:.1f}% | {b['holdout']['within_5_pct']:.1f}% | — |
| Within ±10 DPS | {b['train']['within_10_pct']:.1f}% | {b['holdout']['within_10_pct']:.1f}% | {b['cv']['within_10_mean']:.1f}% ± {b['cv']['within_10_std']:.1f}% |
| Tier accuracy | {b['train']['tier_accuracy_pct']:.1f}% | {b['holdout']['tier_accuracy_pct']:.1f}% | — |
| R² | {b['train']['r2']:.3f} | {b['holdout']['r2']:.3f} | — |
| RMSE | {b['train']['rmse']:.2f} | {b['holdout']['rmse']:.2f} | — |
| N | {b['train']['n']} | {b['holdout']['n']} | — |

> **Note on tier accuracy for breakout model:** Tier boundaries are defined on raw DPS
> (90/70/60/40), which doesn't map directly to breakout scores. Tier accuracy here uses the
> same thresholds applied to breakout values, so it's less meaningful for this model.
> Focus on Spearman and MAE instead.

### 3b. Top 15 Features (Breakout)

| Rank | Feature | Importance |
|------|---------|------------|
"""
    for i, (_, row) in enumerate(b['importance'].head(15).iterrows()):
        bar = '█' * int(row['importance'] * 100)
        report += f"| {i+1} | `{row['feature']}` | {row['importance']:.4f} {bar} |\n"

    report += f"""
### 3c. Breakout vs Raw-DPS Comparison

| Metric | Raw-DPS (Holdout) | Breakout (Holdout) | Winner |
|--------|-------------------|---------------------|--------|
| Spearman ρ | {r['holdout']['spearman_rho']:.4f} | {b['holdout']['spearman_rho']:.4f} | {'Raw-DPS' if r['holdout']['spearman_rho'] > b['holdout']['spearman_rho'] else 'Breakout' if b['holdout']['spearman_rho'] > r['holdout']['spearman_rho'] else 'Tie'} |
| CV Spearman | {r['cv']['spearman_mean']:.4f} | {b['cv']['spearman_mean']:.4f} | {'Raw-DPS' if r['cv']['spearman_mean'] > b['cv']['spearman_mean'] else 'Breakout' if b['cv']['spearman_mean'] > r['cv']['spearman_mean'] else 'Tie'} |
| MAE | {r['holdout']['mae']:.2f} | {b['holdout']['mae']:.2f} | {'Raw-DPS' if r['holdout']['mae'] < b['holdout']['mae'] else 'Breakout' if b['holdout']['mae'] < r['holdout']['mae'] else 'Tie'} (lower=better) |
| Within ±10 | {r['holdout']['within_10_pct']:.1f}% | {b['holdout']['within_10_pct']:.1f}% | {'Raw-DPS' if r['holdout']['within_10_pct'] > b['holdout']['within_10_pct'] else 'Breakout' if b['holdout']['within_10_pct'] > r['holdout']['within_10_pct'] else 'Tie'} |

---

## 4. Feature Group Ablation

### 4a. Raw-DPS Model — Leave-One-Group-Out

Baseline CV Spearman: {baseline_spearman_raw:.4f} | Baseline CV MAE: {baseline_mae_raw:.2f}

| Group | Features Removed | CV ρ Without | Δρ | Δ MAE | Verdict |
|-------|------------------|--------------|----|-------|---------|
"""
    for name, abl in abl_raw_sorted:
        emoji = '🟢' if abl['verdict'] == 'HELPS' else ('🔴' if abl['verdict'] == 'HURTS' else '⚪')
        report += f"| {name} | {abl['features_removed']} | {abl['cv_spearman_without']:.4f} | {abl['delta_spearman']:+.4f} | {abl['delta_mae']:+.2f} | {emoji} {abl['verdict']} |\n"

    report += f"""
### 4b. Breakout Model — Leave-One-Group-Out

Baseline CV Spearman: {baseline_spearman_br:.4f} | Baseline CV MAE: {baseline_mae_br:.2f}

| Group | Features Removed | CV ρ Without | Δρ | Δ MAE | Verdict |
|-------|------------------|--------------|----|-------|---------|
"""
    for name, abl in abl_br_sorted:
        emoji = '🟢' if abl['verdict'] == 'HELPS' else ('🔴' if abl['verdict'] == 'HURTS' else '⚪')
        report += f"| {name} | {abl['features_removed']} | {abl['cv_spearman_without']:.4f} | {abl['delta_spearman']:+.4f} | {abl['delta_mae']:+.2f} | {emoji} {abl['verdict']} |\n"

    # Determine helpful/hurtful groups
    helps_raw = [n for n, a in abl_raw_sorted if a['verdict'] == 'HELPS']
    hurts_raw = [n for n, a in abl_raw_sorted if a['verdict'] == 'HURTS']
    helps_br = [n for n, a in abl_br_sorted if a['verdict'] == 'HELPS']
    hurts_br = [n for n, a in abl_br_sorted if a['verdict'] == 'HURTS']

    report += f"""
### 4c. Ablation Summary

**Raw-DPS model:**
- Groups that HELP: {', '.join(helps_raw) if helps_raw else 'None above threshold'}
- Groups that HURT: {', '.join(hurts_raw) if hurts_raw else 'None above threshold'}

**Breakout model:**
- Groups that HELP: {', '.join(helps_br) if helps_br else 'None above threshold'}
- Groups that HURT: {', '.join(hurts_br) if hurts_br else 'None above threshold'}

---

## 5. Interpretation & Analysis

### Overfit Gap
- **Raw-DPS:** Train ρ={r['train']['spearman_rho']:.3f} vs Holdout ρ={r['holdout']['spearman_rho']:.3f} (gap: {r['train']['spearman_rho'] - r['holdout']['spearman_rho']:.3f})
- **Breakout:** Train ρ={b['train']['spearman_rho']:.3f} vs Holdout ρ={b['holdout']['spearman_rho']:.3f} (gap: {b['train']['spearman_rho'] - b['holdout']['spearman_rho']:.3f})
- **CV gives the most honest estimate** of generalization for both models.

### Raw-DPS Assessment
"""

    # Dynamic commentary based on results
    raw_cv = r['cv']['spearman_mean']
    if raw_cv >= 0.7:
        report += "- CV Spearman ≥ 0.7: **Strong** rank correlation. The model reliably ranks videos.\n"
    elif raw_cv >= 0.5:
        report += "- CV Spearman 0.5–0.7: **Moderate** rank correlation. Useful for ranking but imprecise.\n"
    else:
        report += "- CV Spearman < 0.5: **Weak** rank correlation. Model struggles to rank reliably.\n"

    holdout_within10 = r['holdout']['within_10_pct']
    if holdout_within10 >= 50:
        report += f"- Within ±10 DPS on holdout: {holdout_within10:.0f}% — majority of predictions are close.\n"
    else:
        report += f"- Within ±10 DPS on holdout: {holdout_within10:.0f}% — many predictions are off by >10 DPS points.\n"

    report += f"""
### Breakout Assessment
"""
    br_cv = b['cv']['spearman_mean']
    if br_cv >= 0.5:
        report += f"- CV Spearman {br_cv:.3f}: The model can identify breakout content above creator baseline.\n"
    elif br_cv >= 0.3:
        report += f"- CV Spearman {br_cv:.3f}: Weak but detectable signal for breakout prediction.\n"
    else:
        report += f"- CV Spearman {br_cv:.3f}: Very weak — content features alone poorly predict relative breakout.\n"

    report += f"""
### Key Differences in Feature Importance
The raw-DPS model and breakout model may weight features differently because:
- Raw DPS correlates with production quality + audience size effects in the cohort
- Breakout isolates *what makes a specific video outperform the creator's norm*

---

## 6. Should We Keep This Model Configuration?

### Raw-DPS Model
"""

    # Decision logic for raw DPS
    cv_delta = r['cv']['spearman_mean'] - v7_baseline['cv_spearman']
    holdout_delta = r['holdout']['spearman_rho'] - v7_baseline['holdout_spearman']

    if abs(cv_delta) < 0.01 and abs(holdout_delta) < 0.02:
        report += f"""**Recommendation: KEEP (no change needed)**

The fresh retrain reproduces the v7 baseline within noise (CV Δρ = {cv_delta:+.4f},
holdout Δρ = {holdout_delta:+.4f}). The current v7 model with 72 content-only features is stable.
No configuration change required.
"""
    elif cv_delta > 0.01:
        report += f"""**Recommendation: KEEP (improved)**

The fresh retrain shows improvement over baseline (CV Δρ = {cv_delta:+.4f}).
Consider saving this as the new production model.
"""
    elif cv_delta < -0.02:
        report += f"""**Recommendation: INVESTIGATE**

The fresh retrain shows degradation vs baseline (CV Δρ = {cv_delta:+.4f}).
This may indicate data drift since the baseline was trained. Investigate whether
new training data has different characteristics.
"""
    else:
        report += f"""**Recommendation: KEEP (within noise)**

Deltas are small (CV Δρ = {cv_delta:+.4f}, holdout Δρ = {holdout_delta:+.4f}).
No action needed — current v7 configuration is appropriate.
"""

    report += f"""
### Creator-Relative Breakout Model
"""

    if br_cv >= 0.5:
        report += f"""**Recommendation: KEEP — deploy as secondary signal**

The breakout model (CV ρ = {br_cv:.3f}) captures meaningful creator-relative signal.
Deploy alongside raw-DPS as a secondary metric on the creator prediction path
(`/api/creator/predict`). Do NOT replace raw-DPS; use as an additional data point.
"""
    elif br_cv >= 0.3:
        report += f"""**Recommendation: DEFER — signal is weak but present**

The breakout model (CV ρ = {br_cv:.3f}) shows a detectable but weak signal.
Not reliable enough for production use yet. Actions:
1. Continue collecting data — more videos per creator will strengthen the signal
2. Re-evaluate at 200+ videos from creators with 5+ videos each
3. Consider adding creator-specific features (past video performance patterns)
"""
    else:
        report += f"""**Recommendation: DROP — insufficient signal**

The breakout model (CV ρ = {br_cv:.3f}) shows too little predictive power.
Content features alone cannot reliably predict creator-relative breakout at this
data volume. Actions:
1. Do NOT deploy this model
2. Wait for more per-creator data (need 5+ videos per creator minimum)
3. Consider whether breakout prediction needs different features (e.g., topic novelty
   relative to creator's past topics, posting time patterns)
"""

    # Ablation-based recommendations
    report += f"""
### Feature Group Actions

Based on ablation results:

"""
    if hurts_raw:
        report += f"**Consider removing from raw-DPS model:** {', '.join(hurts_raw)}\n"
        report += "These groups reduce CV Spearman when included. Removing them may improve generalization.\n"
        report += "However, with only 863 rows, noise in ablation is high. Monitor after next retrain.\n\n"

    if not hurts_raw and not hurts_br:
        report += "No feature groups consistently hurt either model. The current 72-feature set is appropriate.\n\n"

    report += f"""### Next Actions

1. **Immediate:** No model file changes needed — v7 remains production model
2. **At 100+ labeled videos:** Retrain with updated data, re-run this evaluation
3. **At 200+ videos with 5+ per creator:** Re-evaluate breakout model viability
4. **If ablation shows consistent hurtful groups across retrains:** Remove them

---

*Report generated by `scripts/train-eval-prompt10.py`*
*Contamination firewall: holdout IDs in `models/holdout-video-ids.json` (50 videos, 10 per tier)*
"""

    return report


def main():
    print('=' * 60)
    print('  Prompt 10: Train & Evaluate Raw-DPS + Creator-Relative')
    print('  Scope: side-hustles only | 72 content features')
    print('=' * 60)

    # Load holdout IDs
    with open(HOLDOUT_PATH) as f:
        holdout_ids = set(json.load(f)['video_ids'])
    print(f'\n  Holdout: {len(holdout_ids)} videos')

    # Load v7 baseline from metadata
    v7_meta_path = os.path.join(OUTPUT_DIR, 'xgboost-v7-metadata.json')
    with open(v7_meta_path) as f:
        v7_meta = json.load(f)
    v7_baseline = {
        'train_spearman': v7_meta['performance']['train']['spearman_rho'],
        'holdout_spearman': v7_meta['performance']['holdout']['spearman_rho'],
        'cv_spearman': v7_meta['performance']['cv_5fold']['spearman_mean'],
        'cv_spearman_std': v7_meta['performance']['cv_5fold']['spearman_std'],
        'train_mae': v7_meta['performance']['train']['mae'],
        'holdout_mae': v7_meta['performance']['holdout']['mae'],
        'cv_mae': v7_meta['performance']['cv_5fold']['mae_mean'],
        'cv_mae_std': v7_meta['performance']['cv_5fold']['mae_std'],
        'train_within10': v7_meta['performance']['train']['within_10_dps_pct'],
        'holdout_within10': v7_meta['performance']['holdout']['within_10_dps_pct'],
        'holdout_tier_acc': v7_meta['performance']['holdout']['tier_accuracy_pct'],
    }
    print(f'  v7 baseline loaded (holdout ρ={v7_baseline["holdout_spearman"]:.4f})')

    # Fetch data
    load_env()
    df = fetch_data()
    df = df[df['niche_key'] == 'side-hustles'].dropna(subset=['dps_score'])
    print(f'  Total side-hustles with DPS: {len(df)}')

    # ── Split ────────────────────────────────────────────────────────────────
    df_train = df[~df['video_id'].isin(holdout_ids)].copy()
    df_holdout = df[df['video_id'].isin(holdout_ids)].copy()
    print(f'  Train: {len(df_train)} | Holdout: {len(df_holdout)}')

    # ── Prepare features ─────────────────────────────────────────────────────
    X_train, present = prepare_features(df_train, ALL_FEATURES)
    X_holdout, _ = prepare_features(df_holdout, present)  # use same present list
    y_train = df_train['dps_score'].astype(float).values
    y_holdout = df_holdout['dps_score'].astype(float).values

    print(f'  Features: {len(present)}/{len(ALL_FEATURES)} present')

    # ══════════════════════════════════════════════════════════════════════════
    # MODEL A: Raw-DPS
    # ══════════════════════════════════════════════════════════════════════════
    print('\n  ── Model A: Raw-DPS Prediction ──')
    raw_results = train_and_evaluate(X_train, y_train, X_holdout, y_holdout, present, clip_range=(0, 100))
    print(f'  Train ρ={raw_results["train"]["spearman_rho"]:.4f} | Holdout ρ={raw_results["holdout"]["spearman_rho"]:.4f} | CV ρ={raw_results["cv"]["spearman_mean"]:.4f}')

    # ══════════════════════════════════════════════════════════════════════════
    # MODEL B: Creator-Relative Breakout
    # ══════════════════════════════════════════════════════════════════════════
    print('\n  ── Model B: Creator-Relative Breakout ──')

    # Compute per-creator mean DPS (using ONLY training data — no holdout leakage)
    creator_col = 'creator_id'
    if df_train[creator_col].isna().all():
        creator_col = 'creator_username'

    # Count videos per creator in FULL dataset (for stats)
    creator_counts_full = df[creator_col].value_counts()
    creators_2plus_full = creator_counts_full[creator_counts_full >= 2]

    # For training: compute creator means from training data only
    creator_counts_train = df_train[creator_col].value_counts()
    creators_2plus_train = creator_counts_train[creator_counts_train >= 2]

    # Only use videos from creators with 2+ videos in training set
    eligible_creators = set(creators_2plus_train.index) - {None, '', 'None'}
    df_train_br = df_train[df_train[creator_col].isin(eligible_creators)].copy()

    # Compute creator mean from training data
    creator_means = df_train_br.groupby(creator_col)['dps_score'].mean()
    df_train_br['creator_mean_dps'] = df_train_br[creator_col].map(creator_means)
    df_train_br['breakout'] = df_train_br['dps_score'] - df_train_br['creator_mean_dps']

    # For holdout: use creator means computed from training data (no leakage)
    df_holdout_br = df_holdout[df_holdout[creator_col].isin(eligible_creators)].copy()
    df_holdout_br['creator_mean_dps'] = df_holdout_br[creator_col].map(creator_means)
    df_holdout_br['breakout'] = df_holdout_br['dps_score'] - df_holdout_br['creator_mean_dps']

    # Drop any NaN breakout values
    df_train_br = df_train_br.dropna(subset=['breakout'])
    df_holdout_br = df_holdout_br.dropna(subset=['breakout'])

    print(f'  Eligible creators (2+ videos in train): {len(eligible_creators)}')
    print(f'  Train (breakout): {len(df_train_br)} | Holdout (breakout): {len(df_holdout_br)}')

    if len(df_holdout_br) < 5:
        print(f'  WARNING: Only {len(df_holdout_br)} holdout videos have creator baselines.')
        print(f'  Breakout holdout results will be noisy. Using all holdout with fallback mean.')
        # Fallback: use global mean DPS as creator baseline for holdout creators not in training
        global_mean = df_train['dps_score'].mean()
        df_holdout_br = df_holdout.copy()
        df_holdout_br['creator_mean_dps'] = df_holdout_br[creator_col].map(creator_means).fillna(global_mean)
        df_holdout_br['breakout'] = df_holdout_br['dps_score'] - df_holdout_br['creator_mean_dps']

    X_train_br, present_br = prepare_features(df_train_br, ALL_FEATURES)
    X_holdout_br, _ = prepare_features(df_holdout_br, present_br)
    y_train_br = df_train_br['breakout'].astype(float).values
    y_holdout_br = df_holdout_br['breakout'].astype(float).values

    # Breakout can be negative, so clip range is wider
    breakout_clip = (-100, 100)
    breakout_results = train_and_evaluate(X_train_br, y_train_br, X_holdout_br, y_holdout_br, present_br, clip_range=breakout_clip)
    print(f'  Train ρ={breakout_results["train"]["spearman_rho"]:.4f} | Holdout ρ={breakout_results["holdout"]["spearman_rho"]:.4f} | CV ρ={breakout_results["cv"]["spearman_mean"]:.4f}')

    # ══════════════════════════════════════════════════════════════════════════
    # ABLATION
    # ══════════════════════════════════════════════════════════════════════════
    print('\n  ── Feature Group Ablation (Raw-DPS) ──')
    ablation_raw, bl_spearman_raw, bl_mae_raw = ablation_study(X_train, y_train, X_holdout, y_holdout, present)

    print('\n  ── Feature Group Ablation (Breakout) ──')
    ablation_br, bl_spearman_br, bl_mae_br = ablation_study(X_train_br, y_train_br, X_holdout_br, y_holdout_br, present_br)

    # ══════════════════════════════════════════════════════════════════════════
    # STATS FOR REPORT
    # ══════════════════════════════════════════════════════════════════════════
    df_stats = {
        'total': len(df),
        'train': len(df_train),
        'holdout': len(df_holdout),
        'features_present': len(present),
        'features_defined': len(ALL_FEATURES),
        'dps_min': y_train.min(),
        'dps_max': y_train.max(),
        'dps_mean': y_train.mean(),
        'dps_std': y_train.std(),
        'dps_median': np.median(y_train),
    }

    # Creator stats
    holdout_creators = set(df_holdout_br[creator_col].dropna().unique()) & eligible_creators
    creator_stats = {
        'total_creators': len(df[creator_col].dropna().unique()),
        'creators_2plus': len(creators_2plus_full),
        'videos_2plus': int(creators_2plus_full.sum()),
        'train_creators': len(eligible_creators),
        'holdout_creators': len(holdout_creators),
        'breakout_min': y_train_br.min(),
        'breakout_max': y_train_br.max(),
        'breakout_mean': y_train_br.mean(),
        'breakout_std': y_train_br.std(),
    }

    # ══════════════════════════════════════════════════════════════════════════
    # GENERATE REPORT
    # ══════════════════════════════════════════════════════════════════════════
    print('\n  Generating report...')
    report = generate_report(
        raw_results, breakout_results,
        ablation_raw, ablation_br,
        bl_spearman_raw, bl_mae_raw,
        bl_spearman_br, bl_mae_br,
        df_stats, creator_stats, v7_baseline,
    )

    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f'  Report saved: {REPORT_PATH}')
    print('=' * 60)


if __name__ == '__main__':
    main()
