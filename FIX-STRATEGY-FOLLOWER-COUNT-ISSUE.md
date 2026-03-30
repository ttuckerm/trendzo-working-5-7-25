# FIX STRATEGY: Follower Count Issue
**Date**: October 8, 2025
**Priority**: CRITICAL (P0)
**Estimated Time**: 2-4 hours

---

## ROOT CAUSE ANALYSIS

### Issue Summary
ALL videos in database have `creator_followers_count = 0`, causing:
- Incorrect cohort assignments (all videos in same cohort)
- Wrong z-scores (not comparing to similar creators)
- Misclassified viral scores (mega-viral videos scoring 66-81 instead of 80+)

### Evidence
```sql
-- Database query results:
Total videos: 50
Unique follower counts: 1 (value: 0)
Raw scraping data: {} (EMPTY)

-- Known creators with REAL follower counts:
@daveramsey     - ~13M  followers → DB shows: 0
@austinhankwitz - ~800K followers → DB shows: 0
@marktilbury    - ~6.7M followers → DB shows: 0
@yourrichbff    - ~2.6M followers → DB shows: 0
```

### Root Cause
Scraper (N8N/Apify) is NOT capturing `creator_followers_count` from TikTok API.
The `raw_scraping_data` field is completely empty (`{}`), indicating no metadata was saved.

---

## FIX STRATEGY

### Option A: Fix Scraper & Re-Scrape (RECOMMENDED) ⭐
**Time**: 2-3 hours
**Benefit**: Permanent fix with real data
**Drawback**: Requires re-scraping all videos

**Steps**:
1. Locate N8N/Apify scraper configuration
2. Add `authorStats.followerCount` to scraper output mapping
3. Test scraper on 1-2 videos
4. Batch re-scrape all videos (or at minimum, the top viral videos)
5. Update `scraped_videos.creator_followers_count` with real data
6. Re-calculate DPS scores

### Option B: Manual Lookup & Backfill (TEMPORARY)
**Time**: 1-2 hours
**Benefit**: Fast fix for existing data
**Drawback**: Doesn't fix scraper (future videos will have same problem)

**Steps**:
1. Use TikTok public API to look up follower counts by username
2. Update database records with real follower counts
3. Re-calculate DPS scores
4. Still need to fix scraper eventually

### Option C: Estimate Follower Counts from View Patterns (HACKY)
**Time**: 30 minutes
**Benefit**: Instant workaround
**Drawback**: Inaccurate, doesn't solve root problem

**Steps**:
1. Estimate followers based on median view count
2. Apply heuristic: `followerCount ≈ medianViews * 2`
3. Re-calculate DPS scores
4. Mark as "estimated" data

---

## RECOMMENDED SOLUTION: Option A

### Phase 1: Fix Scraper (1 hour)

#### 1.1 Locate Scraper Configuration
- Check for N8N workflow JSON files
- Check for Apify actor configuration
- Look for scraper scripts in `scripts/` or `apify/`

#### 1.2 Add Follower Count Mapping
**Required fields from TikTok API**:
```javascript
{
  authorMeta: {
    id: string,
    name: string (username),
    verified: boolean,
    followerCount: number,  // ← ADD THIS
    followingCount: number,
    heart: number,
    videoCount: number
  }
}
```

**Update scraper output**:
```javascript
{
  video_id: data.id,
  creator_username: data.authorMeta.name,
  creator_followers_count: data.authorMeta.followerCount || 0,  // ← MAP THIS
  creator_verified: data.authorMeta.verified,
  // ... other fields
}
```

#### 1.3 Test Scraper
```bash
# Test on a single video
curl -X POST https://api.apify.com/v2/acts/YOUR_ACTOR/runs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"startUrls": ["https://www.tiktok.com/@daveramsey/video/7555569553833577741"]}'

# Verify output includes authorStats.followerCount
```

### Phase 2: Backfill Existing Data (1 hour)

#### 2.1 Create Backfill Script
```javascript
// scripts/backfill-follower-counts.js
const { createClient } = require('@supabase/supabase-js');
const { ApifyClient } = require('apify-client');

async function backfillFollowerCounts() {
  // 1. Get all unique creator usernames
  const { data: videos } = await supabase
    .from('scraped_videos')
    .select('creator_username')
    .not('creator_username', 'is', null);

  const uniqueCreators = [...new Set(videos.map(v => v.creator_username))];

  // 2. Look up follower counts via TikTok API
  for (const username of uniqueCreators) {
    const followerCount = await fetchFollowerCount(username);

    // 3. Update all videos by this creator
    await supabase
      .from('scraped_videos')
      .update({ creator_followers_count: followerCount })
      .eq('creator_username', username);
  }
}
```

#### 2.2 Lookup Methods
**Option 2.1**: Use Apify TikTok Profile Scraper
```javascript
const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

async function fetchFollowerCount(username) {
  const run = await client.actor('OtzYfK1ndEGdwWFKQ').call({
    profiles: [`https://www.tiktok.com/@${username}`]
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items[0]?.authorStats?.followerCount || 0;
}
```

**Option 2.2**: Use TikTok Research API (if available)
**Option 2.3**: Manual lookup for top 20 creators

### Phase 3: Re-Calculate DPS Scores (30 minutes)

#### 3.1 Start Dev Server
```bash
npm run dev
```

#### 3.2 Run Batch DPS Calculation
```bash
node scripts/batch-calculate-dps.js
```

#### 3.3 Verify Results
```sql
SELECT
  classification,
  COUNT(*) as count,
  MIN(viral_score) as min_score,
  MAX(viral_score) as max_score,
  AVG(viral_score) as avg_score
FROM (
  SELECT DISTINCT ON (video_id)
    video_id, viral_score, classification
  FROM dps_calculations
  ORDER BY video_id, calculated_at DESC
) latest
GROUP BY classification
ORDER BY avg_score DESC;

-- Expected results:
-- mega-viral: min >= 80, avg ~85
-- viral: min >= 70, max < 80, avg ~75
-- normal: max < 70, avg ~45
```

### Phase 4: Re-Extract Patterns (30 minutes)

#### 4.1 Clear Existing Patterns
```sql
DELETE FROM pattern_video_associations;
DELETE FROM viral_patterns;
```

#### 4.2 Re-Run Pattern Extraction
```bash
# Run pattern extraction script (if exists)
node scripts/run-enhanced-pattern-extraction.js

# Or trigger via API
curl -X POST http://localhost:3002/api/patterns/extract \
  -H "Content-Type: application/json" \
  -d '{"niche": "personal-finance", "min_dps_score": 80}'
```

#### 4.3 Verify Pattern Quality
```sql
SELECT
  pattern_type,
  COUNT(*) as pattern_count,
  AVG(success_rate) as avg_success_rate,
  AVG(avg_dps_score) as avg_pattern_dps
FROM viral_patterns
WHERE niche = 'personal-finance'
GROUP BY pattern_type;

-- Expected: 7 pattern types with success_rate > 0.6
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Fix Scraper ✅
- [ ] Locate N8N/Apify scraper configuration
- [ ] Add `authorMeta.followerCount` to output mapping
- [ ] Test scraper on 1-2 videos
- [ ] Verify `creator_followers_count` is populated
- [ ] Verify `raw_scraping_data` contains full metadata

### Phase 2: Backfill Data ✅
- [ ] Create backfill script
- [ ] Test on 3-5 creators
- [ ] Run backfill for all creators
- [ ] Verify follower counts in database
- [ ] Confirm no records remain with `creator_followers_count = 0`

### Phase 3: Re-Calculate DPS ✅
- [ ] Start dev server (`npm run dev`)
- [ ] Run `node scripts/batch-calculate-dps.js`
- [ ] Verify classifications:
  - [ ] mega-viral: min >= 80
  - [ ] viral: 70-79 range
  - [ ] normal: max < 70
- [ ] Check cohort diversity (multiple cohorts being used)

### Phase 4: Re-Extract Patterns ✅
- [ ] Clear existing patterns
- [ ] Re-run pattern extraction
- [ ] Verify 7 pattern types extracted
- [ ] Confirm patterns tied to correctly classified videos

### Phase 5: Documentation ✅
- [ ] Update [SYSTEM-HEALTH-REPORT](SYSTEM-HEALTH-REPORT-2025-10-08.md)
- [ ] Document scraper configuration
- [ ] Add follower count validation to scraper tests
- [ ] Create monitoring alert for `creator_followers_count = 0`

---

## VALIDATION CRITERIA

### Success Metrics
1. ✅ **All videos have non-zero follower counts**
   ```sql
   SELECT COUNT(*) FROM scraped_videos WHERE creator_followers_count = 0;
   -- Expected: 0
   ```

2. ✅ **Follower counts match reality (spot check)**
   ```sql
   SELECT creator_username, creator_followers_count
   FROM scraped_videos
   WHERE creator_username IN ('daveramsey', 'austinhankwitz', 'marktilbury')
   GROUP BY creator_username, creator_followers_count;
   -- Expected:
   -- daveramsey: ~13,000,000
   -- austinhankwitz: ~800,000
   -- marktilbury: ~6,700,000
   ```

3. ✅ **Multiple cohorts being used**
   ```sql
   SELECT DISTINCT cohort_median
   FROM dps_calculations
   ORDER BY cohort_median;
   -- Expected: 5+ different cohort values
   ```

4. ✅ **Classifications respect thresholds**
   ```sql
   SELECT
     classification,
     MIN(viral_score) as min,
     MAX(viral_score) as max
   FROM dps_calculations
   GROUP BY classification;
   -- Expected:
   -- mega-viral: min >= 80
   -- viral: min >= 70, max < 80
   -- normal: max < 70
   ```

5. ✅ **Pattern quality improves**
   ```sql
   SELECT AVG(success_rate) FROM viral_patterns;
   -- Expected: > 0.6 (60% success rate)
   ```

---

## CONTINGENCY PLANS

### If Scraper Cannot Be Fixed
**Fallback**: Use external API for follower lookups
- Social Blade API
- TikTok Research API
- Manual lookup for top creators

### If API Limits Hit
**Fallback**: Prioritize top viral videos
- Focus on videos with views > 100k
- Estimate followers for less important videos
- Re-run scraper later for full coverage

### If Re-Calculation Fails
**Fallback**: Direct database update
```sql
-- Manually update classifications based on new scores
UPDATE dps_calculations
SET classification =
  CASE
    WHEN viral_score >= 80 THEN 'mega-viral'
    WHEN viral_score >= 70 THEN 'viral'
    ELSE 'normal'
  END
WHERE calculated_at >= '2025-10-05';
```

---

## TIMELINE

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Locate scraper config | 15 min | 🔴 Not started |
| 1 | Fix scraper mapping | 30 min | 🔴 Not started |
| 1 | Test scraper | 15 min | 🔴 Not started |
| 2 | Create backfill script | 30 min | 🔴 Not started |
| 2 | Run backfill | 30 min | 🔴 Not started |
| 3 | Re-calculate DPS | 15 min | 🔴 Not started |
| 3 | Verify classifications | 15 min | 🔴 Not started |
| 4 | Re-extract patterns | 20 min | 🔴 Not started |
| 4 | Verify pattern quality | 10 min | 🔴 Not started |
| 5 | Update documentation | 10 min | 🔴 Not started |
| **TOTAL** | | **3 hours** | |

---

## NEXT STEPS

1. **IMMEDIATE**: Locate scraper configuration
   - Check `apify/` directory
   - Check `scripts/run-scraper.js`
   - Check N8N workflow exports (if any)

2. **HIGH PRIORITY**: Create backfill script
   - Use Apify TikTok Profile Scraper
   - Start with top 10 creators
   - Expand to all unique creators

3. **MEDIUM PRIORITY**: Re-calculate DPS scores
   - Wait for backfill to complete
   - Run batch calculation
   - Verify results

4. **LOW PRIORITY**: Re-extract patterns
   - Only after DPS scores are corrected
   - Focus on personal-finance niche first

---

**Status**: Ready to begin Phase 1
**Blocker**: Need to locate scraper configuration
**Owner**: System Administrator
**Next Action**: Find N8N/Apify scraper files
