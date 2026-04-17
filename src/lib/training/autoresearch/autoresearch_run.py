#!/usr/bin/env python3
"""
Autoresearch Trainer — parameterized wrapper around retrain_s7.py

This script IS retrain_s7.py's training pipeline with three extra knobs:
  1. --drop-features    Remove columns from the v15 honest feature set
  2. --add-features     Add derived columns (computed from raw scraped_videos data)
  3. --exclude-rows-where  Drop rows that match a named filter

The leakage ban (BANNED_COLS) is NEVER parameterized — same list as retrain_s7.
The CSV split is NEVER re-exported — reads the same data/training_data.csv and
data/holdout_data.csv that produced v15.
Encoding, scaling, Optuna, XGBoost config — all imported from retrain_s7.

Invocation:
  python autoresearch_run.py \
    --experiment-id auto-001 \
    --hypothesis "Dropping redundant music_is_original" \
    --drop-features music_is_original \
    --output-dir results-autoresearch/auto-001

Writes results.json + model.json + features.json + scaler.json into the output
directory. The bridge script reads results.json and inserts a row into the
training_experiments Supabase table (experiment_mode='sandbox').
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone

import numpy as np
import pandas as pd

# Reuse retrain_s7's training pipeline verbatim — DO NOT fork this logic.
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
S7_DIR = os.path.abspath(os.path.join(THIS_DIR, '..'))
if S7_DIR not in sys.path:
    sys.path.insert(0, S7_DIR)
import retrain_s7 as s7  # type: ignore

REPO_ROOT = os.path.abspath(os.path.join(THIS_DIR, '..', '..', '..', '..'))

# ── CLI ──────────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--experiment-id', required=True)
    p.add_argument('--hypothesis', required=True,
                   help='One-sentence hypothesis driving this experiment')
    p.add_argument('--parent-baseline', default='v15-honest-with-res')
    p.add_argument('--drop-features', default='',
                   help='Comma-separated list of features to REMOVE from the v15 honest set')
    p.add_argument('--add-features', default='',
                   help='Comma-separated list of derived features to ADD (must be understood by '
                        'this script — currently supported: sound_metadata_available)')
    p.add_argument('--exclude-rows-where', default='none',
                   help='Named row filter applied to BOTH train and holdout before training. '
                        'One of: none, sound_type_isnan, dps_lt_5_or_gt_95, followers_lt_5000')
    p.add_argument('--optuna-trials', type=int, default=100)
    p.add_argument('--folds', type=int, default=5)
    p.add_argument('--max-depth-range', default='3,10',
                   help='Comma-separated "min,max" for the XGBoost max_depth Optuna range')
    p.add_argument('--learning-rate-range', default='0.01,0.3',
                   help='Comma-separated "min,max" for the learning_rate Optuna range')
    p.add_argument('--output-dir', required=True)
    p.add_argument('--training-csv', default=os.path.join(REPO_ROOT, 'src', 'lib', 'training', 'data', 'training_data.csv'))
    p.add_argument('--holdout-csv', default=os.path.join(REPO_ROOT, 'src', 'lib', 'training', 'data', 'holdout_data.csv'))
    return p.parse_args()


# ── Derived-feature factory ──────────────────────────────────────────────────
#
# The only legitimate --add-features values are derived columns we compute
# deterministically from existing training data. Adding anything that touches
# post-publication engagement would break the leakage ban; the factory whitelist
# makes that impossible.

def apply_derived_features(df: pd.DataFrame, names: list[str]) -> list[str]:
    """Mutates `df` to add each named derived feature. Returns the actual
    column names added (so they can be included in the feature set)."""
    added = []
    for name in names:
        if name == 'sound_metadata_available':
            # 1 when sound_type is known (licensed|original), 0 when NaN.
            # This is exactly the "data-completeness" signal Prompt 4 surfaced,
            # but now explicit instead of hidden inside sound_type's LabelEncoder.
            src = df['sound_type'] if 'sound_type' in df.columns else pd.Series([np.nan] * len(df))
            df[name] = (~src.isna()).astype(int)
            added.append(name)
        else:
            raise ValueError(f'Unknown derived feature: {name!r}. '
                             f'Add a factory branch in apply_derived_features.')
    return added


# ── Row filters ──────────────────────────────────────────────────────────────

def apply_row_filter(df: pd.DataFrame, filter_name: str) -> tuple[pd.DataFrame, int]:
    """Returns (filtered_df, n_excluded)."""
    if filter_name == 'none':
        return df, 0
    before = len(df)
    if filter_name == 'sound_type_isnan':
        out = df[df['sound_type'].notna()].reset_index(drop=True)
    elif filter_name == 'dps_lt_5_or_gt_95':
        out = df[(df['dps_score'] >= 5) & (df['dps_score'] <= 95)].reset_index(drop=True)
    elif filter_name == 'followers_lt_5000':
        out = df[df['creator_followers_count'] >= 5000].reset_index(drop=True)
    else:
        raise ValueError(f'Unknown row filter: {filter_name!r}')
    return out, before - len(out)


# ── Feature-set assembly ─────────────────────────────────────────────────────

def build_feature_set(train_df, meta, drop_features, add_features_names, added_columns):
    """Start from retrain_s7.build_honest_features, drop the requested columns,
    then append the derived columns from add_features_names (already in df).
    Runs the same dead-feature pruning retrain_s7 does. Returns (final_list,
    dropped_dead).
    """
    honest, content, context = s7.build_honest_features(meta, train_df.columns)

    dropped_requested = []
    for f in drop_features:
        if f in s7.BANNED_COLS:
            raise ValueError(f'Refusing to drop {f}: it is already banned (leakage), not in the honest set')
        if f in honest:
            honest.remove(f)
            dropped_requested.append(f)
        else:
            # Tolerated — lets us drop "music_is_original" even if it was
            # already pruned elsewhere. Recorded in results.json.
            dropped_requested.append(f)

    for add in added_columns:
        if add not in honest:
            honest.append(add)

    alive, dead = s7.drop_dead_features(train_df, honest)
    if 'creator_followers_count' in alive and 'creator_followers_log_computed' not in alive:
        alive.append('creator_followers_log_computed')

    return alive, dead, dropped_requested


# ── Optuna objective with parameter-range overrides ──────────────────────────
# retrain_s7.make_objective hardcodes the Optuna search space. We rebuild it
# here so --max-depth-range / --learning-rate-range take effect.

def make_objective(X, y, folds, max_depth_range, lr_range):
    import gc
    import xgboost as xgb
    import optuna
    from scipy.stats import spearmanr
    from sklearn.model_selection import KFold

    md_lo, md_hi = max_depth_range
    lr_lo, lr_hi = lr_range

    def objective(trial):
        params = {
            'max_depth': trial.suggest_int('max_depth', md_lo, md_hi),
            'learning_rate': trial.suggest_float('learning_rate', lr_lo, lr_hi, log=True),
            'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
            'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
            'reg_alpha': trial.suggest_float('reg_alpha', 1e-8, 10.0, log=True),
            'reg_lambda': trial.suggest_float('reg_lambda', 1e-8, 10.0, log=True),
            'tree_method': 'hist',
            'random_state': 42,
            'objective': 'reg:squarederror',
            'verbosity': 0,
        }
        kf = KFold(n_splits=folds, shuffle=True, random_state=42)
        rhos = []
        for tr_idx, va_idx in kf.split(X):
            model = xgb.XGBRegressor(**params)
            model.fit(X.iloc[tr_idx], y.iloc[tr_idx], verbose=False)
            pred = model.predict(X.iloc[va_idx])
            if np.std(pred) == 0:
                rhos.append(0.0)
            else:
                rho, _ = spearmanr(y.iloc[va_idx], pred)
                rhos.append(0.0 if np.isnan(rho) else float(rho))
            # Explicit cleanup — XGBoost 3.2.0 on Python 3.13/Windows leaks
            # native booster memory across fit() calls; without this the
            # ~500 booster instantiations per experiment (100 trials x 5
            # folds) eventually triggers `bad allocation`.
            del model
            gc.collect()
        return float(np.mean(rhos))
    return objective


def tune_and_train(name, features, train_df, holdout_df, n_trials, folds,
                   max_depth_range, lr_range, output_dir):
    import xgboost as xgb
    import optuna
    from scipy.stats import spearmanr
    from sklearn.model_selection import KFold
    from sklearn.metrics import mean_absolute_error

    optuna.logging.set_verbosity(optuna.logging.WARNING)

    X_train = train_df[features]
    y_train = train_df[s7.TARGET]
    X_hold = holdout_df[features]
    y_hold = holdout_df[s7.TARGET]

    print(f'\n=== {name}: {len(features)} features, {len(X_train)} training rows ===')

    study = optuna.create_study(direction='maximize',
                                sampler=optuna.samplers.TPESampler(seed=42))
    obj = make_objective(X_train, y_train, folds, max_depth_range, lr_range)

    def _cb(study, trial):
        t = trial.number + 1
        if t % 10 == 0 or t == 1:
            best = study.best_value if study.best_trial else float('nan')
            print(f'  trial {t}/{n_trials}, best CV Spearman: {best:.4f}')

    study.optimize(obj, n_trials=n_trials, callbacks=[_cb], show_progress_bar=False)
    best_params = study.best_params
    cv_best = study.best_value

    # Final CV per fold for mean±std
    import gc
    final_params = dict(best_params)
    final_params.update({'tree_method': 'hist', 'random_state': 42,
                         'objective': 'reg:squarederror', 'verbosity': 0})
    kf = KFold(n_splits=folds, shuffle=True, random_state=42)
    fold_rhos = []
    for tr_idx, va_idx in kf.split(X_train):
        m = xgb.XGBRegressor(**final_params)
        m.fit(X_train.iloc[tr_idx], y_train.iloc[tr_idx], verbose=False)
        p = m.predict(X_train.iloc[va_idx])
        rho, _ = spearmanr(y_train.iloc[va_idx], p)
        fold_rhos.append(0.0 if np.isnan(rho) else float(rho))
        del m
        gc.collect()

    model = xgb.XGBRegressor(**final_params)
    model.fit(X_train, y_train, verbose=False)
    pred = model.predict(X_hold)
    if np.std(pred) == 0:
        holdout_rho = 0.0
    else:
        rho, _ = spearmanr(y_hold, pred)
        holdout_rho = 0.0 if np.isnan(rho) else float(rho)
    holdout_mae = float(mean_absolute_error(y_hold, pred))

    booster = model.get_booster()
    gain = booster.get_score(importance_type='gain')
    feat_map = {f'f{i}': name for i, name in enumerate(features)}
    named = {feat_map.get(k, k): v for k, v in gain.items()}
    top10 = sorted(named.items(), key=lambda kv: kv[1], reverse=True)[:10]
    top10_list = [{'feature': k, 'gain': float(v)} for k, v in top10]

    model_path = os.path.join(output_dir, 'model.json')
    booster.save_model(model_path)

    cv_mean = float(np.mean(fold_rhos))
    cv_std = float(np.std(fold_rhos))

    print(f'  CV={cv_mean:.4f}+/-{cv_std:.4f}  HOLDOUT Spearman={holdout_rho:.4f}  MAE={holdout_mae:.4f}')
    top3_str = ', '.join(f'{t["feature"]}({t["gain"]:.0f})' for t in top10_list[:3])
    print(f'  Top 3: {top3_str}')

    return {
        'cv_spearman_mean': cv_mean,
        'cv_spearman_std': cv_std,
        'cv_spearman_best_trial': float(cv_best),
        'holdout_spearman': holdout_rho,
        'holdout_mae': holdout_mae,
        'best_params': best_params,
        'feature_importance_top10': top10_list,
        'model_path': model_path,
    }


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    drop_features = [x.strip() for x in args.drop_features.split(',') if x.strip()]
    add_features_names = [x.strip() for x in args.add_features.split(',') if x.strip()]

    for d in drop_features:
        if d in s7.BANNED_COLS:
            raise SystemExit(f'FATAL: refusing to drop {d} — it is in BANNED_COLS')

    md_range = tuple(int(x) for x in args.max_depth_range.split(','))
    lr_range = tuple(float(x) for x in args.learning_rate_range.split(','))

    print(f'=== Autoresearch {args.experiment_id} ===')
    print(f'Hypothesis:      {args.hypothesis}')
    print(f'Parent baseline: {args.parent_baseline}')
    print(f'Drop features:   {drop_features or "(none)"}')
    print(f'Add features:    {add_features_names or "(none)"}')
    print(f'Row filter:      {args.exclude_rows_where}')
    print(f'Optuna trials:   {args.optuna_trials}')
    print(f'max_depth range: {md_range}')
    print(f'learning rate:   {lr_range}')

    # 1. Load data — same CSV split every experiment, not re-exported
    train = pd.read_csv(args.training_csv)
    holdout = pd.read_csv(args.holdout_csv)
    meta_path = os.path.join(os.path.dirname(args.training_csv), 'feature_metadata.json')
    with open(meta_path) as f:
        meta = json.load(f)
    rows_before = len(train) + len(holdout)

    # 2. Row filter (applied to both splits — holdout rows would also be filtered)
    train, train_excluded = apply_row_filter(train, args.exclude_rows_where)
    holdout, hold_excluded = apply_row_filter(holdout, args.exclude_rows_where)
    rows_excluded = train_excluded + hold_excluded

    print(f'\nRows after filter: train={len(train)} (excl {train_excluded}), '
          f'holdout={len(holdout)} (excl {hold_excluded})')

    # 3. Add derived columns (must happen before feature-set assembly)
    added_cols = []
    if add_features_names:
        added_cols = apply_derived_features(train, add_features_names)
        apply_derived_features(holdout, add_features_names)  # same columns in holdout

    # 4. Feature set
    features, dropped_dead, dropped_requested = build_feature_set(
        train, meta, drop_features, add_features_names, added_cols,
    )
    print(f'\nFeature count: {len(features)}  (dropped_requested={len(dropped_requested)}, '
          f'dropped_dead={len(dropped_dead)}, added={len(added_cols)})')

    # 5. Encode + scale (uses retrain_s7's exact logic)
    train, holdout = s7.encode_and_scale(train, holdout, features, args.output_dir)

    # 6. Save scaler alongside the model
    scaler_src = os.path.join(args.output_dir, 'scaling_params_s7.json')
    scaler_dst = os.path.join(args.output_dir, 'scaler.json')
    if os.path.exists(scaler_src) and scaler_src != scaler_dst:
        os.replace(scaler_src, scaler_dst)

    # 7. Train
    active_features = [f for f in features if f in train.columns]
    result = tune_and_train(
        args.experiment_id,
        active_features,
        train, holdout,
        args.optuna_trials, args.folds,
        md_range, lr_range,
        args.output_dir,
    )

    # 8. Write features.json next to the model for easy inspection
    with open(os.path.join(args.output_dir, 'features.json'), 'w') as f:
        json.dump(active_features, f, indent=2)

    # 9. Assemble results.json
    results = {
        'experiment_id': args.experiment_id,
        'hypothesis': args.hypothesis,
        'parent_baseline': args.parent_baseline,
        'cv_spearman_mean': result['cv_spearman_mean'],
        'cv_spearman_std': result['cv_spearman_std'],
        'holdout_spearman': result['holdout_spearman'],
        'holdout_mae': result['holdout_mae'],
        'features_used': active_features,
        'features_dropped': dropped_requested,
        'features_dropped_dead': [{'name': n, 'reason': r} for n, r in dropped_dead],
        'features_added': added_cols,
        'rows_used': len(train),
        'rows_excluded': rows_excluded,
        'rows_before_filter': rows_before,
        'row_filter': args.exclude_rows_where,
        'optuna_best_params': result['best_params'],
        'optuna_trials': args.optuna_trials,
        'optuna_max_depth_range': list(md_range),
        'optuna_learning_rate_range': list(lr_range),
        'top_10_features': result['feature_importance_top10'],
        'banned_columns_verified': sorted(s7.BANNED_COLS) == sorted({
            'views_count', 'likes_count', 'comments_count', 'shares_count', 'saves_count',
            'like_rate', 'comment_rate', 'share_rate', 'save_rate',
            'engagement_total', 'engagement_rate', 'views_per_follower',
            'views_at_1h', 'views_at_24h', 'shares_at_24h', 'dps_cohort',
        }),
        'training_csv': os.path.relpath(args.training_csv, REPO_ROOT).replace('\\', '/'),
        'holdout_csv': os.path.relpath(args.holdout_csv, REPO_ROOT).replace('\\', '/'),
        'model_path': os.path.relpath(result['model_path'], REPO_ROOT).replace('\\', '/'),
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }
    with open(os.path.join(args.output_dir, 'results.json'), 'w') as f:
        json.dump(results, f, indent=2)

    print(f'\nResults written to {os.path.join(args.output_dir, "results.json")}')
    print(f'Model artefact:    {result["model_path"]}')
    print(f'CV Spearman:       {result["cv_spearman_mean"]:.4f} +/- {result["cv_spearman_std"]:.4f}')
    print(f'Holdout Spearman:  {result["holdout_spearman"]:.4f}')


if __name__ == '__main__':
    main()
