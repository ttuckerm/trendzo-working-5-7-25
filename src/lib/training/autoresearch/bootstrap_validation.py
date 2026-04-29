#!/usr/bin/env python3
"""
Bootstrap validation for S9: auto-022 (>=5K creator filter) vs v15 (no filter).

For each of 100 iterations:
  - Sample training-size rows WITH replacement from the pool.
  - OOB rows (not sampled) become the test set.
  - Train XGBoost with the config's FIXED hyperparameters (no Optuna).
  - Compute Spearman on OOB.

Reports paired differences using matched iteration seeds, so bootstrap
randomness is aligned across configs per iteration.

Read-only: no model files, no DB rows. Writes a single JSON summary to
results-autoresearch/bootstrap_validation_s9/bootstrap_results.json.
"""

import gc
import json
import os
import sys
import time
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from scipy.stats import spearmanr

# Reuse retrain_s7's feature + scaling logic verbatim.
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
S7_DIR = os.path.abspath(os.path.join(THIS_DIR, '..'))
if S7_DIR not in sys.path:
    sys.path.insert(0, S7_DIR)
import retrain_s7 as s7  # type: ignore

REPO_ROOT = os.path.abspath(os.path.join(THIS_DIR, '..', '..', '..', '..'))

N_ITERATIONS = 100
SEED_BASE = 42

# ── Fixed hyperparameters lifted from the two parent experiments ─────────────
# auto-022: results-autoresearch/auto-022/results.json
# v15 (production): src/lib/training/results-s7/results_summary_s7.json (v15-honest-with-res)

AUTO_022_PARAMS = {
    'max_depth': 6,
    'learning_rate': 0.013141839241380437,
    'n_estimators': 275,
    'min_child_weight': 2,
    'subsample': 0.7993975519408625,
    'colsample_bytree': 0.6592245838125893,
    'reg_alpha': 4.015263398736098e-06,
    'reg_lambda': 9.544357656061957e-08,
    'tree_method': 'hist',
    'random_state': 42,
    'objective': 'reg:squarederror',
    'verbosity': 0,
}

V15_PARAMS = {
    'max_depth': 6,
    'learning_rate': 0.011487782674818233,
    'n_estimators': 437,
    'min_child_weight': 8,
    'subsample': 0.8321792991298724,
    'colsample_bytree': 0.6006969809815522,
    'reg_alpha': 0.00017031338356173444,
    'reg_lambda': 3.550874692449412e-08,
    'tree_method': 'hist',
    'random_state': 42,
    'objective': 'reg:squarederror',
    'verbosity': 0,
}


# ── Helpers ─────────────────────────────────────────────────────────────────

def load_pool(training_csv, holdout_csv, apply_gte_5k_filter):
    """Concat training + holdout into a single bootstrap pool, optionally filtered."""
    train = pd.read_csv(training_csv)
    holdout = pd.read_csv(holdout_csv)
    if apply_gte_5k_filter:
        train = train[train['creator_followers_count'] >= 5000].reset_index(drop=True)
        holdout = holdout[holdout['creator_followers_count'] >= 5000].reset_index(drop=True)
    return (
        pd.concat([train, holdout], ignore_index=True),
        len(train),
        len(holdout),
    )


def build_features_for_pool(pool, meta, drop_music_is_original):
    """Replicate autoresearch's feature-assembly for this specific pool."""
    honest, _c, _cx = s7.build_honest_features(meta, pool.columns)
    if drop_music_is_original and 'music_is_original' in honest:
        honest.remove('music_is_original')
    alive, _dead = s7.drop_dead_features(pool, honest)
    if ('creator_followers_count' in alive
            and 'creator_followers_log_computed' not in alive):
        alive.append('creator_followers_log_computed')
    return alive


def bootstrap_one(pool, sample_size, meta, params, drop_music, tmp_dir, rng):
    import xgboost as xgb
    sample_idx = rng.randint(0, len(pool), size=sample_size)
    unique_sampled = np.unique(sample_idx)
    oob_mask = np.ones(len(pool), dtype=bool)
    oob_mask[unique_sampled] = False
    oob_idx = np.where(oob_mask)[0]
    if len(oob_idx) < 50:
        return float('nan'), len(oob_idx)

    boot_train = pool.iloc[sample_idx].reset_index(drop=True)
    boot_test = pool.iloc[oob_idx].reset_index(drop=True)

    # Per-iteration dead-feature pruning, matching autoresearch_run behavior.
    features = build_features_for_pool(boot_train, meta, drop_music)
    boot_train, boot_test = s7.encode_and_scale(boot_train, boot_test, features, tmp_dir)
    active = [f for f in features if f in boot_train.columns]

    X_tr = boot_train[active]
    y_tr = boot_train[s7.TARGET]
    X_te = boot_test[active]
    y_te = boot_test[s7.TARGET]

    model = xgb.XGBRegressor(**params)
    model.fit(X_tr, y_tr, verbose=False)
    pred = model.predict(X_te)
    if np.std(pred) == 0:
        rho = 0.0
    else:
        r, _ = spearmanr(y_te, pred)
        rho = 0.0 if np.isnan(r) else float(r)
    del model
    gc.collect()
    return rho, len(oob_idx)


def run_config(pool, sample_size, meta, params, label, drop_music, tmp_dir):
    print(f'\n=== Bootstrap: {label} ===')
    print(f'  Pool size:   {len(pool)}')
    print(f'  Sample size: {sample_size}')
    os.makedirs(tmp_dir, exist_ok=True)
    rhos = np.full(N_ITERATIONS, np.nan)
    oob_sizes = np.zeros(N_ITERATIONS, dtype=int)
    t0 = time.time()
    for i in range(N_ITERATIONS):
        rng = np.random.RandomState(SEED_BASE + i)
        rho, oob_n = bootstrap_one(pool, sample_size, meta, params, drop_music, tmp_dir, rng)
        rhos[i] = rho
        oob_sizes[i] = oob_n
        if (i + 1) % 10 == 0:
            elapsed = time.time() - t0
            remaining = elapsed * (N_ITERATIONS - i - 1) / (i + 1)
            print(f'  iter {i+1}/{N_ITERATIONS}: rho={rho:.4f}  '
                  f'running mean={np.nanmean(rhos[:i+1]):.4f}  '
                  f'oob_n={oob_n}  elapsed={elapsed/60:.1f}m  eta={remaining/60:.1f}m')
    return rhos, oob_sizes


def summarize(arr, label):
    clean = arr[~np.isnan(arr)]
    mean = float(np.mean(clean))
    std = float(np.std(clean))
    med = float(np.median(clean))
    lo, hi = [float(x) for x in np.percentile(clean, [2.5, 97.5])]
    print(f'\n{label}:')
    print(f'  Mean holdout rho:   {mean:.4f}')
    print(f'  Std:                {std:.4f}')
    print(f'  95% CI:             [{lo:.4f}, {hi:.4f}]')
    print(f'  Median:             {med:.4f}')
    return {'mean': mean, 'std': std, 'ci_95': [lo, hi], 'median': med,
            'n_valid': int(len(clean))}


def main():
    training_csv = os.path.join(REPO_ROOT, 'src', 'lib', 'training', 'data', 'training_data.csv')
    holdout_csv = os.path.join(REPO_ROOT, 'src', 'lib', 'training', 'data', 'holdout_data.csv')
    meta_path = os.path.join(REPO_ROOT, 'src', 'lib', 'training', 'data', 'feature_metadata.json')
    with open(meta_path) as f:
        meta = json.load(f)

    # Pool A: auto-022 (>=5K filter). sample_size = auto-022 training size.
    pool_a, train_a, hold_a = load_pool(training_csv, holdout_csv, apply_gte_5k_filter=True)
    sample_size_a = train_a

    # Pool B: v15 (all rows). sample_size = v15 training size.
    pool_b, train_b, hold_b = load_pool(training_csv, holdout_csv, apply_gte_5k_filter=False)
    sample_size_b = train_b

    print(f'[auto-022]  pool={len(pool_a)} (train={train_a}, hold={hold_a}), sample_size={sample_size_a}')
    print(f'[v15]       pool={len(pool_b)} (train={train_b}, hold={hold_b}), sample_size={sample_size_b}')

    out_dir = os.path.join(REPO_ROOT, 'results-autoresearch', 'bootstrap_validation_s9')
    os.makedirs(out_dir, exist_ok=True)
    tmp_a = os.path.join(out_dir, 'tmp_auto022')
    tmp_b = os.path.join(out_dir, 'tmp_v15')

    rhos_a, oob_a = run_config(pool_a, sample_size_a, meta, AUTO_022_PARAMS,
                               'auto-022 (>=5K filter)', True, tmp_a)
    rhos_b, oob_b = run_config(pool_b, sample_size_b, meta, V15_PARAMS,
                               'v15 (all creators)', False, tmp_b)

    print('\n=== BOOTSTRAP VALIDATION ===')
    summary_a = summarize(rhos_a, 'auto-022 config (>=5K followers)')
    summary_b = summarize(rhos_b, 'v15 config (all creators)')

    diff = rhos_a - rhos_b
    clean = diff[~np.isnan(diff)]
    mean_d = float(np.mean(clean))
    std_d = float(np.std(clean))
    lo_d, hi_d = [float(x) for x in np.percentile(clean, [2.5, 97.5])]
    pct_wins = float(np.mean(clean > 0) * 100)

    print('\nPaired difference (auto-022 minus v15):')
    print(f'  Mean dDelta:          {mean_d:.4f}')
    print(f'  95% CI of dDelta:     [{lo_d:.4f}, {hi_d:.4f}]')
    print(f'  % of iterations auto-022 wins: {pct_wins:.0f}%')

    ci_excludes_zero = (lo_d > 0) or (hi_d < 0)
    validated = ci_excludes_zero and pct_wins > 65 and mean_d > 0
    verdict = ('VALIDATED --- auto-022 is reliably better'
               if validated
               else 'NOT VALIDATED --- gain is within noise, use v15 config for v16')
    print(f'\nVERDICT: {verdict}')

    out_path = os.path.join(out_dir, 'bootstrap_results.json')
    with open(out_path, 'w') as f:
        json.dump({
            'iterations': N_ITERATIONS,
            'seed_base': SEED_BASE,
            'auto_022': {
                **summary_a,
                'params': AUTO_022_PARAMS,
                'pool_size': len(pool_a),
                'sample_size': sample_size_a,
                'rhos': rhos_a.tolist(),
                'oob_sizes': oob_a.tolist(),
            },
            'v15': {
                **summary_b,
                'params': V15_PARAMS,
                'pool_size': len(pool_b),
                'sample_size': sample_size_b,
                'rhos': rhos_b.tolist(),
                'oob_sizes': oob_b.tolist(),
            },
            'paired_diff': {
                'mean': mean_d,
                'std': std_d,
                'ci_95': [lo_d, hi_d],
                'pct_auto022_wins': pct_wins,
                'ci_excludes_zero': ci_excludes_zero,
            },
            'validated': validated,
            'verdict': verdict,
            'timestamp': datetime.now(timezone.utc).isoformat(),
        }, f, indent=2)
    print(f'\nResults written to {out_path}')


if __name__ == '__main__':
    main()
