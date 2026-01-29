# Admin Prediction Lab - Product Requirements Document (PRD v1.0)

**Last Updated**: 2025-11-15
**Status**: Approved for Implementation
**Owner**: Tommy (Product), Claude (Technical Implementation)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vision & Goals](#vision--goals)
3. [Architecture Decisions](#architecture-decisions)
4. [Technical Specifications](#technical-specifications)
5. [Implementation Phases](#implementation-phases)
6. [Success Metrics](#success-metrics)
7. [Open Questions & Risks](#open-questions--risks)

---

## Executive Summary

The Admin Prediction Lab is an **admin-only testing environment** designed to validate the accuracy of viral video predictions BEFORE building user-facing features. The system makes predictions on videos WITHOUT accessing their engagement metrics, cryptographically freezes those predictions, then later fetches actual results to measure accuracy.

**Core Innovation**: Three-table architecture that guarantees the predictor cannot "cheat" by seeing metrics before making predictions.

**Key Deliverable**: Verifiable proof that predictions are made BEFORE outcomes are known, enabling honest accuracy measurement and credible marketing claims.

---

## Vision & Goals

### Primary Goal
Build proof that our viral prediction system works with measurable accuracy (target: 75-90% within predicted range) BEFORE investing in user-facing workflows.

### Secondary Goals
1. **Anti-Contamination Guarantee**: Predictor service physically cannot access metrics until after prediction frozen
2. **Verifiable Proof**: Blockchain receipts (or SHA-256 hashes) prove predictions made before results known
3. **Learning System**: Export training data from prediction errors to improve XGBoost model
4. **Marketing Ammunition**: "Verified 80% accuracy within 15 DPS points" becomes defensible claim

### Non-Goals (Out of Scope for Phase 0-1)
- User-facing UI (admin-only for now)
- Real-time predictions at scale
- Mobile app or Progressive Web App
- Image generation for thumbnails
- Video generation for previews
- Multi-user collaboration

---

## Architecture Decisions

### Decision 1: Three-Table Separation

**Approved Architecture**:
```
video_files (input)
    ↓ (predictor reads from here)
prediction_events (frozen predictions)
    ↓ (scraper writes here LATER)
prediction_actuals (actual metrics)
```

**Enforcement Mechanism**: **Option A - Database Permissions** ✅
- Create two separate Supabase service keys:
  - `PREDICTOR_SERVICE_KEY`: Read `video_files`, Write `prediction_events`, **CANNOT** access `prediction_actuals`
  - `SCRAPER_SERVICE_KEY`: Read/Write `prediction_actuals`
- Database-level enforcement (foolproof, no way to accidentally contaminate)

**Rationale**: Simplest to implement, impossible to bypass, no need to learn RLS syntax.

---

### Decision 2: Hash Scope

**Approved Format**: **Option 2 - Complete (WITHOUT 119 feature values)** ✅

**What Gets Hashed** (SHA-256):
```json
{
  "video_id": "abc123",
  "predicted_dps": 67.5,
  "predicted_range": [45, 82],
  "confidence": 0.73,
  "model_version": "xgb_v1.0",
  "top_features": [
    {"name": "hook_strength", "importance": 0.15, "value": 8.2},
    {"name": "pacing_score", "importance": 0.12, "value": 3.1},
    // ... top 10 features only
  ],
  "explanation": "High hook strength (8.2) and trending audio detected...",
  "timestamp_utc": "2025-11-14T12:34:56.789Z"
}
```

**What Does NOT Get Hashed**:
- All 119 feature values (too verbose, not needed for verification)
- Internal processing metadata
- User IP addresses or session data

**Rationale**: Balances proof (can verify prediction was made) with learning (can debug why prediction was wrong).

---

### Decision 3: Blockchain Receipts

**Approved**: **YES - Using Existing Code** ✅

**Implementation**: Reuse existing blockchain timestamp service from FEAT-002
- **File**: `src/lib/services/dps/blockchain-timestamp.ts` (lines 75-138)
- **Function**: `timestampPrediction(calculation)`
- **Returns**: `{ txHash, blockNumber, timestamp, calculationHash }`

**Phase 0 Approach**: SHA-256 hash only (no external blockchain)
- Faster to implement (0 hours vs 1-2 days)
- Sufficient for internal testing
- Can enable blockchain in Phase 1 via env vars

**Phase 1+ Approach**: Enable blockchain via:
```bash
BLOCKCHAIN_TIMESTAMP_ENABLED=true
BLOCKCHAIN_API_ENDPOINT=https://your-blockchain-service.com
BLOCKCHAIN_API_KEY=your-api-key
```

**Blockchain Service Options** (TBD):
- **OpenTimestamps** (Bitcoin): Free, ~30min confirmations
- **Polygon PoS**: $0.001/tx, 2sec confirmations
- **Ethereum**: Expensive ($5-50/tx), not recommended

---

## Technical Specifications

### Database Schema

#### Table 1: `video_files`
```sql
CREATE TABLE video_files (
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

CREATE INDEX idx_video_files_created_at ON video_files(created_at DESC);
CREATE INDEX idx_video_files_niche ON video_files(niche);
```

#### Table 2: `prediction_events`
```sql
CREATE TABLE prediction_events (
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

  -- Verification
  prediction_hash TEXT NOT NULL,  -- SHA-256 of prediction payload
  blockchain_tx_hash TEXT,  -- Optional blockchain transaction hash
  blockchain_block_number INTEGER,  -- Optional block number

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prediction_events_video_id ON prediction_events(video_id);
CREATE INDEX idx_prediction_events_created_at ON prediction_events(created_at DESC);
CREATE INDEX idx_prediction_events_hash ON prediction_events(prediction_hash);
CREATE UNIQUE INDEX idx_prediction_events_video_latest ON prediction_events(video_id, created_at DESC);
```

#### Table 3: `prediction_actuals`
```sql
CREATE TABLE prediction_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES prediction_events(id) ON DELETE CASCADE,

  -- Snapshot type
  snapshot_type VARCHAR(20) NOT NULL CHECK (snapshot_type IN ('1h', '4h', '8h', '24h', '7d', 'lifetime')),

  -- Engagement metrics (all from Apify scraper)
  views BIGINT,
  likes BIGINT,
  comments BIGINT,
  shares BIGINT,
  bookmarks BIGINT,  -- collectCount from Apify

  -- Metadata
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL CHECK (source IN ('apify', 'manual')),  -- How metrics were obtained

  UNIQUE(prediction_id, snapshot_type)  -- One snapshot per type per prediction
);

CREATE INDEX idx_prediction_actuals_prediction_id ON prediction_actuals(prediction_id);
CREATE INDEX idx_prediction_actuals_snapshot_type ON prediction_actuals(snapshot_type);
CREATE INDEX idx_prediction_actuals_fetched_at ON prediction_actuals(fetched_at DESC);
```

---

### API Endpoints

#### POST `/api/admin/predict`
Upload video and get frozen prediction.

**Request**:
```typescript
{
  videoFile?: File,  // MP4 upload
  tiktokUrl?: string,  // OR TikTok URL
  niche: string,
  goal: string,
  accountSize: string
}
```

**Response**:
```typescript
{
  success: true,
  video_id: "uuid",
  prediction_id: "uuid",
  predicted_dps: 67.5,
  predicted_range: [45, 82],
  confidence: 0.73,
  explanation: "High hook strength (8.2)...",
  prediction_hash: "sha256-hash",
  blockchain_receipt: {
    tx_hash: "0x1234...abcd",  // Optional in Phase 0
    block_number: 12345,
    timestamp: "2025-11-14T12:34:56Z"
  },
  frozen_at: "2025-11-14T12:34:56Z"
}
```

#### POST `/api/admin/fetch-metrics`
Manually trigger metrics fetch for a video (admin-only).

**Request**:
```typescript
{
  prediction_id: "uuid",
  snapshot_type: "1h" | "4h" | "8h" | "24h" | "7d" | "lifetime"
}
```

**Response**:
```typescript
{
  success: true,
  metrics: {
    views: 125000,
    likes: 8500,
    comments: 342,
    shares: 1200,
    bookmarks: 890
  },
  actual_dps: 58.2,
  prediction_error: -9.3,  // predicted_dps - actual_dps
  within_range: true,  // Is actual_dps within [predicted_low, predicted_high]?
  fetched_at: "2025-11-14T16:34:56Z"
}
```

#### GET `/api/admin/accuracy-dashboard`
Get overall accuracy metrics.

**Response**:
```typescript
{
  total_predictions: 127,
  validated_predictions: 89,
  accuracy_metrics: {
    mae: 12.3,  // Mean Absolute Error (lower is better)
    r2_score: 0.78,  // R-squared goodness of fit (0-1, higher is better)
    classification_accuracy: 0.82,  // % correct viral/not-viral predictions
    within_range_pct: 78.7,  // % of predictions where actual fell within predicted range
    avg_confidence: 0.71,
    algorithm_iq: 84.2  // Composite score (0-100, higher is better)
  },
  by_niche: {
    "fitness": { mae: 10.2, r2_score: 0.81, algorithm_iq: 87.3, within_range_pct: 82.1 },
    "comedy": { mae: 15.8, r2_score: 0.72, algorithm_iq: 79.1, within_range_pct: 71.3 }
  },
  by_snapshot: {
    "1h": { mae: 18.5, r2_score: 0.65, algorithm_iq: 71.8, within_range_pct: 65.2 },
    "24h": { mae: 11.1, r2_score: 0.83, algorithm_iq: 88.4, within_range_pct: 81.4 }
  },
  iq_history: [
    { date: "2025-11-10", algorithm_iq: 72.5, predictions_validated: 25 },
    { date: "2025-11-12", algorithm_iq: 78.1, predictions_validated: 50 },
    { date: "2025-11-14", algorithm_iq: 84.2, predictions_validated: 89 }
  ]
}
```

---

## Implementation Phases

### Phase 0: Prototype (7-10 Days)

**Goal**: Bare-bones working system for internal testing

**Checklist**:
- [x] ~~Decision: Enforcement mechanism~~ → PostgreSQL Roles (GRANT/REVOKE)
- [x] ~~Decision: Hash scope~~ → Complete without 119 features
- [x] ~~Decision: Blockchain~~ → SHA-256 only for Phase 0
- [x] ~~Research: Verify Apify returns all 5 metrics~~ → ✅ Confirmed
- [x] ~~Research: Verify predictor works~~ → ✅ Works (needs minor fixes)
- [ ] Day 1-2: Create database tables (video_files, prediction_events, prediction_actuals)
- [ ] Day 1-2: Create PostgreSQL roles (predictor_role, scraper_role)
- [ ] Day 3: Fix hybrid-predictor.ts return value bug
- [ ] Day 3-4: Adapt hybrid-predictor.ts to work WITHOUT metrics input
- [ ] Day 3-4: Implement prediction hash generation (SHA-256)
- [ ] Day 5-6: Build basic admin form (MP4 upload, manual metrics entry)
- [ ] Day 7: Basic accuracy calculations (MAE, % within range)
- [ ] Day 7-10: Manual testing with 10-20 videos

**Deliverable**: Admin can upload MP4 → get frozen prediction → manually enter metrics → see accuracy

**Technical Debt Accepted**:
- No polished UI (raw HTML forms acceptable)
- No automated scraping (manual metrics entry only)
- No blockchain receipts (SHA-256 hash only)
- No TikTok URL support (MP4 upload only)

---

### Phase 1: Full Admin Lab (2-4 Weeks)

**Goal**: Automated, production-ready admin testing environment

**Checklist**:
- [ ] Week 1: Apify scraper integration (fetch metrics automatically)
- [ ] Week 1: Time-sliced metrics (1h, 4h, 8h, 24h, 7d snapshots)
- [ ] Week 2: Blockchain integration (enable via env vars)
- [ ] Week 2: TikTok URL support (in addition to MP4 upload)
- [ ] Week 3: Algorithm IQ Score implementation (composite metric from MAE, R2, accuracy)
- [ ] Week 3: Polished admin UI (accuracy dashboard with IQ time-series chart, prediction diff view)
- [ ] Week 3: Export training data feature (JSON export for XGBoost retraining)
- [ ] Week 4: Test against 100-200 videos, measure accuracy, iterate model

**Deliverable**: Fully automated admin lab with verified accuracy metrics

**Success Criteria**:
- 100+ predictions validated
- Accuracy measured: MAE < 15, % within range > 75%
- Exportable training data for model improvement

---

### Phase 2: Integration with 12-Week MVP (Future)

**Goal**: Use proven predictor in user-facing workflows

**Integration Points**:
- User uploads video → calls same `hybrid-predictor.ts` used in Admin Lab
- User sees same prediction format (DPS, range, confidence, explanation)
- Reuse blockchain receipt system for user-facing predictions
- Feed user-reported outcomes back into training data

**Timeline**: Begins after Phase 1 complete (~6-8 weeks from now)

---

## Success Metrics

### Phase 0 Success Criteria
- ✅ Predictor cannot access prediction_actuals table (verified via DB permissions)
- ✅ 10+ predictions frozen with SHA-256 hash
- ✅ Manual metrics entry works
- ✅ Basic accuracy calculation (MAE, % within range)

### Phase 1 Success Criteria
- ✅ 100+ predictions validated automatically
- ✅ MAE < 15 DPS points (Mean Absolute Error)
- ✅ R² Score > 0.70 (goodness of fit)
- ✅ 75%+ predictions fall within predicted range
- ✅ Algorithm IQ Score > 75/100
- ✅ IQ trending upward over time (proof algorithm is learning)
- ✅ Blockchain receipts working (if enabled)
- ✅ Exportable training data in JSON format

### Long-Term Success Criteria (6+ Months)
- ✅ 1000+ validated predictions
- ✅ MAE < 10 DPS points
- ✅ R² Score > 0.85
- ✅ 85%+ predictions within range
- ✅ Algorithm IQ Score > 90/100
- ✅ Model continuously improving via exported training data

---

## Open Questions & Risks

### Open Questions

#### ✅ Q1: Supabase Service Role Permissions - RESOLVED
**Question**: Can Supabase create a service role that has table-specific permissions (read from A, cannot read from B)?

**Answer**: ❌ NO - Service role keys bypass ALL RLS policies by design.

**Evidence**:
- Supabase Docs: "service_role uses BYPASSRLS attribute, skipping any and all Row Level Security policies"
- Current setup: One service_role key with full database access (.env.local:9)

**Solution**: Use PostgreSQL custom roles with GRANT/REVOKE:
```sql
CREATE ROLE predictor_role;
GRANT SELECT ON video_files TO predictor_role;
GRANT INSERT ON prediction_events TO predictor_role;
REVOKE ALL ON prediction_actuals FROM predictor_role;

CREATE ROLE scraper_role;
GRANT INSERT, UPDATE ON prediction_actuals TO scraper_role;
```

**Status**: RESOLVED - Implementation details in Phase 0 Day 1
**Researched**: 2025-11-15

---

#### Q2: Blockchain Service Selection
**Question**: Which blockchain service for receipts in Phase 1?

**Options**:
- OpenTimestamps (Bitcoin): Free, ~30min confirmations, simple integration
- Polygon PoS: $0.001/tx, 2sec confirmations, requires wallet setup
- Custom API: Build our own, full control, higher dev cost

**Action**: Test OpenTimestamps integration (2-hour spike)

**Owner**: Tommy (decision), Claude (implementation)
**Deadline**: Before Phase 1 Week 2

---

#### Q3: MP4 Storage Location
**Question**: Where to store uploaded MP4 files?

**Current State**: 2,667 videos in `data/raw_videos` (736MB local filesystem)

**Options**:
- Continue local filesystem - FREE, simple, already working
- Supabase Storage - $0.021/GB/month, integrated
- AWS S3 - $0.023/GB/month, cheaper at scale

**Recommendation**: Continue local filesystem for Phase 0, evaluate Supabase Storage in Phase 1

**Owner**: Tommy
**Deadline**: Day 1 of Phase 0

---

### Risks

#### Risk 1: Predictor Not Ready (HIGH - 60%)
**Scenario**: `hybrid-predictor.ts` doesn't work reliably or doesn't accept MP4 input

**Evidence**: File exists at `src/lib/ml/hybrid-predictor.ts` (lines 89-272), but currently designed for `videoId` or `transcript` input, not MP4 files

**Mitigation**:
- Before Phase 0 starts, manually test predictor on 5 videos
- If broken, Phase 0 becomes "Build + Test Predictor" (10-14 days instead of 7)

**Owner**: Claude
**Deadline**: Before Day 1 of Phase 0

---

#### Risk 2: Apify Scraper Metrics Incomplete (MEDIUM - 40%)
**Scenario**: Apify returns views + likes but not comments/shares/bookmarks

**Evidence**: Apify screenshot shows all 5 metrics (playCount, diggCount, commentCount, shareCount, collectCount). TypeScript types in `apifyScraper.ts:24-43` are incomplete but data is returned.

**Mitigation**:
- Update TypeScript interface to include all 5 metrics
- Test Apify scraper on 10 videos to verify all metrics returned

**Owner**: Claude
**Deadline**: Phase 1 Week 1

---

#### Risk 3: Timeline Pressure (MEDIUM - 50%)
**Scenario**: Unforeseen bugs, Supabase issues, blockchain integration complexity

**Mitigation**:
- Phase 0 range is "7-10 days" not "7 days" → built-in buffer
- Cut scope aggressively: If Day 5 with only 3/6 items done, drop blockchain and polished UI
- Ship "predict + freeze + manual entry + accuracy calc" even if ugly

**Owner**: Tommy (scope decisions), Claude (implementation)

---

## Appendices

### Appendix A: Algorithm IQ Score Calculation

**Purpose**: Single composite metric (0-100) tracking prediction system performance over time.

**Formula**:
```
Algorithm IQ = 100 - (MAE × 2) + (R² × 50) + (within_range_pct × 0.5)

Where:
- MAE = Mean Absolute Error (0-50, lower is better)
- R² = R-squared goodness of fit (0-1, higher is better)
- within_range_pct = % predictions within predicted range (0-100, higher is better)
```

**Example Calculation**:
```
Given:
  MAE = 12.3
  R² = 0.78
  within_range_pct = 78.7%

Algorithm IQ = 100 - (12.3 × 2) + (0.78 × 50) + (78.7 × 0.5)
             = 100 - 24.6 + 39.0 + 39.35
             = 153.75

Normalized to 0-100 scale:
Algorithm IQ = min(153.75, 100) = 100

// Typical scores:
// 90-100 = Excellent (production-ready)
// 75-89  = Good (needs refinement)
// 60-74  = Fair (significant improvement needed)
// <60    = Poor (not ready for users)
```

**Tracking Over Time**:
- Store IQ score with each validation run in `test_results` table
- Display time-series chart showing IQ improvement
- Alert if IQ decreases (regression in model performance)

**Integration**:
- Reuse existing `test_results` table (supabase/migrations/20251107_test_results_table.sql)
- Reuse existing accuracy tracking UI (src/app/admin/testing-accuracy/page.tsx)
- Add IQ calculation function in Phase 1 Week 3

---

### Appendix B: Existing Code to Reuse

1. **Hybrid Predictor**: `src/lib/ml/hybrid-predictor.ts` (lines 89-272)
2. **Blockchain Timestamp**: `src/lib/services/dps/blockchain-timestamp.ts` (lines 75-138)
3. **Apify Scraper**: `src/lib/services/apifyScraper.ts` (lines 67-181)
4. **XGBoost Model**: `models/xgboost-dps-model.json`
5. **Feature Extraction**: `src/lib/services/feature-extraction/`
6. **Accuracy Tracking**: `src/app/admin/testing-accuracy/page.tsx` (lines 1-100)
7. **Test Results Table**: `supabase/migrations/20251107_test_results_table.sql` (lines 1-62)

### Appendix C: Related Documents

- **Crystal-Clear Pathway**: 12-week MVP plan (from previous session)
- **20 Questions PDF**: User's answers defining product vision
- **FEAT-002**: DPS Calculation Engine (blockchain timestamp origin)
- **FEAT-070**: Predictions table schema (text scripts, not MP4s)

### Appendix D: Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-11-15 | Enforcement: PostgreSQL Roles (Option A revised) | Service role keys cannot be restricted; use GRANT/REVOKE instead |
| 2025-11-15 | Hash Scope: Complete without 119 features (Option 2) | Balances proof + learning |
| 2025-11-15 | Blockchain: SHA-256 only for Phase 0 | Faster to ship, can enable later |
| 2025-11-15 | Metrics: Accept all 5 from Apify | Screenshot confirmed all available |
| 2025-11-15 | Algorithm IQ Score: Add to Phase 1 Week 3 | Composite metric for tracking learning over time |
| 2025-11-15 | Image/Video Generation: Defer to 12-Week MVP | Not needed for accuracy testing, user-facing feature |
| 2025-11-15 | Frictionless 5-Package: Defer to 12-Week MVP | Out of scope for admin testing lab |

---

## Version History

- **v1.2** (2025-11-15): De-risking research complete
  - ✅ Confirmed: Apify returns all 5 metrics (views, likes, comments, shares, bookmarks)
  - ✅ Confirmed: Hybrid predictor works (19.3 DPS prediction in 12.6s)
  - ✅ Confirmed: Predictor contamination issue (reads metrics from DB) - validates Admin Lab necessity
  - ⚠️ Updated: Enforcement mechanism → PostgreSQL roles (service keys cannot be restricted)
  - 🐛 Identified: Predictor return value bug (minor, fixable in 1 hour)
  - Updated Phase 0 timeline with bug fixes
- **v1.1** (2025-11-15): Added Algorithm IQ Score to Phase 1 Week 3
  - New composite metric combining MAE, R², and within_range_pct
  - IQ time-series tracking to show algorithm improvement over time
  - Deferred Image/Video Generation and Frictionless 5-Package to 12-Week MVP
- **v1.0** (2025-11-15): Initial PRD with approved architecture decisions
- **v0.9** (2025-11-14): Draft PRD before architecture decisions finalized

---

**END OF DOCUMENT**
