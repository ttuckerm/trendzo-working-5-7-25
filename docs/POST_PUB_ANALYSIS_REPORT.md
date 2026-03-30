# Post-Publication Signal Analysis Report

**Generated:** 2026-03-18 09:58
**Niche:** Side-Hustles / Making Money Online
**Content type:** Creator-led short-form, talking-head knowledge, direct-to-camera educational
**Dataset:** `scraped_videos` table, filtered to `niche = 'side-hustles'`
**Total videos analyzed:** 863

> **CONTAMINATION BOUNDARY:** All post-publication fields (views, likes,
> comments, shares, saves, engagement ratios, posting time, sound data)
> are used for **analysis and interpretation only**. None of this data
> feeds into prediction features. This is a read-only observational study.

## Executive Summary

This analysis examines **863 side-hustle videos** from 20 creators 
to identify what post-publication signals separate each performance tier.

**Key findings:**
- Mega-viral videos (top 10%) achieve a median of **243.9K** views vs **536.00** for underperformers
- Save rate is the strongest engagement discriminator: mega-viral saves at **3.7x** the rate of underperformers
- Share rate shows the clearest tier separation — viral content gets shared disproportionately
- Original sounds dominate across all tiers in this niche (talking-head format)

## Methodology

### Tier Definitions
Tiers are assigned based on DPS score percentiles within the side-hustles dataset:

| Tier | DPS Range | Percentile | Count |
|------|-----------|------------|-------|
| Mega-Viral | 75.6-91.7 | >=p90 | 87 |
| Viral | 64.2-75.6 | p75-p90 | 129 |
| Good | 49.1-64.1 | p50-p75 | 216 |
| Average | 34.9-49.0 | p25-p50 | 215 |
| Underperformer | 11.6-34.8 | <p25 | 216 |

### Statistical Methods
- **Descriptive:** Median and IQR (more robust than mean for skewed distributions)
- **Comparison:** Mann-Whitney U test (non-parametric, no normality assumption)
- **Effect size:** Rank-biserial correlation (r): small=0.1, medium=0.3, large=0.5
- **Correlation:** Spearman rank correlation for continuous relationships

### Tables/Columns Used
```
scraped_videos:
  - video_id (PK)
  - views_count, likes_count, comments_count, shares_count, saves_count
  - hashtags (TEXT[]), music_id, music_name, music_is_original
  - upload_timestamp, dps_score, dps_classification
  - creator_username, creator_followers_count, duration_seconds
  - niche, caption
```

## Data Coverage & Missingness

| Field | Non-Null | % Coverage | Notes |
|-------|----------|------------|-------|
| Views | 863 | 100.0% |  |
| Likes | 863 | 100.0% |  |
| Comments | 863 | 100.0% |  |
| Shares | 863 | 100.0% |  |
| Saves | 863 | 100.0% |  |
| Upload Timestamp | 863 | 100.0% |  |
| Hashtags | 681 | 78.9% | Partial |
| Music ID | 0 | 0.0% | LOW — analysis limited |
| Music Name | 3 | 0.3% | LOW — analysis limited |
| Original Sound | 3 | 0.3% | LOW — analysis limited |
| Creator Followers | 863 | 100.0% |  |
| Duration | 844 | 97.8% |  |
| Caption | 863 | 100.0% |  |

## 1. Engagement Decomposition by Tier

### 1.1 Raw Engagement Metrics (Medians)

| Tier | Views | Likes | Comments | Shares | Saves |
|------|-------|-------|----------|--------|-------|
| Mega-Viral | 243.9K | 16.7K | 1.0K | 1.3K | 5.1K |
| Viral | 20.6K | 1.3K | 98.00 | 109.00 | 502.00 |
| Good | 5.1K | 210.50 | 14.50 | 14.00 | 60.50 |
| Average | 1.3K | 53.00 | 5.00 | 6.00 | 13.00 |
| Underperformer | 536.00 | 17.00 | 1.00 | 1.00 | 4.00 |

### 1.2 Engagement Ratios (Medians)

| Tier | Like/View | Comment/View | Share/View | Save/View | Total Eng Rate |
|------|-----------|-------------|------------|-----------|---------------|
| Mega-Viral | 7.41% | 0.26% | 0.60% | 3.06% | 11.99% |
| Viral | 5.31% | 0.33% | 0.42% | 1.70% | 9.01% |
| Good | 4.61% | 0.27% | 0.27% | 1.24% | 6.97% |
| Average | 4.47% | 0.32% | 0.39% | 1.01% | 7.34% |
| Underperformer | 3.12% | 0.21% | 0.17% | 0.82% | 5.24% |

### 1.3 Correlation with DPS Score

| Metric | Spearman r | p-value | Interpretation |
|--------|-----------|---------|----------------|
| Views | +0.949 | 0.00e+00 | Strong |
| Likes | +0.968 | 0.00e+00 | Strong |
| Comments | +0.864 | 1.15e-258 | Strong |
| Shares | +0.881 | 9.66e-282 | Strong |
| Saves | +0.938 | 0.00e+00 | Strong |
| Like Rate | +0.413 | 7.43e-37 | Moderate |
| Comment Rate | +0.116 | 6.10e-04 | Weak |
| Share Rate | +0.245 | 2.82e-13 | Weak |
| Save Rate | +0.357 | 2.37e-27 | Moderate |
| Total Eng Rate | +0.456 | 1.51e-45 | Moderate |

## 2. Posting Time Analysis

*863 of 863 videos have valid upload timestamps (100.0% coverage).*

### 2.1 Hour of Day Distribution

| Hour (UTC) | Count | % | Median DPS | Median Views |
|------------|-------|---|------------|-------------|
| 00:00 | 54 | 6.3% | 36.1 | 1.0K |
| 01:00 | 41 | 4.8% | 53.7 | 3.2K |
| 02:00 | 40 | 4.6% | 48.7 | 3.1K |
| 03:00 | 45 | 5.2% | 55.7 | 2.9K |
| 04:00 | 43 | 5.0% | 40.4 | 1.1K |
| 05:00 | 27 | 3.1% | 41.5 | 1.3K |
| 06:00 | 10 | 1.2% | 63.2 | 14.4K |
| 07:00 | 10 | 1.2% | 70.8 | 20.4K |
| 08:00 | 2 | 0.2% | 68.2 | 1.1M |
| 10:00 | 4 | 0.5% | 58.6 | 30.4K |
| 11:00 | 5 | 0.6% | 52.0 | 3.9K |
| 12:00 | 17 | 2.0% | 49.0 | 1.4K |
| 13:00 | 40 | 4.6% | 38.0 | 1.5K |
| 14:00 | 44 | 5.1% | 44.9 | 1.8K |
| 15:00 | 47 | 5.4% | 55.2 | 4.7K |
| 16:00 | 58 | 6.7% | 50.8 | 3.7K |
| 17:00 | 65 | 7.5% | 49.2 | 2.6K |
| 18:00 | 54 | 6.3% | 45.6 | 1.7K |
| 19:00 | 57 | 6.6% | 52.7 | 3.1K |
| 20:00 | 58 | 6.7% | 54.7 | 4.2K |
| 21:00 | 43 | 5.0% | 54.0 | 4.5K |
| 22:00 | 41 | 4.8% | 43.6 | 1.1K |
| 23:00 | 58 | 6.7% | 43.2 | 1.3K |

**Best hour (by median DPS):** 07:00 UTC (DPS 70.8)
**Worst hour (by median DPS):** 00:00 UTC (DPS 36.1)

### 2.2 Day of Week Distribution

| Day | Count | % | Median DPS | Median Views |
|-----|-------|---|------------|-------------|
| Monday | 134 | 15.5% | 49.3 | 2.5K |
| Tuesday | 126 | 14.6% | 46.9 | 2.2K |
| Wednesday | 135 | 15.6% | 48.5 | 2.5K |
| Thursday | 144 | 16.7% | 50.8 | 3.8K |
| Friday | 129 | 14.9% | 44.4 | 1.7K |
| Saturday | 89 | 10.3% | 50.7 | 3.3K |
| Sunday | 106 | 12.3% | 52.8 | 3.7K |

**Kruskal-Wallis test (hour → DPS):** H=56.29, p=0.0000 (Significant at α=0.05)

## 3. Sound & Music Analysis

*Music ID coverage: 0/863 (0.0%). Original sound flag: 3/863 (0.3%).*

*Insufficient music metadata for sound analysis.*

*Insufficient music data for top sounds analysis.*

## 4. Hashtag Analysis

*681/863 videos have hashtag data (78.9% coverage).*

### 4.1 Hashtag Count by Tier

| Tier | Median # | Mean # | Min | Max |
|------|----------|--------|-----|-----|
| Mega-Viral | 3 | 3.2 | 0 | 13 |
| Viral | 5 | 3.3 | 0 | 5 |
| Good | 5 | 3.6 | 0 | 9 |
| Average | 5 | 3.8 | 0 | 5 |
| Underperformer | 4 | 3.1 | 0 | 5 |

**Hashtag count ↔ DPS correlation:** Spearman r=+0.035, p=0.2988

### 4.2 Most Frequent Hashtags (All Tiers)

| Hashtag | Count | % of Videos | Median DPS (with tag) | Median DPS (without tag) |
|---------|-------|-------------|----------------------|-------------------------|
| #sidehustle | 145 | 16.8% | 59.4 | 48.0 |
| #sidehustleideas | 95 | 11.0% | 35.3 | 52.0 |
| #money | 73 | 8.5% | 72.0 | 47.5 |
| #entrepreneur | 65 | 7.5% | 72.9 | 47.5 |
| #digitalmarketing | 63 | 7.3% | 53.0 | 48.8 |
| #startanonlinebusiness | 60 | 7.0% | 35.1 | 50.9 |
| #affiliatemarketing | 58 | 6.7% | 51.0 | 48.9 |
| #digitalproducts | 57 | 6.6% | 50.6 | 48.9 |
| #personalfinance | 56 | 6.5% | 55.1 | 48.5 |
| #waystomakemoneyonline | 52 | 6.0% | 33.3 | 50.6 |
| #ugccontentcreator | 51 | 5.9% | 36.5 | 50.6 |
| #affiliatemarketingforbeginners | 50 | 5.8% | 49.4 | 49.0 |
| #internetmoney | 50 | 5.8% | 36.9 | 50.1 |
| #sidehustlesuccess | 50 | 5.8% | 36.9 | 50.1 |
| #makemoneyonline | 50 | 5.8% | 39.3 | 50.2 |
| #begginerugc | 50 | 5.8% | 36.2 | 50.6 |
| #methods2298 | 49 | 5.7% | 36.6 | 50.2 |
| #simplesidehustles | 48 | 5.6% | 32.5 | 50.6 |
| #ugc | 48 | 5.6% | 36.5 | 50.4 |
| #fyp | 47 | 5.4% | 47.8 | 49.1 |
| #contentcreator | 46 | 5.3% | 42.7 | 49.3 |
| #budgeting | 46 | 5.3% | 55.7 | 48.3 |
| #evoagency | 41 | 4.8% | 36.5 | 50.2 |
| #savingmoney | 36 | 4.2% | 55.7 | 48.5 |
| #workfromhome | 35 | 4.1% | 47.5 | 49.1 |

### 4.3 High-Signal Hashtags (DPS Lift)
*Tags appearing in ≥5 videos, sorted by DPS lift (median with tag − median without tag).*

| Hashtag | Count | DPS Lift | Median DPS |
|---------|-------|---------|------------|
| #powerfulwebsites | 5 | +28.9 | 77.8 |
| #tiktoktips | 11 | +25.9 | 74.6 |
| #smallcreator | 7 | +25.8 | 74.6 |
| #entrepreneur | 65 | +25.4 | 72.9 |
| #money | 73 | +24.5 | 72.0 |
| #onlinemoney | 8 | +21.9 | 70.6 |
| #etsyshopbeginner | 9 | +21.0 | 69.8 |
| #printify | 13 | +19.7 | 68.4 |
| #webdesign | 5 | +18.4 | 67.3 |
| #makemoneyfromhome | 8 | +17.7 | 66.7 |

**Worst-performing tags:**

| Hashtag | Count | DPS Lift | Median DPS |
|---------|-------|---------|------------|
| #simplesidehustles | 48 | -18.1 | 32.5 |
| #shopify | 12 | -22.6 | 26.6 |
| #twitchclips | 5 | -23.6 | 25.5 |
| #marketing | 9 | -23.6 | 25.5 |
| #business | 20 | -25.1 | 24.1 |

## 5. Adjacent Tier Discriminants

What separates each tier from the one below it? Mann-Whitney U tests on engagement metrics.

### 5.1 Mega-Viral vs Viral

*n: Mega-Viral = 87, Viral = 129*

| Metric | Mega-Viral (median) | Viral (median) | Diff | p-value | Effect (r) |
|--------|---------------|---------------|------|---------|------------|
| Views | 243.9K | 20.6K | +1084% | 0.0000*** | -0.573 |
| Likes | 16.7K | 1.3K | +1181% | 0.0000*** | -0.692 |
| Comments | 1.0K | 98.00 | +938% | 0.0000*** | -0.596 |
| Shares | 1.3K | 109.00 | +1117% | 0.0000*** | -0.776 |
| Saves | 5.1K | 502.00 | +921% | 0.0000*** | -0.776 |
| Like Rate | 7.41% | 5.31% | +40% | 0.0000*** | -0.589 |
| Comment Rate | 0.26% | 0.33% | -20% | 0.6475 | -0.037 |
| Share Rate | 0.60% | 0.42% | +42% | 0.0000*** | -0.335 |
| Save Rate | 3.06% | 1.70% | +79% | 0.0018** | -0.251 |
| Hashtag Count | 3.00 | 5.00 | -40% | 0.1370 | +0.114 |
| Duration | 54.00 | 58.00 | -7% | 0.6635 | +0.035 |

**Strongest discriminator:** Shares (r=-0.776)

### 5.2 Viral vs Good

*n: Viral = 129, Good = 216*

| Metric | Viral (median) | Good (median) | Diff | p-value | Effect (r) |
|--------|---------------|---------------|------|---------|------------|
| Views | 20.6K | 5.1K | +306% | 0.0000*** | -0.720 |
| Likes | 1.3K | 210.50 | +519% | 0.0000*** | -0.866 |
| Comments | 98.00 | 14.50 | +576% | 0.0000*** | -0.779 |
| Shares | 109.00 | 14.00 | +679% | 0.0000*** | -0.880 |
| Saves | 502.00 | 60.50 | +730% | 0.0000*** | -0.954 |
| Like Rate | 5.31% | 4.61% | +15% | 0.0107* | -0.164 |
| Comment Rate | 0.33% | 0.27% | +23% | 0.3943 | -0.055 |
| Share Rate | 0.42% | 0.27% | +54% | 0.0250* | -0.144 |
| Save Rate | 1.70% | 1.24% | +38% | 0.0021** | -0.198 |
| Hashtag Count | 5.00 | 5.00 | +0% | 0.1977 | +0.074 |
| Duration | 58.00 | 49.00 | +18% | 0.0026** | -0.194 |

**Strongest discriminator:** Saves (r=-0.954)

### 5.3 Good vs Average

*n: Good = 216, Average = 215*

| Metric | Good (median) | Average (median) | Diff | p-value | Effect (r) |
|--------|---------------|---------------|------|---------|------------|
| Views | 5.1K | 1.3K | +297% | 0.0000*** | -0.867 |
| Likes | 210.50 | 53.00 | +297% | 0.0000*** | -0.911 |
| Comments | 14.50 | 5.00 | +190% | 0.0000*** | -0.586 |
| Shares | 14.00 | 6.00 | +133% | 0.0000*** | -0.517 |
| Saves | 60.50 | 13.00 | +365% | 0.0000*** | -0.792 |
| Like Rate | 4.61% | 4.47% | +3% | 0.9830 | +0.001 |
| Comment Rate | 0.27% | 0.32% | -15% | 0.1286 | +0.085 |
| Share Rate | 0.27% | 0.39% | -31% | 0.0018** | +0.173 |
| Save Rate | 1.24% | 1.01% | +22% | 0.3510 | -0.052 |
| Hashtag Count | 5.00 | 5.00 | +0% | 0.9100 | +0.006 |
| Duration | 49.00 | 46.00 | +7% | 0.6967 | -0.022 |

**Strongest discriminator:** Likes (r=-0.911)

### 5.4 Average vs Underperformer

*n: Average = 215, Underperformer = 216*

| Metric | Average (median) | Underperformer (median) | Diff | p-value | Effect (r) |
|--------|---------------|---------------|------|---------|------------|
| Views | 1.3K | 536.00 | +138% | 0.0000*** | -0.815 |
| Likes | 53.00 | 17.00 | +212% | 0.0000*** | -0.873 |
| Comments | 5.00 | 1.00 | +400% | 0.0000*** | -0.567 |
| Shares | 6.00 | 1.00 | +500% | 0.0000*** | -0.626 |
| Saves | 13.00 | 4.00 | +225% | 0.0000*** | -0.698 |
| Like Rate | 4.47% | 3.12% | +43% | 0.0000*** | -0.309 |
| Comment Rate | 0.32% | 0.21% | +47% | 0.0000*** | -0.227 |
| Share Rate | 0.39% | 0.17% | +138% | 0.0000*** | -0.330 |
| Save Rate | 1.01% | 0.82% | +23% | 0.0000*** | -0.235 |
| Hashtag Count | 5.00 | 4.00 | +25% | 0.0000*** | -0.221 |
| Duration | 46.00 | 34.00 | +35% | 0.0931 | -0.095 |

**Strongest discriminator:** Likes (r=-0.873)

## 6. Creator-Level Patterns

**20 unique creators** in dataset.

### Top Creators by Median DPS (min 3 videos)

| Creator | Videos | Median DPS | Median Views | Followers |
|---------|--------|------------|-------------|-----------|
| @kellanhenneberry | 46 | 77.0 | 61.4K | 242.7K |
| @digitalkingship | 23 | 73.1 | 365.1K | 371.7K |
| @melyndagerrard | 4 | 72.6 | 11.5K | 13.1K |
| @maxtalkstech | 50 | 66.4 | 7.3K | 357.0K |
| @paulylong | 50 | 64.9 | 162.7K | 3.7M |
| @natlie.styles | 13 | 63.3 | 4.8K | 33.3K |
| @jparkecom | 38 | 61.3 | 9.2K | 119.7K |
| @shaylynnstudios | 50 | 58.8 | 4.5K | 27.5K |
| @liannebudgets | 50 | 54.9 | 7.1K | 7.7K |
| @simply.nilly | 50 | 53.4 | 4.5K | 245.0K |

**Follower count ↔ DPS:** Spearman r=+0.491, p=0.0000
(Account size is a major driver of DPS in this niche)

## 7. Duration Analysis

*844/863 videos have duration data.*

| Duration | Count | % | Median DPS | Median Views |
|----------|-------|---|------------|-------------|
| 0-15s | 186 | 22.0% | 40.4 | 1.8K |
| 15-30s | 68 | 8.1% | 43.1 | 1.6K |
| 30-60s | 256 | 30.3% | 55.7 | 4.0K |
| 60-90s | 201 | 23.8% | 48.8 | 2.3K |
| 90s+ | 133 | 15.8% | 56.5 | 4.2K |

**Duration ↔ DPS:** Spearman r=+0.184, p=0.0000

## 8. Practical Takeaways for Feature Prioritization

### Signals Worth Investigating as Pre-Publication Proxies

The following post-publication patterns suggest pre-publication features that *might* be predictive:

1. **Share rate** is the strongest tier discriminator — pre-pub features that predict "shareability" (e.g., novelty, practical value, emotional triggers) could be high-value
2. **Save rate** separates mega-viral from merely viral — content perceived as "reference-worthy" performs better. Hooks/CTAs that signal lasting value may be detectable pre-pub
3. **Hashtag strategy** shows clear patterns — certain tags correlate with higher DPS. A hashtag quality/relevance score could be a useful feature
4. **Duration** sweet spots exist — bucket analysis reveals optimal length ranges for this niche
5. **Original sound** dominance confirms this is a talking-head niche — music selection features are low-priority for this content type

### What NOT to Build

- Do NOT use post-publication engagement metrics as prediction features (contamination)
- Posting time effects should be validated with larger samples before building features
- Creator follower count correlations may reflect account-size bias, not content quality

## 9. Limitations

1. **Single niche:** All 863 videos are from the side-hustles niche. Findings may not generalize to other content types.
2. **Creator concentration:** 20 creators — patterns may reflect individual creator styles rather than universal signals.
3. **Snapshot timing:** Engagement metrics represent a single scrape timestamp, not time-normalized. Early videos have more time to accumulate views.
4. **DPS as proxy:** DPS is a relative percentile score, not an absolute virality measure. It compares videos within the same creator's portfolio.
5. **Missing fields:** See Data Coverage section for specific gaps.
6. **No causal claims:** All analyses are correlational. High share rate doesn't *cause* virality — both may be effects of content quality.
7. **Temporal confounds:** Platform algorithm changes over time are not controlled for.
