# FEAT-002: DPS Calculation Engine

## Overview

The **Dynamic Percentile System (DPS) Calculation Engine** is a proprietary viral content scoring system that calculates viral potential scores for social media videos. It combines statistical analysis, time-decay modeling, and platform-specific engagement patterns to generate accurate viral predictions.

## Features

✅ **Single Video Calculation** - Calculate DPS score for individual videos  
✅ **Batch Processing** - Process up to 100 videos simultaneously  
✅ **Auto-Processing** - Automatically process videos from `scraped_videos` table  
✅ **Cohort Statistics** - Dynamic cohort-based scoring using follower brackets  
✅ **Event Emission** - Real-time events for downstream processing  
✅ **Audit Logging** - Complete traceability of all calculations  
✅ **Error Handling** - Robust error tracking and recovery  

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  POST /api/dps/calculate                                     │
│  GET /api/dps/cohort-stats/:platform/:followerCount          │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              DPS Calculation Service                         │
│  • Input validation                                          │
│  • Cohort retrieval                                          │
│  • Orchestration                                             │
└───────────┬─────────────────────────┬───────────────────────┘
            │                         │
┌───────────▼─────────────┐  ┌────────▼──────────────────────┐
│   Calculation Engine     │  │   Database Service            │
│  • Z-score calculation   │  │  • Cohort stats retrieval     │
│  • Decay factor          │  │  • Result persistence         │
│  • Engagement scoring    │  │  • Error logging              │
│  • Viral classification  │  │  • History tracking           │
└───────────┬──────────────┘  └────────┬──────────────────────┘
            │                          │
            └──────────┬───────────────┘
                       │
            ┌──────────▼───────────┐
            │   Event Emitter      │
            │  • Success events    │
            │  • Failure events    │
            │  • Batch events      │
            └──────────────────────┘
```

## Database Schema

### `dps_calculations`
Stores all viral score calculations with complete input snapshots for reproducibility.

**Key Fields:**
- `viral_score` (0-100): Master viral potential score
- `percentile_rank` (0-100): Position within cohort
- `classification`: normal | viral | hyper-viral | mega-viral
- `z_score`: Statistical standard deviations from cohort mean
- `confidence` (0-1): Calculation confidence based on data quality

### `dps_cohort_stats`
Cached cohort statistics updated weekly for efficient calculations.

**Key Fields:**
- `platform`: tiktok | instagram | youtube
- `follower_min/max`: Cohort follower range
- `cohort_median/mean/stddev`: Statistical measures
- `sample_size`: Number of videos in cohort

### `dps_calculation_errors`
Tracks calculation failures for monitoring and debugging.

## API Usage

### Calculate DPS for Single Video

```bash
curl -X POST http://localhost:3002/api/dps/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "video": {
      "videoId": "7234567890123456789",
      "platform": "tiktok",
      "viewCount": 450000,
      "likeCount": 32000,
      "commentCount": 1200,
      "shareCount": 4500,
      "followerCount": 50000,
      "hoursSinceUpload": 12,
      "publishedAt": "2025-10-01T08:00:00Z"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "mode": "single",
  "result": {
    "videoId": "7234567890123456789",
    "viralScore": 87.3,
    "percentileRank": 96.5,
    "classification": "viral",
    "zScore": 2.45,
    "decayFactor": 0.607,
    "platformWeight": 1.0,
    "cohortMedian": 75000,
    "confidence": 0.92,
    "calculatedAt": "2025-10-02T14:32:15Z",
    "auditId": "aud_dps_1696255935_xyz123",
    "processingTimeMs": 245
  }
}
```

### Calculate DPS for Batch

```bash
curl -X POST http://localhost:3002/api/dps/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "videos": [
      {
        "videoId": "video-1",
        "platform": "tiktok",
        "viewCount": 100000,
        "likeCount": 5000,
        "commentCount": 200,
        "shareCount": 300,
        "followerCount": 20000,
        "hoursSinceUpload": 6,
        "publishedAt": "2025-10-02T08:00:00Z"
      },
      {
        "videoId": "video-2",
        "platform": "instagram",
        "viewCount": 50000,
        "likeCount": 3000,
        "followerCount": 15000,
        "hoursSinceUpload": 3,
        "publishedAt": "2025-10-02T11:00:00Z"
      }
    ],
    "batchId": "batch-20251002-001"
  }'
```

**Response:**
```json
{
  "success": true,
  "mode": "batch",
  "batchId": "batch-20251002-001",
  "totalVideos": 2,
  "successCount": 2,
  "failureCount": 0,
  "results": [
    { /* DPS result for video-1 */ },
    { /* DPS result for video-2 */ }
  ],
  "errors": [],
  "auditId": "aud_dps_1696256123_abc456",
  "processingTimeMs": 512
}
```

### Process Scraped Videos

Automatically processes videos from the `scraped_videos` table:

```bash
curl -X POST http://localhost:3002/api/dps/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "process_scraped",
    "limit": 50
  }'
```

### Get Cohort Statistics

```bash
curl http://localhost:3002/api/dps/cohort-stats/tiktok/50000
```

**Response:**
```json
{
  "success": true,
  "platform": "tiktok",
  "followerCount": 50000,
  "cohortStats": {
    "cohortMedian": 75000,
    "cohortMean": 92000,
    "cohortStdDev": 45000,
    "sampleSize": 1247
  }
}
```

## Programmatic Usage

```typescript
import { 
  calculateSingleDPS, 
  calculateBatchDPS,
  processScrapedVideos 
} from '@/lib/services/dps';

// Single video calculation
const result = await calculateSingleDPS({
  videoId: 'test-video-123',
  platform: 'tiktok',
  viewCount: 100000,
  likeCount: 5000,
  commentCount: 200,
  shareCount: 300,
  followerCount: 20000,
  hoursSinceUpload: 6,
  publishedAt: '2025-10-02T08:00:00Z',
});

console.log(`Viral Score: ${result.viralScore}`);
console.log(`Classification: ${result.classification}`);

// Batch processing
const batchResult = await calculateBatchDPS([video1, video2, video3]);
console.log(`Processed ${batchResult.successCount}/${batchResult.totalVideos} videos`);

// Auto-process scraped videos
const scrapedResult = await processScrapedVideos(100);
console.log(`Processed ${scrapedResult.successCount} scraped videos`);
```

## Event System

The DPS engine emits events for all calculations:

### Event Types

1. **EVT.DPS.CalculationCompleted** - Successful calculation
2. **EVT.DPS.CalculationFailed** - Failed calculation
3. **EVT.DPS.BatchCompleted** - Batch processing complete
4. **EVT.DPS.CohortStatsUpdated** - Cohort statistics updated

### Listening to Events

```typescript
import { registerEventHandler } from '@/lib/services/dps';

registerEventHandler(async (event) => {
  if (event.event === 'EVT.DPS.CalculationCompleted') {
    console.log(`Video ${event.data.videoId} scored ${event.data.viralScore}`);
    
    // Custom processing (e.g., trigger downstream systems)
    if (event.data.classification === 'mega-viral') {
      await notifyMarketingTeam(event.data);
    }
  }
});
```

## Algorithm Details

### Viral Score Calculation

The DPS algorithm combines multiple factors:

1. **Z-Score (60% weight)**: Statistical performance vs cohort
   - Measures standard deviations from cohort mean
   - Normalized to 0-100 scale

2. **Engagement Score (25% weight)**: Interaction quality
   - Weighted combination of likes, comments, shares
   - Platform-specific weights

3. **Time Decay (15% weight)**: Content freshness
   - Exponential decay based on hours since upload
   - Platform-specific decay rates

**Formula:**
```
viralScore = (zScoreNormalized × 0.60) + 
             (engagementScore × 0.25) + 
             (decayFactor × 0.15) × 
             platformWeight
```

### Viral Classification

- **Normal**: < 95th percentile
- **Viral**: 95th - 99th percentile (Top 5%)
- **Hyper-Viral**: 99th - 99.9th percentile (Top 1%)
- **Mega-Viral**: > 99.9th percentile (Top 0.1%)

## Performance

- **Single calculation**: p95 < 500ms
- **Batch processing (100 videos)**: p95 < 30s
- **Cohort stats lookup**: p95 < 100ms

## Error Handling

The engine handles various failure scenarios:

- **Missing cohort data**: Falls back to platform-wide median
- **Incomplete engagement metrics**: Adjusts confidence score
- **Database failures**: Logs to error table, non-blocking
- **Invalid input**: Clear validation error messages

## Monitoring

Check calculation statistics:

```typescript
import { getCalculationStats } from '@/lib/services/dps';

const stats = await getCalculationStats('24h');
console.log(`Success rate: ${stats.successRate * 100}%`);
console.log(`Avg processing time: ${stats.avgProcessingTime}ms`);
console.log(`Avg confidence: ${stats.avgConfidence}`);
```

## Migration

Run the database migration:

```bash
# Using Supabase CLI
supabase db push

# Or apply SQL directly
psql -d your_database -f supabase/migrations/20251002_feat002_dps_calculation_engine.sql
```

## Testing

Example test cases:

```typescript
// Test 1: High-performing video
const viral = await calculateSingleDPS({
  videoId: 'test-viral',
  platform: 'tiktok',
  viewCount: 1000000,  // 1M views
  likeCount: 50000,
  commentCount: 2000,
  shareCount: 5000,
  followerCount: 50000,
  hoursSinceUpload: 12,
  publishedAt: new Date().toISOString(),
});

expect(viral.classification).toBe('viral' | 'hyper-viral' | 'mega-viral');
expect(viral.viralScore).toBeGreaterThan(85);

// Test 2: Normal video
const normal = await calculateSingleDPS({
  videoId: 'test-normal',
  platform: 'tiktok',
  viewCount: 5000,
  likeCount: 200,
  followerCount: 10000,
  hoursSinceUpload: 24,
  publishedAt: new Date().toISOString(),
});

expect(normal.classification).toBe('normal');
```

## Support

For issues or questions:
- **Team**: Data Engineering (dps-owner@domain.com)
- **On-call**: #dps-oncall Slack channel
- **Documentation**: See PRD FEAT-002

## License

Proprietary - Trendzo Internal Use Only  
**Patent Pending**: PATENT-003 DPS Virality Fingerprinting Logic


