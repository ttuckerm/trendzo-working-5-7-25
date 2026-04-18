#!/usr/bin/env python3
"""Category 1 leaderboard — reads each results.json and prints the summary."""
import json, os
ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(ROOT, '..', '..', '..', '..'))

V15 = {
    'id': 'v15', 'change': '(baseline)',
    'cv_mean': 0.6162, 'cv_std': 0.0192,
    'holdout': 0.6805, 'mae': 15.50,
    'features': 91, 'rows': 5645,
    'top_feature': 'sound_type',
}

EXPERIMENTS = [
    ('auto-001', 'drop music_is_original'),
    ('auto-002', 'drop dup + add sound_metadata_available flag'),
    ('auto-003', 'drop dup + exclude 923 NaN-sound rows'),
    ('auto-004', 'drop sound_type AND music_is_original'),
]

rows = [V15]
for exp_id, change in EXPERIMENTS:
    path = os.path.join(REPO, 'results-autoresearch', exp_id, 'results.json')
    if not os.path.exists(path):
        rows.append({'id': exp_id, 'change': change, '_missing': True})
        continue
    r = json.load(open(path))
    rows.append({
        'id': exp_id,
        'change': change,
        'cv_mean': r['cv_spearman_mean'],
        'cv_std': r['cv_spearman_std'],
        'holdout': r['holdout_spearman'],
        'mae': r['holdout_mae'],
        'features': len(r['features_used']),
        'rows': r['rows_used'],
        'top_feature': r['top_10_features'][0]['feature'] if r['top_10_features'] else '',
    })

print('=== CATEGORY 1 LEADERBOARD ===')
print(f'Baseline: v15-honest-with-res (holdout rho = {V15["holdout"]:.4f})')
print()
hdr = f'| {"Experiment":<10} | {"Change":<42} | {"CV rho":>7} | {"Holdout rho":>11} | {"delta":>7} | {"MAE":>5} | {"Feats":>5} | {"Rows":>5} | Top Feature'
print(hdr)
print('-' * len(hdr))
for r in rows:
    if r.get('_missing'):
        print(f'| {r["id"]:<10} | {r["change"]:<42} | {"  --":>7} | {"   --":>11} | {"  --":>7} | {"  --":>5} | {"  --":>5} | {"  --":>5} | (results.json missing)')
        continue
    if r['id'] == 'v15':
        delta_str = '   --'
    else:
        delta_str = f'{r["holdout"] - V15["holdout"]:+.4f}'
    print(f'| {r["id"]:<10} | {r["change"]:<42} | {r["cv_mean"]:>7.4f} | {r["holdout"]:>11.4f} | {delta_str:>7} | {r["mae"]:>5.2f} | {r["features"]:>5} | {r["rows"]:>5} | {r["top_feature"]}')

# Winner = highest holdout Spearman (experiments only, not baseline)
exp_rows = [r for r in rows if r['id'] != 'v15' and not r.get('_missing')]
if exp_rows:
    winner = max(exp_rows, key=lambda x: x['holdout'])
    print(f'\nCategory 1 winner: {winner["id"]} at holdout rho = {winner["holdout"]:.4f} '
          f'(delta {winner["holdout"] - V15["holdout"]:+.4f} vs v15)')
    if winner['holdout'] <= V15['holdout']:
        print(f'(No experiment beat the baseline — v15 is still best)')
