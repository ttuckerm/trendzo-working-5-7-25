# Unified Viral Prediction Engine - Complete Documentation

## Overview

The Unified Viral Prediction Engine is the core module responsible for calculating viral prediction scores across the CleanCopy/Trendzo platform. It consolidates multiple prediction methodologies into a single, standardized interface.

## Architecture

### Core Components

1. **Dynamic Percentile System (DPS)** - Statistical foundation using z-score methodology
2. **Engagement Velocity Analysis** - Platform-specific engagement weighting
3. **God Mode Enhancements** - Psychological and production quality multipliers
4. **Framework Integration** - Support for 40+ viral frameworks
5. **Platform Optimization** - Platform-specific decay rates and thresholds

### Module Location
```
src/lib/services/viral-prediction/unified-prediction-engine.ts
```

### Dependencies
```typescript
// Required by:
- src/app/admin/(studio)/studio/page.tsx (Studio Dashboard)
- src/components/templateEditor-v2/ (Template Editor)
- src/app/api/viral-prediction/ (API endpoints)

// Requires:
- @supabase/supabase-js (Database access for cohort statistics)
- Historical video data (videos table)
- Platform-specific configuration constants
```

## Input/Output Specification

### Input Interface: `PredictionInput`

```typescript
interface PredictionInput {
  // === REQUIRED: Basic Video Metrics ===
  viewCount: number;          // Current view count
  likeCount: number;          // Current like count
  commentCount: number;       // Current comment count
  shareCount: number;         // Current share count
  
  // === REQUIRED: Creator Context ===
  followerCount: number;      // Creator's follower count
  platform: 'tiktok' | 'instagram' | 'youtube';
  hoursSinceUpload: number;   // Time elapsed since posting
  
  // === OPTIONAL: Enhanced Features ===
  creatorAuthority?: number;  // 0-1 scale (creator influence factor)
  
  contentFeatures?: {
    emotionalArousal?: number;    // 0-100 (psychological trigger strength)
    productionQuality?: number;   // 0-100 (video/audio quality)
    culturalRelevance?: number;   // 0-100 (trend alignment)
    authenticityScore?: number;   // 0-100 (authenticity vs over-production)
    hookStrength?: number;        // 0-100 (opening hook effectiveness)
    narrativeStructure?: number;  // 0-100 (story structure strength)
  };
  
  frameworkScores?: {
    overallScore: number;       // 0-1 scale (combined framework score)
    topFrameworks: Array<{
      name: string;             // Framework name
      score: number;            // Framework-specific score
      weight: number;           // Framework importance weight
    }>;
  };
}
```

### Output Interface: `PredictionOutput`

```typescript
interface PredictionOutput {
  // === CORE SCORES ===
  viralScore: number;         // 0-100 (final viral score)
  viralProbability: number;   // 0-1 (probability of going viral)
  confidence: number;         // 0-1 (prediction confidence)
  
  // === CLASSIFICATION ===
  classification: {
    category: 'mega-viral' | 'hyper-viral' | 'viral' | 'trending' | 'normal';
    percentile: number;       // 0-100 (cohort percentile rank)
    threshold: string;        // Human-readable threshold description
  };
  
  // === COMPONENT BREAKDOWN ===
  breakdown: {
    zScore: number;           // Statistical outlier measure
    zScoreNormalized: number; // 0-1 normalized z-score
    engagementScore: number;  // 0-1 engagement velocity
    platformWeight: number;   // Platform-specific multiplier
    decayFactor: number;      // Time decay adjustment
    godModeMultiplier?: number;      // God Mode enhancement (if applied)
    frameworkContribution?: number;  // Framework contribution (if applied)
  };
  
  // === PREDICTIONS ===
  predictions: {
    predictedViews: {
      pessimistic: number;    // Conservative view prediction
      realistic: number;      // Most likely view prediction
      optimistic: number;     // Best-case view prediction
    };
    predictedEngagement: number;  // 0-1 engagement rate prediction
    peakTimeframe: string;        // When viral peak is expected
  };
  
  // === META INFORMATION ===
  meta: {
    cohortSize: number;           // Number of similar videos in database
    dataQuality: 'high' | 'medium' | 'low';  // Prediction reliability
    modelVersion: string;         // Engine version used
    processingTime: number;       // Milliseconds to process
  };
}
```

## Scoring Algorithm Breakdown

### 1. Z-Score Statistical Foundation (40% weight)

**Purpose**: Replaces the outdated "5X rule" with statistically sound methodology

**Process**:
1. Query database for videos from similar-sized creators (±20% follower count)
2. Calculate cohort mean, median, and standard deviation
3. Compute z-score: `(viewCount - cohortMean) / cohortStandardDeviation`
4. Normalize z-score to 0-1 scale: `(zScore + 3) / 6`

**Thresholds**:
- z-score ≥ 3.0 = Top 0.1% (mega-viral)
- z-score ≥ 2.5 = Top 1% (hyper-viral)  
- z-score ≥ 2.0 = Top 5% (viral)
- z-score ≥ 1.0 = Top 10% (trending)

### 2. Engagement Velocity Analysis (30% weight)

**Purpose**: Measure quality and speed of audience interaction

**Formula**: 
```
engagementScore = (likes×w1 + comments×w2 + shares×w3) / viewCount / threshold
```

**Platform Weights**:
- TikTok: like×1, comment×2, share×3 (threshold: 6%)
- Instagram: like×1, comment×2, share×2.5 (threshold: 3%)  
- YouTube: like×1, comment×1.5, share×2 (threshold: 5%)

### 3. Platform Optimization (20% weight)

**Platform Weights**:
- TikTok: 1.0 (optimal platform for viral content)
- Instagram: 0.85 (moderate viral potential)
- YouTube: 0.75 (lower viral velocity)

### 4. Time Decay Factor (10% weight)

**Purpose**: Account for diminishing viral potential over time

**Decay Rates**:
- TikTok: 0.5 (steep decay, viral window ~24 hours)
- Instagram: 0.3 (moderate decay, viral window ~48 hours)
- YouTube: 0.1 (gradual decay, viral window ~7 days)

**Formula**: `decayFactor = e^(-rate × (hours/24))`

### 5. God Mode Enhancements (15-35% boost)

**Purpose**: Psychological and production quality multipliers

**Components**:
- **Psychological** (25% max boost): Emotional arousal scoring
- **Production** (20% max boost): Video/audio quality metrics
- **Cultural** (35% max boost): Trend alignment and cultural relevance
- **Authenticity Factor**: Prevents over-optimization penalty

**Formula**:
```
godModeMultiplier = psychologicalMultiplier × productionMultiplier × culturalMultiplier × authenticityFactor
```

**Capped at 1.35x** (35% maximum enhancement)

### 6. Framework Integration (Optional)

**Purpose**: Incorporate results from 40+ viral frameworks

**Weighting**: When available, combines base score (70%) with framework score (30%)

## Usage Examples

### Basic Usage

```typescript
import { predictViral, PredictionInput } from '@/lib/services/viral-prediction/unified-prediction-engine';

// Basic video metrics
const input: PredictionInput = {
  viewCount: 150000,
  likeCount: 12000,
  commentCount: 850,
  shareCount: 2400,
  followerCount: 45000,
  platform: 'tiktok',
  hoursSinceUpload: 6
};

const prediction = await predictViral(input);

console.log(`Viral Score: ${prediction.viralScore}/100`);
console.log(`Viral Probability: ${(prediction.viralProbability * 100).toFixed(1)}%`);
console.log(`Classification: ${prediction.classification.category}`);
```

### Enhanced Usage with Content Features

```typescript
import { getPredictionEngine, PredictionInput } from '@/lib/services/viral-prediction/unified-prediction-engine';

const engine = getPredictionEngine();

const enhancedInput: PredictionInput = {
  // Basic metrics
  viewCount: 150000,
  likeCount: 12000,
  commentCount: 850,
  shareCount: 2400,
  followerCount: 45000,
  platform: 'tiktok',
  hoursSinceUpload: 6,
  
  // Enhanced content analysis
  contentFeatures: {
    emotionalArousal: 85,     // High emotional trigger
    productionQuality: 78,    // Good quality
    culturalRelevance: 92,    // Highly relevant to current trends
    authenticityScore: 88,    // Natural, not over-produced
    hookStrength: 90,         // Strong opening hook
    narrativeStructure: 75    // Solid story structure
  },
  
  // Framework scores from viral framework parser
  frameworkScores: {
    overallScore: 0.82,
    topFrameworks: [
      { name: 'Triple Layer Hook', score: 0.91, weight: 0.15 },
      { name: 'Cultural Timing', score: 0.88, weight: 0.12 },
      { name: 'Emotional Arc', score: 0.76, weight: 0.10 }
    ]
  }
};

const prediction = await engine.predict(enhancedInput);

// Detailed analysis
console.log('=== VIRAL PREDICTION ANALYSIS ===');
console.log(`Final Score: ${prediction.viralScore}/100`);
console.log(`Viral Probability: ${(prediction.viralProbability * 100).toFixed(1)}%`);
console.log(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
console.log(`Classification: ${prediction.classification.category} (${prediction.classification.threshold})`);

console.log('\n=== COMPONENT BREAKDOWN ===');
console.log(`Z-Score: ${prediction.breakdown.zScore} (${prediction.breakdown.zScoreNormalized})`);
console.log(`Engagement Score: ${prediction.breakdown.engagementScore}`);
console.log(`Platform Weight: ${prediction.breakdown.platformWeight}`);
console.log(`Decay Factor: ${prediction.breakdown.decayFactor}`);
if (prediction.breakdown.godModeMultiplier) {
  console.log(`God Mode Boost: ${prediction.breakdown.godModeMultiplier}x`);
}

console.log('\n=== PREDICTIONS ===');
console.log(`Predicted Views (realistic): ${prediction.predictions.predictedViews.realistic.toLocaleString()}`);
console.log(`Predicted Engagement Rate: ${(prediction.predictions.predictedEngagement * 100).toFixed(2)}%`);
console.log(`Peak Timeframe: ${prediction.predictions.peakTimeframe}`);

console.log('\n=== META ===');
console.log(`Data Quality: ${prediction.meta.dataQuality}`);
console.log(`Cohort Size: ${prediction.meta.cohortSize} videos`);
console.log(`Processing Time: ${prediction.meta.processingTime}ms`);
```

### Integration with Template Editor

```typescript
// In template editor component
import { predictViral } from '@/lib/services/viral-prediction/unified-prediction-engine';

const analyzeTemplate = async (templateData: any) => {
  const input = {
    // Extract from template data
    viewCount: templateData.currentViews || 0,
    likeCount: templateData.currentLikes || 0,
    commentCount: templateData.currentComments || 0,
    shareCount: templateData.currentShares || 0,
    followerCount: templateData.creatorFollowers,
    platform: templateData.targetPlatform,
    hoursSinceUpload: 0, // For prediction of new content
    
    // From template analysis
    contentFeatures: {
      emotionalArousal: templateData.emotionalScore,
      productionQuality: templateData.qualityScore,
      culturalRelevance: templateData.trendScore,
      authenticityScore: templateData.authenticityScore,
      hookStrength: templateData.hookScore,
      narrativeStructure: templateData.narrativeScore
    }
  };
  
  const prediction = await predictViral(input);
  
  // Update UI with prediction results
  updateTemplateScore(prediction.viralScore);
  updatePredictions(prediction.predictions);
  updateClassification(prediction.classification);
};
```

## Error Handling

### Database Fallback

When database access fails, the engine automatically falls back to heuristic calculations:

```typescript
// Automatic fallback in predict() method
try {
  // Full statistical analysis with database
  return await this.generateFullPrediction(input);
} catch (error) {
  console.warn('Database prediction failed, using heuristic fallback:', error);
  return this.generateHeuristicPrediction(input, startTime);
}
```

### Input Validation

```typescript
// Validate required fields
if (!input.viewCount || input.viewCount < 0) {
  throw new Error('Invalid viewCount: must be positive number');
}

if (!['tiktok', 'instagram', 'youtube'].includes(input.platform)) {
  throw new Error('Invalid platform: must be tiktok, instagram, or youtube');
}
```

## Performance Considerations

- **Database Queries**: Optimized cohort queries with indexing on creator_followers, platform, created_at
- **Caching**: Singleton pattern for engine instance reuse
- **Fallback**: Heuristic calculations when database unavailable
- **Processing Time**: Typical response time 50-200ms for full analysis

## Migration Guide

### From Legacy Systems

**From DynamicPercentileSystem:**
```typescript
// Old
const dps = new DynamicPercentileSystem();
const result = await dps.calculateViralScore(videoId, viewCount, followerCount, hours, platform, engagement);

// New
const prediction = await predictViral({
  viewCount,
  likeCount: engagement.likeCount || 0,
  commentCount: engagement.commentCount || 0,
  shareCount: engagement.shareCount || 0,
  followerCount,
  platform,
  hoursSinceUpload: hours
});
```

**From ViralPredictionModel:**
```typescript
// Old
const model = new ViralPredictionModel();
const result = await model.predict(features);

// New (with content features)
const prediction = await predictViral({
  // ... basic metrics
  contentFeatures: {
    emotionalArousal: features.content.emotionalImpact * 100,
    productionQuality: features.visual.quality * 100,
    // ... map other features
  }
});
```

## Constants and Configuration

### Platform-Specific Constants

```typescript
const PLATFORM_WEIGHTS = {
  tiktok: 1.0,      // Optimal for viral content
  instagram: 0.85,  // Good viral potential
  youtube: 0.75     // Lower viral velocity
};

const VIRAL_THRESHOLDS = {
  tiktok: 0.06,     // 6% engagement for viral
  instagram: 0.03,  // 3% engagement for viral
  youtube: 0.05     // 5% engagement for viral
};

const PLATFORM_DECAY_RATES = {
  tiktok: 0.5,      // Steep decay (24hr window)
  instagram: 0.3,   // Moderate decay (48hr window)
  youtube: 0.1      // Gradual decay (7-day window)
};
```

### Component Weights

```typescript
const COMPONENT_WEIGHTS = {
  zScore: 0.4,        // 40% - Statistical foundation
  engagement: 0.3,    // 30% - Engagement velocity
  platform: 0.2,     // 20% - Platform specifics
  decay: 0.1          // 10% - Time decay
};
```

## Version History

- **v3.1.0** - Unified prediction engine with standardized I/O
- **v3.0.0** - God Mode enhancements and framework integration
- **v2.5.0** - Dynamic Percentile System with z-score methodology
- **v2.0.0** - Platform-specific optimizations
- **v1.0.0** - Basic viral scoring engine

## Related Files

- `src/lib/services/viral-prediction/dynamic-percentile-system.ts` - Legacy DPS implementation
- `src/lib/services/viral-prediction/framework-parser.ts` - Framework integration
- `src/lib/services/viral-prediction-model.ts` - Legacy prediction model
- `src/app/api/viral-prediction/analyze/route.ts` - API integration
- `src/components/studio/VideoCard.tsx` - UI components using predictions 