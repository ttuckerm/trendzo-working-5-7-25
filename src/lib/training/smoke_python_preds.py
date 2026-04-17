#!/usr/bin/env python3
"""
Produce Python reference predictions for the same 3 holdout rows the TS smoke
test uses. Writes to `results-s7/smoke_python_preds.json` keyed by video_id.
"""
import json, os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, 'data')
S7 = os.path.join(ROOT, 'results-s7')

# Pick the same indices as the TS smoke test
SAMPLE_INDICES = [0, 50, 150]

# Replay retrain_s7.py's encode_and_scale(), feed the 3 rows through the saved
# model, and record the raw (unclamped) prediction per video_id.

holdout = pd.read_csv(os.path.join(DATA, 'holdout_data.csv'))
with open(os.path.join(S7, 'results_summary_s7.json')) as f:
    summary = json.load(f)
variant = next(v for v in summary['variants'] if v['variant'] == 'v15-honest-with-res')
features = variant['features_used']

with open(os.path.join(S7, 'scaling_params_s7.json')) as f:
    sp = json.load(f)
encoders = sp['encoders']
scaling = sp['scaling']

BINARY = {'creator_verified', 'has_fyp_hashtag', 'music_is_original',
          'ffmpeg_has_audio', 'text_has_cta', 'meta_has_viral_hashtag',
          'has_step_structure', 'hook_face_present', 'hook_text_overlay'}
CATEGORICAL = {'sound_type'}

hw = holdout.copy()
for f in features:
    if f == 'creator_followers_log_computed':
        continue
    if f not in hw.columns:
        hw[f] = np.nan
        continue
    if f in CATEGORICAL:
        classes = encoders[f]
        ctoi = {c: i for i, c in enumerate(classes)}
        hv = hw[f].astype(str).fillna('__NaN__')
        hw[f] = hv.map(lambda v: ctoi.get(v, -1))
    elif f in BINARY:
        pass
    else:
        s = scaling.get(f)
        if s is None:
            continue
        hc = pd.to_numeric(hw[f], errors='coerce')
        if s.get('constant'):
            hw[f] = np.where(hc.notna(), 0.5, np.nan)
        else:
            mn, mx = s['min'], s['max']
            hw[f] = (hc - mn) / (mx - mn)

if 'creator_followers_log_computed' in features:
    scaled = pd.to_numeric(hw['creator_followers_count'], errors='coerce')
    hw['creator_followers_log_computed'] = np.log10(np.maximum(scaled, 1))
    sl = scaling.get('creator_followers_log_computed')
    if sl and not sl.get('constant'):
        mn, mx = sl['min'], sl['max']
        hw['creator_followers_log_computed'] = (hw['creator_followers_log_computed'] - mn) / (mx - mn)

X = hw[features]

booster = xgb.Booster()
booster.load_model(os.path.join(S7, 'v15-honest-with-res.model.json'))

dmat = xgb.DMatrix(X.iloc[SAMPLE_INDICES].values,
                   feature_names=list(features))
preds = booster.predict(dmat)

out = {}
for i, idx in enumerate(SAMPLE_INDICES):
    vid = str(holdout.iloc[idx]['video_id'])
    out[vid] = float(preds[i])
    print(f'  idx={idx} video_id={vid} actual={holdout.iloc[idx]["dps_score"]:.2f} py_pred={preds[i]:.4f}')

out_path = os.path.join(S7, 'smoke_python_preds.json')
with open(out_path, 'w') as f:
    json.dump(out, f, indent=2)
print(f'\nWrote {out_path}')
