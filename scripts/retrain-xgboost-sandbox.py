#!/usr/bin/env python3
"""
XGBoost Retrain Sandbox — Steps 3, 4, 5

Loads features from data/xgboost-retrain-input.json,
trains with LOOCV using v10 hyperparameters,
evaluates, saves model + results to data/sandbox/.

Usage:
  python scripts/retrain-xgboost-sandbox.py
"""

import json
import os
import sys
import time
import io
import numpy as np
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import xgboost as xgb
from sklearn.preprocessing import StandardScaler
from scipy.stats import spearmanr

# ── Paths ────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
SANDBOX_DIR = DATA_DIR / "sandbox"
INPUT_PATH = DATA_DIR / "xgboost-retrain-input.json"
V10_META_PATH = ROOT / "models" / "xgboost-v10-metadata.json"

SANDBOX_DIR.mkdir(parents=True, exist_ok=True)

# ── v10 Hyperparameters (locked — no tuning in this run) ─────────────────────

V10_HYPERPARAMS = {
    "objective": "reg:squarederror",
    "n_estimators": 413,
    "max_depth": 8,
    "learning_rate": 0.025847050593221715,
    "min_child_weight": 5,
    "subsample": 0.7064306141071703,
    "colsample_bytree": 0.716878246792974,
    "reg_alpha": 0.6170624733980454,
    "reg_lambda": 4.9455883361853195,
    "random_state": 42,
    "verbosity": 0,
}

# ── DPS Tier Classification ──────────────────────────────────────────────────

def classify_tier(score):
    if score >= 99.9: return "mega-viral"
    if score >= 99.0: return "hyper-viral"
    if score >= 95.0: return "viral"
    if score >= 70.0: return "above-average"
    if score >= 30.0: return "average"
    if score >= 5.0:  return "below-average"
    return "poor"

TIER_ORDER = ["poor", "below-average", "average", "above-average", "viral", "hyper-viral", "mega-viral"]

def tier_distance(t1, t2):
    try:
        return abs(TIER_ORDER.index(t1) - TIER_ORDER.index(t2))
    except ValueError:
        return 99

# ── Statistical Helpers ──────────────────────────────────────────────────────

def spearman_rho(x, y):
    rho, pval = spearmanr(x, y)
    return rho, pval

def calc_mae(predicted, actual):
    return float(np.mean(np.abs(np.array(predicted) - np.array(actual))))

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 66)
    print("  STEP 3: Retrain XGBoost (LOOCV, v10 hyperparams)")
    print("=" * 66 + "\n")

    # ── Load data ────────────────────────────────────────────────────────
    with open(INPUT_PATH) as f:
        data = json.load(f)

    feature_names = data["metadata"]["feature_names"]
    n_features = len(feature_names)
    n_rows = data["metadata"]["total_rows"]

    print(f"  Loaded: {n_rows} rows x {n_features} features")
    print(f"  Source: {data['metadata']['source']}")
    print(f"  Avg features per row: {data['metadata'].get('avg_features_per_row', 'N/A')}")
    print(f"  v10 was trained on: 863 rows (from training_features + scraped_videos)\n")

    # Build numpy arrays (NaN for missing features — XGBoost handles natively)
    X = np.full((n_rows, n_features), np.nan)
    y = np.zeros(n_rows)
    video_ids = []
    actual_tiers = []

    for i, row in enumerate(data["rows"]):
        video_ids.append(row["video_id"])
        y[i] = row["actual_dps_display_score"]
        actual_tiers.append(row.get("actual_dps_tier") or classify_tier(y[i]))
        for j, fname in enumerate(feature_names):
            val = row["features"].get(fname)
            if val is not None:
                X[i, j] = float(val)

    # Feature fill stats
    non_nan_per_row = np.sum(~np.isnan(X), axis=1)
    non_nan_per_feature = np.sum(~np.isnan(X), axis=0)

    print(f"  Target stats: min={y.min():.1f}, max={y.max():.1f}, mean={y.mean():.1f}, "
          f"std={y.std():.1f}, median={np.median(y):.1f}")
    print(f"  Feature fill: min={non_nan_per_row.min()}, max={non_nan_per_row.max()}, "
          f"mean={non_nan_per_row.mean():.1f}")

    # Features with zero fill (completely missing across all rows)
    zero_fill = [feature_names[j] for j in range(n_features) if non_nan_per_feature[j] == 0]
    if zero_fill:
        print(f"\n  Features with 0% fill ({len(zero_fill)}):")
        for fname in zero_fill[:10]:
            print(f"    - {fname}")
        if len(zero_fill) > 10:
            print(f"    ... and {len(zero_fill) - 10} more")

    # ── LOOCV Training ───────────────────────────────────────────────────
    print(f"\n{'─' * 50}")
    print(f"  LEAVE-ONE-OUT CROSS-VALIDATION (n={n_rows})")
    print(f"{'─' * 50}\n")

    loocv_predictions = np.zeros(n_rows)
    start_time = time.time()

    for i in range(n_rows):
        X_train = np.delete(X, i, axis=0)
        y_train = np.delete(y, i, axis=0)
        X_test = X[i:i+1, :]

        # StandardScaler: fit on training fold, transform both
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # Replace NaN with 0 after scaling (training mean imputation)
        X_train_scaled = np.nan_to_num(X_train_scaled, nan=0.0)
        X_test_scaled = np.nan_to_num(X_test_scaled, nan=0.0)

        model = xgb.XGBRegressor(**V10_HYPERPARAMS)
        model.fit(X_train_scaled, y_train, verbose=False)

        pred = model.predict(X_test_scaled)[0]
        loocv_predictions[i] = np.clip(pred, 0, 100)

        if (i + 1) % 10 == 0 or i == n_rows - 1:
            elapsed = time.time() - start_time
            eta = elapsed / (i + 1) * (n_rows - i - 1)
            sys.stdout.write(f"\r  LOOCV: {i+1}/{n_rows} ({(i+1)/n_rows*100:.0f}%) "
                           f"| Elapsed: {elapsed:.0f}s | ETA: {eta:.0f}s")
            sys.stdout.flush()

    total_time = time.time() - start_time
    print(f"\n  Completed in {total_time:.1f}s ({total_time/n_rows:.2f}s per fold)\n")

    # ── Train full model (for saving) ────────────────────────────────────
    print(f"{'─' * 50}")
    print(f"  Training full model on all {n_rows} rows")
    print(f"{'─' * 50}\n")

    full_scaler = StandardScaler()
    X_full_scaled = full_scaler.fit_transform(X)
    X_full_scaled = np.nan_to_num(X_full_scaled, nan=0.0)

    full_model = xgb.XGBRegressor(**V10_HYPERPARAMS)
    full_model.fit(X_full_scaled, y, verbose=False)

    model_path = SANDBOX_DIR / "xgboost-v11-sandbox.model"
    full_model.save_model(str(model_path))
    print(f"  Saved model: {model_path}")

    scaler_data = {
        "mean": full_scaler.mean_.tolist(),
        "std": full_scaler.scale_.tolist(),
        "feature_names": feature_names,
    }
    scaler_path = SANDBOX_DIR / "xgboost-v11-sandbox-scaler.json"
    with open(scaler_path, "w") as f:
        json.dump(scaler_data, f, indent=2)

    features_path = SANDBOX_DIR / "xgboost-v11-sandbox-features.json"
    with open(features_path, "w") as f:
        json.dump(feature_names, f, indent=2)

    importance = full_model.feature_importances_
    top_features = sorted(
        zip(feature_names, importance.tolist()),
        key=lambda x: x[1], reverse=True,
    )[:20]

    print(f"\n  Top 10 features by importance:")
    for fname, imp in top_features[:10]:
        bar = '#' * int(imp * 200)
        print(f"    {fname:40s} {imp:.4f} {bar}")

    # ══════════════════════════════════════════════════════════════════════
    print(f"\n{'=' * 66}")
    print(f"  STEP 4: Evaluate")
    print(f"{'=' * 66}\n")

    # Spearman rho
    rho_new, p_new = spearman_rho(loocv_predictions, y)
    mae_new = calc_mae(loocv_predictions, y)

    # Per-tier accuracy
    predicted_tiers = [classify_tier(p) for p in loocv_predictions]
    tier_stats = {}
    for tier in TIER_ORDER:
        tier_indices = [i for i, t in enumerate(actual_tiers) if t == tier]
        if len(tier_indices) == 0:
            continue
        exact = sum(1 for i in tier_indices if predicted_tiers[i] == tier)
        adjacent = sum(1 for i in tier_indices if tier_distance(predicted_tiers[i], tier) <= 1)
        tier_stats[tier] = {
            "count": len(tier_indices),
            "exact_match": exact,
            "exact_pct": round(exact / len(tier_indices) * 100, 1),
            "adjacent_match": adjacent,
            "adjacent_pct": round(adjacent / len(tier_indices) * 100, 1),
        }

    within_5 = sum(1 for p, a in zip(loocv_predictions, y) if abs(p - a) <= 5) / n_rows * 100
    within_10 = sum(1 for p, a in zip(loocv_predictions, y) if abs(p - a) <= 10) / n_rows * 100

    # Load v10 baseline for comparison
    v10_cv_spearman = 0.61  # user-provided baseline on 17 labeled rows
    v10_cv_mae = None
    v10_holdout_spearman = None

    if V10_META_PATH.exists():
        with open(V10_META_PATH) as f:
            v10_meta = json.load(f)
        v10_holdout_spearman = v10_meta["performance"]["holdout"]["spearman_rho"]
        v10_cv_mae = v10_meta["performance"]["cv_5fold"]["mae_mean"]

    # ── Print Results ────────────────────────────────────────────────────
    print("  SUMMARY")
    print(f"  {'─' * 62}")
    print(f"  {'Metric':<30s} {'v10 baseline':<20s} {'v11 sandbox':<20s}")
    print(f"  {'─' * 62}")
    print(f"  {'Spearman rho':<30s} {'0.61 (17 rows)':<20s} {rho_new:<20.4f}")
    print(f"  {'MAE (display score)':<30s} {'N/A':<20s} {mae_new:<20.2f}")
    print(f"  {'Within 5 DPS (%)':<30s} {'N/A':<20s} {within_5:<20.1f}")
    print(f"  {'Within 10 DPS (%)':<30s} {'N/A':<20s} {within_10:<20.1f}")
    print(f"  {'Training rows':<30s} {'17':<20s} {str(n_rows):<20s}")
    print()

    if v10_holdout_spearman:
        print(f"  v10 holdout (863-row model on 50-row holdout): Spearman={v10_holdout_spearman:.4f}")
    print()

    # Per-tier breakdown
    print(f"  PER-TIER ACCURACY (v11-sandbox LOOCV)")
    print(f"  {'─' * 55}")
    print(f"  {'Tier':<20s} {'Count':>6s} {'Exact':>8s} {'+/-1 Tier':>10s}")
    print(f"  {'─' * 55}")
    for tier in TIER_ORDER:
        if tier in tier_stats:
            ts = tier_stats[tier]
            print(f"  {tier:<20s} {ts['count']:>6d} {ts['exact_pct']:>7.1f}% {ts['adjacent_pct']:>9.1f}%")
    print()

    # Scatter data (all rows, sorted by error)
    print(f"  SCATTER DATA — Predicted vs Actual (sorted by |error|)")
    print(f"  {'─' * 95}")
    print(f"  {'Video ID':<24s} {'Predicted':>10s} {'Actual':>10s} {'Error':>8s} {'Pred Tier':<16s} {'Act Tier':<16s}")
    print(f"  {'─' * 95}")

    scatter = sorted(
        zip(video_ids, loocv_predictions, y, actual_tiers, predicted_tiers),
        key=lambda x: abs(x[1] - x[2]),
        reverse=True,
    )

    for vid, pred, actual, act_tier, pred_tier in scatter:
        err = pred - actual
        marker = " <<<" if abs(err) > 25 else (" <<" if abs(err) > 15 else "")
        print(f"  {vid[:22]:<24s} {pred:>10.1f} {actual:>10.1f} {err:>+8.1f} {pred_tier:<16s} {act_tier:<16s}{marker}")

    # ── Save evaluation results ──────────────────────────────────────────
    eval_results = {
        "model_version": "v11-sandbox",
        "training_rows": n_rows,
        "feature_count": n_features,
        "avg_features_per_row": data["metadata"].get("avg_features_per_row"),
        "evaluation_method": "LOOCV",
        "v10_baseline": {
            "spearman_on_17_rows": 0.61,
            "holdout_spearman": v10_holdout_spearman,
            "cv_mae": v10_cv_mae,
            "training_rows": 863,
        },
        "v11_sandbox": {
            "loocv_spearman": round(rho_new, 4),
            "loocv_spearman_p": round(p_new, 8),
            "loocv_mae": round(mae_new, 2),
            "loocv_within_5": round(within_5, 1),
            "loocv_within_10": round(within_10, 1),
        },
        "delta": {
            "spearman_vs_baseline": round(rho_new - 0.61, 4),
        },
        "per_tier": tier_stats,
        "top_features": [{"feature": f, "importance": round(imp, 4)} for f, imp in top_features],
        "scatter": [
            {
                "video_id": vid,
                "predicted": round(float(pred), 1),
                "actual": round(float(act), 1),
                "error": round(float(pred - act), 1),
                "predicted_tier": ptier,
                "actual_tier": atier,
            }
            for vid, pred, act, atier, ptier in scatter
        ],
        "hyperparameters": V10_HYPERPARAMS,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }

    eval_path = SANDBOX_DIR / "retrain-evaluation.json"
    with open(eval_path, "w") as f:
        json.dump(eval_results, f, indent=2)
    print(f"\n  Saved evaluation: {eval_path}")

    # Save metadata
    meta = {
        "model_version": "v11-sandbox",
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "source": data["metadata"]["source"],
        "dataset": { "total_rows": n_rows },
        "target_stats": {
            "min": float(y.min()), "max": float(y.max()),
            "mean": float(y.mean()), "std": float(y.std()),
            "median": float(np.median(y)),
        },
        "performance": {
            "loocv": {
                "spearman_rho": round(rho_new, 4),
                "mae": round(mae_new, 2),
                "within_5_pct": round(within_5, 1),
                "within_10_pct": round(within_10, 1),
                "n": n_rows,
            },
        },
        "hyperparameters": V10_HYPERPARAMS,
        "feature_count": n_features,
        "avg_features_per_row": data["metadata"].get("avg_features_per_row"),
        "top_features": [{"feature": f, "importance": round(imp, 4)} for f, imp in top_features[:20]],
    }

    meta_path = SANDBOX_DIR / "xgboost-v11-sandbox-metadata.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"  Saved metadata: {meta_path}")

    # ══════════════════════════════════════════════════════════════════════
    print(f"\n{'=' * 66}")
    print(f"  STEP 5: Recommendation")
    print(f"{'=' * 66}\n")

    print(f"  Old model (v10, 17 rows): Spearman rho = 0.61")
    print(f"  New model (v11-sandbox, {n_rows} rows): Spearman rho = {rho_new:.4f}")
    improvement = rho_new - 0.61
    print(f"  Improvement: {improvement:+.4f}\n")

    if rho_new > 0.63 and mae_new < 20:
        print("  >>> PROMOTE: v11 outperforms v10, ready to replace production model")
    elif rho_new < 0.55:
        print("  >>> INVESTIGATE: Performance degraded, check data quality")
        print("     Possible causes: partial features (NaN), small sample, tier imbalance")
    else:
        print("  >>> HOLD: Marginal improvement, consider feature expansion before promoting")

    print(f"\n  Model saved to data/sandbox/ — NOT promoted to production.")
    print(f"  Review results and decide manually.\n")

    # Files summary
    print(f"  FILES CREATED:")
    print(f"    data/xgboost-retrain-input.json         — Feature matrix + targets")
    print(f"    data/sandbox/xgboost-v11-sandbox.model   — Trained model (NOT production)")
    print(f"    data/sandbox/xgboost-v11-sandbox-scaler.json")
    print(f"    data/sandbox/xgboost-v11-sandbox-features.json")
    print(f"    data/sandbox/xgboost-v11-sandbox-metadata.json")
    print(f"    data/sandbox/retrain-evaluation.json     — Full evaluation results")


if __name__ == "__main__":
    main()
