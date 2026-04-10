# -*- coding: utf-8 -*-
"""
v12 Sandbox Retrain — Same pipeline as v10, fresh data pull.
No pandas dependency (numpy + dicts only) for faster startup.

SANDBOX ONLY — does NOT overwrite the production v10 model.

Usage:
  python -u scripts/train-v12-sandbox.py
"""

import sys
import os
import json
import time

sys.stdout.reconfigure(encoding='utf-8')

print('Loading numpy...', flush=True)
import numpy as np
print('numpy loaded', flush=True)

print('Loading xgboost (native DMatrix API only)...', flush=True)
t0 = time.time()
import xgboost as xgb
print(f'xgboost {xgb.__version__} loaded in {time.time()-t0:.1f}s', flush=True)

from datetime import datetime

def pf(*args, **kw):
    kw.setdefault('flush', True)
    print(*args, **kw)

RANDOM_STATE = 42
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(PROJECT_ROOT, 'models')
SANDBOX_DIR = os.path.join(PROJECT_ROOT, 'data', 'sandbox')
HOLDOUT_PATH = os.path.join(MODELS_DIR, 'holdout-video-ids.json')
V10_META_PATH = os.path.join(MODELS_DIR, 'xgboost-v10-metadata.json')

os.makedirs(SANDBOX_DIR, exist_ok=True)

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

V9_NEW = ['text_overlay_density', 'visual_proof_ratio', 'vocal_confidence_composite']
V10_NEW = [
    'creator_followers_log', 'post_hour_utc', 'post_day_of_week',
    'specificity_score', 'instructional_density', 'has_step_structure', 'hedge_word_density',
]
V10_FEATURES = V8_FEATURES + V9_NEW + V10_NEW  # 58

NUM_BOOST_ROUNDS = 413

XGB_PARAMS = {
    'objective': 'reg:squarederror',
    'max_depth': 8,
    'learning_rate': 0.025847050593221715,
    'min_child_weight': 5,
    'subsample': 0.7064306141071703,
    'colsample_bytree': 0.716878246792974,
    'reg_alpha': 0.6170624733980454,
    'reg_lambda': 4.9455883361853195,
    'nthread': -1,
    'verbosity': 0,
    'seed': 42,
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
    """Fetch training data from Supabase (same as v10 pipeline)."""
    from supabase import create_client

    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        pf('  ERROR: Missing Supabase credentials in .env.local')
        sys.exit(1)

    sb = create_client(url, key)

    pf('  Fetching training_features...')
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
    pf(f'  Got {len(all_features)} training_features rows')

    pf('  Fetching scraped_videos with dps_score...')
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
    pf(f'  Got {len(all_videos)} scraped_videos with dps_score')

    pf('  Fetching labeled prediction_runs (actual_dps)...')
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
    pf(f'  Got {len(actual_dps_map)} videos with actual_dps (learning loop)')

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

    pf(f'  Ground truth: {actual_used} from learning loop, {len(rows) - actual_used} from scraped dps_score')
    return rows


def build_matrices(rows, feature_list):
    """Build X, y numpy arrays from list of dicts. Returns (X, y, video_ids, present_features)."""
    present = [f for f in feature_list if any(f in r for r in rows[:10])]
    n = len(rows)
    m = len(present)
    X = np.zeros((n, m))
    y = np.zeros(n)
    video_ids = []

    for i, row in enumerate(rows):
        video_ids.append(row.get('video_id', ''))
        y[i] = float(row.get('dps_score', 0))
        for j, feat in enumerate(present):
            val = row.get(feat)
            if val is not None:
                try:
                    X[i, j] = float(val)
                except (ValueError, TypeError):
                    X[i, j] = 0.0

    return X, y, video_ids, present


def manual_mae(y_true, y_pred):
    return float(np.mean(np.abs(y_true - y_pred)))

def manual_rmse(y_true, y_pred):
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

def manual_r2(y_true, y_pred):
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    return float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0

def _rank_array(arr):
    """Compute fractional ranks (handles ties via average method)."""
    arr = np.asarray(arr, dtype=float)
    n = len(arr)
    order = np.argsort(arr)
    ranks = np.empty(n, dtype=float)
    i = 0
    while i < n:
        j = i
        while j < n - 1 and arr[order[j + 1]] == arr[order[j]]:
            j += 1
        avg_rank = (i + j) / 2.0 + 1.0
        for k in range(i, j + 1):
            ranks[order[k]] = avg_rank
        i = j + 1
    return ranks

def manual_spearman(x, y):
    """Spearman rank correlation without scipy."""
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    rx = _rank_array(x)
    ry = _rank_array(y)
    n = len(x)
    mean_rx = np.mean(rx)
    mean_ry = np.mean(ry)
    cov = np.sum((rx - mean_rx) * (ry - mean_ry))
    std_rx = np.sqrt(np.sum((rx - mean_rx) ** 2))
    std_ry = np.sqrt(np.sum((ry - mean_ry) ** 2))
    if std_rx == 0 or std_ry == 0:
        return 0.0, 1.0
    rho = cov / (std_rx * std_ry)
    # Approximate p-value using t-distribution
    if abs(rho) >= 1.0:
        p = 0.0
    else:
        t_stat = rho * np.sqrt((n - 2) / (1 - rho ** 2))
        # Use normal approximation for large n
        p = 2.0 * (1.0 - 0.5 * (1.0 + np.math.erf(abs(t_stat) / np.sqrt(2.0))))
    return float(rho), float(p)

class ManualScaler:
    """Drop-in replacement for sklearn.preprocessing.StandardScaler."""
    def __init__(self):
        self.mean_ = None
        self.scale_ = None

    def fit_transform(self, X):
        self.mean_ = np.mean(X, axis=0)
        self.scale_ = np.std(X, axis=0)
        self.scale_[self.scale_ == 0] = 1.0
        return (X - self.mean_) / self.scale_

    def transform(self, X):
        return (X - self.mean_) / self.scale_


def evaluate_model(y_true, y_pred):
    mae = manual_mae(y_true, y_pred)
    rmse = manual_rmse(y_true, y_pred)
    r2 = manual_r2(y_true, y_pred)
    rho, p = manual_spearman(y_true, y_pred)
    within_5 = float(np.mean(np.abs(y_true - y_pred) <= 5) * 100)
    within_10 = float(np.mean(np.abs(y_true - y_pred) <= 10) * 100)

    actual_tiers = [classify_tier(d) for d in y_true]
    pred_tiers = [classify_tier(d) for d in y_pred]
    tier_acc = sum(a == p for a, p in zip(actual_tiers, pred_tiers)) / len(y_true) * 100

    return {
        'spearman_rho': float(rho), 'spearman_p': float(p),
        'mae': mae, 'rmse': rmse, 'r2': r2,
        'within_5_dps_pct': within_5, 'within_10_dps_pct': within_10,
        'tier_accuracy_pct': float(tier_acc), 'n': len(y_true),
    }


def cross_validate(X_scaled, y, n_splits=5):
    n = len(y)
    indices = np.arange(n)
    rng = np.random.RandomState(RANDOM_STATE)
    rng.shuffle(indices)
    fold_size = n // n_splits
    fold_metrics = []

    for fold_i in range(n_splits):
        start = fold_i * fold_size
        end = start + fold_size if fold_i < n_splits - 1 else n
        val_idx = indices[start:end]
        train_idx = np.concatenate([indices[:start], indices[end:]])

        dtrain = xgb.DMatrix(X_scaled[train_idx], label=y[train_idx])
        dval = xgb.DMatrix(X_scaled[val_idx])
        bst = xgb.train(XGB_PARAMS, dtrain, num_boost_round=NUM_BOOST_ROUNDS)
        y_pred = np.clip(bst.predict(dval), 0, 100)
        rho, _ = manual_spearman(y[val_idx], y_pred)
        mae = manual_mae(y[val_idx], y_pred)
        within_10 = float(np.mean(np.abs(y[val_idx] - y_pred) <= 10) * 100)
        fold_metrics.append({'spearman': float(rho), 'mae': float(mae), 'within_10': float(within_10)})
        pf(f'    Fold {fold_i+1}/{n_splits}: rho={rho:.4f}, MAE={mae:.2f}, +/-10={within_10:.1f}%')
    return fold_metrics


def main():
    pf('=' * 66)
    pf('  v12 SANDBOX Retrain — Same pipeline as v10, fresh data pull')
    pf('  Output: data/sandbox/ — NOT production')
    pf('  Features: 58 (identical to V10_FEATURES)')
    pf('=' * 66)

    # ─── Load holdout + v10 baseline ──────────────────────────────────────
    with open(HOLDOUT_PATH) as f:
        holdout_data = json.load(f)
    holdout_ids = set(holdout_data['video_ids'])
    pf(f'\n  Holdout: {len(holdout_ids)} videos (same as v10)')

    with open(V10_META_PATH) as f:
        v10_meta = json.load(f)
    v10 = {
        'cv_spearman': v10_meta['performance']['cv_5fold']['spearman_mean'],
        'cv_spearman_std': v10_meta['performance']['cv_5fold']['spearman_std'],
        'cv_mae': v10_meta['performance']['cv_5fold']['mae_mean'],
        'holdout_spearman': v10_meta['performance']['holdout']['spearman_rho'],
        'holdout_mae': v10_meta['performance']['holdout']['mae'],
        'holdout_within_10': v10_meta['performance']['holdout']['within_10_dps_pct'],
        'holdout_tier_acc': v10_meta['performance']['holdout']['tier_accuracy_pct'],
        'train_rows': v10_meta['dataset']['train_rows'],
        'total_rows': v10_meta['dataset']['total_rows'],
    }
    pf(f'  v10 baseline: {v10["total_rows"]} rows, CV ρ={v10["cv_spearman"]:.4f}, holdout ρ={v10["holdout_spearman"]:.4f}')

    # ═══════════════════════════════════════════════════════════════════════
    # STEP 1: CONFIRM TRAINING DATA
    # ═══════════════════════════════════════════════════════════════════════
    pf(f'\n{"=" * 66}')
    pf(f'  STEP 1: Confirm Training Data')
    pf(f'{"=" * 66}\n')

    load_env()
    t0 = time.time()
    all_rows = fetch_data()
    pf(f'  Fetch completed in {time.time()-t0:.1f}s')

    # Filter to side-hustles with valid dps_score
    rows = [r for r in all_rows if r.get('niche_key') == 'side-hustles' and r.get('dps_score') is not None]
    pf(f'\n  Pre-filter: {len(all_rows)} rows')
    pf(f'  After side-hustles + dps_score filter: {len(rows)}')

    # Feature coverage check
    pf(f'\n  Feature coverage (of {len(rows)} rows):')
    coverage = []
    for feat in V10_FEATURES:
        nn = sum(1 for r in rows if r.get(feat) is not None)
        coverage.append((feat, nn, nn / len(rows) * 100 if rows else 0))
    coverage.sort(key=lambda x: x[1])
    for feat, nn, pct in coverage[:10]:
        pf(f'    {feat:<35s} {nn:>5d}/{len(rows)} ({pct:>5.1f}%)')
    if len(coverage) > 10:
        pf(f'    ... ({len(coverage) - 10} more features with >= {coverage[10][2]:.0f}% coverage)')

    # Full feature rows
    full_feat_count = 0
    present_cols = [f for f in V10_FEATURES if any(r.get(f) is not None for r in rows[:10])]
    for r in rows:
        if all(r.get(f) is not None for f in present_cols):
            full_feat_count += 1

    pf(f'\n  ── Training Data Summary ──')
    pf(f'  Total side-hustles with DPS:           {len(rows)}')
    pf(f'  With FULL feature vector ({len(present_cols)} non-null): {full_feat_count}')
    pf(f'  v10 had:                                {v10["total_rows"]} rows')
    pf(f'  Delta:                                  {len(rows) - v10["total_rows"]:+d} rows')

    # Split
    train_rows = [r for r in rows if r.get('video_id') not in holdout_ids]
    holdout_rows = [r for r in rows if r.get('video_id') in holdout_ids]
    pf(f'  Train: {len(train_rows)} | Holdout: {len(holdout_rows)}')

    # ═══════════════════════════════════════════════════════════════════════
    # STEP 2: RETRAIN
    # ═══════════════════════════════════════════════════════════════════════
    pf(f'\n{"=" * 66}')
    pf(f'  STEP 2: Retrain v12-sandbox')
    pf(f'{"=" * 66}\n')

    pf(f'  xgboost {xgb.__version__} loaded (native API, no sklearn)')

    X_train, y_train, vid_train, present_feats = build_matrices(train_rows, V10_FEATURES)
    X_holdout, y_holdout, vid_holdout, _ = build_matrices(holdout_rows, present_feats)

    pf(f'  Features used: {len(present_feats)}/{len(V10_FEATURES)}')
    pf(f'  Training: {X_train.shape[0]} rows x {X_train.shape[1]} features')
    pf(f'  Holdout:  {X_holdout.shape[0]} rows x {X_holdout.shape[1]} features')
    pf(f'  Target stats (train): min={y_train.min():.1f}, max={y_train.max():.1f}, mean={y_train.mean():.1f}, std={y_train.std():.1f}')

    scaler = ManualScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_holdout_s = scaler.transform(X_holdout)

    pf(f'\n  Training XGBoost (v8 Optuna hyperparams, {NUM_BOOST_ROUNDS} rounds)...')
    t0 = time.time()
    dtrain = xgb.DMatrix(X_train_s, label=y_train, feature_names=present_feats)
    dholdout = xgb.DMatrix(X_holdout_s, label=y_holdout, feature_names=present_feats)
    model = xgb.train(XGB_PARAMS, dtrain, num_boost_round=NUM_BOOST_ROUNDS)
    pf(f'  Model trained in {time.time()-t0:.1f}s')

    y_pred_train = np.clip(model.predict(dtrain), 0, 100)
    y_pred_holdout = np.clip(model.predict(dholdout), 0, 100)

    metrics_train = evaluate_model(y_train, y_pred_train)
    metrics_holdout = evaluate_model(y_holdout, y_pred_holdout)

    pf(f'  Train:   ρ={metrics_train["spearman_rho"]:.4f}, MAE={metrics_train["mae"]:.2f}')
    pf(f'  Holdout: ρ={metrics_holdout["spearman_rho"]:.4f}, MAE={metrics_holdout["mae"]:.2f}')

    # 5-fold CV
    pf(f'\n  Running 5-fold cross-validation...')
    t0 = time.time()
    cv_folds = cross_validate(X_train_s, y_train)
    pf(f'  CV done in {time.time()-t0:.1f}s')

    cv_spearman = np.mean([f['spearman'] for f in cv_folds])
    cv_spearman_std = np.std([f['spearman'] for f in cv_folds])
    cv_mae = np.mean([f['mae'] for f in cv_folds])
    cv_mae_std = np.std([f['mae'] for f in cv_folds])
    cv_within10 = np.mean([f['within_10'] for f in cv_folds])

    pf(f'  CV Spearman: {cv_spearman:.4f} +/- {cv_spearman_std:.4f}')
    pf(f'  CV MAE:      {cv_mae:.2f} +/- {cv_mae_std:.2f}')
    pf(f'  CV +/-10 DPS: {cv_within10:.1f}%')

    # Feature importance (native API returns dict: feature_name -> importance)
    imp_dict = model.get_score(importance_type='weight')
    # Normalize to sum to 1 (like sklearn's feature_importances_)
    total = sum(imp_dict.values()) if imp_dict else 1
    importances = [(f, imp_dict.get(f, 0) / total) for f in present_feats]
    importances.sort(key=lambda x: x[1], reverse=True)

    # Save artifacts
    pf(f'\n  Saving v12-sandbox artifacts to data/sandbox/...')

    model_path = os.path.join(SANDBOX_DIR, 'xgboost-v12-sandbox-model.json')
    model.save_model(model_path)
    pf(f'    Model: {model_path}')
    pf(f'    (native xgb.Booster format — NOT sklearn wrapper)')

    features_path = os.path.join(SANDBOX_DIR, 'xgboost-v12-sandbox-features.json')
    with open(features_path, 'w') as f:
        json.dump(present_feats, f, indent=2)

    scaler_path = os.path.join(SANDBOX_DIR, 'xgboost-v12-sandbox-scaler.json')
    with open(scaler_path, 'w') as f:
        json.dump({
            'mean': scaler.mean_.tolist(),
            'std': scaler.scale_.tolist(),
            'feature_names': present_feats,
        }, f, indent=2)

    # ═══════════════════════════════════════════════════════════════════════
    # STEP 3: EVALUATE & COMPARE
    # ═══════════════════════════════════════════════════════════════════════
    pf(f'\n{"=" * 66}')
    pf(f'  STEP 3: Evaluate & Compare (v12-sandbox vs v10)')
    pf(f'{"=" * 66}\n')

    d_cv = cv_spearman - v10['cv_spearman']
    d_ho = metrics_holdout['spearman_rho'] - v10['holdout_spearman']
    d_mae = metrics_holdout['mae'] - v10['holdout_mae']
    d_w10 = metrics_holdout['within_10_dps_pct'] - v10['holdout_within_10']
    d_tier = metrics_holdout['tier_accuracy_pct'] - v10['holdout_tier_acc']

    pf(f'  {"Metric":<28s} {"v10 (prod)":<18s} {"v12 (sandbox)":<18s} {"Delta":<10s}')
    pf(f'  {"=" * 74}')
    pf(f'  {"Training rows":<28s} {v10["total_rows"]:<18d} {len(rows):<18d} {len(rows)-v10["total_rows"]:+d}')
    pf(f'  {"CV Spearman rho":<28s} {v10["cv_spearman"]:<18.4f} {cv_spearman:<18.4f} {d_cv:+.4f}')
    pf(f'  {"CV Spearman std":<28s} {v10["cv_spearman_std"]:<18.4f} {cv_spearman_std:<18.4f}')
    pf(f'  {"CV MAE":<28s} {v10["cv_mae"]:<18.2f} {cv_mae:<18.2f} {cv_mae-v10["cv_mae"]:+.2f}')
    pf(f'  {"Holdout Spearman rho":<28s} {v10["holdout_spearman"]:<18.4f} {metrics_holdout["spearman_rho"]:<18.4f} {d_ho:+.4f}')
    pf(f'  {"Holdout MAE":<28s} {v10["holdout_mae"]:<18.2f} {metrics_holdout["mae"]:<18.2f} {d_mae:+.2f}')
    pf(f'  {"Holdout +/-10 DPS":<28s} {v10["holdout_within_10"]:<17.1f}% {metrics_holdout["within_10_dps_pct"]:<17.1f}% {d_w10:+.1f}%')
    pf(f'  {"Holdout Tier Accuracy":<28s} {v10["holdout_tier_acc"]:<17.1f}% {metrics_holdout["tier_accuracy_pct"]:<17.1f}% {d_tier:+.1f}%')

    # Top 15 features
    pf(f'\n  -- Top 15 Features (v12-sandbox) --')
    v10_top = v10_meta.get('top_features', [])
    v10_rank_map = {f['feature']: i + 1 for i, f in enumerate(v10_top)}
    v10_imp_map = {f['feature']: f['importance'] for f in v10_top}

    pf(f'  {"Rank":<6s} {"Feature":<38s} {"Import.":<10s} {"v10 Rank":<10s} {"Delta":<10s}')
    pf(f'  {"-" * 74}')
    for i, (feat, imp) in enumerate(importances[:15]):
        v10r = str(v10_rank_map.get(feat, '-'))
        v10i = v10_imp_map.get(feat)
        ds = f'{imp - v10i:+.4f}' if v10i is not None else ''
        marker = ' *NEW*' if feat in V10_NEW else ''
        pf(f'  {i+1:<6d} {feat + marker:<38s} {imp:<10.4f} {v10r:<10s} {ds:<10s}')

    # Dropped from v10 top 20
    v12_top15 = set(f for f, _ in importances[:15])
    v10_top20 = set(f['feature'] for f in v10_top[:20])

    pf(f'\n  -- Features in v10 top 20 that dropped out of v12 top 15 --')
    dropped = v10_top20 - v12_top15
    if dropped:
        for feat in sorted(dropped, key=lambda f: v10_rank_map.get(f, 99)):
            v10r = v10_rank_map.get(feat, '?')
            v12_pairs = [(f, imp) for f, imp in importances if f == feat]
            if v12_pairs:
                v12_imp = v12_pairs[0][1]
                v12_rank = sum(1 for _, imp in importances if imp > v12_imp) + 1
                pf(f'    {feat}: v10 #{v10r} -> v12 #{v12_rank} (imp={v12_imp:.4f})')
            else:
                pf(f'    {feat}: v10 #{v10r} -> NOT IN v12')
    else:
        pf(f'    (none)')

    pf(f'\n  -- New features in v12 top 15 (not in v10 top 20) --')
    emerged = v12_top15 - v10_top20
    if emerged:
        for feat in sorted(emerged, key=lambda f: next((imp for fn, imp in importances if fn == f), 0), reverse=True):
            v12_pairs = [(f, imp) for f, imp in importances if f == feat]
            if v12_pairs:
                v12_imp = v12_pairs[0][1]
                v12_rank = sum(1 for _, imp in importances if imp > v12_imp) + 1
                pf(f'    {feat}: v12 #{v12_rank} (imp={v12_imp:.4f})')
    else:
        pf(f'    (none)')

    # Save metadata
    metadata = {
        'model_version': 'v12-sandbox',
        'trained_at': datetime.now().isoformat(),
        'WARNING': 'SANDBOX ONLY. Do NOT overwrite v10.',
        'source': 'supabase:training_features+scraped_videos (same as v10)',
        'feature_count': len(present_feats),
        'feature_names': present_feats,
        'dataset': {
            'total_rows': len(rows),
            'train_rows': len(train_rows),
            'holdout_rows': len(holdout_rows),
            'holdout_method': 'explicit ID list (same as v10)',
            'niches': {'side-hustles': len(rows)},
            'v10_had': v10['total_rows'],
        },
        'target_stats': {
            'min': float(y_train.min()), 'max': float(y_train.max()),
            'mean': float(y_train.mean()), 'std': float(y_train.std()),
            'median': float(np.median(y_train)),
        },
        'performance': {
            'train': metrics_train,
            'holdout': metrics_holdout,
            'cv_5fold': {
                'spearman_mean': float(cv_spearman),
                'spearman_std': float(cv_spearman_std),
                'mae_mean': float(cv_mae),
                'mae_std': float(cv_mae_std),
                'within_10_mean': float(cv_within10),
                'per_fold': cv_folds,
            },
        },
        'comparison_vs_v10': {
            'v10_cv_spearman': v10['cv_spearman'],
            'v12_cv_spearman': float(cv_spearman),
            'delta_cv_spearman': float(d_cv),
            'v10_holdout_spearman': v10['holdout_spearman'],
            'v12_holdout_spearman': float(metrics_holdout['spearman_rho']),
            'delta_holdout_spearman': float(d_ho),
            'delta_rows': len(rows) - v10['total_rows'],
        },
        'hyperparameters': {**XGB_PARAMS, 'num_boost_round': NUM_BOOST_ROUNDS},
        'top_features': [{'feature': f, 'importance': round(imp, 6)} for f, imp in importances[:20]],
    }

    meta_path = os.path.join(SANDBOX_DIR, 'xgboost-v12-sandbox-metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    pf(f'\n  Saved metadata: {meta_path}')

    # ═══════════════════════════════════════════════════════════════════════
    pf(f'\n{"=" * 66}')
    pf(f'  SANDBOX SUMMARY')
    pf(f'{"=" * 66}')
    pf(f'  Training set: {len(rows)} rows (v10 had {v10["total_rows"]})')
    pf(f'  CV Spearman rho: {cv_spearman:.4f} (v10: {v10["cv_spearman"]:.4f}, delta: {d_cv:+.4f})')
    pf(f'  Holdout Spearman rho: {metrics_holdout["spearman_rho"]:.4f} (v10: {v10["holdout_spearman"]:.4f}, delta: {d_ho:+.4f})')
    pf(f'  Holdout MAE: {metrics_holdout["mae"]:.2f} (v10: {v10["holdout_mae"]:.2f}, delta: {d_mae:+.2f})')
    pf(f'\n  Files in data/sandbox/:')
    pf(f'    xgboost-v12-sandbox-model.json')
    pf(f'    xgboost-v12-sandbox-features.json')
    pf(f'    xgboost-v12-sandbox-scaler.json')
    pf(f'    xgboost-v12-sandbox-metadata.json')
    pf(f'\n  WARNING: SANDBOX ONLY -- v10 production model NOT touched.')
    pf(f'{"=" * 66}')


if __name__ == '__main__':
    main()
