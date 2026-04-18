#!/usr/bin/env python3
"""Local smoke-test for the new derived-feature factory + row filters."""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..'))
import pandas as pd
import autoresearch_run as a

df = pd.read_csv(os.path.join(HERE, '..', 'data', 'training_data.csv'), nrows=50)
print(f'Loaded {len(df)} rows, {df.shape[1]} cols')

print('\n--- derived features ---')
for name in ['sound_metadata_available', 'hook_x_followers_log', 'posted_hour_sin',
             'posted_hour_cos', 'duration_bucket', 'creator_size_bucket',
             'content_quality_index']:
    d2 = df.copy()
    try:
        a.apply_derived_features(d2, [name])
        col = d2[name]
        uniq = col.nunique(dropna=True)
        nan_frac = col.isna().mean()
        try:
            sample = col.dropna().iloc[0]
        except IndexError:
            sample = 'ALL NAN'
        print(f'  {name:<28} uniq={uniq:>3}  nan_frac={nan_frac:.2f}  sample={sample}')
    except Exception as e:
        print(f'  {name:<28} ERROR: {e}')

print('\n--- row filters ---')
for f in ['sound_type_isnan', 'dps_lt_5_or_gt_95', 'followers_lt_5000',
          'content_nan_gt_30pct', 'older_than_12_months']:
    try:
        out, n_excl = a.apply_row_filter(df.copy(), f)
        print(f'  {f:<25} rows {len(df)} -> {len(out)} (excl {n_excl})')
    except Exception as e:
        print(f'  {f:<25} ERROR: {e}')
