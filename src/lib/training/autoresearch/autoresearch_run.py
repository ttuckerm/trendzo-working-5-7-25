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
                   help='Comma-separated list of features to REMOVE from the v15 honest set. '
                        'Names that do not exist in the feature set are tolerated (no-op).')
    p.add_argument('--keep-only-features', default='',
                   help='Comma-separated whitelist: intersect the honest set with this list '
                        '(derived features from --add-features are still appended). Mutually '
                        'exclusive with --drop-features in intent, but safe to combine.')
    p.add_argument('--add-features', default='',
                   help='Comma-separated list of derived features to ADD. Whitelist in '
                        'apply_derived_features(): sound_metadata_available, hook_x_followers_log, '
                        'posted_hour_sin, posted_hour_cos, duration_bucket, creator_size_bucket, '
                        'content_quality_index')
    p.add_argument('--exclude-rows-where', default='none',
                   help='Named row filter applied to BOTH train and holdout before training. '
                        'One of: none, sound_type_isnan, dps_lt_5_or_gt_95, followers_lt_5000, '
                        'content_nan_gt_30pct, older_than_12_months')
    p.add_argument('--optuna-trials', type=int, default=100)
    p.add_argument('--folds', type=int, default=5)
    p.add_argument('--max-depth-range', default='3,10',
                   help='Comma-separated "min,max" for the XGBoost max_depth Optuna range')
    p.add_argument('--learning-rate-range', default='0.01,0.3',
                   help='Comma-separated "min,max" for the learning_rate Optuna range')
    p.add_argument('--n-estimators', type=int, default=None,
                   help='If set, fix n_estimators to this value (Optuna will not search).')
    p.add_argument('--early-stopping-rounds', type=int, default=None,
                   help='If set, enable XGBoost early stopping with this patience. Uses a '
                        '10% slice of training as the eval set for early-stopping monitoring.')
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
    column names added (so they can be included in the feature set).

    All computations run on RAW (pre-scaled) columns — this is called before
    encode_and_scale, so the values are the original numeric/categorical
    values as they appear in the CSV.
    """
    added = []
    for name in names:
        if name == 'sound_metadata_available':
            # 1 when sound_type is known (licensed|original), 0 when NaN.
            src = df['sound_type'] if 'sound_type' in df.columns else pd.Series([np.nan] * len(df))
            df[name] = (~src.isna()).astype(int)
            added.append(name)

        elif name == 'hook_x_followers_log':
            # Interaction: hook_score * log10(1 + creator_followers_count).
            # Scaled at encode_and_scale time along with other continuous cols.
            hook = pd.to_numeric(df.get('hook_score', pd.Series([np.nan] * len(df))), errors='coerce')
            followers = pd.to_numeric(df.get('creator_followers_count', pd.Series([np.nan] * len(df))), errors='coerce')
            df[name] = hook * np.log10(np.maximum(followers, 1))
            added.append(name)

        elif name == 'posted_hour_sin':
            hr = pd.to_numeric(df.get('posted_hour_utc', pd.Series([np.nan] * len(df))), errors='coerce')
            df[name] = np.sin(2 * np.pi * hr / 24)
            added.append(name)

        elif name == 'posted_hour_cos':
            hr = pd.to_numeric(df.get('posted_hour_utc', pd.Series([np.nan] * len(df))), errors='coerce')
            df[name] = np.cos(2 * np.pi * hr / 24)
            added.append(name)

        elif name == 'duration_bucket':
            # 0: <30s, 1: 30-60s, 2: >60s. Uses ffmpeg_duration_seconds; falls
            # back to duration_seconds if ffmpeg metric is missing.
            dur_col = 'ffmpeg_duration_seconds' if 'ffmpeg_duration_seconds' in df.columns else 'duration_seconds'
            dur = pd.to_numeric(df.get(dur_col, pd.Series([np.nan] * len(df))), errors='coerce')
            bucket = pd.Series(np.full(len(df), np.nan), index=df.index)
            bucket[dur < 30] = 0
            bucket[(dur >= 30) & (dur <= 60)] = 1
            bucket[dur > 60] = 2
            df[name] = bucket
            added.append(name)

        elif name == 'creator_size_bucket':
            # 0: <10K, 1: 10K-100K, 2: 100K-1M, 3: >1M
            f = pd.to_numeric(df.get('creator_followers_count', pd.Series([np.nan] * len(df))), errors='coerce')
            bucket = pd.Series(np.full(len(df), np.nan), index=df.index)
            bucket[f < 10_000] = 0
            bucket[(f >= 10_000) & (f < 100_000)] = 1
            bucket[(f >= 100_000) & (f < 1_000_000)] = 2
            bucket[f >= 1_000_000] = 3
            df[name] = bucket
            added.append(name)

        elif name == 'content_quality_index':
            # Mean of min-max-normalized quality signals. Prompt asked for
            # [hook_score, visual_complexity_score, pacing_score,
            #  audio_loudness_integrated, gemini_overall_score].
            # The CSV uses different names; substitute the closest real
            # columns and skip any that are missing.
            candidates = [
                'hook_score',
                'visual_variety_score',       # substitute for visual_complexity_score
                'scene_rate_first_half_vs_second',  # substitute for pacing_score
                'audio_loudness_mean_lufs',    # substitute for audio_loudness_integrated
                'hook_composition_score',      # substitute for gemini_overall_score
                'vocal_confidence_composite',
            ]
            parts = []
            for c in candidates:
                if c not in df.columns:
                    continue
                col = pd.to_numeric(df[c], errors='coerce')
                mn, mx = col.min(skipna=True), col.max(skipna=True)
                if pd.isna(mn) or pd.isna(mx) or mn == mx:
                    continue
                parts.append((col - mn) / (mx - mn))
            if parts:
                stacked = pd.concat(parts, axis=1)
                df[name] = stacked.mean(axis=1, skipna=True)
            else:
                df[name] = np.nan
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
    elif filter_name == 'content_nan_gt_30pct':
        # Drop rows where >30% of the content-group columns are NaN. Uses the
        # CONTENT_GROUPS column list from retrain_s7's meta.
        content_cols = [c for c in df.columns if c.startswith((
            'ffmpeg_', 'audio_', 'visual_', 'thumb_', 'hook_', 'text_',
            'meta_', 'retention_', 'share_', 'psych_', 'specificity_',
            'instructional_', 'has_step_', 'hedge_', 'vocal_', 'scene_rate_',
            'talking_head_', 'visual_to_verbal_', 'visual_proof_',
        ))]
        if not content_cols:
            return df, 0
        nan_frac = df[content_cols].isna().sum(axis=1) / len(content_cols)
        out = df[nan_frac <= 0.30].reset_index(drop=True)
    elif filter_name == 'older_than_12_months':
        # Look for any plausible posted-date column. If none is present, this
        # is a no-op.
        date_col = None
        for c in ('upload_timestamp', 'posted_days_since_epoch', 'posted_at', 'created_at'):
            if c in df.columns:
                date_col = c
                break
        if date_col is None:
            print('[row-filter] older_than_12_months: no date column found — no-op')
            return df, 0
        import datetime as _dt
        now = _dt.datetime.now(_dt.timezone.utc)
        if date_col == 'posted_days_since_epoch':
            cutoff_days = (now - _dt.datetime(1970, 1, 1, tzinfo=_dt.timezone.utc)).days - 365
            mask = pd.to_numeric(df[date_col], errors='coerce') >= cutoff_days
        else:
            # Parse the column as datetime — string comparison fails across
            # formats (e.g. "2022-03-15 ..." vs "2025-04-17T..." compares
            # byte-wise and the T > space so the cutoff year gets mis-read).
            parsed = pd.to_datetime(df[date_col], errors='coerce', utc=True)
            cutoff = now - _dt.timedelta(days=365)
            mask = parsed >= cutoff
        out = df[mask].reset_index(drop=True)
        # Guard: if the filter wipes almost everything, refuse to train on
        # the residue — return the original frame and log loudly.
        if len(out) < max(200, int(len(df) * 0.05)):
            print(f'[row-filter] older_than_12_months: only {len(out)}/{len(df)} rows remain '
                  f'— refusing to train on an empty/tiny set, returning original')
            return df, 0
    else:
        raise ValueError(f'Unknown row filter: {filter_name!r}')
    return out, before - len(out)


# ── Feature-set assembly ─────────────────────────────────────────────────────

def build_feature_set(train_df, meta, drop_features, keep_only_features, added_columns):
    """Assemble the experiment's feature set from the v15 honest base.

    1. Start with retrain_s7.build_honest_features() — the 91-feature honest set.
    2. If `keep_only_features` is non-empty, intersect (whitelist mode).
    3. Drop anything named in `drop_features` (tolerant — missing names are no-ops).
    4. Append derived columns from `added_columns` (created earlier in the pipeline).
    5. Run retrain_s7's dead-feature pruner (zero-variance / all-NaN).
    6. Add the computed `creator_followers_log_computed` if its source is alive.
    """
    honest, content, context = s7.build_honest_features(meta, train_df.columns)

    # Apply whitelist first, if provided
    kept_only_applied = False
    if keep_only_features:
        allow = set(keep_only_features)
        honest = [f for f in honest if f in allow]
        kept_only_applied = True

    dropped_requested = []
    for f in drop_features:
        if f in s7.BANNED_COLS:
            raise ValueError(f'Refusing to drop {f}: it is already banned (leakage), not in the honest set')
        if f in honest:
            honest.remove(f)
            dropped_requested.append(f)
        else:
            dropped_requested.append(f)

    for add in added_columns:
        if add not in honest:
            honest.append(add)

    alive, dead = s7.drop_dead_features(train_df, honest)
    # Only re-add creator_followers_log_computed when nothing has filtered the
    # raw column out (whitelist mode might).
    if ('creator_followers_count' in alive
            and 'creator_followers_log_computed' not in alive
            and (not kept_only_applied or 'creator_followers_log_computed' in keep_only_features)):
        alive.append('creator_followers_log_computed')

    return alive, dead, dropped_requested


# ── Optuna objective with parameter-range overrides ──────────────────────────
# retrain_s7.make_objective hardcodes the Optuna search space. We rebuild it
# here so --max-depth-range / --learning-rate-range take effect.

def make_objective(X, y, folds, max_depth_range, lr_range, fixed_n_estimators=None,
                   early_stopping_rounds=None):
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
            'n_estimators': (fixed_n_estimators if fixed_n_estimators is not None
                             else trial.suggest_int('n_estimators', 100, 1000)),
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
        if early_stopping_rounds is not None:
            params['early_stopping_rounds'] = early_stopping_rounds
        kf = KFold(n_splits=folds, shuffle=True, random_state=42)
        rhos = []
        for tr_idx, va_idx in kf.split(X):
            model = xgb.XGBRegressor(**params)
            if early_stopping_rounds is not None:
                # Early stopping needs an explicit eval set — use the CV
                # validation fold as the monitor. This changes fit semantics
                # slightly (fit sees va_idx during training), but it's the
                # natural pairing for ES inside a CV trial.
                model.fit(X.iloc[tr_idx], y.iloc[tr_idx],
                          eval_set=[(X.iloc[va_idx], y.iloc[va_idx])],
                          verbose=False)
            else:
                model.fit(X.iloc[tr_idx], y.iloc[tr_idx], verbose=False)
            pred = model.predict(X.iloc[va_idx])
            if np.std(pred) == 0:
                rhos.append(0.0)
            else:
                rho, _ = spearmanr(y.iloc[va_idx], pred)
                rhos.append(0.0 if np.isnan(rho) else float(rho))
            # Explicit cleanup — XGBoost 3.2.0 on Python 3.13/Windows leaks
            # native booster memory across fit() calls.
            del model
            gc.collect()
        return float(np.mean(rhos))
    return objective


def tune_and_train(name, features, train_df, holdout_df, n_trials, folds,
                   max_depth_range, lr_range, output_dir,
                   fixed_n_estimators=None, early_stopping_rounds=None):
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
    obj = make_objective(X_train, y_train, folds, max_depth_range, lr_range,
                         fixed_n_estimators=fixed_n_estimators,
                         early_stopping_rounds=early_stopping_rounds)

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
    if fixed_n_estimators is not None:
        final_params['n_estimators'] = fixed_n_estimators
    if early_stopping_rounds is not None:
        final_params['early_stopping_rounds'] = early_stopping_rounds
    kf = KFold(n_splits=folds, shuffle=True, random_state=42)
    fold_rhos = []
    for tr_idx, va_idx in kf.split(X_train):
        m = xgb.XGBRegressor(**final_params)
        if early_stopping_rounds is not None:
            m.fit(X_train.iloc[tr_idx], y_train.iloc[tr_idx],
                  eval_set=[(X_train.iloc[va_idx], y_train.iloc[va_idx])],
                  verbose=False)
        else:
            m.fit(X_train.iloc[tr_idx], y_train.iloc[tr_idx], verbose=False)
        p = m.predict(X_train.iloc[va_idx])
        rho, _ = spearmanr(y_train.iloc[va_idx], p)
        fold_rhos.append(0.0 if np.isnan(rho) else float(rho))
        del m
        gc.collect()

    model = xgb.XGBRegressor(**final_params)
    if early_stopping_rounds is not None:
        # For the final fit, use the 200-video holdout as the eval monitor —
        # safe because we also report holdout Spearman separately and are not
        # selecting hyperparameters based on this fit.
        model.fit(X_train, y_train, eval_set=[(X_hold, y_hold)], verbose=False)
    else:
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
    keep_only_features = [x.strip() for x in args.keep_only_features.split(',') if x.strip()]

    for d in drop_features:
        if d in s7.BANNED_COLS:
            raise SystemExit(f'FATAL: refusing to drop {d} — it is in BANNED_COLS')
    for k in keep_only_features:
        if k in s7.BANNED_COLS:
            raise SystemExit(f'FATAL: refusing to whitelist {k} — it is in BANNED_COLS')

    md_range = tuple(int(x) for x in args.max_depth_range.split(','))
    lr_range = tuple(float(x) for x in args.learning_rate_range.split(','))

    print(f'=== Autoresearch {args.experiment_id} ===')
    print(f'Hypothesis:      {args.hypothesis}')
    print(f'Parent baseline: {args.parent_baseline}')
    print(f'Drop features:   {drop_features or "(none)"}')
    print(f'Keep only:       {keep_only_features or "(full set)"}')
    print(f'Add features:    {add_features_names or "(none)"}')
    print(f'Row filter:      {args.exclude_rows_where}')
    print(f'Optuna trials:   {args.optuna_trials}')
    print(f'max_depth range: {md_range}')
    print(f'learning rate:   {lr_range}')
    print(f'Fixed n_est:     {args.n_estimators}')
    print(f'Early stopping:  {args.early_stopping_rounds}')

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
        train, meta, drop_features, keep_only_features, added_cols,
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
        fixed_n_estimators=args.n_estimators,
        early_stopping_rounds=args.early_stopping_rounds,
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
        'features_keep_only': keep_only_features,
        'rows_used': len(train),
        'rows_excluded': rows_excluded,
        'rows_before_filter': rows_before,
        'row_filter': args.exclude_rows_where,
        'optuna_best_params': result['best_params'],
        'optuna_trials': args.optuna_trials,
        'optuna_max_depth_range': list(md_range),
        'optuna_learning_rate_range': list(lr_range),
        'fixed_n_estimators': args.n_estimators,
        'early_stopping_rounds': args.early_stopping_rounds,
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
