# Autoresearch Pipeline

Parameterized wrapper around `retrain_s7.py` for safe automated experiments.
Every experiment reuses the exact training pipeline that produced v15-honest-with-res
(0.68 holdout Spearman, 91 features, 5,645 rows) — the only knobs exposed are:

1. **--drop-features** — remove columns from the v15 honest feature set
2. **--add-features** — add derived columns (whitelist in `apply_derived_features`)
3. **--exclude-rows-where** — drop training/holdout rows by named filter
4. Optuna trial count + hyperparameter ranges

Leakage control, the train/holdout CSV split, encoding/scaling, and XGBoost
configuration are **not** parameterized — they come straight from
`retrain_s7.py` via `import retrain_s7 as s7`. Divergence from v15 is
impossible without editing `retrain_s7.py` itself.

## Files

| File | Purpose |
|---|---|
| `autoresearch_run.py` | Parameterized Python trainer |
| `bridge_results_to_db.ts` | TS orchestrator — acquires sandbox lock, spawns Python, writes `training_experiments` row |
| `README.md` | This file |

Output lives under `results-autoresearch/<experiment-id>/`:
```
results-autoresearch/auto-001/
├── model.json         # XGBoost booster
├── features.json      # ordered feature names
├── scaler.json        # MinMax + encoders + computed-feature flags
└── results.json       # canonical experiment report (ingested by the bridge)
```

## Running a single experiment

The bridge does the full orchestration (lock → Python → results.json → DB
write → release lock):

```bash
npx tsx src/lib/training/autoresearch/bridge_results_to_db.ts \
  --experiment-id auto-001 \
  --hypothesis "Dropping redundant music_is_original reduces double-counting" \
  --drop-features music_is_original
```

Python directly (no DB write) is useful for the reproduction check and for
debugging feature sets:

```bash
python src/lib/training/autoresearch/autoresearch_run.py \
  --experiment-id reproduction \
  --hypothesis "Re-run v15 with no changes" \
  --output-dir results-autoresearch/reproduction
```

## Reproduction check (Phase 1 validation)

Every new pipeline change needs a zero-args reproduction run. It must match
v15's reported holdout Spearman (0.6805) within ±0.005. If it doesn't, stop
and fix the parameterization before landing any experiment.

## Concurrency lock

`bridge_results_to_db.ts` acquires a sandbox-scoped lock in
`training_experiments` (same pattern as `trainer-engine.ts:acquireLock`).
Sandbox and production locks don't block each other, so the feedback-based
trainer can keep running. Two sandbox experiments cannot run simultaneously
— the second one exits with a descriptive error.

The lock row is `INSERT`'d before Python spawns and `UPDATE`'d with real
metrics when Python completes. If Python crashes, the row is updated with
`result='error'` + `error_message`, and the lock is released so the next run
can proceed.

## Leakage ban

`retrain_s7.BANNED_COLS` is the canonical post-publication engagement
blocklist. `autoresearch_run.py` refuses to proceed if `--drop-features`
names any banned column (ban is not optional — the guard is there so the
CLI can't be misused). `results.json` includes
`banned_columns_verified: true` as a contract check; the bridge refuses to
land a row where that flag is false.

## Adding a new derived feature

Whitelist it in `apply_derived_features()` inside `autoresearch_run.py`.
Every derived column must be computed deterministically from existing
non-banned data. See the `sound_metadata_available` branch for the pattern.
