# FEAT-007: Pre-Content Prediction - Deployment Checklist

**Feature:** Script/Storyboard Analyzer (Pre-Content Prediction)
**Feature Flag:** `FF-PreContentAnalyzer-v1`
**Status:** Ready for Deployment

---

## Pre-Deployment Checklist

### 1. Environment Variables ✅

#### Required API Keys

- [ ] `OPENAI_API_KEY` - OpenAI API key for GPT-4
- [ ] `ANTHROPIC_API_KEY` - Anthropic API key for Claude
- [ ] `GOOGLE_AI_API_KEY` - Google AI API key for Gemini
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (existing)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (existing)

#### Optional Configuration

- [ ] `NEXT_PUBLIC_FF-PreContentAnalyzer-v1=true` - Feature flag (defaults to enabled)

**Verify all keys are set:**
```bash
# In production environment
echo $OPENAI_API_KEY | cut -c1-10  # Should show: sk-proj-...
echo $ANTHROPIC_API_KEY | cut -c1-10  # Should show: sk-ant-...
echo $GOOGLE_AI_API_KEY | cut -c1-10  # Should show: AIza...
```

---

### 2. Dependencies ✅

- [ ] `npm install openai @anthropic-ai/sdk @google/generative-ai`
- [ ] Verify `package.json` includes all required packages
- [ ] Run `npm audit` to check for vulnerabilities

```bash
npm list openai @anthropic-ai/sdk @google/generative-ai
```

---

### 3. Database Migration ✅

- [ ] Review migration file: `supabase/migrations/20251003_feat007_pre_content_predictions.sql`
- [ ] Run migration in staging environment first
- [ ] Verify table created: `pre_content_predictions`
- [ ] Verify view created: `prediction_accuracy_stats`
- [ ] Check indexes created successfully
- [ ] Test RLS policies if enabled

**Run migration:**
```bash
# Staging
supabase db push --db-url $STAGING_DB_URL

# Production (after staging verification)
supabase db push
```

**Verify migration:**
```sql
-- Check table exists
SELECT table_name FROM information_schema.tables
WHERE table_name = 'pre_content_predictions';

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'pre_content_predictions';

-- Check view
SELECT * FROM prediction_accuracy_stats LIMIT 1;
```

---

### 4. Testing ✅

#### Unit Tests
- [ ] Test LLM consensus with mock responses
- [ ] Test Idea Legos extraction
- [ ] Test pattern matching
- [ ] Test DPS calculation
- [ ] Test recommendations generation

#### Integration Tests
- [ ] Test full prediction pipeline
- [ ] Test API route validation
- [ ] Test error handling (invalid inputs)
- [ ] Test feature flag disabled state
- [ ] Test graceful LLM failures (2/3 consensus)

#### End-to-End Tests
- [ ] Make real prediction via API
- [ ] Verify response structure
- [ ] Check database record created
- [ ] Test with various niches/platforms
- [ ] Test with/without storyboard
- [ ] Verify response time < 5s

**Test command:**
```bash
# Health check
curl https://your-domain.com/api/predict/pre-content?action=health

# Real prediction
curl -X POST https://your-domain.com/api/predict/pre-content \
  -H "Content-Type: application/json" \
  -d @test-data/sample-script.json
```

---

### 5. Performance Optimization ✅

- [ ] Verify pattern caching is enabled (5-min TTL)
- [ ] Test parallel LLM calls (should be ~2-4s)
- [ ] Monitor database query performance
- [ ] Set up connection pooling for Supabase
- [ ] Configure rate limiting (prevent API abuse)

**Performance targets:**
- Response time: < 5 seconds
- Cache hit rate: > 80% (for pattern queries)
- LLM success rate: > 95% (at least 2/3 providers)

---

### 6. Monitoring & Logging ✅

- [ ] Set up logging for prediction requests
- [ ] Track LLM API failures
- [ ] Monitor response times
- [ ] Alert on error rate > 5%
- [ ] Track API costs (LLM usage)

**Recommended monitoring:**
```typescript
// Example: Add to monitoring service
trackMetric('prediction.request', 1, { niche, platform });
trackMetric('prediction.response_time', duration);
trackMetric('prediction.llm_failures', failedProviders.length);
trackMetric('prediction.dps_score', predictedDPS);
```

---

### 7. Error Handling ✅

- [ ] Test all LLM providers fail
- [ ] Test database connection failure
- [ ] Test invalid input validation
- [ ] Test rate limiting
- [ ] Verify error messages are user-friendly

**Error scenarios to test:**
1. Invalid API key → 503 Service Unavailable
2. Invalid JSON → 400 Bad Request
3. Missing required fields → 400 Validation Error
4. Database down → 500 Database Error
5. All LLMs fail → 503 Service Unavailable

---

### 8. Security ✅

- [ ] Verify API keys not exposed in client code
- [ ] Check RLS policies on `pre_content_predictions` table
- [ ] Implement rate limiting (e.g., 10 predictions/hour per user)
- [ ] Sanitize user inputs (script/storyboard)
- [ ] Add CORS configuration if needed
- [ ] Review API authentication/authorization

**Security checklist:**
```bash
# Check for exposed secrets
grep -r "sk-proj-" src/  # Should return nothing
grep -r "sk-ant-" src/   # Should return nothing

# Verify server-side only
grep -r "OPENAI_API_KEY" src/app/  # Should only appear in API routes
```

---

### 9. Documentation ✅

- [ ] API documentation complete
- [ ] Quick start guide created
- [ ] Implementation summary written
- [ ] Deployment checklist (this file) complete
- [ ] Update main README with FEAT-007
- [ ] Create example requests/responses

**Documentation files:**
- `FEAT-007-IMPLEMENTATION-SUMMARY.md` ✅
- `FEAT-007-QUICKSTART.md` ✅
- `FEAT-007-DEPLOYMENT-CHECKLIST.md` ✅ (this file)
- `FEAT-007-FILES-CREATED.txt` ✅

---

### 10. Cost Management ✅

- [ ] Estimate cost per prediction (~$0.10-0.20)
- [ ] Set up billing alerts for LLM APIs
- [ ] Implement usage quotas per user tier
- [ ] Monitor daily/monthly API spend
- [ ] Consider caching LLM responses (controversial, but saves $)

**Cost breakdown per prediction:**
- GPT-4 extraction: ~$0.05
- GPT-4 scoring: ~$0.02
- Claude scoring: ~$0.03
- Gemini scoring: ~$0.01
- **Total: ~$0.11** (can vary by script length)

**Budget recommendations:**
- Free tier: 5 predictions/month
- Pro tier: 50 predictions/month
- Enterprise: Unlimited (with rate limits)

---

## Deployment Steps

### Step 1: Deploy to Staging

1. **Set environment variables in staging**
   ```bash
   # Vercel example
   vercel env add OPENAI_API_KEY
   vercel env add ANTHROPIC_API_KEY
   vercel env add GOOGLE_AI_API_KEY
   ```

2. **Run database migration**
   ```bash
   supabase db push --db-url $STAGING_DB_URL
   ```

3. **Deploy code**
   ```bash
   git push origin staging
   # Or: vercel --prod (for staging environment)
   ```

4. **Run smoke tests**
   ```bash
   ./scripts/test-feat-007-staging.sh
   ```

5. **Monitor for 24 hours**
   - Check error rates
   - Verify response times
   - Review LLM API costs

---

### Step 2: Deploy to Production

1. **Verify staging success**
   - [ ] All tests passing
   - [ ] No critical errors in 24h
   - [ ] Performance meets targets
   - [ ] Costs within budget

2. **Set production environment variables**
   ```bash
   # Same as staging, but use production keys
   ```

3. **Run production migration**
   ```bash
   supabase db push  # Targets production by default
   ```

4. **Deploy to production**
   ```bash
   git push origin main
   # Or: vercel --prod
   ```

5. **Verify deployment**
   ```bash
   curl https://app.trendzo.com/api/predict/pre-content?action=health
   ```

6. **Monitor closely for first week**
   - Set up alerts for errors
   - Track usage patterns
   - Monitor API costs daily
   - Collect user feedback

---

### Step 3: Feature Flag Rollout

**Gradual rollout strategy:**

1. **Week 1: Internal Beta**
   - Enable for team members only
   - Collect feedback
   - Fix any bugs

2. **Week 2: Pro Users Beta**
   - Enable for 10% of pro users
   - Monitor engagement
   - A/B test UI placement

3. **Week 3: Full Pro Rollout**
   - Enable for all pro users
   - Announce in changelog
   - Create tutorial content

4. **Week 4: Free Tier Limited Access**
   - 5 predictions/month for free users
   - Upgrade prompt after quota

**Feature flag configuration:**
```bash
# Production environment
NEXT_PUBLIC_FF-PreContentAnalyzer-v1=true

# Or use feature flag service
# LaunchDarkly, Split.io, etc.
```

---

## Post-Deployment Monitoring

### Week 1 Metrics

- [ ] Total predictions made
- [ ] Average response time
- [ ] Error rate
- [ ] LLM provider success rates
- [ ] User retention (do they come back?)
- [ ] Feedback/support tickets

### Week 2-4 Metrics

- [ ] Prediction accuracy (when actual content goes live)
- [ ] Pattern utilization (which recommendations are followed)
- [ ] Conversion to paid tiers
- [ ] Feature engagement rate
- [ ] Cost per prediction vs. revenue

### Key Success Indicators

- **Engagement:** > 50% of users make 2+ predictions
- **Accuracy:** Predicted DPS within ±15 points of actual
- **Performance:** 95%+ of predictions < 5 seconds
- **Reliability:** < 2% error rate
- **ROI:** Feature pays for itself via conversions

---

## Rollback Plan

**If critical issues arise:**

1. **Disable feature flag**
   ```bash
   NEXT_PUBLIC_FF-PreContentAnalyzer-v1=false
   ```

2. **Revert deployment** (if needed)
   ```bash
   vercel rollback
   # Or: git revert && git push
   ```

3. **Database rollback** (if migration issues)
   ```sql
   DROP TABLE pre_content_predictions CASCADE;
   DROP VIEW prediction_accuracy_stats;
   ```

4. **Notify users**
   - In-app banner: "Prediction feature temporarily unavailable"
   - ETA for fix

---

## Support Readiness

### Common User Issues

1. **"Prediction taking too long"**
   - Expected: 2-5 seconds
   - Check: LLM API status
   - Workaround: Retry

2. **"Score seems wrong"**
   - Explain: It's a prediction, not guarantee
   - Check: Pattern data quality
   - Suggest: Share actual results for accuracy improvement

3. **"No recommendations given"**
   - Check: Pattern match score (if < 30, may be no recs)
   - Suggest: Try different niche/platform
   - Escalate: May need more pattern data

### Support Documentation

- [ ] Add FAQ section
- [ ] Create troubleshooting guide
- [ ] Record demo video
- [ ] Write blog post explaining feature

---

## Success Criteria

**FEAT-007 is successfully deployed when:**

- ✅ All API endpoints responding
- ✅ Database migrations complete
- ✅ Environment variables set
- ✅ Error rate < 2%
- ✅ Response time < 5s (95th percentile)
- ✅ LLM success rate > 95%
- ✅ First 100 predictions completed successfully
- ✅ Zero critical bugs
- ✅ Monitoring/alerts active
- ✅ Documentation published
- ✅ Support team trained

---

## Final Pre-Launch Checklist

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Database migration tested
- [ ] Environment variables verified
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Support team briefed
- [ ] Rollback plan documented
- [ ] Success metrics defined
- [ ] Feature flag ready
- [ ] Announcement prepared
- [ ] Tutorial content created

**Sign-off:**
- [ ] Engineering Lead
- [ ] Product Manager
- [ ] QA Lead
- [ ] DevOps Lead

---

**Ready to deploy? Let's ship it! 🚀**

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Production URL:** https://app.trendzo.com/api/predict/pre-content
**Status Page:** _____________
**Monitoring Dashboard:** _____________
