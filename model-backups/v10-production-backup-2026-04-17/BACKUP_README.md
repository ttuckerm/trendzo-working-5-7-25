# v10 Production Model Backup

**Created:** 2026-04-17
**Reason:** Pre-promotion safety copy before considering promotion of v15-honest-with-res.

## Files

| File | Description |
|---|---|
| `xgboost-v10-model.json` | XGBoost booster (trained 2026-03-20) |
| `xgboost-v10-features.json` | Ordered list of 58 features |
| `xgboost-v10-metadata.json` | Hyperparameters, CV/holdout Spearman, training config |
| `xgboost-v10-scaler.json` | StandardScaler mean/std per feature |

## v10 Metrics (from metadata.json)

- **Holdout Spearman:** 0.7811 (on 50 holdout videos, stratified by tier)
- **CV Spearman:** 0.7399 ± 0.0268 (5-fold)
- **Features:** 58
- **Training rows:** 863
- **Trained:** 2026-03-20T12:46:25
- **Scaler type:** StandardScaler (mean/std)

## Restoring v10 From This Backup

If v15 is promoted and needs to be rolled back beyond the in-DB rollback path:

1. Copy these four files back to `C:/Projects/CleanCopy/models/` (overwriting).
2. Flip `model_variants.is_active = true` on the v10 row (and false on any other).
3. Call `invalidateRouteCache()` (or restart the app).

The DB-level rollback in `trainer-engine.ts:rollbackModelVariant()` handles steps 2–3
automatically as long as these model files remain reachable at `models/xgboost-v10-*.json`.
