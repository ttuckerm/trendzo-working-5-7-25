#!/usr/bin/env python3
"""Feed the TS-scaled vector for row 0 to Python's booster and compare."""
import json, os
import numpy as np
import xgboost as xgb

ROOT = os.path.dirname(os.path.abspath(__file__))
S7 = os.path.join(ROOT, 'results-s7')

with open(os.path.join(S7, 'results_summary_s7.json')) as f:
    variant = next(v for v in json.load(f)['variants'] if v['variant'] == 'v15-honest-with-res')
features = variant['features_used']

ts = json.load(open(os.path.join(S7, 'smoke_ts_scaled_row0.json')))
py = json.load(open(os.path.join(S7, 'smoke_py_scaled_row0.json')))

vec_ts = []
vec_py = []
for f in features:
    vt = ts[f]['scaled']
    vp = py[f]['scaled']
    vec_ts.append(float('nan') if vt is None else float(vt))
    vec_py.append(float('nan') if vp is None else float(vp))

booster = xgb.Booster()
booster.load_model(os.path.join(S7, 'v15-honest-with-res.model.json'))

# Use feature_names so both feed into the model identically
dmat_ts = xgb.DMatrix(np.array([vec_ts]), feature_names=list(features))
dmat_py = xgb.DMatrix(np.array([vec_py]), feature_names=list(features))

pred_ts = float(booster.predict(dmat_ts)[0])
pred_py = float(booster.predict(dmat_py)[0])
print(f'Python booster fed with TS scaled vector: {pred_ts:.6f}')
print(f'Python booster fed with PY scaled vector: {pred_py:.6f}')
print(f'Difference:                               {abs(pred_ts - pred_py):.6f}')

# Also compute base_score + tree sum manually using tree leaves via Python
# For diagnosis: check that trees give identical leaves when given identical input
if abs(pred_ts - pred_py) < 1e-6:
    print('\nPython booster agrees on identical vectors → scaling is bit-matched.')
    print('If TS traverseTree output differs from Python booster, the bug is in TS tree logic.')
