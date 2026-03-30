# Niche Keywords System: Database Design

**Status**: Ready for Implementation
**Migration**: `20251118_niche_keywords_system.sql`
**Current State**: ~250 keywords across 4 niches
**Target State**: 1000+ keywords across 20 niches (50 per niche)

---

## Overview

The Niche Keywords System manages a dynamic, timestamped collection of viral keywords used for content scraping and trend detection. It solves the problem of keyword decay (trends die, keywords become stale) by implementing an **active → archive → replace** lifecycle with performance tracking.

---

## Architecture

### Four Tables + Three Views

```
┌─────────────────────────────────────────────────────────────────┐
│                        CORE TABLES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. niches (Reference Table)                                    │
│     └─ 20 niches × 50 keywords each = 1000 total target        │
│                                                                 │
│  2. niche_keywords (Main Keywords Table)                        │
│     ├─ keyword text, type (hashtag/phrase/question)            │
│     ├─ status (active/reserved/archived/testing)               │
│     ├─ timestamps (added_at, last_used_at, archived_at)        │
│     ├─ performance metrics (trending_score, virality_correlation)│
│     └─ usage stats (times_used, viral_videos_found)            │
│                                                                 │
│  3. keyword_performance_snapshots (Time-Series History)         │
│     └─ Weekly snapshots showing trending_score over time       │
│                                                                 │
│  4. keyword_rotation_log (Audit Trail)                          │
│     └─ Records when/why keywords moved active → archived       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                        VIEWS (Read-Only)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. active_keywords_by_niche                                    │
│     └─ Quick lookup for scraping (only active keywords)        │
│                                                                 │
│  2. keyword_health_dashboard                                    │
│     └─ Admin monitoring (active vs archived count per niche)   │
│                                                                 │
│  3. keywords_needing_rotation                                   │
│     └─ Decision support (which keywords should be archived?)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Table 1: `niches` (Reference Table)

**Purpose**: Master list of 20 viral content categories

### Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(50) | Primary key (e.g., "personal-finance") |
| `name` | VARCHAR(100) | Display name (e.g., "Personal Finance & Money") |
| `description` | TEXT | What the niche covers |
| `category` | VARCHAR(50) | Grouping (money, health, lifestyle, etc.) |
| `target_keyword_count` | INTEGER | Goal: 50 keywords per niche |
| `created_at` | TIMESTAMPTZ | When niche was added |
| `updated_at` | TIMESTAMPTZ | Last modified |

### Example Data

```sql
id: "personal-finance"
name: "Personal Finance & Money"
description: "Money-making, investing, side hustles, financial freedom"
category: "money"
target_keyword_count: 50
```

### Why This Design?

- **Decouples niches from keywords**: Can change niche definitions without affecting keywords
- **Target tracking**: Admin can see "we have 48/50 keywords for personal-finance" (keyword_health_dashboard view)
- **Category grouping**: Group related niches (all "money" niches together)

---

## Table 2: `niche_keywords` (Main Keywords Table)

**Purpose**: Master inventory of all keywords with status lifecycle and performance tracking

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `niche_id` | VARCHAR(50) | FK → niches | Which niche this keyword belongs to |
| `keyword` | TEXT | Required | The actual keyword (e.g., "#passiveincome") |
| `keyword_type` | VARCHAR(20) | hashtag/phrase/question | Type classification |
| **Status Lifecycle** |
| `status` | VARCHAR(20) | active/reserved/archived/testing | Current state |
| `added_at` | TIMESTAMPTZ | Default NOW() | When keyword was created |
| `first_used_at` | TIMESTAMPTZ | Nullable | First scraping use |
| `last_used_at` | TIMESTAMPTZ | Nullable | Most recent scraping use |
| `last_verified_at` | TIMESTAMPTZ | Nullable | Last performance check |
| `archived_at` | TIMESTAMPTZ | Nullable | When archived (if status = 'archived') |
| **Performance Metrics** |
| `estimated_search_volume` | INTEGER | Nullable | Monthly search volume |
| `trending_score` | NUMERIC(3,2) | 0.00-1.00 | How "hot" the keyword is RIGHT NOW |
| `virality_correlation` | NUMERIC(3,2) | 0.00-1.00 | Historical: % of results that are viral (DPS > 70) |
| `scrape_success_rate` | NUMERIC(3,2) | 0.00-1.00 | % of searches returning quality results |
| **Usage Stats** |
| `times_used` | INTEGER | Default 0 | How many scraping operations used this keyword |
| `videos_found` | INTEGER | Default 0 | Total videos found using this keyword |
| `viral_videos_found` | INTEGER | Default 0 | Videos with DPS > 70 |
| **Archive Metadata** |
| `archive_reason` | TEXT | Nullable | Why archived (if archived) |
| `replaced_by_keyword_id` | UUID | FK → niche_keywords | Replacement keyword (if superseded) |
| **Provenance** |
| `source` | VARCHAR(50) | Default 'manual' | How discovered (manual/trend_api/competitor) |
| `notes` | TEXT | Nullable | Admin notes |

### Status Lifecycle

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌──────────┐
│ reserved│────────▶│ testing │────────▶│ active  │────────▶│ archived │
└─────────┘         └─────────┘         └─────────┘         └──────────┘
    │                                         │                    │
    │                                         │                    │
    └─────────────────────────────────────────┘                    │
                      (direct activation)                          │
                                                                    │
                          (can be unarchived if trend returns) ────┘
```

**Status Definitions**:

- **reserved**: Keyword identified for future use (not yet tested)
- **testing**: Being evaluated (< 10 scraping operations)
- **active**: In production use for scraping
- **archived**: No longer used (trend died, poor performance, superseded)

### Key Metrics Explained

#### 1. `trending_score` (0.00 - 1.00)

**What it measures**: How "hot" the keyword is RIGHT NOW (decay over time)

**Formula** (implemented in `update_keyword_trending_scores()` function):

```
IF last_used_at > 90 days ago:
  trending_score = 0.05 (stale)

ELSE IF last_used_at > 30 days ago:
  trending_score = 0.20 (aging)

ELSE:
  trending_score = (viral_videos_found / times_used) × recency_weight
  WHERE recency_weight = 1.0 - (days_since_last_use / 30)
```

**Use case**: Prioritize keywords with high trending_score for scraping

**Thresholds**:
- `< 0.10`: Dead (archive candidate)
- `0.10 - 0.30`: Declining
- `0.30 - 0.60`: Stable
- `0.60 - 1.00`: Rising

#### 2. `virality_correlation` (0.00 - 1.00)

**What it measures**: Historical performance - how often this keyword finds viral content

**Formula**:

```
virality_correlation = viral_videos_found / videos_found
```

**Use case**: Identify high-ROI keywords (find viral content reliably)

**Thresholds**:
- `< 0.10`: Poor (archive if times_used > 50)
- `0.10 - 0.30`: Below average
- `0.30 - 0.60`: Good
- `> 0.60`: Excellent (gold mine keyword)

#### 3. `scrape_success_rate` (0.00 - 1.00)

**What it measures**: How often scraping this keyword returns ANY results (not just viral)

**Formula**:

```
scrape_success_rate = scrapes_with_results / times_used
```

**Use case**: Identify "dry" keywords (no content) vs "rich" keywords (lots of content)

---

## Table 3: `keyword_performance_snapshots` (Time-Series)

**Purpose**: Track keyword performance over time for trend detection

### Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `keyword_id` | UUID | FK → niche_keywords |
| `snapshot_date` | DATE | The date of this snapshot |
| `snapshot_type` | VARCHAR(20) | daily/weekly/monthly |
| `search_volume` | INTEGER | Estimated search volume at this time |
| `trending_score` | NUMERIC(3,2) | trending_score at this point in time |
| `scrape_results_count` | INTEGER | Videos found in this period |
| `viral_results_count` | INTEGER | Viral videos found (DPS > 70) |
| `avg_dps_of_results` | NUMERIC(5,2) | Average DPS of all videos found |
| `velocity` | VARCHAR(20) | rising/stable/declining/dead |
| `created_at` | TIMESTAMPTZ | When snapshot was captured |

### Unique Constraint

```sql
UNIQUE(keyword_id, snapshot_date, snapshot_type)
```

One snapshot per keyword per date per type.

### Use Cases

1. **Trend Detection**: See if keyword is rising or declining over time
2. **Archive Decisions**: If velocity = 'dead' for 4 consecutive weeks → archive
3. **Discovery**: Find keywords that were archived but are now rising again (resurrect?)
4. **Reporting**: Generate performance reports showing keyword health over time

### Example Query: Keywords with Rising Velocity

```sql
SELECT
  nk.keyword,
  kps.snapshot_date,
  kps.trending_score,
  kps.velocity
FROM niche_keywords nk
JOIN keyword_performance_snapshots kps ON kps.keyword_id = nk.id
WHERE kps.velocity = 'rising'
  AND kps.snapshot_date >= NOW() - INTERVAL '30 days'
ORDER BY kps.trending_score DESC;
```

---

## Table 4: `keyword_rotation_log` (Audit Trail)

**Purpose**: Historical record of all keyword status changes (especially active → archived)

### Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `keyword_id` | UUID | FK → niche_keywords |
| `old_status` | VARCHAR(20) | Status before change |
| `new_status` | VARCHAR(20) | Status after change |
| `rotation_reason` | TEXT | Why the change was made |
| `final_trending_score` | NUMERIC(3,2) | trending_score at time of rotation |
| `final_virality_correlation` | NUMERIC(3,2) | virality_correlation at time of rotation |
| `total_videos_found` | INTEGER | Lifetime videos_found |
| `total_viral_videos` | INTEGER | Lifetime viral_videos_found |
| `rotated_by` | VARCHAR(100) | Admin user or 'system' |
| `rotated_at` | TIMESTAMPTZ | When change occurred |
| `replaced_by_keyword_id` | UUID | FK → niche_keywords (if replaced) |

### Use Cases

1. **Accountability**: Track who archived keywords and why
2. **Performance Analysis**: "Why did we archive '#passiveincome'?" → Check final_trending_score
3. **Replacement Tracking**: If keyword was replaced, link to new keyword
4. **Audit Compliance**: Historical record of all keyword lifecycle changes

### Example Rotation Entry

```json
{
  "keyword_id": "uuid-123",
  "old_status": "active",
  "new_status": "archived",
  "rotation_reason": "low_trending_score: 0.08 for 4 consecutive weeks",
  "final_trending_score": 0.08,
  "final_virality_correlation": 0.12,
  "total_videos_found": 453,
  "total_viral_videos": 12,
  "rotated_by": "system",
  "rotated_at": "2025-11-18 10:00:00",
  "replaced_by_keyword_id": "uuid-456"
}
```

---

## Views (Read-Only)

### View 1: `active_keywords_by_niche`

**Purpose**: Quick lookup for scraping operations (only active keywords)

**What it returns**:
- All active keywords grouped by niche
- Sorted by trending_score DESC (prioritize hot keywords)

**Example Query**:

```sql
SELECT * FROM active_keywords_by_niche
WHERE niche_id = 'personal-finance'
LIMIT 10;
```

**Output**:

| niche_name | keyword | trending_score | viral_videos_found |
|------------|---------|----------------|-------------------|
| Personal Finance & Money | #passiveincome | 0.82 | 43 |
| Personal Finance & Money | #financialfreedom | 0.76 | 38 |
| Personal Finance & Money | #sidehustle | 0.71 | 29 |

---

### View 2: `keyword_health_dashboard`

**Purpose**: Admin monitoring - see keyword inventory health per niche

**What it returns**:
- Per-niche breakdown: active/reserved/archived/testing counts
- Average trending_score and virality_correlation for active keywords
- Total viral videos found per niche
- Last scraping date

**Example Output**:

| niche_name | target | active | reserved | archived | testing | avg_trending | avg_virality | total_viral_videos | last_scrape |
|------------|--------|--------|----------|----------|---------|--------------|--------------|-------------------|-------------|
| Personal Finance | 50 | 48 | 5 | 12 | 2 | 0.65 | 0.38 | 342 | 2025-11-18 |
| Fitness & Health | 50 | 35 | 8 | 20 | 3 | 0.52 | 0.29 | 178 | 2025-11-17 |

**Use case**: Admin sees "Personal Finance has 48/50 active keywords (good), Fitness only has 35/50 (need more)"

---

### View 3: `keywords_needing_rotation`

**Purpose**: Decision support - which active keywords should be archived?

**What it returns**:
- Active keywords meeting archive criteria:
  - trending_score < 0.20 (low trending)
  - virality_correlation < 0.15 (poor performance)
  - times_used > 100 but viral_videos_found < 5 (exhausted)
  - last_used_at > 90 days ago (stale)
- rotation_reason explaining why
- rotation_priority (high/medium/low)

**Example Output**:

| keyword | trending_score | virality_correlation | times_used | viral_videos_found | rotation_reason | rotation_priority |
|---------|----------------|---------------------|------------|-------------------|----------------|------------------|
| #makemoneyfast | 0.08 | 0.04 | 127 | 2 | low_trending | high |
| #investmentadvice | 0.15 | 0.11 | 89 | 8 | low_correlation | medium |
| #wealthmindset | 0.18 | 0.22 | 34 | 6 | stale (180 days) | low |

**Use case**: Admin reviews this list weekly, archives keywords, replaces with new ones

---

## Automated Functions

### Function 1: `update_keyword_trending_scores()`

**What it does**: Recalculates trending_score for all active/testing keywords based on recent performance

**When to run**: Weekly (Sunday 00:00 UTC via cron job)

**Logic**:
1. For each active/testing keyword:
   - If last_used_at > 90 days ago → trending_score = 0.05 (stale)
   - Else if last_used_at > 30 days ago → trending_score = 0.20 (aging)
   - Else → trending_score = (viral_videos_found / times_used) × recency_weight
2. Update niche_keywords.trending_score

**Example call**:

```sql
SELECT update_keyword_trending_scores();
```

---

### Function 2: `auto_archive_underperforming_keywords()`

**What it does**: Automatically archives keywords meeting any of these criteria:
1. trending_score < 0.10 (dead)
2. times_used ≥ 50 AND virality_correlation < 0.10 (poor performer)
3. last_used_at > 180 days ago (abandoned)

**When to run**: Monthly (1st of month via cron job)

**What it returns**: Count of archived keywords + list of keywords archived

**Logic**:
1. Find all active keywords meeting archive criteria
2. UPDATE status to 'archived', set archived_at = NOW()
3. Set archive_reason based on which criteria triggered it
4. Log rotation in keyword_rotation_log table
5. Return results

**Example call**:

```sql
SELECT * FROM auto_archive_underperforming_keywords();
```

**Output**:

```
archived_count: 8
keywords_archived: ['#makemoneyfast', '#investmentadvice', '#cryptoscam', ...]
```

---

## Keyword Lifecycle Workflow

### Phase 1: Discovery

**Manual Addition** (current state):

```sql
INSERT INTO niche_keywords (niche_id, keyword, keyword_type, status, source)
VALUES ('personal-finance', '#passiveincome', 'hashtag', 'testing', 'manual');
```

**Future: Automated Discovery** (Phase 1+):
- Trend APIs (Google Trends, TikTok Trends)
- Competitor analysis (scrape top creators' hashtags)
- LLM-generated variations of existing keywords

---

### Phase 2: Testing (Status = 'testing')

**Goal**: Evaluate if keyword produces quality results

**Process**:
1. Use keyword in 10 scraping operations
2. Track videos_found and viral_videos_found
3. Calculate virality_correlation = viral_videos_found / videos_found

**Decision**:
- If virality_correlation ≥ 0.20 after 10 uses → Move to 'active'
- If virality_correlation < 0.20 after 10 uses → Move to 'archived' with reason 'failed_testing'

---

### Phase 3: Active Use (Status = 'active')

**Goal**: Use keyword for scraping, track performance over time

**Process**:
1. Scraper pulls keywords from `active_keywords_by_niche` view
2. After each scraping operation:
   - Increment times_used
   - Update videos_found
   - Update viral_videos_found (if any DPS > 70)
   - Update last_used_at
3. Weekly: Run `update_keyword_trending_scores()` to recalculate trending_score
4. Weekly: Take snapshot in keyword_performance_snapshots

**Monitoring**:
- Admin checks `keyword_health_dashboard` to see per-niche health
- Admin checks `keywords_needing_rotation` to see archive candidates

---

### Phase 4: Archive Decision

**Triggers** (any of these):
1. **Automatic**: `auto_archive_underperforming_keywords()` runs monthly
2. **Manual**: Admin reviews `keywords_needing_rotation` view and archives manually
3. **Replacement**: Admin finds better keyword, archives old one, links to replacement

**Archive Reasons**:
- `low_trending_score`: trending_score < 0.10
- `poor_virality_correlation`: times_used ≥ 50 AND virality_correlation < 0.10
- `not_used_180_days`: last_used_at > 180 days ago
- `superseded`: Better keyword found (link to replaced_by_keyword_id)
- `seasonal`: Trend is seasonal (e.g., "#newyearsresolution" archived in June)
- `duplicate`: Duplicate of another keyword

**Archive Process**:
1. UPDATE niche_keywords SET status = 'archived', archived_at = NOW(), archive_reason = '...'
2. INSERT INTO keyword_rotation_log (record the change)
3. (Optional) Add replacement keyword to niche_keywords with status = 'testing'

---

### Phase 5: Replacement

**When old keyword archived, add replacement**:

```sql
-- Archive old keyword
UPDATE niche_keywords
SET status = 'archived',
    archived_at = NOW(),
    archive_reason = 'superseded',
    replaced_by_keyword_id = 'uuid-of-new-keyword'
WHERE id = 'uuid-of-old-keyword';

-- Add new keyword
INSERT INTO niche_keywords (niche_id, keyword, keyword_type, status, source)
VALUES ('personal-finance', '#passiveincomestream', 'hashtag', 'testing', 'manual');

-- Log rotation
INSERT INTO keyword_rotation_log (keyword_id, old_status, new_status, rotation_reason, rotated_by, replaced_by_keyword_id)
VALUES ('uuid-of-old-keyword', 'active', 'archived', 'superseded by better keyword', 'admin_user', 'uuid-of-new-keyword');
```

---

## Migration Plan: 250 → 1000+ Keywords

### Current State (as of 2025-11-18)

**Framework- Niche Keywords 11-16-25.md** contains ~250 keywords across 4 niches:
1. Personal Finance: ~83 keywords
2. Fitness: ~53 keywords
3. Business/Entrepreneurship: ~60 keywords
4. Food/Nutrition: ~54 keywords

**Missing**: 16 niches (0 keywords each)

---

### Target State

**1000+ keywords across 20 niches** (50 keywords per niche minimum)

---

### Migration Strategy

#### Step 1: Import Existing 250 Keywords

**Script**: `scripts/import-niche-keywords-from-framework.ts`

**Process**:
1. Parse [Framework- Niche Keywords 11-16-25.md](file:///C:/Projects/CleanCopy/frameworks-and-research/POC%20Research%20&%20Framework%20Data/Framework-%20Niche%20Keywords%2011-16-25.md)
2. Extract keywords per niche
3. Classify keyword_type:
   - Starts with '#' → 'hashtag'
   - Starts with 'how to' / 'what' / 'why' → 'question'
   - Everything else → 'phrase'
4. Insert into niche_keywords with status = 'active' (these are already validated)

**Example**:

```typescript
// Personal Finance section
const keywords = [
  'personal finance tips 2025',
  'best finance influencers',
  'how to invest for beginners',
  // ... etc
];

for (const keyword of keywords) {
  const type = keyword.startsWith('#') ? 'hashtag' :
               keyword.startsWith('how to') ? 'question' : 'phrase';

  await supabase.from('niche_keywords').insert({
    niche_id: 'personal-finance',
    keyword: keyword,
    keyword_type: type,
    status: 'active',
    source: 'framework_migration',
    added_at: new Date()
  });
}
```

---

#### Step 2: Generate 750 New Keywords (16 niches × ~47 keywords each)

**Two approaches**:

**Approach A: Manual Research** (high quality, slow)
- Research each niche on TikTok, Instagram, YouTube
- Identify trending hashtags, popular phrases
- Extract from top creators in each niche
- Manually add to database

**Approach B: LLM-Assisted Generation** (fast, needs validation)
- For each niche, prompt GPT-4 to generate 50 keywords
- Review and filter out low-quality suggestions
- Add as status = 'testing' (need to validate performance)

**Recommended**: Hybrid approach
1. Use LLM to generate 50 keywords per niche (fast)
2. Add as status = 'testing'
3. Over 2-4 weeks, test performance
4. Keep high performers (virality_correlation > 0.20), archive rest
5. Backfill with manual research as needed

---

#### Step 3: Continuous Improvement

**Weekly**:
1. Run `update_keyword_trending_scores()` to recalculate trending_score
2. Take snapshots in keyword_performance_snapshots
3. Review keywords_needing_rotation view

**Monthly**:
1. Run `auto_archive_underperforming_keywords()`
2. Review archived keywords, replace with new ones
3. Check keyword_health_dashboard - ensure each niche has 45-50 active keywords

**Quarterly**:
1. Major keyword refresh: add 20-30 new keywords across all niches
2. Review archived keywords - resurrect any with rising trends
3. Analyze top performers - find patterns for future keyword generation

---

## Performance Considerations

### Indexes

**Critical indexes for scraping performance**:

```sql
CREATE INDEX idx_niche_keywords_niche_id ON niche_keywords(niche_id);
CREATE INDEX idx_niche_keywords_status ON niche_keywords(status);
CREATE INDEX idx_niche_keywords_trending_score ON niche_keywords(trending_score DESC);
```

**Query**: "Get top 10 active keywords for personal-finance niche"

```sql
SELECT * FROM active_keywords_by_niche
WHERE niche_id = 'personal-finance'
LIMIT 10;
```

**Execution**: Index scan on (niche_id, status, trending_score) → Fast (<5ms)

---

### Full-Text Search

**For keyword discovery/search**:

```sql
CREATE INDEX idx_niche_keywords_keyword_search
ON niche_keywords USING gin(to_tsvector('english', keyword));
```

**Query**: "Find all keywords containing 'invest'"

```sql
SELECT keyword, niche_id, trending_score
FROM niche_keywords
WHERE to_tsvector('english', keyword) @@ to_tsquery('english', 'invest')
  AND status = 'active'
ORDER BY trending_score DESC;
```

---

## Integration with Scraping System

### Current Scraping Workflow

**src/lib/services/viral-prediction/niche-framework-definitions.ts** hardcodes keywords:

```typescript
keywords: [
  '#money', '#investing', '#sidehustle', '#financialfreedom',
  // ... 6 more
]
```

**Problem**: Static, can't update without code change

---

### New Scraping Workflow (Post-Migration)

**1. Fetch Active Keywords from Database**:

```typescript
// src/lib/services/keywords/keyword-service.ts
export async function getActiveKeywords(nicheId: string, limit: number = 10): Promise<Keyword[]> {
  const { data, error } = await supabase
    .from('active_keywords_by_niche')
    .select('*')
    .eq('niche_id', nicheId)
    .order('trending_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
```

**2. Use Keywords in Scraping**:

```typescript
// Scraping logic
const keywords = await getActiveKeywords('personal-finance', 10);

for (const kw of keywords) {
  const results = await apifyClient.scrapeByKeyword(kw.keyword);

  // Update usage stats
  await supabase.from('niche_keywords').update({
    times_used: kw.times_used + 1,
    videos_found: kw.videos_found + results.length,
    viral_videos_found: kw.viral_videos_found + results.filter(v => v.dps > 70).length,
    last_used_at: new Date()
  }).eq('id', kw.keyword_id);
}
```

**3. Weekly: Recalculate Trending Scores**:

```typescript
// cron job
await supabase.rpc('update_keyword_trending_scores');
```

---

## Admin Interface (Future)

### Keywords Dashboard

**URL**: `/admin/keywords`

**Features**:
1. **Health Overview**: Show keyword_health_dashboard (active/archived counts per niche)
2. **Add New Keywords**: Form to add keywords (niche selector, keyword text, type)
3. **Review Rotation Candidates**: Show keywords_needing_rotation view, allow bulk archive
4. **Performance Charts**: Line charts showing trending_score over time per keyword
5. **Archive Explorer**: Search archived keywords, resurrect if trend returns

---

## Summary

### What This System Solves

1. **Keyword Decay**: Trends die → automatic archiving based on performance
2. **Manual Overhead**: Automate keyword rotation, reduce admin work
3. **Poor ROI**: Track virality_correlation, focus on high-performing keywords
4. **Scalability**: Database-driven instead of hardcoded → easy to add/remove keywords
5. **Accountability**: Full audit trail (keyword_rotation_log) of all changes
6. **Discovery**: Performance snapshots enable trend detection (rising keywords)

---

### Key Metrics

| Metric | What It Measures | Use Case |
|--------|------------------|----------|
| `trending_score` | How hot the keyword is RIGHT NOW (decay over time) | Prioritize scraping |
| `virality_correlation` | Historical: % of results that are viral (DPS > 70) | Identify gold mine keywords |
| `scrape_success_rate` | % of searches returning ANY results | Identify dry vs rich keywords |

---

### Next Steps

1. **Run Migration**: `supabase migration apply 20251118_niche_keywords_system.sql`
2. **Import Existing 250 Keywords**: Create script to parse Framework- Niche Keywords 11-16-25.md
3. **Generate 750 New Keywords**: LLM-assisted generation for 16 missing niches
4. **Test & Validate**: Add new keywords as status = 'testing', evaluate performance
5. **Integrate with Scraper**: Update scraping logic to fetch keywords from database
6. **Weekly Cron Job**: Run `update_keyword_trending_scores()` every Sunday
7. **Monthly Cron Job**: Run `auto_archive_underperforming_keywords()` on 1st of month

---

**Status**: ✅ Schema Design Complete - Ready for User Approval
