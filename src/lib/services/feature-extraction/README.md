# Feature Extraction Service

## Overview

The Feature Extraction Service extracts **120 machine learning features** from video transcripts and metadata. These features can be used to train predictive models for viral content analysis.

## Features Extracted

### Groups A-L: Text, Formatting, Content & Metadata (120 features)

#### Group A: Basic Text Metrics (15 features)
- Word count, character count, sentence count
- Average word/sentence length
- Unique word count, lexical diversity
- Syllable count
- Readability scores: Flesch Reading Ease, Flesch-Kincaid Grade, SMOG Index, ARI, Coleman-Liau, Gunning Fog, Linsear Write

#### Group B: Punctuation Analysis (10 features)
- Question marks, exclamation marks, ellipsis
- Commas, periods, semicolons, colons
- Dashes, quotations, parentheses

#### Group C: Pronoun and Perspective (8 features)
- First person (singular/plural), second person, third person counts
- Pronoun ratios
- Perspective shift count

#### Group D: Emotional and Power Words (20 features)
- Positive/negative emotion counts
- Power words, urgency words, curiosity words
- Fear, trust, surprise, anger, sadness, joy, anticipation, disgust counts
- Emotional intensity, sentiment polarity/subjectivity
- Emotional arc pattern, volatility
- Positive/negative ratio, net emotional impact

#### Group E: Viral Pattern Words (15 features)
- Shock, controversy, scarcity words
- Social proof, authority, reciprocity words
- Commitment, liking, consensus words
- Storytelling markers
- Conflict, resolution, transformation, revelation words
- Call-to-action count

#### Group F: Capitalization and Formatting (5 features)
- All-caps word count
- Title case, sentence case, mixed case ratios
- Caps lock abuse score

#### Group G: Linguistic Complexity (10 features)
- Polysyllabic word count
- Complex word ratio
- Rare word, jargon, slang, acronym counts
- Technical term count
- Simple word ratio
- Average syllables per word
- Lexical density

#### Group H: Dialogue and Interaction (5 features)
- Direct question count
- Rhetorical question count
- Imperative sentence count
- Dialogue marker count
- Conversational tone score

#### Group I: Content Structure Signals (8 features)
- Has numbered list (boolean)
- Has bullet points (boolean)
- List item count
- Section count
- Transition word count
- Introduction/conclusion length
- Body-to-intro ratio

#### Group J: Timestamp and Pacing (4 features)
- Words per second
- Silence/pause count
- Rapid-fire segments
- Slow segments

#### Group K: Video Metadata (10 features)
- Video duration (seconds)
- Title, description, caption length
- Hashtag count and total characters
- Has location (boolean)
- Upload hour, day of week
- Days since upload

#### Group L: Historical Performance (10 features)
- Views, likes, comments, shares, saves counts
- Engagement rate, like rate, comment rate, share rate
- DPS score

---

## Usage

### Basic Usage

```typescript
import {
  extractFeaturesFromVideo,
  extractFeaturesFromVideos,
  type FeatureExtractionInput,
} from '@/lib/services/feature-extraction';

// Single video
const input: FeatureExtractionInput = {
  videoId: 'abc123',
  transcript: 'This is the video transcript...',
  title: 'Amazing Video Title',
  description: 'Video description here',
  videoDurationSeconds: 60,
  viewsCount: 10000,
  likesCount: 500,
  dpsScore: 75.5,
};

const result = await extractFeaturesFromVideo(input);

if (result.success) {
  console.log('Features:', result.features);
  console.log('Feature count:', result.featureCount);
}
```

### Batch Processing

```typescript
// Multiple videos
const inputs: FeatureExtractionInput[] = [
  { videoId: 'video1', transcript: 'Transcript 1...', ... },
  { videoId: 'video2', transcript: 'Transcript 2...', ... },
  // ... more videos
];

const batchResult = await extractFeaturesFromVideos(inputs, undefined, {
  maxConcurrent: 10,
  onProgress: (processed, total) => {
    console.log(`Processed ${processed}/${total}`);
  },
});

console.log('Success rate:', batchResult.successfulExtractions / batchResult.totalVideos);
```

### Custom Configuration

```typescript
import { DEFAULT_FEATURE_EXTRACTION_CONFIG } from '@/lib/services/feature-extraction';

// Extract only specific feature groups
const config = {
  ...DEFAULT_FEATURE_EXTRACTION_CONFIG,
  includeBasicTextMetrics: true,
  includeEmotionalPowerWords: true,
  includeViralPatternWords: true,
  includeHistoricalPerformance: true,
  // Disable other groups
  includePunctuationAnalysis: false,
  includePronounPerspective: false,
  // ... etc
};

const result = await extractFeaturesFromVideo(input, config);
```

### Flatten for ML Models

```typescript
import { flattenFeatureVector, getFeatureNames } from '@/lib/services/feature-extraction';

const result = await extractFeaturesFromVideo(input);

if (result.success && result.features) {
  // Get flat array of features for ML model input
  const featureArray = flattenFeatureVector(result.features);
  // [339, 1401, 27, 4.13, 12.56, ...]

  // Get feature names (for model training)
  const featureNames = getFeatureNames();
  // ['word_count', 'char_count', 'sentence_count', ...]

  console.log('Total features:', featureArray.length); // 119 (excludes emotional_arc_pattern string)
}
```

---

## Testing

### Run Test Script

```bash
# Test with 5 videos, show detailed features
npx tsx scripts/test-feature-extraction.ts --limit 5 --show-features

# Test with 20 videos, minimum DPS 80
npx tsx scripts/test-feature-extraction.ts --limit 20 --min-dps 80

# Test with videos from last 7 days
npx tsx scripts/test-feature-extraction.ts --limit 10 --date-range 7d
```

### Test Output

The test script provides:
- Success rate
- Processing time per video
- Feature statistics (mean, std, min, max) across all videos
- Sample features from first video
- Flattened feature vector example

---

## Architecture

### File Structure

```
src/lib/services/feature-extraction/
├── index.ts                              # Public API exports
├── types.ts                              # TypeScript types and interfaces
├── text-analysis-extractors.ts          # Groups A-E (68 features)
├── formatting-linguistic-extractors.ts   # Groups F-H (20 features)
├── content-metadata-extractors.ts        # Groups I-L (35 features)
├── feature-extraction-service.ts         # Main orchestration service
└── README.md                             # This file

scripts/
└── test-feature-extraction.ts            # Test script
```

### Feature Extraction Flow

```
Input (transcript + metadata)
    ↓
Feature Extraction Service
    ↓
┌─────────────────────────────────────┐
│  Text Analysis (Groups A-E)         │
│  - Basic metrics                    │
│  - Punctuation                      │
│  - Pronouns/perspective             │
│  - Emotional words                  │
│  - Viral patterns                   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Formatting/Linguistic (Groups F-H) │
│  - Capitalization                   │
│  - Linguistic complexity            │
│  - Dialogue/interaction             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Content/Metadata (Groups I-L)      │
│  - Content structure                │
│  - Pacing                           │
│  - Video metadata                   │
│  - Performance metrics              │
└─────────────────────────────────────┘
    ↓
Output (VideoFeatureVector with 120 features)
```

---

## Performance

- **Processing Speed**: ~7ms per video (5 videos in 35ms)
- **Success Rate**: 100% on tested videos
- **Memory Usage**: Minimal (stateless extraction)
- **Concurrency**: Configurable (default: 10 concurrent extractions)

---

## Future Enhancements

### Phase 2: Visual Features (Groups M) - 40 features
- Thumbnail analysis
- Color palette extraction
- Face detection
- Visual composition metrics
- Requires: FFmpeg integration

### Phase 3: Audio Features (Groups N) - 35 features
- Music genre detection
- Background music presence
- Audio quality metrics
- Sound effects count
- Requires: Audio processing libraries

### Phase 4: Network & Trends (Groups O-P) - 62 features
- Creator network metrics
- Trend timing analysis
- Competitive analysis
- Requires: Social graph data, Google Trends API

### Phase 5: Advanced Creator (Group R) - 30 features
- Creator consistency metrics
- Historical performance trends
- Niche authority scores
- Requires: Creator tracking database

---

## Integration with Existing Pipeline

The feature extraction service integrates seamlessly with the existing viral content pipeline:

```
Apify Scraping
    ↓
FFmpeg Processing
    ↓
DPS Calculation
    ↓
Quality Filter (LLM)
    ↓
Pattern Extraction (9-field breakdown)
    ↓
[NEW] Feature Extraction (120 features) ← YOU ARE HERE
    ↓
ML Model Training (Future)
    ↓
Viral Prediction
```

---

## Database Schema (Future)

To store extracted features:

```sql
CREATE TABLE video_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES scraped_videos(video_id),
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Store as JSONB for flexibility
  features JSONB NOT NULL,

  -- Store flattened array for quick ML access
  feature_vector FLOAT8[] NOT NULL,

  -- Metadata
  feature_count INTEGER NOT NULL,
  processing_time_ms INTEGER NOT NULL,

  UNIQUE(video_id)
);

CREATE INDEX idx_video_features_video_id ON video_features(video_id);
CREATE INDEX idx_video_features_extracted_at ON video_features(extracted_at);
```

---

## Notes

- All features are **numeric** except `emotional_arc_pattern` (string: 'rise', 'fall', 'peak', 'valley', 'flat')
- Flattened feature vector excludes string features (119 numeric features)
- Features are extracted **synchronously** (no LLM calls required)
- Processing is **deterministic** (same input = same output)
- Word lists can be expanded for better accuracy
- Readability scores may need calibration for social media content

---

## License

Part of CleanCopy project - Internal use only
