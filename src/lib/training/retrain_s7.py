#!/usr/bin/env python3
"""
S7 Retrain -- Honest Feature Set (Content + Context, No Leakage)

Trains XGBoost on content analysis features + pre-publication context signals.
All post-publication engagement metrics are BANNED. Two sub-variants:
  - v15-honest-with-res:  full honest feature set including resolution
  - v15-honest-no-res:    same minus ffmpeg_resolution_height/width

Run:
    python retrain_s7.py --data-dir ./data --output-dir ./results-s7
"""

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

# ── COLUMN CLASSIFICATION ──────────────────────────────────────────────────

# Non-feature columns (identifiers + target)
NON_FEATURE_COLS = {'video_id', 'niche', 'source', 'dps_score'}

# BANNED -- post-publication engagement data. DPS is derived from these.
# Including them IS the leakage that produced the 0.999 results in S6.
BANNED_COLS = {
    # raw engagement (post-publication outcome)
    'views_count', 'likes_count', 'comments_count', 'shares_count', 'saves_count',
    # derived engagement (ratios/totals of post-pub data)
    'like_rate', 'comment_rate', 'share_rate', 'save_rate',
    'engagement_total', 'engagement_rate', 'views_per_follower',
    # early velocity (post-publication time series)
    'views_at_1h', 'views_at_24h', 'shares_at_24h',
    # cohort flag (derived from source grouping of DPS distributions)
    'dps_cohort',
}

# CONTENT features -- what the video LOOKS LIKE (from training_features table).
# These are extracted by the content analysis pipeline BEFORE publication.
CONTENT_GROUPS = {
    'ffmpeg', 'audio', 'hook', 'text', 'thumbnail', 'visual',
    'meta_extracted', 'distribution_tf',
}

# CONTEXT features -- the ENVIRONMENT the video enters (from scraped_videos).
# All are knowable BEFORE posting: creator stats, timing choices, hashtag/sound choices.
CONTEXT_COLS = {
    'creator_followers_count',   # you know your follower count before posting
    'creator_verified',          # you know if you're verified
    'posted_hour_utc',           # you choose when to post
    'posted_day_of_week',        # you choose when to post
    'duration_seconds',          # you know video length before posting
    'hashtag_count',             # you choose hashtags before posting
    'has_fyp_hashtag',           # you choose hashtags before posting
    'sound_type',                # you choose sound before posting (categorical)
    'music_is_original',         # you choose sound before posting
}
# Note: hashtag_niche_count, hashtag_trending_count, hashtag_specificity_score,
# sound_is_trending, sound_age_days are all-NaN in current data -- excluded.
# posted_days_since_epoch excluded (not a pre-pub decision, just a timestamp).

RESOLUTION_COLS = {'ffmpeg_resolution_height', 'ffmpeg_resolution_width'}

TARGET = 'dps_score'

# ── HELPERS ─────────────────────────────────────────────────────────────────

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
    with open(os.path.join(data_dir, 'feature_metadata.json')) as f:
        meta = json.load(f)
    return train, holdout, meta


def build_honest_features(meta, all_columns):
    """Return the honest feature list: content groups + allowed context cols."""
    content_feats = []
    for m in meta:
        name = m['name']
        if name in NON_FEATURE_COLS or name in BANNED_COLS:
            continue
        if m['group'] in CONTENT_GROUPS:
            content_feats.append(name)

    context_feats = [c for c in CONTEXT_COLS if c in all_columns]

    # Deduplicate (some overlap: duration_seconds is in both content group and context)
    all_honest = list(dict.fromkeys(content_feats + context_feats))
    return all_honest, content_feats, context_feats


def drop_dead_features(train_df, features, threshold=0.95):
    """Drop features that are >threshold NaN or have zero variance. Returns kept + dropped log."""
    kept = []
    dropped = []
    for f in features:
        if f not in train_df.columns:
            dropped.append((f, 'not in CSV'))
            continue
        col = pd.to_numeric(train_df[f], errors='coerce') if train_df[f].dtype == object else train_df[f]
        pct_nan = col.isna().mean()
        if pct_nan > threshold:
            dropped.append((f, f'{pct_nan*100:.1f}% NaN'))
            continue
        non_null = col.dropna()
        if len(non_null) > 0 and non_null.nunique() <= 1:
            val = non_null.iloc[0]
            dropped.append((f, f'zero variance (constant={val})'))
            continue
        kept.append(f)
    return kept, dropped


def encode_and_scale(train_df, holdout_df, features, output_dir):
    """Encode categoricals, min-max scale continuous. Returns modified DFs + params."""
    CATEGORICAL = {'sound_type'}
    BINARY = {'creator_verified', 'has_fyp_hashtag', 'music_is_original',
              'ffmpeg_has_audio', 'text_has_cta', 'meta_has_viral_hashtag',
              'has_step_structure', 'hook_face_present', 'hook_text_overlay'}

    encoders = {}
    scaling = {}

    for f in features:
        if f not in train_df.columns:
            continue

        if f in CATEGORICAL:
            le = LabelEncoder()
            tv = train_df[f].astype(str).fillna('__NaN__')
            le.fit(tv)
            train_df[f] = le.transform(tv)
            known = set(le.classes_)
            hv = holdout_df[f].astype(str).fillna('__NaN__')
            holdout_df[f] = hv.map(lambda v, k=known, enc=le: enc.transform([v])[0] if v in k else -1)
            encoders[f] = list(le.classes_)
            continue

        if f in BINARY:
            continue  # leave as 0/1

        # Continuous -- min-max scale from training stats only
        col = pd.to_numeric(train_df[f], errors='coerce')
        mn, mx = col.min(skipna=True), col.max(skipna=True)
        if pd.isna(mn) or pd.isna(mx) or mn == mx:
            train_df[f] = np.where(col.notna(), 0.5, np.nan)
            hc = pd.to_numeric(holdout_df[f], errors='coerce')
            holdout_df[f] = np.where(hc.notna(), 0.5, np.nan)
            scaling[f] = {'min': None, 'max': None, 'constant': True}
        else:
            rng = mx - mn
            train_df[f] = (col - mn) / rng
            hc = pd.to_numeric(holdout_df[f], errors='coerce')
            holdout_df[f] = (hc - mn) / rng
            scaling[f] = {'min': float(mn), 'max': float(mx), 'constant': False}

    # Add computed feature: creator_followers_log
    if 'creator_followers_count' in features:
        for df in [train_df, holdout_df]:
            raw = pd.to_numeric(df['creator_followers_count'], errors='coerce')
            df['creator_followers_log_computed'] = np.log10(np.maximum(raw, 1))
        # Scale the log feature
        col = train_df['creator_followers_log_computed']
        mn, mx = col.min(skipna=True), col.max(skipna=True)
        if not pd.isna(mn) and not pd.isna(mx) and mn != mx:
            rng = mx - mn
            train_df['creator_followers_log_computed'] = (col - mn) / rng
            holdout_df['creator_followers_log_computed'] = (holdout_df['creator_followers_log_computed'] - mn) / rng
            scaling['creator_followers_log_computed'] = {'min': float(mn), 'max': float(mx), 'constant': False}

    params_path = os.path.join(output_dir, 'scaling_params_s7.json')
    with open(params_path, 'w') as f:
        json.dump({'encoders': encoders, 'scaling': scaling}, f, indent=2)

    return train_df, holdout_df


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


def tune_and_train(name, features, train_df, holdout_df, n_trials, folds, output_dir):
    X_train = train_df[features]
    y_train = train_df[TARGET]
    X_hold = holdout_df[features]
    y_hold = holdout_df[TARGET]

    print(f'\n=== {name}: {len(features)} features, {len(X_train)} training rows ===')

    study = optuna.create_study(direction='maximize',
                                sampler=optuna.samplers.TPESampler(seed=42))
    obj = make_objective(X_train, y_train, folds)

    def _cb(study, trial):
        t = trial.number + 1
        if t % 10 == 0 or t == 1:
            best = study.best_value if study.best_trial else float('nan')
            print(f'  {name}: trial {t}/{n_trials}, best CV Spearman: {best:.4f}')

    study.optimize(obj, n_trials=n_trials, callbacks=[_cb], show_progress_bar=False)

    best_params = study.best_params
    cv_spearman = study.best_value

    # Collect per-fold Spearman for mean±std
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

    # Final model on full training set
    model = xgb.XGBRegressor(**final_params)
    model.fit(X_train, y_train, verbose=False)
    pred = model.predict(X_hold)

    if np.std(pred) == 0:
        holdout_rho = 0.0
    else:
        holdout_rho, _ = spearmanr(y_hold, pred)
        holdout_rho = 0.0 if np.isnan(holdout_rho) else float(holdout_rho)
    holdout_mae = float(mean_absolute_error(y_hold, pred))

    # Feature importance
    booster = model.get_booster()
    gain = booster.get_score(importance_type='gain')
    feat_map = {f'f{i}': name for i, name in enumerate(features)}
    named_gain = {feat_map.get(k, k): v for k, v in gain.items()}
    top10 = sorted(named_gain.items(), key=lambda kv: kv[1], reverse=True)[:10]
    top10_list = [{'feature': k, 'gain': float(v)} for k, v in top10]

    model_path = os.path.join(output_dir, f'{name}.model.json')
    booster.save_model(model_path)

    cv_mean = float(np.mean(fold_rhos))
    cv_std = float(np.std(fold_rhos))

    print(f'  {name}: CV={cv_mean:.4f}±{cv_std:.4f}  HOLDOUT Spearman={holdout_rho:.4f}  MAE={holdout_mae:.4f}')
    print(f'  Top 3: {", ".join(f"{t["feature"]}({t["gain"]:.0f})" for t in top10_list[:3])}')

    return {
        'variant': name,
        'cv_spearman_mean': cv_mean,
        'cv_spearman_std': cv_std,
        'cv_spearman_best_trial': float(cv_spearman),
        'holdout_spearman': holdout_rho,
        'holdout_mae': holdout_mae,
        'feature_importance_top10': top10_list,
        'best_params': best_params,
        'training_rows': len(X_train),
        'feature_count': len(features),
        'features_used': features,
        'model_path': model_path,
    }


def print_comparison(results):
    print('\n\n==================== COMPARISON TABLE ====================')
    hdr = f"| {'Variant':<25} | {'Feats':>5} | {'Rows':>5} | {'CV rho (mean±std)':>18} | {'Holdout rho':>10} | {'MAE':>7} | Top Feature"
    print(hdr)
    print('-' * len(hdr))
    print(f"| {'v10 (production)':<25} | {'~58':>5} | {'~863':>5} | {'0.74±?*':>18} | {'0.61':>10} | {'--':>7} | --")
    print(f"| {'S6-A content_only':<25} | {'103':>5} | {'5039':>5} | {'0.5699±?':>18} | {'0.3838':>10} | {'19.22':>7} | ffmpeg_resolution_height")
    for r in results:
        top = r['feature_importance_top10'][0]['feature'] if r['feature_importance_top10'] else '--'
        cv_str = f"{r['cv_spearman_mean']:.4f}±{r['cv_spearman_std']:.4f}"
        print(f"| {r['variant']:<25} | {r['feature_count']:>5} | {r['training_rows']:>5} |"
              f" {cv_str:>18} | {r['holdout_spearman']:>10.4f} | {r['holdout_mae']:>7.4f} | {top}")
    print()
    print("*v10's 0.74 is likely inflated by data homogeneity (863 videos from same hashtags/creator size range)")


def decision_rules(results):
    notes = []
    by_name = {r['variant']: r for r in results}
    wr = by_name.get('v15-honest-with-res')
    nr = by_name.get('v15-honest-no-res')

    s6a_holdout = 0.3838  # S6 Variant A content_only baseline

    for r in results:
        h = r['holdout_spearman']
        if h > 0.65:
            notes.append(f"{r['variant']}: Approaching v10 territory on diverse dataset. Excellent.")
        elif h > 0.55:
            notes.append(f"{r['variant']}: Context signals meaningfully break content-only ceiling. Strong result.")
        elif h > 0.45:
            notes.append(f"{r['variant']}: Context signals adding real value on top of content. Progress.")
        elif abs(h - s6a_holdout) < 0.03:
            notes.append(f"{r['variant']}: ~Same as S6-A. Context signals not helping. Missing signals needed.")
        else:
            notes.append(f"{r['variant']}: Holdout rho = {h:.4f}")

    if wr and nr:
        diff = wr['holdout_spearman'] - nr['holdout_spearman']
        if abs(diff) < 0.02:
            notes.append("Resolution features make negligible difference -- drop for cleaner model.")
        elif diff > 0:
            notes.append(f"Resolution adds +{diff:.4f} -- genuine signal (production quality proxy).")
        else:
            notes.append(f"Resolution HURTS by {abs(diff):.4f} -- cheap proxy, drop it.")

    winner = max(results, key=lambda r: r['holdout_spearman'])
    print('\n==================== DECISIONS ====================')
    for n in notes:
        print(f'  - {n}')
    print(f"\nWINNER: {winner['variant']} -- Holdout Spearman: {winner['holdout_spearman']:.4f}")
    return winner, notes


def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    train, holdout, meta = load_data(args.data_dir)

    # Step 1: Build honest feature set
    all_honest, content_feats, context_feats = build_honest_features(meta, train.columns)
    print(f'Honest feature set: {len(all_honest)} features ({len(content_feats)} content + {len(context_feats)} context)')
    print(f'Content groups: {sorted(CONTENT_GROUPS)}')
    print(f'Context columns: {sorted(CONTEXT_COLS & set(train.columns))}')
    print(f'BANNED columns: {sorted(BANNED_COLS & set(train.columns))}')

    # Step 2: Drop dead features
    alive, dropped = drop_dead_features(train, all_honest)
    print(f'\n--- Dead feature removal ---')
    print(f'Dropped {len(dropped)} features:')
    for name, reason in dropped:
        print(f'  DROPPED: {name} -- {reason}')
    print(f'Kept: {len(alive)} features')

    # Add computed log feature
    if 'creator_followers_count' in alive:
        alive.append('creator_followers_log_computed')
        print(f'Added: creator_followers_log_computed (log10 of creator_followers_count)')
    print(f'Final feature count: {len(alive)}')

    # Step 3: Encode + scale
    train, holdout = encode_and_scale(train, holdout, alive, args.output_dir)

    print(f'\nTraining rows: {len(train)}')
    print(f'Holdout rows: {len(holdout)}')
    print(f'DPS score range: {train[TARGET].min():.1f} - {train[TARGET].max():.1f} (mean: {train[TARGET].mean():.1f})')

    # Step 4: Define sub-variants
    with_res_feats = [f for f in alive if f in train.columns]
    no_res_feats = [f for f in with_res_feats if f not in RESOLUTION_COLS]

    print(f'\nv15-honest-with-res: {len(with_res_feats)} features')
    print(f'v15-honest-no-res: {len(no_res_feats)} features (minus {sorted(RESOLUTION_COLS)})')

    # Step 5: Train
    results = []
    for name, feats in [('v15-honest-with-res', with_res_feats),
                        ('v15-honest-no-res', no_res_feats)]:
        r = tune_and_train(name, feats, train, holdout, args.trials, args.folds, args.output_dir)
        results.append(r)

    # Step 6: Compare
    print_comparison(results)
    winner, notes = decision_rules(results)

    # Step 7: Save everything
    # Feature audit log
    audit = {
        'banned_columns': sorted(BANNED_COLS),
        'banned_reason': 'Post-publication engagement metrics -- DPS is derived from these',
        'content_features_used': content_feats,
        'context_features_used': context_feats,
        'dead_features_dropped': [{'name': n, 'reason': r} for n, r in dropped],
        'computed_features_added': ['creator_followers_log_computed'],
        'final_feature_count': len(alive),
    }
    with open(os.path.join(args.output_dir, 'feature_audit_s7.json'), 'w') as f:
        json.dump(audit, f, indent=2)

    summary = {
        'experiment_name': 'v15-honest',
        'model_version': 'v15',
        'status': 'pending-approval',
        'training_rows_total': len(train),
        'holdout_rows': len(holdout),
        'variants': results,
        'winner': winner['variant'],
        'decisions': notes,
        'feature_audit': audit,
    }
    summary_path = os.path.join(args.output_dir, 'results_summary_s7.json')
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f'\nResults written to {summary_path}')
    print(f'Feature audit written to {os.path.join(args.output_dir, "feature_audit_s7.json")}')


if __name__ == '__main__':
    main()
