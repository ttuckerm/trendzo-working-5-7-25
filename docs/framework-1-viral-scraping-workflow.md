# Framework 1: Viral Scraping & Prediction Workflow

## Overview

Framework 1 is an automated system that continuously monitors viral creators and hashtags, scrapes fresh videos, generates DPS predictions using The Donna, and tracks performance over time to validate accuracy.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   FRAMEWORK 1 WORKFLOW                      │
│                                                             │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│  │  Apify   │ ───> │   The    │ ───> │ Tracking │        │
│  │ Scraper  │      │  Donna   │      │  System  │        │
│  └──────────┘      └──────────┘      └──────────┘        │
│      │                  │                  │              │
│      ▼                  ▼                  ▼              │
│  Fresh Videos     Predictions         Validation         │
│  (<15 min old)    (DPS + patterns)    (5min → 7day)     │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Viral Scraping Workflow
**Location**: [src/lib/donna/workflows/viral-scraping-workflow.ts](../src/lib/donna/workflows/viral-scraping-workflow.ts)

Main orchestration class that:
- Monitors 10 viral creators (MrBeast, Alex Hormozi, etc.)
- Tracks 15 viral hashtags (#viral, #transformation, etc.)
- Scrapes every 5 minutes via Apify
- Filters for fresh videos (<15 min old, <10k views)

### 2. Apify Integration
**Location**: [src/lib/donna/services/apify-integration.ts](../src/lib/donna/services/apify-integration.ts)

Handles all TikTok scraping via Apify API:
- `scrapeProfiles(usernames)` - Scrape from creators
- `scrapeHashtags(hashtags)` - Scrape from hashtags
- `getVideoMetrics(videoId)` - Re-fetch updated metrics
- Filtering by age, views, duration

### 3. The Donna Reasoning Engine
**Location**: [src/app/api/donna/reason/route.ts](../src/app/api/donna/reason/route.ts)

Universal reasoning API that predicts DPS:
- Currently uses heuristic-based prediction
- Identifies viral patterns
- Provides confidence scores and recommendations
- **Future**: Will integrate XGBoost, GPT-4, Claude, Gemini

### 4. Tracking System
**Location**: [src/lib/donna/workflows/viral-scraping-workflow.ts](../src/lib/donna/workflows/viral-scraping-workflow.ts) (TrackingSystem class)

Monitors predictions vs actual performance:
- Schedules checkpoints: 5min, 30min, 1hr, 4hr, 24hr, 7day
- Re-scrapes videos at each checkpoint
- Records actual DPS vs predicted DPS
- Generates validation results

## Database Schema

### `prediction_validations`
Stores predictions and final validation results:
- `predicted_dps` - The Donna's prediction
- `prediction_confidence` - Confidence score (0-1)
- `final_dps` - Actual DPS after 24hr/7day
- `error` - Absolute error
- `correct_classification` - Did we correctly predict viral/not-viral?

### `tracking_checkpoints`
Scheduled checkpoints for each video:
- `checkpoint_time` - 5min, 30min, 1hr, 4hr, 24hr, 7day
- `scheduled_for` - When to check
- `actual_dps` - DPS at this checkpoint
- `velocity` - Views per hour

### `viral_creators`
Monitored creators:
- `username` - @alexhormozi, @mrbeast, etc.
- `historical_dps` - Average DPS of past content
- `last_checked` - Last scrape time

### `accuracy_metrics`
Aggregate accuracy statistics:
- `mean_absolute_error` - Average prediction error
- `r_squared` - Model fit quality
- `accuracy` - Classification accuracy (viral yes/no)

## API Endpoints

### Start Workflow
```bash
POST /api/donna/workflow/start
```
Starts continuous monitoring (every 5 minutes).

### Stop Workflow
```bash
POST /api/donna/workflow/stop
```
Gracefully stops the workflow.

### Get Status
```bash
GET /api/donna/workflow/status
```
Returns:
```json
{
  "running": true,
  "statistics": {
    "totalCycles": 142,
    "totalVideosScraped": 1856,
    "totalPredictions": 1621,
    "completedValidations": 89,
    "pendingCheckpoints": 523
  }
}
```

### Run Single Cycle (Cron)
```bash
POST /api/donna/workflow/cycle
```
Called every 5 minutes by Vercel cron.

### Process Checkpoints (Cron)
```bash
POST /api/donna/tracking/process
```
Called every 1 minute to process due checkpoints.

## Cron Jobs

**File**: [vercel.json](../vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/donna/workflow/cycle",
      "schedule": "*/5 * * * *"  // Every 5 minutes
    },
    {
      "path": "/api/donna/tracking/process",
      "schedule": "*/1 * * * *"  // Every 1 minute
    }
  ]
}
```

## Configuration

### Environment Variables
```bash
# Apify
APIFY_API_TOKEN=your_apify_token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# API
NEXT_PUBLIC_API_URL=http://localhost:3000  # or production URL

# Cron Security
CRON_SECRET=your_random_secret  # Optional: Secure cron endpoints
```

### Viral Creators Configuration
**File**: [src/lib/donna/workflows/viral-creator-config.ts](../src/lib/donna/workflows/viral-creator-config.ts)

Curated list of 10 proven viral creators:
- **Business**: Alex Hormozi, Gary Vee, Dan Henry
- **Entertainment**: MrBeast, Zach King, Khaby Lame
- **Education**: Mark Rober, Veritasium
- **Motivation**: David Goggins, Ryan Trahan

### Viral Hashtags Configuration
15 high-performing hashtags across niches:
- **Finance**: #moneyadvice, #sidehustle
- **Fitness**: #transformation, #beforeandafter
- **Lifestyle**: #lifehacks, #productivity
- **General**: #viral, #trending, #foryou

## Usage

### Manual Start/Stop
```bash
# Start the workflow
curl -X POST http://localhost:3000/api/donna/workflow/start

# Check status
curl http://localhost:3000/api/donna/workflow/status

# Stop the workflow
curl -X POST http://localhost:3000/api/donna/workflow/stop
```

### Automated (Production)
Deploy to Vercel and cron jobs will run automatically:
1. Every 5 minutes: Scrape fresh videos & predict
2. Every 1 minute: Process due tracking checkpoints

## Workflow Lifecycle

### Phase 1: Discovery (Every 5 minutes)
```
1. Scrape 10 creators × 10 videos = 100 videos
2. Scrape 15 hashtags × 20 videos = 300 videos
3. Filter: <15 min old, <10k views, 7-45s duration
4. Result: ~10-50 fresh videos per cycle
```

### Phase 2: Prediction (Immediate)
```
For each fresh video:
1. Extract features (transcript, hashtags, duration, etc.)
2. Call The Donna API: POST /api/donna/reason
3. Receive prediction: DPS, confidence, patterns, recommendations
4. Store in prediction_validations table
```

### Phase 3: Tracking (Scheduled)
```
For each prediction:
1. Schedule 6 checkpoints:
   - 5min later
   - 30min later
   - 1hr later
   - 4hr later
   - 24hr later
   - 7day later

2. At each checkpoint:
   - Re-scrape video metrics
   - Calculate actual DPS
   - Record velocity (views/hour)

3. After final checkpoint (24hr or 7day):
   - Compare predicted vs actual
   - Calculate error, accuracy
   - Mark as completed
```

### Phase 4: Validation (After 24hr/7day)
```
1. Fetch final DPS
2. Compare to predicted DPS
3. Calculate metrics:
   - Absolute error
   - Percent error
   - Within range? (predicted ± 10%)
   - Correct classification? (viral yes/no)
4. Store in prediction_validations
5. Aggregate into accuracy_metrics table
```

## Accuracy Tracking

### Individual Video Accuracy
Query `prediction_validations` where `tracking_status = 'completed'`:
```sql
SELECT
  video_id,
  predicted_dps,
  final_dps,
  error,
  percent_error,
  within_range,
  correct_classification
FROM prediction_validations
WHERE tracking_status = 'completed'
ORDER BY validated_at DESC
LIMIT 10;
```

### Aggregate Accuracy
Query `accuracy_metrics` for rolling statistics:
```sql
SELECT
  period_start,
  checkpoint_type,
  mean_absolute_error,
  r_squared,
  accuracy,
  within_range_percent,
  total_predictions
FROM accuracy_metrics
WHERE checkpoint_type = '24hr'
ORDER BY period_start DESC
LIMIT 7;  -- Last 7 days
```

## Performance Expectations

### Scraping Volume
- **Per cycle**: 10-50 fresh videos
- **Per day**: 288 cycles × 30 avg = 8,640 videos
- **Per month**: ~260,000 videos

### Prediction Accuracy (Target)
- **MAE**: ≤ 5 DPS points
- **R²**: ≥ 0.85
- **Classification Accuracy**: ≥ 85%
- **Within Range**: ≥ 80% of predictions

### System Reliability
- **Uptime**: 99.9% (Vercel cron reliability)
- **API Latency**: <2s per prediction
- **Checkpoint Processing**: <30s per batch

## Monitoring & Debugging

### View Logs
```bash
# Vercel logs
vercel logs --follow

# Filter by function
vercel logs --follow | grep "donna/workflow"
```

### Check Database
```sql
-- Recent predictions
SELECT COUNT(*) FROM prediction_validations
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Pending checkpoints
SELECT COUNT(*) FROM tracking_checkpoints
WHERE completed = false AND scheduled_for < NOW();

-- Accuracy summary
SELECT
  AVG(error) as avg_error,
  AVG(percent_error) as avg_percent_error,
  SUM(CASE WHEN correct_classification THEN 1 ELSE 0 END)::float / COUNT(*) as accuracy
FROM prediction_validations
WHERE tracking_status = 'completed';
```

### Common Issues

**1. No videos scraped**
- Check Apify API token
- Verify creators/hashtags are active
- Check freshness filters (may be too strict)

**2. Predictions failing**
- Check The Donna API is running
- Verify NEXT_PUBLIC_API_URL is correct
- Check for missing transcript data

**3. Checkpoints not processing**
- Verify cron job is running
- Check tracking_checkpoints table for errors
- Ensure Apify has quota remaining

## Next Steps

### Immediate Enhancements
1. Add retry logic for failed Apify requests
2. Implement rate limiting to avoid API quotas
3. Add email/Slack notifications for errors
4. Create dashboard to visualize accuracy

### Phase 2: Advanced Features
1. Integrate real XGBoost model
2. Add GPT-4 for pattern identification
3. Implement multi-model consensus voting
4. Add cross-platform support (Instagram, YouTube)

### Phase 3: Self-Learning
1. Retrain XGBoost weekly on new validated data
2. Auto-discover new viral creators
3. Dynamic hashtag tracking based on trends
4. Personalized predictions per niche

## Related Documentation

- [UNIVERSAL_REASONING_ARCHITECTURE.md](../UNIVERSAL_REASONING_ARCHITECTURE.md) - The Donna blueprint
- [DATASET_EXPANSION_COMPLETE.md](../DATASET_EXPANSION_COMPLETE.md) - XGBoost training
- [viral-scraping-workflow.ts](../src/lib/donna/workflows/viral-scraping-workflow.ts) - Source code
- [hybrid-pipeline-architecture.md](./hybrid-pipeline-architecture.md) - Overall system design

## Support

For issues or questions:
1. Check logs: `vercel logs`
2. Review database: Query `prediction_validations` and `tracking_checkpoints`
3. Test manually: `curl -X POST http://localhost:3000/api/donna/workflow/cycle`
