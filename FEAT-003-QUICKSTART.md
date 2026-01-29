# FEAT-003: Pattern Extraction System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Apply Database Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually apply the migration file
# Navigate to Supabase Dashboard → SQL Editor
# Copy contents of: supabase/migrations/20251003_feat003_pattern_extraction.sql
# Execute the SQL
```

### 2. Verify Tables Created

```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'pattern%' 
  OR table_name = 'viral_patterns';

-- Expected output: 4 tables
-- viral_patterns
-- pattern_video_associations
-- pattern_extraction_jobs
-- pattern_extraction_errors
```

### 3. Environment Variables

Ensure these are set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
```

### 4. Test API Endpoint

```bash
# Start dev server
npm run dev

# Test GET endpoint (documentation)
curl http://localhost:3000/api/patterns/extract

# Test POST endpoint (extract patterns)
curl -X POST http://localhost:3000/api/patterns/extract \
  -H "Content-Type: application/json" \
  -d '{
    "niche": "personal-finance",
    "minDPSScore": 80,
    "dateRange": "30d",
    "limit": 100
  }'
```

---

## 📖 Usage Examples

### From API (cURL)

```bash
# Extract patterns for a niche
curl -X POST http://localhost:3000/api/patterns/extract \
  -H "Content-Type: application/json" \
  -d '{
    "niche": "fitness",
    "minDPSScore": 85,
    "dateRange": "7d",
    "limit": 50
  }'

# Get top patterns for a niche
curl "http://localhost:3000/api/patterns/extract?niche=fitness&limit=10"
```

### From Application Code

```typescript
import { extractPatterns, getTopPatterns } from '@/lib/services/pattern-extraction';

// Extract new patterns
async function analyzeNiche() {
  const result = await extractPatterns({
    niche: 'personal-finance',
    minDPSScore: 80,
    dateRange: '30d',
    limit: 100,
  });

  console.log(`Analyzed ${result.totalVideosAnalyzed} videos`);
  console.log(`Found ${result.patterns.length} patterns`);
  console.log(`Cost: $${result.llmCostUsd.toFixed(2)}`);
}

// Get cached patterns
async function getPatterns() {
  const patterns = await getTopPatterns('personal-finance', 10);
  
  patterns.forEach(pattern => {
    console.log(`${pattern.type}: ${pattern.description}`);
    console.log(`  Success Rate: ${(pattern.successRate * 100).toFixed(1)}%`);
    console.log(`  Avg DPS: ${pattern.avgDPSScore}`);
  });
}
```

### From React Component

```typescript
'use client';

import { useState } from 'react';

export function PatternExtractor() {
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState([]);

  async function extractPatterns() {
    setLoading(true);
    try {
      const response = await fetch('/api/patterns/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: 'personal-finance',
          minDPSScore: 80,
          dateRange: '30d',
          limit: 100,
        }),
      });

      const data = await response.json();
      setPatterns(data.patterns);
    } catch (error) {
      console.error('Extraction failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={extractPatterns} disabled={loading}>
        {loading ? 'Extracting...' : 'Extract Patterns'}
      </button>
      
      {patterns.length > 0 && (
        <div>
          <h2>Top Patterns</h2>
          {patterns.map((p, i) => (
            <div key={i}>
              <strong>{p.type}</strong>: {p.description}
              <br />
              Success Rate: {(p.successRate * 100).toFixed(1)}%
              <br />
              Frequency: {p.frequency}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Common Use Cases

### 1. Analyze Top Performers in a Niche

```typescript
// Find what makes top performers work
const result = await extractPatterns({
  niche: 'fitness',
  minDPSScore: 95, // Only top 5%
  dateRange: '7d',  // Recent trends
  limit: 50,
});
```

### 2. Track Pattern Trends Over Time

```typescript
// Compare patterns from different time periods
const recent = await extractPatterns({
  niche: 'tech',
  minDPSScore: 85,
  dateRange: '7d',
  limit: 100,
});

const historical = await extractPatterns({
  niche: 'tech',
  minDPSScore: 85,
  dateRange: '90d',
  limit: 100,
});
```

### 3. Get Actionable Patterns for Content Creation

```typescript
// Get top hook structures for your niche
const patterns = await getPatternsByType(
  'personal-finance',
  'hook_structure',
  10
);

// Use patterns to guide content creation
patterns.forEach(pattern => {
  if (pattern.successRate > 0.8) {
    console.log(`✅ High-performing hook: ${pattern.description}`);
  }
});
```

---

## 🔍 Monitoring & Debugging

### Check Job Status

```sql
-- View recent extraction jobs
SELECT 
  batch_id,
  niche,
  status,
  videos_processed,
  patterns_extracted,
  llm_cost_usd,
  processing_time_ms,
  created_at
FROM pattern_extraction_jobs
ORDER BY created_at DESC
LIMIT 10;
```

### Check Errors

```sql
-- View recent errors
SELECT 
  video_id,
  error_code,
  error_message,
  failed_at
FROM pattern_extraction_errors
ORDER BY failed_at DESC
LIMIT 10;
```

### View Top Patterns

```sql
-- Get top patterns by success rate
SELECT 
  pattern_type,
  pattern_description,
  success_rate,
  frequency_count,
  avg_dps_score
FROM viral_patterns
WHERE niche = 'personal-finance'
  AND success_rate IS NOT NULL
ORDER BY success_rate DESC, frequency_count DESC
LIMIT 20;
```

---

## ⚠️ Troubleshooting

### Issue: No videos found

**Solution:**
- Ensure videos have been scraped with `dps_score` calculated
- Check that `niche` field matches your scraped videos
- Lower `minDPSScore` threshold
- Increase `dateRange`

### Issue: LLM timeout

**Solution:**
- Reduce `limit` parameter (fewer videos)
- System automatically batches videos in groups of 50
- Check OpenAI API status

### Issue: Rate limit exceeded

**Solution:**
- Default rate limit: 10 requests per minute
- Wait 60 seconds between requests
- Adjust rate limit in `route.ts` if needed

### Issue: High costs

**Solution:**
- Reduce `limit` parameter
- Use longer `dateRange` to amortize cost
- Cache results (automatic 1-hour cache)
- Monitor `llm_cost_usd` in job records

---

## 📊 Performance Tips

1. **Optimize Batch Size**
   - Start with `limit: 50` for testing
   - Increase to 100-500 for production
   - Monitor LLM costs

2. **Use Caching**
   - Results cached for 1 hour automatically
   - Use GET endpoint to retrieve cached patterns
   - Avoid redundant extractions

3. **Schedule Off-Peak**
   - Run large extractions during off-peak hours
   - Consider background job queue for production

4. **Monitor Statistics**
   - Track `success_rate` of patterns
   - Identify high-performing pattern types
   - Focus extraction on proven niches

---

## 🎓 Next Steps

1. **Test with Real Data**
   - Ensure scraped_videos table has data
   - Verify DPS scores are calculated
   - Run small test extraction first

2. **Monitor Costs**
   - Check `llm_cost_usd` in job records
   - Set up alerts for high costs
   - Review OpenAI usage dashboard

3. **Integrate into UI**
   - Add pattern extraction to admin dashboard
   - Display top patterns to content creators
   - Show pattern trends over time

4. **Optimize for Scale**
   - Consider background job queue
   - Implement Redis for distributed rate limiting
   - Add pattern quality scoring

---

## 📚 Additional Resources

- **Full Documentation:** See `FEAT-003-IMPLEMENTATION-SUMMARY.md`
- **API Reference:** GET `/api/patterns/extract` (documentation endpoint)
- **Database Schema:** See migration file for complete schema
- **Type Definitions:** See `src/lib/services/pattern-extraction/types.ts`

---

## ✅ Success Checklist

Before going to production:

- [ ] Migration applied successfully
- [ ] API endpoints responding
- [ ] Test extraction completed successfully
- [ ] Environment variables configured
- [ ] Rate limits appropriate for usage
- [ ] Monitoring dashboards created
- [ ] Cost alerts configured
- [ ] Error tracking enabled
- [ ] Documentation reviewed by team

---

**Need Help?**
- Check API documentation: GET `/api/patterns/extract`
- Review implementation summary: `FEAT-003-IMPLEMENTATION-SUMMARY.md`
- Check linter output: `npm run lint`
- Review error logs in `pattern_extraction_errors` table

---

*Last Updated: 2025-10-03*  
*Feature: FEAT-003 Pattern Extraction System*  
*Status: ✅ Ready for Testing*

