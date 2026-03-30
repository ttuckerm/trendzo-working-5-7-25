# Comprehensive Plan for 80-90% Prediction Accuracy

**Document:** Q-2L Answer — The God-Tier Question
**Created:** 2026-03-03
**Status:** Research & Planning Deliverable
**Context:** Prediction audit complete (5 phases), Buckets 1-3 complete, 15 decisions locked
**Question:** "If God Himself needed to build technology that can predictably pinpoint with 80-90% accuracy what needs to be contained in a video to make it go viral, how should He go about doing that?"

---

## Table of Contents

1. [Defining "80-90% Accuracy" Precisely](#1-defining-80-90-accuracy-precisely)
2. [Audit of Current System's Accuracy Potential](#2-audit-of-current-systems-accuracy-potential)
3. [The Data Problem](#3-the-data-problem)
4. [The Feature Engineering Problem](#4-the-feature-engineering-problem)
5. [The Model Architecture Question](#5-the-model-architecture-question)
6. [The Feedback Loop](#6-the-feedback-loop)
7. [The Component Optimization Path](#7-the-component-optimization-path)
8. [Concrete Milestones to 80-90%](#8-concrete-milestones-to-80-90)
9. [What's Structurally Impossible](#9-whats-structurally-impossible)

---

## 1. Defining "80-90% Accuracy" Precisely

### The Target Metric

**Primary metric:** Spearman rank correlation (rho) of 0.80-0.90 between predicted VPS and actual VPS, measured post-publication.

Spearman rank correlation measures whether the system correctly **orders** videos by performance — does a video predicted to score higher actually perform better than a video predicted to score lower? A Spearman rho of 0.85 means the system's ranking agrees with reality about 85% of the time. This is the right metric because:

- It works with small sample sizes (even N=27, though unreliably)
- It measures ranking accuracy, which is what creators need ("Is this script better than that one?")
- It's invariant to scale — the absolute VPS number doesn't have to match the absolute actual performance, just the relative ordering
- It's the metric used by the leading academic benchmark (SMP Challenge) for social media popularity prediction

**Secondary metrics** (to be added as data volume grows):

| Metric | What It Measures | When to Add |
|--------|-----------------|-------------|
| **Spearman rho** (primary) | Ranking accuracy | Now (already in Spearman evaluator) |
| **Top-decile precision** | "When we say a video will go viral, how often is it actually in the top 10%?" | At 500+ labeled videos |
| **Expected Calibration Error (ECE)** | "When we say 70% confidence, are we right ~70% of the time?" | At 500+ labeled videos |
| **NDCG@10** | Quality of the top-10 ranked predictions | At 1,000+ labeled videos |
| **Binary AUC** | Viral vs. not-viral classification accuracy | At 300+ labeled videos with binary labels |

### The Current Baseline

**Unknown — and that's the single biggest problem.**

With only 27 labeled videos in 1 niche (Side Hustles), we cannot produce a statistically reliable Spearman correlation. The standard error for Spearman rho with N=27 is approximately ±0.19, meaning a measured correlation of 0.50 could actually be anywhere from 0.31 to 0.69. This is too noisy to be a baseline.

What we DO know from the v6 XGBoost model metadata:
- Cross-validation R²: **-164,093** (catastrophically overfit — predicts worse than guessing the mean)
- Eval R²: **0.0** (explains none of the variance in the held-out set)
- Train R²: **0.983** (memorized the training data perfectly)
- Only 4 of 42 features matter (text_avg_word_length: 42.4%, text_char_count: 33.5%, visual_complexity: 20.7%, duration_seconds: 3.2%)

**Plain English:** The current ML model has zero predictive validity. It memorized 21 videos and cannot generalize. The overall system may still produce somewhat useful predictions via its non-ML components (LLM analysis, pattern matching, rule-based scoring), but we have no measurement of their actual accuracy.

### Sample Size Required for Reliable Measurement

| Sample Size | Standard Error (Spearman) | Can We Trust It? |
|------------|--------------------------|-----------------|
| 27 (current) | ±0.19 | No — far too noisy |
| 50 | ±0.14 | Barely — can detect gross failures only |
| 100 | ±0.10 | Somewhat — can distinguish 0.30 from 0.50 |
| 200 | ±0.07 | Yes — reliable enough for milestone decisions |
| 500 | ±0.04 | Strong — reliable for fine-grained comparison |
| 1,000 | ±0.03 | High confidence — suitable for A/B testing components |

**Minimum viable measurement:** 100 labeled videos per niche to establish a defensible baseline. 200+ to make milestone decisions with confidence. This applies to EACH niche independently — a model trained on Side Hustles data tells us nothing about Fitness or Cooking accuracy.

---

## 2. Audit of Current System's Accuracy Potential

### Components That Genuinely Contribute to Prediction Accuracy

Based on the 5-phase audit (1,903 lines of verified findings), here is the honest assessment of what each component contributes:

#### Tier 1: Real Signal (Contributes Genuine Predictive Information)

| Component | What It Does | Evidence of Value |
|-----------|-------------|-------------------|
| **Pack 1: Unified Grading** (when REAL) | LLM grades 9 content attributes via Gemini | Real AI content analysis on hook, shareability, emotional journey, etc. Each attribute corresponds to features research identifies as predictive |
| **FFmpeg Visual Analysis** | Real video file analysis — motion, brightness, scenes, faces | Physical video properties. Research shows face presence +38% engagement (Bakhshi et al., CHI 2014) |
| **Pack V: Visual Rubric** (with Gemini Vision) | Frame extraction + AI visual scoring | Now blends 40% rule-based + 60% Gemini Vision (D13, Bucket 3). Captures visual quality dimension |
| **Hook Scorer** | Scores opening hook quality | Hook strength is consistently among top predictive features in TikTok research |
| **Audio Analyzer** | Audio characteristics analysis | Audio features consistently improve predictions in multimodal models |
| **Whisper Transcription** | Converts audio to text for downstream analysis | Enabler — feeds all text-based components |

#### Tier 2: Moderate Signal (Some Predictive Value, Needs Validation)

| Component | What It Does | Concern |
|-----------|-------------|---------|
| **9 Attributes Scorer** | 9 content quality attributes from text | Pattern-matching, not LLM — quality of signal unclear |
| **7 Idea Legos** | 7 viral content pattern detection | Theoretical framework, not empirically validated |
| **24 Video Styles Classifier** | Classifies into 24 style categories | Useful for niche-relative scoring, but accuracy of classification unknown |
| **Gemini Analysis** (qualitative) | Real Gemini API call for qualitative assessment | Genuine AI analysis, but adds to score via path aggregation with unclear weighting |
| **Pattern Extraction** | Identifies viral patterns | Unclear which patterns are actually predictive |
| **Virality Indicator** | 6-factor proprietary algorithm | Runs locally, no external validation |

#### Tier 3: Noise or Unknown (May Hurt More Than Help)

| Component | What It Does | Problem |
|-----------|-------------|---------|
| **GPT-4 Component** | Heuristic analysis (NOT real GPT-4) | RF-1.4: Name is misleading. Uses keyword heuristics, not API call. Contributes noise. |
| **XGBoost v5 (heuristic)** | Hardcoded 14-weight formula pretending to be ML | RF-2.2: Not ML at all. A hand-tuned formula. |
| **XGBoost v6 (trained)** | Real trained model on 27 videos | RF-2.1: Catastrophically overfit. R² = -164,093 on cross-validation. |
| **Virality Matrix** | Uses OpenAI API | Unclear what it adds beyond Gemini/Claude qualitative analysis — potential redundancy |
| **Pack 2: Editing Coach** | Rule-based improvement suggestions | Does NOT contribute to score (advisory only). Its RUBRIC_WEIGHTS claim XGBoost origin but are likely fictional (RF-4.5) |
| **Pack 3: Viral Mechanics** | Stub — returns "not implemented" | Contributes literally nothing (RF-4.1) |
| **Niche Keywords** | Always disabled at runtime | Contributes nothing |
| **Historical Path (all 4 components)** | All disabled/commented out | Contributes nothing. 15% base weight redistributed (RF-1.3) |

#### Tier 4: Infrastructure (Not Predictive, But Necessary)

| Component | Role |
|-----------|------|
| **Feature Extraction** | Extracts 106 features for XGBoost — infrastructure, not a prediction itself |
| **Thumbnail Analyzer** | Feeds into Pack V — infrastructure component |
| **Visual Scene Detector** | Feeds into Pack V — infrastructure component |

### Structural Problems Hurting Accuracy (from audit)

1. **Double high-prediction reduction** (RF-3.2): Orchestrator conservative pull (-5% to -8%) AND calibrator Rule 4 (-15% to -25%) compound. A raw 85 becomes ~62.6. Over-penalizes genuinely strong content.

2. **LLM Consensus Gate** (Phase 3): If LLM predictions disagree by >10 VPS, ALL LLM weights are zeroed. This throws away the most sophisticated analysis when components disagree — which is exactly when their individual perspectives might be most valuable.

3. **Path weighting is arbitrary** (Phase 1): Quantitative 15%, Qualitative 25%, Pattern-Based 45%, Historical 15%. These weights have no empirical basis. With Historical contributing nothing, its 15% just inflates the other paths.

4. **Disagreement reconciliation gives Gemini 3x weight** (D9): When paths disagree, `performDisagreementReconciliation` hardcodes a 3x Gemini boost. There's no evidence Gemini IS the most accurate path. This is an assumption, not a measurement.

5. **No component produces calibrated probabilities** (OQ-3.9): Each component returns a 0-100 number, but these are on different scales. A "70" from the hook scorer, a "70" from Gemini, and a "70" from the virality indicator mean completely different things. Averaging them is mathematically questionable.

---

## 3. The Data Problem

### The Core Bottleneck

**27 labeled videos in 1 niche is the single biggest obstacle to improving accuracy.** Every other problem — model architecture, feature engineering, component optimization — is secondary. Without sufficient labeled data, we cannot:

- Measure current accuracy reliably
- Train or retrain any ML model
- Validate whether a change improved or hurt prediction quality
- Build the component efficacy evaluation system (D2)
- Compute niche-specific calibration baselines (D3)

### What Volume Is Needed Per Niche?

Based on academic literature and practical ML constraints:

| Milestone | Videos Per Niche | Total Across 20 Niches | What It Unlocks |
|-----------|-----------------|----------------------|-----------------|
| **Minimum viable** | 100 | 2,000 | First reliable Spearman measurement. XGBoost v6 retrain possible (start with ~15 features). Component efficacy evaluation (D2) feasible. |
| **Solid foundation** | 300 | 6,000 | Progressive feature expansion (42 → 60 features). Niche-specific calibration baselines (D3). Reliable A/B testing of component changes. |
| **Production-grade** | 500 | 10,000 | Full 106-feature XGBoost training. Neural/ensemble model experiments viable. Statistical significance for fine-grained decisions. |
| **Research-competitive** | 1,000+ | 20,000+ | Comparable to academic benchmarks (SMP Challenge uses 500K). Deep learning approaches become viable. Per-niche accuracy guarantees. |

**Critical insight:** The per-niche requirement matters more than the total. 1,000 Side Hustles videos and 0 Fitness videos doesn't help predict Fitness. Cross-niche transfer learning can help, but each niche needs its own validation set of at least 50-100 videos.

### How Long Will the Automated Pipeline Take?

The Bucket 3 automated training pipeline consists of:
- **Backfill scheduling:** Daily at 01:00 UTC — creates future metric collection windows
- **Metric collection:** Every 12 hours via Apify scraper — collects actual view/engagement data
- **Auto-labeler:** Nightly at 03:30 UTC — computes actual VPS from collected metrics using lenient thresholds
- **Spearman evaluation:** Weekly on Sundays at 05:00 UTC

**Collection rate depends on:**
1. How many predictions are run through the pipeline (each creates a `prediction_runs` record that can later be labeled)
2. How many of those predicted videos are actually published on TikTok
3. How many published videos have their metrics successfully scraped by Apify

**Optimistic scenario** (10 predictions/day, 50% publish rate, 80% scrape success):
- ~4 labeled videos/day → 100 in ~25 days → 300 in ~75 days → 500 in ~125 days
- But this is for a single niche. Across 20 niches: ~5 months for 100 per niche at this rate.

**Realistic scenario** (3 predictions/day, 30% publish rate, 60% scrape success):
- ~0.5 labeled videos/day → 100 in ~200 days (~7 months) → 300 in ~20 months
- This is too slow. Active data collection strategies are needed.

### Accelerating Data Collection

| Strategy | Effort | Impact | Timeline |
|----------|--------|--------|----------|
| **Retroactive scraping** — Scrape existing TikTok videos in each niche, run them through prediction pipeline, then collect actual metrics | Medium | High — could generate 100+ labeled videos per niche in weeks | 2-4 weeks to set up |
| **Partner creator program** — Recruit 5-10 creators per niche who agree to run all drafts through Trendzo before publishing | High | Very high — guaranteed publish + metric access | 1-3 months to establish |
| **Historical data import** — Import any existing labeled datasets (academic or commercial) for transfer learning | Low | Moderate — different platforms/niches reduce direct value | 1-2 weeks |
| **Synthetic augmentation** — Use existing labeled videos to generate augmented training examples (transcript variations) | Medium | Low-moderate — synthetic data quality is debatable | 2-3 weeks |
| **Public dataset bootstrapping** — Use datasets like Reddit-V (27K posts), SMP Challenge (500K posts) for pre-training, then fine-tune on TikTok data | Medium | Moderate — cross-platform transfer has limitations | 2-4 weeks |

**Recommendation:** Retroactive scraping is the highest-ROI strategy. Pick 5 priority niches, scrape 200+ existing TikTok videos per niche, run each through the prediction pipeline (transcript extraction via Whisper + full component analysis), then collect their actual view/engagement metrics over 7-30 days. This could generate 1,000+ labeled data points within a month.

---

## 4. The Feature Engineering Problem

### Current State: 42 of 106 Features Used

The feature extraction service extracts **106 features across 11 groups (A-K)**. XGBoost v6 uses only 42 of them. The 18 fake keyword-matching features were fixed in Bucket 3 (Prompt 3) — XGBoost now reads real component results from `input.componentResults`.

But the current v6 model's feature importance reveals a deeper problem: **only 4 features carry any weight**, and they're all surface-level text metrics:

| Feature | Importance | What It Captures |
|---------|-----------|-----------------|
| text_avg_word_length | 42.4% | Simpler words (shorter avg) → more viral |
| text_char_count | 33.5% | Total transcript length |
| visual_complexity | 20.7% | FFmpeg-derived visual complexity |
| duration_seconds | 3.2% | Video length |
| **All 38 other features** | **<0.15% combined** | Effectively ignored |

This isn't because those 38 features don't matter — it's because **27 training examples can only support 3-4 effective features before overfitting**. With more data, XGBoost would learn to use motion_score, has_faces, has_music, component predictions, and LLM scores.

### The 64 Unused Features: Prioritized by Expected Impact

**High-priority additions** (Groups D, E — emotional and viral language patterns):

| Group | Features | Why They Matter |
|-------|----------|----------------|
| **D: Emotional & Power Words** (20 features) | positive/negative emotion count, power words, urgency words, curiosity words, sentiment polarity, emotional intensity, emotional volatility | Academic research consistently identifies emotional valence as a top predictor of sharing behavior. Berger & Milkman (2012) showed high-arousal emotions (awe, anxiety, anger) increase virality 34%. Currently **completely unused**. |
| **E: Viral Pattern Words** (15 features) | shock words, social proof, authority, scarcity, storytelling markers, transformation words, call-to-action count | These map directly to Cialdini's influence principles and viral content frameworks. story-telling markers and transformation words capture narrative structure — one of the strongest content-level predictors. Currently **completely unused**. |

**Medium-priority additions** (Groups B, C, H — structural and engagement signals):

| Group | Features | Why They Matter |
|-------|----------|----------------|
| **B: Punctuation Analysis** (10 features) | question marks, exclamations, ellipsis, commas | Punctuation patterns correlate with conversational tone and emotional emphasis. Question marks predict engagement (direct audience address). |
| **C: Pronoun & Perspective** (8 features) | 1st/2nd/3rd person ratios, perspective shifts | Second-person pronouns ("you") increase perceived relevance. Perspective shifts create narrative dynamism. |
| **H: Dialogue & Interaction** (5 features) | direct questions, rhetorical questions, imperative count, conversational tone score | Measures how much the creator addresses the audience — a key TikTok engagement driver. |

**Lower-priority additions** (Groups F, G, I, J — formatting and structure):

| Group | Features | Why They Matter |
|-------|----------|----------------|
| **F: Capitalization & Formatting** (5 features) | ALL CAPS usage, title case ratio, caps abuse score | Formatting signals emphasis patterns, but likely redundant with emotional intensity |
| **G: Linguistic Complexity** (10 features) | rare words, jargon, slang, technical terms, lexical density | Content accessibility matters — simpler language generally performs better on TikTok |
| **I: Content Structure** (8 features) | lists, sections, transitions, intro/body ratio | Structural organization signals, less important for short-form video than long-form |
| **J: Timestamp & Pacing** (4 features) | words/second, pause count, rapid segments | Speech pacing — potentially very predictive for TikTok but needs video file |

### Feature Engineering Strategy

**Phase 1 (at 100 labeled videos):** Start with the current 42 features, but with real component results instead of fake heuristics. Train with aggressive regularization (max_depth=3, min_child_weight=10) to prevent overfitting. Measure baseline Spearman.

**Phase 2 (at 300 labeled videos):** Add Groups D and E (35 emotional/viral pattern features) → 77 features total. These are the highest-expected-impact additions based on research. Compare Spearman before/after.

**Phase 3 (at 500 labeled videos):** Add Groups B, C, H (23 structural/engagement features) → 100 features total. Use feature importance analysis to prune any that show zero contribution.

**Phase 4 (at 1,000+ labeled videos):** Use all 106 features. Add interaction features (e.g., emotional_intensity × hook_strength). Experiment with automated feature selection (Boruta, recursive elimination).

### Beyond Engineered Features: Embedding-Based Features

The current system uses hand-engineered features only. Modern approaches add:

1. **CLIP embeddings** — Run video frames through CLIP to get a 512/768-dimensional visual-semantic embedding. This captures "what the video looks like" in a way that rule-based features cannot. The Reddit-V benchmark showed fine-tuned CLIP outperforming all other approaches for pre-engagement virality prediction.

2. **Text embeddings** — Run the transcript through a sentence transformer (e.g., all-MiniLM-L6-v2) to get semantic embeddings. These capture meaning, not just word counts. Two scripts with the same word count but different topics would get identical features from Groups A-J but very different embeddings.

3. **Audio embeddings** — Run the audio through a model like wav2vec2 or Whisper's encoder to capture vocal tone, pacing, energy. Research shows audio attractiveness is a significant predictor.

**Implementation note:** These embeddings would be high-dimensional (512-1024 features each). XGBoost can handle them with dimensionality reduction (PCA to 20-50 components), or they can be fed directly to neural network architectures.

---

## 5. The Model Architecture Question

### Is XGBoost the Right Model?

**For the current data regime (27-500 labeled videos): Yes, XGBoost is the correct choice.**

The academic literature is clear on this:

- **XGBoost consistently outperforms neural networks on tabular/engineered feature sets**, especially with small-to-medium datasets. The ACM MM 2019 SMP Challenge winning approach used XGBoost on visual-textual features.
- **Gradient boosting models require less data** to achieve reasonable performance compared to deep learning approaches.
- **XGBoost handles mixed feature types well** — continuous (emotion counts), categorical (niche), binary (has_faces) — without extensive preprocessing.
- **XGBoost provides feature importance** — critical for the component efficacy evaluation (D2) since we need to know WHICH features drive accuracy.

**D1 (Keep XGBoost, fix properly) was the right decision.** The problem is not the model architecture — it's the training data volume.

### When to Consider Alternatives

| Data Volume | Recommended Architecture | Why |
|------------|------------------------|-----|
| 27-300 videos | **XGBoost** (regularized) | Only viable option with this little data. Use max_depth=3-5, high regularization. |
| 300-1,000 | **XGBoost ensemble** | Multiple XGBoost models (one per feature group) with a stacking meta-learner. Reduces overfitting risk while capturing feature interactions. |
| 1,000-5,000 | **Hybrid: XGBoost + LLM embeddings** | Feed CLIP/text embeddings through PCA, combine with engineered features in XGBoost. Best of both worlds. |
| 5,000-20,000 | **Multimodal neural network** | Architecture like AMPS (BiLSTM + Self-Attention + Co-Attention) that processes video frames, text, and audio jointly. Data volume finally justifies deep learning overhead. |
| 20,000+ | **Transformer-based multimodal** | ViViT (Video Vision Transformer) or CLIP-based end-to-end models. The SMP Challenge leaders use architectures in this class. |

### The Hybrid LLM+ML Approach (Most Promising for Trendzo)

Academic research from ACL 2025 shows that combining LLM judgments with supervised ML achieves the best results:

- Supervised neural network alone: 80% accuracy (binary)
- LLM alone (zero-shot): 82% accuracy
- **Combined: 85.5% accuracy**

Trendzo is uniquely positioned for this approach because **it already has both LLM components (Pack 1 Gemini grading, Gemini qualitative, Claude analysis) AND an ML model (XGBoost)**. The current system runs them in parallel and averages their outputs. A better architecture would:

1. **LLM components** produce structured feature-level assessments (Pack 1's 9 attribute scores, qualitative confidence ratings)
2. **These assessments become features** for XGBoost (already partially implemented via Bucket 3 — component results now feed into XGBoost)
3. **XGBoost learns the optimal weighting** of LLM judgments vs. engineered features vs. video analysis from labeled data
4. **The LLM provides the "what" and "why"** (content quality assessment), XGBoost learns "how much each matters" (empirical weighting)

This is fundamentally different from the current system, which averages everything with hardcoded path weights. Instead, the ML model would **learn** the weights from data.

### What Academic/Industry Research Says

**Key finding from the literature review:**

| Source | Architecture | Dataset | Best Result | Notes |
|--------|-------------|---------|-------------|-------|
| SMP Challenge 2024 | Various (multimodal) | 500K posts | Spearman ~0.75 (test) | Includes user metadata; best academic benchmark |
| ACL 2025 (LLM study) | Neural + LLM hybrid | 13.6K videos | 85.5% binary accuracy | Binary classification, not rank prediction |
| Reddit-V 2025 | Fine-tuned CLIP | 27K posts | +7% over zero-shot LLM | Pre-engagement prediction benchmark |
| Multimodal sentiment 2025 | Multimodal ensemble | 127K videos | 89.7% dissemination accuracy | Includes sentiment features |
| XGBoost on TikTok (2024) | XGBoost | ~10K videos | 84.3% binary accuracy | Content + metadata features |
| TikTok indicators (2021) | Deep learning + scene dynamics | ~5K videos | Spearman >0.23 | Content-only, rank prediction |

**Critical nuance:** The studies reporting 80%+ accuracy are doing **binary classification** (viral vs. not-viral), which is a fundamentally easier problem than rank prediction (Spearman rho). A binary classifier just needs to put videos in the right bucket; rank prediction needs to correctly order ALL videos relative to each other.

---

## 6. The Feedback Loop

### The Virtuous Cycle (Now Automated)

Bucket 3 established the automated training pipeline. Here's how the feedback loop works:

```
┌─────────────────────────────────────────────────────────────┐
│                    THE ACCURACY FLYWHEEL                     │
│                                                             │
│  1. PREDICT                                                 │
│     Creator uploads video → Pipeline produces VPS           │
│     (All component results + features stored in DB)         │
│                                   │                         │
│  2. PUBLISH                       ▼                         │
│     Creator posts video to TikTok                           │
│     (backfill-scheduler creates metric collection window)   │
│                                   │                         │
│  3. MEASURE                       ▼                         │
│     Apify scraper collects actual metrics (every 12h)       │
│     (views, likes, comments, shares at 24h/48h/7d/30d)     │
│                                   │                         │
│  4. LABEL                         ▼                         │
│     Auto-labeler computes actual VPS from real metrics      │
│     (DynamicPercentileSystem computes cohort percentile)    │
│                                   │                         │
│  5. EVALUATE                      ▼                         │
│     Spearman evaluator: predicted VPS vs actual VPS         │
│     (Weekly on Sundays at 05:00 UTC)                        │
│                                   │                         │
│  6. RETRAIN (manual trigger at milestones)   ▼              │
│     Export labeled data → Retrain XGBoost v7/v8/...         │
│     Updated model deployed → Better predictions             │
│                                   │                         │
│  7. BACK TO STEP 1 ◄─────────────┘                         │
│     Better predictions → More trust → More usage            │
│     More usage → More labeled data → Better models          │
└─────────────────────────────────────────────────────────────┘
```

### Expected Accuracy Trajectory

This trajectory is based on the academic literature, adjusted for Trendzo's specific system:

| Data Volume | Expected Spearman (content-only) | Expected Spearman (content + creator metadata) | What Drives Improvement |
|------------|--------------------------------|----------------------------------------------|------------------------|
| 27 (current) | Unmeasurable (too noisy) | N/A | N/A — need data first |
| 100 | 0.15-0.25 | 0.20-0.30 | First real XGBoost training. Most features still noise. |
| 300 | 0.25-0.35 | 0.30-0.45 | Emotional/viral features start contributing. Component efficacy evaluation identifies noise. |
| 500 | 0.30-0.45 | 0.40-0.55 | Full feature set. Niche-specific calibration. Remove/fix harmful components. |
| 1,000 | 0.35-0.50 | 0.45-0.60 | Hybrid LLM+ML approach. Embeddings added. Per-niche models. |
| 5,000+ | 0.40-0.55 | 0.55-0.70 | Neural approaches viable. Multimodal end-to-end models. |
| 20,000+ | 0.45-0.60 | 0.60-0.75 | Approaching academic benchmark ceiling. Diminishing returns. |

**Key insight from the literature:** The SMP Challenge (the premier academic benchmark with 500K posts) tops out at Spearman ~0.75 on test data, and that includes user metadata (follower count, posting history). Pure content-only rank prediction achieves Spearman 0.20-0.35 in most published work. Adding user metadata pushes it to 0.40-0.60. Adding early engagement signals pushes it to 0.70-0.90+.

### How the Feedback Loop Drives Each Improvement

**Cycle 1 (100 labeled videos):**
- First real Spearman measurement → establishes baseline
- Retrain XGBoost with real features → immediate jump from -164K R² to something positive
- Identify which components' predictions actually correlate with outcomes

**Cycle 2 (300 labeled videos):**
- Component efficacy evaluation (D2) reveals which components to keep/fix/remove
- Calibration redesign (D3) → cohort-aware baselines replace crude multipliers
- Feature expansion → emotional and viral pattern features added

**Cycle 3 (500+ labeled videos):**
- Per-niche models possible for top niches
- Confidence calibration meaningful → user-facing confidence becomes trustworthy
- A/B testing component changes is statistically valid

**Cycle 4 (1,000+ labeled videos):**
- Hybrid LLM+ML approach → XGBoost learns optimal LLM weighting from data
- Embedding features added (CLIP visual, text semantic)
- Diminishing returns per additional data point → focus shifts to architecture improvements

---

## 7. The Component Optimization Path

### When D2 (Component Efficacy Evaluation) Is Built at 100+ Labeled Videos

D2 is the ablation testing framework that answers: "If I remove component X, does accuracy go up or down?" Here's the process:

#### Step 1: Establish Baseline

Run the full pipeline on 100+ labeled videos. Compute Spearman rho of predicted VPS vs actual VPS. This is the baseline score.

#### Step 2: Leave-One-Out Ablation

For each of the ~20 active components:
1. Re-run predictions with that component's results zeroed out
2. Compute Spearman rho without that component
3. Calculate delta: `component_value = baseline_spearman - ablated_spearman`

If removing a component **increases** Spearman, that component is **actively hurting accuracy**. If removing it **decreases** Spearman, that component is contributing value.

#### Step 3: Identify and Remove Harmful Components

Components that consistently hurt accuracy (negative delta) should be:
1. First investigated — WHY is it hurting? Is it producing random noise? Is it biased in a specific direction?
2. If the signal is salvageable, fix the component (better prompts, better heuristics, better calibration)
3. If the signal is fundamentally noisy, disable the component

**Likely candidates for removal** (based on audit findings):
- **GPT-4 component** (RF-1.4): Uses heuristics, not real GPT-4. Likely adds noise.
- **Niche Keywords** (Phase 1): Already disabled. Should stay disabled.
- **Virality Matrix**: Unclear what it adds beyond other LLM components. May be redundant.

#### Step 4: Optimize Remaining Components

For components that show positive value:
1. Measure their individual contribution (positive delta)
2. Rank by value-to-cost ratio (prediction improvement per dollar of API cost)
3. Experiment with component-level improvements:
   - Better LLM prompts for Pack 1 → improved attribute scoring
   - More granular visual analysis in Pack V → better visual signal
   - Updated pattern libraries for 7 Legos / 9 Attributes

#### Step 5: Measure Improvement

After removing harmful components and optimizing valuable ones:
1. Re-compute Spearman rho on the same 100+ video test set
2. Compare to baseline: "We went from Spearman 0.22 to 0.31 by removing GPT-4 heuristic and fixing Pack 1 prompts"
3. Document what changed and why

### The Weight Learning Problem

The current system uses hardcoded path weights (Quantitative 15%, Qualitative 25%, Pattern-Based 45%, Historical 15%). These weights are arbitrary — no empirical basis.

**The fix:** Let XGBoost learn the optimal weights from data. Since XGBoost now receives real component prediction/confidence pairs as features (Bucket 3 fix), it will naturally learn:
- "Pack 1's hook_strength attribute is highly predictive → weight it more"
- "The virality indicator's prediction is noisy → weight it less"
- "FFmpeg's motion_score matters for fitness videos but not for talking-head finance content → niche-dependent weighting"

This eliminates the need for hand-tuned path weights entirely. The ML model becomes the weighting mechanism.

---

## 8. Concrete Milestones to 80-90%

### The Honest Framing

Before laying out milestones, the question must be reframed. The original question asks about "80-90% accuracy" — and the answer depends critically on what we're measuring:

| What We're Predicting | 80-90% Achievable? | What It Would Take |
|-----------------------|-------------------|-------------------|
| **Binary: viral or not** (content + metadata) | **Plausible** at 80%. 90% requires early engagement data. | 1,000+ labeled videos, hybrid LLM+ML, creator metadata integration |
| **Binary: viral or not** (content-only) | **Difficult** — 70-75% more realistic ceiling | 5,000+ labeled videos, multimodal deep learning |
| **Rank ordering** (Spearman 0.80-0.90) | **Not achievable with content-only prediction.** Academic state of the art with ALL features tops out at ~0.75. | Would require post-publication early engagement signals — fundamentally changes the product |
| **Relative quality assessment** ("Is Script A better than Script B?") | **Most achievable** — pairwise comparison is easier than absolute ranking | 500+ labeled videos, well-calibrated LLM+ML hybrid |
| **Niche-relative percentile** ("Top 20% for cooking content") | **Plausible** at 80% for well-represented niches | 500+ per niche, cohort-aware calibration (D3) |

**The most honest and commercially valuable target:** Build a system that can reliably tell a creator "This script/video is in the top X% of content quality for your niche" with 80%+ reliability, AND correctly rank two competing scripts/videos 80%+ of the time (pairwise accuracy).

This is achievable. Absolute Spearman of 0.80-0.90 against actual view counts is not, because too much variance comes from factors outside the video's content.

### Milestone Roadmap

---

#### Milestone 1: Establish Baseline (Target: 100 labeled videos)

**System changes:**
- [ ] Accelerate data collection via retroactive scraping (Section 3)
- [ ] First real XGBoost v7 training with real component features
- [ ] Start with 15-20 features (aggressive regularization)
- [ ] First reliable Spearman measurement

**Expected accuracy:** Spearman 0.15-0.25 (content-only), pairwise accuracy ~60%

**Decision gates:**
- If Spearman < 0.10: Something is fundamentally wrong — audit feature pipeline, check for data quality issues
- If Spearman 0.15-0.25: On track — proceed to Milestone 2
- If Spearman > 0.30: Better than expected — may indicate data leakage, investigate before celebrating

**Triggered decisions:** D1 (retrain XGBoost), D2 (build component efficacy evaluation)

---

#### Milestone 2: Component Optimization (Target: 300 labeled videos)

**System changes:**
- [ ] Build component efficacy evaluation (D2) — ablation testing framework
- [ ] Remove/fix components that hurt accuracy (expected: GPT-4 heuristic, possibly virality matrix)
- [ ] Add Group D + E features (35 emotional/viral pattern features)
- [ ] Implement calibration redesign (D3) — cohort-aware baselines replace crude multipliers
- [ ] Consolidate double calibration into single pass (D10)
- [ ] Retrain XGBoost v8 with expanded features and cleaned components

**Expected accuracy:** Spearman 0.25-0.40, pairwise accuracy ~65-70%

**Decision gates:**
- Measure accuracy delta from each change individually
- If removing a component improved accuracy > 0.02 Spearman: Keep it removed
- If calibration redesign didn't improve accuracy: Revert to crude multipliers, investigate

**Triggered decisions:** D3 (cohort-aware baselines), D9 (disagreement reconciliation redesign)

---

#### Milestone 3: Hybrid LLM+ML Architecture (Target: 500 labeled videos)

**System changes:**
- [ ] Integrate creator metadata as features (follower count, posting frequency, account age)
- [ ] LLM embeddings as features (CLIP visual embeddings via PCA → XGBoost)
- [ ] Per-niche models for top 3-5 niches with sufficient data
- [ ] Let XGBoost learn component weights from data (eliminate hardcoded path weights)
- [ ] Top-decile precision and ECE metrics operational
- [ ] Confidence calibration meaningful → user-facing confidence display (graduate D6)

**Expected accuracy:** Spearman 0.35-0.50 (content-only), 0.45-0.60 (with creator metadata), pairwise accuracy ~72-78%

**Decision gates:**
- If per-niche models outperform global model by > 0.05 Spearman: Invest in per-niche training
- If creator metadata adds > 0.10 Spearman: Make it a required input
- If CLIP embeddings add > 0.05 Spearman: Invest in multimodal pipeline

---

#### Milestone 4: Multimodal and Scale (Target: 1,000+ labeled videos)

**System changes:**
- [ ] Full 106-feature XGBoost with automatic feature selection
- [ ] Experiment with stacking ensemble (multiple XGBoost + neural meta-learner)
- [ ] Text semantic embeddings (sentence transformer) as features
- [ ] Audio embeddings (wav2vec2) as features for videos with audio
- [ ] Per-niche models for 10+ niches
- [ ] A/B testing framework for component experiments

**Expected accuracy:** Spearman 0.40-0.55 (content-only), 0.50-0.65 (with metadata), pairwise accuracy ~78-82%

**Decision gates:**
- If ensemble outperforms single XGBoost by > 0.03 Spearman: Ship ensemble
- If accuracy plateau is hit: Consider the structural ceiling (Section 9)
- If pairwise accuracy reaches 80%: Celebrate — this is commercially very strong

---

#### Milestone 5: Approaching the Ceiling (Target: 5,000+ labeled videos)

**System changes:**
- [ ] Consider multimodal neural architecture (BiLSTM + Attention or ViViT)
- [ ] Temporal features (posting time, trend alignment) if data supports
- [ ] Transfer learning from larger datasets (SMP Challenge, YouTube data)
- [ ] Real-time model updating (incremental learning from new labeled data)

**Expected accuracy:** Spearman 0.45-0.60 (content-only), 0.55-0.70 (with metadata), pairwise accuracy ~80-85%

**This is likely near the ceiling for content-based prediction.** Further improvements require:
- Early engagement signals (first 1-4 hours of views) → pushes Spearman to 0.70-0.90
- Platform algorithm access (not available) → unknown potential
- Network/social graph data (not available) → significant but impractical

---

### Summary: What Accuracy to Expect When

| Labeled Videos | Spearman (content-only) | Spearman (with creator metadata) | Pairwise Accuracy | Binary Viral/Not |
|---------------|------------------------|----------------------------------|-------------------|-----------------|
| 27 (now) | Unmeasurable | N/A | Unknown | Unknown |
| 100 | 0.15-0.25 | 0.20-0.30 | ~60% | ~60% |
| 300 | 0.25-0.40 | 0.35-0.50 | ~65-70% | ~68% |
| 500 | 0.35-0.50 | 0.45-0.60 | ~72-78% | ~74% |
| 1,000 | 0.40-0.55 | 0.50-0.65 | ~78-82% | ~78% |
| 5,000 | 0.45-0.60 | 0.55-0.70 | ~80-85% | ~82% |
| 20,000+ | 0.50-0.65 | 0.60-0.75 | ~82-87% | ~85% |

---

## 9. What's Structurally Impossible

### The MusicLab Experiment: The Foundational Finding

**Salganik, Dodds & Watts (Science, 2006)** ran the definitive experiment on inherent unpredictability of cultural success. 14,341 participants downloaded unknown songs in 8 parallel "worlds" — identical content, different social influence visibility:

> "The best songs rarely did poorly, and the worst songs rarely did well, but any other result was possible."

The middle ~80% of quality was essentially a lottery. Which specific piece of content in the "good enough" band succeeds is heavily path-dependent — determined by who sees it first, whether early viewers engage, and whether the platform algorithm amplifies it.

**Key implication for Trendzo:** A content quality assessment system can reliably identify the top 10% and bottom 20% of content. But among the middle 70%, predicting which specific video will go viral vs. perform averagely is structurally limited by factors outside the content itself.

### Hofman, Sharma & Watts (Science, 2017): Theoretical Limits

This seminal paper argued that prediction limits in complex social systems arise from two sources:

1. **Insufficient data/models** — solvable with more data and better algorithms
2. **Inherent unpredictability** — NOT solvable, even with perfect data

They showed that even with all available features (content, network, user, temporal), the best models explained **less than half the variance** (R² < 0.50) in social cascade sizes. The unexplained variance isn't a data gap — it's genuine randomness in complex social systems.

### What Makes TikTok Virality Particularly Hard to Predict

**1. Algorithmic Amplification (The Biggest Factor)**

Unlike YouTube or Instagram where distribution correlates with subscriber count, TikTok's For You Page algorithmically decides distribution. Two identical videos posted by the same creator can have 10x-100x different reach based on:
- How the first ~200-500 viewers (algorithmically selected) react
- Whether the video gets pushed to the next tier of distribution
- Platform-internal A/B testing and experimentation
- Content moderation decisions

This is a **black box that external tools cannot access**. It dominates the variance in actual performance.

**2. Social Cascade Dynamics**

Rich-get-richer dynamics mean early random fluctuations get amplified:
- A video that happens to get shared by one influential viewer early may cascade
- An identical video without that lucky early share may stagnate
- These cascade dynamics are chaotic — sensitive to initial conditions that are invisible to content analysis

**3. External Events and Context**

- A cooking video about a recipe goes viral because a celebrity mentioned that ingredient yesterday
- A finance video flops because a major market crash dominates the news cycle
- A comedy video explodes because it accidentally mirrors a trending meme format
- None of these are predictable from content analysis

**4. Competitive Timing**

- What other content is posted at the same time in the same niche
- Platform-level trends creating audience attention shifts
- Seasonal patterns (back-to-school, holiday, New Year's resolution cycles)

**5. Creator Network Effects**

- Same content from a creator with 10K followers vs. 1M followers will perform radically differently
- But this is about distribution, not content quality — and it's partly accessible via creator metadata

### Is 80-90% Spearman Even Theoretically Possible?

**For content-only rank prediction: No.**

The academic evidence is clear. The SMP Challenge — the premier benchmark with 500K training samples, multimodal features, AND user metadata — achieves Spearman ~0.75 on test data. This is the best result from the best teams in the world with orders of magnitude more data than Trendzo will have.

Content-only rank prediction tops out at Spearman 0.20-0.35 in published research.

**For binary "viral/not-viral" classification: Plausible at 80%, not at 90%.**

Multiple studies report 80-85% binary accuracy with content + metadata features. Reaching 90% would require early engagement signals (post-publication data), which changes the use case from "pre-publication prediction" to "early detection."

**For pairwise comparison ("Is Script A better than Script B?"): Yes, 80-85% is achievable.**

Pairwise accuracy is more forgiving than global ranking. If the system can correctly identify which of two scripts is stronger 80% of the time, that's enormously valuable for creators — even if it can't predict absolute performance.

**For niche-relative quality percentile ("Top 25% for fitness content"): Yes, 80% is achievable with sufficient per-niche data.**

With 500+ labeled videos per niche, calibrating predictions against the niche's actual distribution is tractable. This is also the most commercially useful framing.

### What the System SHOULD Promise

Based on the research, here is what Trendzo can honestly promise at each maturity stage:

**Today (27 labeled videos):**
> "We analyze your content across 20+ dimensions to identify strengths and areas for improvement. Our scoring system is a directional guide, not a guarantee."

**At 500+ labeled videos:**
> "Our system correctly identifies which of two videos will perform better approximately 75% of the time. Content scoring is calibrated against thousands of real TikTok results in your niche."

**At 5,000+ labeled videos:**
> "For [top niches], our system correctly ranks content quality with over 80% pairwise accuracy. We can reliably identify content in the top 10% and bottom 20% of expected performance for your niche and account size."

**What the system should NEVER promise:**
> "We can predict how many views your video will get."
> "Our system is 90%+ accurate in predicting virality."
> "Use our tool and your video will go viral."

### The Reframed God-Tier Answer

If God Himself needed to build this technology, here is what He would know:

1. **Content quality is necessary but not sufficient for virality.** Great content dramatically increases the PROBABILITY of viral success, but the actual outcome is determined by a chaotic system involving algorithmic amplification, social cascades, timing, and luck.

2. **The achievable goal is content quality optimization, not virality prediction.** A system that reliably helps creators make better content — scoring hooks, emotional arcs, visual quality, structural patterns — delivers enormous value even if it can never guarantee any specific video will go viral.

3. **80-90% is achievable for the RIGHT metric.** Not for Spearman rank correlation against view counts (ceiling: 0.35-0.60 with all available data). But for pairwise accuracy ("Is this script better than that one?"), for niche-relative quality assessment, and for binary "publish-worthy" classification — yes, 80%+ is attainable with sufficient data.

4. **The path is data-centric, not architecture-centric.** The biggest improvements won't come from a better model architecture or more components. They'll come from 10x-100x more labeled data, which enables the existing system to actually learn. The automated pipeline (Bucket 3) is the most important infrastructure investment.

5. **God would be honest about the limits.** The MusicLab experiment proves that even with perfect content analysis, the middle band of quality is a lottery. The value proposition is raising the floor (ensuring content isn't bad) and identifying the ceiling potential (recognizing when content has genuine viral mechanics), not guaranteeing outcomes.

---

## Appendix A: Feature Group Reference

For full details on all 106 features across Groups A-K, see:
- `src/lib/services/feature-extraction/feature-extraction-service.ts` (main extractor)
- `src/lib/services/feature-extraction/text-analysis-extractors.ts` (Groups A-E)
- `src/lib/services/feature-extraction/formatting-linguistic-extractors.ts` (Groups F-H)
- `src/lib/services/feature-extraction/content-metadata-extractors.ts` (Groups I-K)

## Appendix B: Key Academic References

| Paper | Year | Key Finding |
|-------|------|-------------|
| Salganik, Dodds & Watts — MusicLab experiment | 2006 | Quality sets floor/ceiling but middle band is lottery. Social influence increases inequality AND unpredictability. |
| Berger & Milkman — "What Makes Online Content Viral?" | 2012 | High-arousal emotions (awe, anxiety, anger) increase sharing 34%. Positive content shared more than negative. |
| Bakhshi, Shamma & Gilbert — "Faces Engage Us" | 2014 | Face presence in images increases likes by 38% and comments by 32%. |
| Cheng, Adamic et al. — "Can Cascades be Predicted?" | 2014 | >80% accuracy for page cascades, ~70% for user cascades — but requires early cascade data. |
| Hofman, Sharma & Watts — Prediction limits in social systems | 2017 | Even with all features, best models explain <50% of variance in cascade sizes. Inherent unpredictability exists. |
| SMP Challenge Overview | 2024 | 500K posts, best teams achieve Spearman ~0.75 (with user metadata). Premier academic benchmark. |
| ACL 2025 — LLMs as video popularity predictors | 2025 | LLM+supervised hybrid achieves 85.5% binary accuracy. LLMs competitive with supervised models zero-shot. |
| Reddit-V — Pre-engagement virality dataset | 2025 | First public benchmark for pre-engagement prediction. Fine-tuned CLIP outperforms zero-shot LLMs. |
| Farinella et al. — TikTok virality indicators | 2021 | Spearman >0.23 from deep learning features + scene dynamics on TikTok. |

## Appendix C: Audit Cross-References

| This Document Section | Audit Reference |
|-----------------------|----------------|
| Component accuracy assessment | Phase 1 Component Table, Phase 4 Pack Deep-Dives |
| XGBoost issues | Phase 2 RF-2.1 through RF-2.7, D1 |
| Double calibration | Phase 3 RF-3.2, Phase 5 Section 5.6, D10 |
| Feature extraction details | Phase 2 Section 2.1 (42 features), standalone feature count finding |
| Training data status | Phase 2 Q-2D, standalone ground-truth finding |
| Component efficacy evaluation | D2, Phase 2 Q-2E |
| Calibration redesign | D3, Phase 3 Q-3A |
| Path weighting | Phase 1 Section "The 4 Prediction Paths", D9 |
| Pack status | Phase 4 Pack Status Truth Table |
| Automated pipeline | Bucket 3 completion summary |

---

*This document is the long-term accuracy roadmap for Trendzo's prediction system. It should be updated as milestones are reached, research evolves, and system measurements become available. The first update should occur when labeled video count reaches 100.*
