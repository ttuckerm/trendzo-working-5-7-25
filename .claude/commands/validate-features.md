# /validate-features

Deep validation of all 119 XGBoost features for a specific video.

## Usage

```
/validate-features [VIDEO_ID]
```

---

## Feature Groups (119 Total)

### Group A: Basic Text Metrics (15 features)

| Feature | Type | Valid Range | Description |
|---------|------|-------------|-------------|
| word_count | int | 0-5000 | Total words in transcript |
| char_count | int | 0-30000 | Total characters |
| sentence_count | int | 0-500 | Number of sentences |
| avg_word_length | float | 2-15 | Average characters per word |
| avg_sentence_length | float | 3-50 | Average words per sentence |
| unique_word_count | int | 0-2000 | Distinct words used |
| lexical_diversity | float | 0-1 | unique_words / total_words |
| syllable_count | int | 0-10000 | Total syllables |
| flesch_reading_ease | float | 0-100 | Higher = easier to read |
| flesch_kincaid_grade | float | 0-20 | US grade level |
| smog_index | float | 0-20 | Years of education needed |
| automated_readability_index | float | 0-20 | ARI score |
| coleman_liau_index | float | 0-20 | Coleman-Liau score |
| gunning_fog_index | float | 0-20 | Gunning fog score |
| linsear_write_formula | float | 0-20 | Linsear write score |

### Group B: Punctuation Analysis (10 features)

| Feature | Type | Valid Range |
|---------|------|-------------|
| question_mark_count | int | 0-100 |
| exclamation_count | int | 0-100 |
| ellipsis_count | int | 0-50 |
| comma_count | int | 0-500 |
| period_count | int | 0-500 |
| semicolon_count | int | 0-50 |
| colon_count | int | 0-50 |
| dash_count | int | 0-100 |
| quotation_count | int | 0-100 |
| parenthesis_count | int | 0-50 |

### Group C: Pronoun Perspective (8 features)

| Feature | Type | Valid Range |
|---------|------|-------------|
| first_person_singular_count | int | 0-500 |
| first_person_plural_count | int | 0-200 |
| second_person_count | int | 0-300 |
| third_person_count | int | 0-500 |
| first_person_ratio | float | 0-1 |
| second_person_ratio | float | 0-1 |
| third_person_ratio | float | 0-1 |
| perspective_shift_count | int | 0-100 |

### Group D: Emotional Power Words (19 features)

| Feature | Type | Valid Range |
|---------|------|-------------|
| positive_emotion_count | int | 0-200 |
| negative_emotion_count | int | 0-200 |
| power_word_count | int | 0-100 |
| urgency_word_count | int | 0-50 |
| curiosity_word_count | int | 0-50 |
| fear_word_count | int | 0-50 |
| trust_word_count | int | 0-50 |
| surprise_word_count | int | 0-50 |
| anger_word_count | int | 0-50 |
| sadness_word_count | int | 0-50 |
| joy_word_count | int | 0-50 |
| anticipation_word_count | int | 0-50 |
| disgust_word_count | int | 0-50 |
| emotional_intensity_score | float | 0-10 |
| sentiment_polarity | float | -1 to 1 |
| sentiment_subjectivity | float | 0-1 |
| emotional_volatility | float | 0-10 |
| positive_negative_ratio | float | 0-100 |
| net_emotional_impact | float | -100 to 100 |

### Group E: Viral Pattern Words (15 features)

| Feature | Type | Valid Range |
|---------|------|-------------|
| shock_word_count | int | 0-30 |
| controversy_word_count | int | 0-30 |
| scarcity_word_count | int | 0-30 |
| social_proof_word_count | int | 0-30 |
| authority_word_count | int | 0-30 |
| reciprocity_word_count | int | 0-30 |
| commitment_word_count | int | 0-30 |
| liking_word_count | int | 0-30 |
| consensus_word_count | int | 0-30 |
| storytelling_marker_count | int | 0-50 |
| conflict_word_count | int | 0-30 |
| resolution_word_count | int | 0-30 |
| transformation_word_count | int | 0-30 |
| revelation_word_count | int | 0-30 |
| call_to_action_count | int | 0-20 |

### Group F: Capitalization & Formatting (5 features)

| Feature | Type | Valid Range |
|---------|------|-------------|
| all_caps_word_count | int | 0-100 |
| title_case_ratio | float | 0-1 |
| sentence_case_ratio | float | 0-1 |
| mixed_case_ratio | float | 0-1 |
| caps_lock_abuse_score | float | 0-10 |

### Group G: Linguistic Complexity (10 features)

| Feature | Type | Valid Range |
|---------|------|-------------|
| polysyllabic_word_count | int | 0-500 |
| complex_word_ratio | float | 0-1 |
| rare_word_count | int | 0-200 |
| jargon_count | int | 0-100 |
| slang_count | int | 0-100 |
| acronym_count | int | 0-50 |
| technical_term_count | int | 0-100 |
| simple_word_ratio | float | 0-1 |
| average_syllables_per_word | float | 1-5 |
| lexical_density | float | 0-1 |

### Group H: Dialogue & Interaction (5 features)

| Feature | Type | Valid Range |
|---------|------|-------------|
| direct_question_count | int | 0-50 |
| rhetorical_question_count | int | 0-30 |
| imperative_sentence_count | int | 0-50 |
| dialogue_marker_count | int | 0-100 |
| conversational_tone_score | float | 0-10 |

### Group I: Content Structure Signals (8 features)

| Feature | Type | Valid Range |
|---------|------|-------------|
| has_numbered_list | bool | 0 or 1 |
| has_bullet_points | bool | 0 or 1 |
| list_item_count | int | 0-50 |
| section_count | int | 0-20 |
| transition_word_count | int | 0-100 |
| introduction_length | int | 0-500 |
| conclusion_length | int | 0-500 |
| body_to_intro_ratio | float | 0-50 |

### Group J: Timestamp & Pacing (4 features)

| Feature | Type | Valid Range |
|---------|------|-------------|
| words_per_second | float | 0-10 |
| silence_pause_count | int | 0-100 |
| rapid_fire_segments | int | 0-20 |
| slow_segments | int | 0-20 |

### Group K: Video Metadata (10 features)

| Feature | Type | Valid Range |
|---------|------|-------------|
| video_duration_seconds | float | 1-600 |
| title_length | int | 0-150 |
| description_length | int | 0-2200 |
| hashtag_count | int | 0-30 |
| hashtag_total_chars | int | 0-500 |
| caption_length | int | 0-2200 |
| has_location | bool | 0 or 1 |
| upload_hour | int | 0-23 |
| upload_day_of_week | int | 0-6 |
| days_since_upload | int | 0-3650 |

### Group L: Historical Performance (10 features) - POST-FACTO

| Feature | Type | Valid Range |
|---------|------|-------------|
| views_count | int | 0-1B |
| likes_count | int | 0-50M |
| comments_count | int | 0-5M |
| shares_count | int | 0-10M |
| saves_count | int | 0-10M |
| engagement_rate | float | 0-1 |
| like_rate | float | 0-1 |
| comment_rate | float | 0-0.5 |
| share_rate | float | 0-0.5 |
| dps_score | float | 0-100 |

---

## Validation Steps

### Step 1: Fetch Features from Database

```sql
SELECT
  f.video_id,
  f.features,
  f.created_at,
  v.transcript
FROM video_features f
JOIN videos v ON f.video_id = v.id
WHERE f.video_id = '[VIDEO_ID]';
```

### Step 2: Count Features

```javascript
const features = result.features;
const featureCount = Object.keys(features).length;
const expectedCount = 119;
const completeness = (featureCount / expectedCount * 100).toFixed(1);
```

### Step 3: Validate Each Feature

For each feature, check:
1. Not null or undefined
2. Not NaN (for numbers)
3. Within valid range for that feature type
4. Consistent with other features (e.g., word_count > 0 if transcript exists)

### Step 4: Flag Suspicious Values

```javascript
const suspicious = [];

// Check for zeros when transcript exists
if (features.word_count === 0 && transcript.length > 0) {
  suspicious.push('word_count is 0 but transcript exists');
}

// Check ratios are in 0-1 range
const ratioFeatures = ['lexical_diversity', 'first_person_ratio', 'complex_word_ratio'];
ratioFeatures.forEach(f => {
  if (features[f] < 0 || features[f] > 1) {
    suspicious.push(`${f} is ${features[f]}, should be 0-1`);
  }
});

// Check for NaN
Object.entries(features).forEach(([key, value]) => {
  if (typeof value === 'number' && isNaN(value)) {
    suspicious.push(`${key} is NaN`);
  }
});
```

### Step 5: Compare to Distribution

```sql
SELECT
  AVG((features->>'word_count')::float) as avg_word_count,
  STDDEV((features->>'word_count')::float) as std_word_count,
  AVG((features->>'emotional_intensity_score')::float) as avg_emotion,
  STDDEV((features->>'emotional_intensity_score')::float) as std_emotion
FROM video_features
WHERE created_at > NOW() - INTERVAL '30 days';
```

Flag if current video is >3 standard deviations from mean.

---

## Output Report

```
============================================
FEATURE VALIDATION: [VIDEO_ID]
============================================

Completeness: 117/119 features (98.3%)

Missing Features:
  - words_per_second
  - silence_pause_count

Group Summary:
  Group A (Text Metrics):      15/15 ✅
  Group B (Punctuation):       10/10 ✅
  Group C (Pronouns):          8/8   ✅
  Group D (Emotion):           19/19 ✅
  Group E (Viral Patterns):    15/15 ✅
  Group F (Capitalization):    5/5   ✅
  Group G (Complexity):        10/10 ✅
  Group H (Dialogue):          5/5   ✅
  Group I (Structure):         8/8   ✅
  Group J (Pacing):            2/4   ⚠️ (missing 2)
  Group K (Metadata):          10/10 ✅
  Group L (Performance):       10/10 ✅

Suspicious Values:
  ⚠️ engagement_rate: 0.45 (3.2 std from mean 0.08)
  ⚠️ word_count: 12 (below typical minimum)

Range Violations:
  ❌ sentiment_polarity: 1.5 (should be -1 to 1)

NaN Values:
  ❌ lexical_density: NaN

Recommendation: INVESTIGATE
- Pacing features missing (check FFmpeg extraction)
- Engagement rate unusually high (verify data source)
- Fix sentiment_polarity calculation
============================================
```

---

## Feature Group Details

### Required for Pre-Content Prediction
Groups A-K (109 features) - can be extracted before upload

### Required for Post-Content Analysis
Group L (10 features) - requires actual performance data

### Most Important for DPS Prediction
Based on XGBoost feature importance:
1. `engagement_rate` (Group L)
2. `emotional_intensity_score` (Group D)
3. `hook_strength` (external component)
4. `word_count` (Group A)
5. `video_duration_seconds` (Group K)

---

## Troubleshooting

### Missing Features
Check if feature extraction ran:
```sql
SELECT component_id, success, error_message
FROM run_component_results
WHERE video_id = '[VIDEO_ID]'
  AND component_id = 'feature-extraction';
```

### NaN Values
Usually caused by division by zero:
- `lexical_diversity`: Check if word_count is 0
- Ratios: Check if denominator is 0

### Out of Range Values
Review feature extraction code:
- [src/lib/services/feature-extraction/](../../src/lib/services/feature-extraction/)

### Group J (Pacing) Missing
Requires FFmpeg analysis:
```sql
SELECT * FROM artifact_cache
WHERE video_id = '[VIDEO_ID]'
  AND artifact_type = 'ffmpeg_analysis';
```

---

## Related Commands

- [/run-prediction](./run-prediction.md) - Test prediction
- [/debug-prediction](./debug-prediction.md) - Debug wrong predictions
- [/check-pipeline](./check-pipeline.md) - System health check

---

## Reference

- XGBoost model: `models/xgboost_dps_v7.json`
- Feature extraction: [src/lib/services/feature-extraction/](../../src/lib/services/feature-extraction/)
- [docs/COMPONENT_RUBRIC_AUDIT.md](../../docs/COMPONENT_RUBRIC_AUDIT.md) - Component documentation
