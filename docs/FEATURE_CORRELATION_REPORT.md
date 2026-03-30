# Feature-to-DPS Correlation Report

**Generated:** 2026-03-17 12:12
**Sample size:** 863 videos with both training features and DPS scores
**DPS range:** 11.6 - 91.7 (mean=49.9, median=49.1)
**Top 25% threshold:** DPS >= 64.2 | **Bottom 25% threshold:** DPS <= 34.9

## Niche Breakdown

- **side-hustles**: 863 videos (avg DPS=49.9)

## Top 20 Features by Absolute Spearman Correlation

| Rank | Feature | Spearman r | p-value | Top 25% Mean | Bottom 25% Mean | Effect |
|------|---------|-----------|---------|-------------|----------------|--------|
| 1 | meta_creator_followers | +0.4912*** | 1.28e-53 | 616930.375 | 25101.301 | +591829.074 |
| 2 | meta_creator_followers_log | +0.4912*** | 1.28e-53 | 5.125 | 4.059 | +1.066 |
| 3 | ffmpeg_scene_changes | +0.3804*** | 4.64e-31 | 8.195 | 1.579 | +6.617 |
| 4 | visual_scene_count | +0.3804*** | 4.64e-31 | 8.195 | 1.579 | +6.617 |
| 5 | visual_variety_score | +0.3586*** | 7.27e-25 | 55.212 | 21.134 | +34.078 |
| 6 | ffmpeg_avg_motion | +0.3475*** | 7.26e-26 | 0.171 | 0.048 | +0.123 |
| 7 | ffmpeg_cuts_per_second | +0.3050*** | 5.14e-20 | 0.157 | 0.073 | +0.084 |
| 8 | visual_score | +0.2868*** | 8.72e-18 | 5.602 | 4.266 | +1.336 |
| 9 | ffmpeg_resolution_height | +0.2844*** | 1.68e-17 | 1697.935 | 1382.519 | +315.416 |
| 10 | ffmpeg_resolution_width | +0.2844*** | 1.68e-17 | 955.088 | 777.667 | +177.422 |
| 11 | ffmpeg_contrast_score | +0.2582*** | 1.34e-14 | 0.595 | 0.437 | +0.158 |
| 12 | thumb_contrast | +0.2579*** | 1.45e-14 | 59.498 | 43.722 | +15.775 |
| 13 | extraction_duration_ms | +0.2474*** | 1.69e-13 | 31690.093 | 21064.037 | +10626.056 |
| 14 | ffmpeg_fps | +0.2054*** | 1.16e-09 | 37.531 | 30.194 | +7.337 |
| 15 | text_emoji_count | -0.1954*** | 7.41e-09 | 0.819 | 3.019 | -2.199 |
| 16 | text_negative_word_count | -0.1890*** | 2.28e-08 | 0.009 | 0.148 | -0.139 |
| 17 | audio_pitch_mean_hz | +0.1873*** | 5.41e-08 | 160.185 | 139.876 | +20.308 |
| 18 | meta_duration_seconds | +0.1850*** | 4.41e-08 | 67.969 | 44.607 | +23.361 |
| 19 | ffmpeg_duration_seconds | +0.1832*** | 6.07e-08 | 67.666 | 44.607 | +23.059 |
| 20 | visual_avg_scene_duration | -0.1795*** | 1.12e-07 | 28.114 | 36.495 | -8.381 |

_Significance: \*p<0.05, \*\*p<0.01, \*\*\*p<0.001_

## Full Feature Ranking (all features)

| Rank | Feature | Spearman r | p-value | n |
|------|---------|-----------|---------|---|
| 1 | meta_creator_followers | +0.4912*** | 1.28e-53 | 863 |
| 2 | meta_creator_followers_log | +0.4912*** | 1.28e-53 | 863 |
| 3 | ffmpeg_scene_changes | +0.3804*** | 4.64e-31 | 862 |
| 4 | visual_scene_count | +0.3804*** | 4.64e-31 | 862 |
| 5 | visual_variety_score | +0.3586*** | 7.27e-25 | 773 |
| 6 | ffmpeg_avg_motion | +0.3475*** | 7.26e-26 | 862 |
| 7 | ffmpeg_cuts_per_second | +0.3050*** | 5.14e-20 | 862 |
| 8 | visual_score | +0.2868*** | 8.72e-18 | 862 |
| 9 | ffmpeg_resolution_height | +0.2844*** | 1.68e-17 | 862 |
| 10 | ffmpeg_resolution_width | +0.2844*** | 1.68e-17 | 862 |
| 11 | ffmpeg_contrast_score | +0.2582*** | 1.34e-14 | 862 |
| 12 | thumb_contrast | +0.2579*** | 1.45e-14 | 862 |
| 13 | extraction_duration_ms | +0.2474*** | 1.69e-13 | 863 |
| 14 | ffmpeg_fps | +0.2054*** | 1.16e-09 | 862 |
| 15 | text_emoji_count | -0.1954*** | 7.41e-09 | 861 |
| 16 | text_negative_word_count | -0.1890*** | 2.28e-08 | 861 |
| 17 | audio_pitch_mean_hz | +0.1873*** | 5.41e-08 | 830 |
| 18 | meta_duration_seconds | +0.1850*** | 4.41e-08 | 863 |
| 19 | ffmpeg_duration_seconds | +0.1832*** | 6.07e-08 | 862 |
| 20 | visual_avg_scene_duration | -0.1795*** | 1.12e-07 | 862 |
| 21 | text_transcript_length | -0.1762*** | 1.96e-07 | 861 |
| 22 | text_syllable_count | -0.1726*** | 3.49e-07 | 861 |
| 23 | text_question_mark_count | -0.1665*** | 8.94e-07 | 861 |
| 24 | meta_words_per_second | -0.1648*** | 1.17e-06 | 861 |
| 25 | speaking_rate_wpm | -0.1648*** | 1.17e-06 | 861 |
| 26 | scene_rate_first_half_vs_second | +0.1518*** | 2.24e-05 | 773 |
| 27 | thumb_overall_score | +0.1517*** | 7.71e-06 | 862 |
| 28 | retention_open_loop_count | -0.1358*** | 6.39e-05 | 861 |
| 29 | thumb_confidence | +0.1338*** | 8.16e-05 | 862 |
| 30 | audio_pitch_range | +0.1314*** | 1.47e-04 | 830 |
| 31 | text_word_count | -0.1243*** | 2.55e-04 | 861 |
| 32 | text_sentence_count | -0.1210*** | 3.72e-04 | 861 |
| 33 | audio_loudness_mean_lufs | +0.1146*** | 7.51e-04 | 862 |
| 34 | text_unique_word_ratio | +0.1120*** | 9.95e-04 | 861 |
| 35 | audio_pitch_variance | +0.1097** | 1.55e-03 | 830 |
| 36 | audio_pitch_std_dev | +0.1096** | 1.57e-03 | 830 |
| 37 | hook_score | +0.1016** | 2.84e-03 | 861 |
| 38 | hook_text_score | +0.1016** | 2.84e-03 | 861 |
| 39 | hook_confidence | +0.1006** | 3.12e-03 | 861 |
| 40 | psych_social_proof_count | -0.0997** | 3.41e-03 | 861 |
| 41 | hook_type_encoded | +0.0983** | 3.87e-03 | 861 |
| 42 | audio_silence_ratio | -0.0936** | 5.98e-03 | 862 |
| 43 | audio_loudness_variance | -0.0933** | 6.13e-03 | 862 |
| 44 | psych_direct_address_ratio | -0.0877* | 1.00e-02 | 861 |
| 45 | audio_silence_count | -0.0868* | 1.08e-02 | 862 |
| 46 | audio_energy_buildup | -0.0814* | 2.37e-02 | 772 |
| 47 | psych_curiosity_gap_score | -0.0738* | 3.03e-02 | 861 |
| 48 | hook_composition_score | +0.0643 | 6.24e-02 | 842 |
| 49 | share_relatability_score | -0.0638 | 6.12e-02 | 861 |
| 50 | audio_loudness_range | -0.0555 | 1.03e-01 | 862 |
| 51 | text_avg_word_length | -0.0541 | 1.13e-01 | 861 |
| 52 | hook_motion_ratio | +0.0516 | 1.58e-01 | 750 |
| 53 | text_avg_sentence_length | -0.0511 | 1.34e-01 | 861 |
| 54 | text_flesch_reading_ease | +0.0463 | 1.75e-01 | 861 |
| 55 | thumb_brightness | -0.0397 | 2.45e-01 | 862 |
| 56 | ffmpeg_brightness_avg | -0.0390 | 2.53e-01 | 862 |
| 57 | text_positive_word_count | +0.0374 | 2.74e-01 | 861 |
| 58 | share_utility_score | +0.0368 | 2.81e-01 | 861 |
| 59 | meta_hashtag_count | +0.0354 | 2.99e-01 | 863 |
| 60 | meta_has_viral_hashtag | +0.0341 | 3.17e-01 | 863 |
| 61 | hook_audio_intensity | -0.0294 | 4.15e-01 | 773 |
| 62 | hook_emotion_intensity | +0.0262 | 4.48e-01 | 842 |
| 63 | text_exclamation_count | +0.0230 | 5.00e-01 | 861 |
| 64 | hook_text_overlay | +0.0206 | 5.50e-01 | 842 |
| 65 | ffmpeg_color_variance | +0.0171 | 6.17e-01 | 862 |
| 66 | hook_face_present | -0.0158 | 6.46e-01 | 842 |
| 67 | thumb_colorfulness | +0.0155 | 6.49e-01 | 862 |
| 68 | audio_pitch_contour_slope | +0.0129 | 7.12e-01 | 830 |
| 69 | ffmpeg_bitrate | +0.0127 | 7.10e-01 | 862 |
| 70 | psych_power_word_density | -0.0074 | 8.29e-01 | 861 |

## Binary Feature Analysis

| Feature | Mean DPS (=1) | Mean DPS (=0) | n(1) | n(0) | Diff | Mann-Whitney p |
|---------|-------------|-------------|------|------|------|----------------|
| text_has_cta | 46.0 | 51.2 | 223 | 638 | -5.2*** | 2.99e-04 |
| meta_has_viral_hashtag | 52.5 | 49.7 | 48 | 815 | +2.8 | 3.17e-01 |
| hook_face_present | 50.2 | 51.0 | 740 | 102 | -0.8 | 6.46e-01 |
| hook_text_overlay | 50.3 | 45.1 | 830 | 12 | +5.2 | 5.50e-01 |

## What Separates Mega-Viral from Underperformers

Comparing the **top 50 videos** (DPS 79.3-91.7) 
vs the **bottom 50 videos** (DPS 11.6-22.0):

| Feature | Top 50 Mean | Bottom 50 Mean | Diff | % Diff |
|---------|-----------|--------------|------|--------|
| meta_creator_followers | 462586.460 | 20913.740 | +441672.720 | +2111.9% |
| meta_creator_followers_log | 5.141 | 4.039 | +1.102 | +27.3% |
| ffmpeg_scene_changes | 10.440 | 0.960 | +9.480 | +987.5% |
| visual_scene_count | 10.440 | 0.960 | +9.480 | +987.5% |
| visual_variety_score | 68.649 | 16.800 | +51.849 | +308.6% |
| ffmpeg_avg_motion | 0.226 | 0.034 | +0.192 | +568.4% |
| ffmpeg_cuts_per_second | 0.214 | 0.051 | +0.163 | +315.7% |
| visual_score | 5.910 | 4.150 | +1.760 | +42.4% |
| ffmpeg_resolution_height | 1799.680 | 1203.200 | +596.480 | +49.6% |
| ffmpeg_resolution_width | 1012.320 | 676.800 | +335.520 | +49.6% |
| ffmpeg_contrast_score | 0.637 | 0.375 | +0.262 | +69.8% |
| thumb_contrast | 63.680 | 37.500 | +26.180 | +69.8% |
| extraction_duration_ms | 33036.800 | 19938.520 | +13098.280 | +65.7% |
| ffmpeg_fps | 37.795 | 27.120 | +10.675 | +39.4% |
| text_emoji_count | 0.680 | 2.880 | -2.200 | -76.4% |
| text_negative_word_count | 0.000 | 0.160 | -0.160 | -100.0% |
| audio_pitch_mean_hz | 155.362 | 134.609 | +20.753 | +15.4% |
| meta_duration_seconds | 68.161 | 44.623 | +23.538 | +52.7% |
| ffmpeg_duration_seconds | 68.161 | 44.623 | +23.538 | +52.7% |
| visual_avg_scene_duration | 21.320 | 38.837 | -17.517 | -45.1% |

### Plain English Interpretation

1. **Account size dominates** (r=+0.49): Creators with 463K followers average 79+ DPS vs 21K followers for bottom videos. This is account-level bias, not content quality — which is why we removed follower features from the XGBoost model.

2. **Editing intensity is the #1 content signal** (r=+0.38): Top 50 videos average 10.4 scene changes vs just 1.0 for bottom 50 — a 10x difference. More cuts = more visual dynamism = higher engagement.

3. **Visual variety matters** (r=+0.36): Top videos score 68.6 on visual variety vs 16.8 for underperformers. Monotonous talking-head-with-no-cuts content underperforms.

4. **Motion and energy** (r=+0.35): Average motion 0.226 in top videos vs 0.034 in bottom — 6.7x more on-screen movement. Static frames kill engagement.

5. **Professional production quality** (r=+0.28): Top videos are 1080p+ (1800x1012) vs bottom at 720p (1203x677). Higher FPS (38 vs 27) also correlates — smoother video performs better.

6. **High contrast and bold visuals** (r=+0.26): Both video contrast (0.64 vs 0.37) and thumbnail contrast (63.7 vs 37.5) are 70% higher in top videos. Bold, high-contrast visuals grab attention.

7. **Fewer emojis in captions** (r=-0.20): Bottom videos use 4x more emojis (2.9 vs 0.7). Emoji-heavy captions correlate with lower performance.

8. **No negative language** (r=-0.19): Top 50 videos have zero negative words on average. Negative framing (hate, worst, terrible) correlates with lower DPS.

9. **Longer videos win** (r=+0.19): Top videos average 68s vs 45s for bottom. Combined with the duration sweet spot analysis: 30-60s and 90s+ are optimal.

10. **Shorter scenes, faster pacing** (r=-0.18): Average scene duration is 21s in top videos vs 39s in bottom. Quick cuts and scene transitions signal higher production value.

**Note:** `extraction_duration_ms` (#13, r=+0.25) is NOT a content feature — it measures how long FFmpeg took to process the file. It correlates because longer/higher-quality videos take more processing time. It is a proxy for video complexity, not an actionable signal.

## Duration Sweet Spot

| Duration Bucket | n | Avg DPS | Median DPS | Std Dev |
|----------------|---|---------|-----------|---------|
| 0-15s | 186 | 43.1 | 40.4 | 15.4 |
| 15-30s | 72 | 45.5 | 42.8 | 20.6 |
| 30-60s | 261 | 53.9 | 54.7 | 18.8 |
| 60-90s | 210 | 49.2 | 47.6 | 17.5 |
| 90s+ | 133 | 54.7 | 56.5 | 18.9 | **<-- OPTIMAL**

**Optimal duration range: 90s+** (avg DPS=54.7, n=133)

## Key Takeaways

- **47** features have statistically significant (p<0.05) correlation with DPS
- **29** positively correlated (higher value = higher DPS)
- **18** negatively correlated (higher value = lower DPS)

**Strongest predictors:**
1. `meta_creator_followers` (r=+0.4912, positively correlated)
1. `meta_creator_followers_log` (r=+0.4912, positively correlated)
1. `ffmpeg_scene_changes` (r=+0.3804, positively correlated)

**Features with essentially zero correlation** (|r| < 0.05): 17 features
Examples: text_flesch_reading_ease, thumb_brightness, ffmpeg_brightness_avg, text_positive_word_count, share_utility_score

---

## Tier Analysis Summary

See [TIER_ANALYSIS_REPORT.md](TIER_ANALYSIS_REPORT.md) for the full tier-by-tier breakdown.

**Tier definitions** (from 863 videos, percentile-based):

| Tier | DPS Range | Count | Key Content Differentiators |
|------|-----------|-------|-----------------------------|
| Mega-Viral (top 10%) | 75.6-91.7 | 87 | 9.7 scene changes, 0.20 cuts/sec, 44 WPM (visual-dominant) |
| Viral (75th-90th) | 64.2-75.6 | 129 | 7.2 scene changes, 0.13 cuts/sec, 152 WPM |
| Good (50th-75th) | 49.1-64.1 | 216 | 4.6 scene changes, 0.12 cuts/sec, 239 WPM |
| Average (25th-50th) | 34.9-49.0 | 215 | 3.3 scene changes, 0.07 cuts/sec, 324 WPM |
| Underperformer (<25th) | 11.6-34.8 | 216 | 1.6 scene changes, 0.07 cuts/sec, 377 WPM |

**The single biggest unlock at each tier boundary:**
- **Under → Average:** Double your scene changes (1.6 → 3.3). Add *any* editing.
- **Average → Good:** Cut faster (every 14s → every 9s). Add visual variety.
- **Good → Viral:** More scene transitions (4.6 → 7.2). Professional-grade editing.
- **Viral → Mega-Viral:** Let visuals carry the message. 70% fewer words, 53% faster cuts.
