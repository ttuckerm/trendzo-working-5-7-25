# Autoresearch Data Directory

Holds exported snapshots of labeled prediction data for offline replay.
Actual data files are gitignored; only `.gitkeep` and this README are tracked.

## Export Contract

### Source: `prediction_runs` (row-level)

**Filter:** `actual_dps IS NOT NULL AND predicted_dps_7d IS NOT NULL`

Required fields per row:

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key, used to join component results |
| `video_id` | string (UUID) | For grouping / dedup |
| `predicted_dps_7d` | number | The predicted VPS written by the pipeline |
| `actual_dps` | number | Ground-truth VPS (post-publication actuals) |
| `prediction_range_low` | number or null | Low end of confidence interval |
| `prediction_range_high` | number or null | High end of confidence interval |
| `confidence` | number | Pipeline-level confidence (0-1) |
| `components_used` | string[] | Array of component IDs that ran |
| `labeling_mode` | string or null | manual / auto_cron / manual_script |
| `created_at` | string (ISO) | Timestamp of the prediction run |

Additionally, the export should extract from `raw_result` JSONB (when not truncated):

| Field | Path in raw_result | Notes |
|---|---|---|
| `adjustments_rawScore` | `.adjustments.rawScore` | Pre-calibration VPS |
| `adjustments_nicheFactor` | `.adjustments.nicheFactor` | Applied niche multiplier |
| `adjustments_accountFactor` | `.adjustments.accountFactor` | Applied account multiplier |
| `adjustments_accountSize` | `.adjustments.accountSize` | Account size label |
| `niche` | (from video_files join or raw_result) | Niche key |
| `score_lane_vps` | `.score_lane_vps` | Deterministic-only lane score |
| `llm_spread` | `.llm_spread` | Max LLM pred - min LLM pred |
| `llm_influence_applied` | `.llm_influence_applied` | Whether LLM affected VPS |

### Source: `run_component_results` (component-level)

**Join:** `run_id = prediction_runs.id`

Required fields per component row:

| Field | Type | Notes |
|---|---|---|
| `run_id` | string (UUID) | FK to prediction_runs |
| `component_id` | string | e.g. 'hook-scorer', '9-attributes', 'ffmpeg' |
| `success` | boolean | Whether component completed |
| `prediction` | number or null | Component's VPS prediction (0-100) |
| `confidence` | number or null | Component's confidence (0-1) |
| `features` | object or null | Component-specific JSONB (ffmpeg metrics, etc.) |

### Why `run_component_results` Is Primary

`raw_result` is truncated to a compact summary when it exceeds 500KB
(`runPredictionPipeline.ts:819-831`). Truncated rows lose the `paths` array which
contains per-component breakdowns. `run_component_results` is never truncated and
stores identical per-component prediction/confidence/features data independently.

### Expected Export Format

```
data/
  snapshot-YYYY-MM-DD.json   <- Single JSON file with structure:
    {
      "exported_at": "ISO timestamp",
      "filter": "actual_dps IS NOT NULL",
      "runs": [ { ...prediction_runs fields, components: [ ...component rows ] } ]
    }
```

The export script (to be built in sandbox/) will produce this format.
