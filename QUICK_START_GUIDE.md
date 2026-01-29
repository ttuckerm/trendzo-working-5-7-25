# 🚀 Quick Start Guide - Viral Prediction System

## TL;DR

Predict viral potential (DPS score 0-100) for any TikTok video in 3 ways:

```typescript
// 1. Fast (XGBoost only, ~4s, free)
await predictVirality({ videoId: '7523222079223745800', skipGPTRefinement: true });

// 2. Smart (Auto GPT-4 if needed, ~7s, ~$0.00003)
await predictVirality({ videoId: '7523222079223745800' });

// 3. Full Analysis (Always GPT-4, ~9s, ~$0.0003)
await predictVirality({
  transcript: "Your custom transcript...",
  title: "Video Title",
  forceGPTRefinement: true
});
```

---

## System Overview

**What it does**: Predicts how viral a video will be (DPS: 0-100)
**How it works**: XGBoost ML model + GPT-4 qualitative analysis
**Accuracy**: 97% (R² = 0.970, MAE = 0.99 DPS)
**Speed**: 4-9 seconds
**Cost**: $0 - $0.0003 per prediction

---

## Setup (One-Time)

### 1. Install Python Dependencies
```bash
pip install xgboost scikit-learn pandas numpy matplotlib seaborn
```

### 2. Train the Model (First Time Only)
```bash
python scripts/train-xgboost-model.py
```

**Output**: Model files in `models/` directory (~150 KB total)

### 3. Set Environment Variables
Add to `.env.local`:
```
OPENAI_API_KEY=sk-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
```

### 4. Start Next.js Server
```bash
npm run dev
```

---

## API Usage

### Check Status
```bash
curl http://localhost:3000/api/predict
```

### Predict for Existing Video (Fast)
```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"video_id": "7523222079223745800", "skip_gpt_refinement": true}'
```

### Predict for Custom Transcript (Full Analysis)
```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "I discovered this crazy hack that changed my life...",
    "title": "The Secret Nobody Talks About",
    "force_gpt_refinement": true
  }'
```

---

## TypeScript Usage

### Simple Prediction
```typescript
import { predictVirality } from '@/lib/ml/hybrid-predictor';

const result = await predictVirality({
  videoId: '7523222079223745800'
});

console.log(`DPS: ${result.finalDpsPrediction.toFixed(1)}`);
console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
```

### Full Output
```typescript
const result = await predictVirality({
  videoId: '7523222079223745800',
  forceGPTRefinement: true
});

// Quantitative metrics
console.log('Final DPS:', result.finalDpsPrediction);
console.log('Confidence:', result.confidence);
console.log('XGBoost:', result.predictionBreakdown.xgboostBase);
console.log('GPT-4 Adjustment:', result.predictionBreakdown.gptAdjustment);

// Top features
result.topFeatures.forEach(f => {
  console.log(`${f.name}: ${(f.importance * 100).toFixed(2)}%`);
});

// Qualitative analysis
if (result.qualitativeAnalysis) {
  console.log('Viral Hooks:', result.qualitativeAnalysis.viralHooks);
  console.log('Weaknesses:', result.qualitativeAnalysis.weaknesses);
  console.log('Recommendations:', result.qualitativeAnalysis.recommendations);
  console.log('Reasoning:', result.qualitativeAnalysis.reasoning);
}

// Metadata
console.log('Processing Time:', result.processingTimeMs, 'ms');
console.log('Cost:', result.llmCostUsd, 'USD');
```

### Batch Prediction
```typescript
import { predictViralityBatch } from '@/lib/ml/hybrid-predictor';

const videos = [
  { videoId: '7523222079223745800' },
  { videoId: '7425791817322515752' },
  { videoId: '7399695011050982698' }
];

const results = await predictViralityBatch(videos, {
  maxConcurrent: 3,
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  }
});

console.log('Avg DPS:', results.reduce((s, r) => s + r.finalDpsPrediction, 0) / results.length);
console.log('Total Cost:', results.reduce((s, r) => s + r.llmCostUsd, 0));
```

---

## Prediction Modes

### Mode 1: Fast (XGBoost Only)
```typescript
predictVirality({ videoId: '...', skipGPTRefinement: true })
```
- Speed: ~4 seconds
- Cost: $0
- Accuracy: R² = 0.970
- Use case: Bulk predictions, high confidence

### Mode 2: Smart (Auto GPT-4)
```typescript
predictVirality({ videoId: '...' })
```
- Speed: ~4-7 seconds (GPT-4 only if confidence < 70%)
- Cost: ~$0.00003 average
- Accuracy: Best of both worlds
- Use case: Default mode

### Mode 3: Full Analysis (Always GPT-4)
```typescript
predictVirality({ videoId: '...', forceGPTRefinement: true })
```
- Speed: ~7-9 seconds
- Cost: ~$0.0003
- Accuracy: Maximum insight
- Use case: Important decisions, detailed analysis

---

## Output Structure

```typescript
{
  success: true,
  finalDpsPrediction: 81.46,           // 0-100 score
  confidence: 0.739,                    // 0-1 confidence
  predictionBreakdown: {
    xgboostBase: 81.46,
    gptAdjustment: 0,
    finalScore: 81.46
  },
  topFeatures: [
    { name: 'views_count', importance: 0.0142, value: 1200000 },
    { name: 'dps_score', importance: 0.8837, value: 83.25 },
    // ... more features
  ],
  predictionInterval: {
    lower: 75.2,
    upper: 87.7
  },
  qualitativeAnalysis: {  // Only if GPT-4 was used
    viralHooks: ['Hook 1', 'Hook 2'],
    weaknesses: ['Weakness 1', 'Weakness 2'],
    recommendations: ['Tip 1', 'Tip 2', 'Tip 3'],
    reasoning: 'Why this score...'
  },
  modelUsed: 'xgboost' | 'hybrid',
  featureCount: 120,
  processingTimeMs: 4253,
  llmCostUsd: 0.000314,
  timestamp: '2025-11-04T...'
}
```

---

## Common Use Cases

### 1. Predict for Video in Database
```typescript
const result = await predictVirality({
  videoId: '7523222079223745800'
});
```

### 2. Predict for New Script (Before Filming)
```typescript
const result = await predictVirality({
  transcript: "Your full video script here...",
  title: "Your video title",
  forceGPTRefinement: true  // Get detailed feedback
});

// Use recommendations to improve script
result.qualitativeAnalysis?.recommendations.forEach(rec => {
  console.log('💡', rec);
});
```

### 3. Rank Multiple Scripts
```typescript
const scripts = [
  { transcript: 'Script A...', title: 'Title A' },
  { transcript: 'Script B...', title: 'Title B' },
  { transcript: 'Script C...', title: 'Title C' }
];

const results = await predictViralityBatch(scripts);

// Sort by predicted DPS
results.sort((a, b) => b.finalDpsPrediction - a.finalDpsPrediction);

console.log('Best script:', results[0].finalDpsPrediction);
```

### 4. A/B Test Script Variations
```typescript
const original = await predictVirality({
  transcript: 'Original script...',
  title: 'Original Title'
});

const variation = await predictVirality({
  transcript: 'Variation with stronger hook...',
  title: 'Better Title'
});

console.log('Improvement:', variation.finalDpsPrediction - original.finalDpsPrediction);
```

### 5. Get Actionable Feedback
```typescript
const result = await predictVirality({
  transcript: 'Your script...',
  forceGPTRefinement: true
});

// Show creator what's working
console.log('✅ What\'s working:');
result.qualitativeAnalysis?.viralHooks.forEach(hook => console.log('  -', hook));

// Show what needs improvement
console.log('⚠️ What needs work:');
result.qualitativeAnalysis?.weaknesses.forEach(w => console.log('  -', w));

// Show how to improve
console.log('💡 How to improve:');
result.qualitativeAnalysis?.recommendations.forEach(r => console.log('  -', r));
```

---

## Performance Metrics

### Model Performance (Validated)
- **R² Score**: 0.970 (97% accuracy)
- **MAE**: 0.99 DPS points (average error < 1 point)
- **RMSE**: 1.97 DPS points
- **Cross-validation**: 0.984 ± 0.010 (very stable)

### Speed Benchmarks
- Feature extraction: ~1 second
- XGBoost prediction: ~3 seconds
- GPT-4 refinement: ~3-5 seconds
- **Total (Fast mode)**: ~4 seconds
- **Total (Hybrid mode)**: ~7-9 seconds

### Cost Analysis
| Predictions | XGBoost Only | Hybrid (10% GPT-4) | Hybrid (100% GPT-4) |
|-------------|--------------|-------------------|---------------------|
| 1 | $0.00 | $0.00003 | $0.0003 |
| 100 | $0.00 | $0.003 | $0.03 |
| 1,000 | $0.00 | $0.03 | $0.30 |
| 10,000 | $0.00 | $0.30 | $3.00 |

---

## Troubleshooting

### Error: "XGBoost model not found"
**Solution**: Train the model first
```bash
python scripts/train-xgboost-model.py
```

### Error: "Video not found"
**Solution**: Video doesn't exist in database. Use custom transcript instead:
```typescript
predictVirality({ transcript: '...', title: '...' })
```

### Error: "OpenAI API key not set"
**Solution**: Add to `.env.local`:
```
OPENAI_API_KEY=sk-your-key-here
```

### Slow predictions (>15 seconds)
**Causes**:
1. First prediction after server start (cold start)
2. Python subprocess initialization
3. OpenAI API latency

**Solutions**:
- Use `skipGPTRefinement: true` for faster predictions
- Implement caching for feature extraction
- Use batch processing for multiple videos

### GPT-4 predictions seem off
**Causes**:
- GPT-4 sometimes overestimates viral potential
- Adjustments can be ±20 points (wide range)

**Solutions**:
- Trust XGBoost baseline for quantitative accuracy
- Use GPT-4 primarily for qualitative insights
- Consider tuning adjustment weights

---

## File Structure

```
CleanCopy/
├── models/                           # Trained ML models
│   ├── xgboost-dps-model.json       # XGBoost model (141 KB)
│   ├── feature-scaler.pkl           # Feature normalizer (3 KB)
│   ├── feature-names.json           # 119 feature names
│   ├── training-metrics.json        # Model performance metrics
│   └── visualizations/              # Training charts
│
├── scripts/
│   ├── train-xgboost-model.py       # Train the model
│   ├── predict-xgboost.py           # Python prediction script
│   └── test-prediction-pipeline.ts  # End-to-end test
│
├── src/
│   ├── lib/
│   │   ├── ml/
│   │   │   ├── prompts/
│   │   │   │   └── viral-analysis-prompt.ts    # GPT-4 prompts
│   │   │   ├── gpt-refinement-service.ts       # GPT-4 layer
│   │   │   ├── xgboost-predictor.ts           # XGBoost service
│   │   │   └── hybrid-predictor.ts            # Main orchestrator
│   │   └── services/
│   │       └── feature-extraction/            # Feature extraction (120 features)
│   │
│   └── app/
│       └── api/
│           └── predict/
│               └── route.ts                   # REST API endpoint
│
├── docs/
│   └── hybrid-pipeline-architecture.md        # Architecture design
│
├── MODEL_TRAINING_SUCCESS.md         # Training results
├── PIPELINE_VERIFIED_WORKING.md      # Test results
└── QUICK_START_GUIDE.md              # This file
```

---

## Next Steps

### 1. Test the API
```bash
# Start server
npm run dev

# Check status
curl http://localhost:3000/api/predict

# Make prediction
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"video_id": "7523222079223745800"}'
```

### 2. Integrate into Your App
```typescript
import { predictVirality } from '@/lib/ml/hybrid-predictor';

// Add viral prediction to your video analysis flow
const prediction = await predictVirality({ videoId: video.id });

// Show results to user
console.log(`This video has ${prediction.finalDpsPrediction.toFixed(0)}% viral potential`);
```

### 3. Deploy to Production
- Deploy Next.js app to Vercel/Railway
- Ensure Python is available in production environment
- Add rate limiting to API endpoint
- Monitor costs and performance

---

## Resources

- **Architecture**: [docs/hybrid-pipeline-architecture.md](docs/hybrid-pipeline-architecture.md)
- **Training Guide**: [MODEL_TRAINING_SUCCESS.md](MODEL_TRAINING_SUCCESS.md)
- **Test Results**: [PIPELINE_VERIFIED_WORKING.md](PIPELINE_VERIFIED_WORKING.md)
- **Feature Extraction**: [FEATURE_EXTRACTION_COMPLETE.md](FEATURE_EXTRACTION_COMPLETE.md)

---

**Need help?** Check the documentation files above or review the test script at `scripts/test-prediction-pipeline.ts` for working examples.

**Ready to predict?** Run `npm run dev` and start making predictions! 🚀
