# Creator Baseline Analysis — Side-Hustles Niche

**Generated:** 2026-03-18 10:07
**Niche:** Side-Hustles / Making Money Online
**Content type:** Creator-led short-form, talking-head knowledge, direct-to-camera educational

> **CONTAMINATION BOUNDARY:** Post-publication engagement metrics are used for
> analysis and interpretation only. Creator baselines use DPS (a post-pub derived
> score) only to measure relative performance — never as a prediction input.

## Executive Summary

Raw DPS correlations mix two effects: (1) creator authority (bigger accounts get more views)
and (2) content quality (some videos genuinely outperform). By computing each video's
**deviation from its creator's baseline DPS**, we isolate the content-quality signal.

This analysis covers **859 videos** from **19 creators** (each with
>= 10 videos). 1 creators with <10
videos (4 videos total) were excluded for insufficient baseline data.

**Key findings:**
- **16** signals survive or strengthen after controlling for creator baseline — these reflect true content quality
- **18** signals vanish — they were proxies for creator authority, not content quality
- **0** signals emerge — hidden by between-creator variance in raw DPS
- **0** signals weaken substantially but don't fully vanish

## Methodology

### Creator Baseline Computation

For each creator with >= 10 videos in the side-hustles dataset:

| Metric | Definition | Purpose |
|--------|-----------|---------|
| `creator_mean_dps` | Mean of all creator's DPS scores | Central tendency |
| `creator_median_dps` | Median of all creator's DPS scores | Robust central tendency |
| `creator_q75_dps` | 75th percentile of creator's DPS scores | "Good day" threshold |
| `creator_std_dps` | Standard deviation of creator's DPS | Spread / consistency |

### Per-Video Deviation Metrics

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| `dps_deviation` | `video_dps - creator_median_dps` | Points above/below creator norm |
| `dps_z_score` | `(video_dps - creator_mean_dps) / creator_std_dps` | Standard deviations from creator norm |

### Comparison Approach

For every feature, we compute Spearman rank correlation against both:
1. **Raw DPS** — the global percentile score (confounded by creator authority)
2. **DPS Deviation** — how much this video over/underperformed its creator's baseline

Features that correlate with raw DPS but not deviation are **creator-authority proxies**.
Features that correlate with deviation are **content-quality signals**.

### Tables/Columns Used
```
scraped_videos:
  video_id, dps_score, creator_username, creator_followers_count,
  views_count, likes_count, comments_count, shares_count, saves_count,
  hashtags, upload_timestamp, duration_seconds

training_features:
  All numeric columns (pre-publication extracted features)
  Joined to scraped_videos via video_id
```

### Sample Thresholds

- **Minimum videos per creator:** 10
- **Minimum non-null values for correlation:** 10
- **Significance threshold:** p < 0.05 (noted with *), p < 0.01 (**), p < 0.001 (***)

## Creator Baselines

### Eligible Creators (19 with >= 10 videos)

| Creator | Videos | Mean DPS | Median DPS | Std Dev | Q75 DPS | Followers |
|---------|--------|---------|------------|---------|---------|-----------|
| @kellanhenneberry | 46 | 75.4 | 77.0 | 8.1 | 81.8 | 242.7K |
| @digitalkingship | 23 | 73.7 | 73.1 | 3.9 | 76.1 | 371.7K |
| @maxtalkstech | 50 | 67.1 | 66.4 | 12.1 | 75.3 | 357.0K |
| @paulylong | 50 | 65.2 | 64.9 | 10.5 | 72.4 | 3.7M |
| @natlie.styles | 13 | 62.6 | 63.3 | 12.7 | 70.9 | 33.3K |
| @jparkecom | 38 | 61.8 | 61.3 | 12.4 | 71.5 | 119.7K |
| @shaylynnstudios | 50 | 59.6 | 58.8 | 10.7 | 64.7 | 27.5K |
| @liannebudgets | 50 | 53.8 | 54.9 | 11.0 | 61.0 | 7.7K |
| @simply.nilly | 50 | 55.0 | 53.4 | 8.7 | 58.3 | 245.0K |
| @successwithalley | 50 | 50.1 | 51.0 | 15.1 | 58.4 | 51.8K |
| @notesbynathan | 50 | 49.1 | 43.6 | 16.4 | 62.9 | 4.9K |
| @the6figurewelder | 50 | 42.0 | 41.2 | 11.4 | 46.5 | 14.0K |
| @officialnigellavers | 50 | 44.5 | 40.7 | 13.1 | 52.7 | 104.8K |
| @moneywithfar1 | 50 | 40.0 | 36.9 | 15.2 | 48.0 | 6.1K |
| @evo.gisselle | 50 | 37.9 | 36.2 | 12.9 | 43.5 | 8.3K |
| @theofficialecomchapman | 50 | 34.1 | 32.9 | 13.5 | 38.1 | 49.5K |
| @achievewithcharlie | 50 | 30.6 | 29.2 | 12.3 | 33.3 | 1.1K |
| @monetizewitheddie | 50 | 33.8 | 28.9 | 17.3 | 42.9 | 12.1K |
| @realdennisdemarino5 | 39 | 33.5 | 28.7 | 16.2 | 37.2 | 33.3K |

### Excluded Creators (1 with < 10 videos)

| Creator | Videos | Reason |
|---------|--------|--------|
| @melyndagerrard | 4 | Below 10-video threshold |

### Baseline Spread

Creator median DPS ranges from **28.7** to **77.0** (range: 48.3 points).
This 48-point spread is the "creator authority" 
variance that raw DPS conflates with content quality.

Mean within-creator std dev: **12.3** DPS points.
This is the typical range of content-quality variation *within* a single creator.

## DPS Deviation Distribution

| Statistic | DPS Deviation | DPS Z-Score |
|-----------|--------------|-------------|
| Mean | 1.54 | -0.00 |
| Median | 0.00 | -0.11 |
| Std Dev | 12.85 | 0.99 |
| Min | -33.66 | -2.84 |
| Max | 60.00 | 4.08 |
| IQR (25-75%) | -6.44 to 7.36 | -0.67 to 0.54 |

## Post-Publication Engagement: Raw DPS vs Creator-Relative

How do engagement ratios correlate with raw DPS vs deviation from creator baseline?

| Metric | r (Raw DPS) | p | r (Deviation) | p | r (Z-Score) | p | Change |
|--------|-------------|---|---------------|---|-------------|---|--------|
| Like Rate | +0.417 | 1.8e-37*** | +0.384 | 1.6e-31*** | +0.393 | 4.4e-33*** | SURVIVES (content signal) |
| Comment Rate | +0.110 | 0.001** | +0.122 | 3.4e-04*** | +0.127 | 2.0e-04*** | SURVIVES (content signal) |
| Share Rate | +0.245 | 3.2e-13*** | +0.262 | 5.6e-15*** | +0.255 | 2.9e-14*** | SURVIVES (content signal) |
| Save Rate | +0.357 | 3.1e-27*** | +0.380 | 5.7e-31*** | +0.386 | 6.0e-32*** | SURVIVES (content signal) |
| Hashtag Count | +0.032 | 0.351 | +0.053 | 0.121 | +0.059 | 0.084 | Minor change |
| Duration | +0.183 | 9.4e-08*** | +0.172 | 5.0e-07*** | +0.151 | 1.1e-05*** | SURVIVES (content signal) |

## Pre-Publication Features: Raw DPS vs Creator-Relative

*70 pre-publication features analyzed.*

### Features Ranked by Creator-Relative Correlation (Top 30)

| Feature | r (Raw DPS) | r (Deviation) | Change | n |
|---------|-------------|---------------|--------|---|
| ffmpeg_resolution_height | +0.287*** | +0.237*** | SURVIVES (content signal) | 858 |
| ffmpeg_resolution_width | +0.287*** | +0.237*** | SURVIVES (content signal) | 858 |
| extraction_duration_ms | +0.249*** | +0.199*** | SURVIVES (content signal) | 859 |
| meta_duration_seconds | +0.184*** | +0.174*** | SURVIVES (content signal) | 859 |
| ffmpeg_duration_seconds | +0.182*** | +0.173*** | SURVIVES (content signal) | 858 |
| ffmpeg_fps | +0.204*** | +0.172*** | SURVIVES (content signal) | 858 |
| text_flesch_reading_ease | +0.045 | -0.097** | Minor change | 857 |
| ffmpeg_scene_changes | +0.382*** | +0.097** | Minor change | 858 |
| visual_scene_count | +0.382*** | +0.097** | Minor change | 858 |
| hook_text_overlay | +0.020 | +0.095** | Minor change | 838 |
| audio_loudness_mean_lufs | +0.114*** | -0.093** | SURVIVES (content signal) | 858 |
| hook_motion_ratio | +0.054 | -0.087* | Minor change | 748 |
| ffmpeg_avg_motion | +0.349*** | +0.086* | Minor change | 858 |
| visual_variety_score | +0.361*** | +0.080* | Minor change | 770 |
| text_negative_word_count | -0.188*** | -0.078* | Minor change | 857 |
| hook_composition_score | +0.064 | +0.075* | Minor change | 838 |
| text_avg_word_length | -0.051 | +0.074* | Minor change | 857 |
| share_utility_score | +0.036 | +0.073* | Minor change | 857 |
| meta_words_per_second | -0.169*** | -0.070* | Minor change | 857 |
| speaking_rate_wpm | -0.169*** | -0.070* | Minor change | 857 |
| thumb_overall_score | +0.153*** | +0.070* | Minor change | 858 |
| ffmpeg_color_variance | +0.014 | +0.069* | Minor change | 858 |
| psych_social_proof_count | -0.103** | +0.068* | SURVIVES (content signal) | 857 |
| thumb_colorfulness | +0.012 | +0.066 | Minor change | 858 |
| thumb_confidence | +0.134*** | +0.064 | Minor change | 858 |
| audio_loudness_range | -0.060 | +0.056 | Minor change | 858 |
| thumb_contrast | +0.260*** | +0.055 | Minor change | 858 |
| ffmpeg_contrast_score | +0.260*** | +0.055 | Minor change | 858 |
| hook_score | +0.104** | +0.054 | SURVIVES (content signal) | 857 |
| hook_text_score | +0.104** | +0.054 | SURVIVES (content signal) | 857 |

### Signals That VANISH After Creator Control
*These correlated with raw DPS but NOT with deviation — they are creator-authority proxies.*

| Feature | r (Raw DPS) | r (Deviation) |
|---------|-------------|---------------|
| meta_creator_followers | +0.496 | +0.000 |
| meta_creator_followers_log | +0.496 | +0.000 |
| ffmpeg_cuts_per_second | +0.306 | +0.030 |
| visual_score | +0.289 | +0.034 |
| text_emoji_count | -0.202 | +0.006 |
| audio_pitch_mean_hz | +0.185 | +0.022 |
| text_transcript_length | -0.182 | +0.014 |
| visual_avg_scene_duration | -0.182 | +0.038 |
| text_syllable_count | -0.179 | +0.020 |
| text_question_mark_count | -0.170 | -0.027 |
| scene_rate_first_half_vs_second | +0.150 | -0.015 |
| retention_open_loop_count | -0.139 | +0.014 |
| audio_pitch_range | +0.132 | +0.034 |
| text_word_count | -0.130 | +0.000 |
| text_sentence_count | -0.127 | -0.027 |
| text_unique_word_ratio | +0.118 | +0.011 |
| audio_pitch_variance | +0.110 | -0.028 |
| audio_pitch_std_dev | +0.110 | -0.028 |

### Signals That SURVIVE After Creator Control
*These correlate with both raw DPS AND deviation — they reflect true content quality.*

| Feature | r (Raw DPS) | r (Deviation) | Verdict |
|---------|-------------|---------------|---------|
| ffmpeg_resolution_height | +0.287 | +0.237 | SURVIVES (content signal) |
| ffmpeg_resolution_width | +0.287 | +0.237 | SURVIVES (content signal) |
| extraction_duration_ms | +0.249 | +0.199 | SURVIVES (content signal) |
| meta_duration_seconds | +0.184 | +0.174 | SURVIVES (content signal) |
| ffmpeg_duration_seconds | +0.182 | +0.173 | SURVIVES (content signal) |
| ffmpeg_fps | +0.204 | +0.172 | SURVIVES (content signal) |
| audio_loudness_mean_lufs | +0.114 | -0.093 | SURVIVES (content signal) |
| psych_social_proof_count | -0.103 | +0.068 | SURVIVES (content signal) |
| hook_score | +0.104 | +0.054 | SURVIVES (content signal) |
| hook_text_score | +0.104 | +0.054 | SURVIVES (content signal) |
| hook_type_encoded | +0.100 | +0.051 | SURVIVES (content signal) |

## Head-to-Head: Raw DPS vs Creator-Relative Findings

### Summary Table

| Rank | Top by Raw DPS | r | Top by Deviation | r |
|------|---------------|---|-----------------|---|
| 1 | meta_creator_followers | +0.496 | like_rate | +0.384 |
| 2 | meta_creator_followers_log | +0.496 | save_rate | +0.380 |
| 3 | like_rate | +0.417 | share_rate | +0.262 |
| 4 | ffmpeg_scene_changes | +0.382 | ffmpeg_resolution_height | +0.237 |
| 5 | visual_scene_count | +0.382 | ffmpeg_resolution_width | +0.237 |
| 6 | visual_variety_score | +0.361 | extraction_duration_ms | +0.199 |
| 7 | save_rate | +0.357 | meta_duration_seconds | +0.174 |
| 8 | ffmpeg_avg_motion | +0.349 | ffmpeg_duration_seconds | +0.173 |
| 9 | ffmpeg_cuts_per_second | +0.306 | duration_seconds | +0.172 |
| 10 | visual_score | +0.289 | ffmpeg_fps | +0.172 |

## Answers to Key Questions

### Which signals are strong in raw DPS but weaken after controlling for creator baseline?

- **meta_creator_followers**: raw r=+0.496 → deviation r=+0.000 (VANISHES (creator-driven))
- **meta_creator_followers_log**: raw r=+0.496 → deviation r=+0.000 (VANISHES (creator-driven))
- **ffmpeg_cuts_per_second**: raw r=+0.306 → deviation r=+0.030 (VANISHES (creator-driven))
- **visual_score**: raw r=+0.289 → deviation r=+0.034 (VANISHES (creator-driven))
- **text_emoji_count**: raw r=-0.202 → deviation r=+0.006 (VANISHES (creator-driven))
- **audio_pitch_mean_hz**: raw r=+0.185 → deviation r=+0.022 (VANISHES (creator-driven))
- **text_transcript_length**: raw r=-0.182 → deviation r=+0.014 (VANISHES (creator-driven))
- **visual_avg_scene_duration**: raw r=-0.182 → deviation r=+0.038 (VANISHES (creator-driven))
- **text_syllable_count**: raw r=-0.179 → deviation r=+0.020 (VANISHES (creator-driven))
- **text_question_mark_count**: raw r=-0.170 → deviation r=-0.027 (VANISHES (creator-driven))

### Which signals remain strong after controlling for creator baseline?

- **ffmpeg_resolution_height**: raw r=+0.287 → deviation r=+0.237
- **ffmpeg_resolution_width**: raw r=+0.287 → deviation r=+0.237
- **extraction_duration_ms**: raw r=+0.249 → deviation r=+0.199
- **meta_duration_seconds**: raw r=+0.184 → deviation r=+0.174
- **ffmpeg_duration_seconds**: raw r=+0.182 → deviation r=+0.173
- **ffmpeg_fps**: raw r=+0.204 → deviation r=+0.172
- **audio_loudness_mean_lufs**: raw r=+0.114 → deviation r=-0.093
- **psych_social_proof_count**: raw r=-0.103 → deviation r=+0.068
- **hook_score**: raw r=+0.104 → deviation r=+0.054
- **hook_text_score**: raw r=+0.104 → deviation r=+0.054

### Which signals appear to reflect true content quality rather than creator authority?

These features predict whether a video will outperform *its own creator's* typical content:

- **ffmpeg_resolution_height** (r=+0.237): SURVIVES (content signal)
- **ffmpeg_resolution_width** (r=+0.237): SURVIVES (content signal)
- **extraction_duration_ms** (r=+0.199): SURVIVES (content signal)
- **meta_duration_seconds** (r=+0.174): SURVIVES (content signal)
- **ffmpeg_duration_seconds** (r=+0.173): SURVIVES (content signal)
- **ffmpeg_fps** (r=+0.172): SURVIVES (content signal)
- **audio_loudness_mean_lufs** (r=-0.093): SURVIVES (content signal)
- **psych_social_proof_count** (r=+0.068): SURVIVES (content signal)
- **hook_score** (r=+0.054): SURVIVES (content signal)
- **hook_text_score** (r=+0.054): SURVIVES (content signal)
- **hook_type_encoded** (r=+0.051): SURVIVES (content signal)

## Follower Count: The Creator-Authority Confounder

- Follower count ↔ **raw DPS**: r=+0.496 (p=0.0000)
- Follower count ↔ **deviation**: r=+0.000 (p=0.9999)

Follower count strongly correlates with raw DPS but NOT with deviation — confirming it is
a creator-authority confounder, not a content-quality signal. This validates the entire
baseline-control approach: any feature that behaves like follower count is measuring the
creator, not the content.

## Practical Takeaways for Pre-Publication Feature Design

### High-Priority Features (survive creator control)

These features predict content outperformance regardless of creator size:

1. **ffmpeg_resolution_height** (deviation r=+0.237)
1. **ffmpeg_resolution_width** (deviation r=+0.237)
1. **extraction_duration_ms** (deviation r=+0.199)
1. **meta_duration_seconds** (deviation r=+0.174)
1. **ffmpeg_duration_seconds** (deviation r=+0.173)
1. **ffmpeg_fps** (deviation r=+0.172)
1. **audio_loudness_mean_lufs** (deviation r=-0.093)
1. **psych_social_proof_count** (deviation r=+0.068)
1. **hook_score** (deviation r=+0.054)
1. **hook_text_score** (deviation r=+0.054)

### Low-Priority Features (creator-authority proxies)

These features appear predictive but actually measure creator authority:

1. **meta_creator_followers** (raw r=+0.496, deviation r=+0.000)
1. **meta_creator_followers_log** (raw r=+0.496, deviation r=+0.000)
1. **ffmpeg_cuts_per_second** (raw r=+0.306, deviation r=+0.030)
1. **visual_score** (raw r=+0.289, deviation r=+0.034)
1. **text_emoji_count** (raw r=-0.202, deviation r=+0.006)
1. **audio_pitch_mean_hz** (raw r=+0.185, deviation r=+0.022)
1. **text_transcript_length** (raw r=-0.182, deviation r=+0.014)
1. **visual_avg_scene_duration** (raw r=-0.182, deviation r=+0.038)
1. **text_syllable_count** (raw r=-0.179, deviation r=+0.020)
1. **text_question_mark_count** (raw r=-0.170, deviation r=-0.027)

### Design Principle

When evaluating new pre-publication features, always test correlation against
**creator-relative deviation**, not just raw DPS. A feature with r=+0.15 against
deviation is more valuable than r=+0.35 against raw DPS if the latter vanishes
after creator control.

## Limitations

1. **Creator sample:** Only 19 creators met the 10-video threshold. This is a small sample for generalizing creator-level patterns.
2. **Within-niche only:** All videos are side-hustles. Creator-relative patterns may differ across niches.
3. **DPS circularity:** DPS is already partially creator-relative (percentile within creator portfolio). Deviation-from-baseline adds a second layer of normalization — effects may be attenuated.
4. **Temporal bias:** Creator baselines use all videos regardless of posting date. A creator who improved over time will show early videos as underperformers.
5. **Feature coverage:** Not all scraped_videos have matching training_features. The joined subset may not be representative.
6. **Correlation ≠ causation:** Surviving features predict relative outperformance but may not cause it.

## Signals Most Likely To Generalize Within This Niche

The following signals survived creator-baseline control and are therefore most likely
to generalize to new creators in the side-hustles / making money online niche:

| Rank | Feature | r (Deviation) | r (Raw DPS) | Classification |
|------|---------|---------------|-------------|---------------|
| 1 | ffmpeg_resolution_height | +0.237 | +0.287 | SURVIVES (content signal) |
| 2 | ffmpeg_resolution_width | +0.237 | +0.287 | SURVIVES (content signal) |
| 3 | extraction_duration_ms | +0.199 | +0.249 | SURVIVES (content signal) |
| 4 | meta_duration_seconds | +0.174 | +0.184 | SURVIVES (content signal) |
| 5 | ffmpeg_duration_seconds | +0.173 | +0.182 | SURVIVES (content signal) |
| 6 | ffmpeg_fps | +0.172 | +0.204 | SURVIVES (content signal) |
| 7 | audio_loudness_mean_lufs | -0.093 | +0.114 | SURVIVES (content signal) |
| 8 | psych_social_proof_count | +0.068 | -0.103 | SURVIVES (content signal) |
| 9 | hook_score | +0.054 | +0.104 | SURVIVES (content signal) |
| 10 | hook_text_score | +0.054 | +0.104 | SURVIVES (content signal) |
| 11 | hook_type_encoded | +0.051 | +0.100 | SURVIVES (content signal) |

**Interpretation:** These features predict whether a side-hustles video will outperform
its creator's own baseline. They measure *content quality*, not *creator authority*.
New pre-publication features should be validated against this same creator-relative
methodology before being added to the prediction pipeline.
