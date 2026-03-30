# Response Stack Analysis Report — Side-Hustles Niche

**Generated:** 2026-03-18 10:57
**Niche:** Side-Hustles / Making Money Online
**Content type:** Creator-led short-form, talking-head knowledge, direct-to-camera educational
**Total videos:** 863 | **With training features:** 863

> **CONTAMINATION BOUNDARY:** Post-publication engagement metrics are used for
> response-type classification and analysis only. No post-pub data feeds into
> prediction features. Caption-signal extraction uses pre-publication text only.

## Executive Summary

Not all viral videos are viral in the same way. A video with 500K views and
10K saves is fundamentally different from one with 500K views and 10K comments.
This analysis classifies side-hustle videos by their **dominant response pattern**
and identifies what content signals predict each pattern.

**Key findings:**
- Among mega-viral videos (top 10% DPS), the dominant response type is **Save-Heavy** (31/87 = 36%)
- **Save-heavy** videos have median DPS 63.5 vs **share-heavy** at 41.2 — saves correlate with higher overall performance
- Shallow-engagement videos (high views, low interaction) make up 12% of the dataset
- Caption analysis reveals distinct linguistic patterns for each response type

## Methodology

### Operational Definitions

| Response Type | Definition | Rationale |
|--------------|-----------|-----------|
| **Share-Heavy** | Share rate >= p75 (0.72%) and highest dominance | Audience forwards to others — "you need to see this" |
| **Save-Heavy** | Save rate >= p75 (2.48%) and highest dominance | Audience bookmarks for reference — "I'll need this later" |
| **Comment-Heavy** | Comment rate >= p75 (0.68%) and highest dominance | Audience engages in discussion — "I have something to say" |
| **Shallow** | Total engagement rate <= p25 (4.29%) AND views >= median (2.7K) | Algorithmically pushed but audience doesn't interact |
| **Balanced** | None of the above thresholds met | Evenly distributed engagement |

### Dominance Score

For each engagement type, dominance = `(video_rate - dataset_median_rate) / dataset_median_rate`.
A dominance of +1.0 means the video's rate is 2x the dataset median.
When multiple thresholds are met, the highest dominance wins the primary classification.

### Caption Signal Extraction

Binary content signals extracted from caption text via regex pattern matching:

| Signal | Pattern Examples | Hypothesized Driver |
|--------|----------------|-------------------|
| `has_question` | "?" in caption | Engagement / curiosity |
| `has_list_number` | "5 ways", "10 tips", "3 steps" | Utility / save-worthiness |
| `has_money_amount` | "$5K/month", "income", "salary" | Aspiration |
| `has_urgency` | "stop", "don't", "warning", "right now" | Controversy / attention |
| `has_authority` | "I made", "my results", "proof" | Authority / credibility |
| `has_identity` | "introverts", "beginners", "no experience" | Identity / relatability |
| `has_aspiration` | "quit your job", "passive income", "financial freedom" | Aspiration |
| `has_controversy` | "scam", "truth", "nobody tells you" | Controversy / shares |
| `has_cta` | "follow", "save", "link in bio" | Explicit ask |
| `has_save_cta` | "save this", "save for later" | Direct save prompt |

### Tables/Columns Used
```
scraped_videos: video_id, views_count, likes_count, comments_count, shares_count,
  saves_count, caption, hashtags, dps_score, creator_username,
  creator_followers_count, duration_seconds, upload_timestamp
training_features: all numeric pre-publication features (joined via video_id)
```

## Response Type Distribution

| Response Type | Count | % | Median DPS | Median Views | Median Like Rate | Median Save Rate | Median Share Rate | Median Comment Rate |
|--------------|-------|---|------------|-------------|-----------------|-----------------|------------------|-------------------|
| Share-Heavy | 122 | 14.1% | 41.2 | 937.50 | 4.66% | 1.48% | 1.33% | 0.33% |
| Save-Heavy | 152 | 17.6% | 63.5 | 5.4K | 6.11% | 4.01% | 0.61% | 0.31% |
| Comment-Heavy | 154 | 17.8% | 50.4 | 2.1K | 4.68% | 1.65% | 0.37% | 1.34% |
| Shallow | 103 | 11.9% | 58.0 | 20.1K | 1.65% | 0.18% | 0.09% | 0.05% |
| Balanced | 332 | 38.5% | 38.5 | 1.5K | 4.33% | 0.74% | 0.14% | 0.17% |

## Mega-Viral Response Breakdown

Among the **87 mega-viral videos** (DPS >= 75.6, top 10%):

| Response Type | Count | % of Mega-Viral | Median Views | Avg Save Rate | Avg Share Rate |
|--------------|-------|----------------|-------------|--------------|---------------|
| Share-Heavy | 15 | 17.2% | 66.2K | 3.59% | 2.27% |
| Save-Heavy | 31 | 35.6% | 232.7K | 5.28% | 0.87% |
| Comment-Heavy | 24 | 27.6% | 150.8K | 2.61% | 0.79% |
| Shallow | 1 | 1.1% | 839.3K | 0.26% | 2.69% |
| Balanced | 16 | 18.4% | 1.1M | 0.93% | 0.26% |

## Caption Signals by Response Type

What linguistic patterns appear in each response type? (% of videos with signal present)

| Signal | All | Share-Heavy | Save-Heavy | Comment-Heavy | Shallow | Balanced |
|--------|--------|--------|--------|--------|--------|--------|
| has_question | 12.0% | 14.8% | _2.0%_ | 12.4% | 9.7% | **16.0%** |
| has_list_number | 1.6% | 0.0% | 1.3% | 1.3% | 0.0% | 3.0% |
| has_money_amount | 18.4% | **26.2%** | _9.9%_ | **24.2%** | 16.5% | 17.2% |
| has_urgency | 14.1% | 12.3% | _6.6%_ | **18.3%** | 15.5% | 15.7% |
| has_authority | 10.3% | 12.3% | _3.9%_ | 13.1% | 11.7% | 10.9% |
| has_identity | 22.8% | 18.9% | 25.0% | **37.3%** | 19.4% | 17.5% |
| has_aspiration | 4.9% | 2.5% | 2.0% | 4.6% | **9.7%** | 5.7% |
| has_controversy | 7.9% | 5.7% | 5.3% | 7.2% | 10.7% | 9.4% |
| has_cta | 25.2% | 24.6% | _11.2%_ | 30.1% | 30.1% | 28.1% |
| has_save_cta | 2.6% | 4.1% | 0.7% | 3.3% | 2.9% | 2.4% |

*Bold = notably above average. Italic = notably below average.*

### Caption Signal ↔ Response Type Associations

Mann-Whitney U tests comparing each signal between the labeled response type and all other videos:

| Signal | Share-Heavy DPS diff | p | Save-Heavy DPS diff | p | Comment-Heavy DPS diff | p |
|--------|---------------------|---|--------------------|----|----------------------|---|
| has_question | -2.1 | 0.468 | N/A | N/A | -7.2 | 0.265 |
| has_list_number | N/A | N/A | N/A | N/A | N/A | N/A |
| has_money_amount | -3.3 | 0.084 | +3.7 | 0.253 | +3.9 | 0.959 |
| has_urgency | +0.6 | 0.720 | -1.3 | 0.480 | +12.4 | 0.773 |
| has_authority | -6.0 | 0.010** | -6.2 | 0.339 | +10.3 | 0.267 |
| has_identity | -3.6 | 0.096 | +2.3 | 0.075 | -3.6 | 0.183 |
| has_aspiration | N/A | N/A | N/A | N/A | -1.6 | 0.550 |
| has_controversy | -6.0 | 0.064 | -21.6 | 0.078 | +13.6 | 0.947 |
| has_cta | -2.0 | 0.550 | -2.5 | 0.979 | +6.5 | 0.720 |
| has_save_cta | +0.5 | 0.920 | N/A | N/A | -7.0 | 0.158 |

## Pre-Publication Features by Response Type

### Feature Correlations with Response Dominance Scores

Spearman r between each pre-pub feature and each dominance score.
Shows which features predict disproportionate shares vs saves vs comments.

#### Top 15 Features → Share Dominance

| Feature | Spearman r | p-value | Direction |
|---------|-----------|---------|-----------|
| ffmpeg_duration_seconds | +0.272 | 0.0000*** | Higher → more shares |
| meta_duration_seconds | +0.269 | 0.0000*** | Higher → more shares |
| extraction_duration_ms | +0.266 | 0.0000*** | Higher → more shares |
| thumb_contrast | +0.180 | 0.0000*** | Higher → more shares |
| ffmpeg_contrast_score | +0.180 | 0.0000*** | Higher → more shares |
| text_flesch_reading_ease | -0.179 | 0.0000*** | Lower → more shares |
| meta_hashtag_count | +0.177 | 0.0000*** | Higher → more shares |
| text_avg_word_length | +0.171 | 0.0000*** | Higher → more shares |
| text_exclamation_count | -0.165 | 0.0000*** | Lower → more shares |
| text_emoji_count | -0.162 | 0.0000*** | Lower → more shares |
| thumb_overall_score | +0.155 | 0.0000*** | Higher → more shares |
| audio_silence_count | +0.140 | 0.0000*** | Higher → more shares |
| audio_loudness_variance | +0.127 | 0.0002*** | Higher → more shares |
| thumb_confidence | +0.125 | 0.0002*** | Higher → more shares |
| ffmpeg_scene_changes | +0.125 | 0.0002*** | Higher → more shares |

#### Top 15 Features → Save Dominance

| Feature | Spearman r | p-value | Direction |
|---------|-----------|---------|-----------|
| meta_hashtag_count | +0.335 | 0.0000*** | Higher → more saves |
| thumb_contrast | +0.328 | 0.0000*** | Higher → more saves |
| ffmpeg_contrast_score | +0.328 | 0.0000*** | Higher → more saves |
| text_flesch_reading_ease | -0.322 | 0.0000*** | Lower → more saves |
| ffmpeg_scene_changes | +0.320 | 0.0000*** | Higher → more saves |
| visual_scene_count | +0.320 | 0.0000*** | Higher → more saves |
| ffmpeg_avg_motion | +0.281 | 0.0000*** | Higher → more saves |
| visual_variety_score | +0.281 | 0.0000*** | Higher → more saves |
| text_avg_word_length | +0.269 | 0.0000*** | Higher → more saves |
| extraction_duration_ms | +0.262 | 0.0000*** | Higher → more saves |
| ffmpeg_duration_seconds | +0.262 | 0.0000*** | Higher → more saves |
| meta_duration_seconds | +0.259 | 0.0000*** | Higher → more saves |
| thumb_overall_score | +0.252 | 0.0000*** | Higher → more saves |
| ffmpeg_cuts_per_second | +0.243 | 0.0000*** | Higher → more saves |
| visual_score | +0.223 | 0.0000*** | Higher → more saves |

#### Top 15 Features → Comment Dominance

| Feature | Spearman r | p-value | Direction |
|---------|-----------|---------|-----------|
| has_identity | +0.213 | 0.0000*** | Higher → more comments |
| extraction_duration_ms | +0.202 | 0.0000*** | Higher → more comments |
| ffmpeg_duration_seconds | +0.186 | 0.0000*** | Higher → more comments |
| meta_duration_seconds | +0.183 | 0.0000*** | Higher → more comments |
| meta_hashtag_count | +0.181 | 0.0000*** | Higher → more comments |
| text_flesch_reading_ease | -0.147 | 0.0000*** | Lower → more comments |
| has_money_amount | +0.146 | 0.0000*** | Higher → more comments |
| text_syllable_count | +0.135 | 0.0001*** | Higher → more comments |
| text_transcript_length | +0.130 | 0.0001*** | Higher → more comments |
| hook_audio_intensity | +0.130 | 0.0003*** | Higher → more comments |
| share_relatability_score | +0.124 | 0.0003*** | Higher → more comments |
| visual_avg_scene_duration | +0.118 | 0.0005*** | Higher → more comments |
| text_avg_word_length | +0.118 | 0.0005*** | Higher → more comments |
| hook_face_present | +0.116 | 0.0008*** | Higher → more comments |
| psych_direct_address_ratio | +0.098 | 0.0039** | Higher → more comments |

### Save-Heavy vs Share-Heavy: Feature Comparison

*n: Save-Heavy = 152, Share-Heavy = 122*

| Feature | Save-Heavy (median) | Share-Heavy (median) | Diff | p-value |
|---------|--------------------|--------------------|------|---------|
| ffmpeg_scene_changes | 6.00 | 0.00 | N/A | 0.0000*** |
| visual_scene_count | 6.00 | 0.00 | N/A | 0.0000*** |
| ffmpeg_avg_motion | 0.18 | 0.00 | N/A | 0.0000*** |
| thumb_contrast | 66.50 | 45.50 | +46% | 0.0000*** |
| ffmpeg_contrast_score | 0.66 | 0.46 | +46% | 0.0000*** |
| ffmpeg_cuts_per_second | 0.10 | 0.00 | N/A | 0.0000*** |
| visual_variety_score | 61.17 | 0.00 | N/A | 0.0000*** |
| thumb_overall_score | 6.70 | 6.00 | +12% | 0.0000*** |
| audio_pitch_mean_hz | 149.15 | 136.65 | +9% | 0.0000*** |
| meta_hashtag_count | 5.00 | 5.00 | +0% | 0.0000*** |
| text_avg_sentence_length | 12.00 | 9.00 | +33% | 0.0000*** |
| retention_open_loop_count | 0.00 | 0.00 | N/A | 0.0000*** |
| text_question_mark_count | 0.00 | 0.00 | N/A | 0.0001*** |
| has_question | 0.00 | 0.00 | N/A | 0.0001*** |
| visual_score | 5.50 | 3.50 | +57% | 0.0001*** |
| text_emoji_count | 0.00 | 0.00 | N/A | 0.0001*** |
| visual_avg_scene_duration | 8.93 | 37.43 | -76% | 0.0002*** |
| has_money_amount | 0.00 | 0.00 | N/A | 0.0004*** |
| ffmpeg_resolution_height | 1920.00 | 1280.00 | +50% | 0.0023** |
| ffmpeg_resolution_width | 1080.00 | 720.00 | +50% | 0.0023** |

## Duration by Response Type

| Response Type | Median Duration | Mean Duration | n |
|--------------|----------------|--------------|---|
| Share-Heavy | 61s | 64s | 122 |
| Save-Heavy | 60s | 64s | 152 |
| Comment-Heavy | 51s | 56s | 154 |
| Shallow | 34s | 43s | 103 |
| Balanced | 37s | 48s | 332 |

## Hashtag Patterns by Response Type

### Share-Heavy — Top Hashtags

| Hashtag | Count | % of group |
|---------|-------|-----------|
| #sidehustleideas | 16 | 13.1% |
| #sidehustle | 13 | 10.7% |
| #begginerugc | 12 | 9.8% |
| #ugccontentcreator | 12 | 9.8% |
| #startanonlinebusiness | 11 | 9.0% |
| #ugc | 11 | 9.0% |
| #evoagency | 9 | 7.4% |
| #workfromhome | 8 | 6.6% |
| #makemoneyonline | 8 | 6.6% |
| #waystomakemoneyonline | 7 | 5.7% |

### Save-Heavy — Top Hashtags

| Hashtag | Count | % of group |
|---------|-------|-----------|
| #sidehustle | 57 | 37.5% |
| #begginerugc | 21 | 13.8% |
| #ugccontentcreator | 21 | 13.8% |
| #ugc | 20 | 13.2% |
| #printondemand | 20 | 13.2% |
| #sidehustleideas | 19 | 12.5% |
| #makemoneyonline | 19 | 12.5% |
| #evoagency | 18 | 11.8% |
| #entrepreneur | 17 | 11.2% |
| #printondemandtips | 17 | 11.2% |

### Comment-Heavy — Top Hashtags

| Hashtag | Count | % of group |
|---------|-------|-----------|
| #sidehustle | 40 | 26.0% |
| #digitalmarketing | 26 | 16.9% |
| #entrepreneur | 26 | 16.9% |
| #money | 24 | 15.6% |
| #internetmoney | 24 | 15.6% |
| #sidehustlesuccess | 24 | 15.6% |
| #affiliatemarketing | 23 | 14.9% |
| #methods2298 | 23 | 14.9% |
| #digitalproducts | 20 | 13.0% |
| #brokecollegestudent | 19 | 12.3% |

## Viral Driver Typology: What Makes Side-Hustle Videos Go Mega-Viral?

Using caption signals as proxies, we classify the likely viral driver for
mega-viral videos (top 10% DPS):

| Driver Type | Caption Signal | % in Mega-Viral | % in Rest | Lift | Interpretation |
|------------|---------------|----------------|----------|------|---------------|
| Utility-Driven | has_list_number | 2.3% | 1.6% | +48% | OVERREPRESENTED in mega-viral |
| Controversy-Driven | has_controversy | 3.4% | 8.4% | -59% | Underrepresented in mega-viral |
| Aspiration-Driven | has_aspiration | 0.0% | 5.4% | -100% | Underrepresented in mega-viral |
| Identity-Driven | has_identity | 14.9% | 23.6% | -37% | Underrepresented in mega-viral |
| Authority-Driven | has_authority | 3.4% | 11.1% | -69% | Underrepresented in mega-viral |

### Caveats

- **HYPOTHESIS, not demonstrated causation.** Caption signals are rough proxies.
  A video with "$5K/month" in the caption may be aspiration-driven or authority-driven.
- **Multiple drivers overlap.** A single video can be both aspirational and authoritative.
- **Caption ≠ content.** The actual video content may have a different driver than the caption suggests.
- **Small sample.** Only 87 mega-viral videos — percentages are noisy.

## Response Type × DPS Tier Cross-Tab

| Response Type | Mega-Viral | Viral | Good | Average | Underperformer |
|--------------|-----------|-------|------|---------|----------------|
| Share-Heavy | 15 (12%) | 10 (8%) | 17 (14%) | 47 (39%) | 33 (27%) |
| Save-Heavy | 31 (20%) | 44 (29%) | 38 (25%) | 32 (21%) | 7 (5%) |
| Comment-Heavy | 24 (16%) | 26 (17%) | 32 (21%) | 36 (23%) | 36 (23%) |
| Shallow | 1 (1%) | 26 (25%) | 52 (50%) | 24 (23%) | 0 (0%) |
| Balanced | 16 (5%) | 23 (7%) | 77 (23%) | 76 (23%) | 140 (42%) |

## Practical Implications for Feature Design & Tier Interpretation

### For Feature Design

1. **Response-type prediction** could become a secondary output alongside VPS.
   Pre-pub features that predict share dominance vs save dominance would help
   creators understand *how* their video will perform, not just *how much*.

2. **Caption-signal features** are extractable pre-publication and show different
   profiles across response types. Worth adding to the feature pipeline:
   - List-number detection (utility proxy)
   - Money-amount detection (aspiration proxy)
   - Controversy language detection (share driver)
   - Identity-targeting language (relatability proxy)

3. **Duration interacts with response type.** The optimal duration may differ
   depending on whether the goal is saves (reference content) vs shares
   (forwarding content) vs comments (discussion-generating content).

### For Tier Interpretation

1. **"Viral" is not monolithic.** A save-heavy viral video and a share-heavy
   viral video are different products with different implications for the creator.

2. **Shallow-engagement detection** could flag videos that the algorithm is
   pushing but audiences aren't engaging with — a leading indicator of
   declining performance.

3. **Response profile** adds nuance to VPS: two videos with identical VPS
   scores may have very different audience relationships.

## Limitations

1. **Caption proxies are crude.** Regex pattern matching catches surface patterns but misses nuance, sarcasm, and context.
2. **Single snapshot.** Engagement metrics are from one scrape; response profiles may shift over time.
3. **No video-content analysis.** Actual spoken content, visual style, and editing patterns are not captured by caption analysis.
4. **Niche-specific.** Side-hustle content patterns may not transfer to other niches.
5. **Creator confounding.** Some creators consistently produce save-heavy or share-heavy content; response type may partially reflect creator style.
6. **Threshold sensitivity.** Using p75 for "heavy" and p25 for "shallow" is arbitrary; different thresholds would change group compositions.
7. **Overlap.** Some videos meet multiple "heavy" thresholds; primary classification forces a single label.

## What Drives Shares vs Saves vs Comments In This Niche

Based on the evidence above, here is what the data shows — and what remains hypothesis.

### Shares (demonstrated)

- **has_money_amount** is overrepresented in share-heavy videos (26.2% vs 18.4% overall)
- Share-heavy videos have median duration **61s** (vs 48s overall)
- Pre-pub feature **ffmpeg_duration_seconds** correlates with share dominance (r=+0.272, p=0.0000)
- Pre-pub feature **meta_duration_seconds** correlates with share dominance (r=+0.269, p=0.0000)
- Pre-pub feature **extraction_duration_ms** correlates with share dominance (r=+0.266, p=0.0000)

### Shares (hypothesis)

- Controversy and "insider knowledge" framing likely drive shares ("you need to see this" / "they don't want you to know")
- Shorter, punchier videos may be more shareable than long-form reference content
- Videos with surprising or counterintuitive claims get forwarded more

### Saves (demonstrated)

- No caption signals are significantly overrepresented in save-heavy videos
- Save-heavy videos have median duration **60s** (vs 48s overall)
- Pre-pub feature **meta_hashtag_count** correlates with save dominance (r=+0.335, p=0.0000)
- Pre-pub feature **thumb_contrast** correlates with save dominance (r=+0.328, p=0.0000)
- Pre-pub feature **ffmpeg_contrast_score** correlates with save dominance (r=+0.328, p=0.0000)

### Saves (hypothesis)

- List-format content ("5 ways to...") triggers the save reflex — perceived as reusable reference
- Longer, more detailed videos are saved because they can't be absorbed in one viewing
- "Save this for later" CTAs in captions may directly boost save rate

### Comments (demonstrated)

- **has_money_amount** is overrepresented in comment-heavy videos (24.2% vs 18.4% overall)
- **has_urgency** is overrepresented in comment-heavy videos (18.3% vs 14.1% overall)
- **has_identity** is overrepresented in comment-heavy videos (37.3% vs 22.8% overall)
- Comment-heavy videos have median duration **51s** (vs 48s overall)
- Pre-pub feature **has_identity** correlates with comment dominance (r=+0.213, p=0.0000)
- Pre-pub feature **extraction_duration_ms** correlates with comment dominance (r=+0.202, p=0.0000)
- Pre-pub feature **ffmpeg_duration_seconds** correlates with comment dominance (r=+0.186, p=0.0000)

### Comments (hypothesis)

- Questions in captions directly invite comment responses
- Controversial or polarizing claims generate "agree/disagree" comment threads
- Personal stories and vulnerability trigger empathy and advice comments
- Income claims invite skepticism comments ("proof?", "what niche?")

### Shallow Engagement (demonstrated)

- Shallow videos have median **20.1K** views but only **2.57%** total engagement rate
- Median DPS: **58.0** (vs 49.1 overall)

### Shallow Engagement (hypothesis)

- Algorithm-pushed but audience-rejected: hook is strong enough for initial views but content doesn't deliver
- May indicate "clickbait gap" — promise in thumbnail/hook exceeds actual value
- Could also reflect trending-sound/hashtag virality where content is irrelevant to the discovery mechanism
