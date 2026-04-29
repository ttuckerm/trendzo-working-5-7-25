#!/usr/bin/env python3
"""Full leaderboard across Cat 1-5 + category summary + actionable findings."""
import json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(ROOT, '..', '..', '..', '..'))

V15 = {'id': 'v15-baseline', 'category': 0, 'change': '(baseline)',
       'cv_mean': 0.6162, 'cv_std': 0.0192, 'holdout': 0.6805, 'mae': 15.50,
       'features': 91, 'rows': 5645, 'top_feature': 'sound_type', 'delta': 0.0}

EXPERIMENTS = [
    ('auto-001', 1, 'drop music_is_original'),
    ('auto-002', 1, 'drop dup + add sound_metadata_available flag'),
    ('auto-003', 1, 'drop dup + exclude 923 NaN-sound rows'),
    ('auto-004', 1, 'drop sound_type AND music_is_original'),
    ('auto-010', 2, 'content-only (drop all context)'),
    ('auto-011', 2, 'context-only (drop all content)'),
    ('auto-012', 2, 'top-20 features only'),
    ('auto-013', 2, 'top-40 features only'),
    ('auto-014', 2, 'drop resolution (h+w)'),
    ('auto-015', 2, 'drop all thumbnail features'),
    ('auto-016', 2, 'drop all AI-scored (Gemini+LLM-derived)'),
    ('auto-017', 2, 'drop all text/caption features'),
    ('auto-020', 3, 'exclude DPS outliers (<5 or >95)'),
    ('auto-021', 3, 'exclude rows with >30% NaN content'),
    ('auto-022', 3, 'exclude creators <5K followers'),
    ('auto-023', 3, 'exclude videos older than 12 months'),
    ('auto-030', 4, '200 Optuna trials (vs 100)'),
    ('auto-031', 4, 'max_depth range 3-4 (shallow)'),
    ('auto-032', 4, 'max_depth range 8-10 (deep)'),
    ('auto-033', 4, '1000 estimators + early stopping'),
    ('auto-034', 4, 'learning rate 0.003-0.007'),
    ('auto-040', 5, '+hook x followers_log interaction'),
    ('auto-041', 5, '+cyclical hour sin/cos'),
    ('auto-042', 5, '+duration bucket'),
    ('auto-043', 5, '+creator size bucket'),
    ('auto-044', 5, '+content quality composite'),
]

rows = []
for exp_id, cat, change in EXPERIMENTS:
    path = os.path.join(REPO, 'results-autoresearch', exp_id, 'results.json')
    if not os.path.exists(path):
        rows.append({'id': exp_id, 'category': cat, 'change': change, '_missing': True})
        continue
    r = json.load(open(path))
    rows.append({
        'id': exp_id, 'category': cat, 'change': change,
        'cv_mean': r['cv_spearman_mean'], 'cv_std': r['cv_spearman_std'],
        'holdout': r['holdout_spearman'], 'mae': r['holdout_mae'],
        'features': len(r['features_used']), 'rows': r['rows_used'],
        'top_feature': r['top_10_features'][0]['feature'] if r['top_10_features'] else '',
        'delta': r['holdout_spearman'] - V15['holdout'],
    })

ok_rows = [r for r in rows if not r.get('_missing')]
all_ranked = sorted([V15] + ok_rows, key=lambda x: -x['holdout'])

print('=' * 140)
print('FULL LEADERBOARD (ranked by holdout Spearman) - v15 baseline = 0.6805')
print('=' * 140)
print(f'{"Rank":>4} | {"Exp":<12} | {"Cat":<3} | {"Change":<52} | {"CV rho":>7} | {"Holdout":>7} | {"Delta":>9} | {"MAE":>5} | Top Feature')
print('-' * 140)
for i, r in enumerate(all_ranked, 1):
    delta_s = '  --     ' if r['id'] == 'v15-baseline' else f'{r["delta"]:+.4f}  '
    print(f'{i:>4} | {r["id"]:<12} | {r.get("category","-"):>3} | {r["change"]:<52} | {r["cv_mean"]:>7.4f} | {r["holdout"]:>7.4f} | {delta_s:>9} | {r["mae"]:>5.2f} | {r["top_feature"]}')

missing = [r for r in rows if r.get('_missing')]
if missing:
    print('\n=== MISSING ===')
    for r in missing:
        print(f'  {r["id"]}: {r["change"]} - results.json missing')

print('\n' + '=' * 120)
print('CATEGORY SUMMARY')
print('=' * 120)
cat_names = {1: 'Sound Cleanup', 2: 'Feature Subsets', 3: 'Data Quality',
             4: 'Hyperparameters', 5: 'Derived Features'}
print(f'{"Cat":<3} | {"Name":<18} | {"N":>2} | {"Best Delta":>10} | {"Worst Delta":>11} | {"Best Exp":<12} | Best Holdout')
print('-' * 90)
for cat in sorted(cat_names):
    cat_rows = [r for r in rows if r.get('category') == cat and not r.get('_missing')]
    if not cat_rows:
        continue
    best = max(cat_rows, key=lambda x: x['delta'])
    worst = min(cat_rows, key=lambda x: x['delta'])
    print(f'{cat:<3} | {cat_names[cat]:<18} | {len(cat_rows):>2} | {best["delta"]:>+.4f}   | {worst["delta"]:>+.4f}    | {best["id"]:<12} | {best["holdout"]:.4f}')

print('\n' + '=' * 120)
print('ACTIONABLE FINDINGS')
print('=' * 120)

beat = [r for r in ok_rows if r['delta'] > 0]
print('\n[1] Experiments that BEAT v15:')
if beat:
    for r in sorted(beat, key=lambda x: -x['delta']):
        print(f'  {r["id"]} (Cat {r["category"]}): {r["change"]} - Delta = {r["delta"]:+.4f}, holdout = {r["holdout"]:.4f}')
else:
    print('  NONE. v15 remains the best model.')

print('\n[2] Feature family impact (Cat 2 drop experiments - more negative = family is more important):')
FAMILY_EXPS = [
    ('Context (creator/timing/hashtags/sound)', 'auto-010'),
    ('Content (video/audio/hook/text/thumb/visual)', 'auto-011'),
    ('Resolution (height+width)', 'auto-014'),
    ('Thumbnail (all)', 'auto-015'),
    ('AI-scored (Gemini+LLM-derived)', 'auto-016'),
    ('Text/caption (all)', 'auto-017'),
]
family_deltas = []
for family, exp_id in FAMILY_EXPS:
    r = next((x for x in rows if x['id'] == exp_id and not x.get('_missing')), None)
    if r:
        family_deltas.append((family, r['delta'], r['holdout']))
for family, d, h in sorted(family_deltas, key=lambda x: x[1]):
    print(f'  {d:+.4f}  holdout={h:.4f}  drop {family}')

print('\n[3] Hyperparameter experiments (Cat 4):')
hp = [r for r in rows if r.get('category') == 4 and not r.get('_missing')]
for r in sorted(hp, key=lambda x: -x['holdout']):
    print(f'  {r["id"]}: {r["change"]} - holdout = {r["holdout"]:.4f}, Delta = {r["delta"]:+.4f}')

print('\n[4] Derived feature experiments (Cat 5):')
df = [r for r in rows if r.get('category') == 5 and not r.get('_missing')]
for r in sorted(df, key=lambda x: -x['holdout']):
    print(f'  {r["id"]}: {r["change"]} - holdout = {r["holdout"]:.4f}, Delta = {r["delta"]:+.4f}')

print('\n[5] Data quality experiments (Cat 3):')
dq = [r for r in rows if r.get('category') == 3 and not r.get('_missing')]
for r in sorted(dq, key=lambda x: -x['holdout']):
    print(f'  {r["id"]}: {r["change"]} - holdout = {r["holdout"]:.4f}, rows={r["rows"]}, Delta = {r["delta"]:+.4f}')

print('\n[6] Recommendation for v16:')
winner = max(ok_rows, key=lambda x: x['holdout'])
if winner['delta'] > 0:
    print(f'  WINNER: {winner["id"]} - {winner["change"]}')
    print(f'  holdout = {winner["holdout"]:.4f} (v15: 0.6805, Delta = {winner["delta"]:+.4f})')
    print('  Build v16 using this config as the base.')
else:
    print(f'  No experiment beat v15. Best non-baseline: {winner["id"]} at {winner["holdout"]:.4f} (Delta {winner["delta"]:+.4f}).')
    print('  Recommendation: KEEP v15 in production. Revisit autoresearch after next data milestone.')
