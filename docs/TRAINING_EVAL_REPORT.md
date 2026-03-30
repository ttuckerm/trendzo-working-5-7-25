# Training & Evaluation Report — Prompt 10

**Generated:** 2026-03-18 12:16
**Scope:** Side-hustles / making money online (creator-led short-form, talking-head, direct-to-camera educational)
**Feature set:** v7 content-only (72 features, 11 groups)
**Contamination firewall:** Intact — 50 holdout videos excluded from all training

---

## 1. Dataset Summary

| Metric | Value |
|--------|-------|
| Total rows (side-hustles, with DPS) | 863 |
| Training set | 813 |
| Holdout set | 50 |
| Holdout split method | Explicit ID list (stratified by tier: 10 per tier) |
| Features used | 72/72 |
| DPS range (train) | 11.6 – 91.4 |
| DPS mean (train) | 49.5 ± 18.1 |
| DPS median (train) | 48.7 |

### Creator Statistics (for breakout model)

| Metric | Value |
|--------|-------|
| Unique creators in dataset | 20 |
| Creators with 2+ videos | 20 |
| Videos from 2+ video creators | 863 |
| Creators in training set (2+) | 20 |
| Creators in holdout set (2+) | 16 |
| Breakout target range | -33.0 to 56.3 |
| Breakout target mean | -0.0 ± 12.3 |

**Creator-relative target definition:** `breakout = video_dps - creator_mean_dps`
- Positive = video outperformed creator's average
- Negative = video underperformed creator's average
- Zero = exactly average for this creator

**Justification:** This metric isolates content quality from creator fame. Two creators with
10K and 1M followers may have different raw DPS distributions, but breakout measures whether
a specific video beat *that creator's* personal baseline. For side-hustles talking-head content,
this answers: "Did the content itself drive above-normal performance?"

---

## 2. Model A: Raw-DPS Prediction

### 2a. v7 Baseline (prior run, for reference)

| Metric | Train | Holdout | CV (5-fold) |
|--------|-------|---------|-------------|
| Spearman ρ | 0.8923 | 0.7833 | 0.6144 ± 0.0190 |
| MAE | 7.29 | 14.86 | 11.22 ± 0.50 |
| Within ±10 DPS | 73.3% | 34.0% | — |
| Tier accuracy | — | 30.0% | — |

### 2b. Fresh Raw-DPS Model (this run)

| Metric | Train | Holdout | CV (5-fold) |
|--------|-------|---------|-------------|
| Spearman ρ | 0.8923 | 0.7833 | 0.6144 ± 0.0190 |
| MAE | 7.29 | 14.86 | 11.22 ± 0.50 |
| Within ±5 DPS | 42.8% | 20.0% | — |
| Within ±10 DPS | 73.3% | 34.0% | 52.0% ± 1.8% |
| Tier accuracy | 62.5% | 30.0% | — |
| R² | 0.739 | 0.451 | — |
| RMSE | 9.21 | 17.45 | — |
| N | 813 | 50 | — |

### 2c. Delta vs v7 Baseline

| Metric | Δ Holdout | Δ CV Spearman |
|--------|-----------|---------------|
| Spearman ρ | +0.0000 | +0.0000 |
| MAE | +0.00 | +0.00 |
| Within ±10 | +0.0pp | — |
| Tier accuracy | +0.0pp | — |

### 2d. Top 15 Features (Raw-DPS)

| Rank | Feature | Importance |
|------|---------|------------|
| 1 | `visual_scene_count` | 0.1339 █████████████ |
| 2 | `ffmpeg_scene_changes` | 0.0855 ████████ |
| 3 | `audio_pitch_std_dev` | 0.0349 ███ |
| 4 | `ffmpeg_resolution_width` | 0.0337 ███ |
| 5 | `ffmpeg_resolution_height` | 0.0330 ███ |
| 6 | `ffmpeg_avg_motion` | 0.0326 ███ |
| 7 | `speaking_rate_wpm` | 0.0311 ███ |
| 8 | `text_transcript_length` | 0.0237 ██ |
| 9 | `hook_face_present` | 0.0229 ██ |
| 10 | `audio_pitch_mean_hz` | 0.0201 ██ |
| 11 | `ffmpeg_fps` | 0.0199 █ |
| 12 | `visual_variety_score` | 0.0195 █ |
| 13 | `meta_duration_seconds` | 0.0193 █ |
| 14 | `audio_loudness_variance` | 0.0182 █ |
| 15 | `hook_score` | 0.0172 █ |

---

## 3. Model B: Creator-Relative Breakout

### 3a. Breakout Model Results

| Metric | Train | Holdout | CV (5-fold) |
|--------|-------|---------|-------------|
| Spearman ρ | 0.8150 | 0.3726 | 0.3121 ± 0.0429 |
| MAE | 5.96 | 12.74 | 9.01 ± 0.39 |
| Within ±5 DPS | 51.9% | 24.0% | — |
| Within ±10 DPS | 83.5% | 44.0% | 66.0% ± 2.3% |
| Tier accuracy | 99.5% | 96.0% | — |
| R² | 0.592 | 0.165 | — |
| RMSE | 7.86 | 16.07 | — |
| N | 813 | 50 | — |

> **Note on tier accuracy for breakout model:** Tier boundaries are defined on raw DPS
> (90/70/60/40), which doesn't map directly to breakout scores. Tier accuracy here uses the
> same thresholds applied to breakout values, so it's less meaningful for this model.
> Focus on Spearman and MAE instead.

### 3b. Top 15 Features (Breakout)

| Rank | Feature | Importance |
|------|---------|------------|
| 1 | `ffmpeg_resolution_height` | 0.0414 ████ |
| 2 | `ffmpeg_resolution_width` | 0.0379 ███ |
| 3 | `text_negative_word_count` | 0.0352 ███ |
| 4 | `audio_silence_ratio` | 0.0329 ███ |
| 5 | `meta_duration_seconds` | 0.0285 ██ |
| 6 | `hook_emotion_intensity` | 0.0266 ██ |
| 7 | `ffmpeg_duration_seconds` | 0.0247 ██ |
| 8 | `ffmpeg_avg_motion` | 0.0228 ██ |
| 9 | `ffmpeg_bitrate` | 0.0226 ██ |
| 10 | `text_flesch_reading_ease` | 0.0224 ██ |
| 11 | `text_syllable_count` | 0.0221 ██ |
| 12 | `ffmpeg_fps` | 0.0220 ██ |
| 13 | `hook_motion_ratio` | 0.0218 ██ |
| 14 | `text_exclamation_count` | 0.0213 ██ |
| 15 | `ffmpeg_cuts_per_second` | 0.0212 ██ |

### 3c. Breakout vs Raw-DPS Comparison

| Metric | Raw-DPS (Holdout) | Breakout (Holdout) | Winner |
|--------|-------------------|---------------------|--------|
| Spearman ρ | 0.7833 | 0.3726 | Raw-DPS |
| CV Spearman | 0.6144 | 0.3121 | Raw-DPS |
| MAE | 14.86 | 12.74 | Breakout (lower=better) |
| Within ±10 | 34.0% | 44.0% | Breakout |

---

## 4. Feature Group Ablation

### 4a. Raw-DPS Model — Leave-One-Group-Out

Baseline CV Spearman: 0.6144 | Baseline CV MAE: 11.22

| Group | Features Removed | CV ρ Without | Δρ | Δ MAE | Verdict |
|-------|------------------|--------------|----|-------|---------|
| ffmpeg_core | 12 | 0.5813 | +0.0331 | +0.40 | 🟢 HELPS |
| vision_hook | 3 | 0.6070 | +0.0074 | +0.12 | 🟢 HELPS |
| text_analysis | 14 | 0.6089 | +0.0055 | +0.10 | 🟢 HELPS |
| meta_content | 2 | 0.6170 | -0.0026 | +0.01 | ⚪ NEUTRAL |
| speaking_rate | 6 | 0.6235 | -0.0092 | +0.00 | 🔴 HURTS |
| audio_classifier | 4 | 0.6248 | -0.0104 | -0.12 | 🔴 HURTS |
| visual_scene | 3 | 0.6260 | -0.0117 | -0.02 | 🔴 HURTS |
| audio_prosodic | 10 | 0.6266 | -0.0122 | -0.03 | 🔴 HURTS |
| thumbnail | 5 | 0.6276 | -0.0132 | -0.09 | 🔴 HURTS |
| ffmpeg_segment | 5 | 0.6292 | -0.0149 | -0.11 | 🔴 HURTS |
| hook_scorer | 8 | 0.6297 | -0.0153 | -0.10 | 🔴 HURTS |

### 4b. Breakout Model — Leave-One-Group-Out

Baseline CV Spearman: 0.3121 | Baseline CV MAE: 9.01

| Group | Features Removed | CV ρ Without | Δρ | Δ MAE | Verdict |
|-------|------------------|--------------|----|-------|---------|
| ffmpeg_core | 12 | 0.2126 | +0.0995 | +0.26 | 🟢 HELPS |
| ffmpeg_segment | 5 | 0.2970 | +0.0151 | -0.03 | 🟢 HELPS |
| speaking_rate | 6 | 0.3113 | +0.0008 | -0.09 | ⚪ NEUTRAL |
| thumbnail | 5 | 0.3150 | -0.0028 | -0.10 | ⚪ NEUTRAL |
| meta_content | 2 | 0.3183 | -0.0062 | -0.03 | 🔴 HURTS |
| vision_hook | 3 | 0.3196 | -0.0075 | -0.07 | 🔴 HURTS |
| hook_scorer | 8 | 0.3196 | -0.0075 | -0.08 | 🔴 HURTS |
| audio_classifier | 4 | 0.3203 | -0.0082 | -0.08 | 🔴 HURTS |
| audio_prosodic | 10 | 0.3241 | -0.0120 | -0.13 | 🔴 HURTS |
| visual_scene | 3 | 0.3241 | -0.0120 | -0.10 | 🔴 HURTS |
| text_analysis | 14 | 0.3445 | -0.0324 | -0.10 | 🔴 HURTS |

### 4c. Ablation Summary

**Raw-DPS model:**
- Groups that HELP: ffmpeg_core, vision_hook, text_analysis
- Groups that HURT: speaking_rate, audio_classifier, visual_scene, audio_prosodic, thumbnail, ffmpeg_segment, hook_scorer

**Breakout model:**
- Groups that HELP: ffmpeg_core, ffmpeg_segment
- Groups that HURT: meta_content, vision_hook, hook_scorer, audio_classifier, audio_prosodic, visual_scene, text_analysis

---

## 5. Interpretation & Analysis

### Overfit Gap
- **Raw-DPS:** Train ρ=0.892 vs Holdout ρ=0.783 (gap: 0.109)
- **Breakout:** Train ρ=0.815 vs Holdout ρ=0.373 (gap: 0.442)
- **CV gives the most honest estimate** of generalization for both models.

### Raw-DPS Assessment
- CV Spearman 0.5–0.7: **Moderate** rank correlation. Useful for ranking but imprecise.
- Within ±10 DPS on holdout: 34% — many predictions are off by >10 DPS points.

### Breakout Assessment
- CV Spearman 0.312: Weak but detectable signal for breakout prediction.

### Key Differences in Feature Importance
The raw-DPS model and breakout model may weight features differently because:
- Raw DPS correlates with production quality + audience size effects in the cohort
- Breakout isolates *what makes a specific video outperform the creator's norm*

---

## 6. Should We Keep This Model Configuration?

### Raw-DPS Model
**Recommendation: KEEP (no change needed)**

The fresh retrain reproduces the v7 baseline within noise (CV Δρ = +0.0000,
holdout Δρ = +0.0000). The current v7 model with 72 content-only features is stable.
No configuration change required.

### Creator-Relative Breakout Model
**Recommendation: DEFER — signal is weak but present**

The breakout model (CV ρ = 0.312) shows a detectable but weak signal.
Not reliable enough for production use yet. Actions:
1. Continue collecting data — more videos per creator will strengthen the signal
2. Re-evaluate at 200+ videos from creators with 5+ videos each
3. Consider adding creator-specific features (past video performance patterns)

### Feature Group Actions

Based on ablation results:

**Consider removing from raw-DPS model:** speaking_rate, audio_classifier, visual_scene, audio_prosodic, thumbnail, ffmpeg_segment, hook_scorer
These groups reduce CV Spearman when included. Removing them may improve generalization.
However, with only 863 rows, noise in ablation is high. Monitor after next retrain.

### Next Actions

1. **Immediate:** No model file changes needed — v7 remains production model
2. **At 100+ labeled videos:** Retrain with updated data, re-run this evaluation
3. **At 200+ videos with 5+ per creator:** Re-evaluate breakout model viability
4. **If ablation shows consistent hurtful groups across retrains:** Remove them

---

*Report generated by `scripts/train-eval-prompt10.py`*
*Contamination firewall: holdout IDs in `models/holdout-video-ids.json` (50 videos, 10 per tier)*
