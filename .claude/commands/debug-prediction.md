# /debug-prediction

Trace through the entire prediction pipeline to find issues when a prediction seems wrong.

## Usage

```
/debug-prediction [VIDEO_ID]
/debug-prediction [VIDEO_ID] --expected 70-80
```

---

## Debug Steps

### Step 1: Fetch Current State

```sql
-- Get all data for this video
SELECT
  v.id,
  v.tiktok_url,
  v.niche,
  v.account_size,
  LEFT(v.transcript, 500) as transcript_preview,
  LENGTH(v.transcript) as transcript_length,
  v.views,
  v.likes,
  v.comments,
  v.shares,
  v.created_at as video_created,

  -- Features
  f.features IS NOT NULL as has_features,
  jsonb_object_keys(f.features) as feature_count,

  -- Latest prediction
  p.run_id,
  p.predicted_dps_7d,
  p.predicted_tier_7d,
  p.confidence,
  p.mode,
  p.created_at as prediction_created,

  -- Component results
  cr.component_id,
  cr.success as component_success,
  cr.latency_ms,
  cr.error_message

FROM videos v
LEFT JOIN video_features f ON v.id = f.video_id
LEFT JOIN prediction_runs p ON v.id = p.video_id
LEFT JOIN run_component_results cr ON p.run_id = cr.run_id
WHERE v.id = '[VIDEO_ID]'
ORDER BY p.created_at DESC, cr.component_id;
```

### Step 2: Check Transcript Quality

```sql
-- Analyze transcript issues
SELECT
  id,
  CASE
    WHEN transcript IS NULL THEN 'NULL_TRANSCRIPT'
    WHEN LENGTH(transcript) = 0 THEN 'EMPTY_TRANSCRIPT'
    WHEN LENGTH(transcript) < 50 THEN 'TOO_SHORT'
    WHEN transcript LIKE '%[Music]%' THEN 'MUSIC_ONLY'
    WHEN transcript LIKE '%...%...%...%' THEN 'POSSIBLE_WHISPER_ERROR'
    ELSE 'OK'
  END as transcript_status,
  LENGTH(transcript) as length
FROM videos
WHERE id = '[VIDEO_ID]';
```

### Step 3: Verify Feature Extraction

Run `/validate-features [VIDEO_ID]` to check all 119 features.

Key things to check:
- Are all features present?
- Are any features NaN or null?
- Are ratios in valid ranges (0-1)?
- Does word_count match transcript length?

### Step 4: Test XGBoost Locally

```python
# scripts/test-xgboost-local.py
import xgboost as xgb
import numpy as np
import json
import sys

# Load the model
model = xgb.Booster()
model.load_model('models/xgboost_dps_v7.json')

# Load features for the video
with open(f'data/features_{sys.argv[1]}.json') as f:
    features = json.load(f)

# Create feature vector in correct order
feature_names = [
    # Group A: Basic Text Metrics (15)
    'word_count', 'char_count', 'sentence_count', 'avg_word_length',
    'avg_sentence_length', 'unique_word_count', 'lexical_diversity',
    'syllable_count', 'flesch_reading_ease', 'flesch_kincaid_grade',
    'smog_index', 'automated_readability_index', 'coleman_liau_index',
    'gunning_fog_index', 'linsear_write_formula',

    # Group B: Punctuation (10)
    'question_mark_count', 'exclamation_count', 'ellipsis_count',
    'comma_count', 'period_count', 'semicolon_count', 'colon_count',
    'dash_count', 'quotation_count', 'parenthesis_count',

    # Group C: Pronouns (8)
    'first_person_singular_count', 'first_person_plural_count',
    'second_person_count', 'third_person_count', 'first_person_ratio',
    'second_person_ratio', 'third_person_ratio', 'perspective_shift_count',

    # Group D: Emotional (19)
    'positive_emotion_count', 'negative_emotion_count', 'power_word_count',
    'urgency_word_count', 'curiosity_word_count', 'fear_word_count',
    'trust_word_count', 'surprise_word_count', 'anger_word_count',
    'sadness_word_count', 'joy_word_count', 'anticipation_word_count',
    'disgust_word_count', 'emotional_intensity_score', 'sentiment_polarity',
    'sentiment_subjectivity', 'emotional_volatility', 'positive_negative_ratio',
    'net_emotional_impact',

    # Group E: Viral Patterns (15)
    'shock_word_count', 'controversy_word_count', 'scarcity_word_count',
    'social_proof_word_count', 'authority_word_count', 'reciprocity_word_count',
    'commitment_word_count', 'liking_word_count', 'consensus_word_count',
    'storytelling_marker_count', 'conflict_word_count', 'resolution_word_count',
    'transformation_word_count', 'revelation_word_count', 'call_to_action_count',

    # Group F: Capitalization (5)
    'all_caps_word_count', 'title_case_ratio', 'sentence_case_ratio',
    'mixed_case_ratio', 'caps_lock_abuse_score',

    # Group G: Complexity (10)
    'polysyllabic_word_count', 'complex_word_ratio', 'rare_word_count',
    'jargon_count', 'slang_count', 'acronym_count', 'technical_term_count',
    'simple_word_ratio', 'average_syllables_per_word', 'lexical_density',

    # Group H: Dialogue (5)
    'direct_question_count', 'rhetorical_question_count',
    'imperative_sentence_count', 'dialogue_marker_count',
    'conversational_tone_score',

    # Group I: Structure (8)
    'has_numbered_list', 'has_bullet_points', 'list_item_count',
    'section_count', 'transition_word_count', 'introduction_length',
    'conclusion_length', 'body_to_intro_ratio',

    # Group J: Pacing (4)
    'words_per_second', 'silence_pause_count', 'rapid_fire_segments',
    'slow_segments',

    # Group K: Metadata (10)
    'video_duration_seconds', 'title_length', 'description_length',
    'hashtag_count', 'hashtag_total_chars', 'caption_length',
    'has_location', 'upload_hour', 'upload_day_of_week', 'days_since_upload',

    # Group L: Performance (10)
    'views_count', 'likes_count', 'comments_count', 'shares_count',
    'saves_count', 'engagement_rate', 'like_rate', 'comment_rate',
    'share_rate', 'dps_score'
]

feature_vector = [features.get(name, 0) for name in feature_names]

# Predict
dmatrix = xgb.DMatrix(np.array([feature_vector]), feature_names=feature_names)
raw_prediction = model.predict(dmatrix)[0]

print(f"Raw XGBoost prediction: {raw_prediction:.2f}")
print(f"\nFeature importance (top 10):")

# Get feature importance
importance = model.get_score(importance_type='gain')
sorted_importance = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:10]
for feat, score in sorted_importance:
    print(f"  {feat}: {score:.4f} (value: {features.get(feat, 'N/A')})")
```

### Step 5: Check GPT Refinement

```sql
-- Get GPT refinement details
SELECT
  cr.component_id,
  cr.features->>'base_score' as base_score,
  cr.features->>'refined_score' as refined_score,
  cr.features->>'adjustment' as adjustment,
  cr.features->>'reasoning' as reasoning
FROM run_component_results cr
JOIN prediction_runs p ON cr.run_id = p.run_id
WHERE p.video_id = '[VIDEO_ID]'
  AND cr.component_id IN ('gpt4', 'gemini', 'claude')
ORDER BY p.created_at DESC
LIMIT 3;
```

### Step 6: Compare to Similar Videos

```sql
-- Find similar videos by niche and performance
WITH target AS (
  SELECT niche, account_size,
    (SELECT predicted_dps_7d FROM prediction_runs WHERE video_id = '[VIDEO_ID]' ORDER BY created_at DESC LIMIT 1) as target_dps
  FROM videos WHERE id = '[VIDEO_ID]'
)
SELECT
  v.id,
  v.views,
  v.likes,
  p.predicted_dps_7d,
  p.predicted_tier_7d,
  f.features->>'word_count' as word_count,
  f.features->>'emotional_intensity_score' as emotion,
  f.features->>'hook_strength' as hook,
  ABS(p.predicted_dps_7d - t.target_dps) as dps_diff
FROM videos v
JOIN prediction_runs p ON v.id = p.video_id
JOIN video_features f ON v.id = f.video_id
CROSS JOIN target t
WHERE v.niche = t.niche
  AND v.id != '[VIDEO_ID]'
ORDER BY dps_diff ASC
LIMIT 10;
```

### Step 7: Check Component Success Rates

```sql
-- Did any components fail?
SELECT
  cr.component_id,
  cr.success,
  cr.error_message,
  cr.latency_ms
FROM run_component_results cr
JOIN prediction_runs p ON cr.run_id = p.run_id
WHERE p.video_id = '[VIDEO_ID]'
ORDER BY p.created_at DESC, cr.component_id;
```

### Step 8: Check for Known Issues

```sql
-- Common data quality issues
SELECT
  CASE
    WHEN v.views = 0 THEN 'ZERO_VIEWS'
    WHEN v.views > 1000000000 THEN 'SUSPICIOUS_VIEW_COUNT'
    WHEN v.likes > v.views THEN 'LIKES_EXCEED_VIEWS'
    WHEN (f.features->>'word_count')::int = 0 AND LENGTH(v.transcript) > 50 THEN 'FEATURE_EXTRACTION_FAILED'
    WHEN p.predicted_dps_7d IS NULL THEN 'PREDICTION_NULL'
    WHEN p.predicted_dps_7d < 0 OR p.predicted_dps_7d > 100 THEN 'DPS_OUT_OF_RANGE'
    ELSE 'NO_KNOWN_ISSUES'
  END as issue
FROM videos v
LEFT JOIN video_features f ON v.id = f.video_id
LEFT JOIN prediction_runs p ON v.id = p.video_id
WHERE v.id = '[VIDEO_ID]';
```

---

## Output Report

```
============================================
PREDICTION DEBUG: [VIDEO_ID]
============================================

Current DPS: 45.2
Expected Range: 70-80
Discrepancy: 25-35 points too low

--- DATA QUALITY ---
Transcript: ✅ Present (2,341 chars)
Features: ✅ 119/119 extracted
Video Metadata: ✅ All fields present
Historical Data: ⚠️ Views=0 (video just uploaded?)

--- COMPONENT RESULTS ---
✅ feature-extraction: 142ms
✅ xgboost: 23ms (raw score: 44.8)
✅ gpt4: 1,247ms (adjustment: +0.4)
✅ gemini: 892ms (adjustment: +0.0)

--- XGBOOST ANALYSIS ---
Raw prediction: 44.8
Top contributing features:
  1. emotional_intensity_score: 2.3 (below avg 4.1)
  2. hook_strength: 3.0 (below avg 5.2)
  3. engagement_rate: 0.00 (video has 0 views)
  4. word_count: 89 (below avg 156)

--- ROOT CAUSE ANALYSIS ---
🔍 Primary Issue: Video has 0 views (just uploaded)
   - engagement_rate, like_rate, etc. are all 0
   - This drags down the prediction significantly
   - XGBoost was trained on videos WITH performance data

🔍 Secondary Issue: Low emotional intensity
   - Score 2.3 vs average 4.1
   - May indicate flat delivery or purely informational content

--- RECOMMENDATION ---
1. For NEW videos (0 views): Use pre-content prediction mode
   which excludes Group L (performance) features

2. Re-run with:
   curl -X POST http://localhost:3000/api/predict/pre-content \
     -d '{"videoId": "[VIDEO_ID]"}'

3. If prediction still seems wrong after pre-content mode,
   review transcript quality and feature extraction manually
============================================
```

---

## Common Issues & Solutions

### Issue: DPS too low for viral video

**Symptoms:**
- Video has millions of views
- DPS prediction is < 50

**Causes:**
1. Stale data (views not updated)
2. Feature extraction failed
3. Unusual content type

**Solution:**
```bash
# Re-fetch video data
curl -X POST http://localhost:3000/api/scraping/refresh \
  -d '{"videoId": "[VIDEO_ID]"}'

# Re-run prediction
curl -X POST http://localhost:3000/api/predict \
  -d '{"videoId": "[VIDEO_ID]", "force": true}'
```

### Issue: DPS too high for flopped video

**Symptoms:**
- Video has low views
- DPS prediction is > 70

**Causes:**
1. Good content quality but poor distribution
2. Upload time issue
3. Account size mismatch

**Solution:**
Check if video is new (< 7 days). If yes, prediction may still be valid - give it time.

### Issue: NaN or null in prediction

**Symptoms:**
- `predicted_dps_7d` is null or NaN

**Causes:**
1. Feature extraction crashed
2. XGBoost received invalid input
3. Database write failed

**Solution:**
```sql
-- Check component errors
SELECT * FROM run_component_results
WHERE run_id = '[RUN_ID]'
  AND success = false;
```

### Issue: Inconsistent predictions

**Symptoms:**
- Same video gets different DPS each run

**Causes:**
1. LLM refinement variance (GPT/Gemini/Claude)
2. Stochastic components
3. Data changes between runs

**Solution:**
Run multiple times and average, or disable LLM refinement for consistency testing.

---

## Related Commands

- [/validate-features](./validate-features.md) - Validate all 119 features
- [/run-prediction](./run-prediction.md) - Run fresh prediction
- [/check-pipeline](./check-pipeline.md) - System health check

---

## Reference

- [runPredictionPipeline.ts](../../src/lib/prediction/runPredictionPipeline.ts) - Pipeline source
- [kai-orchestrator.ts](../../src/lib/orchestration/kai-orchestrator.ts) - Component orchestration
- [docs/COMPONENT_RUBRIC_AUDIT.md](../../docs/COMPONENT_RUBRIC_AUDIT.md) - Component documentation
