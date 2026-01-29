# Lovable.dev Build Prompt - TikTok Viral Prediction System

## Project Overview

Build a **TikTok Viral Content Prediction Platform** that predicts how viral a video will be using AI/ML. The system analyzes video transcripts and metadata to generate a **DPS (Digital Performance Score)** from 0-100, representing viral potential.

---

## Core Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand
- **Charts**: Recharts, Chart.js, D3.js
- **Animations**: Framer Motion

### Backend
- **API**: Next.js API Routes (App Router)
- **Database**: Supabase (PostgreSQL)
- **ML/AI**:
  - Python XGBoost model for predictions
  - OpenAI GPT-4 for qualitative analysis
  - Anthropic Claude for content generation
- **Feature Extraction**: Natural Language Processing (119 features)

### Data Pipeline
- **Scraping**: Apify (TikTok video data)
- **Transcription**: OpenAI Whisper API
- **Video Processing**: FFmpeg (visual analysis)

---

## System Architecture

### 3-Stage Prediction Pipeline

```
1. FEATURE EXTRACTION (TypeScript)
   ↓ Extract 119 numeric features from transcript
   ↓ Groups: Text stats, emotions, viral patterns, hooks, etc.

2. XGBOOST PREDICTION (Python)
   ↓ Baseline DPS prediction (0-100)
   ↓ Model trained on 116 videos
   ↓ R² = 0.970 (97% accuracy), MAE = 0.99 DPS

3. GPT-4 REFINEMENT (TypeScript + OpenAI)
   ↓ Qualitative analysis (optional)
   ↓ Adjusts prediction ±20 points
   ↓ Provides viral hooks, weaknesses, recommendations

4. FINAL OUTPUT
   → DPS Score (0-100)
   → Confidence (0-1)
   → Feature breakdown
   → Actionable recommendations
```

---

## Database Schema (Supabase)

### Core Tables

#### 1. `scraped_videos`
```sql
- video_id (TEXT, PRIMARY KEY)
- video_url (TEXT)
- title (TEXT)
- description (TEXT)
- transcript_text (TEXT)
- views_count (BIGINT)
- likes_count (BIGINT)
- comments_count (BIGINT)
- shares_count (BIGINT)
- saves_count (BIGINT)
- dps_score (FLOAT)
- engagement_rate (FLOAT)
- video_duration (INTEGER)
- creator_username (TEXT)
- create_time (TIMESTAMPTZ)
```

#### 2. `video_features`
```sql
- id (UUID, PRIMARY KEY)
- video_id (TEXT, FOREIGN KEY → scraped_videos)
- feature_count (INTEGER)
- features (JSONB) -- Complete feature object
- feature_vector (FLOAT8[]) -- 119-element array for ML
- dps_score (FLOAT8)
- engagement_rate (FLOAT8)
- word_count (INTEGER)
- sentiment_polarity (FLOAT8)
- extracted_at (TIMESTAMPTZ)
```

#### 3. `predictions` (Optional)
```sql
- id (UUID, PRIMARY KEY)
- video_id (TEXT, FOREIGN KEY)
- predicted_dps (FLOAT)
- actual_dps (FLOAT)
- confidence (FLOAT)
- model_version (TEXT)
- prediction_breakdown (JSONB)
- created_at (TIMESTAMPTZ)
```

---

## Key API Endpoints to Build

### 1. **POST /api/predict**
Main prediction endpoint - takes video ID or custom transcript, returns viral prediction

**Request:**
```typescript
{
  video_id?: string,              // Option 1: Existing video
  transcript?: string,            // Option 2: Custom transcript
  title?: string,
  metadata?: {
    views_count?: number,
    likes_count?: number,
    // ... other engagement metrics
  },
  skip_gpt_refinement?: boolean,  // Fast mode (XGBoost only)
  force_gpt_refinement?: boolean  // Full analysis mode
}
```

**Response:**
```typescript
{
  success: true,
  prediction: {
    final_dps_prediction: 81.5,
    confidence: 0.74,
    prediction_breakdown: {
      xgboost_base: 81.5,
      gpt_adjustment: 0,
      final_score: 81.5
    },
    top_features: [
      { name: "word_count", importance: 0.087, value: 339 },
      { name: "sentiment_polarity", importance: 0.064, value: 0.85 }
    ],
    prediction_interval: { lower: 75.2, upper: 87.8 },
    qualitative_analysis: {          // If GPT-4 used
      viral_hooks: ["Strong opening hook", "..."],
      weaknesses: ["Middle section drags"],
      recommendations: ["Add surprise at 15s mark", "..."],
      reasoning: "XGBoost predicted 81.5..."
    }
  },
  metadata: {
    model_used: "xgboost" | "hybrid",
    processing_time_ms: 4253,
    llm_cost_usd: 0.000314,
    timestamp: "2025-11-06T..."
  }
}
```

### 2. **GET /api/predict**
Check system status

**Response:**
```typescript
{
  status: "online",
  model_available: true,
  model_metrics: {
    test_r2: 0.970,
    test_mae: 0.99,
    dataset_size: { total: 116, train: 93, test: 23 }
  }
}
```

### 3. **POST /api/admin/run-apify-scraper**
Trigger TikTok video scraping (admin only)

**Request:**
```typescript
{
  hashtags?: string[],
  usernames?: string[],
  max_videos?: number
}
```

---

## Feature Extraction (119 Features)

### Feature Groups to Implement

**Group A: Basic Text Features (13)**
- word_count, char_count, sentence_count
- avg_word_length, avg_sentence_length
- unique_word_count, lexical_diversity
- punctuation_count, exclamation_count, question_count
- uppercase_ratio, digit_count, special_char_count

**Group B: Emotional Features (10)**
- sentiment_polarity, sentiment_subjectivity
- emotion_joy, emotion_sadness, emotion_anger, emotion_fear, emotion_surprise
- positive_word_count, negative_word_count, neutral_word_count

**Group C: Viral Pattern Features (12)**
- curiosity_word_count (e.g., "secret", "trick")
- power_word_count (e.g., "amazing", "shocking")
- call_to_action_count (e.g., "follow", "like")
- urgency_word_count (e.g., "now", "today")
- scarcity_word_count (e.g., "limited", "exclusive")
- social_proof_count (e.g., "everyone", "millions")
- storytelling_markers (e.g., "once upon", "imagine")
- hook_strength (first 3 seconds analysis)
- pattern_match_count (common viral phrases)

**Group D: Linguistic Complexity (8)**
- flesch_reading_ease, flesch_kincaid_grade
- complex_word_ratio, simple_word_ratio
- syllable_count, avg_syllables_per_word
- proper_noun_count, slang_word_count

**Group E: Engagement Signals (7)**
- first_person_count, second_person_count, third_person_count
- first_person_ratio, second_person_ratio, third_person_ratio
- imperative_sentence_count (commands)

**Groups F-L**: Additional linguistic features (69 total)
- POS tags, syntactic patterns, temporal markers, etc.

---

## User Interface to Build

### 1. **Dashboard Page** (`/`)
- Overview of recent predictions
- Quick predict form (paste transcript or video ID)
- Performance metrics chart (DPS distribution)
- Recent videos analyzed

### 2. **Prediction Studio** (`/studio`)
**Main Features:**
- Large text area for transcript input
- Title/description fields
- Metadata inputs (optional: views, likes, etc.)
- Prediction mode toggle:
  - Fast (XGBoost only, ~4s, free)
  - Smart (Auto GPT-4, ~7s, ~$0.00003)
  - Full (Always GPT-4, ~9s, ~$0.0003)
- "Predict Virality" button

**Results Display:**
- Large DPS score gauge (0-100) with color coding:
  - 0-50: Red (Low viral potential)
  - 50-70: Yellow (Moderate)
  - 70-85: Light green (Good)
  - 85-100: Dark green (Viral)
- Confidence meter
- Prediction breakdown (XGBoost base + GPT adjustment)
- Top 10 contributing features (bar chart)
- Qualitative analysis section:
  - Viral hooks identified (green checkmarks)
  - Weaknesses (red warnings)
  - 3-5 actionable recommendations (blue suggestions)

### 3. **Video Library** (`/library`)
- Searchable/filterable table of scraped videos
- Columns: Video ID, Title, DPS, Views, Likes, Created
- Click to see full analysis
- Bulk predict functionality

### 4. **Admin Dashboard** (`/admin`)
- Scraper controls (trigger Apify runs)
- Model training status
- Database stats (videos scraped, features extracted)
- System health metrics
- Cost tracking (LLM usage)

---

## Critical Implementation Details

### 1. **Feature Extraction Service**
Location: `src/lib/services/feature-extraction/`

Must implement:
```typescript
export async function extractFeaturesFromVideo(input: {
  videoId: string;
  transcript: string;
  title: string;
  description?: string;
  viewsCount?: number;
  likesCount?: number;
  // ... other metadata
}): Promise<{
  success: boolean;
  features: FeatureObject;      // Nested object with 12 groups
  featureVector: number[];      // Flattened 119-element array
  featureCount: number;
}>;

export function flattenFeatureVector(features: FeatureObject): number[];
export function getFeatureNames(): string[];
```

### 2. **XGBoost Prediction Service**
Location: `src/lib/ml/xgboost-predictor.ts`

```typescript
export async function predictWithXGBoost(input: {
  featureVector: number[];
}): Promise<{
  baseDpsPrediction: number;
  confidence: number;
  topFeatures: Array<{ name: string; importance: number }>;
  predictionInterval?: { lower: number; upper: number };
}>;

export function isModelAvailable(): boolean;
export function getModelMetrics(): ModelMetrics | null;
```

**Note:** This calls a Python subprocess:
```bash
python scripts/predict-xgboost.py --features "[0.5, 0.3, ...]"
```

### 3. **GPT-4 Refinement Service**
Location: `src/lib/ml/gpt-refinement-service.ts`

```typescript
export async function refineWithGPT4(input: {
  transcript: string;
  title: string;
  baseDpsPrediction: number;
  xgboostConfidence: number;
  topFeatures: Array<{ name: string; value: number }>;
  useQuickAnalysis?: boolean;
}): Promise<{
  adjustment: number;           // -20 to +20
  confidence: number;           // 0-100
  viralHooks: string[];
  weaknesses: string[];
  recommendations: string[];
  reasoning: string;
  overallAssessment: string;
  llmCostUsd: number;
}>;

export function shouldRefineWithGPT4(xgboostConfidence: number): boolean;
```

### 4. **Hybrid Predictor (Main Orchestrator)**
Location: `src/lib/ml/hybrid-predictor.ts`

```typescript
export async function predictVirality(
  input: HybridPredictionInput
): Promise<HybridPredictionOutput>;

export async function predictViralityBatch(
  inputs: HybridPredictionInput[],
  options?: { maxConcurrent?: number; onProgress?: Function }
): Promise<HybridPredictionOutput[]>;
```

---

## Environment Variables Needed

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenAI (for GPT-4 and Whisper)
OPENAI_API_KEY=sk-xxx

# Apify (for TikTok scraping)
APIFY_API_TOKEN=xxx

# Optional: Anthropic Claude
ANTHROPIC_API_KEY=xxx
```

---

## Key User Flows

### Flow 1: Predict for Existing Video
1. User enters video ID in prediction form
2. System loads video from `scraped_videos` table
3. Extracts 119 features from transcript
4. Runs XGBoost prediction → base DPS
5. (Optional) Runs GPT-4 refinement → adjustment
6. Displays results with visual breakdown

### Flow 2: Predict for Custom Script (Before Filming)
1. Creator pastes their script into text area
2. Enters title and optionally description
3. Clicks "Predict Virality" (Full Analysis mode)
4. System extracts features from script
5. XGBoost predicts baseline DPS
6. GPT-4 analyzes and provides:
   - Viral hook rating
   - Specific weaknesses
   - 3-5 actionable recommendations
7. Creator iterates on script based on feedback

### Flow 3: Bulk Analysis
1. Admin triggers Apify scraper for hashtag #fyp
2. System scrapes 200 videos
3. For videos without transcripts:
   - Download video file
   - Generate transcript with Whisper API
4. Extract features for all 200 videos
5. Store in `video_features` table
6. Display summary analytics

---

## Performance Requirements

### Speed
- Feature extraction: < 2 seconds
- XGBoost prediction: < 5 seconds
- GPT-4 refinement: < 10 seconds
- **Total (hybrid mode)**: < 15 seconds

### Accuracy
- XGBoost R²: > 0.95 (currently 0.970)
- XGBoost MAE: < 2 DPS points (currently 0.99)
- Hybrid improvement: +5-10% over XGBoost alone

### Cost
- XGBoost only: $0 per prediction
- Hybrid (10% GPT usage): ~$0.00003 per prediction
- Hybrid (100% GPT usage): ~$0.0003 per prediction

---

## UI/UX Guidelines

### Visual Design
- **Color Palette**:
  - Primary: Blue (#3b82f6)
  - Success: Green (#10b981)
  - Warning: Yellow (#f59e0b)
  - Danger: Red (#ef4444)
  - Neutral: Gray (#6b7280)

- **DPS Score Display**:
  - Use large circular gauge (like speedometer)
  - Color-coded zones (red → yellow → green)
  - Animated number counter on load

- **Feature Importance**:
  - Horizontal bar chart
  - Top 10 features only
  - Show both importance % and actual value

### Interactions
- Real-time character count in transcript input
- Loading states with progress indicators
- Smooth animations for score reveal
- Copy prediction results to clipboard
- Export results as PDF/JSON

### Mobile Responsiveness
- Stack prediction form vertically on mobile
- Collapse advanced options into accordion
- Make charts touch-friendly
- Optimize gauge for small screens

---

## Data Visualization Examples

### 1. DPS Distribution Chart (Dashboard)
```typescript
<BarChart data={videos.map(v => ({ dps: v.dps_score }))}>
  <XAxis dataKey="dps" label="DPS Score" />
  <YAxis label="Number of Videos" />
  <Bar dataKey="count" fill="#3b82f6" />
</BarChart>
```

### 2. Feature Importance (Prediction Results)
```typescript
<BarChart data={topFeatures} layout="horizontal">
  <XAxis type="number" domain={[0, 1]} />
  <YAxis dataKey="name" type="category" />
  <Bar dataKey="importance" fill="#10b981" />
</BarChart>
```

### 3. Confidence Meter
```typescript
<div className="relative w-full h-4 bg-gray-200 rounded">
  <div
    className="absolute h-full bg-blue-500 rounded"
    style={{ width: `${confidence * 100}%` }}
  />
  <span className="absolute right-2 text-xs">{(confidence * 100).toFixed(0)}%</span>
</div>
```

---

## Error Handling

### Common Errors to Handle

1. **"XGBoost model not found"**
   - Display: "Model not trained yet. Please train the model first."
   - Action: Show link to admin training page

2. **"Video not found"**
   - Display: "Video ID not in database. Try custom transcript instead."
   - Action: Switch to manual transcript input mode

3. **"Feature extraction failed"**
   - Display: "Could not analyze transcript. Please check formatting."
   - Action: Show example transcript format

4. **"OpenAI API error"**
   - Fallback: Return XGBoost-only prediction
   - Display: "GPT-4 unavailable, using quantitative analysis only"

5. **"Rate limit exceeded"**
   - Display: "Too many requests. Please wait 60 seconds."
   - Action: Show countdown timer

---

## Testing Requirements

### Unit Tests
- Feature extraction accuracy (compare to known values)
- Feature vector flattening (ensure 119 elements)
- DPS clamping (0-100 range)
- Confidence calculation

### Integration Tests
- Full prediction pipeline (video ID → result)
- Batch prediction (multiple videos)
- Database read/write operations
- API endpoint responses

### E2E Tests
- User enters transcript → sees results
- User clicks on video in library → sees analysis
- Admin triggers scraper → videos appear in library

---

## Deployment Considerations

### Model Files
Must include in deployment:
```
models/
├── xgboost-dps-model.json       (141 KB)
├── feature-scaler.pkl           (3.3 KB)
├── feature-names.json           (2.9 KB)
└── training-metrics.json        (2.9 KB)
```

### Python Runtime
Ensure Python 3.9+ available with:
```bash
pip install xgboost scikit-learn pandas numpy
```

### Environment
- Node.js 18+
- Next.js 14+
- PostgreSQL (via Supabase)

---

## Success Metrics

### Technical Metrics
- Prediction accuracy: R² > 0.95
- Response time: < 15 seconds (p95)
- Uptime: > 99.5%
- Error rate: < 1%

### Business Metrics
- Predictions per day: Track usage
- User retention: % returning users
- Accuracy validation: Compare predictions to actual performance
- Creator satisfaction: Feedback on recommendations

---

## Additional Features (Future Enhancements)

1. **A/B Testing**: Compare multiple script variations
2. **Historical Tracking**: Track how predictions compare to actual results
3. **Niche-Specific Models**: Train separate models for different content types
4. **Visual Analysis**: Integrate FFmpeg for video frame analysis
5. **Audio Analysis**: Detect music, voice tone, energy level
6. **Collaboration**: Share predictions with team members
7. **API Access**: Public API for third-party integrations

---

## Notes for Lovable.dev

- **Start with**: Prediction API (`/api/predict`) and basic studio UI
- **Python Integration**: Use Next.js API routes to spawn Python subprocess
- **Database**: Use Supabase client for all database operations
- **Styling**: Use Tailwind + shadcn/ui components for consistency
- **TypeScript**: Strict types throughout, export interfaces
- **Error Handling**: Comprehensive try-catch with user-friendly messages
- **Loading States**: Show progress for long-running predictions

---

## Example Code Structure

```
src/
├── app/
│   ├── page.tsx                        # Dashboard
│   ├── studio/
│   │   └── page.tsx                    # Prediction Studio
│   ├── library/
│   │   └── page.tsx                    # Video Library
│   ├── admin/
│   │   └── page.tsx                    # Admin Dashboard
│   └── api/
│       └── predict/
│           └── route.ts                # Main prediction endpoint
│
├── lib/
│   ├── ml/
│   │   ├── hybrid-predictor.ts         # Main orchestrator
│   │   ├── xgboost-predictor.ts        # XGBoost service
│   │   ├── gpt-refinement-service.ts   # GPT-4 service
│   │   └── prompts/
│   │       └── viral-analysis-prompt.ts
│   │
│   └── services/
│       └── feature-extraction/
│           ├── index.ts
│           ├── text-features.ts        # Group A
│           ├── emotional-features.ts   # Group B
│           ├── viral-patterns.ts       # Group C
│           └── ... (Groups D-L)
│
├── components/
│   ├── prediction-form.tsx
│   ├── dps-gauge.tsx
│   ├── feature-chart.tsx
│   └── recommendation-card.tsx
│
└── types/
    ├── prediction.ts
    └── features.ts
```

---

## Final Checklist

- [ ] Set up Next.js 14 project with TypeScript
- [ ] Configure Supabase client
- [ ] Implement feature extraction (119 features)
- [ ] Create XGBoost predictor service (Python subprocess)
- [ ] Build GPT-4 refinement service
- [ ] Create hybrid predictor orchestrator
- [ ] Build `/api/predict` endpoint
- [ ] Create Prediction Studio UI
- [ ] Build DPS gauge component
- [ ] Add feature importance chart
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Test with sample videos
- [ ] Deploy to production

---

**Current System Status:**
- ✅ XGBoost model trained (R² = 0.970, MAE = 0.99)
- ✅ 116 videos with features in database
- ✅ Feature extraction working (119 features, 17ms avg)
- ✅ Hybrid pipeline architecture designed
- ✅ All service files created

**Ready to build the frontend and connect to existing backend!**
