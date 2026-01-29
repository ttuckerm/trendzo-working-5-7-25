# Viral Research Pipeline Setup Guide

## Overview

Complete keyword + cohort-relative viral detection system for researching 20 niches.

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│ Phase 1: Scraping (Apify → scraped_videos)                    │
│ - 20 niches × 500 videos = 10,000 videos                      │
│ - Keywords/hashtags defined in config/niche-keywords.json     │
└────────────────┬───────────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────────┐
│ Phase 2: Transcription (tikwm → OpenAI Whisper)               │
│ - Script: transcribe-slow-safe.js                             │
│ - Rate: 1 video/2 seconds (respects free tier limits)         │
└────────────────┬───────────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────────┐
│ Phase 3: DPS Calculation (Cohort-Relative Scoring)            │
│ - Groups videos by follower count (±20% cohorts)              │
│ - Calculates z-score within each cohort                       │
│ - Scores: 0-100 (viral ≥70, mega-viral ≥80)                  │
└────────────────┬───────────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────────┐
│ Phase 4: Pattern Extraction (FEAT-003)                        │
│ - Analyzes viral videos (DPS ≥70)                            │
│ - Identifies hooks, pacing, emotional beats                    │
│ - Stores in viral_patterns table                              │
└────────────────┬───────────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────────┐
│ Phase 5: Knowledge Extraction (FEAT-060)                      │
│ - Multi-LLM consensus (Claude + GPT-4)                        │
│ - Stores insights in extracted_knowledge table                │
└────────────────┬───────────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────────┐
│ Phase 6: Research Report Generation                           │
│ - Aggregates statistics, patterns, insights per niche         │
│ - Output: research-reports/{niche}-report.json                │
└────────────────┬───────────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────────┐
│ Phase 7: Human-in-Loop Review (HIL Gate)                      │
│ - UI: http://localhost:3002/admin/research-review             │
│ - Actions: Approve / Reject / Re-sample                       │
└────────────────────────────────────────────────────────────────┘
```

## Files Created

### 1. Configuration
- **`config/niche-keywords.json`**
  - 20 niche definitions
  - Keywords, hashtags, scraping parameters per niche

### 2. Orchestrator
- **`scripts/orchestrate-viral-research.js`**
  - Main pipeline orchestrator
  - Chains all 6 phases together
  - Usage:
    ```bash
    node scripts/orchestrate-viral-research.js personal-finance  # Single niche
    node scripts/orchestrate-viral-research.js all              # All 20 niches
    ```

### 3. UI
- **`src/app/admin/research-review/page.tsx`**
  - Human-in-Loop review dashboard
  - View statistics and top viral videos per niche
  - Approve/Reject/Re-sample actions

### 4. Database Migrations
- **`supabase/migrations/20251002_add_dps_to_scraped_videos.sql`**
  - Adds DPS columns: dps_score, dps_classification, dps_percentile

- **`supabase/migrations/20251015_extend_dps_columns.sql`**
  - Adds: dps_z_score, dps_confidence

## Setup Steps

### Step 1: Apply Database Migrations

Run these SQL scripts in Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/vyeiyccrageeckeehyhj/sql/new
2. Copy content from `supabase/migrations/20251002_add_dps_to_scraped_videos.sql`
3. Execute
4. Copy content from `supabase/migrations/20251015_extend_dps_columns.sql`
5. Execute

**Verify:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'scraped_videos'
AND column_name LIKE 'dps%';
```

Should show:
- dps_score
- dps_percentile
- dps_classification
- dps_calculated_at
- dps_z_score
- dps_confidence

### Step 2: Test with One Niche

```bash
# Test with personal-finance (we already have 788 videos)
node scripts/orchestrate-viral-research.js personal-finance
```

Expected output:
- Phase 1: Scraping (skipped - videos already exist)
- Phase 2: Transcription (shows 500 videos need transcription)
- Phase 3: DPS Calculation (processes videos in cohorts, scores 0-100)
- Phase 4-5: Pattern/Knowledge extraction (placeholders for now)
- Phase 6: Report generation (creates research-reports/personal-finance-report.json)

### Step 3: Review Results

1. Open: http://localhost:3002/admin/research-review
2. Select "Personal Finance" from list
3. Review statistics:
   - Total videos scraped
   - Viral videos found (DPS ≥70)
   - Mega-viral videos (DPS ≥80)
   - Cohort distribution (micro/small/medium/large creators)
4. Review top 10 viral videos
5. Click "Approve", "Reject", or "Re-sample"

### Step 4: Run Transcription for Remaining Videos

```bash
# This will take ~17 minutes for 500 videos (2 sec/video)
node scripts/transcribe-slow-safe.js
```

### Step 5: Run Full Pipeline for All 20 Niches

```bash
# This will take several hours
node scripts/orchestrate-viral-research.js all
```

## Key Features

### 1. Cohort-Relative Viral Detection

**Problem Solved:** Static view thresholds (e.g., ">500K views") miss viral outliers from small creators.

**Solution:** Compare videos only within their follower cohort (±20% range).

**Example:**
- Creator A: 1K followers, normally gets 15K views
- Video goes viral: 250K views
- Cohort (800-1,200 followers): median = 5K views
- Z-score: (250K - 5K) / stdDev = ~15+
- DPS Score: 95 (mega-viral)
- **Result: Video correctly identified as viral despite "only" 250K views**

### 2. Keyword-Based Scraping

**Old Approach:** Scrape specific creators
- Misses new creators
- Biased toward established accounts

**New Approach:** Scrape by keywords + low view threshold
- Captures content from ALL creator sizes
- Keyword relevance ensures topical fit
- Low 10K threshold catches early viral signals

### 3. DPS Scoring Formula

```javascript
DPS Score (0-100) =
  (Z-score normalized * 55%) +
  (Engagement rate * 22%) +
  (Time decay factor * 13%) +
  (Identity Container * 10%)

Where:
- Z-score: Standard deviations from cohort mean
- Engagement: (likes + comments + shares) / views
- Time decay: Exponential decay based on age
- Identity Container: Caption authenticity score

Classifications:
- Normal: 0-69
- Viral: 70-79
- Mega-viral: 80-100
```

### 4. Research Report Format

```json
{
  "niche": "personal-finance",
  "displayName": "Personal Finance",
  "statistics": {
    "totalVideosScraped": 788,
    "viralVideosFound": 87,
    "viralityRate": "11.0%",
    "avgDPS": 62.3,
    "cohortDistribution": {
      "micro (0-10K)": 34,
      "small (10K-100K)": 41,
      "medium (100K-1M)": 10,
      "large (1M+)": 2
    }
  },
  "insights": {
    "topPerformingCohort": "small (10K-100K)"
  },
  "topVideos": [...]
}
```

## Integration with Existing Features

### Connection to 7 Idea Legos

1. Run viral research pipeline for your niche
2. Review extracted patterns (Phase 4)
3. Map patterns → your 7 Idea Legos
4. Identify which legos appear most in viral content
5. Use data-backed recommendations for content creation

### Connection to FEAT-070 (Pre-Content Prediction)

1. Research reports provide training data (1,500+ viral videos)
2. Patterns library shows what works (200+ viral patterns)
3. Pre-content prediction matches user script → patterns
4. Returns: predicted DPS, confidence, recommendations
5. Learning loop: compare predictions vs actual DPS to improve

## Next Steps

### Immediate (Today)
1. ✅ Apply database migrations
2. ✅ Test orchestrator with personal-finance
3. ✅ Review results in HIL UI
4. Run transcription for remaining videos

### Short-term (This Week)
5. Integrate FEAT-003 pattern extraction
6. Integrate FEAT-060 knowledge extraction
7. Run full pipeline for all 20 niches
8. Generate master summary report

### Medium-term (Next 2 Weeks)
9. Build pattern → Idea Legos mapping
10. Create pre-content prediction endpoint
11. Implement learning loop (predictions vs actuals)
12. Build niche-specific prediction models

## Troubleshooting

### Issue: DPS columns don't exist
**Solution:** Apply migrations in Supabase SQL Editor (Step 1 above)

### Issue: No viral videos found
**Possible causes:**
- Videos don't have transcripts yet (run transcription first)
- DPS scores not calculated yet (Phase 3 does this)
- View counts too low (scrape more videos or adjust minViews in config)

### Issue: Rate limiting errors
**Solution:**
- Use `transcribe-slow-safe.js` (respects 1 req/sec limit)
- Consider paid tikwm tier or alternative services

### Issue: Cohort has insufficient data
**Meaning:** Fewer than 10 videos in that follower cohort
**Solution:** Scrape more videos or widen cohort bounds

## Files Summary

```
config/
  └─ niche-keywords.json              # 20 niche configs

scripts/
  ├─ orchestrate-viral-research.js    # Main orchestrator
  ├─ transcribe-slow-safe.js          # Rate-limited transcription
  └─ apply-dps-migrations.js          # Migration helper

src/app/admin/
  └─ research-review/
     └─ page.tsx                      # HIL review UI

supabase/migrations/
  ├─ 20251002_add_dps_to_scraped_videos.sql
  └─ 20251015_extend_dps_columns.sql

Output directories (auto-created):
  ├─ pipeline-progress/               # Per-niche progress JSON
  └─ research-reports/                # Per-niche research reports
```

## Performance Estimates

**Per Niche:**
- Scraping: ~5 minutes (Apify)
- Transcription: ~17 minutes (500 videos @ 2 sec each)
- DPS Calculation: ~2 minutes (cohort processing)
- Pattern Extraction: ~5 minutes (OpenAI API)
- Knowledge Extraction: ~3 minutes (multi-LLM)
- **Total: ~30 minutes per niche**

**All 20 Niches:**
- Sequential: ~10 hours
- With parallel transcription: ~6 hours

## Success Metrics

After running full pipeline, you should have:

- ✅ 10,000 videos scraped across 20 niches
- ✅ 8,000+ transcribed (80% success rate typical)
- ✅ 1,500-2,000 viral videos identified (DPS ≥70)
- ✅ 200-300 viral patterns extracted
- ✅ 20 research reports (1 per niche)
- ✅ Cohort distribution showing viral content comes from all creator sizes
- ✅ Data-backed insights for your 7 Idea Legos framework

## Questions?

Check the code comments in:
- `scripts/orchestrate-viral-research.js` (detailed phase documentation)
- `src/lib/services/dps/dps-calculation-engine.ts` (DPS algorithm)
- `config/niche-keywords.json` (niche configuration format)
