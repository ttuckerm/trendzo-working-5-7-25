"""
v12 Sandbox — Step 2: Train + Evaluate.
Loads exported JSON from Step 1. Requires only numpy + xgboost.
SANDBOX ONLY — does NOT overwrite v10.

Usage: python -u scripts/v12-step2-train.py
"""
import sys, os, json, time
import numpy as np
import xgboost as xgb

sys.stdout.reconfigure(encoding='utf-8')
print(f'xgboost {xgb.__version__} loaded', flush=True)

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SANDBOX_DIR = os.path.join(PROJECT_ROOT, 'data', 'sandbox')
INPUT_PATH = os.path.join(SANDBOX_DIR, 'v12-training-data.json')
V10_META_PATH = os.path.join(PROJECT_ROOT, 'models', 'xgboost-v10-metadata.json')

NUM_BOOST_ROUNDS = 413
XGB_PARAMS = {
    'objective': 'reg:squarederror',
    'max_depth': 8,
    'learning_rate': 0.025847050593221715,
    'min_child_weight': 5,
    'subsample': 0.7064306141071703,
    'colsample_bytree': 0.716878246792974,
    'reg_alpha': 0.6170624733980454,
    'reg_lambda': 4.9455883361853195,
    'nthread': -1,
    'verbosity': 0,
    'seed': 42,
}
RANDOM_STATE = 42


def classify_tier(dps):
    if dps >= 90: return 'mega-viral'
    if dps >= 70: return 'viral'
    if dps >= 60: return 'good'
    if dps >= 40: return 'average'
    return 'low'


def rank_array(arr):
    n = len(arr)
    order = np.argsort(arr)
    ranks = np.empty(n, dtype=float)
    i = 0
    while i < n:
        j = i
        while j < n - 1 and arr[order[j + 1]] == arr[order[j]]:
            j += 1
        avg_rank = (i + j) / 2.0 + 1.0
        for k in range(i, j + 1):
            ranks[order[k]] = avg_rank
        i = j + 1
    return ranks


def spearman_rho(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float)
    rx, ry = rank_array(x), rank_array(y)
    mx, my = np.mean(rx), np.mean(ry)
    cov = np.sum((rx - mx) * (ry - my))
    sx = np.sqrt(np.sum((rx - mx) ** 2))
    sy = np.sqrt(np.sum((ry - my) ** 2))
    if sx == 0 or sy == 0:
        return 0.0
    return float(cov / (sx * sy))


def build_matrix(rows, feature_names):
    n = len(rows)
    m = len(feature_names)
    X = np.zeros((n, m))
    y = np.zeros(n)
    for i, row in enumerate(rows):
        y[i] = row['dps_score']
        for j, f in enumerate(feature_names):
            X[i, j] = row['features'].get(f, 0.0)
    return X, y


def standardize(X_train, X_test=None):
    mean = np.mean(X_train, axis=0)
    std = np.std(X_train, axis=0)
    std[std == 0] = 1.0
    X_train_s = (X_train - mean) / std
    X_test_s = (X_test - mean) / std if X_test is not None else None
    return X_train_s, X_test_s, mean, std


def evaluate(y_true, y_pred):
    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = float(1 - ss_res / ss_tot) if ss_tot > 0 else 0.0
    rho = spearman_rho(y_true, y_pred)
    w5 = float(np.mean(np.abs(y_true - y_pred) <= 5) * 100)
    w10 = float(np.mean(np.abs(y_true - y_pred) <= 10) * 100)
    at = [classify_tier(d) for d in y_true]
    pt = [classify_tier(d) for d in y_pred]
    tier = sum(a == p for a, p in zip(at, pt)) / len(y_true) * 100
    return {'rho': rho, 'mae': mae, 'rmse': rmse, 'r2': r2, 'w5': w5, 'w10': w10, 'tier': tier}


def main():
    p = lambda *a, **k: print(*a, **k, flush=True)

    p('=' * 66)
    p('  v12 SANDBOX — Step 2: Train + Evaluate')
    p('=' * 66)

    with open(INPUT_PATH) as f:
        data = json.load(f)
    meta = data['metadata']
    feature_names = meta['feature_names']
    p(f'\n  Loaded {meta["total_rows"]} rows, {meta["feature_count"]} features')
    p(f'  Train: {meta["train_rows"]}, Holdout: {meta["holdout_rows"]}')
    p(f'  v10 had: {meta["v10_had"]} rows (delta: +{meta["total_rows"] - meta["v10_had"]})')

    train_rows = [r for r in data['rows'] if not r['is_holdout']]
    holdout_rows = [r for r in data['rows'] if r['is_holdout']]

    X_train, y_train = build_matrix(train_rows, feature_names)
    X_holdout, y_holdout = build_matrix(holdout_rows, feature_names)

    p(f'  X_train: {X_train.shape}, X_holdout: {X_holdout.shape}')
    p(f'  Target: min={y_train.min():.1f}, max={y_train.max():.1f}, mean={y_train.mean():.1f}, std={y_train.std():.1f}')

    X_train_s, X_holdout_s, sc_mean, sc_std = standardize(X_train, X_holdout)

    # === TRAIN ===
    p(f'\n  Training ({NUM_BOOST_ROUNDS} rounds)...')
    t0 = time.time()
    dtrain = xgb.DMatrix(X_train_s, label=y_train, feature_names=feature_names)
    dholdout = xgb.DMatrix(X_holdout_s, label=y_holdout, feature_names=feature_names)
    model = xgb.train(XGB_PARAMS, dtrain, num_boost_round=NUM_BOOST_ROUNDS)
    p(f'  Trained in {time.time()-t0:.1f}s')

    y_pred_train = np.clip(model.predict(dtrain), 0, 100)
    y_pred_holdout = np.clip(model.predict(dholdout), 0, 100)

    m_train = evaluate(y_train, y_pred_train)
    m_holdout = evaluate(y_holdout, y_pred_holdout)

    p(f'  Train:   rho={m_train["rho"]:.4f}, MAE={m_train["mae"]:.2f}')
    p(f'  Holdout: rho={m_holdout["rho"]:.4f}, MAE={m_holdout["mae"]:.2f}')

    # === 5-FOLD CV ===
    p(f'\n  5-fold cross-validation...')
    n = len(y_train)
    indices = np.arange(n)
    rng = np.random.RandomState(RANDOM_STATE)
    rng.shuffle(indices)
    fold_size = n // 5
    cv_rhos, cv_maes, cv_w10s = [], [], []

    for fold_i in range(5):
        start = fold_i * fold_size
        end = start + fold_size if fold_i < 4 else n
        val_idx = indices[start:end]
        train_idx = np.concatenate([indices[:start], indices[end:]])

        Xtr, Xva = X_train_s[train_idx], X_train_s[val_idx]
        ytr, yva = y_train[train_idx], y_train[val_idx]

        dtr = xgb.DMatrix(Xtr, label=ytr)
        dva = xgb.DMatrix(Xva)
        bst = xgb.train(XGB_PARAMS, dtr, num_boost_round=NUM_BOOST_ROUNDS)
        preds = np.clip(bst.predict(dva), 0, 100)
        rho = spearman_rho(yva, preds)
        mae = float(np.mean(np.abs(yva - preds)))
        w10 = float(np.mean(np.abs(yva - preds) <= 10) * 100)
        cv_rhos.append(rho)
        cv_maes.append(mae)
        cv_w10s.append(w10)
        p(f'    Fold {fold_i+1}: rho={rho:.4f}, MAE={mae:.2f}, +/-10={w10:.1f}%')

    cv_rho_mean = np.mean(cv_rhos)
    cv_rho_std = np.std(cv_rhos)
    cv_mae_mean = np.mean(cv_maes)
    cv_mae_std = np.std(cv_maes)
    cv_w10_mean = np.mean(cv_w10s)

    p(f'\n  CV Summary: rho={cv_rho_mean:.4f}+/-{cv_rho_std:.4f}, MAE={cv_mae_mean:.2f}+/-{cv_mae_std:.2f}, +/-10={cv_w10_mean:.1f}%')

    # === FEATURE IMPORTANCE ===
    imp_dict = model.get_score(importance_type='weight')
    total_imp = sum(imp_dict.values()) if imp_dict else 1
    importances = [(f, imp_dict.get(f, 0) / total_imp) for f in feature_names]
    importances.sort(key=lambda x: x[1], reverse=True)

    # Load v10 baselines
    with open(V10_META_PATH) as f:
        v10_meta = json.load(f)
    v10_cv_rho = v10_meta['performance']['cv_5fold']['spearman_mean']
    v10_cv_std = v10_meta['performance']['cv_5fold']['spearman_std']
    v10_cv_mae = v10_meta['performance']['cv_5fold']['mae_mean']
    v10_ho_rho = v10_meta['performance']['holdout']['spearman_rho']
    v10_ho_mae = v10_meta['performance']['holdout']['mae']
    v10_ho_w10 = v10_meta['performance']['holdout']['within_10_dps_pct']
    v10_ho_tier = v10_meta['performance']['holdout']['tier_accuracy_pct']
    v10_top = v10_meta.get('top_features', [])
    v10_rank = {f['feature']: i + 1 for i, f in enumerate(v10_top)}
    v10_imp = {f['feature']: f['importance'] for f in v10_top}
    V10_NEW_FEATS = set(v10_meta.get('new_features_added', []))

    # === COMPARISON TABLE ===
    p(f'\n{"=" * 66}')
    p(f'  COMPARISON: v12-sandbox vs v10')
    p(f'{"=" * 66}')
    p(f'  {"Metric":<28s} {"v10 (prod)":<18s} {"v12 (sandbox)":<18s} {"Delta":<10s}')
    p(f'  {"=" * 74}')
    p(f'  {"Training rows":<28s} {meta["v10_had"]:<18d} {meta["total_rows"]:<18d} +{meta["total_rows"]-meta["v10_had"]}')
    p(f'  {"CV Spearman rho":<28s} {v10_cv_rho:<18.4f} {cv_rho_mean:<18.4f} {cv_rho_mean-v10_cv_rho:+.4f}')
    p(f'  {"CV Spearman std":<28s} {v10_cv_std:<18.4f} {cv_rho_std:<18.4f}')
    p(f'  {"CV MAE":<28s} {v10_cv_mae:<18.2f} {cv_mae_mean:<18.2f} {cv_mae_mean-v10_cv_mae:+.2f}')
    p(f'  {"Holdout Spearman rho":<28s} {v10_ho_rho:<18.4f} {m_holdout["rho"]:<18.4f} {m_holdout["rho"]-v10_ho_rho:+.4f}')
    p(f'  {"Holdout MAE":<28s} {v10_ho_mae:<18.2f} {m_holdout["mae"]:<18.2f} {m_holdout["mae"]-v10_ho_mae:+.2f}')
    p(f'  {"Holdout +/-10 DPS":<28s} {v10_ho_w10:<17.1f}% {m_holdout["w10"]:<17.1f}% {m_holdout["w10"]-v10_ho_w10:+.1f}%')
    p(f'  {"Holdout Tier Accuracy":<28s} {v10_ho_tier:<17.1f}% {m_holdout["tier"]:<17.1f}% {m_holdout["tier"]-v10_ho_tier:+.1f}%')

    # === TOP 15 FEATURES ===
    p(f'\n  Top 15 Features (v12-sandbox)')
    p(f'  {"Rank":<6s} {"Feature":<38s} {"Import.":<10s} {"v10 Rank":<10s}')
    p(f'  {"-" * 64}')
    for i, (feat, imp) in enumerate(importances[:15]):
        v10r = str(v10_rank.get(feat, '-'))
        marker = ' *NEW*' if feat in V10_NEW_FEATS else ''
        p(f'  {i+1:<6d} {feat + marker:<38s} {imp:<10.4f} {v10r:<10s}')

    # Dropped from v10 top 20
    v12_top15 = set(f for f, _ in importances[:15])
    v10_top20 = set(f['feature'] for f in v10_top[:20])
    dropped = v10_top20 - v12_top15
    p(f'\n  Dropped from v10 top-20:')
    if dropped:
        for feat in sorted(dropped, key=lambda f: v10_rank.get(f, 99)):
            v12_pairs = [(f, i) for f, i in importances if f == feat]
            if v12_pairs:
                v12_i = v12_pairs[0][1]
                v12_r = sum(1 for _, i in importances if i > v12_i) + 1
                p(f'    {feat}: v10 #{v10_rank.get(feat)} -> v12 #{v12_r}')
    else:
        p(f'    (none)')

    emerged = v12_top15 - v10_top20
    p(f'\n  Emerged in v12 top-15:')
    if emerged:
        for feat in sorted(emerged, key=lambda f: next((i for fn, i in importances if fn == f), 0), reverse=True):
            v12_r = sum(1 for _, i in importances if i > next(i for fn, i in importances if fn == feat)) + 1
            p(f'    {feat}: v12 #{v12_r}')
    else:
        p(f'    (none)')

    # === SAVE ARTIFACTS ===
    p(f'\n  Saving artifacts...')
    model.save_model(os.path.join(SANDBOX_DIR, 'xgboost-v12-sandbox-model.json'))
    with open(os.path.join(SANDBOX_DIR, 'xgboost-v12-sandbox-features.json'), 'w') as f:
        json.dump(feature_names, f, indent=2)
    with open(os.path.join(SANDBOX_DIR, 'xgboost-v12-sandbox-scaler.json'), 'w') as f:
        json.dump({'mean': sc_mean.tolist(), 'std': sc_std.tolist(), 'feature_names': feature_names}, f, indent=2)

    metadata = {
        'model_version': 'v12-sandbox',
        'trained_at': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'WARNING': 'SANDBOX ONLY. Do NOT overwrite v10.',
        'feature_count': len(feature_names),
        'feature_names': feature_names,
        'dataset': {
            'total_rows': meta['total_rows'], 'train_rows': meta['train_rows'],
            'holdout_rows': meta['holdout_rows'], 'v10_had': meta['v10_had'],
        },
        'performance': {
            'train': m_train, 'holdout': m_holdout,
            'cv_5fold': {
                'spearman_mean': cv_rho_mean, 'spearman_std': cv_rho_std,
                'mae_mean': cv_mae_mean, 'mae_std': cv_mae_std,
                'within_10_mean': cv_w10_mean,
                'per_fold': [{'rho': r, 'mae': m, 'w10': w} for r, m, w in zip(cv_rhos, cv_maes, cv_w10s)],
            },
        },
        'comparison_vs_v10': {
            'v10_cv_rho': v10_cv_rho, 'v12_cv_rho': cv_rho_mean, 'delta_cv': cv_rho_mean - v10_cv_rho,
            'v10_holdout_rho': v10_ho_rho, 'v12_holdout_rho': m_holdout['rho'], 'delta_holdout': m_holdout['rho'] - v10_ho_rho,
            'v10_rows': meta['v10_had'], 'v12_rows': meta['total_rows'],
        },
        'hyperparameters': {**XGB_PARAMS, 'num_boost_round': NUM_BOOST_ROUNDS},
        'top_features': [{'feature': f, 'importance': round(imp, 6)} for f, imp in importances[:20]],
    }
    with open(os.path.join(SANDBOX_DIR, 'xgboost-v12-sandbox-metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)

    p(f'\n{"=" * 66}')
    p(f'  SANDBOX SUMMARY')
    p(f'{"=" * 66}')
    p(f'  Training set: {meta["total_rows"]} rows (v10 had {meta["v10_had"]})')
    p(f'  CV Spearman rho: {cv_rho_mean:.4f} (v10: {v10_cv_rho:.4f}, delta: {cv_rho_mean-v10_cv_rho:+.4f})')
    p(f'  Holdout Spearman rho: {m_holdout["rho"]:.4f} (v10: {v10_ho_rho:.4f}, delta: {m_holdout["rho"]-v10_ho_rho:+.4f})')
    p(f'  v10 NOT touched. All artifacts in data/sandbox/.')
    p(f'{"=" * 66}')


if __name__ == '__main__':
    main()
