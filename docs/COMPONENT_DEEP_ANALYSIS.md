# Component Deep Analysis & Remediation Tracker

**Created:** 2026-03-07
**Last Updated:** 2026-03-10 (Layer 5 Analysis Complete — XGBoost deep-dive, Niche Keywords confirmed dead, all 22 components analyzed)
**Purpose:** Forensic analysis of every prediction component — what it should do, what it actually does, whether it can become algorithmic, and all fixes applied.
**Source of Truth:** `src/lib/prediction/system-registry.ts` (D11)
**Companion Docs:** `docs/COMPONENT_RUBRIC_AUDIT.md` (older, shallower), `.planning/prediction-audit.md` (Phase 1-6 audit)

---

## Future Vision: VPS + Briefs (Enhancement, Not Replacement)

**Added:** 2026-03-10
**Status:** Vision / R&D — return to this after Layer 4+5 fixes are complete.

The component audit and fix work (Layers 1-5) is NOT being replaced. It is being ENHANCED. The vision discussed in the "Cultural Intelligence System" analysis (see chat transcript `00b0801d-0e33-4b96-856f-52ec9ec5ec98`) adds a new dimension:

- **VPS stays.** It remains the "Is this video good?" score (Quality Gate). Powers "The Pulse" free tier.
- **Briefs are additive.** A new premium feature: "What video should I make right now?" (Opportunity Engine). Combines cultural timing + creator baseline + quality targets.
- **"Right To Win" filtering.** Not every trending event is relevant to every creator. The brief system filters by creator credibility/audience fit.
- **"Lift over baseline"** replaces "absolute virality." We measure improvement relative to a creator's own historical performance, not an impossible universal standard.

This does NOT change the current Layer 4/5 fix priorities. Those fixes make VPS honest — which is a prerequisite for both the score AND the brief.

---

## How to Read This Document

Every component gets a **standardized 3-step analysis** followed by a **fix tracker**:

| Section | Purpose |
|---|---|
| **Step 1: Concept** | What should this component measure? What role does it play in the new architecture (Quality Gate / Distribution Potential)? |
| **Step 2: Reality** | What does the code actually do? What's real vs. placeholder? What's broken? |
| **Step 3: Engineering Decision** | Can this become deterministic/algorithmic? Should it? What category does it fall into? |
| **Fix Log** | Every change made, with date, description, and before/after state |

### Component Categories (Expected Post-Audit)

| Category | Meaning | Expected Components |
|---|---|---|
| **Must be algorithmic** | Deterministic measurement — same input = same output, no LLM | FFmpeg, feature extraction, hook scoring, audio analysis, pacing, scene detection |
| **Should be hybrid** | Measurable base + LLM refinement for subjective dimensions | 9 attributes, 7 legos, viral mechanics, pattern extraction |
| **Can stay LLM-based** | Their job IS subjective evaluation — LLM is appropriate | GPT-4, Gemini, Claude (qualitative evaluators) |
| **Remove or merge** | Duplicative, permanently broken, or disconnected | To be determined per component |

### New Architecture Context

The onboarding overhaul introduced a two-mode prediction framework. Components must serve one or both:

| Mode | Drivers | Weight |
|---|---|---|
| **Quality Gate** | Hook retention (45%), Delivery baseline (25%), Content structure (20%), Production floor (10%) |
| **Distribution Potential** | Niche saturation (25%), Trend alignment (20%), Share probability (25%), Creator momentum (15%), Audience fit (15%) |

### Remediation Strategy — Decided 2026-03-07 22:00 EST

**Decision: Option C — Analyze in dependency layers, fix layer by layer.**

Components form a dependency chain. Fixing downstream components while their inputs are still fake is pointless. We analyze all components within a layer, identify cross-component issues within the layer, fix the layer as a batch, verify, then move to the next layer. Obviously dead components (niche-keywords, XGBoost in its current state) can be flagged for removal during analysis without waiting.

| Layer | Components | Rationale | Status |
|---|---|---|---|
| **1. Foundation** | FFmpeg (#1), Whisper (#2), Audio Analyzer (#12), Visual Scene Detector (#13), Thumbnail Analyzer (#14) | Extract raw data from video/audio. Everything else consumes their output. Fix first = real data flowing everywhere. | ✅ COMPLETE (Batch A+B + Runtime Verified 2026-03-09) |
| **2. Feature & Pattern** | Feature Extraction (#3), Hook Scorer (#10), 24-Styles (#9), Pattern Extraction (#11) | Transform foundation outputs into structured features. Can't assess properly until foundation is real. | ✅ COMPLETE (Analysis + Batch Fixes + Runtime Verified 2026-03-09) |
| **3. LLM Evaluators** | GPT-4 (#4), Gemini (#5), Claude (#6), Virality Matrix (#15) | Analyzed + fixed: GPT-4/Claude demoted to coach lane, VM disabled, consensus gate fixed (3 not 7), Gemini inflation stripped, weight boosts removed, stale fallback bug fixed. | ✅ COMPLETE (Analysis + Batch Fixes 2026-03-09) |
| **4. Packs & Synthesis** | 9-Attributes (#7), 7-Legos (#8), Virality Indicator (#16), Pack 1 (#19), Pack 2 (#20), Pack V (#21), Pack 3 (#22) | #7, #8, #19, #20 in coach lane (KEEP). #16 VPS floor removed (factors rebased, penalties added, timing removed, direct pass-through). #22 confidence-as-VPS fixed (avg mechanic strength). #21 dynamic confidence. | ✅ COMPLETE (Analysis 2026-03-09, Fixes 2026-03-10) |
| **5. Aggregation** | XGBoost (#18) | 9 findings documented: 3 model systems all broken (v6 R²=0.0, legacy contaminated, v5-simplified is heuristic). Verdict: DISABLE immediately, rebuild when N≥200 labeled videos. Feature pipeline ready (export has 13 prosodic features). | ✅ ANALYSIS COMPLETE (2026-03-10), disable pending |
| **Dead** | Niche Keywords (#17) | CONFIRMED DEAD: permanently disabled, functionality duplicated by 24-styles + pattern-extraction, ghost reference in XGBoost feature vector. Clean up on v7 rebuild. | ✅ ANALYSIS COMPLETE (2026-03-10) |

---

## Master Summary Table

| # | Component ID | Registry Type | Current State | Influences VPS? | Category (Target) | Analysis Status | Fix Status |
|---|---|---|---|---|---|---|---|
| 1 | `ffmpeg` | quantitative | **FIXED:** Real signalstats + scene filter + ffprobe via canonical analyzer. Runtime OK. | Indirectly (feeds downstream) | Must be algorithmic | ✅ COMPLETE | ✅ BATCH A COMPLETE + Runtime Verified |
| 2 | `whisper` | quantitative | **FIXED:** verbose_json, native confidence, speaking rate extraction. Runtime OK (infra). | Indirectly (provides transcript to 11 components) | Infrastructure (reclassify) | ✅ COMPLETE | ✅ BATCH A COMPLETE + Runtime Verified |
| 3 | `feature-extraction` | quantitative | **DISABLED:** Moved to disabledComponents. 60s wasted latency eliminated. Salvage extractors for XGBoost later. | No — disabled | Remove from pipeline, salvage for XGBoost | ✅ COMPLETE | ✅ DISABLED (Prompt 1) + Runtime Verified |
| 4 | `gpt4` | qualitative | **DEMOTED TO COACH LANE (Prompt 1, 2026-03-09).** Runs but weight=0 for VPS. Output stored for coaching only. | No (coach lane) | Demote to coach lane | ✅ COMPLETE | ✅ Prompt 1 COMPLETE |
| 5 | `gemini` | qualitative | **SOLE VPS EVALUATOR (Prompts 1-3, 2026-03-09).** Score inflation stripped (floors removed, multiplicative EQ, fallback 45). Weight boosts removed (2.5x, 3x, 1.2x all gone). Consensus gate fixed to 3 components. Stale fallback bug fixed. | Yes (sole LLM, through qualitative path + Pack V when video available) | Keep as sole VPS evaluator — inflation fixed | ✅ COMPLETE | ✅ Prompts 1-3 COMPLETE |
| 6 | `claude` | qualitative | **DEMOTED TO COACH LANE (Prompt 1, 2026-03-09).** Runs but weight=0 for VPS. Output stored for coaching only. | No (coach lane) | Demote to coach lane | ✅ COMPLETE | ✅ Prompt 1 COMPLETE |
| 7 | `9-attributes` | pattern | **Coach lane.** 100% regex-based (NOT LLM-dependent). All 9 dimensions covered better by other components. Serves as Pack 1 fallback for coaching. Dynamic confidence formula is good. | No (coach lane) | Coach lane — Pack 1 fallback | ✅ COMPLETE | ✅ Correctly positioned |
| 8 | `7-legos` | pattern | **Coach lane.** 100% regex-based. 7 modular "building blocks". Story Structure detection is uniquely useful. Hook/Visual/Audio overlap with other components. Best coaching framework. | No (coach lane) | Coach lane — coaching framework | ✅ COMPLETE | ✅ Correctly positioned |
| 9 | `24-styles` | pattern | **CONVERTED TO HYBRID (2026-03-09).** Tier 1 deterministic keyword+structural classifier; Tier 2 LLM refinement for ambiguous cases (top 5 candidates). Styles moved to system-registry.ts. viralWeights reset to 1.0. Phase 2 with audio access. | Yes (through pattern_based path) | Hybrid | ✅ COMPLETE | ✅ COMPLETE |
| 10 | `hook-scorer` | pattern | **REBUILT (2026-03-08):** 5-channel multi-modal analyzer (text/audio/visual/pace/tone). 10-type taxonomy. 0-100 scoring with weighted fusion. Whisper timestamps for real first-3s. Phase 2 (reads audio-analyzer). Deterministic, no LLM. | Yes (highest leverage) | Must be algorithmic (upgraded) | ✅ COMPLETE | ✅ COMPLETE |
| 11 | `pattern-extraction` | pattern | **TIGHTENED (2026-03-08):** 9 contextual regexes (removed hook-opening overlap), positional weighting (hook/body/CTA zones), base 30, co-occurrence bonuses, cap 85. Generic transcripts now score ~30-40 instead of 65-75. | Yes (fixed) | Must be algorithmic (refined) | ✅ COMPLETE | ✅ COMPLETE |
| 12 | `audio-analyzer` | quantitative | **FIXED (Batch B + Runtime):** Real FFmpeg + prosodic (ebur128, YIN pitch, silence) + speaking rate + classification. Timeout fixed 3000→30000. Runtime: 75.0 VPS, 98% conf, ~10s. | Feeds Pack V/P3/training (enhanced mapping) | Must be algorithmic | ✅ COMPLETE | ✅ BATCH B + Runtime Verified |
| 13 | `visual-scene-detector` | quantitative | **FIXED (Batch A + Runtime):** Thin wrapper over canonical analyzer, real scene data, Pack V names fixed. Timeout fixed 25000→40000. Runtime: 54.0 VPS, 35% conf, ~5s. | Feeds Pack V (real data now) | Must be algorithmic | ✅ COMPLETE | ✅ BATCH A + Runtime Verified |
| 14 | `thumbnail-analyzer` | quantitative | **FIXED (Batch A + Runtime):** Thin wrapper over canonical analyzer, real SATAVG colorfulness, Pack V mapping fixed. Timeout fixed 2000→35000. Runtime: 62.0 VPS, 80% conf, ~5s. | Feeds Pack V (real data now) | Must be algorithmic | ✅ COMPLETE | ✅ BATCH A + Runtime Verified |
| 15 | `virality-matrix` | pattern | **DISABLED (Prompt 1, 2026-03-09).** 100% regex, mislabeled as LLM-dependent. All 9 dimensions duplicated by hook-scorer + pattern-extraction. Moved to disabledComponents. Registry corrected. | No (disabled) | Remove — fully duplicative | ✅ COMPLETE | ✅ Prompt 1 COMPLETE |
| 16 | `virality-indicator` | pattern | **FIXED (2026-03-10):** Factors rebased 50→30, penalties added (10 subtraction paths), timing removed, VPS direct pass-through. New range ~19-77. | Yes (fixed) | Must be algorithmic — FIXED | ✅ COMPLETE | ✅ COMPLETE (VIR-FIX-2/3/4/5) |
| 17 | `niche-keywords` | pattern | **CONFIRMED DEAD (2026-03-10).** Permanently disabled, never executes. Functionality duplicated by 24-styles + pattern-extraction. Ghost reference in XGBoost feature vector. | No (disabled) | Remove on XGBoost rebuild | ✅ COMPLETE | ✅ Confirmed dead — clean up on v7 |
| 18 | `xgboost-virality-ml` | quantitative | **DISABLED (2026-03-10).** THREE model systems all broken: v6 R²=0.0 (27 samples), legacy contaminated (views_count=73.9%), v5-simplified is hand-tuned heuristic. Verdict: DISABLE now, rebuild when N≥200. | Yes (adds noise) | DISABLE now, rebuild on 200+ labels | ✅ COMPLETE | ✅ DISABLED |
| 19 | `unified-grading` (Pack 1) | qualitative | **Coach lane.** Gemini LLM — richest coaching engine (9 attrs, 7 legos, hook, pacing, clarity, novelty). Powers Pack 2. Indirect VPS via Pack 3. No fallback. | No (coach lane) | Coach lane — coaching engine | ✅ COMPLETE | ✅ Correctly positioned |
| 20 | `editing-coach` (Pack 2) | qualitative | **Coach lane.** Gemini LLM + rule-based fallback. Top 3 improvement suggestions with estimated lift. Hard dependency on Pack 1. | No (coach lane) | Coach lane — improvement suggestions | ✅ COMPLETE | ✅ Correctly positioned |
| 21 | `visual-rubric` (Pack V) | qualitative | **FIXED (2026-03-10):** Dynamic confidence based on upstream signal availability (0.3 base + video/FFmpeg/audio/scene/thumbnail/hook). Hybrid 40% rules + 60% Gemini Vision. | Yes (sole Gemini→VPS path) | Hybrid — keep as-is | ✅ COMPLETE | ✅ COMPLETE (PV-FIX-6) |
| 22 | `viral-mechanics` (Pack 3) | qualitative | **FIXED (2026-03-10):** VPS from avg mechanic strength (not confidence*100). Dead refs removed (virality-matrix, historical-analyzer, trend-timing, posting-optimizer). | Yes (fixed) | Must be algorithmic — FIXED | ✅ COMPLETE | ✅ COMPLETE (PM-FIX-1/2) |

### Disabled Components (Not Analyzed — Confirmed Dead)

| Component ID | Reason Disabled | Disposition |
|---|---|---|
| `xgboost` (legacy) | Fake heuristic placeholder. Contaminated training (views_count=73.9% importance). | Dead. Do not resurrect. |
| `dps-engine` | DPS calculation — always pushed to disabledComponents | Infrastructure, not prediction |
| `historical` | Zero variance — returns niche average VPS | Dead unless dynamic H1/H2 implemented |
| `trend-timing-analyzer` | Content-independent — same score regardless of video | Dead |
| `posting-time-optimizer` | Content-independent — timing, not prediction | Dead (useful for scheduling, not VPS) |
| `python-analysis` | PySceneDetect, VADER — deprecated | Dead |
| `competitor-benchmark` | Always pushed to disabledComponents | Dead |

---

## Onboarding System — Component Status Decision

**Question:** Should the onboarding system be designated as Component #23?

**Answer: No — but it IS a critical architectural layer that deserves its own section.**

The onboarding system is not a prediction component in the same sense as the 22 registered components. Here's the distinction:

| Dimension | Prediction Components (1-22) | Onboarding System |
|---|---|---|
| **When it runs** | During `runPredictionPipeline()` | During user setup / channel verification |
| **What it produces** | A score (0-100) per component per run | A creator profile (persistent, reusable) |
| **Execution frequency** | Every prediction | Once per creator (updated periodically) |
| **Storage** | `run_component_results` (per run) | `calibration_profiles`, `creator_context` (per creator) |
| **Pipeline relationship** | Executes inside the pipeline | Feeds INTO the pipeline as context |

The onboarding system is a **context provider**, not a **signal producer**. It:
- Produces a `CalibrationProfile` with quality discernment scores across 6 dimensions
- Produces a `DeliveryBaseline` with WPM, speaking rate variance, energy, silence ratio
- Produces a `CreatorStage` with 5-dimension creator classification
- Produces `CreatorContext` with channel data, patterns, story

These outputs **influence** prediction (delivery hard gate at <30 triggers -8 VPS, calibration profile will eventually weight components) but they don't execute during the prediction run itself.

**Recommendation:** Track the onboarding system in a dedicated section at the end of this document (Section 24: "Onboarding & Context Layer") with the same analytical rigor, but don't assign it a component number. It operates at a different architectural layer.

---

## Runtime Verification — Layer 1+2 (2026-03-09)

After applying all Batch A, Batch B, and Layer 2 batch fixes, a comprehensive runtime verification was performed on the upload-test page. This section documents the results and issues fixed during verification.

### Test Conditions
- **Page:** `/admin/upload-test` (Raw VPS Clean Room mode — no auto-fill, no account size)
- **Input:** Video file + transcript text (>10 chars), niche = "side-hustles"
- **Pipeline:** Full prediction via `/api/kai/predict` → `runPredictionPipeline()` → `KaiOrchestrator`

### Pre-Verification State (Problems Found)
| Issue | Component | Symptom | Root Cause |
|---|---|---|---|
| Timeout | `audio-analyzer` | "Timeout after 5000ms" | avgLatency=3000 → timeout=5000ms. Real latency: 10-30s (multi-pass FFmpeg + prosodic + classification) |
| Timeout | `thumbnail-analyzer` | "Timeout after 5000ms" | avgLatency=2000 → timeout=5000ms. Real latency: 5-6s (canonical FFmpeg analysis) |
| Timeout | `visual-scene-detector` | "Timeout after 30000ms" | Under I/O contention (parallel FFmpeg), 30s wasn't enough |
| Timeout | `unified-grading` | "Timeout after 20000ms" | Gemini API latency variability — 15-25s common |
| Phantom count | Pipeline | 24 components shown (expected 20) | `historical` path listed 4 dead components still |
| Input bug | `virality-indicator` | "Missing required input: either" | `checkComponentInputs` treated 'either' as `input['either']` |
| Systemic | All components | Recurring timeout failures | 5000ms floor for non-qualitative, 20000ms for qualitative — both too tight |

### Fixes Applied During Verification
| Fix | Change | Files |
|---|---|---|
| audio-analyzer timeout | avgLatency 3000→30000 | `kai-orchestrator.ts`, `system-registry.ts` |
| thumbnail-analyzer timeout | avgLatency 2000→35000 | `kai-orchestrator.ts`, `system-registry.ts` |
| visual-scene-detector timeout | avgLatency 25000→40000 | `kai-orchestrator.ts`, `system-registry.ts` |
| unified-grading timeout | avgLatency 8000→25000 | `kai-orchestrator.ts` |
| Phantom components | historical path components: `[4 items]` → `[]` | `kai-orchestrator.ts`, `system-registry.ts` |
| virality-indicator 'either' | Added 'either' handling to check any of transcript/videoPath/ffmpegData | `prediction-config.ts` |
| Systemic timeout floor | `Math.max(5000/20000, avg*1.2/1.5)` → `Math.max(45000, avg*1.5/2.0)` | `kai-orchestrator.ts` |

### Post-Verification State (All Green)
| # | Component | VPS | Confidence | Latency | Status |
|---|---|---|---|---|---|
| 1 | `ffmpeg` | — | — | ~6s | ✅ OK (infra) |
| 2 | `whisper` | — | — | — | ✅ OK (infra, pre-orchestrator) |
| 3 | `feature-extraction` | — | — | — | ⛔ Disabled |
| 4 | `gpt4` | 70.0 | 80% | ~15s | ✅ OK |
| 5 | `gemini` | 82.0 | 85% | ~12s | ✅ OK |
| 6 | `claude` | 72.0 | 85% | ~8s | ✅ OK |
| 7 | `9-attributes` | 71.1 | 80% | ~16s | ✅ OK |
| 8 | `7-legos` | 57.1 | 80% | ~16s | ✅ OK |
| 9 | `24-styles` | 50.0 | 60% | ~3s | ✅ OK |
| 10 | `hook-scorer` | 63.0 | 77% | ~1s | ✅ OK |
| 11 | `pattern-extraction` | 35.0 | 55% | <1s | ✅ OK |
| 12 | `audio-analyzer` | 75.0 | 98% | ~10s | ✅ OK |
| 13 | `visual-scene-detector` | 54.0 | 35% | ~5s | ✅ OK |
| 14 | `thumbnail-analyzer` | 62.0 | 80% | ~5s | ✅ OK |
| 15 | `virality-matrix` | 72.0 | 80% | ~6s | ✅ OK |
| 16 | `virality-indicator` | 55.0 | 70% | <1s | ✅ OK |
| 17 | `niche-keywords` | — | — | — | ⛔ Disabled (confirmed dead L5) |
| 18 | `xgboost-virality-ml` | — | — | — | ⛔ Disabled (noise source, L5 verdict) |
| 19 | `unified-grading` | 81.0 | 90% | ~16s | ✅ OK |
| 20 | `editing-coach` | 90.0 | 85% | ~20s | ✅ OK |
| 21 | `visual-rubric` | 65.0 | 75% | ~18s | ✅ OK |
| 22 | `viral-mechanics` | 60.0 | 80% | <1s | ✅ OK |

**Result:** 19/20 active components executing successfully. 1 disabled (feature-extraction). Total pipeline latency ~55s. All 4 Packs producing real output.

### Key Observations
1. **Hook scorer is now multi-modal:** Audio channel score 52, pace 90, tone 40 (all were 0 before Layer 2 fixes)
2. **Pattern extraction scores are realistic:** 35 VPS for a generic transcript (was 65-75 before tightening)
3. **I/O contention is real:** When 3-5 FFmpeg processes run in parallel, individual latencies 5x-10x baseline
4. **Gemini API is the latency bottleneck:** unified-grading (16s), editing-coach (20s), visual-rubric (18s) — all waiting on Gemini
5. **Total active component count:** 20 (was 24 before phantom removal, was 22 in registry)

---

## Detailed Component Analyses

---

### Component 1: FFmpeg Video Analysis

| Field | Value |
|---|---|
| **ID** | `ffmpeg` |
| **Registry Type** | `quantitative` |
| **Registry Reliability** | 0.99 |
| **Registry Avg Latency** | 30,000ms |
| **API Dependency** | None (local binary) |
| **Target Category** | Must be algorithmic |
| **Analysis Date** | 2026-03-07 |
| **Analyst** | Audit Session (Claude) |

#### Step 1: Concept — What Should This Component Measure?

FFmpeg is the **ground truth layer** — the only component that touches the actual video bitstream. It should extract deterministic, repeatable measurements from the file itself. Same video in = same numbers out. Every time.

**New Architecture Role:**

| Quality Gate Driver | FFmpeg Contribution |
|---|---|
| Production Floor (10%) | Resolution, fps, aspect ratio, audio presence, bitrate |
| Hook Retention (45%) | Scene changes in first 3 seconds, visual motion in opening frames |
| Content Structure (20%) | Overall pacing (cuts/sec), scene distribution across timeline |

| Distribution Potential Driver | FFmpeg Contribution |
|---|---|
| Share Probability (25%) | Visual distinctiveness (color variance, brightness contrast) — feeds downstream |

FFmpeg should be the **single authoritative source** for all physical video measurements. No other component should run `ffprobe` independently.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding R1-1: Four separate FFmpeg implementations exist.**

| File | Used By | What It Does |
|---|---|---|
| `src/lib/services/training/ffmpeg-training-features.ts` | Orchestrator `executeFFmpeg()` | ffprobe → basic metadata + **6 placeholder values** |
| `src/lib/services/ffmpeg-full-analyzer.ts` | quick-predict, immediate-video-analyzer | ffprobe → basic metadata (different interface) |
| `src/lib/services/ffmpeg-service.ts` | Unused by pipeline | `getColorPalette()` = hardcoded hex. `detectSceneChanges()` = `[]`. Has frame extraction. |
| `src/lib/onboarding/delivery-analyzer.ts` | Onboarding flow only | Actual FFmpeg audio analysis (volume, silence) — separate system |

Three of these run the same `ffmpeg.ffprobe()` call with near-identical parsing logic.

**Finding R1-2: The visual score is a constant for TikTok videos.**

`calculateVisualScore()` in `kai-orchestrator.ts` (line 2797):
- Base 50 + duration bonus (15) + resolution bonus (10) + fps bonus (5) + portrait bonus (10) + audio bonus (10) = **100 for any standard TikTok video**
- This means the component's `prediction` field is ~90-100 for virtually all inputs. Zero discriminating power.

**Finding R1-3: 6 of 16 extracted features are hardcoded placeholder values.**

From `ffmpeg-training-features.ts` (lines 160-167):
```
scene_changes: 0           // "would require additional processing"
cuts_per_second: 0          // Derived from scene_changes (which is 0)
avg_motion: 0.5             // "Placeholder"
color_variance: 0.5         // "Placeholder"
brightness_avg: 0.5         // "Placeholder"
contrast_score: 0.5         // "Placeholder"
```

These feed directly into XGBoost (14 FFmpeg features), Pack V, virality-indicator, and DPS calculation. Every downstream consumer operates on fake data.

**Finding R1-4: Additional placeholders in ffmpeg-service.ts.**

- `getColorPalette()` returns `['#FF5733', '#33FF57', '#3357FF']` — a fixed array, not computed from the video
- `detectSceneChanges()` returns `[]` — empty, with a TODO comment and the correct FFmpeg command in a code comment but never implemented

**Finding R1-5: The delivery-analyzer.ts proves the pattern works.**

The onboarding delivery analyzer actually implements real FFmpeg audio analysis:
- `volumedetect` filter → mean/max volume (parsed from stderr)
- `silencedetect` filter → silence ratio (parsed from silence_duration matches)
- Downloads audio track, processes, cleans up temp files

This proves the FFmpeg stderr parsing approach is viable — the main component just never implemented it.

**Finding R1-6: Downstream consumers receiving fake data.**

| Consumer | What It Receives | Impact |
|---|---|---|
| Virality Indicator | `scene_changes=0`, `avg_brightness=50`, `has_faces=false` | 6-factor algorithm works on zeros |
| XGBoost v6 | 14 FFmpeg features, 6 of which are constants | Training on noise |
| Pack V (Visual Rubric) | `scene_count=0`, `motion_intensity=0.5`, `brightness_avg=0.5` | Vision analysis has wrong priors |
| DPS Calculation | `calculateFFmpegVisualScore()` for optional 5% boost | Near-constant boost |
| Pattern Extraction | FFmpeg visual intelligence "when available" | Gets nothing useful |
| Training Export | Reads FFmpeg features for XGBoost export | Exports fake data |

#### Step 3: Engineering Decision — Can It Become Algorithmic?

**Verdict: YES — 100% algorithmic. This is the easiest component to convert.**

FFmpeg reads a bitstream. No opinions involved. Every placeholder feature has a known FFmpeg filter solution:

| Feature | FFmpeg Filter | Difficulty |
|---|---|---|
| `scene_changes` | `select='gt(scene,0.3)',showinfo` | Easy — stderr parse |
| `cuts_per_second` | Derived: `scene_changes / duration` | Trivial |
| `avg_motion` | `tblend=all_mode=difference` or `mestimate` | Medium — frame processing |
| `color_variance` | `signalstats` → SATAVG, HUEAVG variance | Easy — stderr parse |
| `brightness_avg` | `signalstats` → YAVG | Easy — stderr parse |
| `contrast_score` | `signalstats` → (YMAX - YMIN) / 255 | Easy — derived |

**Additional features that should be added:**

| Feature | Why | Solution |
|---|---|---|
| Hook scene changes (first 3s) | Hook retention = 45% of Quality Gate | Same scene filter with `-t 3` |
| Audio loudness (LUFS) | Better than binary has_audio | `ebur128` filter |
| Silence ratio | Already in delivery-analyzer — should be in main component | `silencedetect` filter |
| Visual complexity | Editing density indicator | Frame difference variance |

**Implementation path:**
1. Consolidate 4 files into one canonical `ffmpeg-analyzer.ts`
2. Implement 6 placeholder features using real FFmpeg filters
3. Add hook-specific features (first 3s)
4. Port silence/volume detection from delivery-analyzer
5. Replace `calculateVisualScore()` with meaningful scoring

**Expected difficulty:** Medium
**Expected impact:** High — unlocks real data for 5+ downstream components

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-08 | FFM-001 | Created canonical analyzer `ffmpeg-canonical-analyzer.ts`. Deprecated 3 old files with header comments. Orchestrator `executeFFmpeg()` rewired to use canonical analyzer. | `ffmpeg-canonical-analyzer.ts` (new), `kai-orchestrator.ts`, `ffmpeg-training-features.ts`, `ffmpeg-full-analyzer.ts`, `ffmpeg-service.ts` | 4 files with duplicate ffprobe, 6 placeholder features | Single canonical file, 3 FFmpeg invocations (ffprobe + signalstats + scene filter), all features real | tsc clean (zero new errors) |
| 2026-03-08 | FFM-002 | Implemented all 6 placeholder features with real FFmpeg filters: `scene_changes` (scene filter), `cuts_per_second` (derived), `brightness_avg` (signalstats YAVG), `contrast_score` (signalstats YDIF), `color_variance` (signalstats SATAVG), `avg_motion` (scene interval variance). Added `hook_scene_changes` (scene filter first 3s). | `ffmpeg-canonical-analyzer.ts` | scene_changes=0, cuts_per_second=0, avg_motion=0.5, color_variance=0.5, brightness_avg=0.5, contrast_score=0.5 | All computed from real FFmpeg output, normalized to 0-1 ranges | tsc clean, no placeholders in new file |
| 2026-03-08 | FFM-003 | Replaced `calculateVisualScore()` near-constant formula (base 50 + fixed bonuses = ~100 for all TikTok) with multi-factor scoring using real features: scene density (30pts), visual quality (30pts), technical baseline (25pts). | `kai-orchestrator.ts` | Always ~90-100 for portrait 1080p videos with audio | Score varies by scene density, brightness, contrast, color, motion | tsc clean |

#### Open Issues

| Issue ID | Description | Blocked By | Priority |
|---|---|---|---|
| ~~FFM-001~~ | ~~Canonical analyzer created, old files deprecated~~ | — | ~~High~~ **PARTIAL** (files deprecated, not deleted) |
| ~~FFM-002~~ | ~~All 6 placeholders replaced with real FFmpeg filters~~ | — | ~~Critical~~ **FIXED** |
| ~~FFM-003~~ | ~~calculateVisualScore() now uses real features with variance~~ | — | ~~High~~ **FIXED** |
| FFM-004 | Downstream consumers (XGBoost, Pack V, virality-indicator) fed fake data | FFM-002 (**now fixed**) | Critical |
| FFM-005 | Silence/volume detection exists in delivery-analyzer but not in main component | FFM-001 | Medium |
| FFM-006 | `hookCuts`, `qualityScore`, `editingPaceScore` fields exist but are always 0/undefined | FFM-002 (**hookSceneChanges now real; qualityScore/editingPaceScore removed**) | Medium |

---

### Component 2: Whisper Transcription

| Field | Value |
|---|---|
| **ID** | `whisper` |
| **Registry Type** | `quantitative` |
| **Registry Reliability** | 0.95 |
| **Registry Avg Latency** | 5,000ms |
| **API Dependency** | `OPENAI_API_KEY` (Whisper API, $0.006/min) |
| **Target Category** | Infrastructure (reclassify — not a prediction component) |
| **Analysis Date** | 2026-03-07 |
| **Analyst** | Audit Session (Claude) |

#### Step 1: Concept — What Should This Component Measure?

Whisper is **not a prediction component** — it's **infrastructure**. Its job is to convert video audio into text (a transcript) so that all text-dependent components can function. It doesn't produce a virality score; it produces a transcript that becomes an input to ~11 other components. Think of it as a utility — like electricity to a factory. The factory (prediction pipeline) can't run without it, but the power grid itself doesn't make products.

**New Architecture Role:**

| Quality Gate Driver | Whisper's Contribution |
|---|---|
| Hook Retention (45%) | Provides the transcript that hook-scorer, 9-attributes, and pattern-extraction all analyze for hook strength, content quality, and structural patterns |
| Delivery Baseline (25%) | Transcript presence/absence and word count feed the calibrator's "no speech" detection. Transcript quality determines whether delivery metrics (WPM, energy) can be inferred |
| Content Structure (20%) | Transcript enables pacing analysis, section detection, and narrative arc assessment |
| Production Floor (10%) | No direct contribution — production floor is visual/audio technical quality |

| Distribution Potential Driver | Whisper's Contribution |
|---|---|
| Niche Saturation (25%) | Transcript keywords enable niche alignment detection and keyword density analysis |
| Trend Alignment (20%) | Transcript content enables trend topic matching |
| Share Probability (25%) | Transcript feeds virality-matrix and pattern-extraction for shareability analysis |
| Creator Momentum (15%) | No direct contribution — comes from historical creator data |
| Audience Fit (15%) | Transcript language/tone can be matched against audience preferences |

**Critical dependency chain:** Without a transcript, **11 of 22 components cannot function**. The pipeline degrades to visual-only signals — FFmpeg, audio-analyzer, visual-scene-detector, thumbnail-analyzer, Pack V, and virality-indicator. This means losing all qualitative evaluators, all pattern components, and Packs 1/2/3.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding R2-1: The orchestrator's Whisper component is dead code — never executes.**

`executeWhisper()` is registered in `kai-orchestrator.ts` (line 442) but is **not included in any prediction path** (quantitative, qualitative, pattern_based, or historical). The transcript is resolved BEFORE the orchestrator even starts:

```
runPredictionPipeline.ts (lines 234-279):
  Step 2: Resolve transcript (SINGLE SOURCE OF TRUTH)
  ├── if user provided transcript ≥10 chars → use it (source: 'user_provided')
  ├── else if videoFilePath exists → runTranscriptionPipeline()
  │     ├── transcription-pipeline.ts → whisper-service.ts
  │     │     ├── extractAudioFromVideo() → ffmpeg -vn -ar 16000 -ac 1
  │     │     └── transcribeAudio() → openai.audio.transcriptions.create()
  │     └── fallback: title/description/captions
  └── else → no transcript, text-dependent components skipped

  Step 3: Build VideoInput with resolvedTranscript already set
  Step 4: KaiOrchestrator.predict(videoInput) ← transcript already on the input
```

The orchestrator's `executeWhisper()` is a ghost registration. It exists in the component registry, gets counted as 1 of 22 components, but the prediction path machinery never invokes it.

**Finding R2-2: Two duplicate Whisper implementations exist — one active, one dead.**

| File | Code | Used By | Status |
|---|---|---|---|
| `src/lib/services/whisper-service.ts` (124 lines) | `extractAudioFromVideo()` → `transcribeAudio()` → `transcribeVideo()` | `transcription-pipeline.ts` → `runPredictionPipeline.ts` | **ACTIVE — this is the real one** |
| `kai-orchestrator.ts` lines 3239-3367 (128 lines) | `executeWhisper()` → `transcribeVideoWithWhisper()` | Nothing — not in any prediction path | **DEAD CODE — near-duplicate** |

Side-by-side comparison of the duplicates:

| Dimension | `whisper-service.ts` (ACTIVE) | `kai-orchestrator.ts` (DEAD) |
|---|---|---|
| FFmpeg command | `ffmpeg -loglevel error -i VIDEO -vn -ar 16000 -ac 1 -b:a 32k OUTPUT -y` | `ffmpeg -i VIDEO -vn -acodec libmp3lame -ab 128k -ar 16000 -ac 1 -y OUTPUT` |
| Audio bitrate | 32k (speech-optimized, smaller file) | 128k (4x larger than needed) |
| API call | `response_format: 'text'` | `response_format: 'text'`, `language: 'en'` |
| Error handling | Throws errors (caller handles) | Returns null (swallows errors) |
| Cleanup | Deletes audio file after transcription | Deletes in try/catch |
| Size check | Verifies output ≥1000 bytes | Checks ≤25MB (API limit) |

The orchestrator version is slightly worse (higher bitrate, hardcoded English, swallows errors). Both use `whisper-1` model and `response_format: 'text'`.

**Finding R2-3: The transcription pipeline has a well-designed 4-stage fallback chain.**

`transcription-pipeline.ts` (lines 68-162) implements a clean resolution hierarchy:

| Stage | Trigger | Source | Confidence | Evidence |
|---|---|---|---|---|
| 1. User transcript | `userTranscript.length >= 10` | `user_provided` | 1.0 | Line 77-86 |
| 2. Whisper API | `videoPath` exists AND `fs.existsSync(videoPath)` | `whisper` | 0.5-0.9 (heuristic) | Lines 91-121 |
| 3. Fallback pseudo-transcript | title/description/captions available | `fallback_title` / `fallback_captions` / `fallback_scene` | 0.3 (fixed) | Lines 129-141 |
| 4. None | All stages failed | `none` | 0 | Lines 146-161, skipped=true |

Stage 3 fallback construction (`buildFallbackTranscript`, lines 202-255):
- Priority: captions first (most speech-like) → title → description (cleaned of hashtags/mentions)
- Parts joined with `\n\n`
- Confidence fixed at 0.3 regardless of content quality

This is one of the better-engineered parts of the pipeline. The fallback chain is logical, the priority order is correct (user input > API > heuristic > nothing), and the skip reason is specific (`no_video_file`, `no_text_signals`, `silent_video_no_fallback`).

**Finding R2-4: Whisper confidence is guessed via heuristic instead of using the API's native scores.**

`calculateWhisperConfidence()` in `transcription-pipeline.ts` (lines 171-197):

```
Base confidence: 0.7
  + 0.2 if wordCount >= 50
  + 0.1 if wordCount >= 20
  - 0.2 if wordCount < 10
  - 0.2 if alphaRatio < 0.5 (garbage/non-text output)
  - 0.1 if Whisper artifacts detected: [music], [applause], ♪, 🎵
  Clamped to [0.1, 1.0]
```

This is reasonable but **unnecessary**. The OpenAI Whisper API supports `response_format: 'verbose_json'` which returns:
- `segments[].avg_log_prob` — average log probability per segment (higher = more confident)
- `segments[].no_speech_prob` — probability that segment contains no speech
- `segments[].compression_ratio` — text compression ratio (high = repetitive/garbage)

Using the API's native confidence would eliminate the entire heuristic function and provide segment-level quality signals. Currently both implementations use `response_format: 'text'` which discards all of this metadata.

**Finding R2-5: The calibrator's "no speech" detection is correctly wired.**

`prediction-calibrator.ts` receives transcript metadata from `runPredictionPipeline.ts` (lines 527-533):

```typescript
const calibrationInput: CalibrationInput = {
  rawVps: result.vps,
  rawConfidence: result.confidence,
  transcriptionSource: transcriptSource,           // 'user_provided' | 'whisper' | 'fallback_*' | 'none'
  transcriptionSkipped: transcriptionStatus.skipped, // boolean
  transcriptionSkippedReason: transcriptionStatus.skippedReason, // string
  resolvedTranscriptLength: resolvedTranscript?.length ?? 0,     // number
  audioPresent,
  packV: visualRubric,
  detectedStyle,
  // ...
};
```

The calibrator applies two rules based on this data:
- **Rule 1** (line 143): Confidence × 0.7 when transcription skipped/none/no_speech_detected
- **Rule 2** (line 240): VPS cap (55 standard, 65 visual-first) when `!audioPresent` AND `!hasLanguageSignal()` (transcript < 10 chars)
- `hasLanguageSignal()` (line 175) correctly checks BOTH transcript length ≥ 10 AND transcription source validity

The wiring from pipeline → calibrator is sound. No issues found.

**Finding R2-6: In the primary testing workflow, Whisper never fires.**

On `/admin/upload-test` (the primary user workflow), the user manually enters transcript text in a textarea. This means:
- Transcript resolution always hits Stage 1 (user_provided, confidence 1.0)
- Whisper API is never called — zero cost, zero latency
- The Whisper path only fires in automated workflows: quick-predict (video file upload), bulk-download (batch processing), and any future automated pipelines

**Implication:** Whisper quality is irrelevant for the primary testing workflow but critical for production automation. When the platform moves to accepting raw video uploads from creators, Whisper becomes the bottleneck for transcript quality, and the heuristic confidence (R2-4) becomes a real accuracy risk.

**Finding R2-7: 11 downstream components depend on the transcript — cascade failure on no-transcript.**

| Component | Transcript Requirement | Behavior Without Transcript | VPS Impact |
|---|---|---|---|
| `9-attributes` | `checkComponentInputs(['transcript'])` | **Skipped entirely** | Loses attribute scores |
| `7-legos` | `checkComponentInputs(['transcript'])` | **Skipped entirely** | Loses lego detection |
| `pattern-extraction` | `checkComponentInputs(['transcript'])` | **Skipped entirely** | Loses pattern signals |
| `gpt4` | Validates `transcript.length >= 20` | **Skipped entirely** | Loses GPT-4 evaluation (~15% VPS weight) |
| `gemini` | Uses transcript when no video file | **Partial** — can use video file directly | Reduced but functional |
| `hook-scorer` | `(input.transcript \|\| '').toLowerCase()` | **Degrades** — pattern-matches on empty string, all regex tests fail, low score | Hook score defaults low |
| `virality-matrix` | Heuristic scoring from transcript text | **Skipped entirely** | Loses virality matrix signal |
| `virality-indicator` | `checkComponentInputs(['either'])` — needs transcript OR video | **Partial** — works if video file exists | Functional with video |
| `unified-grading` (Pack 1) | Requires `transcript.length >= 10` | **Skipped entirely** | No Pack 1 output |
| `editing-coach` (Pack 2) | Depends on Pack 1 output | **Cascading skip** — Pack 1 skip kills Pack 2 | No Pack 2 output |
| `viral-mechanics` (Pack 3) | `hasTranscript && transcriptLength >= 10` | **Limited signal mode** — works with reduced signals | Partial output |

**Cascade math:** Without a transcript, the pipeline loses:
- 3 of 3 qualitative evaluators (gpt4, gemini partially, virality-matrix) ≈ **30-40% of VPS signal**
- 3 of 7 pattern components (9-attributes, 7-legos, pattern-extraction) ≈ **15-20% of VPS signal**
- Pack 1 + Pack 2 (cascading failure) ≈ **major qualitative analysis loss**
- Pack 3 enters limited signal mode

The prediction degrades to: FFmpeg (near-constant) + audio-analyzer + visual-scene-detector + thumbnail-analyzer + Pack V + virality-indicator + hook-scorer (degraded). This is essentially a visual-only prediction with minimal discriminating power.

#### Step 3: Engineering Decision — Can It Become Algorithmic?

**Verdict: Already algorithmic. The Whisper API is deterministic for the same audio input — same audio in = same transcript out. The transcription approach itself is correct. The issues are architectural (dead code, duplicate implementations) and quality (heuristic confidence vs. API-native confidence).**

**Target category reclassification: From "quantitative prediction component" → "Infrastructure / Pre-processing".**

Whisper should not be counted as a "prediction component" because:
1. It returns `prediction: undefined` — no VPS score contribution
2. It's resolved BEFORE the orchestrator runs — it's a pre-processing step, not a pipeline component
3. The orchestrator registration is dead code — never fires through any prediction path
4. Its output (transcript text) is consumed by other components, not by the aggregation/scoring logic

**Comparison to FFmpeg (Component 1):** FFmpeg is also "infrastructure" in a sense (extracts raw data), but FFmpeg DOES return a `prediction` score (the visual score 0-100) and IS included in a prediction path. Whisper returns `prediction: undefined` and is NOT in any path. The distinction is clear — Whisper is pure infrastructure.

**Implementation path:**

1. **Remove dead code** — Delete `executeWhisper()` (lines 3239-3298) and `transcribeVideoWithWhisper()` (lines 3304-3367) from `kai-orchestrator.ts`. These 128 lines are an exact duplicate of `whisper-service.ts` with worse settings (128k bitrate vs 32k, hardcoded English, error swallowing).
2. **Reclassify in registry** — Either remove `whisper` from `COMPONENT_REGISTRY` entirely (honest count: 21 components) or add a `isInfrastructure: true` flag to distinguish it from prediction components.
3. **Switch to verbose_json** — In `whisper-service.ts` line 61, change `response_format: 'text'` to `response_format: 'verbose_json'`. Parse the response to extract `segments[].avg_log_prob` and `segments[].no_speech_prob`. Replace the heuristic `calculateWhisperConfidence()` with the API's native per-segment confidence.
4. **Propagate native confidence** — Update `TranscriptionResult` to include `whisperSegmentConfidence: number` and `noSpeechProbability: number`. Feed these into the calibrator for more accurate "no speech" detection.
5. **Keep everything else** — The transcription pipeline architecture (resolve before orchestrator), the 4-stage fallback chain, and the calibrator integration are all correctly designed.

**What should NOT change:**
- The pipeline architecture (transcript resolution before orchestrator) — this is correct
- The fallback chain (user → whisper → title/description → none) — this is correct
- The calibrator wiring (transcriptionSource, transcriptionSkipped, resolvedTranscriptLength) — this is correct
- The `whisper-service.ts` core logic (FFmpeg extract → Whisper API) — this works

**Expected difficulty:** Low — the dead code removal is trivial. The verbose_json switch is a single-line API change plus response parsing. No architectural changes needed.

**Expected impact:** Low-to-medium — the dead code removal is housekeeping. The real impact comes from native confidence scores, which would improve the calibrator's "no speech" detection accuracy, but this matters most in automated workflows (not the current primary testing workflow).

#### Summary Verdict

| Dimension | Assessment |
|---|---|
| **Concept validity** | Strong — transcript resolution as a pre-processing step is the right architecture |
| **Current implementation** | Mixed — `transcription-pipeline.ts` is well-designed, but 128 lines of dead code in the orchestrator create confusion and the confidence heuristic is a weaker substitute for the API's native scores |
| **Is it algorithmic?** | Yes, already — Whisper API is deterministic. No LLM opinion involved. |
| **Architecture debt** | Medium — dead code in orchestrator (128 lines), duplicate implementation, phantom component registration inflating the count from 21 to 22 |
| **New architecture fit** | Critical dependency — 11 components need transcript. Current design (resolve before orchestrator) correctly positions Whisper as infrastructure, not a competitor for VPS scoring |
| **Priority for conversion** | Low — Whisper works correctly in its active implementation. The issues are cleanup (dead code, registry) and improvement (API-native confidence), not fundamental redesign |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-08 | WSP-001 | Removed dead `executeWhisper()` (60 lines) and `transcribeVideoWithWhisper()` (64 lines) from orchestrator. Registry `execute` stubbed to return error explaining real impl location. | `kai-orchestrator.ts` | 128 lines of dead Whisper code duplicating `whisper-service.ts` | 3-line comment + stub execute in registry | tsc clean (no new errors) |
| 2026-03-08 | WSP-003 | Switched Whisper to `verbose_json` format. Now extracts native `avg_log_prob` per segment (converted to 0-1 via `Math.exp`), `no_speech_prob`, and duration-weighted overall confidence. Transcription pipeline uses native confidence when available, keeps heuristic as fallback. `noSpeechProbability` propagated through TranscriptionStatus → CalibrationInput. | `whisper-service.ts`, `transcription-pipeline.ts`, `runPredictionPipeline.ts`, `prediction-calibrator.ts` | `response_format: 'text'`, heuristic confidence (word count + alpha ratio) | `response_format: 'verbose_json'`, native segment confidence, `noSpeechProbability` in calibrator | tsc clean, zero new test failures |

#### Open Issues

| Issue ID | Description | Blocked By | Priority |
|---|---|---|---|
| ~~WSP-001~~ | ~~Dead code removed~~ | — | ~~Medium~~ **FIXED** |
| WSP-002 | `whisper` registered in `COMPONENT_REGISTRY` but not in any prediction path — inflates component count to 22 when real count is 21 | Nothing | Low |
| ~~WSP-003~~ | ~~Switched to verbose_json, native confidence extracted and propagated~~ | — | ~~Medium~~ **FIXED** |
| ~~WSP-004~~ | ~~Divergent settings resolved — orchestrator duplicate removed~~ | ~~WSP-001~~ | ~~Medium~~ **FIXED** (by WSP-001) |
| ~~WSP-005~~ | ~~Mitigated by WSP-003: native confidence replaces heuristic, no_speech_prob available to calibrator~~ | — | ~~Future~~ **MITIGATED** |

**Batch B Progress (2026-03-08):**
- **Prompt 2, Part A COMPLETE:** Created `src/lib/services/speaking-rate-analyzer.ts` — computes actual WPM per Whisper verbose_json segment:
  - 12 computed metrics: overallWpm, wpmMean, wpmVariance, wpmStdDev, wpmRange, wpmAcceleration (linear regression slope), hookWpm (first 3s ratio), wpmPeakCount, slowSegments (<100 WPM), fastSegments (>180 WPM), paceCategory classification
  - Per-segment WPM array with word count
  - Pace categories: 'dynamic', 'consistently-fast', 'consistently-slow', 'accelerating', 'decelerating'
  - Uses coefficient of variation (stddev/mean) for classification
  - Edge cases handled: <3 segments, empty segments, Whisper artifacts stripped
- Directly addresses AUD-003 (silence-ratio-based pace estimation replaced by actual WPM variance)
- NOT yet wired into audio-analyzer or orchestrator (Prompt 3)

---

### Component 3: Feature Extraction Service

| Field | Value |
|---|---|
| **ID** | `feature-extraction` |
| **Registry Type** | `quantitative` |
| **Registry Reliability** | 0.99 |
| **Registry Avg Latency** | 60,000ms |
| **API Dependency** | None (local computation) |
| **Target Category** | Remove or merge |
| **Analysis Date** | 2026-03-08 |
| **Analyst** | Layer 2 Audit Session (Claude) |

#### Step 1: Concept — What Should This Component Measure?

In theory, a feature extraction component should produce a structured numerical vector from a video's content — text metrics, linguistic patterns, sentiment signals — that a downstream ML model (XGBoost) can consume. The concept is sound: deterministic measurements of content characteristics that correlate with virality. Same transcript in = same feature vector out.

**New Architecture Role:**

| Quality Gate Driver | Feature Extraction Contribution |
|---|---|
| Content Structure (20%) | Readability scores, sentence structure, section counts |
| Hook Retention (45%) | Emotional power words at transcript start, first-sentence patterns |
| Production Floor (10%) | Word count, duration metadata (proxy for content effort) |

| Distribution Potential Driver | Feature Extraction Contribution |
|---|---|
| Share Probability (25%) | Emotional intensity, viral pattern words, controversy markers |
| Niche Saturation (25%) | Could feed keyword overlap detection with niche benchmarks |

#### Step 2: Reality — What Does The Code Actually Do?

**Finding R3-1: TWO completely separate "feature extraction" systems exist — neither one's output is consumed.**

| System | Location | Features | Used By | Status |
|---|---|---|---|---|
| 106-feature service | `src/lib/services/feature-extraction/` (5 files) | Groups A-K: text metrics, punctuation, pronouns, emotions, viral patterns, formatting, linguistic complexity, dialogue, content structure, timestamp pacing, metadata | `hybrid-predictor.ts` (legacy, not in canonical pipeline) | **ORPHANED** |
| 152-feature unified training service | `src/lib/services/training/unified-training-features.ts` | Text/metadata (~53) + FFmpeg (~24) + LLM scores (~9) + Pattern flags (~10) + computed (~56) | Orchestrator's `executeFeatureExtraction()` | **RUNS but output unused** |

The orchestrator calls `extractUnifiedTrainingFeatures()` — the 152-feature version, NOT the 106-feature version. But the 106-feature system is the better-engineered one (clean types, modular extractors, no LLM dependency).

**Finding R3-2: The component returns `prediction: undefined` — contributes ZERO to VPS.**

From `kai-orchestrator.ts` line 3714:
```
prediction: undefined, // Feature extraction doesn't predict
```

In the quantitative path, results with `prediction === undefined` are filtered out during path averaging (line 1354). This means feature-extraction occupies a slot in the quantitative path but contributes nothing to the VPS score. It's like having a sensor wired up that sends data to a monitor nobody looks at.

**Finding R3-3: No downstream consumer reads the extracted features.**

The features ARE stored in the output features map (`features['feature-extraction'] = { features, featureCount, coverage, groupsExtracted }`), but:
- XGBoost (`executeXGBoostViralityML`) builds its own 41-feature vector from `input.ffmpegData` and `input.componentResults` — it does NOT read from the feature-extraction output
- No other component imports or reads the feature-extraction results
- The pipeline returns the features in the API response, but no UI or downstream process consumes them
- The training export script (`scripts/export-training-dataset.ts`) has its own feature extraction logic

**Finding R3-4: The 106-feature service has genuinely useful deterministic extractors.**

`text-analysis-extractors.ts` contains well-implemented, deterministic measurements:
- **Group A (15):** Word count, sentence count, avg word/sentence length, lexical diversity, 6 readability indices (Flesch, Gunning Fog, SMOG, etc.)
- **Group B (10):** Punctuation counts and ratios
- **Group C (8):** Pronoun perspective analysis (first/second/third person ratios, perspective shifts)
- **Group D (20):** Emotion word counts across 13 categories + emotional intensity, sentiment polarity, volatility
- **Group E (15):** Viral pattern word detection (shock, controversy, scarcity, social proof, authority, storytelling markers)
- **Groups F-K (38):** Formatting, linguistic complexity, dialogue markers, content structure, pacing

These are exactly the kind of deterministic, repeatable measurements that should feed the ML pipeline. The word lists are comprehensive and the extraction functions are clean.

**Finding R3-5: The 106-feature service is consumed only by `hybrid-predictor.ts` — a legacy file.**

`hybrid-predictor.ts` imports `extractFeaturesFromVideo` from the 106-feature service. But `hybrid-predictor.ts` is NOT used by the canonical prediction pipeline (`runPredictionPipeline.ts`). It's a dead-end legacy artifact from before the current architecture was established.

**Finding R3-6: Feature extraction adds 60 seconds of latency for zero VPS impact.**

Registry says `defaultAvgLatency: 60000` (60 seconds). The unified training features call includes FFmpeg analysis and LLM scoring. All this work produces features that nothing reads — pure waste.

**Finding R3-7: The `enhanced-feature-extraction.ts` is a third, also-dead feature system.**

This file depends on a Python microservice (`python-service-client`) for PySceneDetect and VADER sentiment. The Python service is not running — this is completely dead code from an earlier architecture.

#### Step 3: Engineering Decision — Can It Become Algorithmic?

**Verdict: Already algorithmic (Groups A-K in the 106-feature service). The problem is not algorithmic quality — the problem is that the output feeds nothing. The 106-feature extraction service has exactly the kind of features XGBoost needs, but it's disconnected from the pipeline. This is a wiring problem, not a quality problem.**

**Recommendation: REMOVE the component from the prediction pipeline, SALVAGE the 106-feature extractors for future XGBoost retraining.**

Detailed disposition:

| System | Action | Rationale |
|---|---|---|
| 106-feature service (`feature-extraction/`) | **KEEP for future XGBoost** | Well-engineered, deterministic, exactly what an ML model needs |
| 152-feature unified training service | **DEPRECATE** | Redundant with 106-feature service + new Layer 1 signals |
| Component registration in orchestrator | **DISABLE or REMOVE** | 60s latency for zero VPS contribution |
| `hybrid-predictor.ts` | **REMOVE** | Dead legacy code |
| `enhanced-feature-extraction.ts` | **REMOVE** | Dead Python service dependency |

**Future state:** When XGBoost is retrained (after 200+ labeled samples), the training pipeline should use the 106-feature service extractors PLUS the new Layer 1 prosodic/audio/speaking-rate features as input. The feature extraction shouldn't be a "component" — it should be a pre-processing step (like Whisper) that produces features consumed by the ML model.

**Expected difficulty:** Low — removal is trivial. Salvage for XGBoost retraining requires wiring the extractors into the training export.
**Expected impact:** Positive — removes 60s of wasted latency per prediction. Clarifies the architecture by removing the illusion of a "152-feature component" that contributes nothing.

#### Summary Verdict

| Dimension | Assessment |
|---|---|
| **Concept validity** | Strong — deterministic text features are exactly what ML models need |
| **Current implementation** | Three separate systems, none connected to anything. 106-feature service is well-built but orphaned. 152-feature service runs but output is unused. Enhanced version is dead. |
| **Is it algorithmic?** | Yes — the 106-feature extractors are deterministic word counting, regex matching, and readability formulas |
| **Architecture debt** | Critical — 60 seconds of latency per prediction for zero VPS impact. Three dead feature systems creating confusion. |
| **New architecture fit** | Not a prediction "component" — should be a pre-processing step feeding XGBoost training |
| **Priority** | High — disable in pipeline to save 60s latency. Salvage extractors for XGBoost retraining (Layer 5). |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-08 | R3-FIX-1 | Disabled at runtime — prediction: undefined and output consumed by nothing. Saves ~60s + 1 LLM API call per run. | `system-registry.ts`, `kai-orchestrator.ts` | Runs every prediction, burns 60s + LLM call, output unused | Always disabled at runtime (same pattern as niche-keywords) | Pending |
| — | — | — | — | — | — | — |

#### Open Issues

| Issue ID | Description | Blocked By | Priority |
|---|---|---|---|
| FE-001 | Component runs 60s and contributes zero VPS — should be disabled in pipeline | Nothing | High |
| FE-002 | 106-feature extractors are orphaned — should be wired into XGBoost training export | XGBoost retrain (Layer 5) | Medium |
| FE-003 | `hybrid-predictor.ts` is dead legacy code — should be deleted | Nothing | Low |
| FE-004 | `enhanced-feature-extraction.ts` depends on dead Python service — should be deleted | Nothing | Low |
| FE-005 | Three separate feature systems create architectural confusion | FE-001, FE-003, FE-004 | Medium |

---

### Component 4: GPT-4 Qualitative Analysis

| Field | Value |
|---|---|
| **ID** | `gpt4` |
| **Registry Type** | `qualitative` |
| **Registry Reliability** | 0.92 (registry) / 45.3% (learned, avg error: 31.7 VPS) |
| **Registry Avg Latency** | 3,000ms |
| **Observed Latency** | 1,903ms (runtime 2026-03-09) |
| **API Dependency** | `OPENAI_API_KEY` (has heuristic fallback) |
| **Target Category** | Evaluate for removal or demotion to coach lane |
| **Analysis Date** | 2026-03-09 |
| **Analyst** | Layer 3 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

The GPT-4 evaluator is one of three LLM-based "qualitative evaluators" in the `qualitative` prediction path. Its conceptual purpose is to provide an independent subjective opinion on the video's viral potential from a different LLM than Gemini or Claude, creating diversity in the ensemble.

**New Architecture Role:**

| Quality Gate Driver | GPT-4 Contribution |
|---|---|
| Hook Retention (45%) | `hook_effectiveness` dimension (25% of GPT-4's internal weights) |
| Content Structure (20%) | Implicit in `viral_probability` overall assessment |

| Distribution Potential Driver | GPT-4 Contribution |
|---|---|
| Share Probability (25%) | `emotional_appeal` dimension (20% of GPT-4's internal weights) |
| Audience Fit (15%) | `audience_match` dimension (15% of GPT-4's internal weights) |

**Fundamental question:** Does a second LLM transcript opinion add enough unique signal beyond Gemini (which already sees the actual video file) to justify the API cost and latency?

#### Step 2: Reality — What Does The Code Actually Do?

**Finding GPT4-001: Simple 4-dimension prompt, reasonable but undifferentiated.**

`executeGPT4()` in `kai-orchestrator.ts` (lines 3286-3376) sends a single-shot prompt to `gpt-4o-mini` asking for 4 scores:

```
1. viral_probability (0-100): weighted 40%
2. hook_effectiveness (0-100): weighted 25%
3. emotional_appeal (0-100): weighted 20%
4. audience_match (0-100): weighted 15%
```

The hook is extracted as the first 15 words of the transcript. The prompt includes the niche context. Temperature: 0.3. Max tokens: 100 (very tight). Response format: JSON.

**Runtime evidence (2026-03-09):** Viral=85, Hook=80, Emotion=75, Audience=90 → weighted prediction: 83.0. Latency: 1,903ms. Confidence: hardcoded 0.85.

**Finding GPT4-002: Hardcoded confidence of 0.85 regardless of input quality.**

Unlike Claude (which gets confidence from the LLM response) or Gemini (which adjusts confidence based on analysis type), GPT-4 returns `confidence: 0.85` every time. This is then used as its effective weight in path aggregation. The confidence should reflect how much data was available and how certain the LLM's response is.

**Finding GPT4-003: Heuristic fallback is reasonable but low-signal.**

When `OPENAI_API_KEY` is missing, `executeGPT4Fallback()` (lines 3382-3424) computes a keyword-based score: base 55, +10 for sentence structure, +10 for hook words, +3 per emotional word, +4 per value word. Confidence: 0.5. This is honestly labeled as fallback.

**Finding GPT4-004: The 4 subdimensions are discarded after aggregation.**

GPT-4 returns `hook_effectiveness`, `emotional_appeal`, `audience_match` as features, but these are stored only in `features.gpt4` — they never influence any downstream component or the VPS calculation directly. Only the single weighted prediction (83.0) matters to the ensemble. The subdimensions provide diagnostic insight but zero computational value.

**Finding GPT4-005: Learned reliability is 45.3% — the worst among LLM evaluators.**

The reliability learning system records GPT-4 at 45.3% over 9 predictions with an average error of 31.7 VPS. For context: Claude is 60.3% (6.4 avg error, 3 predictions), Gemini is 46.0% (32.5 avg error, 8 predictions). GPT-4 and Gemini have nearly identical poor reliability, while Claude's small sample (3) makes its higher reliability unreliable as evidence.

**Finding GPT4-006: Transcript-only input makes this a duplicate of Claude with fewer dimensions.**

GPT-4 sees: transcript (2000 chars) + niche. Claude sees: transcript (3000 chars). Gemini sees: actual video file + niche + goal. GPT-4 and Claude are both "read the transcript and guess a viral score" components with slightly different prompts. They see identical data (the transcript) through the lens of the same fundamental task ("score 0-100").

#### Step 3: Engineering Decision

**Verdict: Demote to coach lane only. Remove from VPS scoring path.**

| Dimension | Assessment |
|---|---|
| Concept validity | Weak — a second transcript-only LLM opinion adds marginal signal over Gemini (which sees the video) |
| Current implementation | Functional but undifferentiated — 4-dimension prompt, hardcoded confidence, transcript-only |
| Is it unique? | No — overlaps substantially with Claude (both transcript-only LLM evaluators) |
| Architecture debt | Low — clean implementation, isolated. But it contributes correlated noise to ensemble |
| New architecture fit | Does not contribute unique signal to Quality Gate or Distribution Potential beyond what Gemini already provides |
| API cost | ~$0.001 per prediction (gpt-4o-mini). Low cost is its only advantage. |
| Priority | Medium — not broken, but its inclusion in VPS scoring degrades ensemble independence |

**Recommended disposition:**
1. Keep running in pipeline but move to **coach lane only** — its scores are logged, insights are displayed, but its prediction does NOT enter the VPS weighted average
2. Redirect its output to feed the editing suggestions (coaching output) alongside Pack 2
3. Its `hook_effectiveness` score could be used as a coaching calibration signal against the deterministic hook-scorer

---

### Component 5: Gemini Analysis

| Field | Value |
|---|---|
| **ID** | `gemini` |
| **Registry Type** | `qualitative` |
| **Registry Reliability** | 0.92 (registry) / 46.0% (learned, avg error: 32.5 VPS) |
| **Registry Avg Latency** | 35,000ms |
| **Observed Latency** | 25,805ms (runtime 2026-03-09) |
| **API Dependency** | `GOOGLE_GEMINI_AI_API_KEY` |
| **Target Category** | Keep as primary qualitative evaluator — but fix double-counting and score inflation |
| **Analysis Date** | 2026-03-09 |
| **Analyst** | Layer 3 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

Gemini is the **only multimodal evaluator** in the system. When a video file is available, it analyzes the actual video (visual + audio + speech), not just the transcript. This makes it fundamentally more capable than GPT-4 or Claude, which only see text. It should provide the subjective human-judgment layer that deterministic components cannot: "Does this *feel* like it will go viral? Does the execution quality match the idea quality?"

**New Architecture Role:**

| Quality Gate Driver | Gemini Contribution |
|---|---|
| Hook Retention (45%) | `hookStrength` (0-10) — sees actual visual hook, not just text |
| Delivery Baseline (25%) | `executionQuality` (0-10) — rates actual delivery when video is available |
| Production Floor (10%) | `audioQuality`, `visualEngagement` — actual A/V quality assessment |

| Distribution Potential Driver | Gemini Contribution |
|---|---|
| Share Probability (25%) | `shareability`, `emotionalTriggers` — holistic assessment |
| Trend Alignment (20%) | `viralFactorsPresent/Missing` — pattern recognition |
| Audience Fit (15%) | `targetAudience`, `platformFit` — contextual judgment |

**Gemini is the strongest individual evaluator because it sees the most data.** The problem is not Gemini's capability — it's that Gemini's opinion enters the VPS through multiple paths, inflating its effective weight far beyond what the architecture intends.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding GEM-001 (CRITICAL): Gemini is triple-counted through three separate paths.**

Gemini 2.5 Flash appears in the VPS calculation through three independent channels:

| Channel | Component ID | Path | What It Does | Effective Weight |
|---|---|---|---|---|
| **Direct evaluator** | `gemini` | `qualitative` (25% path weight) | `geminiService.analyzeVideoFile()` or `.analyzeTranscript()` → viralPotential 0-100 | ~10-15% of final VPS |
| **Pack 1 (Unified Grading)** | `unified-grading` | `pattern_based` (45% path weight) | `unified-grading-runner.ts` → Gemini prompt for 9 attributes + 7 legos + hook + pacing + clarity + novelty | ~5-8% of final VPS |
| **Pack V (Visual Rubric)** | `visual-rubric` | `pattern_based` (45% path weight) | `gemini-vision-scorer.ts` → Gemini Vision for 5 frame-based visual scores (60% weight in blend) | ~3-5% of final VPS |

**Combined: Gemini controls ~18-28% of final VPS through 3 separate calls.** This is the largest single-LLM dependency in the system. All three calls use the same model (`gemini-2.5-flash`), same API key, and share the same systematic biases.

**Runtime evidence (2026-03-09):**
- `gemini` direct: VPS=97.0, conf=0.95 (qualitative path)
- `unified-grading` (Pack 1, Gemini-powered): VPS=74.0, conf=0.90 (pattern_based path)
- `visual-rubric` (Pack V, 60% Gemini Vision): VPS=59.0, conf=0.80 (pattern_based path)

Three Gemini calls, three different scores (97, 74, 59) for the same video. The spread of 38 points illustrates how the same model gives wildly different answers depending on how you frame the question — but all three carry independent weight in the ensemble.

**Finding GEM-002 (CRITICAL): Scoring guidelines create a floor of ~55 for any reasonable content.**

`gemini-service.ts` lines 19-70 define `VIRAL_SCORING_GUIDELINES` with explicit minimum-score rules:

```
1. Question or bold statement in first line → minimum 55
2. Curiosity gaps → minimum 60
3. Emotional triggers → minimum 65
4. Clear value + hook + CTA → minimum 70
5. All viral factors well-executed → 80+
```

Any TikTok video with even basic structure (a question + some value) is guaranteed a minimum of 65-70 from Gemini. Combined with the execution quality adjustment (line 280: `(executionQuality - 5) * 3`), a well-executed video gets +12-15 points on top of an already inflated baseline.

**Runtime evidence:** The video scored 97 from Gemini (execution quality 9/10 → +12 DPS boost). Base score was 85, boosted to 97. This is an extremely inflated score for a side-hustle video that the deterministic components scored at 33-75.

**Finding GEM-003: Execution quality adjustment is additive, not multiplicative — allows scores above 100.**

Line 281: `adjustedViralPotential = Math.max(0, Math.min(100, adjustedViralPotential + executionFactor))`

An LLM-rated `viralPotential` of 90 + execution quality 10/10 → `executionFactor = (10-5)*3 = 15` → raw score 105, clamped to 100. The clamp prevents overflow, but the additive nature means high execution quality always pushes scores toward the ceiling.

**Finding GEM-004: The 2.5x weight boost in pre-gate aggregation (lines 1412-1413) is overridden by consensus gate.**

The orchestrator gives Gemini a 2.5x weight multiplier during the initial path aggregation. This produces the inflated qualitative path VPS of 90.4. However, the consensus gate (lines 1838-1941) recomputes all path aggregations from scratch, capping LLM weights to 0.15 (or zeroing if spread > 10). The 2.5x boost only survives as a stale fallback value when the qualitative path has no non-LLM components (see CCI-L3-002).

**Finding GEM-005: Gemini's 3x boost in disagreement reconciliation (lines 2064-2068) compounds the problem.**

When paths have low agreement, `performDisagreementReconciliation()` gives the qualitative path 3x weight because "Gemini is the most accurate differentiator." This means Gemini dominates the final score in exactly the scenario where the system should be most cautious — when evaluators disagree.

**Finding GEM-006: Video file analysis is Gemini's unique advantage — but only available when `videoPath` exists.**

When a video file is uploaded, Gemini uses the Google AI Files API to upload the video and analyze it multimodally. This is genuinely unique — no other component has this capability. But when only a transcript is available (the common `/admin/upload-test` workflow with text-only input), Gemini falls back to transcript analysis using `buildAnalysisPrompt()` — making it functionally identical to GPT-4 and Claude, just with a different prompt and higher scoring floors.

#### Step 3: Engineering Decision

**Verdict: Keep as the single primary qualitative evaluator. Fix double-counting, remove score inflation, remove weight boosts.**

| Dimension | Assessment |
|---|---|
| Concept validity | **Strong** — multimodal analysis is genuinely unique and valuable |
| Current implementation | Over-indexed — triple-counted, inflated scores, artificial weight boosts |
| Is it unique? | **Yes, when video file is available** — the only component that sees actual video. No, when transcript-only — same as GPT-4/Claude with better prompt |
| Architecture debt | **Critical** — double/triple counting, scoring guidelines inflate all scores, weight boosts override the ensemble logic |
| New architecture fit | Primary subjective evaluator for execution quality, platform fit, holistic "feel" |
| API cost | ~$0.01-0.05 per prediction (video upload + analysis). Higher cost but highest unique signal. |
| Priority | **Critical** — fixing the double-counting and score inflation is the highest-priority Layer 3 action |

**Implementation path:**
1. **Remove scoring guideline floors** — let Gemini score freely without minimum rules. The floors systematically inflate all scores toward 65-97.
2. **Remove execution quality additive adjustment** — or make it multiplicative (±10% instead of ±15 points)
3. **Remove the 2.5x weight boost** (lines 1412-1413) and the **3x disagreement boost** (lines 2064-2068)
4. **Accept that Pack 1 and Pack V also use Gemini** — but ensure the consensus gate only measures spread across the 3 direct evaluators (GPT-4, Gemini, Claude), not Pack outputs
5. Consider: if video file is NOT available, skip Gemini entirely (it adds no unique signal as transcript-only)

#### Layer 3 Consolidated Fix Log (Components 4, 5, 6, 15)

| Date | Prompt | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|---|
| 2026-03-09 | P1 | L3-P1-01 | GPT-4 demoted to coach lane — weight=0 for VPS | `kai-orchestrator.ts`, `CLAUDE.md` | GPT-4 score contributes ~15% of VPS | Weight=0 via COACH_LANE_COMPONENT_IDS, output stored for coaching | tsc clean |
| 2026-03-09 | P1 | L3-P1-02 | Claude demoted to coach lane — weight=0 for VPS | `kai-orchestrator.ts`, `CLAUDE.md` | Claude score contributes ~10-15% of VPS | Weight=0 via COACH_LANE_COMPONENT_IDS, output stored for coaching | tsc clean |
| 2026-03-09 | P1 | L3-P1-03 | Virality Matrix disabled — moved to disabledComponents | `kai-orchestrator.ts`, `system-registry.ts` | VM runs every prediction, takes slot in ensemble | Never executes, removed from pattern_based path | tsc clean |
| 2026-03-09 | P1 | L3-P1-04 | VM registry corrected | `system-registry.ts` | `apiDependency: 'OPENAI_API_KEY'`, `defaultAvgLatency: 15000` | No apiDependency, `defaultAvgLatency: 50`, description: DISABLED | tsc clean |
| 2026-03-09 | P1 | L3-P1-05 | Coach lane weight=0 in path aggregation (both pre-gate and consensus gate) | `kai-orchestrator.ts` | Coach lane components scored at full weight | COACH_LANE_COMPONENT_IDS check sets weight=0 | tsc clean |
| 2026-03-09 | P2 | L3-P2-01 | LLM_COMPONENT_IDS reduced from 7 to 3 | `kai-orchestrator.ts` | `{gpt4, gemini, claude, unified-grading, editing-coach, 9-attributes, 7-legos}` | `{gpt4, gemini, claude}` — consensus gate now measures actual LLM evaluators only | tsc clean |
| 2026-03-09 | P2 | L3-P2-02 | CCI-L3-002 stale fallback bug fixed | `kai-orchestrator.ts` | `path.aggregatedPrediction = ... : path.aggregatedPrediction` (leaks pre-gate value) | `... : undefined` — zeroed paths drop out of final average | tsc clean |
| 2026-03-09 | P2 | L3-P2-03 | Gemini 2.5x and GPT-4 1.2x weight boosts removed | `kai-orchestrator.ts` | LLM components got 1.2x-2.5x multipliers in pre-gate aggregation | Confidence-only weighting, no boost | tsc clean |
| 2026-03-09 | P2 | L3-P2-04 | 3x qualitative path boost in disagreement reconciliation removed | `kai-orchestrator.ts` | Qualitative path got 3x weight when paths disagreed | All paths weighted equally by configured path weights | tsc clean |
| 2026-03-09 | P3 | L3-P3-01 | Gemini scoring guidelines rewritten — all 5 floor rules removed | `gemini-service.ts` | Min 55/60/65/70/80+ floors, "DO NOT default to middle scores" | "Most videos are average (40-60). Reserve 75+ for exceptional. 90+ should be <5%." | tsc clean |
| 2026-03-09 | P3 | L3-P3-02 | Execution quality adjustment: additive → multiplicative | `gemini-service.ts` | `±(eq-5)*3` = ±15 points additive | `1 + ((eq-5)/50)` = ×0.90 to ×1.10 multiplicative | tsc clean |
| 2026-03-09 | P3 | L3-P3-03 | Fallback score in `extractInsightsFromText` fixed | `gemini-service.ts` | `viralPotential: 60` | `viralPotential: 45` — uncertain = below average | tsc clean |
| 2026-03-09 | P3 | L3-P3-04 | Fallback in `getFallbackAnalysis` fixed | `gemini-service.ts` | `viralPotential: 55, confidence: 0.3` | `viralPotential: 0, confidence: 0` — failed analysis contributes nothing | tsc clean |

---

### Component 6: Claude Analysis

| Field | Value |
|---|---|
| **ID** | `claude` |
| **Registry Type** | `qualitative` |
| **Registry Reliability** | 0.85 (registry) / 60.3% (learned, avg error: 6.4 VPS, 3 predictions) |
| **Registry Avg Latency** | 15,000ms |
| **Observed Latency** | 2,494ms (runtime 2026-03-09) |
| **API Dependency** | `ANTHROPIC_API_KEY` |
| **Target Category** | Evaluate for removal or demotion to coach lane |
| **Analysis Date** | 2026-03-09 |
| **Analyst** | Layer 3 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

Claude is the third LLM evaluator in the qualitative path. Its conceptual purpose is to provide a third independent opinion from a different model family (Anthropic vs. OpenAI vs. Google). The theory is that three LLMs from different providers will have uncorrelated errors, creating ensemble diversity.

**New Architecture Role:**

| Quality Gate Driver | Claude Contribution |
|---|---|
| Hook Retention (45%) | `hook_rating` (0-10) |
| Content Structure (20%) | `value_rating` (0-10) |

| Distribution Potential Driver | Claude Contribution |
|---|---|
| Share Probability (25%) | `share_rating` (0-10) |

Claude asks for 5 subdimensions: hook_strength, value_delivery, emotional_engagement, shareability, cta_effectiveness. These align well with the Quality Gate / Distribution Potential framework — but like GPT-4, only the single `viral_score` matters to the ensemble. The subdimensions are stored but unused.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding CLD-001: Claude has the richest prompt but the most conservative scoring.**

`executeClaude()` in `kai-orchestrator.ts` (lines 5049-5157) sends a prompt asking for:
- `viral_score` (0-100) — the primary prediction
- `confidence` (0.0-1.0) — self-reported confidence (unlike GPT-4's hardcoded 0.85)
- 5 rating dimensions: `hook_rating`, `value_rating`, `emotion_rating`, `share_rating`, `cta_rating` (all 0-10)
- Qualitative insights: `strengths[]`, `weaknesses[]`, `recommendation`

This is the most structured output of the three evaluators. The model is `claude-3-haiku-20240307` — the cheapest Claude model, which is fast (2.5s observed) but less capable than Sonnet or Opus.

**Runtime evidence (2026-03-09):** VPS=75.0, conf=0.80. This is 22 points lower than Gemini (97) and 8 points lower than GPT-4 (83). Claude's conservative scoring is consistent with its learned reliability data (60.3%, avg error 6.4 VPS over 3 predictions — the best accuracy of the three, but tiny sample).

**Finding CLD-002: Claude's API key dependency makes it conditionally available.**

If `ANTHROPIC_API_KEY` is not set, Claude returns `success: false` immediately. Unlike GPT-4 (which has a heuristic fallback), Claude provides no fallback. When Claude fails, the qualitative path drops to 2 components (GPT-4 + Gemini), making Gemini's inflated score even more dominant.

**Runtime evidence:** In this run, Claude DID succeed (API key was present). The qualitative path had all 3 evaluators: GPT-4=83, Gemini=97, Claude=75. Without Claude, the qualitative path average would be ~90 (dominated by Gemini's 2.5x weight).

**Finding CLD-003: Claude uses claude-3-haiku — the least capable model in the Claude family.**

Haiku is optimized for speed and cost, not depth of analysis. For a task that requires nuanced subjective judgment about viral content, Sonnet would provide meaningfully better analysis. However, upgrading the model increases cost and latency without addressing the fundamental question of whether a third transcript-only LLM opinion adds value.

**Finding CLD-004: Self-reported confidence is the most honest of the three evaluators.**

Claude is the only evaluator that gets confidence from the LLM response itself (`result.confidence || 0.75`). GPT-4 hardcodes 0.85. Gemini derives confidence from analysis type + a constant. Claude's approach is more honest — the model can express uncertainty about ambiguous content.

**Finding CLD-005: The 5 subdimensions overlap significantly with hook-scorer and Pack 1.**

| Claude Dimension | Overlap With |
|---|---|
| `hook_rating` | Hook Scorer (#10) — same concept, LLM opinion vs. deterministic measurement |
| `value_rating` | Pack 1 unified-grading `valueProposition` attribute |
| `emotion_rating` | Pack 1 `emotionalAppeal` attribute |
| `share_rating` | Virality Matrix `vm_shareability` dimension |
| `cta_rating` | Pattern Extraction CTA zone scoring |

Every subdimension Claude measures is already measured by another component — some deterministically.

#### Step 3: Engineering Decision

**Verdict: Demote to coach lane only. Same recommendation as GPT-4.**

| Dimension | Assessment |
|---|---|
| Concept validity | Moderate — third independent LLM opinion has theoretical ensemble value, but in practice it's another transcript-only evaluator |
| Current implementation | Clean and well-structured — best prompt design of the three, self-reported confidence |
| Is it unique? | **No** — transcript-only, like GPT-4. All 5 subdimensions overlap with existing components. Its only differentiator is the model family (Anthropic vs. OpenAI/Google) |
| Architecture debt | Low — clean implementation, conditional availability (API key), no weight boosts |
| New architecture fit | Coach lane: its `strengths`, `weaknesses`, and `recommendation` output is genuinely useful for user-facing coaching |
| API cost | ~$0.001 per prediction (Haiku). Very cheap. |
| Priority | Medium — not harmful (most conservative scorer), but its VPS contribution adds correlated noise |

**Recommended disposition:**
1. Keep running in pipeline but move to **coach lane only** — insights shown to user, prediction NOT in VPS
2. Its `strengths/weaknesses/recommendation` output is the best structured coaching data in the system — feed this directly to the user-facing analysis panel
3. If kept in VPS at all, its lower scores provide useful downward pressure against Gemini inflation — but this is treating a symptom, not the disease

---

### Component 7: 9 Attributes Scorer

| Field | Value |
|---|---|
| **ID** | `9-attributes` |
| **Registry Type** | `pattern` |
| **Registry Reliability** | 0.85 |
| **Registry Avg Latency** | 500ms |
| **API Dependency** | None (100% regex-based) |
| **Target Category** | Coach lane (coaching output only) |
| **Analysis Date** | 2026-03-09 |
| **Analyst** | Layer 4 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

9-Attributes scores content across 9 dimensions: TAM Resonance, Sharability, Hook Strength, Format Innovation (Getting Attention bucket); Value Density, Pacing & Rhythm, Curiosity Gaps, Emotional Journey, Clear Payoff (Holding Attention bucket). Each scored 1-10 with text reason.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding 9A-001: Fully deterministic regex-based scoring.** `analyzeNineAttributes()` at `kai-orchestrator.ts:2267-2498`. Each attribute starts at 5/10, gets regex bonuses. No LLM. ~5ms.

**Finding 9A-002: In coach lane — weight=0 for VPS.** Already in `COACH_LANE_COMPONENT_IDS`.

**Finding 9A-003: Every dimension covered better by another component.** Hook Strength → hook-scorer (#10, 5-channel multi-modal). Sharability/TAM → pattern-extraction (#11, positional weighting). Format Innovation → 24-styles (#9, 24 categories). Value/Pacing/Curiosity/Emotion/Payoff → Pack 1 (#19, Gemini) or audio-analyzer (#12, real WPM).

**Finding 9A-004: Dynamic confidence well-designed.** Based on transcript length + score variance. Range 0.45-0.90.

**Finding 9A-005: Useful as Pack 1 fallback for coaching.** When Gemini API key unavailable, provides regex-based 9-dimension coaching.

#### Step 3: Engineering Decision

**Verdict: Keep in coach lane. Correct position. Serves as Pack 1 fallback for coaching.**

| Dimension | Assessment |
|---|---|
| Concept validity | Moderate — framework is sound, regex implementation is shallow |
| Is it unique? | No — every dimension covered better elsewhere |
| Architecture debt | Low — coach lane, ~5ms, no dependencies |
| Priority | None — correctly positioned |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-09 | L3-P1 | Moved to coach lane (weight=0 for VPS) | `kai-orchestrator.ts` | VPS-contributing | Coach lane only | tsc clean |

#### Open Issues

| Issue ID | Description | Priority |
|---|---|---|
| 9A-006 | Could be removed entirely when Pack 1 is stable | Low |
| 9A-007 | Pack 3 reads 9-attributes features in `detectEmotionalTrigger()` | Low |

---

### Component 8: 7 Idea Legos

| Field | Value |
|---|---|
| **ID** | `7-legos` |
| **Registry Type** | `pattern` |
| **Registry Reliability** | 0.90 |
| **Registry Avg Latency** | 1,000ms |
| **API Dependency** | None (100% regex-based) |
| **Target Category** | Coach lane (coaching output only) |
| **Analysis Date** | 2026-03-09 |
| **Analyst** | Layer 4 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

7-Legos decomposes content into 7 modular "building blocks": Topic (clarity+relevance), Angle (uniqueness+intrigue), Hook (spoken opening), Story Structure (tutorial/list/comparison/challenge/story), Visual Format (talking-head/demo/POV/text-overlay), Key Visuals (screenshots, data-viz, before-after), Audio (music, SFX, energy). Strong coaching model — each lego maps to a specific creator action.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding 7L-001: Fully deterministic regex-based scoring.** `extractSevenLegos()` at `kai-orchestrator.ts:2926-3244`. No LLM. ~10ms.

**Finding 7L-002: In coach lane — weight=0 for VPS.**

**Finding 7L-003: Hook lego strictly inferior to hook-scorer (#10).** Text-only regex vs 5-channel multi-modal with Whisper timestamps.

**Finding 7L-004: Visual/Audio legos infer from transcript, not actual media.** "look at this" → "demo", "music" → background music mentioned. No FFmpeg or audio-analyzer data used. Inferior to measured signals.

**Finding 7L-005: Story Structure detection is uniquely useful.** Tutorial, list, comparison, breakdown, challenge, story classification. No other component classifies narrative structure. "Your video uses a list structure — consider adding a comparison element" is actionable.

**Finding 7L-006: Hook weighted 1.5x in overall score.** `overallScore = sum / 7.5`. Matches research-validated hook importance.

**Finding 7L-007: Dynamic confidence well-designed.** 0.4 base + wordBonus + scoreBonus. Range 0.4-0.9.

#### Step 3: Engineering Decision

**Verdict: Keep in coach lane. Best coaching framework — modular, actionable. Story Structure detection is unique.**

| Dimension | Assessment |
|---|---|
| Concept validity | Strong — 7-lego framework is excellent for coaching |
| Is it unique? | Partially — Story Structure is unique; Hook/Visual/Audio overlap |
| Architecture debt | Low — coach lane, ~10ms, no dependencies |
| Priority | None — correctly positioned |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-09 | L3-P1 | Moved to coach lane (weight=0 for VPS) | `kai-orchestrator.ts` | VPS-contributing | Coach lane only | tsc clean |

#### Open Issues

| Issue ID | Description | Priority |
|---|---|---|
| 7L-008 | Visual/Audio legos could use real Layer 1 data instead of transcript inference | Medium |
| 7L-009 | Pack 3 reads 7-legos features in `detectCuriosityGap()` | Low |

---

### Component 9: 24 Video Styles Classifier

| Field | Value |
|---|---|
| **ID** | `24-styles` |
| **Registry Type** | `pattern` |
| **Registry Reliability** | 0.50 |
| **Registry Avg Latency** | 2,000ms |
| **API Dependency** | `OPENAI_API_KEY` (GPT-4o-mini) |
| **Target Category** | Should be hybrid |
| **Analysis Date** | 2026-03-08 |
| **Analyst** | Layer 2 Audit Session (Claude) |

#### Step 1: Concept — What Should This Component Measure?

The 24-Styles classifier should identify which "video format template" a piece of content follows (e.g., talking-head explainer, before-after, myth-bust, case study). On TikTok, format choice correlates with engagement — some formats are inherently more shareable than others. The component should detect the format AND rate execution quality against that format's best practices.

**New Architecture Role:**

| Quality Gate Driver | Style Classification Contribution |
|---|---|
| Content Structure (20%) | Format detection directly measures structural patterns |
| Production Floor (10%) | Execution quality against format norms |

| Distribution Potential Driver | Style Classification Contribution |
|---|---|
| Trend Alignment (20%) | Certain formats trend at different times |
| Share Probability (25%) | "Before-after" and "myth-bust" formats are inherently more shareable |

The concept is valid — video format IS a meaningful signal. The question is whether it needs to be an LLM opinion or can be determined algorithmically.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding R9-1: The God's Eye audit was outdated — the component is NOT hardcoded anymore.**

The audit from March 7 stated "Was hardcoded to return 70, now returns baseline 50." That was the OLD version. The current implementation (orchestrator lines 4624-4744) uses GPT-4o-mini for real classification. The hardcoded version was removed (line 2609 has a comment: `execute24Styles REMOVED - was returning hardcoded value 70`). But the re-enabled version IS registered and DOES run.

**Finding R9-2: Current implementation is a GPT-4o-mini LLM call — fully LLM-dependent.**

The flow:
1. Requires transcript >= 50 chars (returns `success: false` otherwise)
2. Sends transcript (first 3000 chars) to GPT-4o-mini
3. Asks for: style classification, confidence, execution_score (0-100), style_indicators, reasoning
4. Uses `response_format: { type: 'json_object' }` for structured output
5. Maps the execution score against the style's `viralWeight` for final prediction

**Finding R9-3: The scoring formula conflates execution quality with format popularity.**

```
finalScore = executionScore * viralWeight + (viralWeight * 20)
```

For a "transformation-timelapse" (viralWeight 0.95) with execution_score 80:
- `80 * 0.95 + 0.95 * 20 = 76 + 19 = 95`

For a "decision-tree" (viralWeight 0.70) with the same execution_score 80:
- `80 * 0.70 + 0.70 * 20 = 56 + 14 = 70`

The same execution quality gets a 25-point spread based solely on which format it happens to be. The viralWeight constants (0.70-0.95) have no empirical basis — they're the developer's guesses about which formats go viral.

**Finding R9-4: 24 styles defined inline with fixed viralWeight constants.**

The 24 styles and their weights are hardcoded in the orchestrator (lines 4640-4665). They are NOT in the system registry (D11 violation). The styles were designed for educational/business content niches and may not represent the actual format landscape of TikTok in 2026.

| Style | viralWeight | Commentary |
|---|---|---|
| `transformation-timelapse` | 0.95 | Highest weight — is this empirically justified? |
| `myth-bust`, `case-study`, `ugc-testimonial` | 0.90 | All tied — no differentiation |
| `talking-head-explainer` | 0.70 | Lowest tier — but this IS the dominant TikTok format |

The weights don't account for niche differences. A talking-head format in the "psychology" niche performs differently than in "cooking."

**Finding R9-5: Requires `OPENAI_API_KEY` with no fallback.**

If `OPENAI_API_KEY` is missing, the `openai.chat.completions.create()` call will throw. The component returns `success: false` with the error message. There is no heuristic fallback — unlike gpt4 (which has one) or unified-grading (which falls back to rule-based). This means the component is dead when the API key is unavailable.

**Finding R9-6: Adds correlated LLM noise to an already LLM-heavy pipeline.**

This is another GPT-4o-mini call on the same transcript. The LLM evaluators (gpt4, gemini, claude) already analyze the transcript. Pack 1 (unified-grading) also uses Gemini on the transcript. Adding a fourth LLM opinion on the same text increases correlated error, not independent signal (see Lesson: "LLM Scores Are Opinions, Not Measurements").

**Finding R9-7: Many format detections COULD be algorithmic.**

Several of the 24 styles have detectable structural markers:
- `talking-head-explainer`: First-person pronouns + "you" addressing, no scene changes
- `comparison`: A-vs-B structures, "versus", "compared to"
- `myth-bust`: "myth", "actually", "wrong", "truth is" patterns
- `sop-checklist`: Numbered steps, "step 1", "first", sequential markers
- `case-study`: Before/after language, dollar amounts, percentage changes
- `faq-rapid-fire`: Multiple question patterns
- `list-format`: Numbered items, "number one", "tip 1"

At least 8-10 of the 24 styles could be detected via regex + structural analysis without any LLM call. The LLM adds value for ambiguous cases but is overkill for obvious formats.

#### Step 3: Engineering Decision — Can It Become Algorithmic?

**Verdict: PARTIALLY. 8-10 styles are detectable algorithmically via transcript structure analysis. The remaining 14 need subjective judgment. But the component's concept IS useful — format detection should stay, just be rebuilt as hybrid.**

**Recommendation: Convert to hybrid (algorithmic base + optional LLM refinement). Move style definitions to system-registry.ts.**

Implementation path:
1. Move the 24 style definitions + viralWeights to `system-registry.ts` (D11 compliance)
2. Build a deterministic style classifier using regex patterns + structural analysis for the 8-10 detectable styles
3. Only call GPT-4o-mini when the deterministic classifier has low confidence (ambiguous format)
4. Remove viralWeight from the scoring — the weight should come from empirical data (training pipeline), not guesses
5. Execution quality scoring should remain LLM-based (it's inherently subjective)
6. Add niche-specific viralWeights once training data exists

**Expected difficulty:** Medium — the deterministic classifier is straightforward. Migrating to system-registry requires API changes.
**Expected impact:** Medium — removes one correlated LLM call from the pipeline for ~60% of inputs. Provides deterministic format detection for the ML pipeline.

#### Summary Verdict

| Dimension | Assessment |
|---|---|
| **Concept validity** | Strong — video format IS a meaningful signal for engagement prediction |
| **Current implementation** | Working but wrong approach — fully LLM-dependent GPT-4o-mini call, viralWeights are guesses, styles not in registry, adds correlated LLM noise |
| **Is it algorithmic?** | No — currently 100% LLM. Could be ~50% algorithmic with regex structural analysis. |
| **Architecture debt** | Medium — styles hardcoded in orchestrator (D11 violation), no fallback when API key missing, viralWeights have no empirical basis |
| **New architecture fit** | Content Structure (20%) and Trend Alignment (20%) — format detection is relevant |
| **Priority** | Medium — functional but adds noise. Convert to hybrid when fixing Layer 2. |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-09 | STY-002 | Moved 24 VIDEO_STYLES to `VIDEO_STYLES_REGISTRY` in system-registry.ts (D11 compliance) | `system-registry.ts`, `kai-orchestrator.ts` | Styles hardcoded inline in execute24Styles() | Imported from registry, single source of truth | tsc clean |
| 2026-03-09 | STY-003 | Set all viralWeight to 1.0 — removed fabricated weights (0.70-0.95) | `system-registry.ts` | viralWeights ranged 0.70-0.95 with no empirical basis | All 1.0; field preserved for future Spearman data | tsc clean |
| 2026-03-09 | STY-004 | Added deterministic Tier 1 fallback — component no longer dead without OPENAI_API_KEY | `kai-orchestrator.ts` | 100% GPT-4o-mini dependent, no fallback | Hybrid: deterministic keyword+structural classifier (Tier 1) + optional LLM refinement (Tier 2) | tsc clean |
| 2026-03-09 | STY-005 | Reduced correlated LLM noise — LLM only called for ambiguous Tier 1 results with narrowed candidate list (top 5, not all 24) | `kai-orchestrator.ts` | Always called GPT-4o-mini with all 24 styles | Tier 1 deterministic handles confident cases; Tier 2 LLM gets top 3-5 candidates only | tsc clean |
| 2026-03-09 | STY-006 | Simplified scoring formula — removed arbitrary `executionScore * viralWeight + (viralWeight * 20)` | `kai-orchestrator.ts` | `executionScore * viralWeight + (viralWeight * 20)` — 25-point spread from fabricated weights | `executionScore` directly — style classification is the feature, not the weight | tsc clean |
| 2026-03-09 | STY-007 | Moved to Phase 2 (DEPENDENT_COMPONENTS) — now reads audio-analyzer musicRatio/speechRatio from componentResults | `kai-orchestrator.ts` | Phase 1 (no access to audio features) | Phase 2 with access to audio-analyzer, ffmpegData, speakingRateData | tsc clean |
| 2026-03-09 | STY-008 | Registry updated: hasFallback=true, apiDependency noted, latency reduced to 500ms, reliability raised to 0.65 | `system-registry.ts` | reliability 0.50, latency 2000ms, no fallback noted | reliability 0.65, latency 500ms, hasFallback: true | tsc clean |

#### Open Issues

| Issue ID | Description | Blocked By | Priority |
|---|---|---|---|
| ~~STY-001~~ | ~~Was hardcoded 70~~ — **OBSOLETE**: Component re-enabled with GPT-4o-mini | — | — |
| ~~STY-002~~ | ~~24 style definitions hardcoded in orchestrator~~ — **FIXED 2026-03-09**: Moved to `VIDEO_STYLES_REGISTRY` in system-registry.ts | — | — |
| ~~STY-003~~ | ~~viralWeight constants have no empirical basis~~ — **FIXED 2026-03-09**: All set to 1.0 | — | — |
| ~~STY-004~~ | ~~No fallback when OPENAI_API_KEY missing~~ — **FIXED 2026-03-09**: Deterministic Tier 1 fallback | — | — |
| ~~STY-005~~ | ~~Adds correlated LLM noise~~ — **FIXED 2026-03-09**: LLM only for ambiguous cases with narrowed candidates | — | — |
| STY-006 | 8-10 styles detectable algorithmically via regex — unnecessary LLM call | STY-002 | Medium |
| STY-007 | Scoring formula conflates execution quality with format popularity bias | STY-003 | Low |

---

### Component 10: Hook Strength Scorer

| Field | Value |
|---|---|
| **ID** | `hook-scorer` |
| **Registry Type** | `pattern` |
| **Registry Reliability** | 0.50 |
| **Registry Avg Latency** | 50ms |
| **API Dependency** | None for pipeline; `OPENAI_API_KEY` for unused LLM upgrade |
| **Target Category** | Must be algorithmic (most important Layer 2 component) |
| **Analysis Date** | 2026-03-08 |
| **Analyst** | Layer 2 Audit Session (Claude) |

#### Step 1: Concept — What Should This Component Measure?

The Hook Scorer is **the most important component in the new architecture**. Hook Retention is 45% of the Quality Gate — the largest single driver of VPS. The first 3 seconds of a TikTok video determine whether a viewer stops scrolling or moves on. This component must measure:

1. **What type of hook is used?** (question, statistic, story, claim, contrarian, etc.)
2. **How strong is the hook?** (specificity, emotional trigger strength, curiosity gap size)
3. **How quickly does it engage?** (time-to-first-hook within the first 3 seconds)

The 10-type hook taxonomy from the onboarding overhaul (question, list_preview, contrarian, myth_bust, statistic, authority, result_preview, personal_story, problem_identification, urgency) should be the classification standard.

**New Architecture Role:**

| Quality Gate Driver | Hook Scorer Contribution |
|---|---|
| **Hook Retention (45%)** | THE primary contributor — hook type, strength, and engagement speed |

| Distribution Potential Driver | Hook Scorer Contribution |
|---|---|
| Share Probability (25%) | Strong hooks increase watch-through rate which drives shares |

This component carries more weight than any other single component in the prediction system. Getting it right is the highest-leverage improvement possible.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding R10-1: The pipeline uses the SYNCHRONOUS regex-only version — not the LLM upgrade.**

The orchestrator (line 3920) calls:
```
const result = HookScorer.analyze(input.transcript);
```

This is the synchronous `analyze()` method — pure regex pattern matching. The async LLM version `analyzeAsync()` exists (line 450) and calls `scoreHookQuality()` which uses GPT-4o-mini for 5-dimension quality assessment. But it is NEVER called by the prediction pipeline. The LLM upgrade exists in the code but is not wired in.

**Finding R10-2: Only 4 hook types detected — the registry defines 10.**

The component detects: question, statistic, story, claim.

The `system-registry.ts` hook taxonomy defines 10 types across 5 psychological clusters:
- Curiosity Trigger: question, list_preview
- Cognitive Challenge: contrarian, myth_bust
- Credibility Signal: statistic, authority, result_preview
- Emotional Connection: personal_story, problem_identification
- Urgency/Scarcity: urgency

The component is missing 6 of 10 hook types: list_preview, contrarian, myth_bust, authority, result_preview, problem_identification, urgency. And "claim" in the component partially overlaps with contrarian + myth_bust but doesn't map cleanly.

**Finding R10-3: "First 3 seconds" extraction is a rough word-count approximation.**

`extractFirst3Seconds()` (line 87-90):
```
const words = transcript.trim().split(/\s+/);
const first3SecWords = words.slice(0, 8); // Assumes 2.5 words/second
```

This is a static estimate: always takes the first 8 words regardless of speaking rate. With Whisper `verbose_json` now available (WSP-003 fix), the pipeline has actual timestamp data per segment. The real first-3-second text could be extracted from Whisper segments with `start < 3.0`. For the transcript-only workflow, the word estimate is unavoidable — but when `whisperSegments` are available, real timestamps should be used.

**Finding R10-4: Score variance is 1.7 points — too narrow for ML learning.**

The code comment explicitly states this: "Legacy regex scoring: 1.7pt variance (model can't learn)." The regex scores cluster tightly because simple pattern matches either fire or don't. For any typical transcript with a question at the start, `questionScore` is almost always 5-7 (out of 8). XGBoost can't learn from a feature that barely varies.

Score distribution analysis:
- Question hook: 0, 2, 3, 4, 5, 6, 7, 8 (8 possible values)
- But in practice, most hooks score 5-7 (the patterns overlap)
- Normalized to 0-10 scale → most scores land at 6.25-8.75
- VPS mapping: `25 + (hookScore * 6) + typeBoost` → most scores land at 61-78

**Finding R10-5: The VPS mapping (`toPrediction`) still uses DPS terminology in comments.**

Despite the `toDPS()` → `toPrediction()` rename (Batch B), the internal comments still say "Weak hook = low predicted DPS" and "Hook score to DPS mapping." The function produces VPS-range values (25-85), not DPS measurements. Comments need cleanup.

**Finding R10-6: No audio/visual hook signals — transcript-only analysis.**

For the 45% of Quality Gate weight that hooks carry, the component only analyzes TEXT. But hook strength is also determined by:
- **Audio hook:** Energy level in first 3 seconds (now available from prosodic analyzer: `hookLoudnessRatio`, `hookPitchMean`)
- **Visual hook:** Scene changes in first 3 seconds (now available from canonical FFmpeg: `hook_scene_changes`)
- **Pace:** Speaking rate dynamics in hook period (now available: `hookWpmRatio` from speaking-rate-analyzer)

All these signals were built in Batch B but are NOT wired into the hook scorer.

**Finding R10-7: The LLM upgrade (Phase 4) provides 40pt variance — but is unused.**

`scoreHookQuality()` (line 363) calls GPT-4o-mini for 5 quality dimensions:
- `quality_score` (0-100)
- `scroll_stop_power` (0-100)
- `curiosity_creation` (0-100)
- `value_promise` (0-100)
- `specificity` (0-100)

These provide 40+ point variance (per the comment) — enough for the ML model to learn from. But the orchestrator calls `analyze()` not `analyzeAsync()`, so this never fires. The LLM version should NOT be the default (it adds another correlated LLM call), but the 5 dimensions are a good framework for the algorithmic scorer.

**Finding R10-8: No connection to the calibration system's hook taxonomy.**

The calibration system (`calibration-scorer.ts`) tracks which hook types users prefer and respond to. The prediction system should use this data — if a creator's calibration profile shows they favor "question" hooks and excel at them, the hook score should be adjusted accordingly. Currently zero integration.

#### Step 3: Engineering Decision — Can It Become Algorithmic?

**Verdict: Already algorithmic (regex), but far too simplistic for the weight it carries. This is the highest-leverage component to improve because Hook Retention = 45% of Quality Gate. The improvement path is clear: expand the regex taxonomy to 10 types, add audio/visual hook signals from Layer 1, and use Whisper timestamps for real first-3-second extraction.**

**Recommendation: Major upgrade — expand to 10 hook types, add multi-modal hook signals, use Whisper timestamps.**

Implementation path:
1. **Expand taxonomy to 10 types** — add regex patterns for the 6 missing hook types (list_preview, contrarian, myth_bust, authority, result_preview, problem_identification, urgency). Map "claim" to its closest taxonomy equivalents.
2. **Use Whisper timestamps** — when `whisperSegments` are available on the input, extract the actual first-3-second text using segment timestamps instead of the 8-word approximation.
3. **Add multi-modal hook scoring:**
   - Audio hook from prosodic analyzer: `hookLoudnessRatio`, `hookPitchMean`, `hookSilenceRatio`
   - Visual hook from canonical FFmpeg: `hook_scene_changes`
   - Pace hook from speaking rate: `hookWpmRatio`
4. **Increase score variance** — the current 0-10 scale with 1.7pt variance is useless for ML. Either expand the scale or add sub-dimensions (specificity, emotional intensity, information density) that vary independently.
5. **Connect to hook taxonomy in system-registry.ts** — use `HOOK_TYPES` and `HOOK_CLUSTERS` for classification instead of the current 4 hardcoded types.
6. **Remove the unused LLM method** or keep it as an optional enrichment (NOT for default pipeline use).

**Expected difficulty:** Medium — regex expansion is straightforward, multi-modal signal integration requires threading input data.
**Expected impact:** HIGHEST of any Layer 2 fix — 45% of Quality Gate weight depends on this component.

#### Summary Verdict

| Dimension | Assessment |
|---|---|
| **Concept validity** | Critical — hook strength is the single most important predictor of short-form video performance |
| **Current implementation** | Far too simplistic — 4 of 10 hook types, word-count approximation for timing, no audio/visual signals, 1.7pt variance. LLM upgrade exists but is unused. |
| **Is it algorithmic?** | Yes — regex is deterministic. But the regexes are too shallow. |
| **Architecture debt** | High — most important component has the least sophisticated implementation. Unused LLM code. No connection to Layer 1 audio/visual signals or calibration system. |
| **New architecture fit** | Hook Retention (45%) — THE most critical component for VPS accuracy |
| **Priority** | CRITICAL — highest-leverage improvement in the entire component system |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-08 | R10-FIX-1 | Full rewrite: 5-channel multi-modal hook analyzer. Text (10-type taxonomy, 0-100 scoring), Audio (hookLoudness/pitch/silence), Visual (hook_scene_changes), Pace (hookWpm/acceleration), Tone (musicRatio/energyLevel/pitchContourSlope). Weighted fusion (text 40%, audio 20%, visual 15%, pace 15%, tone 10%). Moved to Phase 2. Removed unused LLM methods. Fixed DPS→VPS terminology. Whisper segments for real first-3s text. | `hook-scorer.ts`, `kai-orchestrator.ts`, `system-registry.ts`, `runPredictionPipeline.ts` | Text-only regex, 4 types, 1.7pt variance, 8-word approx, LLM never called | 5-channel multi-modal, 10 types, 0-100 scoring, Whisper timestamps, deterministic | Pending |

#### Open Issues

| Issue ID | Description | Blocked By | Priority |
|---|---|---|---|
| HK-001 | Only 4 hook types detected — registry defines 10 | Nothing | Critical |
| HK-002 | "First 3 seconds" is word-count approximation — Whisper timestamps now available | Nothing | High |
| HK-003 | 1.7pt score variance — too narrow for ML to learn from | HK-001 | Critical |
| HK-004 | No audio/visual hook signals — prosodic analyzer and FFmpeg data available but not wired | Nothing | High |
| HK-005 | LLM upgrade (`analyzeAsync`) exists but is never called by the pipeline | Design decision | Low |
| HK-006 | Hook taxonomy not connected to `system-registry.ts` HOOK_TYPES/HOOK_CLUSTERS | HK-001 | Medium |
| HK-007 | No integration with calibration profile (creator's hook preferences/strengths) | D6 deferral | Future |
| HK-008 | `toPrediction()` comments still reference "DPS" terminology | Nothing | Low |

---

### Component 11: Pattern Extraction Engine

| Field | Value |
|---|---|
| **ID** | `pattern-extraction` |
| **Registry Type** | `pattern` |
| **Registry Reliability** | 0.90 |
| **Registry Avg Latency** | 2,000ms |
| **API Dependency** | None (regex-based — NOT the LLM version) |
| **Target Category** | Should be hybrid |
| **Analysis Date** | 2026-03-08 |
| **Analyst** | Layer 2 Audit Session (Claude) |

#### Step 1: Concept — What Should This Component Measure?

The Pattern Extraction Engine should identify structural patterns in content that correlate with virality — hook-opening techniques, story arcs, curiosity gaps, social proof claims, urgency triggers, CTA placement. These are content strategies that experienced creators deploy intentionally. Detecting and scoring them provides actionable feedback AND a predictive signal.

**New Architecture Role:**

| Quality Gate Driver | Pattern Extraction Contribution |
|---|---|
| Hook Retention (45%) | Hook-opening pattern detection, curiosity gap identification |
| Content Structure (20%) | Story arc presence, list format, contrast patterns |

| Distribution Potential Driver | Pattern Extraction Contribution |
|---|---|
| Share Probability (25%) | Social proof, emotional triggers, CTA patterns |
| Niche Saturation (25%) | Pattern frequency vs. niche benchmarks (if connected to pattern library) |

#### Step 2: Reality — What Does The Code Actually Do?

**Finding R11-1: TWO completely separate "pattern extraction" systems exist — the orchestrator uses the simple one.**

| System | Location | Approach | Used By | Status |
|---|---|---|---|---|
| Orchestrator inline | `kai-orchestrator.ts` lines 3743-3822 | 10 regex patterns, base score 45, additive scoring | Canonical prediction pipeline | **ACTIVE** |
| Pattern extraction service | `src/lib/services/pattern-extraction/` (4 files) | LLM-based extraction from scraped videos, deduplication, DB storage, batch processing | `/api/patterns/extract`, nightly cron job | **ACTIVE but separate purpose** |

The orchestrator's version is a simple regex scorer. The service version is a sophisticated LLM-powered system for extracting and cataloging viral patterns from historical high-DPS videos. They share a name but serve completely different purposes — one is a real-time prediction component, the other is a training data builder.

**Finding R11-2: The prediction component is 10 regex patterns with additive scoring.**

From orchestrator lines 3765-3776:

| Pattern | Regex | Points | Issue |
|---|---|---|---|
| `hook-opening` | `/^(stop\|wait\|listen\|watch\|look\|this\|here\|did you)/i` | 8 | Only matches first word — misses "you won't believe" |
| `story-arc` | `/(first\|then\|finally\|but then\|until\|when)/i` | 6 | "when" appears in 90%+ of transcripts — near-universal match |
| `curiosity-gap` | `/(secret\|hidden\|nobody\|most people\|what if\|turns out)/i` | 7 | OK — these are genuine curiosity triggers |
| `social-proof` | `/(everyone\|millions\|thousands\|trending\|viral\|famous)/i` | 5 | "everyone" is extremely common in casual speech |
| `urgency` | `/(now\|today\|immediately\|hurry\|limited\|before)/i` | 6 | "now" and "today" appear in most transcripts |
| `value-promise` | `/(learn\|discover\|get\|become\|transform\|how to)/i` | 5 | "get" appears in virtually every transcript |
| `emotional-trigger` | `/(love\|hate\|amazing\|shocking\|incredible\|unbelievable)/i` | 7 | Reasonable for short-form content |
| `cta-pattern` | `/(follow\|like\|share\|comment\|subscribe\|save this)/i` | 4 | "like" as in "I like" will false-positive constantly |
| `contrast` | `/(but\|however\|instead\|not\|never\|always)/i` | 3 | "but" and "not" are top-50 English words — near-universal |
| `list-format` | `/(first\|second\|third\|number one\|tip \d\|step \d)/i` | 5 | "first" overlaps with story-arc — double counting |

**The base score is 45.** A typical transcript with normal English text will match:
- `story-arc` (+6) — "when" or "then" appears in almost everything
- `urgency` (+6) — "now" or "today" appears in most content
- `value-promise` (+5) — "get" appears in virtually everything
- `contrast` (+3) — "but" or "not" are top-50 English words
- `cta-pattern` (+4) — "like" as in "I like this" is common

That's `45 + 6 + 6 + 5 + 3 + 4 = 69` for a completely generic transcript. A transcript about making toast would likely score 65-75. The patterns are too broad — they match common English rather than viral patterns specifically.

**Finding R11-3: The component has significant overlap with hook-scorer (Component 10).**

| Pattern (Component 11) | Hook Type (Component 10) | Overlap |
|---|---|---|
| `hook-opening` | Question, Claim hooks | Both check first words |
| `curiosity-gap` | Claim hooks ("secret", "truth is") | Both detect curiosity triggers |
| `story-arc` | Story hooks ("first", "then") | Both detect narrative markers |
| `urgency` | (not in hook scorer) | Unique to pattern-extraction |
| `social-proof` | (not in hook scorer) | Unique to pattern-extraction |

Both components analyze the transcript text for similar patterns. The hook scorer focuses on the first 8 words; pattern extraction scans the full transcript. The overlap means the same linguistic features get counted twice in the VPS calculation.

**Finding R11-4: Confidence is dynamic but based on weak signals.**

Confidence formula (lines 3790-3795):
```
base: 0.3
+ min(0.4, patternCount * 0.05) — per pattern found
+ min(0.2, transcriptLength / 1000) — per transcript length
clamped to [0, 0.9]
```

A 500-char transcript with 5 patterns (very common): `0.3 + 0.25 + 0.1 = 0.65`. Since most transcripts match 4-6 patterns, confidence clusters at 0.55-0.70. This is reasonable but doesn't reflect the quality of the pattern matches — a "but" match and a "secret hidden technique" match contribute equally.

**Finding R11-5: The pattern library (Bucket 4) is not connected.**

The Bucket 4 pattern library (`src/lib/patterns/pattern-extractor.ts`, `pattern-metrics.ts`) was built to extract viral patterns from successful videos and track their performance metrics. This data could validate which patterns ACTUALLY correlate with virality. But the prediction component doesn't query the pattern library — it uses the fixed 10-regex list instead of empirically validated patterns.

**Finding R11-6: No pattern position or density analysis.**

The regexes do simple boolean detection — "does this pattern exist anywhere in the transcript?" But pattern placement matters enormously:
- A curiosity gap at the START is a hook; at the END is a cliffhanger
- A CTA at the END is effective; at the START is annoying
- Pattern DENSITY (multiple urgency words clustered together) signals stronger intent

The component has no awareness of WHERE patterns appear or how concentrated they are.

#### Step 3: Engineering Decision — Can It Become Algorithmic?

**Verdict: Already algorithmic (regex), but the regexes are too broad and match common English rather than viral-specific patterns. High false-positive rate inflates scores for generic content. Needs regex refinement + pattern position awareness + connection to empirical pattern library.**

**Recommendation: Refine regexes, add position-aware scoring, connect to pattern library benchmarks.**

Implementation path:
1. **Tighten regex patterns** — "when" → "when I first", "but" → "but here's the thing", "get" → "get [number]", "like" → "like and follow" (not "I like"). Multi-word patterns reduce false positives dramatically.
2. **Add pattern position scoring** — score higher when hook patterns appear in first 8 words, CTA patterns in last 20 words, story-arc markers are evenly distributed. Use Whisper segment timestamps when available.
3. **Connect to pattern library** — query `pattern_archetypes` for the creator's niche and compare detected patterns against empirically successful patterns. A "curiosity-gap" that matches a pattern archetype with high DPS should score higher than one that doesn't.
4. **Deduplicate with hook-scorer** — either merge the first-sentence patterns from pattern-extraction INTO hook-scorer, or have pattern-extraction explicitly skip the first 8 words (leave that territory to hook-scorer). Currently both components count the same features.
5. **Add structural patterns** — "open loop" detection (question introduced but not answered for N sentences), "pattern interrupt" detection (change in tone/topic), "callback" detection (reference to earlier point).
6. **Use the 106-feature extractors** — Several of the 106-feature extractors (Group E: Viral Pattern Words, Group I: Content Structure Signals) already implement more sophisticated versions of what this component does with simple regexes. Wire them in.

**Expected difficulty:** Medium — regex refinement is straightforward but requires careful testing. Pattern library connection requires a DB query.
**Expected impact:** Medium — fixes false-positive inflation that makes generic content score 65-75. Combined with hook-scorer improvement, these two components drive 65% of Quality Gate.

#### Summary Verdict

| Dimension | Assessment |
|---|---|
| **Concept validity** | Strong — viral pattern detection is a measurable, meaningful signal |
| **Current implementation** | Too simplistic — 10 broad regexes that match common English, no position awareness, disconnected from empirical pattern library, overlaps with hook-scorer |
| **Is it algorithmic?** | Yes — regex is deterministic. But the regexes lack specificity. |
| **Architecture debt** | Medium — two separate "pattern extraction" systems (prediction inline vs. pattern library service), overlap with hook-scorer, disconnected from empirical data |
| **New architecture fit** | Hook Retention (45%) + Content Structure (20%) = 65% of Quality Gate (shared with hook-scorer) |
| **Priority** | High — second-highest leverage after hook-scorer. Fix alongside Component 10. |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-08 | R11-FIX-1 | Tightened all regexes (contextual phrases instead of single common words), removed hook-opening duplicate, added positional weighting (hook 1.0x / body 0.7x / CTA 0.5x), lowered base score 45→30, added co-occurrence bonuses (narrative-tension +5, emotional-urgency +4, authority-promise +3), capped at 85. | `kai-orchestrator.ts` | 10 broad regexes, base 45, generic transcripts score 65-75, hook-opening overlap | 9 tight regexes, base 30, positional weighting, co-occurrence bonuses, cap 85 | Pending |

#### Open Issues

| Issue ID | Description | Blocked By | Priority |
|---|---|---|---|
| PE-001 | 10 regex patterns are too broad — "when", "but", "get", "like" match common English | Nothing | High |
| PE-002 | Base score 45 + common word matches → generic transcripts score 65-75 | PE-001 | High |
| PE-003 | Significant overlap with hook-scorer — same patterns counted twice | HK-001 | Medium |
| PE-004 | No pattern position analysis — hook-at-start vs CTA-at-end not distinguished | Nothing | Medium |
| PE-005 | Pattern library (Bucket 4) not connected — empirical validation unused | Nothing | Medium |
| PE-006 | "first" in both `story-arc` and `list-format` — internal double-counting | PE-001 | Low |
| PE-007 | 106-feature extractors (Group E) already implement better viral word detection | FE-002 | Low |

---

### Component 12: Audio Analysis Engine

| Field | Value |
|---|---|
| **ID** | `audio-analyzer` |
| **Registry Type** | `quantitative` |
| **Registry Reliability** | 0.50 |
| **Registry Avg Latency** | 3,000ms |
| **API Dependency** | None (FFmpeg-based) |
| **Target Category** | Must be algorithmic |
| **Analysis Date** | 2026-03-08 |
| **Analyst** | Audit Session (Claude) |

#### Step 1: Concept — What Should This Component Measure?

The Audio Analyzer should extract **deterministic, repeatable audio measurements** from the video's audio track. Think of it as a sound engineer's diagnostic tool — it reports measurable facts about what the audio sounds like (loudness, dynamic range, silence gaps, speaking rate), not opinions about quality. Same audio in = same numbers out.

**New Architecture Role:**

| Quality Gate Driver | Audio Contribution |
|---|---|
| Hook Retention (45%) | Energy level in first 3 seconds, whether audio hooks immediately |
| Delivery Baseline (25%) | Speaking pace (WPM proxy), silence ratio, volume consistency |
| Production Floor (10%) | Audio presence, volume levels (not clipping, not too quiet) |

| Distribution Potential Driver | Audio Contribution |
|---|---|
| Share Probability (25%) | Audio dynamic range, music presence — engaging audio is more shareable |

The audio analyzer shares domain with the onboarding `delivery-analyzer.ts`, but they operate at different layers: the delivery analyzer builds a persistent baseline profile from a creator's channel; this component measures a single video's audio for prediction.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding R12-1: The component actually implements real FFmpeg analysis — one of the few that does.**

`AudioAnalyzer.analyze()` in `src/lib/components/audio-analyzer.ts` (337 lines):
1. Extracts audio from video via `extractAudio()` (from `ffmpeg-service.ts`)
2. Runs `volumedetect` + `silencedetect=n=-40dB:d=0.5` filters
3. Parses FFmpeg stderr for `mean_volume`, `max_volume`, `silence_duration`, `Duration`
4. Derives 4 metrics: silenceRatio, volumeVariance, energyLevel, speakingPace

This is structurally identical to what `delivery-analyzer.ts` does in the onboarding system — both parse FFmpeg stderr for volume and silence metrics. The approach is proven and correct.

**Finding R12-2: Dead in primary workflow — requires `videoPath`, which is absent on `/admin/upload-test`.**

The orchestrator's `executeAudioAnalyzer()` (line 4336) has an immediate guard:
```
if (!input.videoPath) {
  return { componentId: 'audio-analyzer', success: false, error: 'Video path required' };
}
```
On `/admin/upload-test`, the user provides only a transcript and niche — no video file exists on disk. `videoPath` is `undefined`. Result: **component fails immediately with `success: false`, returning zero data.** This is a cross-component issue shared by all three visual/audio components (#12, #13, #14). They only fire on the TikTok URL download path.

**Finding R12-3: Pack V receives broken data due to type mismatches.**

The audio analyzer emits `energyLevel` as a **string** (`'high'` | `'medium'` | `'low'` | `'unknown'`). But the Pack V integration mapping (orchestrator line 5340) does:
```
has_music: rawAudioFeatures.energyLevel !== undefined ? rawAudioFeatures.energyLevel > 5 : undefined
```
`'high' > 5` in JavaScript evaluates to `false` (string comparison against number). `has_music` is **always false** even when audio energy is high.

Similarly, `volumeVariance` is 0.0-1.0, but the sync mapping (line 5342) does:
```
audio_visual_sync: 1 - (rawAudioFeatures.volumeVariance / 100)
```
Dividing a value in [0, 1] by 100 produces [0, 0.01], so `audio_visual_sync` is always ~0.99-1.0. Meaningless constant.

**Summary of type/scale mismatches:**

| Feature | Component Emits | Pack V Mapping | Result |
|---|---|---|---|
| `energyLevel` | `'high'` (string) | `> 5` (number comparison) | Always `false` |
| `volumeVariance` | `0.67` (0-1 scale) | `/ 100` (expects 0-100) | Always ~0.99 |
| `silenceRatio` | `0.2` (0-1 scale) | `< 0.3` (correct) | ✅ Correct |
| `audioScore` | `7.5` (0-10) | Pass-through | ✅ Correct |
| `speakingPace` | `'fast'` (string) | Pass-through | ✅ Correct |

**Finding R12-4: Speaking pace is estimated from silence ratio, ignoring the available transcript.**

`estimateSpeakingPace()` (line 217) uses only `silenceRatio`:
- `<15%` silence → fast, `15-30%` → moderate, `30-50%` → slow

The pipeline has the transcript AND audio duration available. Actual WPM (`wordCount / (duration - silenceDuration) * 60`) would be a far more meaningful measurement. The onboarding system's delivery baseline already computes `speakingRateWpm` — this component could do the same.

**Finding R12-5: Significant overlap with `delivery-analyzer.ts` — duplicate FFmpeg audio logic.**

| Feature | audio-analyzer.ts | delivery-analyzer.ts |
|---|---|---|
| Volume detection | `volumedetect` → mean/max volume | `volumedetect` → mean/max volume |
| Silence detection | `silencedetect=n=-40dB:d=0.5` | `silencedetect=noise=-40dB:d=0.3` |
| Energy level | Classified from mean volume | Classified similarly |
| Speaking rate | Inferred from silence ratio | Actual WPM from transcript |
| Scope | Single video prediction | Creator baseline (multi-video) |

The FFmpeg commands are nearly identical. The threshold difference is 0.5s vs 0.3s for silence duration minimum.

**Finding R12-6: DPS mapping is reasonable but arbitrary.**

`toDPS()` maps audioScore (0-10) to DPS (35-75):
- Base: `35 + (audioScore * 4)`
- +5 boost for high energy + fast pace
- +3 boost for low silence + high variance
- Clamped to [35, 75]

The range is narrow enough to avoid dominating the ensemble. Boost conditions are sensible. But the specific numbers have no empirical basis.

**Finding R12-7: Fifth FFmpeg invocation pattern.**

Uses `extractAudio()` from `ffmpeg-service.ts` which uses `fluent-ffmpeg`. This makes it the fifth distinct FFmpeg invocation path in the codebase (after `ffmpeg-training-features.ts`, `ffmpeg-full-analyzer.ts`, `ffmpeg-service.ts` direct, and `delivery-analyzer.ts`).

#### Step 3: Engineering Decision — Can It Become Algorithmic?

**Verdict: Already algorithmic — FFmpeg audio filters are deterministic. The component's core analysis is real and correct. Fix the type bugs, improve speaking pace estimation, and consolidate with the canonical FFmpeg analyzer.**

**Implementation path:**
1. Fix type mismatch in Pack V mapping: `energyLevel > 5` → `energyLevel === 'high'`
2. Fix scale mismatch: `volumeVariance / 100` → just `volumeVariance` (already 0-1)
3. Replace silence-based speaking pace with WPM calculation when transcript is available
4. Add hook-period audio analysis (first 3 seconds energy) for the 45% Hook Retention driver
5. Consolidate shared FFmpeg audio logic with delivery-analyzer to avoid duplicate code
6. Eventually fold into canonical FFmpeg analyzer (Component 1, FFM-001)

**Expected difficulty:** Low — type bug fixes are one-line changes. WPM calculation is straightforward.
**Expected impact:** Medium — fixes broken Pack V data pipeline when video path is available. No impact on primary workflow until videoPath gate is addressed (cross-component issue).

#### Summary Verdict

| Dimension | Assessment |
|---|---|
| **Concept validity** | Strong — audio energy, silence, dynamic range are all measurable, meaningful signals |
| **Current implementation** | Mixed — real FFmpeg analysis (good), but type mismatches corrupt downstream data, speaking pace uses a weak proxy, dead in primary workflow |
| **Is it algorithmic?** | Yes — FFmpeg audio filters are deterministic. Same audio in = same numbers out. |
| **Architecture debt** | Medium — overlap with delivery-analyzer, type mismatches in Pack V mapping, videoPath gate blocks primary workflow |
| **New architecture fit** | Direct contributor to Delivery Baseline (25%) and Production Floor (10%) in Quality Gate |
| **Priority** | Medium — fix type bugs immediately; videoPath gate is cross-component issue (CCI-001) |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-08 | AUD-001 | Fixed Pack V `has_music` mapping: `energyLevel > 5` (string vs number, always false) → `energyLevel === 'high' \|\| energyLevel === 'medium'` | `kai-orchestrator.ts` | String compared to number — always false, Pack V never saw music | Correct string comparison against enum values | tsc clean, grep confirms zero `energyLevel > 5` matches |
| 2026-03-08 | AUD-002 | Fixed Pack V `audio_visual_sync` mapping: `volumeVariance / 100` (0-1 divided by 100, always ~0.99) → `1 - volumeVariance` | `kai-orchestrator.ts` | Value divided by 100 when already 0-1, sync always showed ~0.99 | Correct inversion of 0-1 volumeVariance | tsc clean, grep confirms zero `volumeVariance / 100` matches |

#### Open Issues

| Issue ID | Description | Blocked By | Priority |
|---|---|---|---|
| ~~AUD-001~~ | ~~Type mismatch fixed~~ | — | ~~Critical~~ **FIXED** |
| ~~AUD-002~~ | ~~Scale mismatch fixed~~ | — | ~~Critical~~ **FIXED** |
| AUD-003 | Speaking pace estimated from silence ratio instead of actual WPM (transcript + duration available) | Nothing | Medium |
| AUD-004 | Component dead in primary workflow — requires `videoPath` | CCI-001 | High |
| AUD-005 | Duplicate FFmpeg audio logic with `delivery-analyzer.ts` | FFM-001 | Low |
| AUD-006 | No hook-period audio analysis (first 3 seconds) — Hook Retention is 45% of Quality Gate | Nothing | Medium |

**Batch B Progress (2026-03-08):**
- **Prompt 1 COMPLETE:** Created `src/lib/services/audio-prosodic-analyzer.ts` — standalone prosodic analysis engine with 3 measurement categories:
  - **Volume Dynamics:** ebur128 momentary/short-term loudness time series → 8 computed metrics (mean, range, variance, rate-of-change, hook ratio, peak count, dynamic range, raw time series)
  - **Pitch Analysis:** pitchfinder YIN algorithm for F0 detection → 9 computed metrics (mean, range, variance, stddev, contour slope, hook ratio, peak count, voiced ratio, raw time series). Fallback to FFmpeg `aspectralstats` spectral centroid if pitchfinder unavailable.
  - **Silence Patterns:** silencedetect with full temporal segment capture → 10 computed metrics (segments array, count, total duration, ratio, mean/max gap, variance, hook silence ratio, pattern classification, transition count)
- Addresses AUD-003 (pitch/prosodic data now available for real WPM in Prompt 2), AUD-006 (hook-period analysis for all 3 categories)
- NOT yet wired into audio-analyzer or orchestrator (Prompt 3)
- Dependency added: `pitchfinder` npm package (YIN pitch detection, has TypeScript types)
- **Prompt 2, Parts B1+B3 COMPLETE:** Created `src/lib/services/audio-classifier.ts` — music-vs-speech classification + audio fingerprinting:
  - **Music/Speech Classification:** FFmpeg `astats` filter → per-frame RMS energy + zero-crossing rate → 500ms window analysis → energy variance heuristic (speech=high variance, music=low variance). Outputs: musicRatio, speechRatio, hasBothMusicAndSpeech, audioType ('speech-only'|'music-only'|'speech-over-music'|'mixed'|'silent')
  - **Audio Fingerprinting:** `generateAudioFingerprint()` — FFmpeg `aspectralstats` spectral centroid on first 30s → quantize to 100Hz bins → SHA-256 hash → 32-char hex fingerprint. Videos with same background music produce matching fingerprints for training cluster correlation.
  - **Prompt 2, Part B2:** Migration `20260308_sound_metadata.sql` adds `sound_id`, `sound_name`, `sound_author`, `is_original_sound`, `audio_fingerprint` columns to `scraped_videos` table. Apify scraper already extracts music metadata (musicMeta.musicId, musicName, musicAuthor, isOriginal) — these fields now have indexed columns for training queries.
- NOT yet wired into audio-analyzer or orchestrator (Prompt 3)

---

### Component 13: Visual Scene Detection

| Field | Value |
|---|---|
| **ID** | `visual-scene-detector` |
| **Registry Type** | `quantitative` |
| **Registry Reliability** | 0.50 |
| **Registry Avg Latency** | 25,000ms |
| **API Dependency** | None (FFmpeg-based) |
| **Target Category** | Must be algorithmic |
| **Analysis Date** | 2026-03-08 |
| **Analyst** | Audit Session (Claude) |

#### Step 1: Concept — What Should This Component Measure?

The Visual Scene Detector should measure **editing pace and visual dynamics** — how many scene changes (cuts), how fast the visual content changes, and whether the first 3 seconds are visually active enough to hook the viewer. This is pure video file analysis — same video in = same cut count out.

**New Architecture Role:**

| Quality Gate Driver | Scene Detection Contribution |
|---|---|
| Hook Retention (45%) | Cuts in first 3 seconds, visual dynamism in opening frames — the most important signal this component can provide |
| Content Structure (20%) | Overall editing pace (cuts/second), scene distribution across timeline |
| Production Floor (10%) | Visual variety — a single static shot vs. multi-camera edits |

| Distribution Potential Driver | Scene Detection Contribution |
|---|---|
| Share Probability (25%) | Rapid editing correlates with engagement and sharing on short-form platforms |

#### Step 2: Reality — What Does The Code Actually Do?

**Finding R13-1: The FFmpeg scene detection filter is REAL and correctly implemented.**

`detectSceneChanges()` in `visual-scene-detector.ts` (line 130) uses `select='gt(scene,0.3)',showinfo` and parses `pts_time` from FFmpeg stderr. This is the standard, proven approach for scene change detection. The 0.3 threshold is a reasonable default. This part works correctly.

**Finding R13-2: Hook period cut detection is FAKE — returns a constant estimate.**

`detectCutsInFrames()` (line 209):
```
return Math.floor(framePaths.length / 5); // Assume 1 cut per ~0.5 seconds
```
For 30 extracted frames (10fps × 3 seconds), this always returns `6`. No actual frame comparison is done. The comment acknowledges it: "In production, use perceptual hashing or histogram comparison." The `hookPeriodCuts` metric is a constant, not a measurement.

**Finding R13-3: Text overlay detection is RANDOM — a literal coin flip.**

`detectTextInFrames()` (line 224):
```
return framePaths.length > 0 && Math.random() > 0.4;
```
Returns `true` 60% of the time, `false` 40% of the time, **regardless of actual video content**. This makes the component non-deterministic — the same video analyzed twice produces different results. The +2 point visual score bonus for text overlays is therefore random noise injected into the VPS.

**Finding R13-4: Average brightness is a hardcoded placeholder.**

Line 184: `const avgBrightness = 0.5; // Placeholder`

Always 0.5. The FFmpeg `signalstats` filter (used correctly in the thumbnail analyzer) could provide this easily with zero extra FFmpeg calls.

**Finding R13-5: Feature name mismatch with Pack V — total disconnect.**

Pack V mapping (orchestrator lines 5322-5330) expects:

| Pack V Expects | What It Looks For | Component Emits | Match? |
|---|---|---|---|
| `scene_transitions` | `rawSceneFeatures.sceneCount \|\| rawSceneFeatures.scene_count` | `sceneChanges` | ❌ No |
| `avg_shot_length` | `rawSceneFeatures.avgSceneDuration \|\| rawSceneFeatures.avg_scene_duration` | (not emitted) | ❌ No |
| `visual_variety` | `rawSceneFeatures.visualVariety \|\| rawSceneFeatures.visual_variety` | (not emitted) | ❌ No |
| `dominant_colors` | `rawSceneFeatures.dominantColors \|\| rawSceneFeatures.dominant_colors` | (not emitted) | ❌ No |

The component emits `{ visualScore, cutsPerSecond, editingPace, sceneChanges, hasTextOverlay }`. Pack V looks for `{ sceneCount, avgSceneDuration, visualVariety, dominantColors }`. **Zero field name overlap.** Even when the component runs successfully on a video file, Pack V receives all `undefined` values for every field it reads.

**Finding R13-6: Dead in primary workflow — requires `videoPath` (cross-component issue CCI-001).**

Same as R12-2. Orchestrator line 4392: `if (!input.videoPath)` → immediate `success: false`. Only fires on TikTok URL download path.

**Finding R13-7: Real scene detection is in the WRONG component — should be in FFmpeg (Component 1).**

FFmpeg's `ffmpeg-training-features.ts` has `scene_changes: 0` as a placeholder (Finding R1-3 from Component 1 analysis). This component implements the real scene detection that Component 1 should own. The foundation component has the placeholder; the downstream consumer does the real work. This dependency is inverted — when Component 1 is consolidated (FFM-001), the scene detection logic should move there.

**Finding R13-8: Frame extraction dependency on `ffmpeg-service.ts`.**

Uses `extractFrames()` and `analyzeVideoMetrics()` from `ffmpeg-service.ts` — yet another path into FFmpeg. The frame extraction is functional but creates temp files that need cleanup and adds latency (extracting 30 frames is slower than just running the scene filter directly).

#### Step 3: Engineering Decision — Can It Become Algorithmic?

**Verdict: 50% real, 50% fake. The scene detection filter is genuinely functional and correct. Everything else (cut detection, text detection, brightness) is placeholder, random, or broken. The real scene detection should move into the canonical FFmpeg analyzer (Component 1). The fake functions should be removed or properly implemented.**

**Implementation path:**
1. Fix Pack V feature name mapping immediately: emit `sceneCount` (or fix Pack V to read `sceneChanges`)
2. Add `avg_shot_length` calculation: `duration / max(1, sceneChanges)` — trivial derived metric
3. Move scene detection logic (`select='gt(scene,0.3)',showinfo`) into canonical FFmpeg analyzer (FFM-001)
4. Replace `detectCutsInFrames()` with scene detection timestamps filtered to first 3 seconds (reuse scene filter with `-t 3`)
5. **Remove `detectTextInFrames()` entirely** — `Math.random()` is worse than no data. If text detection is needed later, use Tesseract OCR or drop the feature.
6. Add `avgBrightness` using `signalstats` YAVG (proven in thumbnail-analyzer)
7. Emit derived `visual_variety` from scene change timestamps (variance of inter-scene intervals)

**Expected difficulty:** Medium — scene detection relocation is straightforward; feature name fix is trivial; replacing fake functions with real implementations requires testing.
**Expected impact:** High — fixes the complete data disconnect between this component and Pack V. Also unlocks real hook-period cut data for the 45% Hook Retention driver.

#### Summary Verdict

| Dimension | Assessment |
|---|---|
| **Concept validity** | Strong — editing pace and visual dynamism are measurable, meaningful signals for short-form video |
| **Current implementation** | Poor — scene detection is real, but cut detection is a constant, text detection is random (`Math.random()`!), brightness is hardcoded, and Pack V feature names are completely wrong |
| **Is it algorithmic?** | Partially — scene detection is deterministic; `Math.random()` text detection is literally non-deterministic and injects random noise into VPS |
| **Architecture debt** | High — duplicates FFmpeg scene detection that should be in Component 1, feature name mismatch means Pack V gets nothing even when it works, inverted dependency |
| **New architecture fit** | Hook Retention (45%) and Content Structure (20%) — editing pace is highly relevant |
| **Priority** | High — fix feature name mapping immediately, move scene detection into canonical FFmpeg analyzer, remove fake functions |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-08 | VSD-002 | Replaced fake `detectCutsInFrames()` constant (`Math.floor(framePaths.length / 5)`, always 6) with stub returning 0 + TODO | `visual-scene-detector.ts` | Always returned 6 regardless of content | Returns 0, awaiting real implementation in Prompt 3 | tsc clean |
| 2026-03-08 | VSD-003 | Replaced `Math.random() > 0.4` in `detectTextInFrames()` with stub returning `false` + TODO | `visual-scene-detector.ts` | Random coin flip (60% true) injecting noise into VPS | Returns false deterministically | tsc clean, grep confirms zero `Math.random` in components/ |
| 2026-03-08 | VSD-004 | Changed hardcoded `avgBrightness = 0.5` to `0` + TODO for FFmpeg consolidation | `visual-scene-detector.ts` | Placeholder 0.5 (fake neutral) | 0 (honest unknown), both main path and error fallback | tsc clean |
| 2026-03-08 | VSD-001 | Fixed Pack V feature name mismatch: `sceneCount`/`scene_count` → `sceneChanges`. Derived `avg_shot_length` from `1/cutsPerSecond`. Set `visual_variety` and `dominant_colors` to `undefined` (not emitted). | `kai-orchestrator.ts` | Pack V read wrong field names → all scene features `undefined` | Correct field mappings, `scene_transitions` and `avg_shot_length` now flow to Pack V | tsc clean, grep confirms zero `rawSceneFeatures.sceneCount` |
| 2026-03-08 | VSD-REWIRE | Rewired component to use canonical FFmpeg analyzer. Removed own FFmpeg scene filter, ffprobe, frame extraction. Added `buildResult()` for reuse when canonical data already available. | `visual-scene-detector.ts` | Ran 3 separate FFmpeg invocations (ffprobe, scene filter, frame extraction) | Thin wrapper over canonical analyzer, zero own FFmpeg calls | tsc clean |

#### Open Issues

| Issue ID | Description | Blocked By | Priority |
|---|---|---|---|
| ~~VSD-001~~ | ~~Feature name mismatch fixed in Pack V mapping~~ | — | ~~Critical~~ **FIXED** |
| ~~VSD-002~~ | ~~Fake constant removed, stub returns 0~~ | — | ~~High~~ **FIXED** |
| ~~VSD-003~~ | ~~Math.random() removed, stub returns false~~ | — | ~~Critical~~ **FIXED** |
| ~~VSD-004~~ | ~~Hardcoded 0.5 replaced with 0~~ | — | ~~Medium~~ **FIXED** |
| VSD-005 | Component dead in primary workflow — requires `videoPath` | CCI-001 | High |
| ~~VSD-006~~ | ~~Scene detection now delegated to canonical analyzer~~ | — | ~~Medium~~ **FIXED** |
| ~~VSD-007~~ | ~~Pack V mapping fixed: `avg_shot_length` derived, `visual_variety`/`dominant_colors` explicitly undefined~~ | — | ~~High~~ **FIXED** |

---

### Component 14: Thumbnail Analyzer

| Field | Value |
|---|---|
| **ID** | `thumbnail-analyzer` |
| **Registry Type** | `quantitative` |
| **Registry Reliability** | 0.50 |
| **Registry Avg Latency** | 2,000ms |
| **API Dependency** | None (FFmpeg-based) |
| **Target Category** | Must be algorithmic |
| **Analysis Date** | 2026-03-08 |
| **Analyst** | Audit Session (Claude) |

#### Step 1: Concept — What Should This Component Measure?

The Thumbnail Analyzer should evaluate the **visual appeal of the video's opening frame** (or cover frame). On TikTok, the first frame a user sees in the feed determines whether they stop scrolling. This component should measure brightness, contrast, color vibrancy, and text/face presence — all measurable properties of a single image. Same frame in = same scores out.

**New Architecture Role:**

| Quality Gate Driver | Thumbnail Contribution |
|---|---|
| Hook Retention (45%) | First-frame visual appeal directly affects scroll-stopping behavior |
| Production Floor (10%) | Image quality — proper exposure, not too dark, not overblown |

| Distribution Potential Driver | Thumbnail Contribution |
|---|---|
| Share Probability (25%) | Visually striking thumbnails improve click-through rates |

#### Step 2: Reality — What Does The Code Actually Do?

**Finding R14-1: The component extracts a real frame and does real signalstats analysis — the most functional of the three.**

`ThumbnailAnalyzer.analyze()` in `src/lib/components/thumbnail-analyzer.ts` (318 lines):
1. Extracts frame at 0.5s using FFmpeg: `ffmpeg -i VIDEO -ss 00:00:00.5 -vframes 1 -q:v 2 -update 1 OUTPUT -y`
2. Runs `signalstats` filter on the frame: `ffmpeg -i FRAME -vf "signalstats,metadata=print:file=-" -f null -`
3. Parses `lavfi.signalstats.YAVG` (brightness, 0-255) and `lavfi.signalstats.YDIF` (contrast proxy) from FFmpeg output
4. Derives scores: contrastScore (0-10), brightnessScore (0-10), colorScore (0-10), compositionScore (0-10)
5. Weighted average: `contrast × 0.35 + brightness × 0.25 + color × 0.25 + composition × 0.15`

The brightness and contrast extraction are genuine FFmpeg measurements producing real, deterministic values. Of the three components being analyzed, this one has the most functional implementation.

**Finding R14-2: Colorfulness is a heuristic approximation, not a real measurement.**

`estimateColorfulness()` (line 281) produces a value between 40-80 based only on contrast and brightness:
```
colorfulness = 30 (base) + [10-30 from contrast] + [10-20 from brightness]
```
Real colorfulness requires analyzing saturation variance across pixels. FFmpeg's `signalstats` filter (already being used!) provides `SATAVG` (saturation average) and `HUEAVG` (hue average). Adding these requires **zero extra FFmpeg calls** — just parsing two more fields from the same output.

**Finding R14-3: `hasText` and `hasFace` are permanently `undefined`.**

Line 247-248:
```
hasText: undefined, // Would require OCR
hasFace: undefined  // Would require face detection
```
Two potentially important features are missing. Pack V mapping (orchestrator line 5314-5315) reads `rawThumbFeatures.hasFace` and `rawThumbFeatures.hasText` — both always `undefined`. The "Would require OCR" comment suggests these were intended but never implemented.

**Finding R14-4: Composition score is guesswork — not real composition analysis.**

`compositionScore` starts at 6 (baseline) and gets +2 if brightness is 90-170 AND contrast >= 40. That's the entire formula. No rule-of-thirds analysis, no center-of-attention detection, no face position analysis. The score is really "is the image reasonably well-exposed?" repackaged as "composition."

**Finding R14-5: Uses raw `exec` instead of fluent-ffmpeg — a sixth FFmpeg invocation pattern.**

Line 90:
```
const extractCommand = `ffmpeg -i "${normalizedVideoPath}" -ss 00:00:00.5 -vframes 1 ...`;
await execAsync(extractCommand);
```
The other components use the `fluent-ffmpeg` library. This component uses `child_process.exec` with raw command strings. This is the sixth distinct FFmpeg invocation pattern in the codebase, making consolidation harder.

**Finding R14-6: Analyzes frame at 0.5s — not necessarily the TikTok cover image.**

The 0.5-second offset is arbitrary. TikTok allows creators to choose a cover image, and the algorithm may show a different frame in the For You feed. Analyzing at 0.0s (actual first frame) or extracting multiple candidate frames would be more meaningful.

**Finding R14-7: Dead in primary workflow — requires `videoPath` (cross-component issue CCI-001).**

Same as R12-2, R13-6. The orchestrator's `executeThumbnailAnalyzer()` (line 4492) passes `input.videoPath` to `ThumbnailAnalyzer.analyze()`. When `videoPath` is `undefined` (primary workflow), the analyzer's `if (!videoPath)` guard (line 52) returns `success: false` with all scores at 5 and confidence at 0.3.

**Finding R14-8: Confidence is hardcoded at 0.65.**

Line 224: `const confidence = 0.65;` — fixed regardless of analysis quality. A meaningful confidence should reflect whether signalstats parsing succeeded, whether the frame is valid (not black/white), and whether the extracted frame is representative.

**Finding R14-9: Pack V mapping partially works — best of the three components.**

| Pack V Expects | Component Emits | Mapping (orchestrator) | Works? |
|---|---|---|---|
| `thumbnail_score` | `overallScore` (0-10) | `overallScore * 10` → 0-100 | ✅ Yes |
| `has_face` | `hasFace` = `undefined` | Pass-through | ❌ Always undefined |
| `has_text` | `hasText` = `undefined` | Pass-through | ❌ Always undefined |
| `color_vibrancy` | `colorfulness` (0-100) | `colorfulness / 100` → 0-1 | ✅ Yes (heuristic value) |
| `composition_score` | `compositionScore` (0-10) | `compositionScore * 10` → 0-100 | ✅ Yes (heuristic value) |

3 of 5 fields map correctly. This is the only one of the three Layer 1 visual/audio components where Pack V actually receives usable data.

#### Step 3: Engineering Decision — Can It Become Algorithmic?

**Verdict: Already mostly algorithmic. The most functional of the three components. Core brightness/contrast extraction is real. Needs colorfulness improvement (use SATAVG from signalstats), hasText/hasFace implementation or explicit removal, and frame timing reconsideration. Should eventually merge into canonical FFmpeg analyzer.**

**Implementation path:**
1. Add `SATAVG` (saturation average) and `HUEAVG` (hue average) parsing from signalstats output — real colorfulness with zero extra FFmpeg calls
2. Replace heuristic `estimateColorfulness()` with saturation variance measurement
3. Change frame timing from 0.5s to 0.0s (first visible frame), or extract 3-5 candidate frames and analyze the best
4. Migrate from raw `exec` to fluent-ffmpeg for consistency with other components
5. Either implement `hasText`/`hasFace` (via Tesseract OCR / face detection) or explicitly remove them from the interface and Pack V mapping
6. Replace hardcoded confidence (0.65) with a computed value based on signalstats parsing success
7. Eventually merge into canonical FFmpeg analyzer (Component 1 consolidation, FFM-001)

**Expected difficulty:** Low — signalstats parsing addition is trivial (already parsing from same output); frame timing change is a single parameter.
**Expected impact:** Medium — fixes colorfulness accuracy and provides real saturation data. Low impact on primary workflow until videoPath gate is addressed.

#### Summary Verdict

| Dimension | Assessment |
|---|---|
| **Concept validity** | Strong — first-frame visual quality is a measurable, meaningful signal for scroll-stopping |
| **Current implementation** | Moderate — real brightness/contrast extraction (the best of the three), but colorfulness is heuristic, composition is guesswork, hasText/hasFace missing, frame timing arbitrary |
| **Is it algorithmic?** | Yes — `signalstats` is deterministic. Same frame = same numbers. |
| **Architecture debt** | Medium — raw `exec` instead of fluent-ffmpeg, 0.5s frame timing is arbitrary, hardcoded confidence, sixth FFmpeg invocation pattern |
| **New architecture fit** | Hook Retention (45%) — first-frame visual appeal. Production Floor (10%) — exposure quality. |
| **Priority** | Medium — fix colorfulness (add SATAVG), address frame timing, merge into canonical FFmpeg analyzer |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-08 | THM-002 | Colorfulness now uses real SATAVG data from canonical analyzer instead of brightness+contrast heuristic | `thumbnail-analyzer.ts` | Heuristic: base 30 + contrast bonus + brightness bonus (fake) | Real SATAVG from signalstats, normalized 0-100 | tsc clean |
| 2026-03-08 | THM-006 | Replaced raw `exec` FFmpeg commands with canonical analyzer import. No more frame extraction + separate signalstats pass. | `thumbnail-analyzer.ts` | Two raw `exec` calls (frame extract + signalstats analysis) | Single `analyzeVideo()` call from canonical analyzer | tsc clean |
| 2026-03-08 | THM-007 | Confidence now dynamic based on signalstats data availability instead of hardcoded | `thumbnail-analyzer.ts` | Always 0.65 (hardcoded) | Dynamic: 0.8 (both brightness+contrast), 0.5 (one available), 0.3 (neither) | tsc clean |
| 2026-03-08 | THM-REWIRE | Rewired component to use canonical FFmpeg analyzer. Added `buildResult()` for reuse when canonical data already available. Removed temp file extraction/cleanup logic. | `thumbnail-analyzer.ts` | Extracted frame to temp file, ran signalstats on frame, parsed YAVG/YDIF, cleaned up temp file | Thin wrapper: reads canonical `brightness_avg`, `contrast_score`, `color_variance`, maps to 0-255/0-100 scales for scoring | tsc clean |

#### Open Issues

| Issue ID | Description | Blocked By | Priority |
|---|---|---|---|
| THM-001 | `hasText` and `hasFace` always `undefined` — Pack V receives nothing for these fields | Nothing | Medium |
| ~~THM-002~~ | ~~Colorfulness now uses real SATAVG~~ | — | ~~Medium~~ **FIXED** |
| THM-003 | Composition score is guesswork (base 6 + exposure heuristic) — not real composition analysis | Nothing | Low |
| THM-004 | Canonical analyzer uses sampled frames, not frame at 0.5s — brightness/contrast is video-wide average, not first-frame specific | Nothing | Low |
| THM-005 | Component dead in primary workflow — requires `videoPath` | CCI-001 | High |
| ~~THM-006~~ | ~~Replaced with canonical analyzer import~~ | — | ~~Low~~ **FIXED** |
| ~~THM-007~~ | ~~Confidence updated to 0.75~~ | — | ~~Low~~ **FIXED** |

---

### Component 15: TikTok Virality Matrix

| Field | Value |
|---|---|
| **ID** | `virality-matrix` |
| **Registry Type** | `pattern` |
| **Registry Reliability** | 0.80 (registry) / 51.3% (learned, avg error: 27.9 VPS) |
| **Registry Avg Latency** | 15,000ms |
| **Observed Latency** | <50ms (runtime 2026-03-09 — pure regex, no API call) |
| **API Dependency** | **NONE** (documentation says `OPENAI_API_KEY` — this is WRONG) |
| **Target Category** | Remove — fully duplicative of hook-scorer + pattern-extraction |
| **Analysis Date** | 2026-03-09 |
| **Analyst** | Layer 3 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

The Virality Matrix is described as a "9-dimension viral content analysis aligned with training extraction." Its conceptual purpose is to score content across 9 virality factors: hook strength, emotional resonance, value density, shareability, trend alignment, pacing/retention, authenticity, controversy/curiosity, and CTA strength.

**New Architecture Role:**

| Quality Gate Driver | VM Contribution |
|---|---|
| Hook Retention (45%) | `vm_hook_strength` — first 150 chars regex patterns |
| Content Structure (20%) | `vm_value_density` — keyword matching |
| Production Floor (10%) | `vm_pacing_retention` — duration + WPS heuristic |

| Distribution Potential Driver | VM Contribution |
|---|---|
| Share Probability (25%) | `vm_shareability` — share/tag keyword matching |
| Trend Alignment (20%) | `vm_trend_alignment` — static slang list (stale) |

**The problem:** Every one of these 9 dimensions is already measured by either hook-scorer (#10), pattern-extraction (#11), or both — using more sophisticated methods (contextual regexes, positional weighting, multi-modal signals).

#### Step 2: Reality — What Does The Code Actually Do?

**Finding VM-001 (CRITICAL): Virality Matrix is NOT LLM-dependent — it's 100% regex/heuristic.**

`ViralityMatrix.analyze()` in `src/lib/components/virality-matrix.ts` (336 lines) contains ZERO API calls, ZERO LLM invocations, and ZERO dynamic imports. Every dimension is computed with regex pattern matching and keyword counting against the transcript string. Despite the registry listing `apiDependency: 'OPENAI_API_KEY'` and CLAUDE.md stating "Fully LLM-dependent (OpenAI)", this component has never called OpenAI.

The registry entry is factually wrong and should be corrected.

**Finding VM-002: All 9 dimensions overlap with existing components.**

| VM Dimension | Method | Overlaps With |
|---|---|---|
| `vm_hook_strength` | 5 regex patterns on first 150 chars (stop/wait, here's, did you, ?, you) | **Hook Scorer (#10)** — 5-channel multi-modal analysis with Whisper timestamps, 10-type taxonomy. Strictly superior. |
| `vm_emotional_resonance` | 9 emotion words + exclamation count | **Pattern Extraction (#11)** — emotional intensifiers in body zone with positional weighting |
| `vm_value_density` | 3 regex groups (learn/hack/secret, step/first/second, never/always/must) + WPS | **Pattern Extraction (#11)** — value-delivery patterns with co-occurrence bonuses |
| `vm_shareability` | 3 regex groups (share/tag, everyone/friends, relatable/true) + question count | **Pattern Extraction (#11)** — CTA zone analysis |
| `vm_trend_alignment` | 13 static slang phrases ("pov", "no way", "plot twist", etc.) | **Nothing equivalent** — but static phrase lists are stale within weeks on TikTok |
| `vm_pacing_retention` | Duration check (15-45s optimal) + WPS (2-4 optimal) + sentence length | **Hook Scorer (#10)** — pace channel with actual speaking rate data |
| `vm_authenticity` | First-person pronoun detection + "honestly"/"real talk" + story markers | **Pattern Extraction (#11)** — narrative/story patterns |
| `vm_controversy` | 4 regex groups (unpopular opinion, nobody/secret, wrong/mistake) | **Pattern Extraction (#11)** — contrarian/myth-bust patterns |
| `vm_cta_strength` | 6 CTA patterns (follow, like/save/share, comment, subscribe, link in bio, part 2) | **Pattern Extraction (#11)** — CTA zone positional analysis |

**8 of 9 dimensions are strictly inferior to existing components.** The only unique dimension (`vm_trend_alignment`) uses a hardcoded slang list that becomes outdated within weeks.

**Finding VM-003: Score range is compressed into 0.40-0.70 for all content.**

Every dimension starts at a base of 0.30-0.50 and can reach a maximum of 1.0 only with many keyword matches. The weighted overall score (with weights summing to 1.0) produces a typical range of 0.40-0.65, which maps to VPS 40-65 via `Math.round(vm_overall * 100)`.

**Runtime evidence:** VPS=55.0 (vm_overall ≈ 0.55). This is squarely in the middle of the compressed range, providing almost no discriminating power.

**Finding VM-004: The component runs in <50ms but occupies a slot in the 16-component pattern_based path.**

Because it's pure regex, it's extremely fast. But it takes up a component slot, contributes to the weighted average, and adds correlated signal (same keywords the other two components already detect). Its 0.80 confidence gives it meaningful weight in aggregation.

**Finding VM-005: Registry claims avgLatency of 15,000ms — this is 300x too high.**

The registry entry `defaultAvgLatency: 15000` was set when this component was believed to make an OpenAI API call. In reality it completes in <50ms. This inflates its timeout allocation unnecessarily.

#### Step 3: Engineering Decision

**Verdict: Remove from pipeline. Its 9 dimensions are all subsets of hook-scorer + pattern-extraction.**

| Dimension | Assessment |
|---|---|
| Concept validity | **Redundant** — all 9 dimensions already measured by hook-scorer and/or pattern-extraction with superior methods |
| Current implementation | Clean code, fast execution, but every dimension is a simpler version of what other components already do |
| Is it algorithmic? | Yes — 100% deterministic, despite being mislabeled as LLM-dependent |
| Is it unique? | **No** — only `vm_trend_alignment` is not covered elsewhere, and it uses a static slang list |
| Architecture debt | Medium — mislabeled registry entry, 300x overestimated latency, takes a slot in the ensemble |
| New architecture fit | Zero — hook-scorer and pattern-extraction cover all its territory with better methods |
| Priority | **High** — easy removal, reduces ensemble noise, corrects a mislabeled component |

**Implementation path:**
1. Move to `disabledComponents` in orchestrator (same as feature-extraction)
2. Correct the registry: remove `apiDependency: 'OPENAI_API_KEY'`, set `defaultAvgLatency: 50`
3. Update CLAUDE.md: change "Fully LLM-dependent (OpenAI)" to "DISABLED — fully algorithmic but duplicative"
4. If `vm_trend_alignment` signal is desired, add a `trendSlang` channel to hook-scorer instead
5. Keep the file for reference but do not execute in pipeline

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |

#### Open Issues

| Issue ID | Description | Priority |
|---|---|---|
| VM-001 | Registry says `apiDependency: 'OPENAI_API_KEY'` — component uses NO API calls | High |
| VM-002 | All 9 dimensions duplicated by hook-scorer + pattern-extraction | High |
| VM-003 | Score range compressed to 40-65 — near-zero discriminating power | Medium |
| VM-005 | Registry `defaultAvgLatency: 15000` should be 50 | Low |

---

### Component 16: Virality Indicator Engine

| Field | Value |
|---|---|
| **ID** | `virality-indicator` |
| **Registry Type** | `pattern` |
| **Registry Reliability** | 0.85 |
| **Registry Avg Latency** | 500ms |
| **API Dependency** | None (rule-based) |
| **Target Category** | Must be algorithmic |
| **Analysis Date** | 2026-03-09 |
| **Analyst** | Layer 4 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

The "proprietary 6-factor prediction algorithm" combines: Text Quality (25%), Visual Quality (20%), Audio Quality (15%), Timing (10%), Pacing (15%), Engagement Potential (15%). Produces a 0-100 virality indicator, which the orchestrator maps to a VPS prediction of 25-95 via `vpsPrediction = 25 + (indicator * 0.70)`.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding VIR-001 (previously identified): FFmpeg inputs now receive real data post-Layer 1 fixes.** `scene_changes`, `avg_brightness`, `has_faces` now come from canonical FFmpeg analyzer when video is available. Still receives defaults in transcript-only workflow.

**Finding VIR-002 (CRITICAL): All 6 factors start at 50 — can NEVER go below 50.**

Every factor in `src/lib/services/virality-indicator/index.ts` follows this pattern:
```
let textScore = 50;
// only += bonuses, never -= penalties
textScore = Math.min(100, textScore);
```

No factor has any subtraction path. The minimum score for every factor is 50. With 6 factors all at minimum 50 and the weighted average: minimum virality indicator = 50. Mapped to VPS: `25 + (50 * 0.70)` = **60 VPS floor**.

**The virality indicator can NEVER produce a VPS below 60**, regardless of how poor the content is. This is the same inflation pattern we just stripped from Gemini in Layer 3.

**Finding VIR-003: Massive overlap with hook-scorer (#10) and pattern-extraction (#11).**

| VI Factor | Overlapping Component | Overlap Details |
|---|---|---|
| Text Quality: hook patterns | hook-scorer (#10) | Both check "stop/wait/listen/watch", questions, power words |
| Text Quality: CTA presence | pattern-extraction (#11) | Both check "follow/like/share/comment/subscribe" |
| Text Quality: power words | pattern-extraction (#11) | Both check "secret/discover/truth" |
| Pacing: words per second | audio-analyzer (#12) | Audio-analyzer measures real WPM from Whisper |
| Engagement: "you" language | pattern-extraction (#11) | Both check second-person address |
| Engagement: controversy | pattern-extraction (#11) | Both check "secret/truth/nobody" |

**Finding VIR-004: The 25-95 VPS mapping is double-inflated.**

With a guaranteed indicator floor of 50, the effective VPS range is 60-95 (not 25-95 as designed). The top end is compressed: going from indicator 50 to 100 only moves VPS from 60 to 95 — a 35-point range for all content quality differentiation.

**Finding VIR-005: Timing factor is usually 50 (no bonus).**

Posting hour is rarely provided (`(input as any).postingHour`). When absent, timing is a constant 50, contributing nothing but pulling the overall indicator toward 50 (which then maps to VPS 60). This makes it worse than useless — it dilutes the signal from other factors.

**Finding VIR-006: Duration fallback creates fake pacing scores.**

Pacing factor uses `(input as any).duration || 30` — fallback 30 seconds. When duration is unavailable, every video gets the "optimal duration 15-45s" bonus (+20 to pacing). This inflates the pacing score from 50 to 70 for all transcript-only predictions regardless of actual video length.

**Finding VIR-007: Confidence formula is well-designed (unlike the scoring).**

Confidence increases with data availability: +0.15 for transcript >100 chars, +0.15 for FFmpeg data, +0.10 for metadata, +0.10 for resolution. Range 0.5-1.0. This correctly reflects uncertainty.

#### Step 3: Engineering Decision

**Verdict: CRITICAL FIX NEEDED — same inflation pattern as Gemini. All 6 factors need subtraction for poor quality. VPS floor of 60 must be removed.**

| Dimension | Assessment |
|---|---|
| Concept validity | **Moderate** — 6-factor framework is reasonable, but the bonus-only scoring makes it incapable of identifying bad content |
| Current implementation | **Broken** — VPS floor of 60 means it adds upward bias to every prediction |
| Is it unique? | **Partially** — Visual Quality, Audio Quality, and Timing factors use metadata not available to text-based components. But Text and Engagement overlap heavily with hook-scorer and pattern-extraction |
| Architecture debt | **High** — guaranteed 60+ VPS inflates the pattern_based path average for every prediction |
| New architecture fit | Should be an honest multi-factor scorer where a boring, poorly-shot, badly-paced video scores 20-30, not 60 |
| Priority | **Critical** — second-highest priority fix after Pack 3 confidence-as-VPS bug |

**Implementation path:**
1. **Rebase all 6 factors to start at 30 instead of 50** — allow bad content to score low
2. **Add penalty conditions** — poor lighting, no hook, no CTA, bad pacing should SUBTRACT from score
3. **Fix the VPS mapping** — change from `25 + (indicator * 0.70)` to a direct 0-100 pass-through (or adjust the linear mapping to start at 0)
4. **Remove timing factor** — it's almost always 50 (no data), just adds noise
5. **Fix duration fallback** — when duration unknown, pacing should score 50 (uncertain), not get the "optimal duration" bonus

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-09 | VIR-FIX-1 | 'either' input bug fixed in `prediction-config.ts` | `prediction-config.ts` | `input['either']` always undefined | Proper 'either' handling | Runtime verified |
| 2026-03-10 | VIR-FIX-2 | Rebased all 6 factors from 50 → 30, added penalty conditions (VIR-002) | `virality-indicator/index.ts` | All factors start at 50, only bonuses — min indicator 50 | Factors start at 30, penalties for poor signals — min indicator ~0-15 | TypeScript verified |
| 2026-03-10 | VIR-FIX-3 | Removed Timing factor, redistributed weight (VIR-005) | `virality-indicator/index.ts` | 6 factors, Timing always 50, weight 10% | 5 factors: Text 28%, Visual 22%, Audio 17%, Pacing 17%, Engagement 16% | TypeScript verified |
| 2026-03-10 | VIR-FIX-4 | VPS mapping changed to direct pass-through (VIR-004) | `kai-orchestrator.ts` | `vpsPrediction = 25 + (indicator * 0.70)` — floor 60 | `vpsPrediction = result.virality_indicator` — full 0-100 range | TypeScript verified |
| 2026-03-10 | VIR-FIX-5 | Duration fallback fixed — unknown duration scores base 30 (VIR-006) | `virality-indicator/index.ts`, `kai-orchestrator.ts` | `duration || 30` gave fake optimal-duration bonus | `duration || 0`, pacing checks `hasDuration` before applying bonuses | TypeScript verified |

#### Open Issues

| Issue ID | Description | Priority |
|---|---|---|
| ~~VIR-001~~ | ~~FFmpeg inputs fake~~ | ~~Blocked~~ **FIXED by Layer 1 canonical analyzer** |
| ~~VIR-002~~ | ~~All 6 factors start at 50, can never go below 50 — VPS floor of 60~~ | ~~Critical~~ **FIXED 2026-03-10 (VIR-FIX-2)** |
| VIR-003 | Text Quality and Engagement factors heavily overlap with hook-scorer and pattern-extraction | High |
| ~~VIR-004~~ | ~~VPS mapping `25 + (indicator * 0.70)` compresses differentiation to 60-95 range~~ | ~~Critical~~ **FIXED 2026-03-10 (VIR-FIX-4)** |
| ~~VIR-005~~ | ~~Timing factor almost always 50 (no posting hour data) — adds noise~~ | ~~Medium~~ **FIXED 2026-03-10 (VIR-FIX-3)** |
| ~~VIR-006~~ | ~~Duration fallback of 30s gives fake "optimal duration" bonus to all transcript-only predictions~~ | ~~Medium~~ **FIXED 2026-03-10 (VIR-FIX-5)** |

---

### Component 17: Niche Keywords Analyzer

| Field | Value |
|---|---|
| **ID** | `niche-keywords` |
| **Registry Type** | `pattern` |
| **Registry Reliability** | 0.85 |
| **Registry Avg Latency** | 200ms |
| **API Dependency** | None (loads `@/data/niche-keywords.json`) |
| **Target Category** | REMOVE — dead code |
| **Analysis Date** | 2026-03-10 |
| **Analyst** | Layer 5 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

Niche Keywords was designed to score how well a video's transcript matches keywords associated with its declared niche. The idea: a video about "side hustles" that mentions "passive income," "Etsy," "dropshipping" is more niche-aligned than one that mentions "cooking" and "recipes."

**Architecture role:** Originally part of the `historical` prediction path. The `historical` path now has zero components (all removed/disabled per D11). Niche Keywords itself is always disabled at runtime via `disabledComponents`.

**What "good" looks like:** If operational, it would provide a 0-100 niche alignment score. But this functionality is now better served by:
- `24-styles` (#9) — detects content style with keyword matching + LLM refinement
- `pattern-extraction` (#11) — identifies structural patterns with contextual regexes
- `hook-scorer` (#10) — text channel analyzes hook relevance to niche

#### Step 2: Reality — What Does The Code Actually Do?

**Finding NK-001: Permanently disabled — never executes.**

`kai-orchestrator.ts` line 340: `disabledList.push('niche-keywords', ...)` — pushed to `disabledComponents` on every startup. The component never runs in any prediction.

**Finding NK-002: Simple keyword density scorer — fully duplicated by other components.**

The `executeNicheKeywords()` method (around line 3540-3622) does:
1. Loads niche-specific keywords from `@/data/niche-keywords.json` (or hardcoded fallback)
2. Counts keyword matches in transcript
3. Computes density = matches / total_words
4. Score = 50 (base) + density bonuses
5. Returns 50 (neutral) when no keywords match

This is a subset of what `24-styles` and `pattern-extraction` already do with more sophistication.

**Finding NK-003: Ghost reference in XGBoost feature vector.**

`kai-orchestrator.ts` line 4229: `'niche-keywords': { pred: 'niche_keywords_pred', conf: 'niche_keywords_conf' }` — XGBoost maps two feature slots to niche-keywords output, but since the component never runs, these are always 0 (undefined → 0).

**Finding NK-004: Historical path component list already emptied.**

The `historical` path where niche-keywords originally lived has `components: []` (emptied in Layer 2 phantom components fix). Niche-keywords is only in the registry — it has no execution path.

#### Step 3: Engineering Decision

**Verdict: CONFIRM DEAD. Clean up references on XGBoost disable/rebuild.**

| Dimension | Assessment |
|---|---|
| Concept validity | **Weak** — keyword density is a crude proxy for niche alignment. Superseded by 24-styles hybrid classifier and pattern-extraction contextual regexes. |
| Current implementation | **Dead** — permanently disabled, never executes, no execution path. |
| Is it unique? | **No** — fully duplicated by 24-styles (keyword matching), pattern-extraction (contextual patterns), and hook-scorer (niche-relevant text analysis). |
| Architecture debt | **Low** — occupies 2 always-zero feature slots in XGBoost. Registry entry prevents errors from historical path reference. |
| New architecture fit | **None** — remove from registry when XGBoost is rebuilt (v7 feature vector drops these slots). |
| Priority | **Low** — it's already dead. Clean up is cosmetic until XGBoost rebuild. |

**Implementation:** No immediate action needed. When XGBoost is disabled (Layer 5 fix), remove `niche-keywords` from XGBoost's `componentFeatureMap`. When XGBoost is rebuilt with v7 features, remove from registry entirely.

#### 🔮 FUTURE: Search Alignment Component (Replaces Niche Keywords)

**Status:** DEFERRED — Owner lacks bandwidth for keyword collection. Revisit when Distribution Potential mode is being built.

**Background:** The original `niche-keywords` implementation is dead and duplicative (see NK-001 through NK-004 above). However, the *idea* behind it — scoring transcript alignment to real TikTok search terms — has genuine strategic value for the Distribution Potential prediction mode. The current implementation was wrong (generic keyword density), not the concept.

**Real Keyword Data (User-Curated, NOT AI-Generated):**
- **Source file:** `frameworks-and-research/POC Research & Framework Data/Framework- Niche Keywords 11-16-25.md`
- **Origin:** Manually recorded from TikTok search autocomplete suggestions by the project owner
- **Coverage:** ~240 real search terms across 4 niches (Personal Finance/Investing, Fitness/Weight Loss, Business/Entrepreneurship, Food/Nutrition Comparisons). Niches 5-20 are empty (labels only).
- **⚠️ NOT the same as** `src/data/niche-keywords.json` or `config/niche-keywords.json` — those were AI-generated by agents and contain generic vocabulary, not real TikTok search intelligence.

**Proposed Architecture (When Ready):**
1. **Convert the markdown keyword file to structured JSON** — add `niche`, `rank` (position in TikTok autocomplete), `date_observed` per keyword. Existing ~240 keywords get rank=1 (original positions not captured) and date_observed=2025-11-16.
2. **Build `search-alignment` scorer** (~100 lines TypeScript, no LLM, no API calls):
   - Exact phrase match (1.0) + partial match (0.5) against niche keyword database
   - Weighted by rank (top-3 = 1.0, 4-7 = 0.7, 8-10 = 0.4, unranked = 0.6) × freshness (<7d = 1.0, <30d = 0.8, <90d = 0.5, >90d = 0.2)
   - Output: 0-85 score + matched keywords list + freshness note
3. **Wire into Distribution Potential mode** — fills the empty `trend_alignment` slot (20% weight) in `concept-scorer.ts`
4. **Weekly refresh cadence** — owner manually records TikTok search autocomplete for top 5 seed phrases per niche, updates JSON/database with positions and dates
5. **Only affects Distribution Potential** — Raw VPS (Quality Gate) remains unaffected

**Prerequisites before building:**
- [ ] Owner completes keyword collection for all 20 niches (currently 4/20)
- [ ] Owner establishes weekly TikTok search recording cadence
- [ ] Distribution Potential mode is ready to activate in the pipeline

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| Pre-audit | — | Already disabled at runtime | `kai-orchestrator.ts` | Always in `disabledComponents` | Same | ✅ |
| 2026-03-10 | NK-ANALYSIS | Layer 5 deep-dive analysis complete — confirmed dead, 4 findings | `docs/COMPONENT_DEEP_ANALYSIS.md` | Placeholder | Full 3-step audit | ✅ |

#### Open Issues

| Issue ID | Description | Priority |
|---|---|---|
| NK-001 | Component permanently disabled — remove from registry on XGBoost rebuild | Low |
| NK-002 | Functionality fully duplicated by 24-styles + pattern-extraction | Informational |
| NK-003 | Ghost reference in XGBoost feature vector (2 always-zero slots) | Low (fix in v7) |

---

### Component 18: XGBoost Virality ML Predictor

| Field | Value |
|---|---|
| **ID** | `xgboost-virality-ml` |
| **Registry Type** | `quantitative` |
| **Registry Reliability** | 0.85 |
| **Registry Avg Latency** | 12,000ms |
| **API Dependency** | Python subprocess (v6) or none (v5-simplified heuristic) |
| **Target Category** | DISABLE now, rebuild when N >= 200 labeled videos |
| **Analysis Date** | 2026-03-10 |
| **Analyst** | Layer 5 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

XGBoost is the **only true machine learning component** in the system. Its role is fundamentally different from every other component:

**Purpose:** Learn a statistical mapping from measurable content features → actual post-publication performance (DPS), trained on real outcome data. Every other component is either a heuristic (rule-based) or an LLM opinion. XGBoost is the one component that should empirically discover which features actually predict virality by learning from ground truth.

**Architecture role:** XGBoost sits in the `pattern_based` prediction path (weight 0.45) as a Phase 2 dependent component — it runs AFTER all other components and reads their `prediction`/`confidence` outputs as input features. This is architecturally correct: it should aggregate all upstream signals into a single learned prediction.

**What "good" looks like:**
- Trained on 200+ videos with clean DPS labels (from auto-labeler + manual labeling)
- Uses the 42-feature vector: 14 FFmpeg features (now real via canonical analyzer), 7 text features, 18 component prediction/confidence pairs, 2 LLM scores, 1 data quality ratio
- Plus 13 new prosodic features from Batch B (pitch, speaking rate, volume dynamics, silence patterns, sound classification)
- Eval R² >= 0.3 (better than random), Spearman ρ >= 0.4 (meaningful rank correlation)
- Within-niche ranking accuracy that demonstrably outperforms the heuristic ensemble

**Quality Gate role:** XGBoost contributes to the "Is this video good?" signal. In Distribution Potential mode, it would provide a calibrated score anchored to real outcome data.

**Why it matters:** Without a functioning XGBoost, the entire prediction system is an ensemble of opinions (LLM scores) and hand-tuned heuristics. XGBoost is the bridge from "what we think predicts virality" to "what actually predicts virality." It's the only component that can validate or invalidate the other 18 components' contributions.

#### Step 2: Reality — What Does The Code Actually Do?

##### THREE model systems exist — all broken or contaminated

**Finding XGB-001 (CRITICAL): v6 model has zero generalization.**

File: `models/xgboost-v6-metadata.json`
- Trained: 2026-02-10 on 27 samples (21 train, 6 eval)
- Train R²=0.983, Eval R²=0.0, CV R²=-164,094
- Target range: [36.0, 91.29], mean 54.7 ±24.3
- Top features: `text_avg_word_length` (42.4%), `text_char_count` (33.5%), `visual_complexity` (20.7%), `duration_seconds` (3.2%)
- Only 4 of 42 features have non-zero importance — model couldn't learn from the rest with N=27
- The "100% within ±5 DPS" and "100% tier accuracy" on eval are artifacts of 6 eval samples (with target std=24.3, predicting the mean ≈55 for all 6 gets you within 5 of most)
- **Verdict: Memorized noise. Adds random VPS in the 20-85 range.**

**Finding XGB-002 (CRITICAL): Legacy v5 model was trained on contaminated data.**

File: `models/training-metrics.json`
- Trained: 2025-11-18 on 442 samples (353 train, 89 test)
- Test R²=0.917, Train R²=0.999 — looks great until you see the features:
- Top feature: `views_count` (73.9% importance), `engagement_rate` (13.8%), `comments_count` (4.3%), `likes_count` (3.0%)
- This model predicts DPS from post-publication engagement metrics — i.e., it predicts performance from performance data that is only available AFTER the video goes viral
- **Verdict: A tautology. Useless for pre-publication prediction.**

**Finding XGB-003: v5-simplified heuristic is actually running in production.**

File: `src/lib/services/virality-indicator/xgboost-virality-service.ts` lines 61-78
- `ACTIVE_MODEL_VERSION = process.env.MODEL_VERSION === 'xgb_v6' ? 'v6' : 'v5-simplified'`
- Unless `MODEL_VERSION=xgb_v6` is explicitly set in `.env.local`, the v5-simplified heuristic runs
- The heuristic (`_predictV5Heuristic`) uses a hardcoded `FEATURE_IMPORTANCE` map (14 features with hand-picked weights), normalizes each feature to 0-1, computes a weighted average, and maps it to the range [20, 85] via `baseDps = 20 + (normalizedScore * 65)`
- This is not machine learning. It's a hand-tuned weighted average with arbitrary normalization
- **Verdict: Deterministic heuristic masquerading as ML. Produces ~40-60 VPS for most inputs.**

**Finding XGB-004: Feature pipeline has stale references to disabled components.**

File: `src/lib/orchestration/kai-orchestrator.ts` lines 4224-4234
- XGBoost's feature map includes `niche-keywords`, `virality-matrix`, `trend-timing`, `posting-time` — all disabled/nonexistent
- These features are always undefined → 0, wasting 8 of 18 component prediction slots
- Only 5 of 9 mapped components actually produce data at runtime: `hook-scorer`, `7-legos`, `9-attributes`, `24-styles`, `pattern-extraction`
- `gpt4_score` and `claude_score` are now in coach lane (weight=0) but still feed into XGBoost features — a data leak from coach lane into the score lane
- **Verdict: Feature vector is 50% zeros and 5% coach-lane leakage.**

**Finding XGB-005: Baseline metadata file shows a DIFFERENT earlier training attempt.**

File: `models/xgboost-v6-metadata-baseline.json`
- Trained: 2026-02-09 on 17 samples (13 train, 4 eval)
- Target range: [42.51, 43.86], mean 42.59 ±0.32 — nearly zero variance in target!
- Top features: `duration_seconds` (52.6%), `resolution_width` (26.6%), `fps` (15.0%)
- This dataset had 17 videos all with nearly identical DPS (~42.5) — the model learned nothing because there was nothing to learn
- **Verdict: Training data had zero signal variance. Model is constant prediction ≈42.6.**

**Finding XGB-006: Python v6 prediction subprocess has a hardcoded fallback.**

File: `scripts/predict-xgboost.py` line 189
- On ANY exception, returns `prediction: 53.77` (mean from training data), `confidence: 0.3`
- If the Python environment isn't set up (no xgboost, no sklearn), every prediction silently returns 53.77
- **Verdict: Silent failure mode returns constant. Could run for months without anyone noticing it's broken.**

**Finding XGB-007: Export pipeline correctly handles new prosodic features.**

File: `scripts/export-training-dataset.ts` lines 271-302
- The export script already maps 13 prosodic features from audio-analyzer (pitch_range, pitch_variance, pitch_contour_slope, wpm_mean, wpm_variance, wpm_acceleration, loudness_range, loudness_variance, loudness_rate_of_change, silence_pattern, music_ratio, audio_type, audio_fingerprint)
- These are supplementary features NOT in the v5 42-feature vector but available for future v7 training
- The export pipeline is ready. The model retraining is not.
- **Verdict: Data pipeline is ahead of the model. Good — no pipeline work needed when 200+ samples arrive.**

**Finding XGB-008: Reliability is hardcoded at 0.85 despite broken model.**

File: `src/lib/prediction/system-registry.ts` line 224
- `defaultReliability: 0.85` — treated as highly reliable in path aggregation
- In reality it adds noise with R²=0.0
- This inflated reliability gives XGBoost undeserved weight in the `pattern_based` path's weighted average
- **Verdict: Reliability should be 0.0 or the component should be disabled.**

**Finding XGB-009: v5 heuristic has no connection to the actual models on disk.**

File: `src/lib/services/virality-indicator/xgboost-virality-service.ts`
- The `_predictV5Heuristic` method doesn't load any model file. It's entirely self-contained with hardcoded weights
- The `FEATURE_IMPORTANCE` map at the top of the file (lines 30-50) has NO relationship to the trained model's actual feature importances in `training-metrics.json`
- The heuristic uses features like `motion_score`, `hook_scene_changes`, `has_music` — which had ZERO importance in the actual trained model (which was dominated by `views_count`)
- **Verdict: The "v5" in production is a fiction — it's a hand-designed formula dressed up as an ML prediction.**

##### Runtime behavior summary

At runtime (`MODEL_VERSION` not set to `xgb_v6`):
1. Orchestrator calls `executeXGBoostViralityML()` — builds 41-feature vector from upstream component results
2. Service routes to `_predictV5Heuristic()` — ignores most features, uses hardcoded 14-weight formula
3. Returns prediction in range [20, 85] — always succeeds, always ~40-60 for typical inputs
4. This prediction enters the `pattern_based` path with reliability 0.85
5. Gets weighted-averaged with 14 other components in the path
6. Path contributes 45% weight to final VPS

##### Dependency map: What XGBoost reads from upstream

| Upstream Component | Feature Slots | Runtime Status | Data Quality |
|---|---|---|---|
| FFmpeg (#1) | 14 features | ✅ Real data (canonical analyzer) | Good — real signalstats, scene filter, ffprobe |
| Transcript (text) | 7 features | ✅ Real data (inline extraction) | Good — word count, sentence count, etc. |
| hook-scorer (#10) | 2 features (pred/conf) | ✅ Rebuilt (5-channel) | Good — deterministic 0-100 |
| 7-legos (#8) | 2 features (pred/conf) | ✅ Running (coach lane) | Medium — regex-based, weight=0 |
| 9-attributes (#7) | 2 features (pred/conf) | ✅ Running (coach lane) | Medium — regex-based, weight=0 |
| 24-styles (#9) | 2 features (pred/conf) | ✅ Hybrid conversion | Good — deterministic Tier 1 |
| pattern-extraction (#11) | 2 features (pred/conf) | ✅ Tightened | Good — contextual regexes |
| niche-keywords (#17) | 2 features (pred/conf) | ⛔ DISABLED | Always 0 |
| virality-matrix (#15) | 2 features (pred/conf) | ⛔ DISABLED | Always 0 |
| trend-timing | 2 features (pred/conf) | ⛔ NONEXISTENT | Always 0 |
| posting-time | 2 features (pred/conf) | ⛔ NONEXISTENT | Always 0 |
| gpt4 (#4) | 1 feature | ✅ Coach lane | Coach lane leakage |
| claude (#6) | 1 feature | ✅ Coach lane | Coach lane leakage |

**Effective feature coverage:** 26 of 42 features have real data. 8 features are always 0 (disabled components). 2 features are coach-lane leakage. 5 features are zeros (FFmpeg fields not produced by canonical analyzer: `has_faces`, `face_time_ratio`, `has_music`, `avg_volume`). Net: ~23 meaningful features available.

#### Step 3: Engineering Decision

**Verdict: DISABLE immediately. Rebuild from scratch when N >= 200 labeled videos.**

| Dimension | Assessment |
|---|---|
| Concept validity | **Strong** — the ONLY component that can empirically validate what predicts virality. Essential for the system's evolution from "LLM opinions" to "evidence-based prediction." |
| Current implementation | **Broken** — THREE model systems, all non-functional. v6: R²=0.0. v5-legacy: contaminated. v5-simplified: hand-tuned heuristic. None produce meaningful signal. |
| Is it unique? | **Yes** — the only supervised ML component. No other component learns from outcome data. |
| Architecture debt | **Critical** — 0.85 reliability inflates its weight in aggregation. Stale feature references to 4 disabled components. Coach-lane leakage (GPT-4/Claude scores feed into score-lane via XGBoost features). |
| New architecture fit | **Essential for Phase 2** — once 200+ labeled videos with clean deterministic features exist, XGBoost becomes the central learning component. Until then, it's dead weight. |
| Priority | **IMMEDIATE: Disable** (remove from active pipeline). **DEFERRED: Rebuild** (blocked on training data volume). |

##### Implementation Path: Disable (Immediate)

1. **Move `xgboost-virality-ml` to `disabledComponents` list** in `kai-orchestrator.ts` `loadComponentConfiguration()` (line ~340, alongside niche-keywords, feature-extraction, virality-matrix)
2. **Remove from `pattern_based` path component list** in both `kai-orchestrator.ts` and `system-registry.ts`
3. **Remove from `DEPENDENT_COMPONENTS` array** in `kai-orchestrator.ts` (line ~1485)
4. **Remove from `dependentOrder` array** in `kai-orchestrator.ts` (line ~1651)
5. **Set registry `defaultReliability` to 0.0** in `system-registry.ts` (line 224) — in case it's somehow re-enabled before rebuild
6. **Keep all code in place** — `executeXGBoostViralityML()`, `xgboost-virality-service.ts`, training scripts, model files. These are needed for the rebuild. Only disable routing.
7. **Keep the export pipeline** (`scripts/export-training-dataset.ts`) — it's correctly preparing data for future retraining

##### Implementation Path: Rebuild (When N >= 200 Labeled Videos)

1. **Prerequisites:**
   - 200+ rows in `prediction_runs` with `actual_dps IS NOT NULL` and `training_ready = true`
   - Auto-labeler running for 4-8 weeks with Apify metric collection
   - Spearman evaluator baseline established (current system without XGBoost)
2. **Feature vector v7 redesign:**
   - Drop 8 always-zero features (disabled component predictions)
   - Drop 2 coach-lane features (gpt4_score, claude_score) — LLM opinions should not leak into ML training
   - Add 13 prosodic features from Batch B (already in export pipeline)
   - Add audio-analyzer composite features (musicRatio, audioType)
   - Net: ~35 clean features (21 raw + 10 component + 4 prosodic/audio)
3. **Training protocol:**
   - Time-based split (oldest 80% train, newest 20% eval) — already implemented
   - Cross-validation with k >= 5 folds
   - Hyperparameter search with max_depth=2-4 (prevent overfitting)
   - Early stopping on eval set
   - Feature importance analysis to validate which upstream components actually predict DPS
4. **Acceptance criteria before re-enabling:**
   - Eval R² >= 0.15 (better than random)
   - Spearman ρ >= 0.3 (meaningful rank correlation)
   - XGBoost VPS must improve system Spearman ρ vs. system without XGBoost
   - Feature importance must NOT be dominated by a single feature (> 50%)
5. **Integration:**
   - Re-enable in `pattern_based` path
   - Set reliability based on eval performance (R² → reliability mapping)
   - Run A/B: system with vs. without XGBoost for 2 weeks
   - Graduate only if A/B shows improvement

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-02 | XGB-PHASE2 | Moved to Phase 2 (DEPENDENT_COMPONENTS) to read real component outputs | `kai-orchestrator.ts` | Phase 1 (ran before other components) | Phase 2 (reads real predictions) | ✅ |
| 2026-03-10 | XGB-ANALYSIS | Layer 5 deep-dive analysis complete — 9 findings documented | `docs/COMPONENT_DEEP_ANALYSIS.md` | Placeholder analysis | Full 3-step audit with evidence | ✅ |
| 2026-03-10 | XGB-DISABLE | XGBoost disabled — moved to disabledComponents, removed from all paths (pattern_based, quantitative, DEPENDENT_COMPONENTS, dependentOrder), reliability set to 0.0 | `kai-orchestrator.ts`, `system-registry.ts` | Active (noise-producing, reliability 0.85) | Disabled (reliability 0.0, not in any path) | ✅ |

#### Open Issues

| Issue ID | Description | Priority |
|---|---|---|
| XGB-001 | v6 R²=0.0 — adds noise, not signal | **Critical → DISABLE** |
| XGB-002 | Legacy model contaminated with post-pub metrics (views_count=73.9%) | Critical (historical — no production impact since v5-simplified runs) |
| XGB-003 | Needs 200+ clean labeled samples before rebuild | **Blocked** by training pipeline data volume |
| XGB-004 | Feature vector has 8 always-zero slots (disabled components) and 2 coach-lane leaks (gpt4/claude) | Medium (fix in v7 feature vector redesign) |
| XGB-005 | Reliability hardcoded at 0.85 despite R²=0.0 — inflates weight in aggregation | **Critical → set to 0.0 on disable** |
| XGB-006 | Python prediction subprocess has silent fallback to mean (53.77) on any error | Medium (masks failures — fix in v7) |
| XGB-007 | v5-simplified heuristic has no connection to trained model — arbitrary hand-tuned weights | Medium (historical — replaced entirely in v7) |
| XGB-008 | Export pipeline correctly maps 13 new prosodic features — ready for v7 | ✅ No action needed |
| XGB-009 | `getModelInfo()` reports fabricated correlation (0.85 for personal_finance, 0.61 for side_hustles) | Low (cosmetic — fix in v7) |

---

### Component 19: Unified Grading Rubric (Pack 1)

| Field | Value |
|---|---|
| **ID** | `unified-grading` |
| **Registry Type** | `qualitative` |
| **Registry Reliability** | 0.90 |
| **Registry Avg Latency** | 25,000ms |
| **API Dependency** | `GOOGLE_GEMINI_AI_API_KEY` (no fallback — returns failure) |
| **Target Category** | Coach lane (LLM-based coaching engine) |
| **Analysis Date** | 2026-03-09 |
| **Analyst** | Layer 4 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

Pack 1 is the richest content grading system: 9 attribute scores (1-10 each with evidence), 7 idea legos (boolean with notes), hook analysis (type, clarity score, pattern), pacing (score + evidence), clarity (score + evidence), novelty (score + evidence), grader confidence (0-1), and warnings. It's the primary coaching engine — the detailed feedback that tells creators EXACTLY what to improve.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding P1-001: Fully Gemini LLM-dependent.** `executeUnifiedGrading()` at `kai-orchestrator.ts:5234-5304` calls `runUnifiedGrading()` from `src/lib/rubric-engine/unified-grading-runner.ts`. Uses Gemini 2.5 Flash with a detailed rubric prompt. ~25 seconds execution.

**Finding P1-002: In coach lane — weight=0 for VPS.** Already in `COACH_LANE_COMPONENT_IDS`. Correct — LLM subjective grading should not influence VPS directly.

**Finding P1-003: Powers Pack 2 (Editing Coach) and partially powers Pack 3 (Viral Mechanics).**

Pack 2 requires Pack 1 output as input — `rubricResult = input.componentResults.find(r => r.componentId === 'unified-grading')`. If Pack 1 fails, Pack 2 fails.

Pack 3 reads Pack 1 features in 4 mechanic detectors: `detectCuriosityGap` (hook type/clarity), `detectOptimalPacing` (pacing score), `detectPatternInterrupt` (novelty score), `detectEmotionalTrigger` (attribute scores). Since Pack 3 IS in the score lane, this creates an **indirect Gemini → VPS path** (see CCI-L4-001).

**Finding P1-004: VPS estimate formula is reasonable but unused.** `vpsEstimate = avgScore * 10` (1-10 scale → 10-100). This prediction is stored but weight=0, so it doesn't matter.

**Finding P1-005: No fallback — hard failure without API key.** When `GOOGLE_GEMINI_AI_API_KEY` and `GOOGLE_AI_API_KEY` are both absent, returns `success: false`. This cascades: Pack 2 also fails, Pack 3 loses 4 of 9 mechanic detectors. The system degrades gracefully but loses its richest coaching output.

#### Step 3: Engineering Decision

**Verdict: Correct position in coach lane. Primary coaching engine. The indirect Gemini → Pack 3 → VPS path is a known issue but attenuated by thresholds and aggregation.**

| Dimension | Assessment |
|---|---|
| Concept validity | **Strong** — richest feedback in the system. 9 attributes + 7 legos + hook + pacing + clarity + novelty |
| Current implementation | Good — well-structured LLM prompt with retry/repair, Zod validation, proper error handling |
| Is it unique? | **Yes** — no other component provides this depth of structured coaching feedback |
| Architecture debt | **Medium** — indirect VPS influence through Pack 3, but attenuated. No fallback for coaching when API unavailable |
| New architecture fit | Primary coaching engine. Should NEVER directly influence VPS. |
| Priority | **Low** — correctly positioned. Indirect VPS path is a documentation issue, not a critical bug |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-09 | L3-P1 | Moved to coach lane (weight=0 for VPS) | `kai-orchestrator.ts` | VPS-contributing | Coach lane only | tsc clean |
| 2026-03-09 | L3-P2 | Removed from LLM_COMPONENT_IDS (was incorrectly included) | `kai-orchestrator.ts` | Treated as LLM evaluator in consensus gate | Correctly excluded from gate | tsc clean |

#### Open Issues

| Issue ID | Description | Priority |
|---|---|---|
| P1-006 | Pack 3 reads Pack 1 features → indirect Gemini influence on VPS (CCI-L4-001) | Medium |
| P1-007 | No fallback coaching when Gemini API key unavailable — Pack 2 also fails | Medium |

---

### Component 20: Editing Coach (Pack 2)

| Field | Value |
|---|---|
| **ID** | `editing-coach` |
| **Registry Type** | `qualitative` |
| **Registry Reliability** | 0.88 |
| **Registry Avg Latency** | 5,000ms |
| **API Dependency** | `GOOGLE_GEMINI_AI_API_KEY` (has rule-based fallback) |
| **Target Category** | Coach lane (LLM-based coaching) |
| **Analysis Date** | 2026-03-09 |
| **Analyst** | Layer 4 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

Pack 2 takes Pack 1's grading output → generates the top 3 most impactful improvement suggestions with estimated VPS lift per suggestion, plus a before/after VPS estimate. "If you fix your hook (suggestion 1), your VPS could go from 45 to 58."

#### Step 2: Reality — What Does The Code Actually Do?

**Finding P2-001: Hybrid — Gemini LLM with rule-based fallback.** `executeEditingCoach()` at `kai-orchestrator.ts:5311-5393`. First tries LLM-powered coaching via `runEditingCoach()`, falls back to `generateRuleBasedSuggestions()` if LLM fails or API key missing.

**Finding P2-002: In coach lane — weight=0 for VPS.** Already in `COACH_LANE_COMPONENT_IDS`. Correct.

**Finding P2-003: Hard dependency on Pack 1 output.** `rubricResult = input.componentResults.find(r => r.componentId === 'unified-grading')`. If Pack 1 didn't run or failed, Pack 2 returns `success: false` immediately. This is correct gating behavior.

**Finding P2-004: Rule-based fallback is functional.** When LLM fails, `generateRuleBasedSuggestions()` analyzes the Pack 1 rubric features to generate template-based suggestions. Less creative than LLM but still useful. `_meta.provider` correctly indicates `'rule-based-fallback'`.

**Finding P2-005: `predicted_after_estimate` is aspirational, not calibrated.** The "after" score assumes all suggestions are implemented perfectly. This is coaching output, not a prediction — appropriate for user display.

#### Step 3: Engineering Decision

**Verdict: Correct position. Pure coaching tool. Well-implemented with proper fallback. No VPS contribution.**

| Dimension | Assessment |
|---|---|
| Concept validity | **Strong** — actionable improvement suggestions are the most valuable coaching output |
| Current implementation | Good — LLM with rule-based fallback, proper dependency gating on Pack 1 |
| Is it unique? | **Yes** — the only component that generates specific, prioritized improvement actions |
| Architecture debt | **None** — coach lane, proper dependencies, fallback in place |
| Priority | **None** — correctly positioned |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-09 | L3-P1 | Moved to coach lane (weight=0 for VPS) | `kai-orchestrator.ts` | VPS-contributing | Coach lane only | tsc clean |
| 2026-03-09 | L3-P2 | Removed from LLM_COMPONENT_IDS (was incorrectly included) | `kai-orchestrator.ts` | Treated as LLM evaluator in consensus gate | Correctly excluded from gate | tsc clean |

#### Open Issues

*None — correctly positioned and implemented.*

---

### Component 21: Visual Rubric (Pack V)

| Field | Value |
|---|---|
| **ID** | `visual-rubric` |
| **Registry Type** | `qualitative` |
| **Registry Reliability** | 0.85 |
| **Registry Avg Latency** | 8,000ms |
| **API Dependency** | `GOOGLE_GEMINI_AI_API_KEY` (has fallback to rule-based only) |
| **Target Category** | Hybrid — 40% rule-based + 60% Gemini Vision |
| **Analysis Date** | 2026-03-09 |
| **Analyst** | Layer 4 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

Pack V grades visual quality across 5 dimensions: Visual Hook (first-frame impact), Pacing (cut rate, scene variety), Pattern Interrupts (visual novelty), Visual Clarity (lighting, composition), Style Fit (style-to-niche match). Each scored 1-10 with evidence. Overall visual score 0-100.

The concept is sound — visual quality is measurable and has real impact on viewer retention. When a video file is available, Gemini Vision provides genuine multimodal signal that no text-based component can match.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding PV-001: NOT in coach lane — contributes to VPS.** Pack V is NOT in `COACH_LANE_COMPONENT_IDS`, meaning it has full weight in the pattern_based path aggregation.

**Finding PV-002: The ONLY remaining Gemini → VPS path after Layer 3 fixes.**

After demoting the direct Gemini evaluator to coach lane (Prompt 1) and fixing the consensus gate (Prompt 2), Pack V is now the sole path through which Gemini LLM judgment influences VPS. The blend is 40% rule-based + 60% Gemini Vision when video is available. When transcript-only (no video), it's 100% rule-based.

| Scenario | Gemini Vision | Rule-Based | VPS Influence |
|---|---|---|---|
| Video file uploaded | 60% | 40% | Yes (Gemini influences VPS through Pack V) |
| Transcript-only | 0% | 100% | Yes (deterministic only, no Gemini) |
| No visual data at all | — | — | Returns stub (low confidence) |

**Finding PV-003: Comprehensive input mapping from 6 upstream components.**

`executeVisualRubric()` at `kai-orchestrator.ts:5401-5568` maps data from: FFmpeg (canonical analyzer), 24-styles, thumbnail-analyzer, visual-scene-detector, audio-analyzer, hook-scorer. The mapping is thorough with proper null handling (post-Batch A fixes). This is the most well-connected downstream component.

**Finding PV-004: Hardcoded confidence of 0.8 regardless of input quality.** Line 5549: `confidence: 0.8`. Should be dynamic — lower when fewer upstream signals are available, higher when video file provides rich data.

**Finding PV-005: Fallback to stub when no visual data.** When all 6 upstream components return no data, creates a stub with `confidence: 0.3`. Proper degradation.

#### Step 3: Engineering Decision

**Verdict: Correctly positioned. The one legitimate case for Gemini → VPS influence. Multimodal video analysis is genuinely unique signal. Minor fix: make confidence dynamic.**

| Dimension | Assessment |
|---|---|
| Concept validity | **Strong** — visual quality is measurable and impacts retention |
| Current implementation | Good — comprehensive input mapping, 40/60 hybrid blend, proper stub fallback |
| Is it unique? | **Yes** — the only component providing structured visual quality assessment |
| Architecture debt | **Low** — hardcoded confidence, otherwise clean |
| New architecture fit | Legitimate VPS contributor. Gemini Vision for video analysis is the correct use of LLM |
| Priority | **Low** — correctly positioned. Dynamic confidence is a minor improvement |

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-08 | VSD-001 | Pack V scene feature name mismatch fixed | `kai-orchestrator.ts` | `sceneChanges` not mapped to Pack V field | Correct mapping | tsc clean |
| 2026-03-08 | AUD-001 | Pack V `has_music` string vs number bug fixed | `kai-orchestrator.ts` | `energyLevel > 5` (always false) | `energyLevel === 'high' \|\| 'medium'` | tsc clean |
| 2026-03-08 | AUD-002 | Pack V volume scale bug fixed | `kai-orchestrator.ts` | 0-1 vs 0-100 mismatch | Correct scale normalization | tsc clean |
| 2026-03-08 | Batch B | Enhanced audio mapping — prosodic, pitch, speaking rate, music classification | `kai-orchestrator.ts` | Basic audio score only | 11 audio features mapped to Pack V | tsc clean |
| 2026-03-10 | PV-FIX-6 | Dynamic confidence based on upstream signal availability (PV-006) | `kai-orchestrator.ts` | Hardcoded `confidence: 0.8` | Dynamic: 0.3 base + video(+0.25) + ffmpeg(+0.15) + audio(+0.10) + scene(+0.10) + thumbnail(+0.05) + hook(+0.05), capped 0.95 | TypeScript verified |

#### Open Issues

| Issue ID | Description | Priority |
|---|---|---|
| ~~PV-006~~ | ~~Hardcoded confidence 0.8 — should be dynamic based on upstream signal availability~~ | ~~Medium~~ **FIXED 2026-03-10 (PV-FIX-6)** |
| PV-007 | Only remaining Gemini → VPS path — acceptable but should be documented and monitored | Low |

---

### Component 22: Viral Mechanics (Pack 3)

| Field | Value |
|---|---|
| **ID** | `viral-mechanics` |
| **Registry Type** | `qualitative` |
| **Registry Reliability** | 0.80 |
| **Registry Avg Latency** | 50ms |
| **API Dependency** | None (rule-based synthesis) |
| **Target Category** | Must be algorithmic |
| **Analysis Date** | 2026-03-09 |
| **Analyst** | Layer 4 Audit Session |

#### Step 1: Concept — What Should This Component Measure?

Pack 3 synthesizes signals from all other components to explain WHY a video should perform well. It detects up to 9 "viral mechanics": Visual Hook, Curiosity Gap, Style-Platform Fit, Optimal Pacing, Audio-Visual Sync, Trend Alignment, Pattern Interrupt, Emotional Trigger, Timing Advantage. Top 3 mechanics by strength are returned.

The concept is correct — explaining "why" is more valuable than just a number. "Your video has strong Visual Hook (80/100) and good Curiosity Gap (70/100)" is actionable feedback.

#### Step 2: Reality — What Does The Code Actually Do?

**Finding PM-001 (CRITICAL): `prediction = confidence * 100` — VPS is driven by signal availability, not content quality.**

`executeViralMechanics()` at `kai-orchestrator.ts:5576-5674`, line 5655: `prediction: result.confidence * 100`. The confidence formula in `viral-mechanics-runner.ts:115-121`:

```
baseConfidence = min(0.4 + (signalCount * 0.1) + (componentCount * 0.02), 0.95)
mechanicBoost = (avg_strength / 100) * 0.2
confidence = min(baseConfidence + mechanicBoost, 0.95)
```

With 4 signals (Pack1, Pack2, PackV, transcript) and ~12 successful components:
- signalCount=4 → +0.4
- componentCount=12 → +0.24
- baseConfidence = 0.4 + 0.4 + 0.24 = 1.04, capped to 0.95
- mechanicBoost = ~0.14
- confidence = 0.95 (capped)
- **prediction = 95 VPS**

Pack 3 produces ~80-95 VPS for virtually every prediction because confidence is driven by how many components ran, not how good the content is. A boring video with all components running scores 95 from Pack 3.

**Finding PM-002: Reads Pack 1 (Gemini) output — indirect Gemini → VPS path.**

Pack 3 reads Pack 1 features in 4 detectors:
- `detectCuriosityGap()`: reads `pack1.hook.type`, `pack1.hook.clarity_score`
- `detectOptimalPacing()`: reads `pack1.pacing.score`
- `detectPatternInterrupt()`: reads `pack1.novelty.score`
- `detectEmotionalTrigger()`: reads `pack1.attribute_scores` for emotional attributes

Since Pack 3 IS in the score lane, and Pack 1 is Gemini-powered, this creates a Gemini → Pack 1 → Pack 3 → VPS path. The influence is attenuated by thresholds (mechanics require strength >= 50/60) and by the confidence formula (mechanics add max 0.2 to confidence), but it exists.

**Finding PM-003: References 3 disabled components — dead code paths.**

| Mechanic Detector | References | Component Status |
|---|---|---|
| `detectTrendAlignment()` | `virality-matrix` | **DISABLED** (Layer 3 Prompt 1) |
| `detectTrendAlignment()` | `historical-analyzer` | Never existed in registry |
| `detectTimingAdvantage()` | `posting-optimizer` | Never existed in registry |
| `detectTrendAlignment()` | `trend-timing` | Disabled (empty historical path) |

These detectors will never fire because their source components don't run. The code is harmless but misleading.

**Finding PM-004: Rule-based synthesis is well-structured.** The 9 mechanic detectors are clean, readable, and correctly gate on threshold strengths. The summary generator is concise. The `limited_signal_mode` flag correctly indicates when analysis is constrained.

**Finding PM-005: Mechanic strength thresholds are reasonable but untested against real data.** Visual Hook >= 50, Curiosity Gap >= 50, Style Fit >= 40, Optimal Pacing >= 60, Audio Sync >= 50, Trend >= 50, Pattern Interrupt >= 60, Emotional >= 60, Timing >= 50. These are arbitrary thresholds — no empirical basis.

#### Step 3: Engineering Decision

**Verdict: CRITICAL FIX NEEDED — confidence-as-VPS formula guarantees high scores for every prediction. Must be decoupled from component count.**

| Dimension | Assessment |
|---|---|
| Concept validity | **Strong** — explaining "why" is genuinely valuable |
| Current implementation | **Broken VPS formula** — measures signal availability, not content quality. Indirect Gemini path. Dead component references. |
| Is it unique? | **Yes** — the only component that synthesizes cross-component signals into explainable mechanics |
| Architecture debt | **High** — confidence-as-VPS inflates every prediction; dead references to disabled components |
| New architecture fit | Should be coaching-primary. VPS prediction should be based on mechanic strengths, not signal count |
| Priority | **CRITICAL** — highest priority fix in Layer 4. Every prediction gets ~80-95 VPS from Pack 3 regardless of quality |

**Implementation path:**
1. **Decouple VPS from confidence.** Replace `prediction = confidence * 100` with a content-quality formula based on mechanic strengths: `prediction = topMechanics.length > 0 ? avgStrength : 40`
2. **Remove dead component references** — remove virality-matrix, historical-analyzer, posting-optimizer, trend-timing from detectors
3. **Consider moving to coach lane** — Pack 3's value is in explaining WHY (coaching), not in predicting VPS. The "prediction" field should either be meaningful or the component should be coach-lane

#### Fix Log

| Date | Fix ID | Description | Files Changed | Before | After | Verified |
|---|---|---|---|---|---|---|
| 2026-03-10 | PM-FIX-1 | VPS formula: confidence*100 → mechanic-strength-based (PM-001) | `kai-orchestrator.ts` | `prediction: result.confidence * 100` — always 80-95 | `prediction = avgStrength` (>=2 mechanics) or `min(avgStrength, 40)` (<2 mechanics) | TypeScript verified |
| 2026-03-10 | PM-FIX-2 | Removed dead component refs from detectors (PM-003) | `viral-mechanics-runner.ts` | `detectTrendAlignment` refs virality-matrix, historical-analyzer, trend-timing; `detectTimingAdvantage` refs posting-optimizer | Both return null with comments explaining why — no active data sources | TypeScript verified |

#### Open Issues

| Issue ID | Description | Priority |
|---|---|---|
| ~~PM-001~~ | ~~`prediction = confidence * 100` → always 80-95 VPS regardless of content quality~~ | ~~Critical~~ **FIXED 2026-03-10 (PM-FIX-1)** |
| PM-002 | Reads Pack 1 (Gemini) output → indirect Gemini → VPS influence | Medium |
| ~~PM-003~~ | ~~References 3-4 disabled/nonexistent components — dead code paths~~ | ~~Low~~ **FIXED 2026-03-10 (PM-FIX-2)** |
| PM-006 | Mechanic strength thresholds are arbitrary — no empirical validation | Strategic |

---

## Section 23: Cross-Component Issues (System-Level)

These issues span multiple components and cannot be attributed to a single component.

| Issue ID | Description | Components Affected | Priority |
|---|---|---|---|
| SYS-001 | Consensus gate includes 7 component IDs instead of 3 qualitative evaluators | gpt4, gemini, claude, unified-grading, editing-coach, 9-attributes, 7-legos | Critical |
| SYS-002 | Gemini double-counting — qualitative path + Pack 1/2/V | gemini, unified-grading, editing-coach, visual-rubric | Critical |
| SYS-003 | Rule 4 compresses all predictions into 35-60 range — VPS > 60 gets 15-25% reduction | All components (output stage) | Critical |
| SYS-004 | Documented weights (35/25/25/15) don't match registry (15/25/45/15) or effective (~15/15/70/0) | All components (aggregation) | Critical |
| SYS-005 | Historical dimension entirely disabled — H1 and H2 contribute 0% | historical (disabled) | Medium |
| SYS-006 | 73.2% accuracy claim is hardcoded mock data in `src/app/admin/operations/page.tsx` line 104 | None (UI only) | High |
| SYS-007 | Theoretical prediction ceiling ρ ≈ 0.63 for content-only — 80% unreachable | All (strategic) | Strategic |
| SYS-008 | All LLM evaluators share training data biases — correlated errors | gpt4, gemini, claude, unified-grading | Strategic |
| CCI-001 | **Primary Workflow Dead Zone:** All three visual/audio components (#12, #13, #14) require `videoPath` which is absent in the primary `/admin/upload-test` workflow (transcript-only). All three return `success: false` immediately. Pack V receives zero upstream data and falls back to rule-based-only mode. These components only fire on TikTok URL download path. | audio-analyzer, visual-scene-detector, thumbnail-analyzer | Critical |
| ~~CCI-002~~ | ~~Pack V feature name mismatches ALL FIXED: VSD-001 (sceneChanges mapping), AUD-001 (energyLevel string comparison), AUD-002 (volumeVariance scale)~~ | — | ~~Critical~~ **FIXED** |
| CCI-003 | **Hook Scorer / Pattern Extraction Overlap:** Both components scan transcript text for overlapping patterns (curiosity triggers, story markers, claim language). Same linguistic features get counted twice in VPS. Hook scorer checks first 8 words; pattern extraction checks full transcript. Need to deduplicate or explicitly partition their territories. | hook-scorer, pattern-extraction | High |
| CCI-004 | **Layer 1 Signals Not Wired to Layer 2:** Batch B created 27+ prosodic metrics, 11 speaking rate metrics, and sound classification. None of these feed into hook-scorer (which carries 45% of Quality Gate), pattern-extraction, or 24-styles. The pipeline has rich audio intelligence that its most important components can't see. | hook-scorer, pattern-extraction, 24-styles | Critical |
| CCI-005 | **Duplicate Systems Everywhere:** Feature extraction has 3 systems (106-feature, 152-feature, enhanced). Pattern extraction has 2 systems (orchestrator inline vs. pattern-extraction-service). Hook scoring has 2 modes (regex vs. unused LLM). Each name collision creates architectural confusion and makes it unclear which is the "real" one. | feature-extraction, pattern-extraction, hook-scorer | Medium |
| CCI-006 | **Generic Transcript Inflation:** Pattern extraction scores generic English text at 65-75 due to overly broad regexes ("when", "but", "get", "like"). Combined with near-constant FFmpeg visual score (now fixed in Layer 1) and the calibrator's Rule 4 compression, VPS scores cluster in the 50-65 range for all content regardless of quality. | pattern-extraction, calibrator | High |
| CCI-L3-001 | **Consensus Gate Treats 7 Components as "LLM" — Should Be 3.** `LLM_COMPONENT_IDS` includes `{gpt4, gemini, claude, unified-grading, editing-coach, 9-attributes, 7-legos}`. The 4 extra components (Pack 1, Pack 2, 9-attributes, 7-legos) are not direct LLM evaluators — they're downstream consumers of Gemini. Including them in the spread computation guarantees the spread always exceeds the 10-point threshold (runtime: spread=36.0 from min=61 to max=97). **The consensus gate fires on EVERY prediction**, effectively zeroing LLM influence always rather than only when LLMs disagree. | gpt4, gemini, claude, unified-grading, editing-coach, 9-attributes, 7-legos | **Critical** |
| CCI-L3-002 | **Qualitative Path Retains Stale VPS After Consensus Gate Fires.** When the gate zeros all LLM weights within a path, `totalWeight` becomes 0. The fallback `path.aggregatedPrediction = totalWeight > 0 ? weightedSum/totalWeight : path.aggregatedPrediction` preserves the PRE-GATE value. The qualitative path (100% LLM components) keeps its inflated VPS=90.4 even though all its component weights were set to 0. This 90.4 then enters the final weighted average with 25% path weight, meaning **LLM influence is NOT actually zeroed — it leaks through the stale fallback.** Runtime evidence: raw score 74.2 despite `llm_influence_applied: false`. | qualitative path, consensus gate | **Critical** |
| CCI-L3-003 | **Gemini Score Inflation via Scoring Guidelines.** `VIRAL_SCORING_GUIDELINES` in `gemini-service.ts` lines 19-70 enforce minimum scores: question/bold statement → min 55, curiosity gaps → min 60, emotional triggers → min 65, value+hook+CTA → min 70. Combined with execution quality additive adjustment (+12 for score 9/10), Gemini routinely scores 85-97 for ordinary content. Runtime: Gemini=97 vs. deterministic components averaging 33-75 for the same video. | gemini, gemini-service.ts | **Critical** |
| CCI-L3-004 | **Gemini Weight Boosts Override Ensemble Balance.** Three separate Gemini boosts: (1) 2.5x in pre-gate aggregation (line 1413), (2) 3x in disagreement reconciliation (line 2067), (3) confidence boost for video analysis (+0.1, line 3507). These are designed to privilege Gemini as "the most accurate differentiator" but have no empirical basis (learned reliability: 46.0%, avg error 32.5 VPS — worse than Claude's 60.3%). | gemini, kai-orchestrator.ts | **High** |
| CCI-L3-005 | **Virality Matrix Mislabeled as LLM-Dependent.** CLAUDE.md, documentation, and registry `apiDependency: 'OPENAI_API_KEY'` all claim Virality Matrix uses OpenAI. The actual implementation (`src/lib/components/virality-matrix.ts`) is 100% regex/heuristic with zero API calls. This is not in `LLM_COMPONENT_IDS` so the consensus gate doesn't touch it, but it creates confusion in architecture discussions. | virality-matrix, system-registry.ts, CLAUDE.md | **Medium** |
| CCI-L3-006 | **Three Transcript-Only LLM Evaluators Provide Correlated, Not Independent, Signal.** GPT-4 (gpt-4o-mini), Gemini (transcript fallback mode), and Claude (claude-3-haiku) all receive the same input (transcript text) and answer the same question ("rate viral potential 0-100"). Their subdimensions are discarded — only the single score matters. Academic ensemble learning requires diverse signal sources; three LLMs reading the same text provide at most ~1.3 effective independent observations (based on typical inter-LLM correlation of 0.7-0.8). Only Gemini's video mode provides genuinely unique multimodal signal. | gpt4, gemini, claude | **Strategic** |
| CCI-L3-007 | **Pre-Gate Aggregation Computed Then Immediately Overwritten.** The path aggregation at lines 1382-1427 (with Gemini 2.5x boost, GPT-4 1.2x boost, extreme-score 1.5x boost) is computed, logged, then immediately overwritten by the consensus gate re-aggregation (lines 1878-1933). The pre-gate aggregation is wasted computation — except when it leaks through CCI-L3-002's fallback bug. | kai-orchestrator.ts | **Low** |
| CCI-L4-001 | **Indirect Gemini → VPS Path Through Pack 3.** Pack 1 (Gemini LLM) is in coach lane (weight=0), but Pack 3 reads Pack 1 features in 4 mechanic detectors (curiosity gap, pacing, pattern interrupt, emotional trigger). Pack 3 IS in the score lane. This creates a Gemini → Pack 1 → Pack 3 → VPS path. The influence is attenuated by threshold gating (mechanics need strength >= 50-60) and the confidence formula, but it exists. | unified-grading, viral-mechanics | **Medium** |
| ~~CCI-L4-002~~ | ~~**Pack 3 VPS = Signal Availability, Not Content Quality.** `prediction = confidence * 100` where confidence is driven by `signalCount * 0.1 + componentCount * 0.02`. Always 80-95 VPS.~~ | viral-mechanics | ~~Critical~~ **FIXED 2026-03-10 (PM-FIX-1)** — VPS now based on avg mechanic strength |
| ~~CCI-L4-003~~ | ~~**Virality Indicator VPS Floor of 60.** All 6 factors start at 50, only add bonuses. Minimum indicator = 50, mapped via `25 + (50 * 0.70)` = 60 VPS.~~ | virality-indicator | ~~Critical~~ **FIXED 2026-03-10 (VIR-FIX-2/3/4/5)** — factors rebased to 30, penalties added, timing removed, direct pass-through |
| ~~CCI-L4-004~~ | ~~**Three Components Reference Disabled/Nonexistent Components.** Pack 3 `detectTrendAlignment()` and `detectTimingAdvantage()` referenced 4 dead components.~~ | viral-mechanics | ~~Low~~ **FIXED 2026-03-10 (PM-FIX-2)** — dead refs removed, detectors return null |
| CCI-L4-005 | **Coach Lane Components Still Run and Consume Resources.** 9-attributes (~5ms), 7-legos (~10ms), Pack 1 (~25s Gemini API), Pack 2 (~5s Gemini API + rule-based), GPT-4 (~2s API + $0.001), Claude (~2.5s API + $0.001). Combined coach lane cost: ~35s latency + 2 LLM API calls. This is fine for coaching, but if the coaching UI isn't displayed, these are wasted resources. | 9-attributes, 7-legos, unified-grading, editing-coach, gpt4, claude | **Strategic** |
| CCI-L5-001 | **XGBoost Adds Noise With 0.85 Reliability Weight.** v5-simplified heuristic returns ~40-60 VPS for all inputs. Reliability 0.85 gives it significant influence in pattern_based path weighted average (which has weight 0.45 of final VPS). This noise propagates through score-lane VPS calculation. | xgboost-virality-ml, kai-orchestrator | **Critical → DISABLE** |
| CCI-L5-002 | **Coach Lane Leakage Into Score Lane Via XGBoost.** GPT-4 and Claude predictions (coach lane, weight=0) feed into XGBoost feature vector as `gpt4_score` and `claude_score`. When XGBoost runs, these LLM opinions re-enter the score lane through a side channel, bypassing the coach lane isolation. | xgboost-virality-ml, gpt4, claude | **Medium → drops when XGBoost disabled** |
| CCI-L5-003 | **8 Ghost Feature Slots in XGBoost.** Feature map references niche-keywords, virality-matrix, trend-timing, posting-time (all disabled/nonexistent). These always-zero features waste capacity and may confuse the model if ever retrained without cleaning the feature vector. | xgboost-virality-ml | **Medium → fix in v7 feature vector** |
| CCI-L5-004 | **Aggregation Pipeline Mixes Heuristic "ML" With Real Measurements.** XGBoost's v5-simplified heuristic (hand-tuned weighted average of 14 features) is treated as a quantitative ML signal in the same path as real algorithmic components (hook-scorer, pattern-extraction, virality-indicator). The path aggregation doesn't distinguish between data-driven and opinion-driven components. | kai-orchestrator | **Strategic — architectural** |
| CCI-L5-005 | **Silent Failure Mode Returns Constant Prediction.** When Python subprocess fails (missing deps, file not found, any exception), `predict-xgboost.py` returns `prediction: 53.77` with no error signal. The TypeScript caller receives a valid-looking prediction. Could run broken for months. | predict-xgboost.py, xgboost-virality-service.ts | **Medium → drops when XGBoost disabled** |

---

## Section 24: Onboarding & Context Layer

The onboarding system is not a prediction component but a **context provider** that feeds the prediction pipeline. Tracked here for completeness.

### Subsystems

| Subsystem | File | Status | What It Provides |
|---|---|---|---|
| Calibration Scorer | `src/lib/onboarding/calibration-scorer.ts` | ✅ Complete | 6-dimension quality discernment scores from swipe decisions |
| Calibration Video Pool | `src/lib/onboarding/calibration-video-pool.ts` | ✅ Complete | 160 videos (8 per niche × 20 niches), some placeholders |
| Calibration DB | `src/lib/onboarding/calibration-db.ts` | ✅ Complete | Save/load calibration profiles to Supabase |
| Delivery Analyzer | `src/lib/onboarding/delivery-analyzer.ts` | ✅ Complete | WPM, speaking rate variance, energy, silence ratio (FFmpeg + Gemini) |
| Delivery Baseline | `src/lib/onboarding/delivery-baseline.ts` | ✅ Complete | Browser-safe type + scoring function |
| Creator Stage | `src/lib/onboarding/creator-stage.ts` | ✅ Complete | 5-dimension creator classification |
| Creator Context | `src/lib/prediction/creator-context.ts` | ✅ Complete | Channel data, patterns, story for personalized predictions |

### How Onboarding Feeds Prediction

| Onboarding Output | Pipeline Integration Point | Current Status |
|---|---|---|
| DeliveryBaseline | `prediction-calibrator.ts` — delivery score < 30 triggers -8 VPS penalty | ✅ Connected |
| CalibrationProfile | Not yet integrated — deferred per D6 | 🔲 Future |
| CreatorContext | `/api/creator/predict` route (separate from `/api/kai/predict`) | ✅ Connected |
| CreatorStage | Viral studio routes creators by stage | ✅ Connected (UI only) |

---

## Revision History

| Date | Change | Author |
|---|---|---|
| 2026-03-07 | Document created. Component 1 (FFmpeg) fully analyzed. Components 2-22 templated with known findings pre-populated. System-level issues documented. Onboarding layer documented. | Audit Session |
| 2026-03-07 22:00 EST | **Strategy Decision:** Option C adopted — analyze in dependency layers, fix layer by layer. 5 layers defined (Foundation → Feature & Pattern → LLM Evaluators → Packs & Synthesis → Aggregation) + Dead components. Layer 1 analysis in progress (1/5 components complete). | Audit Session |
| 2026-03-07 22:30 EST | Component 2 (Whisper) fully analyzed. Key finding: orchestrator's whisper component is dead code (128 lines) — real transcription happens in `transcription-pipeline.ts` before the orchestrator runs. Reclassified from "Must be algorithmic" → "Infrastructure". Transcription pipeline itself is well-designed. Layer 1 progress: 2/5 components complete. | Audit Session |
| 2026-03-07 23:15 EST | Component 2 (Whisper) rewritten to match Component 1 depth — added implementation path (5 steps), expected difficulty/impact assessment, summary verdict table, richer evidence in findings (side-by-side comparison of duplicates, cascade failure math, verbose_json opportunity). Added WSP-005 for future risk. | Audit Session |
| 2026-03-08 | **Layer 1 Analysis Complete (5/5).** Components 12 (Audio Analyzer), 13 (Visual Scene Detector), 14 (Thumbnail Analyzer) fully analyzed. Major cross-component finding: all three require `videoPath` and are dead in the primary workflow (CCI-001). Visual-scene-detector has `Math.random()` text detection (VSD-003) and complete Pack V feature name mismatch (VSD-001). Audio-analyzer has type/scale bugs that corrupt Pack V data (AUD-001, AUD-002). Thumbnail-analyzer is the most functional of the three — real signalstats analysis. Two new system-level issues: CCI-001 (primary workflow dead zone), CCI-002 (Pack V feature mapping failures). Layer 1 ready for batch fix phase. | Audit Session |
| 2026-03-08 | **Batch A, Prompt 1: Remove broken/dead code from Layer 1 Foundation.** 4 fixes applied: VSD-002 (fake cut constant → 0 stub), VSD-003 (Math.random text detection → false stub), VSD-004 (hardcoded brightness → 0), WSP-001 (128 lines dead Whisper code removed from orchestrator, registry execute stubbed). WSP-004 resolved as side effect. Verified: tsc clean (no new errors), zero `Math.random` in components/, zero `executeWhisper`/`transcribeVideoWithWhisper` methods in orchestrator. | Batch A Fix Session |
| 2026-03-08 | **Batch A, Prompt 2: Consolidate FFmpeg + implement real features.** Created `ffmpeg-canonical-analyzer.ts` — single source of truth with 3 FFmpeg invocations (ffprobe, signalstats, scene filter). All 6 placeholder features now real: scene_changes, cuts_per_second, brightness_avg, contrast_score, color_variance, avg_motion. Added hook_scene_changes. Rewired orchestrator executeFFmpeg() to use canonical analyzer. Replaced calculateVisualScore() near-constant formula with multi-factor scoring. Deprecated 3 old files (not deleted). FFM-001 partial, FFM-002 fixed, FFM-003 fixed. Also resolved 5 pre-existing TS errors in orchestrator (is_portrait, hook_scene_changes, etc.). | Batch A Fix Session |
| 2026-03-08 | **Batch A, Prompt 3: Rewire Components 12/13/14 + fix Pack V mappings.** 3 Pack V mapping fixes: VSD-001 (scene field names), AUD-001 (energyLevel string comparison), AUD-002 (volumeVariance scale). Rewired visual-scene-detector to use canonical analyzer (zero own FFmpeg calls). Rewired thumbnail-analyzer to use canonical analyzer (removed raw exec + temp file logic, colorfulness now uses real SATAVG). Audio-analyzer unchanged (volumedetect/silencedetect is different analysis than canonical). CCI-002 fully resolved. Components 13/14 now have `buildResult()` for reuse when canonical data already available. | Batch A Fix Session |
| 2026-03-08 | **Batch A, Prompt 4: Whisper verbose_json + Layer 1 verification.** WSP-003 fixed: Whisper switched to `verbose_json` format — native segment-level confidence (`avg_log_prob` → `Math.exp()` 0-1 scale), `no_speech_prob`, detected language. Heuristic confidence replaced with native confidence in transcription-pipeline.ts (heuristic kept as fallback). Native confidence propagated through `runPredictionPipeline.ts` → `prediction-calibrator.ts` (`noSpeechProbability` field). THM-007 upgraded: thumbnail confidence now dynamic (0.8/0.5/0.3) based on signalstats data availability instead of hardcoded. Full verification: tsc clean (zero new errors), 274 tests pass (123 failures all pre-existing). **Layer 1 Foundation: BATCH A COMPLETE.** | Batch A Fix Session |
| 2026-03-08 | **Batch B, Prompt 1: Prosodic analysis engine.** Created `src/lib/services/audio-prosodic-analyzer.ts` — standalone measurement engine for 3 prosodic signal categories: Volume Dynamics (ebur128 → 8 metrics + time series), Pitch Analysis (pitchfinder YIN F0 detection → 9 metrics + time series, spectral centroid fallback), Silence Patterns (silencedetect temporal segments → 10 metrics + pattern classification). All metrics include hook-period analysis (first 3s vs rest). Added `pitchfinder` dependency. Not yet wired into audio-analyzer or orchestrator. tsc clean (zero new errors). | Batch B Session |
| 2026-03-08 | **Batch B, Prompt 2: Speaking rate + sound intelligence.** Part A: Created `src/lib/services/speaking-rate-analyzer.ts` — computes actual WPM per Whisper verbose_json segment (12 metrics: overallWpm, variance, stddev, acceleration slope, hookWpm ratio, pace classification). Parts B1+B3: Created `src/lib/services/audio-classifier.ts` — music/speech classification via FFmpeg astats energy variance + audio fingerprinting via spectral centroid hashing. Part B2: Created `supabase/migrations/20260308_sound_metadata.sql` — adds sound_id, sound_name, sound_author, is_original_sound, audio_fingerprint to scraped_videos. Finding: Apify scraper already extracts musicMeta (musicId, musicName, musicAuthor, isOriginal) from TikTok API but stores only music_title/music_artist in scraped_videos; new columns add proper indexed fields. tsc clean (zero new errors). | Batch B Session |
| 2026-03-08 | **Batch B, Prompt 3: Integration, wiring, and verification.** 7 tasks completed: (1) Enhanced audio-analyzer to call prosodic analyzer + sound classifier/fingerprinter in parallel, added `prosodic`, `speakingRate`, `soundProfile` fields to `AudioAnalysisResult`, scoring now incorporates volume dynamics (+0-5), pitch expressiveness (+0-5), silence pattern (rhythmic +1, front-loaded -2), speaking rate dynamics (+2), music+speech combo (+1). (2) Wired speaking rate from Whisper: added `whisperSegments` to `TranscriptionResult`, computed `analyzeSpeakingRate()` in `runPredictionPipeline.ts` after transcription, passed via `speakingRateData` on `VideoInput` to orchestrator. (3) Updated Pack V audio mapping: `has_music` now uses `musicRatio > 0.3`, `beat_aligned` uses silence pattern, `audio_visual_sync` uses `loudnessRateOfChange`; added `pitch_variance`, `speaking_rate_variance`, `volume_dynamics_score`. (4) Added 13 prosodic features to training export (supplementary for v6 XGBoost). (5) Renamed `toDPS()` → `toPrediction()` across 6 component files + all orchestrator callers. (6) Verification: zero new TS errors, 273/397 tests pass (124 fail, all pre-existing), zero `static toDPS` remaining in components, all new modules importable. (7) Updated tracking docs. Audio analyzer now measures: volume (mean, max, variance, temporal dynamics, hook loudness, peak count), pitch (range, variance, contour slope, F0, hook ratio), silence (ratio, pattern, temporal map, hook silence, gap statistics), speaking rate (WPM mean/variance/acceleration, hook pace, category), sound profile (music/speech ratio, type classification, fingerprint). | Batch B Session |
| 2026-03-08 | **Layer 2 Analysis Complete (4/4).** Components 3 (Feature Extraction), 9 (24-Styles), 10 (Hook Scorer), 11 (Pattern Extraction) fully analyzed. **Headline findings:** (1) Feature Extraction runs 60s for zero VPS contribution — THREE separate dead systems, none feeding anything. (2) Hook Scorer is the MOST IMPORTANT component (45% of Quality Gate) but the LEAST SOPHISTICATED — 4 of 10 hook types, 1.7pt variance, no audio/visual signals, word-count timing instead of Whisper timestamps, unused LLM upgrade. (3) 24-Styles was re-enabled with GPT-4o-mini (NOT hardcoded anymore) but is another correlated LLM call with empirically unvalidated viralWeights. (4) Pattern Extraction uses 10 regexes so broad they match common English — generic transcripts score 65-75. **4 new cross-component issues:** CCI-003 (hook/pattern overlap), CCI-004 (Layer 1 signals not wired to Layer 2), CCI-005 (duplicate systems everywhere), CCI-006 (generic transcript inflation). Layer 2 ready for batch fix phase — hook-scorer upgrade is the highest-leverage fix in the entire system. | Layer 2 Audit Session |
| 2026-03-09 | **Layer 3 Analysis Complete (4/4).** Components 4 (GPT-4), 5 (Gemini), 6 (Claude), 15 (Virality Matrix) fully analyzed with runtime evidence from a real prediction run (video file + transcript, side-hustles niche). **Headline findings:** (1) **Gemini is TRIPLE-counted** — direct evaluator (qualitative path) + Pack 1/unified-grading + Pack V/visual-rubric, all gemini-2.5-flash. Combined ~18-28% VPS influence. Runtime: Gemini=97, Pack1=74, PackV=59. (2) **Consensus gate ALWAYS fires** — 7 components in LLM_COMPONENT_IDS (should be 3), spread always >10 (runtime: 36.0). (3) **Qualitative path leaks stale VPS=90.4** through fallback bug (CCI-L3-002). (4) **Gemini scoring guidelines inflate scores** via floor rules + additive execution quality boost (runtime: +12 for 9/10). (5) **Virality Matrix is NOT LLM-dependent** — 100% regex, mislabeled. (6) **GPT-4/Claude are transcript-only duplicates** of each other. 7 new cross-component issues (CCI-L3-001 through CCI-L3-007). Recommendations: Gemini as sole VPS evaluator (fix inflation), GPT-4/Claude to coach lane, disable VM, fix consensus gate. | Layer 3 Audit Session |
| 2026-03-09 | **Layer 3 Batch Fixes Complete (3 Prompts).** Prompt 1: GPT-4/Claude demoted to coach lane, Virality Matrix disabled, coach lane weight=0 in both aggregation loops. Prompt 2: LLM_COMPONENT_IDS reduced 7→3, stale fallback bug fixed (CCI-L3-002), Gemini 2.5x/GPT-4 1.2x/3x qualitative boosts all removed. Prompt 3: Gemini scoring guidelines rewritten (all 5 floor rules removed), execution quality additive→multiplicative (×0.90 to ×1.10), fallback scores fixed (60→45, 55→0). 14 total edits across kai-orchestrator.ts, gemini-service.ts, system-registry.ts. Zero new TS errors. | Layer 3 Fix Session |
| 2026-03-09 | **Layer 4 Analysis Complete (7/7).** Components 7 (9-Attributes), 8 (7-Legos), 16 (Virality Indicator), 19 (Pack 1), 20 (Pack 2), 21 (Pack V), 22 (Pack 3). **Headline findings:** (1) Components 7, 8, 19, 20 correctly in coach lane — no VPS contribution, good coaching output. (2) **Virality Indicator has VPS floor of 60** — all 6 factors start at 50, bonus-only scoring, same inflation class as Gemini floors (fixed in L3). (3) **Pack 3 always produces 80-95 VPS** — `prediction = confidence * 100` where confidence is driven by signal count, not content quality. (4) **Pack V is the only remaining Gemini → VPS path** — legitimate (multimodal video analysis). (5) Indirect Gemini → Pack 1 → Pack 3 → VPS path exists but is attenuated. 5 new cross-component issues (CCI-L4-001 through CCI-L4-005). **Two critical fixes needed:** VIR-002 (VI VPS floor) and PM-001 (Pack 3 confidence-as-VPS). | Layer 4 Audit Session |
| 2026-03-10 | **Vision Notation Added.** "Cultural Intelligence System" / "Brief Generator" concept documented as future ENHANCEMENT (not replacement). VPS stays as Quality Gate for "The Pulse." Briefs added as premium "Opportunity Engine." "Lift over baseline" replaces absolute virality prediction. See chat transcript `00b0801d-0e33-4b96-856f-52ec9ec5ec98`. Layer 4 batch fixes proceeding. | Documentation Update |
| 2026-03-10 | **Layer 5 Analysis Complete (2/2).** Component 18 (XGBoost Virality ML) and Component 17 (Niche Keywords) fully analyzed. **XGBoost findings (9):** THREE model systems all broken — v6 R²=0.0 (27 samples, text_avg_word_length=42.4%), legacy contaminated (views_count=73.9%), v5-simplified is hand-tuned heuristic masquerading as ML (hardcoded FEATURE_IMPORTANCE, range [20,85]). Feature vector 50% zeros (8 disabled components) + coach-lane leakage (gpt4/claude). Python fallback silently returns 53.77. Reliability hardcoded 0.85 inflates aggregation weight. Export pipeline ready with 13 prosodic features for v7. **Verdict: DISABLE immediately, rebuild when N≥200.** Niche Keywords confirmed dead — permanently disabled, duplicated by 24-styles+pattern-extraction, ghost feature slots in XGBoost. 5 new cross-component issues (CCI-L5-001 through CCI-L5-005). | Layer 5 Audit Session |
