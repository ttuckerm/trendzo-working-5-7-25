#!/usr/bin/env python3
"""
S6 Retrain — train 5 XGBoost variants with Optuna hyperparameter tuning,
evaluate against a locked holdout set, and emit a results summary.

Standalone. No Node imports. Run:
    python retrain_s6.py --data-dir ./data --output-dir ./results
"""

# SECTION 1 --- SETUP
import xgboost as xgb
import optuna
import pandas as pd
import numpy as np
from scipy.stats import spearmanr
from sklearn.model_selection import KFold
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import json, argparse, os, warnings
warnings.filterwarnings('ignore')

optuna.logging.set_verbosity(optuna.logging.WARNING)

NON_FEATURE_COLS = {'video_id', 'niche', 'source', 'dps_score', 'dps_cohort'}
TIMING_FEATURES = {'posted_hour_utc', 'posted_day_of_week', 'posted_days_since_epoch'}

# Group assignment -> role. Derived from feature_metadata.json groups (16 total).
# "content" groups come from training_features (intrinsic video content analysis) — 9 groups, ~97 features.
# "metadata" groups come from scraped_videos (engagement, creator, timing, sound, DPS-derived) — 7 groups, ~31 features.
CONTENT_GROUPS = {
    'ffmpeg',            # 17 features — scene changes, motion, color, resolution, bitrate, fps
    'audio',             # 20 features — pitch, loudness, silence, music/speech ratio, speaking rate
    'hook',              # 12 features — hook score, sub-scores, motion, face, text overlay
    'text',              # 26 features — word counts, readability, CTA, psych signals, retention
    'thumbnail',         # 5 features  — brightness, contrast, colorfulness, overall score
    'visual',            # 7 features  — scene count, duration, proof ratio, talking head
    'meta_extracted',    # 6 features  — duration/hashtag/followers snapshots from extraction time
    'distribution_tf',   # 4 features  — mirrored timing/sound from training_features namespace
    'content',           # 6 features  — duration, hashtag counts, specificity (residual scraped content)
}
METADATA_GROUPS = {
    'raw_engagement',    # 5 features  — views, likes, comments, shares, saves
    'derived_engagement',# 7 features  — rates, totals, views_per_follower
    'creator',           # 2 features  — followers count, verified
    'timing',            # 3 features  — hour, day, days_since_epoch
    'sound',             # 4 features  — trending, type, age, original
    'early_velocity',    # 3 features  — views_at_1h, views_at_24h, shares_at_24h
    'cohort',            # 1 feature   — dps_cohort
}


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--data-dir', required=True)
    p.add_argument('--output-dir', required=True)
    p.add_argument('--trials', type=int, default=100)
    p.add_argument('--folds', type=int, default=5)
    return p.parse_args()


def load_data(data_dir):
    train = pd.read_csv(os.path.join(data_dir, 'training_data.csv'))
    holdout = pd.read_csv(os.path.join(data_dir, 'holdout_data.csv'))
    with open(os.path.join(data_dir, 'feature_metadata.json'), 'r') as f:
        meta = json.load(f)
    return train, holdout, meta


def classify_features(meta):
    """Return dict: feature_name -> {group, is_binary, is_categorical, role}."""
    out = {}
    for m in meta:
        name = m['name']
        group = m['group']
        if name in NON_FEATURE_COLS and name != 'dps_cohort':
            continue
        if group in CONTENT_GROUPS:
            role = 'content'
        elif group in METADATA_GROUPS:
            role = 'metadata'
        else:
            role = 'other'
        out[name] = {
            'group': group,
            'is_binary': m.get('is_binary', False),
            'is_categorical': m.get('is_categorical', False),
            'role': role,
        }
    return out


def prepare_features(train_df, holdout_df, feat_info, output_dir):
    """Encode categoricals, min-max scale continuous using training stats."""
    encoders = {}
    scaling = {}

    content_feats = [n for n, f in feat_info.items() if f['role'] == 'content' and n in train_df.columns]
    metadata_feats = [n for n, f in feat_info.items() if f['role'] == 'metadata' and n in train_df.columns]

    # Categorical encoding
    for name, f in feat_info.items():
        if not f['is_categorical'] or name not in train_df.columns:
            continue
        le = LabelEncoder()
        train_vals = train_df[name].astype(str).fillna('__NaN__')
        le.fit(train_vals)
        train_df[name] = le.transform(train_vals)
        known = set(le.classes_)
        hv = holdout_df[name].astype(str).fillna('__NaN__')
        holdout_df[name] = hv.map(lambda v: le.transform([v])[0] if v in known else -1)
        encoders[name] = list(le.classes_)

    # Min-max scaling for continuous (non-binary, non-categorical) features
    for name, f in feat_info.items():
        if name not in train_df.columns:
            continue
        if f['is_binary'] or f['is_categorical']:
            continue
        col = pd.to_numeric(train_df[name], errors='coerce')
        mn, mx = col.min(skipna=True), col.max(skipna=True)
        if pd.isna(mn) or pd.isna(mx) or mn == mx:
            print(f"  [warn] feature '{name}' is constant or all-NaN (min={mn}, max={mx}); set to 0.5")
            train_df[name] = np.where(col.notna(), 0.5, np.nan)
            hc = pd.to_numeric(holdout_df[name], errors='coerce')
            holdout_df[name] = np.where(hc.notna(), 0.5, np.nan)
            scaling[name] = {'min': float(mn) if not pd.isna(mn) else None,
                             'max': float(mx) if not pd.isna(mx) else None,
                             'constant': True}
        else:
            rng = mx - mn
            train_df[name] = (col - mn) / rng
            hc = pd.to_numeric(holdout_df[name], errors='coerce')
            holdout_df[name] = (hc - mn) / rng
            scaling[name] = {'min': float(mn), 'max': float(mx), 'constant': False}

    with open(os.path.join(output_dir, 'scaling_params.json'), 'w') as f:
        json.dump({'encoders': encoders, 'scaling': scaling}, f, indent=2)

    return train_df, holdout_df, content_feats, metadata_feats


def build_variants(train_df, content_feats, metadata_feats):
    """Return dict: variant_name -> (feature_list, row_mask on train_df)."""
    variants = {}
    n = len(train_df)

    # A: content_only
    content_cov = train_df[content_feats].notna().mean(axis=1) if content_feats else pd.Series([0.0] * n)
    mask_a = content_cov >= 0.5
    variants['content_only'] = (content_feats, mask_a)

    # B: metadata_only
    variants['metadata_only'] = (metadata_feats, pd.Series([True] * n, index=train_df.index))

    # C: full_signal = content + metadata + dps_cohort
    full = list(dict.fromkeys(content_feats + metadata_feats + (['dps_cohort'] if 'dps_cohort' in train_df.columns else [])))
    variants['full_signal'] = (full, pd.Series([True] * n, index=train_df.index))

    # D: full_signal_no_timing
    no_timing = [f for f in full if f not in TIMING_FEATURES]
    variants['full_signal_no_timing'] = (no_timing, pd.Series([True] * n, index=train_df.index))

    # E: full_signal_quality_rows = full features, rows with content AND metadata present
    content_any = train_df[content_feats].notna().any(axis=1) if content_feats else pd.Series([False] * n)
    metadata_any = train_df[metadata_feats].notna().any(axis=1) if metadata_feats else pd.Series([False] * n)
    mask_e = content_any & metadata_any
    variants['full_signal_quality_rows'] = (full, mask_e)

    return variants


def make_objective(X, y, folds):
    def objective(trial):
        params = {
            'max_depth': trial.suggest_int('max_depth', 3, 10),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
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
                rhos.append(0.0 if np.isnan(rho) else rho)
        return float(np.mean(rhos))
    return objective


def tune_and_train(variant_name, features, mask, train_df, holdout_df, n_trials, folds, output_dir):
    sub = train_df.loc[mask].copy()
    X_train = sub[features]
    y_train = sub['dps_score']
    X_hold = holdout_df[features]
    y_hold = holdout_df['dps_score']

    print(f"\n=== Variant {variant_name}: {len(features)} features, {len(sub)} training rows ===")

    study = optuna.create_study(direction='maximize',
                                sampler=optuna.samplers.TPESampler(seed=42))
    obj = make_objective(X_train, y_train, folds)

    def _cb(study, trial):
        t = trial.number + 1
        if t % 10 == 0 or t == 1:
            best = study.best_value if study.best_trial else float('nan')
            print(f"  Variant {variant_name}: trial {t}/{n_trials}, best CV Spearman: {best:.4f}")

    study.optimize(obj, n_trials=n_trials, callbacks=[_cb], show_progress_bar=False)

    best_params = study.best_params
    cv_spearman = study.best_value

    final_params = dict(best_params)
    final_params.update({'tree_method': 'hist', 'random_state': 42,
                         'objective': 'reg:squarederror', 'verbosity': 0})
    model = xgb.XGBRegressor(**final_params)
    model.fit(X_train, y_train, verbose=False)
    pred = model.predict(X_hold)

    if np.std(pred) == 0:
        holdout_rho = 0.0
    else:
        holdout_rho, _ = spearmanr(y_hold, pred)
        holdout_rho = 0.0 if np.isnan(holdout_rho) else float(holdout_rho)
    holdout_mae = float(mean_absolute_error(y_hold, pred))

    booster = model.get_booster()
    gain = booster.get_score(importance_type='gain')
    # Map from 'f0', 'f1', ... to actual feature names
    feat_map = {f'f{i}': name for i, name in enumerate(features)}
    named_gain = {feat_map.get(k, k): v for k, v in gain.items()}
    top15 = sorted(named_gain.items(), key=lambda kv: kv[1], reverse=True)[:15]
    top15_list = [{'feature': k, 'gain': float(v)} for k, v in top15]

    model_path = os.path.join(output_dir, f'{variant_name}.model.json')
    booster.save_model(model_path)

    result = {
        'variant': variant_name,
        'cv_spearman': float(cv_spearman),
        'holdout_spearman': float(holdout_rho),
        'holdout_mae': holdout_mae,
        'feature_importance_top15': top15_list,
        'best_params': best_params,
        'training_rows': int(len(sub)),
        'feature_count': int(len(features)),
        'features': features,
        'model_path': model_path,
    }
    print(f"  Variant {variant_name}: CV={cv_spearman:.4f}  HOLDOUT Spearman={holdout_rho:.4f}  MAE={holdout_mae:.4f}")
    return result


def print_comparison(results):
    print("\n\n==================== COMPARISON ====================")
    hdr = f"| {'Variant':<30} | {'Feats':>5} | {'Rows':>5} | {'CV Rho':>7} | {'Holdout Rho':>11} | {'MAE':>7} | Top Feature"
    print(hdr)
    print('-' * len(hdr))
    print(f"| {'v10 baseline':<30} | {'~58':>5} | {'~863':>5} | {'0.74*':>7} | {'0.61':>11} | {'-':>7} | -")
    for r in results:
        top = r['feature_importance_top15'][0]['feature'] if r['feature_importance_top15'] else '-'
        print(f"| {r['variant']:<30} | {r['feature_count']:>5} | {r['training_rows']:>5} | "
              f"{r['cv_spearman']:>7.4f} | {r['holdout_spearman']:>11.4f} | {r['holdout_mae']:>7.4f} | {top}")
    print("\n*v10 CV was likely inflated by data homogeneity")


def decision_rules(results):
    by_name = {r['variant']: r for r in results}
    notes = []
    A = by_name.get('content_only')
    B = by_name.get('metadata_only')
    C = by_name.get('full_signal')
    D = by_name.get('full_signal_no_timing')
    E = by_name.get('full_signal_quality_rows')

    if C and A and C['holdout_spearman'] - A['holdout_spearman'] >= 0.02:
        notes.append("CONFIRMED: Context signals improve prediction beyond content-only ceiling")
    if C and B and C['holdout_spearman'] - B['holdout_spearman'] >= 0.02:
        notes.append("CONFIRMED: Content analysis adds value beyond metadata")
    if A and B:
        if A['holdout_spearman'] > B['holdout_spearman']:
            notes.append("Content analysis is more predictive than metadata")
        else:
            notes.append("Metadata is more predictive than content analysis -- investigate")
    if D and C and D['holdout_spearman'] >= C['holdout_spearman'] - 0.02:
        notes.append("RECOMMENDATION: Drop timing features")
    if E and C and E['holdout_spearman'] > C['holdout_spearman']:
        notes.append("RECOMMENDATION: Quality rows outperform -- filter aggressively")

    winner = max(results, key=lambda r: r['holdout_spearman'])
    if winner['holdout_spearman'] < 0.55:
        notes.append("WARNING: Below content-only ceiling. Check feature quality.")
    elif winner['holdout_spearman'] > 0.65:
        notes.append("SUCCESS: Ceiling broken. Context signals confirmed valuable.")

    print("\n==================== DECISIONS ====================")
    for n in notes:
        print(f"  - {n}")
    print(f"\nWINNER: Variant {winner['variant']} -- Holdout Spearman: {winner['holdout_spearman']:.4f}")
    return winner, notes


def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    train, holdout, meta = load_data(args.data_dir)
    feat_info = classify_features(meta)

    content_feats_all = [n for n, f in feat_info.items() if f['role'] == 'content' and n in train.columns]
    metadata_feats_all = [n for n, f in feat_info.items() if f['role'] == 'metadata' and n in train.columns]

    full_cov = train[content_feats_all + metadata_feats_all].notna().all(axis=1).sum() if content_feats_all and metadata_feats_all else 0
    meta_only_cov = (train[metadata_feats_all].notna().any(axis=1) & ~train[content_feats_all].notna().any(axis=1)).sum() if content_feats_all and metadata_feats_all else len(train)

    print(f"Training rows: {len(train)}")
    print(f"Holdout rows: {len(holdout)}")
    print(f"Total features: {len(feat_info)}")
    print(f"Content features (from training_features): {len(content_feats_all)}")
    print(f"Metadata features (from scraped_videos): {len(metadata_feats_all)}")
    print(f"Rows with full content+metadata coverage: {full_cov}")
    print(f"Rows with metadata only: {meta_only_cov}")
    print(f"DPS score range: {train['dps_score'].min():.4f} - {train['dps_score'].max():.4f} (mean: {train['dps_score'].mean():.4f})")

    train, holdout, content_feats, metadata_feats = prepare_features(train, holdout, feat_info, args.output_dir)

    variants = build_variants(train, content_feats, metadata_feats)

    results = []
    for name, (features, mask) in variants.items():
        r = tune_and_train(name, features, mask, train, holdout, args.trials, args.folds, args.output_dir)
        results.append(r)

    print_comparison(results)
    winner, notes = decision_rules(results)

    summary = {
        'model_version': 'v15',
        'status': 'pending-approval',
        'training_rows_total': int(len(train)),
        'holdout_rows': int(len(holdout)),
        'variants': results,
        'winner': winner['variant'],
        'decisions': notes,
    }
    with open(os.path.join(args.output_dir, 'results_summary.json'), 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"\nResults written to {args.output_dir}/results_summary.json")


if __name__ == '__main__':
    main()
