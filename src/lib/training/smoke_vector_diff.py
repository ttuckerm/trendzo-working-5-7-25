#!/usr/bin/env python3
"""Reproduce Python scaling for holdout row 0 and diff against the TS file."""
import json, os
import pandas as pd
import numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, 'data')
S7 = os.path.join(ROOT, 'results-s7')

holdout = pd.read_csv(os.path.join(DATA, 'holdout_data.csv'))
with open(os.path.join(S7, 'results_summary_s7.json')) as f:
    variant = next(v for v in json.load(f)['variants'] if v['variant'] == 'v15-honest-with-res')
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
# Capture raw values for row 0 BEFORE scaling mutates columns
raw_row = {f: (hw.iloc[0][f] if f in hw.columns else None) for f in features}

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

# Emit Python-scaled row 0
py_out = {}
for f in features:
    val = hw.iloc[0][f]
    raw_val = raw_row.get(f)
    if isinstance(raw_val, (np.floating, np.integer)):
        raw_val = float(raw_val)
    if isinstance(val, (np.floating, np.integer)):
        val = float(val)
    py_out[f] = {'raw': raw_val, 'scaled': None if pd.isna(val) else val}

py_path = os.path.join(S7, 'smoke_py_scaled_row0.json')
with open(py_path, 'w') as f:
    json.dump(py_out, f, indent=2, default=str)
print(f'wrote {py_path}')

# Diff against TS output
ts_path = os.path.join(S7, 'smoke_ts_scaled_row0.json')
if os.path.exists(ts_path):
    ts = json.load(open(ts_path))
    print('\nColumns with |TS - Py| > 1e-6 OR NaN-disagreement:')
    print(f"{'feature':<40} {'py_scaled':>18} {'ts_scaled':>18} {'py_raw':>20} {'ts_raw':>20}")
    n_diff = 0
    for f in features:
        ps = py_out[f]['scaled']
        ts_scaled = ts[f]['scaled']
        ps_nan = ps is None
        ts_nan = ts_scaled is None or (isinstance(ts_scaled, float) and np.isnan(ts_scaled))
        if ps_nan and ts_nan:
            continue
        if ps_nan != ts_nan:
            n_diff += 1
            print(f"{f:<40} {str(ps):>18} {str(ts_scaled):>18} {str(py_out[f]['raw']):>20} {str(ts[f]['raw']):>20}")
            continue
        if abs((ps or 0) - (ts_scaled or 0)) > 1e-6:
            n_diff += 1
            print(f"{f:<40} {ps:>18.6f} {ts_scaled:>18.6f} {str(py_out[f]['raw']):>20} {str(ts[f]['raw']):>20}")
    print(f'\nTotal mismatching columns: {n_diff}')
else:
    print('(TS output not present — run smoke_vector_diff.ts first)')
