# FEAT-003: Pattern Extraction System - Deployment Checklist

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Database Setup ⚠️ REQUIRED
- [ ] **Apply Migration**
  ```bash
  supabase db push
  # OR manually apply: supabase/migrations/20251003_feat003_pattern_extraction.sql
  ```

- [ ] **Verify Tables Created**
  ```sql
  SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN (
      'viral_patterns',
      'pattern_video_associations', 
      'pattern_extraction_jobs',
      'pattern_extraction_errors'
    );
  -- Expected: 4
  ```

- [ ] **Check RLS Policies**
  ```sql
  SELECT schemaname, tablename, policyname 
  FROM pg_policies 
  WHERE tablename LIKE 'pattern%' OR tablename = 'viral_patterns';
  -- Expected: 7 policies (service role + authenticated read policies)
  ```

- [ ] **Test Helper Functions**
  ```sql
  -- Test pattern retrieval function
  SELECT * FROM get_top_patterns_by_niche('test-niche', NULL, 10);
  
  -- Test similarity function
  SELECT * FROM find_similar_patterns('test-niche', 'topic', 'test description', 0.7);
  ```

### 2. Environment Configuration ⚠️ REQUIRED
- [ ] **Supabase Configuration**
  ```bash
  # In .env.local
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_KEY=eyJ... (service_role key, NOT anon key)
  ```

- [ ] **OpenAI Configuration**
  ```bash
  # In .env.local
  OPENAI_API_KEY=sk-... (must have GPT-4 access)
  LLM_PROVIDER=openai  # Ensure OpenAI is active
  ```

- [ ] **Verify API Keys**
  ```bash
  # Test Supabase connection
  curl https://your-project.supabase.co/rest/v1/ \
    -H "apikey: YOUR_ANON_KEY"
  
  # Test OpenAI key
  curl https://api.openai.com/v1/models \
    -H "Authorization: Bearer $OPENAI_API_KEY"
  ```

### 3. Code Validation ✅ COMPLETED
- [x] **No Linting Errors**
  ```bash
  npm run lint
  # Result: ✅ No errors found
  ```

- [x] **TypeScript Compilation**
  ```bash
  npm run type-check
  # All types valid
  ```

- [x] **File Structure**
  ```
  ✅ 9 files created
  ✅ ~2,180 lines of code
  ✅ All imports resolved
  ```

### 4. Testing 🧪 RECOMMENDED

#### Manual API Tests
- [ ] **GET Documentation Endpoint**
  ```bash
  curl http://localhost:3000/api/patterns/extract
  # Should return comprehensive API docs
  ```

- [ ] **POST Small Batch**
  ```bash
  curl -X POST http://localhost:3000/api/patterns/extract \
    -H "Content-Type: application/json" \
    -d '{
      "niche": "test-niche",
      "minDPSScore": 80,
      "dateRange": "7d",
      "limit": 10
    }'
  # Should process successfully (may find 0 videos if no data)
  ```

- [ ] **Rate Limiting**
  ```bash
  # Send 11 requests in quick succession
  for i in {1..11}; do
    curl -X POST http://localhost:3000/api/patterns/extract \
      -H "Content-Type: application/json" \
      -d '{"niche":"test","minDPSScore":80,"dateRange":"7d"}'
    echo ""
  done
  # 11th request should return 429 Rate Limit Exceeded
  ```

- [ ] **Invalid Request Handling**
  ```bash
  # Missing required field
  curl -X POST http://localhost:3000/api/patterns/extract \
    -H "Content-Type: application/json" \
    -d '{"minDPSScore": 80}'
  # Should return 422 Validation Error
  
  # Invalid DPS score
  curl -X POST http://localhost:3000/api/patterns/extract \
    -H "Content-Type: application/json" \
    -d '{"niche":"test","minDPSScore":150,"dateRange":"7d"}'
  # Should return 422 Validation Error
  ```

#### Integration Tests (Optional)
- [ ] **Service Layer Tests**
  ```typescript
  // Test pattern extraction service
  import { extractPatterns } from '@/lib/services/pattern-extraction';
  
  const result = await extractPatterns({
    niche: 'test-niche',
    minDPSScore: 80,
    dateRange: '7d',
    limit: 10,
  });
  
  expect(result.success).toBe(true);
  expect(result.batchId).toBeDefined();
  ```

- [ ] **Database Service Tests**
  ```typescript
  // Test database operations
  import { createPattern, findExistingPattern } from '@/lib/services/pattern-extraction';
  
  const pattern = await createPattern(
    'test-niche',
    'topic',
    'Test pattern description'
  );
  
  const found = await findExistingPattern(
    'test-niche',
    'topic',
    'Test pattern description'
  );
  
  expect(found?.id).toBe(pattern.id);
  ```

### 5. Production Readiness 🚀 BEFORE LAUNCH

#### Performance
- [ ] **Database Indexes**
  ```sql
  -- Verify all indexes created
  SELECT indexname, tablename 
  FROM pg_indexes 
  WHERE schemaname = 'public' 
    AND (tablename LIKE 'pattern%' OR tablename = 'viral_patterns');
  -- Expected: 14 indexes
  ```

- [ ] **Query Performance**
  ```sql
  -- Test pattern query performance
  EXPLAIN ANALYZE 
  SELECT * FROM get_top_patterns_by_niche('test-niche', NULL, 10);
  -- Should use indexes, <100ms
  ```

#### Security
- [ ] **RLS Enabled**
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND (tablename LIKE 'pattern%' OR tablename = 'viral_patterns');
  -- All should have rowsecurity = true
  ```

- [ ] **Service Key Protected**
  ```bash
  # Verify service key not in git
  git grep -i "service_role" || echo "✅ No service keys in repo"
  ```

- [ ] **Rate Limits Appropriate**
  ```typescript
  // In route.ts
  const RATE_LIMIT_MAX_REQUESTS = 10; // Adjust for production load
  const RATE_LIMIT_WINDOW_MS = 60000;  // 1 minute
  ```

#### Monitoring
- [ ] **Cost Tracking**
  ```sql
  -- Monitor LLM costs
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as jobs,
    SUM(llm_tokens_used) as total_tokens,
    SUM(llm_cost_usd) as total_cost_usd
  FROM pattern_extraction_jobs
  WHERE status = 'completed'
    AND created_at >= NOW() - INTERVAL '7 days'
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
  ```

- [ ] **Error Rate Monitoring**
  ```sql
  -- Check error rates
  SELECT 
    error_code,
    COUNT(*) as count,
    MAX(failed_at) as last_occurrence
  FROM pattern_extraction_errors
  WHERE failed_at >= NOW() - INTERVAL '24 hours'
  GROUP BY error_code
  ORDER BY count DESC;
  ```

- [ ] **Job Success Rate**
  ```sql
  -- Monitor job success rate
  SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
  FROM pattern_extraction_jobs
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY status;
  ```

#### Documentation
- [ ] **README Updated**
  - Add FEAT-003 to project README
  - Link to quickstart guide
  - Document API endpoints

- [ ] **API Documentation**
  - Swagger/OpenAPI spec (optional)
  - Postman collection (optional)
  - Example requests documented

- [ ] **Team Training**
  - Share quickstart guide with team
  - Demo API usage
  - Review cost implications

### 6. Post-Deployment Validation 🎯 AFTER LAUNCH

#### Smoke Tests
- [ ] **Basic Extraction**
  ```bash
  # Run small extraction job
  curl -X POST https://production-url/api/patterns/extract \
    -H "Content-Type: application/json" \
    -d '{
      "niche": "personal-finance",
      "minDPSScore": 85,
      "dateRange": "7d",
      "limit": 20
    }'
  # Verify successful response
  ```

- [ ] **Pattern Retrieval**
  ```bash
  # Get cached patterns
  curl https://production-url/api/patterns/extract?niche=personal-finance&limit=10
  # Verify patterns returned
  ```

#### Monitoring
- [ ] **Check Job Records**
  ```sql
  -- Verify jobs are being tracked
  SELECT * FROM pattern_extraction_jobs 
  ORDER BY created_at DESC LIMIT 5;
  ```

- [ ] **Check Pattern Storage**
  ```sql
  -- Verify patterns are being stored
  SELECT 
    niche,
    pattern_type,
    COUNT(*) as pattern_count
  FROM viral_patterns
  GROUP BY niche, pattern_type
  ORDER BY pattern_count DESC;
  ```

- [ ] **Check Error Logs**
  ```sql
  -- Monitor for errors
  SELECT * FROM pattern_extraction_errors 
  WHERE failed_at >= NOW() - INTERVAL '1 hour'
  ORDER BY failed_at DESC;
  ```

#### Performance
- [ ] **Response Times**
  - API response < 60 seconds for 50 videos
  - Database queries < 1 second
  - LLM calls < 30 seconds each

- [ ] **Resource Usage**
  - Monitor CPU usage during extraction
  - Monitor memory usage
  - Monitor Supabase connection pool

---

## 🚨 ROLLBACK PLAN

If issues occur after deployment:

### 1. Disable API Endpoint
```typescript
// In src/app/api/patterns/extract/route.ts
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      success: false,
      error: 'Temporarily disabled for maintenance',
    },
    { status: 503 }
  );
}
```

### 2. Rollback Database Migration
```sql
-- Drop all FEAT-003 tables
DROP TABLE IF EXISTS pattern_extraction_errors CASCADE;
DROP TABLE IF EXISTS pattern_extraction_jobs CASCADE;
DROP TABLE IF EXISTS pattern_video_associations CASCADE;
DROP TABLE IF EXISTS viral_patterns CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_top_patterns_by_niche CASCADE;
DROP FUNCTION IF EXISTS update_pattern_statistics CASCADE;
DROP FUNCTION IF EXISTS find_similar_patterns CASCADE;
```

### 3. Remove Code Changes
```bash
git revert <commit-hash>
# Or manually remove files:
rm -rf src/lib/services/pattern-extraction
rm -rf src/app/api/patterns
rm supabase/migrations/20251003_feat003_pattern_extraction.sql
```

---

## 📊 SUCCESS METRICS

Track these metrics post-deployment:

### Technical Metrics
- API response time (target: <60s for 100 videos)
- Error rate (target: <5%)
- LLM cost per extraction (monitor closely)
- Database query performance (target: <1s)

### Business Metrics
- Patterns extracted per day
- Pattern success rate (avg across all)
- Most valuable pattern types
- User adoption rate

---

## 🎉 DEPLOYMENT COMPLETE

Once all checks pass:
- [ ] Mark FEAT-003 as deployed
- [ ] Update project status board
- [ ] Notify team of new feature
- [ ] Share documentation links
- [ ] Schedule review meeting (1 week post-launch)

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Verified By:** _______________  
**Status:** ⬜ Ready / ⬜ In Progress / ⬜ Deployed / ⬜ Verified

---

*Last Updated: 2025-10-03*  
*Feature: FEAT-003 Pattern Extraction System*  
*Version: 1.0.0*

