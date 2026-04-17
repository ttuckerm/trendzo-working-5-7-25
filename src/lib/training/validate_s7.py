#!/usr/bin/env python3
"""
S7 Validation Audit — read-only forensic verification of v15-honest-with-res results.

Runs 6 checks:
  1. Leakage audit (no banned engagement columns in feature list)
  2. Holdout contamination (zero overlap between train/holdout video_ids)
  3. Target variable sanity (DPS distributions)
  4. Reproduce holdout Spearman (must match 0.6805 ± 0.001)
  5. Prediction sanity check (10 random holdout predictions vs actual)
  6. Feature importance cross-check
"""

import json
import os
import sys
import pandas as pd
import numpy as np
import xgboost as xgb
from scipy.stats import spearmanr
from sklearn.preprocessing import LabelEncoder

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, 'data')
RESULTS_DIR = os.path.join(ROOT, 'results-s7')

BANNED = {
    'views_count', 'likes_count', 'comments_count', 'shares_count', 'saves_count',
    'like_rate', 'comment_rate', 'share_rate', 'save_rate',
    'engagement_total', 'engagement_rate', 'views_per_follower',
    'views_at_1h', 'views_at_24h', 'shares_at_24h', 'dps_cohort',
}

SUSPICIOUS_TOKENS = ['view', 'like', 'share', 'save', 'comment',
                     'engage', 'rate', 'velocity', 'performance', 'viral']

# Tokens that are safe-known (pre-publication content features, not outcomes)
SAFE_WHITELIST = {
    # pre-pub rubric scores, not outcome metrics
    'share_relatability_score', 'share_utility_score',
    # content features about speech pace, not engagement rate
    'speaking_rate_wpm',
    # ffmpeg rates — content, not engagement
    'ffmpeg_cuts_per_second',
    # video encoding bitrate (bits/second of encoded video), not engagement rate
    'ffmpeg_bitrate',
    # pre-pub hashtag labels
    'meta_has_viral_hashtag',
    # structural retention signal (open-loop count in content)
    'retention_open_loop_count',
    # pre-pub scene/visual features
    'scene_rate_first_half_vs_second',
}

print('=' * 70)
print('S7 VALIDATION AUDIT — v15-honest-with-res')
print('=' * 70)

# Load artefacts
summary_path = os.path.join(RESULTS_DIR, 'results_summary_s7.json')
with open(summary_path) as f:
    summary = json.load(f)

variant = next(v for v in summary['variants'] if v['variant'] == 'v15-honest-with-res')
features = variant['features_used']
reported_holdout = variant['holdout_spearman']

print(f'\nReported holdout Spearman: {reported_holdout:.6f}')
print(f'Reported feature count:    {len(features)}')
print(f'Reported training rows:    {variant["training_rows"]}')

# ────────────────────────────────────────────────────────────────────────
# CHECK 1 — LEAKAGE AUDIT
# ────────────────────────────────────────────────────────────────────────
print('\n' + '-' * 70)
print('CHECK 1: LEAKAGE AUDIT')
print('-' * 70)

banned_hits = [f for f in features if f in BANNED]
print(f'Strict banned-column hits: {len(banned_hits)}')
for b in banned_hits:
    print(f'  LEAK: {b}')

flagged = []
for f in features:
    lf = f.lower()
    for tok in SUSPICIOUS_TOKENS:
        if tok in lf:
            flagged.append((f, tok))
            break

print(f'\nFeatures containing suspicious tokens (pre-whitelist): {len(flagged)}')
unresolved = []
for f, tok in flagged:
    status = 'SAFE (whitelist)' if f in SAFE_WHITELIST else 'REVIEW'
    print(f'  [{status}] {f}  (token: {tok})')
    if f not in SAFE_WHITELIST:
        unresolved.append(f)

check1_pass = len(banned_hits) == 0 and len(unresolved) == 0
print(f'\nResult: {"PASS" if check1_pass else "FAIL"}')

# ────────────────────────────────────────────────────────────────────────
# CHECK 2 — HOLDOUT CONTAMINATION
# ────────────────────────────────────────────────────────────────────────
print('\n' + '-' * 70)
print('CHECK 2: HOLDOUT CONTAMINATION')
print('-' * 70)

train = pd.read_csv(os.path.join(DATA_DIR, 'training_data.csv'))
holdout = pd.read_csv(os.path.join(DATA_DIR, 'holdout_data.csv'))

train_ids = set(train['video_id'].astype(str))
hold_ids = set(holdout['video_id'].astype(str))
overlap = train_ids & hold_ids

print(f'Training video_ids:   {len(train_ids)}')
print(f'Holdout video_ids:    {len(hold_ids)}')
print(f'Intersection size:    {len(overlap)}')
check2_pass = len(overlap) == 0
print(f'\nResult: {"PASS" if check2_pass else "FAIL"}')

# ────────────────────────────────────────────────────────────────────────
# CHECK 3 — TARGET VARIABLE SANITY
# ────────────────────────────────────────────────────────────────────────
print('\n' + '-' * 70)
print('CHECK 3: TARGET VARIABLE SANITY')
print('-' * 70)


def describe(name, arr):
    a = pd.Series(arr).dropna()
    print(f'{name:<12} n={len(a)}  min={a.min():.2f}  p10={a.quantile(.1):.2f}  '
          f'median={a.median():.2f}  mean={a.mean():.2f}  p90={a.quantile(.9):.2f}  '
          f'max={a.max():.2f}  std={a.std():.2f}')
    return a


tr_dps = describe('train DPS', train['dps_score'])
ho_dps = describe('holdout DPS', holdout['dps_score'])

sanity_ok = (
    tr_dps.std() > 1.0 and ho_dps.std() > 1.0
    and tr_dps.min() >= 0 and tr_dps.max() <= 100
    and ho_dps.min() >= 0 and ho_dps.max() <= 100
    and tr_dps.nunique() > 10 and ho_dps.nunique() > 10
)

# Histogram (ASCII since matplotlib may not be installed; write PNG if available)
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(1, 2, figsize=(12, 4))
    ax[0].hist(tr_dps, bins=30, color='steelblue', edgecolor='black')
    ax[0].set_title(f'Train DPS (n={len(tr_dps)})')
    ax[0].set_xlabel('DPS score')
    ax[1].hist(ho_dps, bins=30, color='darkorange', edgecolor='black')
    ax[1].set_title(f'Holdout DPS (n={len(ho_dps)})')
    ax[1].set_xlabel('DPS score')
    plt.tight_layout()
    hist_path = os.path.join(RESULTS_DIR, 'dps_distributions_validation.png')
    plt.savefig(hist_path, dpi=80)
    print(f'\nHistogram written: {hist_path}')
except Exception as e:
    print(f'\n(matplotlib unavailable: {e})')

check3_pass = sanity_ok
print(f'\nResult: {"PASS" if check3_pass else "FAIL"}')

# ────────────────────────────────────────────────────────────────────────
# CHECK 4 — REPRODUCE HOLDOUT SPEARMAN
# ────────────────────────────────────────────────────────────────────────
print('\n' + '-' * 70)
print('CHECK 4: REPRODUCE HOLDOUT SPEARMAN')
print('-' * 70)

# Reapply the same encoding/scaling the training script did.
# Scaling params were saved to scaling_params_s7.json.
scaling_path = os.path.join(RESULTS_DIR, 'scaling_params_s7.json')
with open(scaling_path) as f:
    params = json.load(f)
encoders = params['encoders']
scaling = params['scaling']

BINARY = {'creator_verified', 'has_fyp_hashtag', 'music_is_original',
          'ffmpeg_has_audio', 'text_has_cta', 'meta_has_viral_hashtag',
          'has_step_structure', 'hook_face_present', 'hook_text_overlay'}
CATEGORICAL = {'sound_type'}

# NOTE: in retrain_s7.py, encoding fits on train and applies to holdout.
# Computed feature creator_followers_log_computed is derived from raw followers
# BEFORE scaling is applied to creator_followers_count. We must replicate order:
train_w = train.copy()
hold_w = holdout.copy()

# For each feature used, apply encoding/scaling from saved params.
for f in features:
    if f == 'creator_followers_log_computed':
        continue  # computed separately below
    if f not in hold_w.columns:
        print(f'  WARN: feature {f} missing in holdout — forcing NaN column')
        hold_w[f] = np.nan
        continue
    if f in CATEGORICAL:
        classes = encoders[f]
        class_to_idx = {c: i for i, c in enumerate(classes)}
        hv = hold_w[f].astype(str).fillna('__NaN__')
        hold_w[f] = hv.map(lambda v: class_to_idx.get(v, -1))
    elif f in BINARY:
        pass  # leave as 0/1
    else:
        s = scaling.get(f)
        if s is None:
            continue
        hc = pd.to_numeric(hold_w[f], errors='coerce')
        if s.get('constant'):
            hold_w[f] = np.where(hc.notna(), 0.5, np.nan)
        else:
            mn, mx = s['min'], s['max']
            hold_w[f] = (hc - mn) / (mx - mn)

# Add computed feature (scaled)
# creator_followers_log_computed = log10(max(creator_followers_count_raw, 1))
# BUT at the time of computation, train['creator_followers_count'] was already
# scaled to [0,1]. The script's order is: scale raw cols first, THEN add computed
# from the scaled col.  Re-read retrain_s7.py:encode_and_scale — the computed
# feature is derived from df['creator_followers_count'] AFTER that column has
# been overwritten with scaled values. So reproduce the same sequence.
if 'creator_followers_log_computed' in features:
    # raw followers scaling params
    s_raw = scaling.get('creator_followers_count')
    # compute scaled value in holdout for creator_followers_count first (already done above)
    # then log10 of that scaled value: matches the training flow exactly
    scaled_col = pd.to_numeric(hold_w['creator_followers_count'], errors='coerce')
    hold_w['creator_followers_log_computed'] = np.log10(np.maximum(scaled_col, 1))
    s_log = scaling.get('creator_followers_log_computed')
    if s_log and not s_log.get('constant'):
        mn, mx = s_log['min'], s_log['max']
        hold_w['creator_followers_log_computed'] = (
            hold_w['creator_followers_log_computed'] - mn) / (mx - mn)

# Build X_hold in the feature order used by the model
X_hold = hold_w[features]
y_hold = hold_w['dps_score']

# Load model and predict
model_path = os.path.join(RESULTS_DIR, 'v15-honest-with-res.model.json')
booster = xgb.Booster()
booster.load_model(model_path)
model_feat_names = booster.feature_names
if model_feat_names and model_feat_names[0].startswith('f') and model_feat_names[0][1:].isdigit():
    dmat_names = [f'f{i}' for i in range(len(features))]
else:
    dmat_names = list(features)
dmat = xgb.DMatrix(X_hold.values, feature_names=dmat_names)
pred = booster.predict(dmat)

rho, _ = spearmanr(y_hold, pred)
print(f'Reported holdout Spearman:  {reported_holdout:.6f}')
print(f'Reproduced holdout Spearman: {rho:.6f}')
print(f'Difference:                  {abs(rho - reported_holdout):.6f}')
check4_pass = abs(rho - reported_holdout) < 0.001
print(f'\nResult: {"PASS" if check4_pass else "FAIL"}')

# ────────────────────────────────────────────────────────────────────────
# CHECK 5 — PREDICTION SANITY
# ────────────────────────────────────────────────────────────────────────
print('\n' + '-' * 70)
print('CHECK 5: PREDICTION SANITY (10 random holdout videos)')
print('-' * 70)

rng = np.random.default_rng(42)
sample_idx = rng.choice(len(holdout), size=10, replace=False)
print(f'{"video_id":<30} {"actual":>8} {"predicted":>10} {"error":>8}')
pred_series = pd.Series(pred, index=holdout.index)
errs = []
for i in sample_idx:
    vid = str(holdout.iloc[i]['video_id'])
    act = float(holdout.iloc[i]['dps_score'])
    prd = float(pred_series.iloc[i])
    err = prd - act
    errs.append(err)
    print(f'{vid[:28]:<30} {act:>8.2f} {prd:>10.2f} {err:>+8.2f}')

pred_min, pred_max = float(pred.min()), float(pred.max())
pred_std = float(pred.std())
print(f'\nPrediction range: [{pred_min:.2f}, {pred_max:.2f}]  std={pred_std:.2f}')
check5_pass = (pred_min >= -5 and pred_max <= 105 and pred_std > 1.0
               and len(set(pred)) > 10)
print(f'Result: {"PASS" if check5_pass else "FAIL"}')

# ────────────────────────────────────────────────────────────────────────
# CHECK 6 — FEATURE IMPORTANCE CROSS-CHECK
# ────────────────────────────────────────────────────────────────────────
print('\n' + '-' * 70)
print('CHECK 6: FEATURE IMPORTANCE CROSS-CHECK')
print('-' * 70)

gain_scores = booster.get_score(importance_type='gain')
feat_map = {f'f{i}': features[i] for i in range(len(features))}
named = {feat_map.get(k, k): v for k, v in gain_scores.items()}
top = sorted(named.items(), key=lambda kv: kv[1], reverse=True)
print(f'Top 15 features by gain (of {len(named)} features with nonzero gain):')
for i, (f, g) in enumerate(top[:15], 1):
    print(f'  {i:>2}. {f:<40} gain={g:.2f}')

top_is_sound_type = (top[0][0] == 'sound_type') if top else False
banned_in_importance = [f for f, _ in top if f in BANNED]
total_gain = sum(named.values())
max_share = (top[0][1] / total_gain) if top and total_gain > 0 else 0.0
print(f'\nTop feature: {top[0][0]}  ({"MATCH sound_type" if top_is_sound_type else "MISMATCH"})')
print(f'Top feature share of total gain: {max_share*100:.1f}%')
print(f'Banned features appearing in importance: {len(banned_in_importance)}')

check6_pass = top_is_sound_type and len(banned_in_importance) == 0 and max_share < 0.80
print(f'\nResult: {"PASS" if check6_pass else "FAIL"}')

# ────────────────────────────────────────────────────────────────────────
# FINAL REPORT
# ────────────────────────────────────────────────────────────────────────
print('\n' + '=' * 70)
print('=== S7 VALIDATION AUDIT ===')
print('=' * 70)
print(f'Check 1 (Leakage):        {"PASS" if check1_pass else "FAIL"} — '
      f'{len(banned_hits)} banned hits, {len(unresolved)} unresolved suspicious')
print(f'Check 2 (Holdout):        {"PASS" if check2_pass else "FAIL"} — '
      f'train={len(train_ids)} holdout={len(hold_ids)} overlap={len(overlap)}')
print(f'Check 3 (Target Sanity):  {"PASS" if check3_pass else "FAIL"} — '
      f'train std={tr_dps.std():.2f} holdout std={ho_dps.std():.2f}')
print(f'Check 4 (Reproduction):   {"PASS" if check4_pass else "FAIL"} — '
      f'reported 0.6805, reproduced {rho:.4f}, diff {abs(rho-reported_holdout):.6f}')
print(f'Check 5 (Prediction):     {"PASS" if check5_pass else "FAIL"} — '
      f'range [{pred_min:.1f}, {pred_max:.1f}], std {pred_std:.2f}')
print(f'Check 6 (Feature Import): {"PASS" if check6_pass else "FAIL"} — '
      f'top={top[0][0]} share={max_share*100:.1f}% banned={len(banned_in_importance)}')

all_pass = all([check1_pass, check2_pass, check3_pass,
                check4_pass, check5_pass, check6_pass])
print(f'\nOVERALL: {"VALIDATED" if all_pass else "NOT VALIDATED"}')
sys.exit(0 if all_pass else 1)
