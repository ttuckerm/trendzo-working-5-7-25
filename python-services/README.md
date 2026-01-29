# CleanCopy Python Enhancement Service

A FastAPI microservice that provides advanced video/audio analysis and ML explainability for the CleanCopy viral prediction system.

## Features

| Library | Endpoint | Purpose |
|---------|----------|---------|
| **PySceneDetect** | `/analyze/scenes` | Real scene/cut detection for hook timing and pacing analysis |
| **VADER Sentiment** | `/analyze/sentiment` | Social media-optimized sentiment analysis (no LLM costs) |
| **faster-whisper** | `/transcribe` | Fast local transcription with word-level timestamps |
| **SHAP** | `/explain/prediction` | XGBoost model explainability - users understand their DPS score |

## Quick Start

### Option 1: Run Locally (Development)

```bash
# Create virtual environment
cd python-services
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

The service will start at `http://localhost:8000`

### Option 2: Run with Docker

```bash
# From project root
docker-compose up python-services
```

## API Endpoints

### Health Check
```
GET /health
```

### Scene Analysis (PySceneDetect)
```
POST /analyze/scenes
Content-Type: multipart/form-data

file: <video_file>
```

Returns:
- Scene boundaries
- Hook analysis (cuts in first 3 seconds)
- Pacing metrics (avg scene duration, pacing style)

### Sentiment Analysis (VADER)
```
POST /analyze/sentiment
Content-Type: application/json

{
  "text": "Your transcript or script text",
  "analyze_sentences": true
}
```

Returns:
- Overall sentiment (positive/negative/neutral)
- Sentence-by-sentence breakdown
- Emotional journey (opening → middle → closing)
- Viral indicators (emotional intensity, positivity ratio)

### Transcription (faster-whisper)
```
POST /transcribe
Content-Type: multipart/form-data

file: <audio_or_video_file>
word_timestamps: true
```

Returns:
- Full transcript
- Word-level timestamps
- Speech metrics (words per second, pause count, speaking pace)

### DPS Explanation (SHAP)
```
POST /explain/prediction
Content-Type: application/json

{
  "features": {
    "hook_score": 85,
    "pacing_score": 72,
    "sentiment_polarity": 0.6,
    ...
  },
  "prediction": 78.5
}
```

Returns:
- SHAP values for each feature
- Top positive/negative contributors
- Human-readable explanation
- Visualization data for waterfall chart

### Full Video Analysis
```
POST /analyze/full
Content-Type: multipart/form-data

file: <video_file>
```

Runs all analyses (transcription + sentiment + scenes) and returns combined XGBoost features.

## Integration with Next.js

The CleanCopy Next.js app integrates via the TypeScript client:

```typescript
import pythonService from '@/lib/services/python-service-client';

// Check if service is available
const available = await pythonService.healthCheck();

// Full video analysis
const result = await pythonService.fullAnalysis(videoFile);

// Text-only sentiment
const sentiment = await pythonService.analyzeSentiment(transcript);

// Get SHAP explanation
const explanation = await pythonService.explainPrediction(features, dpsScore);
```

## Environment Variables

Add to your `.env.local`:

```
PYTHON_SERVICE_URL=http://localhost:8000
```

For Docker Compose, the Next.js app should use:

```
PYTHON_SERVICE_URL=http://python-services:8000
```

## GPU Acceleration

For faster transcription with GPU:

1. Install CUDA toolkit
2. Set `CUDA_VISIBLE_DEVICES=0` in environment
3. Change Whisper model config in `main.py`:
   ```python
   whisper_model = WhisperModel(
       "large-v3",  # Use larger model
       device="cuda",
       compute_type="float16"
   )
   ```

## XGBoost Model

Place your trained XGBoost model at `models/xgboost-dps-model.json` for SHAP explanations.

Without a model, the `/explain/prediction` endpoint uses synthetic SHAP values based on feature importance research.


