# FEAT-002: DPS Calculation Engine - Deployment Checklist

## ✅ Implementation Status

### Core Components

- [x] **Database Migration** - `supabase/migrations/20251002_feat002_dps_calculation_engine.sql`
  - ✅ dps_calculations table
  - ✅ dps_cohort_stats table
  - ✅ dps_calculation_errors table
  - ✅ Helper functions (get_dps_cohort_stats, classify_virality)
  - ✅ Sample seed data for all platforms
  - ✅ RLS policies
  - ✅ Indexes

- [x] **DPS Calculation Engine** - `src/lib/services/dps/dps-calculation-engine.ts`
  - ✅ Z-score calculation
  - ✅ Time decay factor (exponential decay)
  - ✅ Engagement score (platform-weighted)
  - ✅ Master viral score calculation
  - ✅ Percentile rank conversion
  - ✅ Viral classification (4 tiers)
  - ✅ Confidence scoring
  - ✅ Input validation (Zod schemas)

- [x] **Database Service** - `src/lib/services/dps/dps-database-service.ts`
  - ✅ Save calculations
  - ✅ Retrieve cohort statistics
  - ✅ Log errors
  - ✅ Batch operations
  - ✅ History tracking
  - ✅ Monitoring statistics

- [x] **Calculation Service** - `src/lib/services/dps/dps-calculation-service.ts`
  - ✅ Single video calculation
  - ✅ Batch processing (up to 100 videos)
  - ✅ Auto-process scraped videos
  - ✅ Error handling with fallbacks
  - ✅ Event emission integration

- [x] **Event Emitter** - `src/lib/services/dps/dps-event-emitter.ts`
  - ✅ EVT.DPS.CalculationCompleted
  - ✅ EVT.DPS.CalculationFailed
  - ✅ EVT.DPS.BatchCompleted
  - ✅ EVT.DPS.CohortStatsUpdated
  - ✅ Event handler registration
  - ✅ Event persistence

- [x] **API Endpoints**
  - ✅ POST /api/dps/calculate - Main calculation endpoint
  - ✅ GET /api/dps/cohort-stats/:platform/:followerCount
  - ✅ GET /api/dps/cohort-stats/:platform
  - ✅ Rate limiting
  - ✅ Request validation
  - ✅ Error responses

- [x] **Documentation**
  - ✅ Comprehensive README
  - ✅ API usage examples
  - ✅ Algorithm documentation
  - ✅ Event system guide

- [x] **Testing**
  - ✅ API test script (scripts/test-dps-api.js)

## 🚀 Deployment Steps

### 1. Pre-Deployment

```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Check TypeScript compilation
npm run type-check

# Run linter
npm run lint

# Run tests (if applicable)
npm test
```

### 2. Database Migration

**Option A: Using Supabase CLI**
```bash
cd C:\Projects\CleanCopy
supabase db push
```

**Option B: Direct SQL Execution**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20251002_feat002_dps_calculation_engine.sql`
3. Execute SQL
4. Verify success message: "FEAT-002: DPS Calculation Engine migration completed successfully"

**Verification:**
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('dps_calculations', 'dps_cohort_stats', 'dps_calculation_errors');

-- Check sample cohort data
SELECT platform, COUNT(*) as cohort_count
FROM dps_cohort_stats
GROUP BY platform;

-- Should return:
-- tiktok: 5
-- instagram: 5
-- youtube: 5
```

### 3. Deploy Application

```bash
# Build application
npm run build

# Start development server (for testing)
npm run dev

# Or deploy to production
npm run start
```

### 4. API Testing

```bash
# Run automated test suite
node scripts/test-dps-api.js

# Or test manually
curl http://localhost:3002/api/dps/calculate
```

### 5. Verify Feature Flags

```sql
-- Check if feature flag exists
SELECT * FROM feature_flags WHERE flag_name = 'FF-DPSEngine-v1';

-- If not present, create it (OFF by default)
INSERT INTO feature_flags (flag_name, enabled, description)
VALUES ('FF-DPSEngine-v1', false, 'FEAT-002: DPS Calculation Engine main flag');
```

### 6. Enable Feature (Staged Rollout)

**Phase 1: Synthetic Testing (Week 1)**
```sql
-- Enable in staging environment only
UPDATE feature_flags 
SET enabled = true, environment = 'staging'
WHERE flag_name = 'FF-DPSEngine-v1';
```

Test with 1,000 historical videos with known outcomes.

**Success Criteria:**
- ✅ 95% calculation success rate
- ✅ p95 latency < 500ms
- ✅ Viral score distribution matches expected (70% normal, 25% viral, 4% hyper, 1% mega)

**Phase 2: Canary (Week 2)**
```sql
-- Enable for 5% of production traffic
UPDATE feature_flags 
SET enabled = true, environment = 'production', rollout_percentage = 5
WHERE flag_name = 'FF-DPSEngine-v1';
```

Monitor for 48 hours.

**Success Criteria:**
- ✅ Error rate < 1%
- ✅ No data corruption
- ✅ p95 latency < 500ms

**Phase 3: Full Rollout (Week 3)**
```sql
-- Enable for 100% of production traffic
UPDATE feature_flags 
SET rollout_percentage = 100
WHERE flag_name = 'FF-DPSEngine-v1';
```

### 7. Post-Deployment Monitoring

**Check Calculation Stats:**
```bash
curl http://localhost:3002/api/dps/stats
```

**SQL Monitoring Queries:**
```sql
-- Calculation success rate (last 24 hours)
SELECT 
  COUNT(DISTINCT c.video_id) as successful,
  COUNT(DISTINCT e.video_id) as failed,
  ROUND(COUNT(DISTINCT c.video_id)::numeric / 
        (COUNT(DISTINCT c.video_id) + COUNT(DISTINCT e.video_id)) * 100, 2) as success_rate
FROM dps_calculations c
FULL OUTER JOIN dps_calculation_errors e ON c.video_id = e.video_id
WHERE c.calculated_at > NOW() - INTERVAL '24 hours'
   OR e.failed_at > NOW() - INTERVAL '24 hours';

-- Processing time stats
SELECT 
  AVG(processing_time_ms) as avg_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms) as p95_ms,
  MAX(processing_time_ms) as max_ms
FROM dps_calculations
WHERE calculated_at > NOW() - INTERVAL '24 hours';

-- Viral classification distribution
SELECT 
  classification,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM dps_calculations
WHERE calculated_at > NOW() - INTERVAL '24 hours'
GROUP BY classification
ORDER BY classification;

-- Recent errors
SELECT 
  error_code,
  COUNT(*) as count,
  MAX(failed_at) as last_occurrence
FROM dps_calculation_errors
WHERE failed_at > NOW() - INTERVAL '24 hours'
GROUP BY error_code
ORDER BY count DESC;
```

## 🔍 Health Checks

### Application Health
- [ ] API endpoint responding (GET /api/dps/calculate returns 200)
- [ ] Rate limiting working (exceed 100 req/min returns 429)
- [ ] Validation rejecting invalid input (returns 422)

### Database Health
- [ ] All 3 tables exist and accessible
- [ ] Cohort stats contain seed data (15 rows minimum)
- [ ] RLS policies active
- [ ] Indexes created

### Calculation Quality
- [ ] Sample calculations returning reasonable scores (0-100)
- [ ] Viral classifications distributed appropriately
- [ ] Confidence scores reasonable (0.5-1.0)
- [ ] Processing times within budget (< 500ms p95)

### Event System
- [ ] Events being emitted (check logs)
- [ ] Event handlers registered
- [ ] No event emission errors

## 🚨 Rollback Plan

If issues arise:

### Quick Rollback (< 5 minutes)
```sql
-- Disable feature flag
UPDATE feature_flags 
SET enabled = false
WHERE flag_name = 'FF-DPSEngine-v1';
```

### Full Rollback
1. Disable feature flag (above)
2. Redirect API calls to return 503:
```typescript
// In route.ts, add at top:
return NextResponse.json(
  { error: 'Service temporarily unavailable' },
  { status: 503 }
);
```
3. Monitor for new calculation attempts (should be zero)
4. If needed, archive tables:
```sql
ALTER TABLE dps_calculations RENAME TO dps_calculations_deprecated;
ALTER TABLE dps_cohort_stats RENAME TO dps_cohort_stats_deprecated;
ALTER TABLE dps_calculation_errors RENAME TO dps_calculation_errors_deprecated;
```

## 📊 Success Metrics (Week 4 Review)

- [ ] **Calculation Accuracy**: 95%+ success rate
- [ ] **Performance**: p95 < 500ms single, < 30s batch
- [ ] **Reliability**: 99.5% uptime, < 1% error rate
- [ ] **Data Quality**: 100% audit trail, reproducible calculations
- [ ] **Distribution**: Viral scores match expected statistical patterns

## 📞 Support Contacts

- **Owner**: Data Engineering Lead (dps-owner@domain.com)
- **On-call**: #dps-oncall Slack channel
- **Escalation**: VP of Engineering
- **Timezone**: US Eastern (primary), US Pacific (backup)

## 📝 Additional Notes

### Dependencies
- ✅ FEAT-001 (Data Acquisition) - Complete
- ⏳ FEAT-007 (Predictive Engine) - Will consume DPS scores
- ⏳ FEAT-003 (Pattern Recognition) - Will analyze DPS patterns

### Known Limitations
- Sample cohort data needs replacement with real statistics (Week 2)
- Rate limiting is in-memory (consider Redis for production)
- Event persistence requires dps_events table (optional)

### Next Steps (Post-Deployment)
1. Collect real video data to update cohort statistics
2. Fine-tune platform weights based on performance data
3. Implement advanced monitoring dashboard
4. Set up automated weekly cohort stats refresh
5. Add webhook support for events
6. Implement retry mechanism for failed calculations

---

**Status**: ✅ Ready for Deployment  
**Est. Deployment Time**: 2 hours (including testing)  
**Risk Level**: Low (feature-flagged, reversible)  
**Blocked By**: None  
**Blocks**: FEAT-007, FEAT-003


