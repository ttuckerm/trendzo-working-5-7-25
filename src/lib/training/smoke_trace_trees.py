#!/usr/bin/env python3
"""Per-tree prediction for row 0, to isolate which tree(s) diverge from TS."""
import json, os
import numpy as np
import xgboost as xgb

ROOT = os.path.dirname(os.path.abspath(__file__))
S7 = os.path.join(ROOT, 'results-s7')

with open(os.path.join(S7, 'results_summary_s7.json')) as f:
    variant = next(v for v in json.load(f)['variants'] if v['variant'] == 'v15-honest-with-res')
features = variant['features_used']
ts = json.load(open(os.path.join(S7, 'smoke_ts_scaled_row0.json')))
vec = [float('nan') if ts[f]['scaled'] is None else float(ts[f]['scaled']) for f in features]

booster = xgb.Booster()
booster.load_model(os.path.join(S7, 'v15-honest-with-res.model.json'))

dmat = xgb.DMatrix(np.array([vec]), feature_names=list(features))

# Final full-model prediction (includes base_score)
final = float(booster.predict(dmat)[0])
print(f'Final Python prediction (with base_score): {final:.6f}')

# Replicate TS logic: sum leaf outputs manually, add base_score
import json as _json
m = _json.load(open(os.path.join(S7, 'v15-honest-with-res.model.json')))
# The S7 artefact is only the booster dump (no learner wrapper); use models/ copy
m = _json.load(open(os.path.join(os.path.dirname(ROOT), '..', '..', 'models', 'xgboost-v15-model.json')))
trees = m['learner']['gradient_booster']['model']['trees']
base_score_str = m['learner']['learner_model_param']['base_score']
base_score = float(base_score_str.strip('[]'))
print(f'base_score: {base_score:.6f}')

def traverse(tree, feats, op):
    i = 0
    while True:
        lc, rc = tree['left_children'][i], tree['right_children'][i]
        if lc == -1 and rc == -1:
            return tree['base_weights'][i]
        fi = tree['split_indices'][i]
        sc = tree['split_conditions'][i]
        v = feats[fi]
        if v is None or (isinstance(v, float) and np.isnan(v)):
            i = lc if tree['default_left'][i] else rc
            continue
        if op == 'lt':
            i = lc if v < sc else rc
        elif op == 'le':
            i = lc if v <= sc else rc
        else:
            raise ValueError(op)

for op in ['lt', 'le']:
    total = base_score
    for t in trees:
        total += traverse(t, vec, op)
    print(f'Python manual, op="{op}": {total:.6f}  diff={abs(total - final):.6f}')
