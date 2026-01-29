# Hybrid XGBoost → GPT-4 Pipeline Architecture

## Overview

A two-stage prediction system that combines:
1. **XGBoost Model** - Fast, quantitative predictions based on 119 numeric features
2. **GPT-4 Refinement** - Qualitative analysis and confidence adjustment

---

## Architecture Diagram

```
Input Video (transcript + metadata)
    ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: Feature Extraction (Existing)                    │
│  • Extract 119 numeric features                             │
│  • Groups A-L: Text, emotional, viral patterns, etc.       │
│  • Output: feature_vector[119]                             │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2: XGBoost Prediction                               │
│  • Trained on 116 videos with known DPS scores             │
│  • Input: feature_vector[119]                              │
│  • Output: base_dps_prediction (0-100)                     │
│  • Provides: feature_importance, confidence_score          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 3: GPT-4 Refinement Layer                           │
│  • Analyzes transcript + XGBoost prediction                │
│  • Identifies: viral hooks, emotional triggers, nuances    │
│  • Adjusts: base_prediction ± adjustment (-20 to +20)      │
│  • Provides: reasoning, confidence, recommendations         │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 4: Final Prediction                                 │
│  • final_dps = base_dps + gpt_adjustment                   │
│  • Confidence: Combined from both models                   │
│  • Explanation: XGBoost features + GPT reasoning           │
└─────────────────────────────────────────────────────────────┘
    ↓
Output: Viral Prediction Report
```

---

## Stage Details

### Stage 1: Feature Extraction (✅ Already Built)

**Input**: Video with transcript + metadata
**Processing**: Extract 119 numeric features
**Output**: `feature_vector[119]`
**Time**: ~17ms per video

**Files**:
- [feature-extraction-service.ts](../src/lib/services/feature-extraction/feature-extraction-service.ts)
- All feature extractors in [feature-extraction/](../src/lib/services/feature-extraction/)

---

### Stage 2: XGBoost Prediction (🔨 To Build)

**Purpose**: Fast, quantitative baseline prediction

**Input**:
```typescript
{
  feature_vector: number[119],
  video_id: string
}
```

**Model Details**:
- **Algorithm**: XGBoost Regressor
- **Training Data**: 116 videos with DPS scores (43.65 - 83.25)
- **Features**: 119 numeric features
- **Target**: DPS score (0-100)
- **Hyperparameters**: To be tuned (learning_rate, max_depth, n_estimators)

**Output**:
```typescript
{
  base_dps_prediction: number,      // 0-100
  confidence_score: number,          // 0-1
  feature_importance: {              // Top 10 most important features
    feature_name: string,
    importance: number
  }[],
  prediction_interval: {             // 95% confidence interval
    lower: number,
    upper: number
  }
}
```

**Training Steps**:
1. Load 116 feature vectors from database
2. Split: 80% train (93 videos), 20% test (23 videos)
3. Normalize features (StandardScaler)
4. Train XGBoost with cross-validation
5. Tune hyperparameters (GridSearchCV)
6. Evaluate: R², MAE, RMSE
7. Save model to disk

**Files to Create**:
- `src/lib/ml/xgboost-trainer.ts` - Training script
- `src/lib/ml/xgboost-predictor.ts` - Prediction service
- `models/xgboost-dps-model.json` - Trained model
- `models/feature-scaler.json` - Feature normalization params

---

### Stage 3: GPT-4 Refinement Layer (🔨 To Build)

**Purpose**: Qualitative analysis and adjustment

**Input**:
```typescript
{
  transcript: string,
  title: string,
  base_dps_prediction: number,
  top_features: { name: string, value: number }[],
  xgboost_confidence: number
}
```

**GPT-4 Prompt Strategy**:
```
You are a viral content analyst. An ML model predicted this video will have a DPS score of {base_dps}.

Video Title: {title}
Transcript: {transcript}

Top Contributing Features:
- word_count: {value}
- sentiment_polarity: {value}
- call_to_action_count: {value}

Task:
1. Analyze viral potential considering:
   - Hook strength (first 3 seconds)
   - Emotional resonance
   - Story structure
   - Unique angle or surprise
   - Audience relevance

2. Determine if the ML prediction should be adjusted:
   - Strong viral elements missed by ML: +10 to +20
   - Weak elements not captured by features: -10 to -20
   - ML prediction seems accurate: 0 to ±5

3. Provide:
   - Adjustment: {-20 to +20}
   - Confidence: {0-100}
   - Reasoning: {2-3 sentences}
   - Recommendations: {3 bullet points}

Format response as JSON.
```

**Output**:
```typescript
{
  gpt_adjustment: number,            // -20 to +20
  gpt_confidence: number,            // 0-100
  reasoning: string,                 // Why adjusted
  viral_hooks_identified: string[],  // Specific hooks found
  weaknesses_identified: string[],   // Areas of concern
  recommendations: string[],         // How to improve
  overall_assessment: string         // Summary
}
```

**Cost Optimization**:
- Use GPT-4o-mini for most predictions (~$0.0001 per video)
- Only use GPT-4o for edge cases (confidence < 0.7)
- Cache common patterns

**Files to Create**:
- `src/lib/ml/gpt-refinement-service.ts` - GPT-4 analysis
- `src/lib/ml/prompts/viral-analysis-prompt.ts` - Prompt templates

---

### Stage 4: Final Prediction (🔨 To Build)

**Purpose**: Combine predictions and generate report

**Combination Logic**:
```typescript
final_dps = clamp(base_dps + gpt_adjustment, 0, 100)

final_confidence = weightedAverage([
  { value: xgboost_confidence, weight: 0.6 },
  { value: gpt_confidence / 100, weight: 0.4 }
])

// If predictions diverge significantly (>15 points), reduce confidence
if (abs(gpt_adjustment) > 15) {
  final_confidence *= 0.8
}
```

**Output**:
```typescript
{
  video_id: string,
  final_dps_prediction: number,      // 0-100
  confidence: number,                 // 0-1
  prediction_breakdown: {
    xgboost_base: number,
    gpt_adjustment: number,
    final_score: number
  },
  top_features: {                    // From XGBoost
    name: string,
    importance: number,
    value: number
  }[],
  qualitative_analysis: {            // From GPT-4
    viral_hooks: string[],
    weaknesses: string[],
    recommendations: string[],
    reasoning: string
  },
  prediction_interval: {
    lower: number,
    upper: number
  },
  timestamp: string
}
```

**Files to Create**:
- `src/lib/ml/hybrid-predictor.ts` - Main orchestration
- `src/app/api/predict/route.ts` - API endpoint

---

## API Design

### Prediction Endpoint

**POST** `/api/predict`

**Request**:
```typescript
{
  video_id?: string,              // If video already in DB
  transcript?: string,            // Or provide transcript directly
  title?: string,
  metadata?: {
    views_count?: number,
    likes_count?: number,
    // ... other metadata
  }
}
```

**Response**:
```typescript
{
  success: boolean,
  prediction: {
    final_dps_prediction: number,
    confidence: number,
    prediction_breakdown: {...},
    top_features: [...],
    qualitative_analysis: {...},
    prediction_interval: {...}
  },
  processing_time_ms: number
}
```

---

## Training Pipeline

### Step 1: Train XGBoost Model

```bash
npx tsx scripts/train-xgboost-model.ts
```

**Process**:
1. Load 116 feature vectors from `video_features` table
2. Split train/test (80/20)
3. Normalize features
4. Train XGBoost with cross-validation
5. Evaluate metrics
6. Save model + scaler

**Output**:
- `models/xgboost-dps-model.json`
- `models/feature-scaler.json`
- `models/training-metrics.json`

### Step 2: Test GPT-4 Refinement

```bash
npx tsx scripts/test-gpt-refinement.ts
```

**Process**:
1. Load 10 test videos
2. Get XGBoost predictions
3. Run GPT-4 refinement
4. Compare final predictions to actual DPS
5. Calculate improvement over XGBoost alone

### Step 3: End-to-End Test

```bash
npx tsx scripts/test-hybrid-pipeline.ts
```

**Process**:
1. Load test video
2. Extract features
3. Run XGBoost prediction
4. Run GPT-4 refinement
5. Generate final report
6. Display results

---

## Performance Targets

### Accuracy
- **XGBoost alone**: R² > 0.6, MAE < 10 DPS points
- **Hybrid (XGBoost + GPT-4)**: R² > 0.7, MAE < 8 DPS points
- **Improvement**: +10-15% accuracy from GPT-4 refinement

### Speed
- Feature extraction: ~17ms
- XGBoost prediction: ~5ms
- GPT-4 refinement: ~2-3 seconds
- **Total**: ~3 seconds per prediction

### Cost
- GPT-4o-mini: ~$0.0001 per prediction
- 1000 predictions: ~$0.10
- **Monthly** (10k predictions): ~$1

---

## Evaluation Metrics

### Quantitative (XGBoost)
- R² (coefficient of determination)
- MAE (mean absolute error)
- RMSE (root mean squared error)
- Feature importance ranking

### Qualitative (GPT-4)
- Adjustment correlation with error
- Confidence calibration
- Human agreement on reasoning
- Actionability of recommendations

### Hybrid Performance
- Final prediction accuracy vs. XGBoost alone
- Confidence score calibration
- Edge case handling (unusual videos)

---

## File Structure

```
src/lib/ml/
├── xgboost-trainer.ts           # Training script
├── xgboost-predictor.ts         # XGBoost prediction service
├── gpt-refinement-service.ts    # GPT-4 refinement
├── hybrid-predictor.ts          # Main orchestration
├── feature-scaler.ts            # Feature normalization
├── model-evaluator.ts           # Metrics calculation
└── prompts/
    └── viral-analysis-prompt.ts # GPT-4 prompt templates

models/
├── xgboost-dps-model.json      # Trained XGBoost model
├── feature-scaler.json         # StandardScaler params
└── training-metrics.json       # Model performance

scripts/
├── train-xgboost-model.ts      # Train XGBoost
├── test-gpt-refinement.ts      # Test GPT-4 layer
└── test-hybrid-pipeline.ts     # End-to-end test

src/app/api/
└── predict/
    └── route.ts                # Prediction API endpoint
```

---

## Next Steps

1. **Create ML directory structure**
2. **Build XGBoost training script** (Python or TypeScript with xgboost.js)
3. **Train initial model on 116 videos**
4. **Build GPT-4 refinement service**
5. **Create hybrid predictor**
6. **Test end-to-end**
7. **Deploy prediction API**

---

## Decision: Python or TypeScript?

### Option 1: Python (Recommended for XGBoost)
**Pros**:
- Mature ML ecosystem (scikit-learn, xgboost, pandas)
- Better model serialization
- More examples and documentation

**Cons**:
- Requires Python runtime
- Need to bridge TypeScript ↔ Python

### Option 2: TypeScript Only
**Pros**:
- Single language stack
- No Python runtime needed

**Cons**:
- Limited ML libraries (xgboost.js is less mature)
- Harder to serialize models

**Recommendation**: Use Python for training, TypeScript for prediction via saved model.
