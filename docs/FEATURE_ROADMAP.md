# Feature Roadmap: Content Strategy Signals for TikTok Virality Prediction

**Created:** 2026-03-15
**Purpose:** Map every measurable pre-publication signal that correlates with TikTok video performance. Identify what we measure, what we're missing, and how to build each missing feature.
**Model Baseline:** XGBoost v7 — 68 features, Spearman rho 0.74 (5-fold CV mean), 0.81 (holdout), 863 videos (side-hustles niche)
**Model Current:** XGBoost v7 Phase 1 Final — 74 features (68 original + 6 new Phase 1 features), Spearman rho 0.74 (CV), 0.77 (holdout)

---

## Phase 1 Results (2026-03-15)

### Summary

Phase 1 tested 9 new features (5 FFmpeg segment analysis + 4 Gemini Vision hook analysis) on the v7 model. After evaluation, 3 features had zero importance and were removed. The final clean model has **74 features** (68 original + 6 new).

### Features That Helped

| Feature | Source | Rank | Importance | Why It Works |
|---------|--------|------|-----------|--------------|
| `hook_face_present` | Vision (Gemini) | #5 | 0.0415 | Face in opening frame = personal connection, higher retention |
| `hook_text_overlay` | Vision (Gemini) | — | — | Designed text overlay signals professional editing |
| `hook_emotion_intensity` | Vision (Gemini) | — | — | Facial expression intensity correlates with emotional hooks |
| `hook_audio_intensity` | FFmpeg segment | #6 | 0.0343 | Audio energy in hook = attention-grabbing opening |
| `hook_motion_ratio` | FFmpeg segment | #43 | 0.0083 | Motion in first 3s relative to rest = visual hook strength |
| `audio_energy_buildup` | FFmpeg segment | #54 | 0.0054 | Audio crescendo pattern = momentum indicator |

### Features That Were Noise (Removed)

| Feature | Source | Why Zero Importance |
|---------|--------|-------------------|
| `hook_composition_score` | Vision (Gemini) | Too subjective — Gemini's 1-10 "attention score" didn't correlate with actual performance |
| `scene_rate_first_half_vs_second` | FFmpeg segment | Ratio of scene cuts 1st vs 2nd half — too noisy, most videos have uniform editing pace |
| `visual_variety_score` | FFmpeg segment | Composite visual diversity metric — redundant with existing `visual_scene_count` and `ffmpeg_scene_changes` |

### Performance Comparison

| Metric | Orig v7 (68) | + FFmpeg (73) | + Vision (77) | Final Clean (74) | Delta (77→74) |
|--------|-------------|--------------|--------------|-----------------|---------------|
| Spearman (CV) | 0.74* | 0.7404 | 0.7457 | 0.7397 | -0.0060 |
| Spearman (holdout) | 0.81* | 0.7934 | 0.7721 | 0.7676 | -0.0045 |
| MAE (holdout) | — | — | 12.96 | 13.11 | +0.15 |
| Within ±10 (holdout) | — | — | 44.0% | 44.0% | +0.0% |
| Tier accuracy | — | — | 46.0% | 50.0% | +4.0% |
| Feature count | 68 | 73 | 77 | 74 | -3 |

*Original v7 (68) holdout Spearman was from a different split method (random 80/20 vs stratified holdout), so not directly comparable.

### Lessons for Phase 2

1. **Binary vision features work better than continuous scores.** `hook_face_present` (binary) and `hook_text_overlay` (binary) both ranked top-5. `hook_composition_score` (1-10 continuous) had zero importance. Lesson: keep Gemini Vision outputs binary or categorical.
2. **Hook-level features add value.** 4 of the 6 kept features measure the first 3 seconds specifically. The hook is the most important segment — invest more features there.
3. **Redundant composite metrics are noise.** `visual_variety_score` was redundant with `visual_scene_count` + `ffmpeg_scene_changes`. Don't create composites of features that already exist.
4. **The model already has 14 zero-importance original features** (speaking rate details, audio type/ratio, hook sub-scores). Phase 2 should consider trimming these too, but only after testing v8-style Optuna optimization on the full 74-feature set.
5. **Holdout Spearman declined from 73→77→74.** This suggests the model may be slightly overfitting to the 813 training videos. Phase 2 should prioritize getting more training data over adding more features.

### Updated Phase 2 Targets

- **Primary:** Get training data above 1000 videos (currently 863) before adding features
- **Secondary:** Test Optuna hyperparameter optimization on the 74-feature set
- **Feature candidates:** Hook-level audio features (speech speed in first 3s, voice energy), thumbnail text detection (title on thumbnail), CTA positioning (where in video the CTA appears)
- **Skip:** More continuous Gemini Vision scores, more composite/ratio features

---

## Table of Contents

1. [Current Feature Inventory (68 features)](#section-1-current-feature-inventory)
2. [Missing Features — What We Should Measure](#section-2-missing-features)
3. [Feature-to-Algorithm Mapping](#section-3-feature-to-algorithm-mapping)
4. [Implementation Priority Matrix](#section-4-implementation-priority-matrix)
5. [Phased Implementation Plan](#section-5-phased-implementation-plan)
6. [Validation Plan](#section-6-validation-plan)
7. [Current Gaps vs TikTok Research](#section-7-current-gaps-vs-tiktok-research)

---

## Section 1: Current Feature Inventory

### How to Read This Section

- **Importance Rank**: From v7 model's `top_features` (gain-based). Rank 1 = highest importance. Features not in top 20 are ranked ">20".
- **Assessment**: Based on importance rank + what the feature actually measures relative to TikTok algorithm signals.
- **v8 Status**: Whether the feature survived the v7→v8 trim (20 zero-importance features removed).

### Group A: FFmpeg Video Analysis (12 features)

| # | Feature | What It Measures | v7 Importance Rank | v8 Status | Assessment |
|---|---------|-----------------|-------------------|-----------|------------|
| 1 | `ffmpeg_scene_changes` | Total scene cut count in video | **#2** (0.085) | Kept | **Strong signal** — proxy for editing pace/visual variety |
| 2 | `ffmpeg_cuts_per_second` | Scene changes normalized by duration | **#18** (0.017) | Kept | **Moderate signal** — editing pace density |
| 3 | `ffmpeg_avg_motion` | Average motion intensity across frames | **#20** (0.015) | Kept | **Moderate signal** — visual energy level |
| 4 | `ffmpeg_color_variance` | Color variation across video | >20 | Kept | **Weak signal** — loose proxy for visual variety |
| 5 | `ffmpeg_brightness_avg` | Average frame brightness | >20 | Kept | **Weak signal** — lighting quality indicator |
| 6 | `ffmpeg_contrast_score` | Contrast level in frames | >20 | Kept | **Weak signal** — visual clarity |
| 7 | `ffmpeg_resolution_width` | Video width in pixels | **#5** (0.037) | Kept | **Moderate signal** — production quality floor |
| 8 | `ffmpeg_resolution_height` | Video height in pixels | **#6** (0.034) | Kept | **Moderate signal** — production quality floor |
| 9 | `ffmpeg_duration_seconds` | Video length from FFmpeg | **#14** (0.018) | Kept | **Strong signal** — duration affects completion rate |
| 10 | `ffmpeg_bitrate` | Video bitrate (quality) | >20 | Kept | **Weak signal** — encoding quality |
| 11 | `ffmpeg_fps` | Frames per second | **#10** (0.024) | Kept | **Moderate signal** — smoothness indicator |
| 12 | `ffmpeg_has_audio` | Whether video has audio track | >20 | **Removed in v8** | **Noise** — near-100% of TikTok videos have audio |

### Group B: Audio Prosodic Analysis (10 features)

| # | Feature | What It Measures | v7 Importance Rank | v8 Status | Assessment |
|---|---------|-----------------|-------------------|-----------|------------|
| 13 | `audio_pitch_mean_hz` | Average voice pitch | **#9** (0.026) | Kept | **Moderate signal** — energy/enthusiasm indicator |
| 14 | `audio_pitch_variance` | How much pitch changes | >20 | Kept | **Weak-to-moderate** — vocal expressiveness |
| 15 | `audio_pitch_range` | Distance between lowest and highest pitch | >20 | Kept | **Weak** — redundant with variance |
| 16 | `audio_pitch_std_dev` | Standard deviation of pitch | >20 | Kept | **Weak** — redundant with variance |
| 17 | `audio_pitch_contour_slope` | Whether pitch trends up or down over video | >20 | Kept | **Unknown** — could indicate energy arc |
| 18 | `audio_loudness_mean_lufs` | Average loudness level | >20 | Kept | **Weak** — production quality floor |
| 19 | `audio_loudness_range` | Dynamic range of volume | >20 | Kept | **Weak-to-moderate** — vocal dynamics |
| 20 | `audio_loudness_variance` | Volume consistency | >20 | Kept | **Weak** — related to production quality |
| 21 | `audio_silence_ratio` | Proportion of silence in video | >20 | Kept | **Moderate** — dead air = drop-off risk |
| 22 | `audio_silence_count` | Number of silence gaps | >20 | Kept | **Weak** — quantity of pauses |

### Group C: Audio Classifier (4 features)

| # | Feature | What It Measures | v7 Importance Rank | v8 Status | Assessment |
|---|---------|-----------------|-------------------|-----------|------------|
| 23 | `audio_music_ratio` | Proportion of audio that is music | >20 | **Removed in v8** | **Noise** — zero importance in v7 |
| 24 | `audio_speech_ratio` | Proportion of audio that is speech | >20 | **Removed in v8** | **Noise** — zero importance in v7 |
| 25 | `audio_type_encoded` | Categorical: speech-only/music-only/mixed/etc. | >20 | **Removed in v8** | **Noise** — zero importance in v7 |
| 26 | `audio_energy_variance` | Normalized energy variance of audio | >20 | **Removed in v8** | **Noise** — zero importance in v7 |

### Group D: Speaking Rate (6 features)

| # | Feature | What It Measures | v7 Importance Rank | v8 Status | Assessment |
|---|---------|-----------------|-------------------|-----------|------------|
| 27 | `speaking_rate_wpm` | Words per minute (overall) | >20 | Kept | **Moderate** — pacing/energy indicator |
| 28 | `speaking_rate_wpm_variance` | How much WPM changes across video | >20 | **Removed in v8** | **Noise** — zero importance |
| 29 | `speaking_rate_wpm_acceleration` | Whether speaking speeds up or slows down | >20 | **Removed in v8** | **Noise** — zero importance |
| 30 | `speaking_rate_wpm_peak_count` | Number of WPM peaks | >20 | **Removed in v8** | **Noise** — zero importance |
| 31 | `speaking_rate_fast_segments` | Count of fast-speaking segments | >20 | **Removed in v8** | **Noise** — zero importance |
| 32 | `speaking_rate_slow_segments` | Count of slow-speaking segments | >20 | **Removed in v8** | **Noise** — zero importance |

### Group E: Visual Scene (3 features)

| # | Feature | What It Measures | v7 Importance Rank | v8 Status | Assessment |
|---|---------|-----------------|-------------------|-----------|------------|
| 33 | `visual_scene_count` | Number of distinct scenes | **#7** (0.031) | Kept | **Strong signal** — visual variety/editing effort |
| 34 | `visual_avg_scene_duration` | Average seconds per scene | >20 | Kept | **Moderate** — pacing indicator |
| 35 | `visual_score` | Composite visual quality score | >20 | Kept | **Weak** — derived from scene data |

### Group F: Thumbnail/First Frame (5 features)

| # | Feature | What It Measures | v7 Importance Rank | v8 Status | Assessment |
|---|---------|-----------------|-------------------|-----------|------------|
| 36 | `thumb_brightness` | First frame brightness | >20 | Kept | **Weak** — basic quality metric |
| 37 | `thumb_contrast` | First frame contrast | **#19** (0.016) | Kept | **Moderate** — visual pop of opening frame |
| 38 | `thumb_colorfulness` | First frame color saturation | >20 | Kept | **Weak** — visual appeal |
| 39 | `thumb_overall_score` | Composite thumbnail score | >20 | Kept | **Weak** — derived composite |
| 40 | `thumb_confidence` | Confidence in thumbnail analysis | >20 | **Removed in v8** | **Noise** — meta-metric, not a content signal |

### Group G: Hook Scorer (8 features)

| # | Feature | What It Measures | v7 Importance Rank | v8 Status | Assessment |
|---|---------|-----------------|-------------------|-----------|------------|
| 41 | `hook_score` | Composite hook strength (0-100) | >20 | Kept | **Unknown-to-moderate** — important concept, but text-pattern based in v7 training data |
| 42 | `hook_confidence` | Confidence in hook detection | >20 | **Removed in v8** | **Noise** — meta-metric |
| 43 | `hook_text_score` | Text channel sub-score | >20 | **Removed in v8** | **Noise** — sub-component of hook_score |
| 44 | `hook_audio_score` | Audio channel sub-score | >20 | **Removed in v8** | **Noise** — sub-component of hook_score |
| 45 | `hook_visual_score` | Visual channel sub-score | >20 | **Removed in v8** | **Noise** — sub-component of hook_score |
| 46 | `hook_pace_score` | Pace channel sub-score | >20 | **Removed in v8** | **Noise** — sub-component of hook_score |
| 47 | `hook_tone_score` | Tone channel sub-score | >20 | **Removed in v8** | **Noise** — sub-component of hook_score |
| 48 | `hook_type_encoded` | Categorical: question/contrarian/myth_bust/etc. | >20 | **Removed in v8** | **Noise** — categorical encoding may not help XGBoost here |

### Group H: Text/Transcript Analysis (14 features)

| # | Feature | What It Measures | v7 Importance Rank | v8 Status | Assessment |
|---|---------|-----------------|-------------------|-----------|------------|
| 49 | `text_word_count` | Total words in transcript | **#16** (0.017) | Kept | **Moderate** — content density |
| 50 | `text_sentence_count` | Total sentences | **#13** (0.018) | Kept | **Moderate** — structural complexity |
| 51 | `text_question_mark_count` | Number of questions asked | >20 | Kept | **Weak-to-moderate** — engagement cues |
| 52 | `text_exclamation_count` | Number of exclamation marks | **#15** (0.017) | Kept | **Moderate** — emotional intensity proxy |
| 53 | `text_transcript_length` | Character count of transcript | **#11** (0.023) | Kept | **Moderate** — information density |
| 54 | `text_avg_sentence_length` | Words per sentence | >20 | Kept | **Weak** — readability proxy |
| 55 | `text_unique_word_ratio` | Vocabulary diversity | >20 | Kept | **Weak** — lexical richness |
| 56 | `text_avg_word_length` | Average characters per word | >20 | Kept | **Weak** — complexity proxy |
| 57 | `text_syllable_count` | Total syllables | >20 | Kept | **Weak** — redundant with word count |
| 58 | `text_flesch_reading_ease` | Readability score | >20 | Kept | **Weak-to-moderate** — simpler = wider audience |
| 59 | `text_has_cta` | Presence of call-to-action words | >20 | Kept | **Weak** — binary, too coarse |
| 60 | `text_negative_word_count` | Count of negative sentiment words | >20 | Kept | **Weak** — crude 10-word sentiment |
| 61 | `text_emoji_count` | Emojis in caption | >20 | Kept | **Weak** — caption engagement style |
| 62 | `text_positive_word_count` | Count of positive sentiment words | >20 | **Removed in v8** | **Noise** |

### Group I: Metadata (6 features)

| # | Feature | What It Measures | v7 Importance Rank | v8 Status | Assessment |
|---|---------|-----------------|-------------------|-----------|------------|
| 63 | `meta_duration_seconds` | Video duration from metadata | **#17** (0.017) | Kept | **Moderate** — duplicates ffmpeg_duration (kept for null-safety) |
| 64 | `meta_hashtag_count` | Number of hashtags | **#4** (0.059) | Kept (training only) | **Strong signal** — discovery strategy indicator |
| 65 | `meta_has_viral_hashtag` | Presence of #fyp #viral etc. | **#8** (0.028) | Kept (training only) | **Moderate** — signals creator intent/awareness |
| 66 | `meta_creator_followers` | Follower count | **#1** (0.100) | Kept (training only) | **Strongest signal** — but confounded (more followers = more views = higher DPS) |
| 67 | `meta_creator_followers_log` | Log10 of follower count | **#3** (0.065) | Kept (training only) | **Strong signal** — log-scaled version of #1 |
| 68 | `meta_words_per_second` | Speaking density | **#12** (0.022) | Kept | **Moderate** — information delivery rate |

> **Note on metadata features:** `meta_creator_followers`, `meta_creator_followers_log`, `meta_hashtag_count`, and `meta_has_viral_hashtag` are available in training (scraped from TikTok) but NOT available at prediction time for new/unpublished videos. v8 removed these 4 from the prediction feature set but they remain in training data. This is a known limitation — the v8 model trains on 48 content-only features.

### Summary Statistics

| Metric | Value |
|--------|-------|
| Total v7 features | 68 |
| v8 features (content-only) | 48 |
| Features removed (zero importance) | 16 |
| Features removed (not available at prediction time) | 4 |
| Strong signals (top 10 importance) | 10 |
| Weak/noise signals | ~35 |
| **Key gap** | Heavy on production quality (FFmpeg/audio), light on content strategy |

### What's Missing — The Gap

The top 5 features by importance are:
1. `meta_creator_followers` — not a content signal, it's an audience size confound
2. `ffmpeg_scene_changes` — editing pace (production quality)
3. `meta_creator_followers_log` — same confound as #1
4. `meta_hashtag_count` — discovery strategy, not content quality
5. `ffmpeg_resolution_width` — production quality floor

**The model has no features that directly measure:**
- What the hook actually says or does (beyond regex pattern matching)
- Whether the content structure builds retention
- Whether the content is shareable (relatability, utility, emotion)
- Whether there's a payoff, twist, or open loop
- Whether the visual content shows faces, text overlays, or pattern interrupts
- Whether the audio builds energy or matches the content arc
- Whether the topic/format aligns with current trends

These are all signals that TikTok's algorithm explicitly rewards. Section 2 addresses each one.

---

## Section 2: Missing Features — What We Should Measure

### Category A: Visual Hook Analysis (First 3 Seconds)

The first 3 seconds determine 70%+ of whether a viewer watches or scrolls. TikTok's "For You" algorithm uses initial watch-through rate as the primary signal — if viewers scroll past in <3s, the video is dead.

| ID | Feature Name | What It Measures | Why It Predicts Performance | Extraction Method | Difficulty | Expected Impact | Priority |
|----|-------------|-----------------|---------------------------|-------------------|------------|----------------|----------|
| A1 | `hook_face_present` | Binary: is a human face visible in frame 1? | Faces trigger social attention — viewers pause scrolling when they see a face. Thumbnail CTR studies show 30%+ improvement with faces. | Gemini Vision on frame 1 (already extracted by `extractThumbnails`). Ask: "Is a human face clearly visible? yes/no". Fallback: FFmpeg face detection filter (`drawbox` not reliable — use Gemini). | Medium (Gemini Vision call) | **High** — directly maps to scroll-stop behavior | **P0** |
| A2 | `hook_face_emotion_intensity` | 0-1 scale: how strong is the facial expression in frame 1? | Strong facial expressions (surprise, excitement, concern) create pattern interrupts. Neutral/deadpan faces don't stop scrolling. | Gemini Vision on frame 1: "Rate the intensity of the facial expression from 0 (neutral) to 10 (extreme)." Normalize to 0-1. | Medium (Gemini Vision) | **High** — emotional faces outperform neutral faces significantly | **P0** |
| A3 | `hook_text_overlay_present` | Binary: is there text overlay visible in first 3 seconds? | Text overlays ("Wait for it...", "3 things you need to know") provide a second hook channel — viewers read even if they might scroll past the speaker. | Gemini Vision on frames at 0s, 1s, 2s: "Is there text overlaid on the video (not captions/subtitles, but designed text)? yes/no". | Medium (Gemini Vision) | **High** — text overlays are used in 80%+ of viral TikToks in educational niches | **P0** |
| A4 | `hook_text_overlay_word_count` | Integer: number of words in the text overlay (first 3 seconds) | Short punchy text (2-6 words) outperforms long text. No text or too much text both underperform. | Gemini Vision: "How many words of overlaid text are visible?" If A3 is false, value = 0. | Medium (Gemini Vision, same call as A3) | **Medium** — refinement of A3 | **P1** |
| A5 | `hook_motion_intensity_ratio` | Float: ratio of avg motion in first 3s vs rest of video | High initial motion (quick zoom, subject entering frame, camera movement) creates visual urgency. Flat openings lose viewers. | FFmpeg: compute `avg_motion` for first 3s segment and for remaining segment separately. Divide. >1.0 = hook has more motion. | Easy (FFmpeg — already computing per-frame motion) | **High** — motion in the hook is one of the clearest retention signals | **P0** |
| A6 | `hook_brightness_contrast_ratio` | Float: ratio of (brightness × contrast) in frame 1 vs average | Bright, high-contrast opening frames stand out in a dark feed. Visual "pop" in the first frame triggers a pause. | FFmpeg: already computing brightness_avg and contrast_score globally. Compute for frame 1 separately and divide by global. | Easy (FFmpeg signalstats on first frame) | **Medium** — incremental over existing `thumb_brightness`/`thumb_contrast` | **P1** |
| A7 | `hook_scene_change_in_first_2s` | Binary: is there a scene cut in the first 2 seconds? | An early cut signals "something is happening" — it's a pattern interrupt that prevents autopilot scrolling. | FFmpeg: scene detection already running. Check if any scene change timestamp is < 2.0s. | Easy (already have scene timestamps) | **Medium** — simple but directly maps to attention capture | **P1** |
| A8 | `hook_zoom_or_camera_move` | Binary: is there a zoom, pan, or camera movement in first 3s? | Camera movement creates visual energy even without scene cuts. Static locked-off shots in the hook underperform. | Gemini Vision on frames 0s vs 1.5s vs 3s: "Is the camera zooming, panning, or moving between these frames?" Alternatively: FFmpeg motion vectors analysis on first 3s (high motion + no scene cut ≈ camera move). | Medium (Gemini Vision for accuracy, FFmpeg heuristic as fallback) | **Medium** — adds nuance to motion analysis | **P2** |

### Category B: Retention Structure

What keeps viewers watching after the hook. TikTok's algorithm weights completion rate heavily — a 30-second video watched to 100% outranks a 60-second video watched to 50%.

| ID | Feature Name | What It Measures | Why It Predicts Performance | Extraction Method | Difficulty | Expected Impact | Priority |
|----|-------------|-----------------|---------------------------|-------------------|------------|----------------|----------|
| B1 | `retention_pacing_curve_slope` | Float: slope of energy intensity over video duration (positive = building, negative = declining, 0 = flat) | Videos that build energy toward a climax have higher completion rates. Declining energy = viewers drop off before the end. | Compute energy per 5s window using: FFmpeg `avg_motion` per segment + audio `loudness` per segment. Fit linear regression to energy-over-time. Slope = the feature. | Medium (FFmpeg segment analysis — need to process video in windows) | **High** — directly predicts completion rate, the #1 algorithm signal | **P0** |
| B2 | `retention_energy_variance` | Float: variance of energy levels across 5s windows | High variance = dynamic content with peaks and valleys. Low variance = monotonous (talking head at constant energy). Dynamic content drives higher completion. | Same windowed analysis as B1. Compute variance of the per-window energy scores. | Medium (same pipeline as B1) | **High** — monotonous = scroll-away, dynamic = keep watching | **P0** |
| B3 | `retention_scene_change_acceleration` | Float: are scene changes speeding up toward the end? | Accelerating cuts create a sense of building toward a climax. This is a classic editing technique that maps directly to retention. | Already have scene change timestamps from FFmpeg. Compute inter-cut intervals. Fit linear regression to intervals — negative slope = cuts accelerating. | Easy (scene timestamps already available) | **Medium** — editing technique signal | **P1** |
| B4 | `retention_open_loop_score` | Float 0-100: does the transcript contain an open loop / curiosity gap? | Open loops ("I'll show you the result at the end", "the third one shocked me", "wait for it") drive completion by creating anticipation. Viewers stay to get the payoff. | Text analysis on transcript: regex patterns for open loop language. Patterns: "wait for it", "you won't believe", "the last one", "but here's the thing", "at the end", "number [N]" (with N being the final number in a list), "stay until", "keep watching". Score = count of patterns × position weight (earlier = stronger). | Easy (text regex — similar to hook scorer) | **High** — open loops are the #1 retention mechanism in educational TikTok | **P0** |
| B5 | `retention_payoff_position` | Float 0-1: where in the video does the "payoff" occur (0 = beginning, 1 = end) | Videos that deliver value early get shared more (viewers share before finishing). Videos that deliver late get higher completion. Both are valid strategies, but the position matters for different algorithm signals. | Text analysis: identify the payoff sentence (highest information density sentence, or sentence with "result", "answer", "here it is", "this is the one"). Compute its position as fraction of transcript length. | Medium (NLP — sentence-level information density) | **Medium** — nuanced signal, value depends on video style | **P1** |
| B6 | `retention_information_density` | Float: average new concepts per 10-second window | TikTok viewers expect dense information delivery. Videos with low info density (repetitive, padding) lose viewers. High density (new fact/tip every few seconds) drives completion in educational niches. | Text analysis on transcript: split into 10s windows (using word count / WPM). Count unique nouns/concepts per window using simple NLP (unique noun extraction or keyword density). Average across windows. | Medium (basic NLP on transcript) | **Medium** — important for educational/informational niches, less for entertainment | **P1** |
| B7 | `retention_has_numbered_list` | Binary: does the transcript contain a numbered list (3+, 5+, 7+, 10+ items)? | Numbered lists ("5 ways to...", "3 mistakes...") create an implicit contract with the viewer to watch until the last number. This drives completion rate. | Regex on transcript: detect "number N" patterns, "first/second/third" patterns, "step 1/2/3" patterns. Binary: has list with 3+ items. | Easy (regex) | **Medium** — common in educational niches, less universal | **P1** |
| B8 | `retention_longest_monotone_segment` | Float: length in seconds of the longest segment with no scene change AND low audio variance | Identifies the "boring stretch" — the longest uninterrupted period of sameness. Longer boring stretches = higher drop-off risk. | Combine scene timestamps + audio energy windows. Find longest gap between scene changes where audio energy variance is below a threshold. | Medium (combines existing data in a new way) | **Medium** — penalty signal for monotonous content | **P2** |

### Category C: Shareability Signals

What makes someone send this video to a friend. Shares are the highest-weighted engagement action in TikTok's algorithm — a share is worth more than multiple likes.

| ID | Feature Name | What It Measures | Why It Predicts Performance | Extraction Method | Difficulty | Expected Impact | Priority |
|----|-------------|-----------------|---------------------------|-------------------|------------|----------------|----------|
| C1 | `share_relatability_score` | Float 0-100: how "relatable" is the language? | Relatable content gets shared because viewers think "this is so me" or "I need to send this to [person]." Relatability is the #1 share driver on TikTok. | Text analysis: count instances of relatability markers in transcript. Markers: first/second person pronouns ("I", "you", "we", "your"), "you know when...", "POV:", "that feeling when", "tell me why", "it's giving", "no because", "literally me". Normalize by transcript length. Weight early (hook) occurrences higher. | Easy (regex + counting) | **High** — directly predicts shares, the highest-weighted algorithm action | **P0** |
| C2 | `share_utility_score` | Float 0-100: does this video provide actionable practical value? | Utility content ("how to", "save this for later", actionable steps) gets saved AND shared. Saves signal long-term value to TikTok's algorithm. | Text analysis: count utility markers. Markers: "how to", "step by step", numbered instructions, "save this", "you need to", imperative verbs ("try", "use", "start", "stop"), "hack", "tip", "trick". Weight by specificity (generic advice < specific actionable step). | Easy (regex + counting) | **High** — predicts saves (2nd highest weighted action) and shares | **P0** |
| C3 | `share_controversy_score` | Float 0-100: does this content contain a strong/polarizing opinion? | Controversial takes generate comments (debate) and shares (agreement/disagreement). Comments are a key algorithm signal. "Unpopular opinion" TikToks consistently outperform neutral takes. | Text analysis: detect controversy markers. Markers: "unpopular opinion", "controversial", "I don't care what anyone says", strong negation ("never", "always", "worst", "best"), superlatives, contrarian framing (from hook_type detection). Also: high `text_exclamation_count` + strong opinion markers. | Easy (regex, partly overlaps with hook scorer `contrarian` type) | **Medium** — strong for comment generation, but niche-dependent | **P1** |
| C4 | `share_emotional_peak_intensity` | Float 0-1: intensity of the strongest emotional moment | High emotional peaks drive both shares (positive emotion) and comments (any strong emotion). The *intensity* of the peak matters more than average sentiment. | Gemini Vision + text analysis hybrid. Vision: analyze the frame with highest face emotion intensity (from A2, applied to all key frames). Text: find the sentence with highest emotional valence (exclamations, emotional words, ALL CAPS). Take max of visual and textual peaks. | Medium (Gemini Vision + text analysis) | **Medium** — important but harder to quantify reliably pre-publication | **P1** |
| C5 | `share_tag_factor` | Float 0-100: how much does this content make viewers think of a specific person to send it to? | "Tag someone who..." content drives viral sharing. Even without explicit "tag" language, content about specific relatable types ("that one friend who...", content for specific demographics) triggers the "I need to send this to X" response. | Text analysis: detect tagging language. Patterns: "tag", "send this to", "that friend who", "your [relationship] when", content addressing a specific type of person (e.g., "introverts", "only children", "Geminis", "engineers"). | Easy (regex) | **Medium** — powerful when present, but not universal | **P2** |
| C6 | `share_surprise_twist_present` | Binary: does the content contain an unexpected reversal or surprise? | Surprise/twist content drives shares because of the "you need to see this" impulse. The unexpectedness triggers dopamine and the desire to share the experience. | Text analysis: detect twist markers. Patterns: "plot twist", "but then", "turns out", "actually", "wait", sentence that contradicts the setup (e.g., "everyone says X... but Y is true"). Also: dramatic audio shift in final 25% (loudness/pitch change from Gemini Vision on late frames showing visual shift). | Medium (text regex + optional audio analysis) | **Medium** — high impact when present, but not present in all content styles | **P1** |

### Category D: Production Quality (Beyond Current FFmpeg Metrics)

Current FFmpeg features measure raw technical metrics (resolution, bitrate, motion). These miss higher-level production quality signals that affect viewer experience.

| ID | Feature Name | What It Measures | Why It Predicts Performance | Extraction Method | Difficulty | Expected Impact | Priority |
|----|-------------|-----------------|---------------------------|-------------------|------------|----------------|----------|
| D1 | `prod_subtitle_presence` | Binary: are subtitles/captions present? | 80%+ of TikTok is watched on mute or in noisy environments. Subtitles increase watch time by 40% (per TikTok creator best practices). Videos without subtitles lose the majority of potential viewers. | Gemini Vision on 3 key frames (25%, 50%, 75%): "Are there subtitles or captions visible on screen?" Consistent presence across frames = yes. | Medium (Gemini Vision) | **High** — one of the highest-leverage production signals | **P0** |
| D2 | `prod_subtitle_readability` | Float 0-1: are the subtitles easy to read? (size, contrast, positioning) | Subtitles that are too small, low-contrast, or overlap with the speaker's face hurt rather than help. Good subtitles need to be large, high-contrast, and well-positioned. | Gemini Vision: "Rate the subtitle readability from 1-10 considering: font size, contrast against background, position on screen, potential overlap with key visual elements." Normalize to 0-1. | Medium (Gemini Vision, same frames as D1) | **Medium** — refinement of D1 | **P1** |
| D3 | `prod_broll_ratio` | Float 0-1: proportion of video that uses B-roll (supplementary footage) vs static talking head | B-roll breaks up visual monotony, adds context, and keeps viewers engaged. Pure talking head for 60 seconds is the lowest-retention format on TikTok. | Gemini Vision on 5 key frames: classify each as "talking head" vs "B-roll/supplementary footage." B-roll ratio = count(b-roll frames) / total_frames. Combined with `visual_scene_count` — high scene count + high B-roll ratio = well-edited. | Medium (Gemini Vision) | **Medium** — matters more for longer videos (>30s) | **P1** |
| D4 | `prod_lighting_consistency` | Float 0-1: how consistent is the lighting across scenes? | Inconsistent lighting (bright scene → dark scene → bright) signals amateur production. Consistent lighting signals professionalism, which builds trust and retention. | FFmpeg: already computing brightness per frame. Compute standard deviation of brightness across key frames. Low StdDev = consistent. Normalize: 1 - (brightness_std / max_expected_std). | Easy (already have per-frame brightness data) | **Low** — incremental improvement, viewers tolerate inconsistency in short-form | **P2** |
| D5 | `prod_background_noise_level` | Float 0-1: background noise level (0 = clean, 1 = noisy) | Background noise (wind, crowd, keyboard) signals low production quality and makes speech harder to understand. Poor audio quality is one of the top reasons viewers scroll past. | FFmpeg: compute SNR (signal-to-noise ratio) using speech segments vs silence segments. Already have `audio_silence_ratio` and `audio_loudness_mean_lufs`. Noise level ≈ loudness during "silence" segments. | Medium (FFmpeg audio analysis on silence segments) | **Medium** — audio quality is often more important than video quality | **P1** |
| D6 | `prod_music_content_alignment` | Float 0-1: does the music energy match the content energy? | Music that matches the content mood (upbeat music + exciting content, calm music + tutorial) improves completion rate. Mismatched music/content is jarring. | Compute audio energy curve (from loudness) and content energy curve (from speaking rate + scene changes). Correlation between the two curves = alignment. High positive correlation = well-aligned. | Hard (multi-signal correlation analysis) | **Medium** — important for polished content, less measurable for speech-only videos | **P2** |

### Category E: Trend Alignment

Signals that this content fits current platform dynamics. These are the hardest to implement because many require external data sources.

| ID | Feature Name | What It Measures | Why It Predicts Performance | Extraction Method | Difficulty | Expected Impact | Priority |
|----|-------------|-----------------|---------------------------|-------------------|------------|----------------|----------|
| E1 | `trend_audio_is_original` | Binary: is this using original audio vs a sound from another creator? | **Feasible from video only.** Original audio signals the creator is a primary content source. TikTok prioritizes original sounds for distribution. | FFmpeg audio fingerprinting is not practical. However: if `audio_speech_ratio` > 0.8 and no background music detected, it's likely original audio. If speech_ratio < 0.3 and music_ratio > 0.5, it's likely a music sound. | Easy (heuristic from existing audio features) | **Low** — coarse signal, can't distinguish original vs popular sounds | **P2** |
| E2 | `trend_format_signals` | Encoded: which viral format template does this match? | Videos that use currently popular formats (duets, stitches, "get ready with me", "day in my life") get algorithmic preference because TikTok is promoting those formats. | Already partially captured by `24-styles` component (24 video style templates). New: encode the detected style as a feature for XGBoost. If no style detected, use 0. | Easy (already have style detection) | **Medium** — leverages existing work | **P0** |
| E3 | `trend_topic_timeliness` | Float 0-1: is this about a time-sensitive topic? | Time-sensitive content (news, product launches, seasonal events) gets boosted by TikTok's algorithm if published during the relevance window. Evergreen content doesn't get this boost but has longer shelf life. | Text analysis: detect time-sensitive markers. Patterns: "just announced", "breaking", "new in 2026", month/season references, event names, "just dropped", "today". Also: detect evergreen markers ("always", "timeless", "fundamental"). Output: 0 = evergreen, 1 = highly time-sensitive. | Easy (regex on transcript) | **Low** — signals relevance window, not quality. Hard to validate without publishing timing data. | **P2** |
| E4 | `trend_hashtag_quality_score` | Float 0-100: quality and relevance of hashtag strategy (training data only) | Hashtag strategy matters: a mix of broad (#fyp), medium (#sidehustle), and specific (#etsydigitalproducts) outperforms all-broad or all-specific. | **Training data only** (not available at prediction time). Analyze hashtag array: score based on diversity (broad + medium + specific mix), count optimization (3-8 is optimal range), and niche relevance (compare to `NICHE_HASHTAGS` registry). | Easy (algorithm on hashtag array) | **Medium** — only useful for training, not prediction | **P1** |
| E5 | `trend_trending_audio_detected` | Binary: is this using a currently trending sound? | Trending sounds get massive algorithmic boost — TikTok actively pushes content using sounds that are gaining popularity. This is the single strongest distribution signal on the platform. | **Requires external data source.** Need: TikTok trending sounds API or third-party service (e.g., Tokboard, TrendTok). Audio fingerprint the video and match against trending sounds database. | **Hard** (external API dependency, audio fingerprinting) | **Very High** — but only feasible if external trending audio data is available | **P2** (blocked on external data) |
| E6 | `trend_niche_saturation` | Float 0-1: how saturated is this niche on TikTok currently? | Oversaturated niches are harder to break into — TikTok de-prioritizes content that looks like "more of the same." Novel takes in saturated niches, or content in undersaturated niches, get distribution advantages. | **Requires external data source.** Need: volume of recently posted content in the niche (from TikTok API or scraping data). Could approximate from our own scraped_videos database if it's large enough. | **Hard** (external data) | **High** — but not feasible from video analysis alone | **P2** (blocked on external data) |

### Category F: Emotional & Psychological Signals (New Category)

These signals capture psychological triggers that drive engagement, distinct from the content strategy categories above.

| ID | Feature Name | What It Measures | Why It Predicts Performance | Extraction Method | Difficulty | Expected Impact | Priority |
|----|-------------|-----------------|---------------------------|-------------------|------------|----------------|----------|
| F1 | `psych_curiosity_gap_count` | Integer: number of unanswered questions or teases in the transcript | Curiosity gaps are the fundamental mechanism of retention. Each open question creates "information hunger" that can only be satisfied by continuing to watch. | Text analysis: count questions that are not immediately answered (question mark not followed by answer within 2 sentences). Count teases: "I'll tell you", "the answer might surprise you", "you'll see", "guess what". | Easy (regex + positional analysis) | **High** — curiosity is the core retention driver | **P0** |
| F2 | `psych_power_word_density` | Float: ratio of "power words" to total words | Power words trigger emotional responses (fear, excitement, curiosity) that increase engagement. Higher density = more emotionally compelling content. | Text analysis: count words from a curated power word list. Categories: urgency ("now", "immediately", "hurry"), emotion ("shocking", "incredible", "heartbreaking"), exclusivity ("secret", "hidden", "insider"), power ("proven", "guaranteed", "ultimate"). Divide by total word count. | Easy (word list matching) | **Medium** — correlates with engagement but can be overused | **P1** |
| F3 | `psych_direct_address_ratio` | Float: ratio of second-person pronouns ("you", "your") to total pronouns | Direct address creates a parasocial connection — the viewer feels spoken to directly. Higher "you" usage correlates with higher engagement on TikTok educational content. | Text analysis: count "you"/"your"/"you're"/"yourself" and divide by total pronoun count (I/you/he/she/we/they variants). | Easy (word counting) | **Medium** — simple but validated signal for educational niches | **P1** |
| F4 | `psych_social_proof_signals` | Float 0-100: presence and strength of social proof elements | Social proof ("100K people have tried this", "my students always say", "I've helped 500 clients") increases trust and engagement. | Text analysis: detect social proof patterns. Patterns: numbers + people/users/students/clients, "everyone", "most people", "research shows", "$X revenue", specific results. Score by quantity and specificity. | Easy (regex) | **Medium** — trust-building signal, especially for business/finance niches | **P1** |

---

## Section 3: Feature-to-Algorithm Mapping

This table maps every proposed feature to the specific TikTok algorithm behavior it predicts.

### TikTok Algorithm Behaviors (Ranked by Weight)

1. **Average Watch Time / Completion Rate** — the #1 factor. Higher completion = more distribution.
2. **Shares** — highest-weighted engagement action. Shares > Comments > Likes > Views.
3. **Saves** — signals utility/long-term value. Triggers "save-worthy" content classification.
4. **Comments** — signals emotional reaction and debate. Comment count + comment length both matter.
5. **Replay Rate** — signals content worth rewatching. Triggered by short, punchy, dense content.
6. **3-Second Hook Rate** — percentage of viewers who watch past 3 seconds. Below threshold = killed in distribution.
7. **Profile Visits** — after watching, did the viewer visit the creator's profile? Signals desire for more.

### Mapping Table

| Feature ID | Feature Name | Primary Algorithm Behavior | Secondary | Evidence / Reasoning |
|------------|-------------|---------------------------|-----------|---------------------|
| **A1** | `hook_face_present` | 3-Second Hook Rate | Watch Time | Faces trigger social attention patterns. Studies show face thumbnails increase CTR 30%+. Neuroscience: fusiform face area activates automatically, creating a "pause" response. |
| **A2** | `hook_face_emotion_intensity` | 3-Second Hook Rate | Shares | Strong emotions are contagious — emotional faces trigger mirror neurons. Surprised/excited faces in frame 1 create curiosity ("why are they reacting like that?"). |
| **A3** | `hook_text_overlay_present` | 3-Second Hook Rate | Watch Time | Text overlays provide a second hook channel. Viewers who might scroll past a talking head will pause to read text. 80%+ of viral TikToks in educational niches use text overlays. |
| **A4** | `hook_text_overlay_word_count` | 3-Second Hook Rate | — | Optimal: 2-6 words. Too many words = viewer can't read in time. Too few = not compelling enough. Goldilocks zone maximizes hook effectiveness. |
| **A5** | `hook_motion_intensity_ratio` | 3-Second Hook Rate | Watch Time | Motion in the hook creates visual urgency. Static openings are ignored. High motion-to-rest ratio means the hook "pops" relative to the rest of the video. |
| **A6** | `hook_brightness_contrast_ratio` | 3-Second Hook Rate | — | Bright, high-contrast frames stand out in a dark, fast-scrolling feed. Visual "pop" factor. |
| **A7** | `hook_scene_change_in_first_2s` | 3-Second Hook Rate | — | Early cut = pattern interrupt. Breaks the viewer's autopilot scrolling behavior. |
| **A8** | `hook_zoom_or_camera_move` | 3-Second Hook Rate | — | Camera movement creates visual energy without cuts. Adds dynamism to single-shot content. |
| **B1** | `retention_pacing_curve_slope` | Completion Rate | Replay Rate | Escalating energy prevents drop-off. Videos that "build" toward a climax mirror narrative arc — viewers stay for the payoff. Declining energy = "it peaked, I can leave." |
| **B2** | `retention_energy_variance` | Completion Rate | Watch Time | Dynamic content (peaks and valleys) maintains attention through contrast. Flat energy = monotonous = scroll away. This is the anti-boredom signal. |
| **B3** | `retention_scene_change_acceleration` | Completion Rate | — | Accelerating cuts create a sense of building momentum. Classic editing technique used in trailers and viral compilations. |
| **B4** | `retention_open_loop_score` | Completion Rate | Watch Time | Open loops are the #1 retention mechanism. "The third one shocked me" — viewer MUST watch to #3. "Wait for it" — viewer stays for the payoff. Directly maps to completion rate. |
| **B5** | `retention_payoff_position` | Completion Rate / Shares | — | Early payoff → shares (viewer shares before finishing). Late payoff → completion (viewer watches to the end). Both are valuable, but for different algorithm signals. |
| **B6** | `retention_information_density` | Watch Time | Saves | High info density = viewer feels they're learning fast. Low density = padding, viewer leaves. Dense content also triggers saves ("I need to rewatch this"). |
| **B7** | `retention_has_numbered_list` | Completion Rate | Saves | Numbered lists create an implicit contract. "5 tips" means the viewer expects to reach #5. Drop-off between items is lower than for unstructured content. |
| **B8** | `retention_longest_monotone_segment` | Completion Rate | — | The "boring stretch" is where viewers drop off. Shorter max-monotone = better retention. This is a penalty signal. |
| **C1** | `share_relatability_score` | Shares | Comments | "This is so me" content gets shared to friends. Relatability drives the "send to someone" impulse. Also drives comments ("so true!", "literally me"). |
| **C2** | `share_utility_score` | Saves | Shares | Actionable content gets saved for later use and shared with people who "need this." Utility is the #1 save driver on TikTok. |
| **C3** | `share_controversy_score` | Comments | Shares | Polarizing opinions generate debate in comments. "I disagree" and "finally someone said it" both drive comment count. High comment count = algorithm boost. |
| **C4** | `share_emotional_peak_intensity` | Shares | Comments | Strong emotional peaks trigger the "you need to see this" sharing impulse. Joy, surprise, and outrage are the highest-share emotions. |
| **C5** | `share_tag_factor` | Shares | — | "Tag someone who..." directly requests sharing. Even implicit tagging ("that one friend") triggers the same behavior. |
| **C6** | `share_surprise_twist_present` | Shares | Replay Rate | Twists trigger "you won't believe this" sharing. Also drives replay rate — viewers rewatch to see the twist again or catch what they missed. |
| **D1** | `prod_subtitle_presence` | Watch Time | Completion Rate | 80%+ of TikTok viewing is muted or in noisy environments. Without subtitles, the audio channel is lost entirely. Subtitles increase effective watch time by 40%. |
| **D2** | `prod_subtitle_readability` | Watch Time | — | Bad subtitles are worse than no subtitles — they distract and frustrate. Good subtitles (large, high-contrast, well-positioned) extend watch time. |
| **D3** | `prod_broll_ratio` | Completion Rate | — | B-roll breaks visual monotony, especially for longer videos. Pure talking head > 30s has highest drop-off rate. B-roll intercutting reduces monotonous stretches. |
| **D4** | `prod_lighting_consistency` | Watch Time | — | Lighting shifts signal amateur production, which reduces trust. Consistent = professional. Minor signal. |
| **D5** | `prod_background_noise_level` | Watch Time | — | Poor audio quality is one of the top reasons viewers scroll past. Clean audio > sharp video for retention on mobile. |
| **D6** | `prod_music_content_alignment` | Completion Rate | — | Well-matched music enhances the content's emotional arc. Mismatched music is jarring and subconsciously drives viewers away. |
| **E1** | `trend_audio_is_original` | — | Profile Visits | Original audio creators get credit in TikTok's system. Minor distribution signal. |
| **E2** | `trend_format_signals` | Watch Time | Shares | Currently popular formats get algorithmic preference. Using a format viewers are already engaging with reduces friction. |
| **E3** | `trend_topic_timeliness` | Watch Time | — | Time-sensitive content gets a temporary distribution boost during the relevance window. |
| **E4** | `trend_hashtag_quality_score` | (discovery) | — | Hashtag strategy affects initial distribution pool. Training-only feature. |
| **E5** | `trend_trending_audio_detected` | Watch Time | Shares | Trending sounds are the single strongest distribution lever. TikTok actively promotes content using rising sounds. **Requires external data.** |
| **E6** | `trend_niche_saturation` | (distribution) | — | Saturation affects how much distribution TikTok allocates. **Requires external data.** |
| **F1** | `psych_curiosity_gap_count` | Completion Rate | Watch Time | Each unanswered question adds retention pressure. More gaps = more reasons to keep watching. Core psychological mechanism of all retention. |
| **F2** | `psych_power_word_density` | 3-Second Hook Rate | Comments | Power words trigger emotional responses, increasing both attention capture and engagement. Over-density risks appearing clickbaity. |
| **F3** | `psych_direct_address_ratio` | Watch Time | Comments | "You" makes the viewer feel personally addressed. Creates parasocial connection. Higher engagement in educational content. |
| **F4** | `psych_social_proof_signals` | Watch Time | Saves | Social proof builds trust. "500 students" is more compelling than "some students." Drives continued viewing and saves for later action. |

---

## Section 4: Implementation Priority Matrix

```
                    EXPECTED ACCURACY IMPACT
                    High ▲
                         │
         P0 QUADRANT     │    HARD BUT VALUABLE
         (Build First)   │
                         │
     A1  A5  B1  B4 ─── │ ── B2  D1  C4
     C1  C2  F1  E2     │    A2  A3
                         │
                    ─────┼──────────────────────► DIFFICULTY
                         │                        Hard
     B3  B7  C3  F2 ─── │ ── D6  E5  E6
     F3  F4  A7  E3     │    A8  D3
     C5  E4  B5         │    D2  B8
                         │
         QUICK WINS      │    LOW PRIORITY
         (Fill gaps)     │    (Defer)
                         │
                    Low  ▼
```

### P0 — Build First (High Impact, Achievable)

| Feature | Impact | Difficulty | Rationale |
|---------|--------|------------|-----------|
| A1 `hook_face_present` | High | Medium | Faces in frame 1 = strongest hook signal |
| A5 `hook_motion_intensity_ratio` | High | Easy | Motion ratio from existing FFmpeg data |
| B1 `retention_pacing_curve_slope` | High | Medium | #1 predictor of completion rate |
| B2 `retention_energy_variance` | High | Medium | Anti-monotony signal, same pipeline as B1 |
| B4 `retention_open_loop_score` | High | Easy | Text regex — the #1 retention mechanism |
| C1 `share_relatability_score` | High | Easy | Text regex — #1 share driver |
| C2 `share_utility_score` | High | Easy | Text regex — #1 save driver |
| F1 `psych_curiosity_gap_count` | High | Easy | Text regex — core retention driver |
| E2 `trend_format_signals` | Medium | Easy | Already have 24-styles detection |
| D1 `prod_subtitle_presence` | High | Medium | Single highest-leverage production signal |

### P1 — Build Second (Medium Impact or Medium Difficulty)

| Feature | Impact | Difficulty | Rationale |
|---------|--------|------------|-----------|
| A2 `hook_face_emotion_intensity` | High | Medium | Requires Gemini Vision, builds on A1 |
| A3 `hook_text_overlay_present` | High | Medium | Requires Gemini Vision |
| A4 `hook_text_overlay_word_count` | Medium | Medium | Bundled with A3 Gemini call |
| A6 `hook_brightness_contrast_ratio` | Medium | Easy | Simple FFmpeg computation |
| A7 `hook_scene_change_in_first_2s` | Medium | Easy | Already have scene timestamps |
| B3 `retention_scene_change_acceleration` | Medium | Easy | Already have scene timestamps |
| B5 `retention_payoff_position` | Medium | Medium | Basic NLP needed |
| B6 `retention_information_density` | Medium | Medium | Basic NLP needed |
| B7 `retention_has_numbered_list` | Medium | Easy | Regex |
| C3 `share_controversy_score` | Medium | Easy | Regex, overlaps with hook scorer |
| C4 `share_emotional_peak_intensity` | Medium | Medium | Gemini Vision + text hybrid |
| C6 `share_surprise_twist_present` | Medium | Medium | Text + optional audio |
| D2 `prod_subtitle_readability` | Medium | Medium | Bundled with D1 Gemini call |
| D5 `prod_background_noise_level` | Medium | Medium | FFmpeg audio analysis |
| E4 `trend_hashtag_quality_score` | Medium | Easy | Training data only |
| F2 `psych_power_word_density` | Medium | Easy | Word list matching |
| F3 `psych_direct_address_ratio` | Medium | Easy | Pronoun counting |
| F4 `psych_social_proof_signals` | Medium | Easy | Regex |

### P2 — Build When Resources Allow (Lower Impact or Hard)

| Feature | Impact | Difficulty | Rationale |
|---------|--------|------------|-----------|
| A8 `hook_zoom_or_camera_move` | Medium | Medium | Nice-to-have refinement |
| B8 `retention_longest_monotone_segment` | Medium | Medium | Penalty signal, not a driver |
| C5 `share_tag_factor` | Medium | Easy | Narrow use case |
| D3 `prod_broll_ratio` | Medium | Medium | Gemini Vision, matters for longer videos |
| D4 `prod_lighting_consistency` | Low | Easy | Minor signal |
| D6 `prod_music_content_alignment` | Medium | Hard | Multi-signal correlation |
| E1 `trend_audio_is_original` | Low | Easy | Coarse heuristic |
| E3 `trend_topic_timeliness` | Low | Easy | Hard to validate |
| E5 `trend_trending_audio_detected` | Very High | Hard | **Blocked on external data source** |
| E6 `trend_niche_saturation` | High | Hard | **Blocked on external data source** |

---

## Section 5: Phased Implementation Plan

### Phase 1: Highest Leverage Features (Build Next)

**Goal:** Add the 10 P0 features that are easiest to implement and most likely to improve prediction accuracy.

**Expected improvement:** Spearman rho +0.03 to +0.08 (conservative: features targeting the actual algorithm signals our model currently misses)

| Feature | Technical Approach | Dependencies | Est. Dev Effort |
|---------|-------------------|--------------|-----------------|
| **B4** `retention_open_loop_score` | Add to `extractTextFeatures()`. New regex pattern set: open loop markers. Score = weighted count × position multiplier. | None — pure text analysis | 2-3 hours |
| **C1** `share_relatability_score` | Add to `extractTextFeatures()`. Relatability marker regex set. Count, normalize by transcript length, weight hook occurrences 2x. | None — pure text analysis | 2-3 hours |
| **C2** `share_utility_score` | Add to `extractTextFeatures()`. Utility marker regex set. Score by marker diversity + specificity. | None — pure text analysis | 2-3 hours |
| **F1** `psych_curiosity_gap_count` | Add to `extractTextFeatures()`. Count unanswered questions + tease phrases. | None — pure text analysis | 2-3 hours |
| **A5** `hook_motion_intensity_ratio` | Modify FFmpeg canonical analysis to compute `avg_motion` for first 3s segment separately. Ratio = hook_motion / global_motion. | `ffmpeg-canonical-analyzer.ts` change — need segment-level motion | 4-6 hours |
| **E2** `trend_format_signals` | Encode the `24-styles` detected style ID as a numeric feature. Already have `hook_type_encoded` pattern. | None — 24-styles already runs | 1-2 hours |
| **B1** `retention_pacing_curve_slope` | New utility function: split video into N windows, compute per-window energy (motion + loudness). Fit linear regression to get slope. | FFmpeg segment analysis (new capability) | 6-8 hours |
| **B2** `retention_energy_variance` | Same pipeline as B1 — compute variance of per-window energy. | B1 pipeline | 1-2 hours (after B1) |
| **A1** `hook_face_present` | Gemini Vision call on frame 1 (already extracted by `extractThumbnails()`). Binary face detection. | Gemini API key, `gemini-vision-scorer.ts` pattern | 3-4 hours |
| **D1** `prod_subtitle_presence` | Gemini Vision call on 3 key frames. Check for consistent subtitle presence. Can batch with A1 in a single Gemini call. | Gemini API key | 3-4 hours (can share Gemini call with A1) |

**Total Phase 1:** ~30-40 hours of development
**Batch strategy:** Text features (B4, C1, C2, F1) can be implemented in a single session. FFmpeg features (A5, B1, B2) require FFmpeg pipeline changes. Gemini features (A1, D1) can share a single vision call.

### Phase 2: Medium Leverage Features

**Goal:** Add the P1 features that are easy (text-based) plus the Gemini Vision features from P1 that build on Phase 1 infrastructure.

| Feature | Technical Approach | Dependencies | Est. Dev Effort |
|---------|-------------------|--------------|-----------------|
| **A2** `hook_face_emotion_intensity` | Extend A1 Gemini Vision call: add emotion intensity rating 0-10 | Phase 1 A1 (Gemini infrastructure) | 1-2 hours |
| **A3** `hook_text_overlay_present` | Gemini Vision on frames at 0s, 1s, 2s: text overlay detection | Gemini infrastructure | 2-3 hours |
| **A4** `hook_text_overlay_word_count` | Bundle with A3 Gemini call | A3 | 0.5 hours |
| **A6** `hook_brightness_contrast_ratio` | FFmpeg signalstats on frame 1, divide by global averages | Already have brightness/contrast globally | 2-3 hours |
| **A7** `hook_scene_change_in_first_2s` | Check scene change timestamps < 2.0s | Already have scene timestamps | 1 hour |
| **B3** `retention_scene_change_acceleration` | Linear regression on inter-cut intervals | Already have scene timestamps | 2-3 hours |
| **B5** `retention_payoff_position` | NLP: find high-info-density sentence, compute position | Transcript | 4-5 hours |
| **B7** `retention_has_numbered_list` | Regex for numbered items in transcript | Transcript | 1-2 hours |
| **C3** `share_controversy_score` | Regex for controversy markers | Transcript | 2-3 hours |
| **C6** `share_surprise_twist_present` | Regex for twist markers + optional audio shift detection | Transcript | 3-4 hours |
| **D2** `prod_subtitle_readability` | Extend D1 Gemini call with readability rating | Phase 1 D1 | 1 hour |
| **D5** `prod_background_noise_level` | FFmpeg loudness analysis on silence segments | Audio analysis pipeline | 3-4 hours |
| **E4** `trend_hashtag_quality_score` | Algorithm on hashtag array (training extractor only) | Training data pipeline | 2-3 hours |
| **F2** `psych_power_word_density` | Word list matching, count / total | Transcript | 1-2 hours |
| **F3** `psych_direct_address_ratio` | Pronoun counting and ratio | Transcript | 1 hour |
| **F4** `psych_social_proof_signals` | Regex for social proof patterns | Transcript | 2-3 hours |
| **B6** `retention_information_density` | Unique noun extraction per 10s window, average | Transcript + NLP | 4-5 hours |
| **C4** `share_emotional_peak_intensity` | Gemini Vision peak frame + text emotional peak | Gemini + text analysis | 3-4 hours |

**Total Phase 2:** ~35-45 hours of development

### Phase 3: Future / External Data Required

These features are either blocked on external data sources or are lower priority refinements.

| Feature | Blocker | When to Revisit |
|---------|---------|-----------------|
| **E5** `trend_trending_audio_detected` | Needs TikTok trending sounds API or 3rd-party service | When TikTok API access is available or a suitable service is found |
| **E6** `trend_niche_saturation` | Needs large-scale niche posting volume data | When scraped_videos reaches 10K+ across 5+ niches |
| **D6** `prod_music_content_alignment` | Multi-signal correlation analysis is research-grade | After Phase 1+2 features are validated and the model is stable |
| **A8** `hook_zoom_or_camera_move` | Gemini Vision refinement, diminishing returns after A1-A5 | After Phase 2 visual features are validated |
| **B8** `retention_longest_monotone_segment` | Useful but penalty signals are less impactful than positive signals | After Phase 2 |
| **D3** `prod_broll_ratio` | Gemini Vision, mostly matters for longer videos | After Phase 2 |
| **D4** `prod_lighting_consistency` | Easy but low impact | Only if Phase 1+2 show lighting matters |
| **C5** `share_tag_factor` | Narrow use case | Opportunistic |
| **E1** `trend_audio_is_original` | Coarse heuristic, low value | Not recommended |
| **E3** `trend_topic_timeliness` | Hard to validate without temporal publishing data | When we have publish-date + performance correlation data |

---

## Section 6: Validation Plan

### Methodology

Every new feature follows this evaluation pipeline:

1. **Extract** the new feature for all videos in the training set (currently 863 side-hustles videos)
2. **Retrain** XGBoost with the new feature(s) added to the existing feature set
3. **Evaluate** on the holdout set (50 videos, fixed split) using:
   - **Spearman rho** (primary metric — rank correlation with actual VPS)
   - **MAE** (secondary — mean absolute error in VPS points)
   - **5-fold CV** (robustness check)
4. **Compare** to the previous best model
5. **Decision gate:** keep the feature if Spearman improves by >= 0.01 on holdout

### Validation Rules

| Rule | Description |
|------|-------------|
| **Minimum bar** | New feature must improve Spearman rho by >= 0.01 on the holdout set to be kept |
| **No bloat** | Features that don't improve accuracy are removed, not kept "just in case" |
| **Batch evaluation** | Phase 1 features should be evaluated as a batch (all 10 together) first, then individually ablated to confirm each contributes |
| **Ablation testing** | After batch add, remove one feature at a time. If removing a feature doesn't decrease Spearman by >= 0.005, it's noise — remove it |
| **Cross-niche validation** | When we have sufficient data in 3+ niches, validate that features generalize across niches |
| **Overfitting check** | If train Spearman >> holdout Spearman (gap > 0.15), the model is overfitting. Increase regularization or reduce feature count |

### Tracking

All experiments are tracked in the `experiment_log` table (existing infrastructure):

```
experiment_id | model_version | feature_set | holdout_spearman | cv_spearman_mean | notes
```

### Current Baseline (v7/v8)

| Metric | v7 (68 features) | v8 (48 features) |
|--------|-------------------|-------------------|
| Holdout Spearman | 0.808 | TBD (retrain pending) |
| CV Spearman (mean) | 0.741 | TBD |
| Holdout MAE | 12.8 | TBD |
| Features | 68 | 48 |

### Target After Phase 1

| Metric | Target |
|--------|--------|
| Holdout Spearman | >= 0.83 (currently 0.808) |
| CV Spearman (mean) | >= 0.77 (currently 0.741) |
| Features | 58 (48 v8 + 10 Phase 1) |

### Target After Phase 2

| Metric | Target |
|--------|--------|
| Holdout Spearman | >= 0.86 |
| CV Spearman (mean) | >= 0.80 |
| Features | 58 + survivors from Phase 2 (ablation will cull non-contributors) |

---

## Section 7: Current Gaps vs TikTok Research

### Average Watch Time / Completion Rate (Algorithm Factor #1)

**What predicts it:** Content that builds energy, maintains variety, and creates retention hooks (open loops, numbered lists, curiosity gaps).

| Signal | Current Features | Missing Features | Assessment |
|--------|-----------------|-----------------|------------|
| Energy arc (builds or declines?) | `audio_pitch_contour_slope` (coarse — full-video slope only) | **B1** `retention_pacing_curve_slope` — energy per 5s window, not just pitch | **Major gap** — our coarsest proxy is pitch slope. We need windowed energy analysis. |
| Content variety | `ffmpeg_scene_changes`, `visual_scene_count`, `ffmpeg_cuts_per_second` | **B2** `retention_energy_variance`, **B8** `retention_longest_monotone_segment` | **Partial coverage** — we measure editing variety but not energy variety or monotony detection. |
| Retention mechanisms | `hook_score` (first 3s only) | **B4** `retention_open_loop_score`, **F1** `psych_curiosity_gap_count`, **B7** `retention_has_numbered_list` | **Major gap** — we score the hook but nothing about mid-video retention mechanisms. |
| Duration optimization | `ffmpeg_duration_seconds`, `meta_duration_seconds` | None needed | **Covered** — duration is captured and is a top-14 feature. |
| Subtitle accessibility | None | **D1** `prod_subtitle_presence` | **Total gap** — this affects 80%+ of viewers (muted/noisy viewing). |
| Information density | `text_word_count`, `text_transcript_length`, `meta_words_per_second` | **B6** `retention_information_density` (per-window, not global) | **Partial coverage** — we have global density but not temporal density. |

**Overall: 2 of 6 sub-signals covered. 4 major gaps.**

### Shares (Algorithm Factor #2)

**What predicts it:** Relatability, utility, emotional peaks, surprise, and social proof.

| Signal | Current Features | Missing Features | Assessment |
|--------|-----------------|-----------------|------------|
| Relatability | None | **C1** `share_relatability_score` | **Total gap** — no measurement of "this is so me" language. |
| Utility/value | `text_has_cta` (binary, too coarse) | **C2** `share_utility_score` | **Near-total gap** — CTA detection is not utility detection. |
| Controversy/debate | `hook_type_encoded` includes `contrarian` (but removed in v8) | **C3** `share_controversy_score` | **Total gap** in v8 — hook_type_encoded was removed. |
| Emotional peaks | `text_exclamation_count` (crude proxy) | **C4** `share_emotional_peak_intensity` | **Near-total gap** — exclamation marks are a weak proxy. |
| Tag-a-friend | None | **C5** `share_tag_factor` | **Total gap** |
| Surprise/twist | None | **C6** `share_surprise_twist_present` | **Total gap** |

**Overall: 0 of 6 sub-signals meaningfully covered. 6 total gaps.**

### Saves (Algorithm Factor #3)

**What predicts it:** Practical value, actionable steps, reference-worthy content.

| Signal | Current Features | Missing Features | Assessment |
|--------|-----------------|-----------------|------------|
| Actionable utility | `text_has_cta` (too coarse) | **C2** `share_utility_score` | **Near-total gap** — "save this" behavior driven by utility, not CTA words. |
| Information density | `text_word_count`, `meta_words_per_second` | **B6** `retention_information_density` | **Partial coverage** — global density captured but not the "dense enough to rewatch" signal. |
| Numbered steps/lists | None | **B7** `retention_has_numbered_list` | **Total gap** — lists are the #1 "save for later" content type. |
| Social proof | None | **F4** `psych_social_proof_signals` | **Total gap** |

**Overall: 0.5 of 4 sub-signals covered. 3.5 gaps.**

### 3-Second Hook (Algorithm Factor #6)

**What predicts it:** Face presence, text overlay, motion, brightness, vocal energy, emotional intensity.

| Signal | Current Features | Missing Features | Assessment |
|--------|-----------------|-----------------|------------|
| Hook text analysis | `hook_score` (regex-based, 10 types) | Adequately covered | **Good coverage** — 10-type taxonomy with 5 psychological clusters. |
| Face in frame 1 | `thumb_brightness`, `thumb_contrast` (not face-specific) | **A1** `hook_face_present`, **A2** `hook_face_emotion_intensity` | **Total gap** — we analyze thumbnail quality but not face presence. |
| Text overlay in hook | None | **A3** `hook_text_overlay_present`, **A4** `hook_text_overlay_word_count` | **Total gap** |
| Motion in hook vs rest | `ffmpeg_avg_motion` (global, not hook-specific) | **A5** `hook_motion_intensity_ratio` | **Major gap** — global motion doesn't tell us if the hook "pops". |
| Brightness/contrast pop | `thumb_brightness`, `thumb_contrast` | **A6** `hook_brightness_contrast_ratio` (relative, not absolute) | **Partial coverage** — absolute values captured but not relative "pop" vs rest of video. |
| Audio energy in hook | `audio_pitch_mean_hz` (global) | Hook-specific audio already in hook-scorer audio channel | **Moderate coverage** — hook-scorer computes `hookLoudness` and `hookPitchMean` ratios but these aren't XGBoost features. |

**Overall: 1.5 of 6 sub-signals covered. 4.5 gaps.**

### Completion Rate (Algorithm Factor, closely related to Watch Time)

**What predicts it:** Pacing, variety, open loops, payoff timing, numbered lists.

| Signal | Current Features | Missing Features | Assessment |
|--------|-----------------|-----------------|------------|
| Pacing curve | `ffmpeg_cuts_per_second` (flat average) | **B1** `retention_pacing_curve_slope` | **Major gap** — average pace tells us nothing about the arc. |
| Open loops | None | **B4** `retention_open_loop_score` | **Total gap** |
| Payoff timing | None | **B5** `retention_payoff_position` | **Total gap** |
| Scene change pacing | `ffmpeg_scene_changes` (count only) | **B3** `retention_scene_change_acceleration` | **Partial gap** — we know how many cuts but not the temporal pattern. |
| Numbered structure | None | **B7** `retention_has_numbered_list` | **Total gap** |

**Overall: 0.5 of 5 sub-signals covered. 4.5 gaps.**

---

### Gap Summary

| Algorithm Factor | Current Coverage | Gaps | Priority Features to Close Gaps |
|-----------------|-----------------|------|-------------------------------|
| **Watch Time / Completion** | 2/6 (33%) | Energy arc, retention mechanisms, subtitles, monotony | B1, B2, B4, D1, F1 |
| **Shares** | 0/6 (0%) | Everything | C1, C2, C3, C4, C5, C6 |
| **Saves** | 0.5/4 (12%) | Utility, lists, social proof | C2, B7, F4 |
| **3-Second Hook** | 1.5/6 (25%) | Faces, text overlays, motion ratio | A1, A2, A3, A5 |
| **Completion Rate** | 0.5/5 (10%) | Pacing arc, open loops, payoff, structure | B1, B4, B5, B7 |

**The model's biggest blind spot is shareability (0% coverage) followed by completion rate prediction (10% coverage). These are the #2 and #1 algorithm signals respectively. Phase 1 directly targets both.**

---

## Appendix: Feature Naming Convention

All new features follow this pattern:

```
{category}_{subcategory}_{measurement}
```

- **Category prefixes:** `hook_`, `retention_`, `share_`, `prod_`, `trend_`, `psych_`
- **Values:** Always numeric (float or integer) or boolean (0/1). Never categorical strings.
- **Scale:** 0-100 for composite scores, 0-1 for ratios/normalized values, raw counts for integers.

This ensures compatibility with XGBoost (which requires numeric features) and maintains consistency with existing feature naming (`ffmpeg_`, `audio_`, `text_`, `meta_`, `thumb_`, `visual_`).
