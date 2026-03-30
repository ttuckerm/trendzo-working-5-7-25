# Phase 0 Implementation Plan - Admin Prediction Lab

**Duration**: 7-10 Days
**Goal**: Bare-bones working system for internal testing
**Deliverable**: Admin can upload MP4 → get frozen prediction → manually enter metrics → see accuracy

**Status**: Ready to Start
**Last Updated**: 2025-11-15

---

## Pre-Flight Checklist

### Research Complete ✅
- [x] Enforcement mechanism: PostgreSQL GRANT/REVOKE roles
- [x] Hash scope: Complete without 119 features
- [x] Blockchain approach: SHA-256 only for Phase 0
- [x] Apify verification: All 5 metrics confirmed (views, likes, comments, shares, bookmarks)
- [x] Predictor verification: Works (19.3 DPS in 12.6s)
- [x] Bug identified: Return value undefined (fixable in 1 hour)
- [x] Contamination confirmed: Predictor reads metrics from DB (lines 122-129)

### Known Issues to Fix
1. **hybrid-predictor.ts return bug** - Returns `undefined` for `predicted_dps` despite correct calculation
2. **Predictor contamination** - Currently reads metrics from `scraped_videos` table (lines 122-129)
3. **Feature extraction dependency** - Predictor expects metrics as input, needs adaptation

---

## Day 1-2: Database Foundation

### Task 1.1: Create Database Tables (3 hours)

**File to Create**: `supabase/migrations/20251115_admin_prediction_lab.sql`

**SQL Code**:
```sql
-- ============================================================================
-- Admin Prediction Lab: Three-Table Architecture
-- ============================================================================
-- Purpose: Anti-contamination guarantee for prediction testing
-- Date: 2025-11-15
-- Author: Claude (based on PRD v1.2)
-- ============================================================================

-- ============================================================================
-- Table 1: video_files (INPUT)
-- Predictor reads from here
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input source (one of these required)
  tiktok_url TEXT,
  storage_path TEXT,  -- Path to MP4 file in data/raw_videos or Supabase Storage

  -- Metadata
  niche VARCHAR(100),
  goal VARCHAR(255),  -- e.g., "grow followers", "promote product"
  account_size_band VARCHAR(50),  -- e.g., "small (0-10K)", "medium (10K-100K)"
  platform VARCHAR(50) DEFAULT 'tiktok',

  -- Optional (if video already posted)
  posted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_video_files_created_at ON video_files(created_at DESC);
CREATE INDEX idx_video_files_niche ON video_files(niche);

-- Comments
COMMENT ON TABLE video_files IS 'Admin Lab: Video inputs for prediction (no metrics)';
COMMENT ON COLUMN video_files.storage_path IS 'Path like data/raw_videos/video123.mp4';

-- ============================================================================
-- Table 2: prediction_events (FROZEN PREDICTIONS)
-- Predictor writes here
-- ============================================================================

CREATE TABLE IF NOT EXISTS prediction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES video_files(id) ON DELETE CASCADE,

  -- Model info
  model_version VARCHAR(50) NOT NULL,  -- e.g., "xgb_v1.0", "hybrid_v1.2"

  -- Feature snapshot (for debugging)
  feature_snapshot JSONB NOT NULL,  -- Top 10 features only, not all 119

  -- Predictions
  predicted_dps NUMERIC(5,2) NOT NULL CHECK (predicted_dps >= 0 AND predicted_dps <= 100),
  predicted_dps_low NUMERIC(5,2) NOT NULL,  -- Lower bound of range
  predicted_dps_high NUMERIC(5,2) NOT NULL,  -- Upper bound of range
  confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),

  -- Explanation
  explanation TEXT,  -- Human-readable explanation of prediction

  -- Verification (cryptographic freezing)
  prediction_hash TEXT NOT NULL,  -- SHA-256 of prediction payload
  blockchain_tx_hash TEXT,  -- Optional blockchain transaction hash (Phase 1)
  blockchain_block_number INTEGER,  -- Optional block number (Phase 1)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prediction_events_video_id ON prediction_events(video_id);
CREATE INDEX idx_prediction_events_created_at ON prediction_events(created_at DESC);
CREATE INDEX idx_prediction_events_hash ON prediction_events(prediction_hash);
CREATE UNIQUE INDEX idx_prediction_events_video_latest ON prediction_events(video_id, created_at DESC);

-- Comments
COMMENT ON TABLE prediction_events IS 'Admin Lab: Frozen predictions with cryptographic proof';
COMMENT ON COLUMN prediction_events.prediction_hash IS 'SHA-256 hash proving prediction made before metrics known';

-- ============================================================================
-- Table 3: prediction_actuals (ACTUAL METRICS)
-- Scraper writes here (predictor CANNOT access this)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prediction_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES prediction_events(id) ON DELETE CASCADE,

  -- Snapshot type (time-sliced metrics)
  snapshot_type VARCHAR(20) NOT NULL CHECK (snapshot_type IN ('1h', '4h', '8h', '24h', '7d', 'lifetime')),

  -- Engagement metrics (all from Apify scraper)
  views BIGINT,
  likes BIGINT,
  comments BIGINT,
  shares BIGINT,
  bookmarks BIGINT,  -- collectCount from Apify

  -- Calculated DPS (for accuracy comparison)
  actual_dps NUMERIC(5,2) CHECK (actual_dps >= 0 AND actual_dps <= 100),

  -- Metadata
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (source IN ('apify', 'manual')),  -- How metrics were obtained

  UNIQUE(prediction_id, snapshot_type)  -- One snapshot per type per prediction
);

-- Indexes
CREATE INDEX idx_prediction_actuals_prediction_id ON prediction_actuals(prediction_id);
CREATE INDEX idx_prediction_actuals_snapshot_type ON prediction_actuals(snapshot_type);
CREATE INDEX idx_prediction_actuals_fetched_at ON prediction_actuals(fetched_at DESC);

-- Comments
COMMENT ON TABLE prediction_actuals IS 'Admin Lab: Actual engagement metrics (predictor has NO ACCESS)';
COMMENT ON COLUMN prediction_actuals.actual_dps IS 'Calculated from actual metrics for accuracy comparison';
COMMENT ON COLUMN prediction_actuals.source IS 'manual = Phase 0, apify = Phase 1';

-- ============================================================================
-- Grant Permissions (comes later in Day 2)
-- ============================================================================

-- Placeholder: Will be populated after roles created
-- See Task 1.2 below
```

**Execution**:
```bash
npx supabase db push
```

**Verification**:
```sql
-- Verify tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('video_files', 'prediction_events', 'prediction_actuals');

-- Should return 3 rows
```

---

### Task 1.2: Create PostgreSQL Roles (2 hours)

**File to Create**: `supabase/migrations/20251115_admin_lab_roles.sql`

**SQL Code**:
```sql
-- ============================================================================
-- Admin Lab: PostgreSQL Roles for Anti-Contamination
-- ============================================================================
-- Purpose: Enforce table-level permissions to prevent predictor from seeing metrics
-- Date: 2025-11-15
-- ============================================================================

-- ============================================================================
-- Role 1: predictor_role
-- Can read video_files, write prediction_events, CANNOT access prediction_actuals
-- ============================================================================

CREATE ROLE IF NOT EXISTS predictor_role;

-- Read permissions
GRANT SELECT ON video_files TO predictor_role;

-- Write permissions
GRANT INSERT, SELECT ON prediction_events TO predictor_role;

-- CRITICAL: No access to actuals
REVOKE ALL ON prediction_actuals FROM predictor_role;

-- Comments
COMMENT ON ROLE predictor_role IS 'Admin Lab: Predictor service (NO ACCESS to metrics)';

-- ============================================================================
-- Role 2: scraper_role
-- Can write to prediction_actuals, CANNOT modify predictions
-- ============================================================================

CREATE ROLE IF NOT EXISTS scraper_role;

-- Write permissions
GRANT INSERT, UPDATE, SELECT ON prediction_actuals TO scraper_role;

-- Read-only access to predictions (for linking)
GRANT SELECT ON prediction_events TO scraper_role;
GRANT SELECT ON video_files TO scraper_role;

-- CRITICAL: Cannot modify frozen predictions
REVOKE INSERT, UPDATE, DELETE ON prediction_events FROM scraper_role;

-- Comments
COMMENT ON ROLE scraper_role IS 'Admin Lab: Scraper service (writes metrics only)';

-- ============================================================================
-- Role 3: admin_role (for manual testing)
-- Full access to all tables
-- ============================================================================

CREATE ROLE IF NOT EXISTS admin_role;

-- Full permissions on all tables
GRANT ALL ON video_files TO admin_role;
GRANT ALL ON prediction_events TO admin_role;
GRANT ALL ON prediction_actuals TO admin_role;

-- Comments
COMMENT ON ROLE admin_role IS 'Admin Lab: Full access for testing and debugging';

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Run this to verify roles and permissions:
-- SELECT
--   grantee,
--   table_name,
--   privilege_type
-- FROM information_schema.role_table_grants
-- WHERE grantee IN ('predictor_role', 'scraper_role', 'admin_role')
-- ORDER BY grantee, table_name, privilege_type;
```

**Execution**:
```bash
npx supabase db push
```

**Verification**:
```sql
-- Verify roles created
SELECT rolname FROM pg_roles WHERE rolname IN ('predictor_role', 'scraper_role', 'admin_role');

-- Verify permissions
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee IN ('predictor_role', 'scraper_role', 'admin_role')
ORDER BY grantee, table_name, privilege_type;

-- Expected output:
-- predictor_role | video_files        | SELECT
-- predictor_role | prediction_events  | INSERT, SELECT
-- scraper_role   | prediction_actuals | INSERT, UPDATE, SELECT
-- scraper_role   | prediction_events  | SELECT
-- admin_role     | (all tables)       | ALL
```

---

### Task 1.3: Create Service Connection Configs (1 hour)

**File to Update**: `.env.local`

**Add New Environment Variables**:
```bash
# Admin Lab: PostgreSQL Role Credentials
# NOTE: These are PostgreSQL roles, NOT Supabase service keys
# Create using: CREATE USER predictor_user WITH PASSWORD 'xxx' IN ROLE predictor_role;

PREDICTOR_DB_USER=predictor_user
PREDICTOR_DB_PASSWORD=CHANGE_ME_SECURE_PASSWORD_1
PREDICTOR_DB_CONNECTION_STRING=postgresql://predictor_user:CHANGE_ME@db.vyeiyccrageeckeehyhj.supabase.co:5432/postgres

SCRAPER_DB_USER=scraper_user
SCRAPER_DB_PASSWORD=CHANGE_ME_SECURE_PASSWORD_2
SCRAPER_DB_CONNECTION_STRING=postgresql://scraper_user:CHANGE_ME@db.vyeiyccrageeckeehyhj.supabase.co:5432/postgres

ADMIN_DB_USER=admin_user
ADMIN_DB_PASSWORD=CHANGE_ME_SECURE_PASSWORD_3
ADMIN_DB_CONNECTION_STRING=postgresql://admin_user:CHANGE_ME@db.vyeiyccrageeckeehyhj.supabase.co:5432/postgres
```

**SQL to Create Users**:
```sql
-- Run this in Supabase SQL Editor to create users with role membership
CREATE USER predictor_user WITH PASSWORD 'CHANGE_ME_SECURE_PASSWORD_1' IN ROLE predictor_role;
CREATE USER scraper_user WITH PASSWORD 'CHANGE_ME_SECURE_PASSWORD_2' IN ROLE scraper_role;
CREATE USER admin_user WITH PASSWORD 'CHANGE_ME_SECURE_PASSWORD_3' IN ROLE admin_role;
```

**Verification**:
```bash
# Test predictor connection (should succeed)
PGPASSWORD=$PREDICTOR_DB_PASSWORD psql "$PREDICTOR_DB_CONNECTION_STRING" -c "SELECT * FROM video_files LIMIT 1;"

# Test predictor CANNOT access actuals (should fail)
PGPASSWORD=$PREDICTOR_DB_PASSWORD psql "$PREDICTOR_DB_CONNECTION_STRING" -c "SELECT * FROM prediction_actuals LIMIT 1;"
# Expected: ERROR: permission denied for table prediction_actuals
```

**End of Day 1-2 Deliverables**:
- ✅ Three tables created (video_files, prediction_events, prediction_actuals)
- ✅ Three roles created (predictor_role, scraper_role, admin_role)
- ✅ Permissions enforced (predictor CANNOT access prediction_actuals)
- ✅ Connection strings configured in .env.local

---

## Day 3: Fix Predictor Bugs

### Task 3.1: Fix Return Value Bug (1 hour)

**File to Edit**: `src/lib/ml/hybrid-predictor.ts`

**Current Issue** (lines 222-249):
```typescript
return {
  success: true,
  finalDpsPrediction: finalDps,  // ✅ This works
  confidence: finalConfidence,
  // ... other fields
};
```

**But API response shows**: `predicted_dps: undefined`

**Root Cause**: Need to trace where API response is constructed. The predictor returns `finalDpsPrediction`, but API might expect `predicted_dps`.

**Investigation Steps**:
1. Search for API endpoint that calls `predictVirality()`:
   ```bash
   grep -r "predictVirality" src/app/api/
   ```

2. Check if API endpoint transforms field names

3. Fix the mismatch (either update predictor return type OR update API transform)

**File to Read**: `src/app/api/predict/route.ts` (likely location)

**Expected Fix**:
```typescript
// Option 1: Update predictor return type to match API contract
return {
  success: true,
  predicted_dps: finalDps,  // Changed from finalDpsPrediction
  // ...
};

// OR Option 2: Update API to transform field names
const response = {
  predicted_dps: result.finalDpsPrediction,  // Map to expected field
  // ...
};
```

**Verification**:
```bash
# Test prediction on existing video
npx tsx scripts/test-prediction.ts
# Should show: predicted_dps: 19.3 (not undefined)
```

---

### Task 3.2: Remove Metrics Contamination (2 hours)

**File to Edit**: `src/lib/ml/hybrid-predictor.ts`

**Current Contamination** (lines 122-129):
```typescript
featureExtractionInput = {
  videoId: video.video_id,
  transcript: video.transcript_text || '',
  title: video.title || '',
  description: video.description || '',
  viewsCount: video.views_count,        // ❌ TAINTED
  likesCount: video.likes_count,        // ❌ TAINTED
  commentsCount: video.comments_count,  // ❌ TAINTED
  sharesCount: video.shares_count,      // ❌ TAINTED
  savesCount: video.saves_count,        // ❌ TAINTED
  videoDurationSeconds: video.video_duration,
  uploadedAt: video.create_time,
  dpsScore: video.dps_score,            // ❌ TAINTED
};
```

**Fix**: Create new function that queries `video_files` table instead of `scraped_videos`

**New Function**:
```typescript
// Add to hybrid-predictor.ts around line 85

async function loadVideoForPrediction(videoId: string): Promise<FeatureExtractionInput> {
  const { createClient } = await import('@supabase/supabase-js');

  // CRITICAL: Use predictor_role connection (NO ACCESS to metrics)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.PREDICTOR_DB_USER!,  // Uses predictor_role
    {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
      },
    }
  );

  // Query video_files table (NOT scraped_videos)
  const { data: video, error } = await supabase
    .from('video_files')
    .select('*')
    .eq('id', videoId)
    .single();

  if (error || !video) {
    throw new Error(`Video not found in video_files: ${videoId}`);
  }

  // Extract transcript from MP4 or TikTok URL
  let transcript = '';
  let title = '';
  let description = '';

  if (video.storage_path) {
    // Extract transcript from MP4 using Whisper
    const { extractTranscriptFromVideo } = await import('../services/whisper-service');
    const transcriptResult = await extractTranscriptFromVideo(video.storage_path);
    transcript = transcriptResult.text;
  } else if (video.tiktok_url) {
    // Fetch transcript from TikTok (Phase 1)
    // For Phase 0: Throw error, only support MP4
    throw new Error('TikTok URL support coming in Phase 1. Please upload MP4 file.');
  }

  return {
    videoId: video.id,
    transcript,
    title,
    description,
    // NO METRICS - predictor cannot see these
    videoDurationSeconds: undefined,  // Will be estimated from transcript
    uploadedAt: video.created_at,
  };
}
```

**Update Main Function** (lines 101-144):
```typescript
if (input.videoId) {
  // OLD: Load from scraped_videos (contaminated)
  // NEW: Load from video_files (clean)
  featureExtractionInput = await loadVideoForPrediction(input.videoId);
} else {
  // Direct transcript input (unchanged)
  featureExtractionInput = {
    videoId: 'custom_' + Date.now(),
    transcript: input.transcript,
    title: input.title || 'Untitled',
    description: input.description || '',
    ...input.metadata,
  };
}
```

**Verification**:
```bash
# Test that predictor works WITHOUT metrics
npx tsx scripts/test-clean-prediction.ts

# Should show:
# ✅ Loaded video from video_files (NO metrics access)
# ✅ Extracted features WITHOUT engagement data
# ✅ Prediction: 67.5 DPS
```

---

### Task 3.3: Adapt Feature Extraction (2 hours)

**File to Edit**: `src/lib/services/feature-extraction/index.ts`

**Current Dependency**: Feature extraction expects `viewsCount`, `likesCount`, etc.

**Fix**: Make metrics optional and estimate missing features

**Update Feature Extraction**:
```typescript
// In extractFeaturesFromVideo() function

export async function extractFeaturesFromVideo(
  input: FeatureExtractionInput
): Promise<FeatureExtractionOutput> {
  const features: VideoFeatures = {
    // ... existing code
  };

  // ENGAGEMENT FEATURES (make optional for Admin Lab)
  if (input.viewsCount !== undefined) {
    // Use actual metrics
    features.engagement = {
      views_count: input.viewsCount,
      likes_count: input.likesCount || 0,
      comments_count: input.commentsCount || 0,
      shares_count: input.sharesCount || 0,
      saves_count: input.savesCount || 0,
      // ... calculate derived features
    };
  } else {
    // ADMIN LAB MODE: Estimate engagement from content features
    // Use average values from training data
    features.engagement = {
      views_count: 10000,  // Default: small account baseline
      likes_count: 500,    // Default: 5% engagement rate
      comments_count: 50,
      shares_count: 25,
      saves_count: 15,
      // ... use defaults for derived features
    };

    console.log('⚠️ Admin Lab Mode: Using estimated engagement (no metrics access)');
  }

  return {
    success: true,
    features,
    featureCount: 119,
    timestamp: new Date().toISOString(),
  };
}
```

**Rationale**: XGBoost model was trained on videos WITH engagement metrics. For pre-content prediction, we use baseline defaults that approximate a "new video" scenario.

**Verification**:
```bash
# Test feature extraction without metrics
npx tsx scripts/test-feature-extraction-clean.ts

# Should show:
# ✅ Extracted 119 features
# ⚠️ Admin Lab Mode: Using estimated engagement (no metrics access)
```

**End of Day 3 Deliverables**:
- ✅ Return value bug fixed (predicted_dps now correct)
- ✅ Metrics contamination removed (predictor uses video_files, not scraped_videos)
- ✅ Feature extraction adapted (works without engagement metrics)

---

## Day 4: Prediction Hash Generation

### Task 4.1: Create Hash Generation Service (2 hours)

**File to Create**: `src/lib/services/prediction-hash.ts`

**Code**:
```typescript
/**
 * Prediction Hash Service
 *
 * Generates SHA-256 hash of prediction payload for cryptographic freezing.
 * Hash proves prediction was made BEFORE metrics were known.
 *
 * @module prediction-hash
 */

import crypto from 'crypto';

// =====================================================
// Type Definitions
// =====================================================

export interface PredictionPayload {
  video_id: string;
  predicted_dps: number;
  predicted_range: [number, number];  // [low, high]
  confidence: number;
  model_version: string;
  top_features: Array<{
    name: string;
    importance: number;
    value: number;
  }>;
  explanation: string;
  timestamp_utc: string;
}

export interface PredictionHashResult {
  hash: string;
  algorithm: string;
  payload: PredictionPayload;
  created_at: string;
}

// =====================================================
// Core Functions
// =====================================================

/**
 * Generate SHA-256 hash of prediction payload
 *
 * @param payload - Complete prediction data
 * @returns Hash result with verification data
 */
export function generatePredictionHash(
  payload: PredictionPayload
): PredictionHashResult {
  // Normalize payload to ensure consistent hashing
  const normalizedPayload = {
    video_id: payload.video_id,
    predicted_dps: Number(payload.predicted_dps.toFixed(2)),
    predicted_range: [
      Number(payload.predicted_range[0].toFixed(2)),
      Number(payload.predicted_range[1].toFixed(2))
    ],
    confidence: Number(payload.confidence.toFixed(4)),
    model_version: payload.model_version,
    top_features: payload.top_features.slice(0, 10).map(f => ({
      name: f.name,
      importance: Number(f.importance.toFixed(4)),
      value: Number(f.value.toFixed(2))
    })),
    explanation: payload.explanation,
    timestamp_utc: payload.timestamp_utc
  };

  // Serialize to JSON (deterministic key order)
  const jsonString = JSON.stringify(normalizedPayload, Object.keys(normalizedPayload).sort());

  // Generate SHA-256 hash
  const hash = crypto
    .createHash('sha256')
    .update(jsonString)
    .digest('hex');

  return {
    hash,
    algorithm: 'sha256',
    payload: normalizedPayload,
    created_at: new Date().toISOString()
  };
}

/**
 * Verify a prediction hash
 *
 * @param hash - Hash to verify
 * @param payload - Original prediction payload
 * @returns True if hash matches payload
 */
export function verifyPredictionHash(
  hash: string,
  payload: PredictionPayload
): boolean {
  const result = generatePredictionHash(payload);
  return result.hash === hash;
}

/**
 * Create prediction payload from hybrid predictor output
 *
 * @param predictionResult - Output from predictVirality()
 * @param videoId - Video ID from video_files table
 * @returns Formatted payload ready for hashing
 */
export function createPayloadFromPrediction(
  predictionResult: any,
  videoId: string
): PredictionPayload {
  const predictionInterval = predictionResult.predictionInterval || {
    lower: predictionResult.finalDpsPrediction - 15,
    upper: predictionResult.finalDpsPrediction + 15
  };

  return {
    video_id: videoId,
    predicted_dps: predictionResult.finalDpsPrediction,
    predicted_range: [predictionInterval.lower, predictionInterval.upper],
    confidence: predictionResult.confidence,
    model_version: predictionResult.modelUsed === 'hybrid' ? 'hybrid_v1.0' : 'xgb_v1.0',
    top_features: predictionResult.topFeatures.slice(0, 10),
    explanation: predictionResult.qualitativeAnalysis?.reasoning ||
                 `Predicted DPS ${predictionResult.finalDpsPrediction.toFixed(1)} based on ${predictionResult.featureCount} features`,
    timestamp_utc: predictionResult.timestamp
  };
}

// =====================================================
// Exports
// =====================================================

export const PredictionHash = {
  generate: generatePredictionHash,
  verify: verifyPredictionHash,
  createPayload: createPayloadFromPrediction
};

export default PredictionHash;
```

**Verification Test**:
```typescript
// Test hash generation
const payload: PredictionPayload = {
  video_id: 'test-123',
  predicted_dps: 67.5,
  predicted_range: [45, 82],
  confidence: 0.73,
  model_version: 'xgb_v1.0',
  top_features: [
    { name: 'hook_strength', importance: 0.15, value: 8.2 },
    { name: 'pacing_score', importance: 0.12, value: 3.1 }
  ],
  explanation: 'High hook strength detected',
  timestamp_utc: '2025-11-15T12:00:00.000Z'
};

const result = generatePredictionHash(payload);
console.log('Hash:', result.hash);
// Should output consistent hash for same input

const verified = verifyPredictionHash(result.hash, payload);
console.log('Verified:', verified);  // Should be true
```

---

### Task 4.2: Integrate Hash with Predictor (1 hour)

**File to Edit**: `src/lib/ml/hybrid-predictor.ts`

**Add to Imports**:
```typescript
import { PredictionHash } from '../services/prediction-hash';
```

**Update Return Statement** (around line 222):
```typescript
const processingTimeMs = Date.now() - startTime;

// Generate prediction hash for cryptographic freezing
const predictionPayload = PredictionHash.createPayload(
  {
    finalDpsPrediction: finalDps,
    confidence: finalConfidence,
    predictionInterval: xgboostResult.predictionInterval,
    topFeatures,
    qualitativeAnalysis: gptResult,
    modelUsed: useGPT ? 'hybrid' : 'xgboost',
    featureCount: featureResult.featureCount || 119,
    timestamp: new Date().toISOString()
  },
  input.videoId || featureExtractionInput.videoId
);

const hashResult = PredictionHash.generate(predictionPayload);

console.log(`\n✅ Prediction complete:`);
console.log(`   Final DPS: ${finalDps.toFixed(1)}`);
console.log(`   Confidence: ${(finalConfidence * 100).toFixed(0)}%`);
console.log(`   Hash: ${hashResult.hash.substring(0, 16)}...`);
console.log(`   Processing time: ${processingTimeMs}ms\n`);

return {
  success: true,
  predicted_dps: finalDps,  // Fixed field name
  confidence: finalConfidence,
  predictionBreakdown: {
    xgboostBase: xgboostResult.baseDpsPrediction,
    gptAdjustment,
    finalScore: finalDps,
  },
  topFeatures: topFeatures.map(f => ({
    name: f.name,
    importance: f.importance,
    value: f.value,
  })),
  predictionInterval: xgboostResult.predictionInterval,
  qualitativeAnalysis: gptResult ? {
    viralHooks: gptResult.viralHooks,
    weaknesses: gptResult.weaknesses,
    recommendations: gptResult.recommendations,
    reasoning: gptResult.reasoning,
    overallAssessment: gptResult.overallAssessment,
  } : undefined,

  // NEW: Cryptographic hash
  predictionHash: hashResult.hash,
  predictionPayload: hashResult.payload,

  modelUsed: useGPT ? 'hybrid' : 'xgboost',
  featureCount: featureResult.featureCount || 119,
  processingTimeMs,
  llmCostUsd: gptResult?.llmCostUsd || 0,
  timestamp: new Date().toISOString(),
};
```

**Verification**:
```bash
# Test prediction with hash
npx tsx scripts/test-prediction-with-hash.ts

# Should show:
# ✅ Prediction: 67.5 DPS
# ✅ Hash: a3f8d9c2e1b4... (64 characters)
```

**End of Day 4 Deliverables**:
- ✅ Prediction hash service created (SHA-256)
- ✅ Hash integrated with hybrid predictor
- ✅ Verification function working

---

## Day 5-6: Basic Admin Form

### Task 5.1: Create Admin Predict API (3 hours)

**File to Create**: `src/app/api/admin/predict/route.ts`

**Code**:
```typescript
/**
 * Admin Lab: Predict API
 *
 * POST /api/admin/predict
 *
 * Upload MP4 and get frozen prediction (no metrics access)
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { predictVirality } from '@/lib/ml/hybrid-predictor';

// Use admin connection for this endpoint (writes to video_files and prediction_events)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.ADMIN_DB_PASSWORD!,  // Admin role (can write to all tables)
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const videoFile = formData.get('videoFile') as File | null;
    const tiktokUrl = formData.get('tiktokUrl') as string | null;
    const niche = formData.get('niche') as string;
    const goal = formData.get('goal') as string;
    const accountSize = formData.get('accountSize') as string;

    // Validate input
    if (!videoFile && !tiktokUrl) {
      return NextResponse.json(
        { success: false, error: 'Either videoFile or tiktokUrl is required' },
        { status: 400 }
      );
    }

    if (!niche || !goal || !accountSize) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: niche, goal, accountSize' },
        { status: 400 }
      );
    }

    let storagePath: string | null = null;

    // Step 1: Save MP4 file (if uploaded)
    if (videoFile) {
      const videoDir = join(process.cwd(), 'data', 'raw_videos');

      // Create directory if not exists
      if (!existsSync(videoDir)) {
        await mkdir(videoDir, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `admin_lab_${timestamp}.mp4`;
      storagePath = join('data', 'raw_videos', filename);
      const fullPath = join(process.cwd(), storagePath);

      const bytes = await videoFile.arrayBuffer();
      await writeFile(fullPath, Buffer.from(bytes));

      console.log(`✅ Saved video: ${storagePath}`);
    }

    // Step 2: Insert into video_files table
    const { data: videoRecord, error: insertError } = await supabase
      .from('video_files')
      .insert({
        tiktok_url: tiktokUrl,
        storage_path: storagePath,
        niche,
        goal,
        account_size_band: accountSize,
        platform: 'tiktok',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError || !videoRecord) {
      return NextResponse.json(
        { success: false, error: `Failed to save video record: ${insertError?.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Created video record: ${videoRecord.id}`);

    // Step 3: Run prediction (uses predictor_role internally - NO metrics access)
    const predictionResult = await predictVirality({
      videoId: videoRecord.id,
      skipGPTRefinement: false,  // Use full hybrid pipeline
    });

    if (!predictionResult.success) {
      return NextResponse.json(
        { success: false, error: `Prediction failed: ${predictionResult.error}` },
        { status: 500 }
      );
    }

    // Step 4: Insert frozen prediction into prediction_events
    const { data: predictionEvent, error: predictionError } = await supabase
      .from('prediction_events')
      .insert({
        video_id: videoRecord.id,
        model_version: predictionResult.modelUsed === 'hybrid' ? 'hybrid_v1.0' : 'xgb_v1.0',
        feature_snapshot: {
          top_features: predictionResult.topFeatures.slice(0, 10)
        },
        predicted_dps: predictionResult.predicted_dps,
        predicted_dps_low: predictionResult.predictionInterval?.lower || (predictionResult.predicted_dps - 15),
        predicted_dps_high: predictionResult.predictionInterval?.upper || (predictionResult.predicted_dps + 15),
        confidence: predictionResult.confidence,
        explanation: predictionResult.qualitativeAnalysis?.reasoning ||
                    `Predicted ${predictionResult.predicted_dps.toFixed(1)} DPS based on ${predictionResult.featureCount} features`,
        prediction_hash: predictionResult.predictionHash,
        blockchain_tx_hash: null,  // Phase 1: Enable blockchain
        blockchain_block_number: null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (predictionError || !predictionEvent) {
      return NextResponse.json(
        { success: false, error: `Failed to save prediction: ${predictionError?.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Frozen prediction: ${predictionEvent.id}`);

    // Step 5: Return frozen prediction
    return NextResponse.json({
      success: true,
      video_id: videoRecord.id,
      prediction_id: predictionEvent.id,
      predicted_dps: predictionEvent.predicted_dps,
      predicted_range: [predictionEvent.predicted_dps_low, predictionEvent.predicted_dps_high],
      confidence: predictionEvent.confidence,
      explanation: predictionEvent.explanation,
      prediction_hash: predictionEvent.prediction_hash,
      blockchain_receipt: {
        tx_hash: null,  // Phase 1
        block_number: null,
        timestamp: predictionEvent.created_at
      },
      frozen_at: predictionEvent.created_at,
      processing_time_ms: predictionResult.processingTimeMs,
      llm_cost_usd: predictionResult.llmCostUsd
    });

  } catch (error: any) {
    console.error('❌ Admin predict error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

**Verification**:
```bash
# Test API with curl
curl -X POST http://localhost:3000/api/admin/predict \
  -F "videoFile=@data/raw_videos/test.mp4" \
  -F "niche=fitness" \
  -F "goal=grow followers" \
  -F "accountSize=small (0-10K)"

# Should return:
# {
#   "success": true,
#   "video_id": "uuid",
#   "prediction_id": "uuid",
#   "predicted_dps": 67.5,
#   "predicted_range": [52.5, 82.5],
#   "prediction_hash": "a3f8d9c2e1b4..."
# }
```

---

### Task 5.2: Create Admin Fetch Metrics API (2 hours)

**File to Create**: `src/app/api/admin/fetch-metrics/route.ts`

**Code**:
```typescript
/**
 * Admin Lab: Fetch Metrics API
 *
 * POST /api/admin/fetch-metrics
 *
 * Manually enter engagement metrics for a prediction (Phase 0: manual only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use scraper connection (can write to prediction_actuals)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SCRAPER_DB_PASSWORD!,  // Scraper role (can write metrics)
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prediction_id,
      snapshot_type,
      views,
      likes,
      comments,
      shares,
      bookmarks
    } = body;

    // Validate input
    if (!prediction_id || !snapshot_type) {
      return NextResponse.json(
        { success: false, error: 'prediction_id and snapshot_type are required' },
        { status: 400 }
      );
    }

    const validSnapshots = ['1h', '4h', '8h', '24h', '7d', 'lifetime'];
    if (!validSnapshots.includes(snapshot_type)) {
      return NextResponse.json(
        { success: false, error: `Invalid snapshot_type. Must be one of: ${validSnapshots.join(', ')}` },
        { status: 400 }
      );
    }

    // Get prediction details for accuracy calculation
    const { data: prediction, error: predError } = await supabase
      .from('prediction_events')
      .select('*')
      .eq('id', prediction_id)
      .single();

    if (predError || !prediction) {
      return NextResponse.json(
        { success: false, error: `Prediction not found: ${prediction_id}` },
        { status: 404 }
      );
    }

    // Calculate actual DPS from metrics
    // Formula: DPS = (likes/views * 30) + (comments/views * 20) + (shares/views * 25) + (bookmarks/views * 25)
    const actualDps = calculateDPS(views, likes, comments, shares, bookmarks);

    // Insert metrics into prediction_actuals
    const { data: actual, error: insertError } = await supabase
      .from('prediction_actuals')
      .insert({
        prediction_id,
        snapshot_type,
        views: views || null,
        likes: likes || null,
        comments: comments || null,
        shares: shares || null,
        bookmarks: bookmarks || null,
        actual_dps: actualDps,
        fetched_at: new Date().toISOString(),
        source: 'manual'
      })
      .select()
      .single();

    if (insertError || !actual) {
      return NextResponse.json(
        { success: false, error: `Failed to save metrics: ${insertError?.message}` },
        { status: 500 }
      );
    }

    // Calculate accuracy
    const predictedDps = Number(prediction.predicted_dps);
    const predictionError = predictedDps - actualDps;
    const withinRange = actualDps >= Number(prediction.predicted_dps_low) &&
                       actualDps <= Number(prediction.predicted_dps_high);

    console.log(`✅ Metrics saved for ${snapshot_type}`);
    console.log(`   Predicted: ${predictedDps.toFixed(1)} DPS`);
    console.log(`   Actual: ${actualDps.toFixed(1)} DPS`);
    console.log(`   Error: ${predictionError.toFixed(1)} DPS`);
    console.log(`   Within Range: ${withinRange ? 'YES' : 'NO'}`);

    return NextResponse.json({
      success: true,
      metrics: {
        views: actual.views,
        likes: actual.likes,
        comments: actual.comments,
        shares: actual.shares,
        bookmarks: actual.bookmarks
      },
      actual_dps: actualDps,
      predicted_dps: predictedDps,
      prediction_error: predictionError,
      within_range: withinRange,
      fetched_at: actual.fetched_at
    });

  } catch (error: any) {
    console.error('❌ Fetch metrics error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper function: Calculate DPS from engagement metrics
function calculateDPS(
  views: number,
  likes: number,
  comments: number,
  shares: number,
  bookmarks: number
): number {
  if (views === 0) return 0;

  const likesRate = (likes / views) * 30;
  const commentsRate = (comments / views) * 20;
  const sharesRate = (shares / views) * 25;
  const bookmarksRate = (bookmarks / views) * 25;

  const dps = likesRate + commentsRate + sharesRate + bookmarksRate;

  return Math.max(0, Math.min(100, dps));  // Clamp to 0-100
}
```

**Verification**:
```bash
# Test API with manual metrics
curl -X POST http://localhost:3000/api/admin/fetch-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "prediction_id": "uuid-from-previous-test",
    "snapshot_type": "24h",
    "views": 125000,
    "likes": 8500,
    "comments": 342,
    "shares": 1200,
    "bookmarks": 890
  }'

# Should return:
# {
#   "success": true,
#   "actual_dps": 58.2,
#   "prediction_error": 9.3,
#   "within_range": true
# }
```

---

### Task 5.3: Create Basic Admin Form (2 hours)

**File to Create**: `src/app/admin/prediction-lab/page.tsx`

**Code** (simplified for Phase 0):
```typescript
'use client';

import { useState } from 'react';

export default function AdminPredictionLabPage() {
  const [uploading, setUploading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/admin/predict', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setPredictionResult(result);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Admin Prediction Lab (Phase 0)</h1>
      <p>Upload MP4 → Get Frozen Prediction → Enter Metrics Later</p>

      <form onSubmit={handleUpload} style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Video File (MP4):
            <input type="file" name="videoFile" accept="video/mp4" required />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Niche:
            <input type="text" name="niche" placeholder="e.g., fitness, comedy" required />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Goal:
            <input type="text" name="goal" placeholder="e.g., grow followers" required />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Account Size:
            <select name="accountSize" required>
              <option value="">Select...</option>
              <option value="small (0-10K)">Small (0-10K)</option>
              <option value="medium (10K-100K)">Medium (10K-100K)</option>
              <option value="large (100K-1M)">Large (100K-1M)</option>
              <option value="mega (1M+)">Mega (1M+)</option>
            </select>
          </label>
        </div>

        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload & Predict'}
        </button>
      </form>

      {predictionResult && (
        <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '20px' }}>
          <h2>Prediction Result</h2>
          {predictionResult.success ? (
            <>
              <p><strong>Video ID:</strong> {predictionResult.video_id}</p>
              <p><strong>Prediction ID:</strong> {predictionResult.prediction_id}</p>
              <p><strong>Predicted DPS:</strong> {predictionResult.predicted_dps}</p>
              <p><strong>Predicted Range:</strong> [{predictionResult.predicted_range.join(', ')}]</p>
              <p><strong>Confidence:</strong> {(predictionResult.confidence * 100).toFixed(0)}%</p>
              <p><strong>Hash:</strong> {predictionResult.prediction_hash.substring(0, 32)}...</p>
              <p><strong>Frozen At:</strong> {new Date(predictionResult.frozen_at).toLocaleString()}</p>

              <hr />

              <h3>Enter Metrics Later</h3>
              <p>Wait for video to post, then come back and enter metrics.</p>
              <a href={`/admin/prediction-lab/metrics?prediction_id=${predictionResult.prediction_id}`}>
                Enter Metrics →
              </a>
            </>
          ) : (
            <p style={{ color: 'red' }}>Error: {predictionResult.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

**Verification**:
```bash
# Visit page
http://localhost:3000/admin/prediction-lab

# Upload test video
# Should see prediction result with hash
```

**End of Day 5-6 Deliverables**:
- ✅ Admin predict API working (MP4 upload → frozen prediction)
- ✅ Admin fetch metrics API working (manual metrics entry)
- ✅ Basic admin form (functional, not polished)

---

## Day 7: Basic Accuracy Calculations

### Task 7.1: Create Accuracy Calculation Service (2 hours)

**File to Create**: `src/lib/services/accuracy-calculator.ts`

**Code**:
```typescript
/**
 * Accuracy Calculator Service
 *
 * Calculates prediction accuracy metrics (MAE, R², within range %)
 */

export interface AccuracyMetrics {
  total_predictions: number;
  validated_predictions: number;

  // Core metrics
  mae: number;  // Mean Absolute Error (lower is better)
  r2_score: number;  // R-squared (0-1, higher is better)
  within_range_pct: number;  // % predictions within range

  // Derived metrics
  avg_confidence: number;
  avg_error: number;  // Can be negative (over/under prediction)

  // Breakdown by snapshot type
  by_snapshot?: Record<string, AccuracyMetrics>;

  // Breakdown by niche
  by_niche?: Record<string, AccuracyMetrics>;
}

export interface PredictionValidation {
  predicted_dps: number;
  actual_dps: number;
  confidence: number;
  within_range: boolean;
  error: number;
  snapshot_type: string;
  niche?: string;
}

/**
 * Calculate MAE (Mean Absolute Error)
 */
export function calculateMAE(validations: PredictionValidation[]): number {
  if (validations.length === 0) return 0;

  const totalAbsError = validations.reduce((sum, v) => sum + Math.abs(v.error), 0);
  return totalAbsError / validations.length;
}

/**
 * Calculate R² Score (goodness of fit)
 */
export function calculateR2Score(validations: PredictionValidation[]): number {
  if (validations.length === 0) return 0;

  const actualValues = validations.map(v => v.actual_dps);
  const predictedValues = validations.map(v => v.predicted_dps);

  const meanActual = actualValues.reduce((sum, v) => sum + v, 0) / actualValues.length;

  // SS_tot: Total sum of squares
  const ssTot = actualValues.reduce((sum, actual) => sum + Math.pow(actual - meanActual, 2), 0);

  // SS_res: Residual sum of squares
  const ssRes = validations.reduce((sum, v) => sum + Math.pow(v.actual_dps - v.predicted_dps, 2), 0);

  if (ssTot === 0) return 0;

  return 1 - (ssRes / ssTot);
}

/**
 * Calculate overall accuracy metrics
 */
export function calculateAccuracyMetrics(
  validations: PredictionValidation[]
): AccuracyMetrics {
  const totalPredictions = validations.length;

  if (totalPredictions === 0) {
    return {
      total_predictions: 0,
      validated_predictions: 0,
      mae: 0,
      r2_score: 0,
      within_range_pct: 0,
      avg_confidence: 0,
      avg_error: 0
    };
  }

  const mae = calculateMAE(validations);
  const r2Score = calculateR2Score(validations);
  const withinRangeCount = validations.filter(v => v.within_range).length;
  const withinRangePct = (withinRangeCount / totalPredictions) * 100;

  const avgConfidence = validations.reduce((sum, v) => sum + v.confidence, 0) / totalPredictions;
  const avgError = validations.reduce((sum, v) => sum + v.error, 0) / totalPredictions;

  return {
    total_predictions: totalPredictions,
    validated_predictions: totalPredictions,
    mae,
    r2_score: r2Score,
    within_range_pct: withinRangePct,
    avg_confidence: avgConfidence,
    avg_error: avgError
  };
}

/**
 * Calculate accuracy breakdown by snapshot type
 */
export function calculateBySnapshot(
  validations: PredictionValidation[]
): Record<string, AccuracyMetrics> {
  const bySnapshot: Record<string, PredictionValidation[]> = {};

  validations.forEach(v => {
    if (!bySnapshot[v.snapshot_type]) {
      bySnapshot[v.snapshot_type] = [];
    }
    bySnapshot[v.snapshot_type].push(v);
  });

  const result: Record<string, AccuracyMetrics> = {};

  Object.keys(bySnapshot).forEach(snapshotType => {
    result[snapshotType] = calculateAccuracyMetrics(bySnapshot[snapshotType]);
  });

  return result;
}

/**
 * Calculate accuracy breakdown by niche
 */
export function calculateByNiche(
  validations: PredictionValidation[]
): Record<string, AccuracyMetrics> {
  const byNiche: Record<string, PredictionValidation[]> = {};

  validations.forEach(v => {
    const niche = v.niche || 'unknown';
    if (!byNiche[niche]) {
      byNiche[niche] = [];
    }
    byNiche[niche].push(v);
  });

  const result: Record<string, AccuracyMetrics> = {};

  Object.keys(byNiche).forEach(niche => {
    result[niche] = calculateAccuracyMetrics(byNiche[niche]);
  });

  return result;
}

export const AccuracyCalculator = {
  calculateMAE,
  calculateR2Score,
  calculateAccuracyMetrics,
  calculateBySnapshot,
  calculateByNiche
};

export default AccuracyCalculator;
```

---

### Task 7.2: Create Accuracy Dashboard API (1 hour)

**File to Create**: `src/app/api/admin/accuracy-dashboard/route.ts`

**Code**:
```typescript
/**
 * Admin Lab: Accuracy Dashboard API
 *
 * GET /api/admin/accuracy-dashboard
 *
 * Returns overall accuracy metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AccuracyCalculator, PredictionValidation } from '@/lib/services/accuracy-calculator';

// Use admin connection (read-only for this endpoint)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.ADMIN_DB_PASSWORD!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

export async function GET(request: NextRequest) {
  try {
    // Fetch all predictions with actuals
    const { data: predictions, error: predError } = await supabase
      .from('prediction_events')
      .select(`
        *,
        video:video_files(niche),
        actuals:prediction_actuals(*)
      `);

    if (predError) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch predictions: ${predError.message}` },
        { status: 500 }
      );
    }

    // Filter predictions that have actuals
    const validatedPredictions = predictions.filter(p => p.actuals && p.actuals.length > 0);

    // Transform to validation format
    const validations: PredictionValidation[] = [];

    validatedPredictions.forEach(pred => {
      pred.actuals.forEach((actual: any) => {
        validations.push({
          predicted_dps: Number(pred.predicted_dps),
          actual_dps: Number(actual.actual_dps),
          confidence: Number(pred.confidence),
          within_range: actual.actual_dps >= Number(pred.predicted_dps_low) &&
                       actual.actual_dps <= Number(pred.predicted_dps_high),
          error: Number(pred.predicted_dps) - Number(actual.actual_dps),
          snapshot_type: actual.snapshot_type,
          niche: pred.video?.niche
        });
      });
    });

    // Calculate overall accuracy
    const overallMetrics = AccuracyCalculator.calculateAccuracyMetrics(validations);
    const bySnapshot = AccuracyCalculator.calculateBySnapshot(validations);
    const byNiche = AccuracyCalculator.calculateByNiche(validations);

    // Calculate Algorithm IQ (Phase 1, but stub for now)
    const algorithmIQ = calculateAlgorithmIQ(overallMetrics);

    return NextResponse.json({
      success: true,
      total_predictions: predictions.length,
      validated_predictions: validatedPredictions.length,
      accuracy_metrics: {
        mae: Number(overallMetrics.mae.toFixed(2)),
        r2_score: Number(overallMetrics.r2_score.toFixed(4)),
        within_range_pct: Number(overallMetrics.within_range_pct.toFixed(2)),
        avg_confidence: Number(overallMetrics.avg_confidence.toFixed(4)),
        avg_error: Number(overallMetrics.avg_error.toFixed(2)),
        algorithm_iq: Number(algorithmIQ.toFixed(1))
      },
      by_snapshot: Object.keys(bySnapshot).reduce((acc, key) => {
        acc[key] = {
          mae: Number(bySnapshot[key].mae.toFixed(2)),
          r2_score: Number(bySnapshot[key].r2_score.toFixed(4)),
          within_range_pct: Number(bySnapshot[key].within_range_pct.toFixed(2)),
          algorithm_iq: Number(calculateAlgorithmIQ(bySnapshot[key]).toFixed(1))
        };
        return acc;
      }, {} as Record<string, any>),
      by_niche: Object.keys(byNiche).reduce((acc, key) => {
        acc[key] = {
          mae: Number(byNiche[key].mae.toFixed(2)),
          r2_score: Number(byNiche[key].r2_score.toFixed(4)),
          within_range_pct: Number(byNiche[key].within_range_pct.toFixed(2)),
          algorithm_iq: Number(calculateAlgorithmIQ(byNiche[key]).toFixed(1))
        };
        return acc;
      }, {} as Record<string, any>)
    });

  } catch (error: any) {
    console.error('❌ Accuracy dashboard error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper function: Calculate Algorithm IQ Score
function calculateAlgorithmIQ(metrics: any): number {
  const mae = metrics.mae || 0;
  const r2 = metrics.r2_score || 0;
  const withinRangePct = metrics.within_range_pct || 0;

  // Formula: 100 - (MAE × 2) + (R² × 50) + (within_range_pct × 0.5)
  const iq = 100 - (mae * 2) + (r2 * 50) + (withinRangePct * 0.5);

  return Math.max(0, Math.min(100, iq));  // Clamp to 0-100
}
```

**Verification**:
```bash
# Test accuracy dashboard
curl http://localhost:3000/api/admin/accuracy-dashboard

# Should return:
# {
#   "success": true,
#   "total_predictions": 10,
#   "validated_predictions": 5,
#   "accuracy_metrics": {
#     "mae": 12.3,
#     "r2_score": 0.78,
#     "within_range_pct": 80.0,
#     "algorithm_iq": 84.2
#   },
#   "by_snapshot": {...}
# }
```

**End of Day 7 Deliverables**:
- ✅ Accuracy calculation service (MAE, R², within range %)
- ✅ Accuracy dashboard API (overall + by snapshot + by niche)
- ✅ Algorithm IQ score calculation

---

## Day 8-10: Manual Testing

### Task 8.1: Create Test Videos Dataset (2 hours)

**Goal**: Collect 10-20 test videos for validation

**Sources**:
1. Existing videos in `data/raw_videos` (2,667 available)
2. New videos from TikTok (manually download MP4s)

**Selection Criteria**:
- Mix of niches (fitness, comedy, education, etc.)
- Mix of account sizes (small, medium, large)
- Mix of performance (viral, good, normal)

**Script to Create** (`scripts/prepare-test-dataset.ts`):
```typescript
/**
 * Prepare test dataset for Admin Lab validation
 *
 * Selects 20 diverse videos from existing data
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function prepareTestDataset() {
  // Fetch diverse videos from scraped_videos
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('*')
    .not('transcript_text', 'is', null)
    .order('dps_score', { ascending: false })
    .limit(100);

  if (error || !videos) {
    console.error('❌ Failed to fetch videos:', error);
    return;
  }

  // Select diverse subset (10 viral, 5 good, 5 normal)
  const viral = videos.filter(v => v.dps_score >= 70).slice(0, 10);
  const good = videos.filter(v => v.dps_score >= 50 && v.dps_score < 70).slice(0, 5);
  const normal = videos.filter(v => v.dps_score < 50).slice(0, 5);

  const testDataset = [...viral, ...good, ...normal];

  console.log(`✅ Selected ${testDataset.length} test videos:`);
  console.log(`   - Viral (DPS 70+): ${viral.length}`);
  console.log(`   - Good (DPS 50-70): ${good.length}`);
  console.log(`   - Normal (DPS <50): ${normal.length}`);

  // Export to JSON
  fs.writeFileSync(
    'data/admin-lab-test-dataset.json',
    JSON.stringify(testDataset, null, 2)
  );

  console.log(`✅ Saved to data/admin-lab-test-dataset.json`);
}

prepareTestDataset();
```

---

### Task 8.2: Manual Testing Workflow (6-8 hours)

**Workflow**:
1. Upload video → Get prediction
2. Wait 24 hours
3. Manually fetch metrics from TikTok
4. Enter metrics → See accuracy
5. Repeat for all 20 videos

**Test Checklist**:
- [ ] Test 1: Small account fitness video → Prediction frozen → Metrics entered
- [ ] Test 2: Medium account comedy video → Prediction frozen → Metrics entered
- [ ] Test 3-20: Repeat for diverse videos
- [ ] Verify: Predictor cannot access prediction_actuals table
- [ ] Verify: Hash matches prediction payload
- [ ] Verify: Accuracy calculations correct (MAE, R², within range %)

**Expected Results**:
- 20 predictions frozen
- 20 metrics entries (manual)
- MAE calculation working
- Within range % calculation working
- No contamination (predictor never accessed actuals)

---

## Success Criteria (Phase 0 Complete)

### Technical Deliverables ✅
- [x] Three tables created (video_files, prediction_events, prediction_actuals)
- [x] PostgreSQL roles enforcing anti-contamination
- [x] Predictor adapted to work WITHOUT metrics
- [x] Prediction hash generation (SHA-256)
- [x] Admin predict API (MP4 upload)
- [x] Admin fetch metrics API (manual entry)
- [x] Accuracy calculation service (MAE, R², within range %)
- [x] Basic admin form (functional)

### Validation Criteria ✅
- [ ] 10+ predictions frozen with SHA-256 hash
- [ ] Manual metrics entry works
- [ ] Accuracy calculations correct
- [ ] Predictor verified CANNOT access prediction_actuals table
- [ ] Hash verification working

### Phase 1 Ready ✅
- [ ] Apify scraper integration path clear
- [ ] Blockchain integration path clear (env vars)
- [ ] Algorithm IQ formula tested
- [ ] Exported training data format defined

---

## Technical Debt (Acceptable for Phase 0)

1. **UI**: Raw HTML forms (not polished)
2. **Automation**: Manual metrics entry only (no Apify)
3. **Blockchain**: SHA-256 hash only (no external blockchain)
4. **TikTok URLs**: MP4 upload only (no URL scraping)
5. **Whisper**: May need to integrate transcript extraction from MP4s
6. **Error Handling**: Basic try-catch (not production-grade)

---

## Next Steps After Phase 0

**Phase 1 Week 1**: Apify scraper integration (automated metrics fetching)
**Phase 1 Week 2**: Blockchain integration (optional receipts via env vars)
**Phase 1 Week 3**: Algorithm IQ time-series tracking
**Phase 1 Week 4**: Test against 100-200 videos, measure accuracy

---

**END OF PHASE 0 IMPLEMENTATION PLAN**
