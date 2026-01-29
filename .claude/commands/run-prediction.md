# /run-prediction

Run the full Trendzo prediction pipeline on a test video.

## Usage

```
/run-prediction [VIDEO_ID]
```

If no VIDEO_ID provided, uses a random test video from the database.

---

## Steps

### Step 1: Get Test Video

If VIDEO_ID provided, use it. Otherwise:

```sql
SELECT id, tiktok_url, niche
FROM videos
WHERE transcript IS NOT NULL
  AND LENGTH(transcript) > 100
ORDER BY RANDOM()
LIMIT 1;
```

### Step 2: Run Prediction Pipeline

```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"videoId": "[VIDEO_ID]"}'
```

### Step 3: Verify Response Contains

Required fields:
- `run_id` - Traceability identifier
- `predicted_dps_7d` - Numeric score (0-100)
- `predicted_tier_7d` - String tier classification
- `success` - Boolean (should be true)

### Step 4: Check Component Results

```sql
SELECT
  component_id,
  success,
  latency_ms,
  error_message
FROM run_component_results
WHERE run_id = '[RUN_ID]'
ORDER BY component_id;
```

### Step 5: Report Results

```
============================================
TRENDZO PREDICTION TEST
============================================
Video ID:    [id]
TikTok URL:  [url]
Niche:       [niche]

--- PREDICTION RESULTS ---
Run ID:      [run_id]
DPS Score:   [predicted_dps_7d]
Tier:        [predicted_tier_7d]
Confidence:  [confidence]

--- COMPONENT SUMMARY ---
Total Components: [X]
Successful:       [Y]
Failed:           [Z]
Avg Latency:      [ms]

--- COMPONENT DETAILS ---
✅ feature-extraction: 142ms
✅ xgboost: 23ms
✅ gpt4: 1,247ms
❌ gemini: TIMEOUT (error: ...)

--- STATUS ---
Overall: PASS / FAIL
============================================
```

---

## Expected Outputs

### Success Case

```json
{
  "run_id": "abc123-def456-ghi789",
  "predicted_dps_7d": 65.5,
  "predicted_tier_7d": "good",
  "confidence": 0.85,
  "success": true,
  "components_run": 15,
  "total_latency_ms": 2450
}
```

### Failure Case

```json
{
  "success": false,
  "error": "Video not found",
  "run_id": "abc123-def456-ghi789",
  "status": "failed"
}
```

---

## Troubleshooting

### "Video not found"
- Verify video exists in `videos` table
- Check if video has transcript

### "Pipeline timeout"
- Check if dev server is running: `npm run dev`
- Check for component failures in logs

### "Component failed"
- Query `run_component_results` for error details
- Check if external APIs (OpenAI, Gemini) are responding

### "DPS score seems wrong"
- Use `/debug-prediction [VIDEO_ID]` for detailed analysis
- Use `/validate-features [VIDEO_ID]` to check feature extraction

---

## Related Commands

- [/check-pipeline](.claude/commands/check-pipeline.md) - System health check
- [/debug-prediction](.claude/commands/debug-prediction.md) - Debug wrong predictions
- [/validate-features](.claude/commands/validate-features.md) - Validate 119 features

---

## Reference

- [CLAUDE.md](../../CLAUDE.md) § Required Verification Steps
- [runPredictionPipeline.ts](../../src/lib/prediction/runPredictionPipeline.ts) - Canonical pipeline
