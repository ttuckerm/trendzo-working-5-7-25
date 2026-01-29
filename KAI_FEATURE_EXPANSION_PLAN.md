# Kai Feature Expansion Plan

## Current State
- **119 text-only features** ([models/feature-names.json](models/feature-names.json))
- XGBoost model trained on 152 videos
- Test R²: 0.94 (on same dataset - not validated on new videos)

## Proposed Expansion

### 1. FFmpeg Visual Features (+8 features)
**Source:** [src/lib/services/ffmpeg-service.ts:37-50](src/lib/services/ffmpeg-service.ts#L37-L50)

New features:
- `video_width` (pixels)
- `video_height` (pixels)
- `video_fps` (frames per second)
- `video_bitrate` (kbps)
- `video_aspect_ratio_numeric` (e.g., 0.5625 for 9:16)
- `video_has_audio` (0/1)
- `video_total_frames` (count)
- `video_codec_h264` (0/1, one-hot for codec type)

**Total: 119 + 8 = 127 features**

### 2. Video Style Classification (+26 features)
**Source:** [src/lib/frameworks/video-styles-24.ts](src/lib/frameworks/video-styles-24.ts) (actually 26 styles)

**Challenge:** Need to CLASSIFY which style first (separate ML model)

**Simpler approach:** One-hot encoding
- `style_talking_head` (0/1)
- `style_screen_recording` (0/1)
- ... (26 total)

**Total: 127 + 26 = 153 features**

### 3. Growth Framework Detection (+61 features)
**Source:** [src/lib/frameworks/social-media-growth-framework-v2-august-2025.md](src/lib/frameworks/social-media-growth-framework-v2-august-2025.md)

**Challenge:** 61 frameworks are QUALITATIVE strategies (markdown text, not code)

**Would need:**
- Manual tagging of training videos with which frameworks they use OR
- LLM-based detection (expensive, slow)

**Proposed:** Skip for MVP, add later

**Total: Still 153 features**

### 4. Nine Attributes Scoring (+9 features)
**Source:** [frameworks-and-research/POC Research & Framework Data/Framework- Nine Attributes Framework for Viral Content 8-31-25.md](frameworks-and-research/POC Research & Framework Data/Framework- Nine Attributes Framework for Viral Content 8-31-25.md)

Each attribute = 0-100 score:
- `attr_tam_resonance`
- `attr_sharability`
- `attr_hook_strength`
- `attr_format_innovation`
- `attr_value_density`
- `attr_pacing_rhythm`
- `attr_curiosity_gaps`
- `attr_emotional_journey`
- `attr_cta_effectiveness`

**Challenge:** Need scoring algorithm or LLM to calculate these

**Total: 153 + 9 = 162 features**

### 5. Seven Idea Legos (+? features)
**Source:** [src/lib/services/pre-content/idea-legos-extractor.ts:21-44](src/lib/services/pre-content/idea-legos-extractor.ts#L21-L44)

7 Legos are TEXT (topic, angle, hook structure, story structure, visual format, key visuals, audio)

**Challenge:** Can't put text in XGBoost directly

**Options:**
1. Skip (LLM already does qualitative analysis in GPT refinement)
2. Feature engineer binary flags (e.g., `has_problem_solution_story`: 0/1)
3. Use text embeddings (adds 384+ dimensions from sentence transformers)

**Proposed:** Create 20 binary flags from common patterns
- `hook_question_opener` (0/1)
- `hook_result_first` (0/1)
- `story_problem_solution` (0/1)
- `story_before_after` (0/1)
- `visual_talking_head` (0/1)
- ... (20 total)

**Total: 162 + 20 = 182 features**

## Final Feature Count: ~182 features

## Implementation Challenges

### Challenge 1: Data Collection
**Problem:** Current 152 training videos only have transcript + engagement metrics

**Missing for each video:**
- FFmpeg metadata (need to re-process videos)
- Video style classification (need manual tagging OR build classifier)
- 9 attributes scores (need LLM scoring OR manual rating)
- Idea Legos binary flags (need pattern detection)

**Effort:** 2-4 weeks to collect all features for 152 videos

### Challenge 2: Feature Engineering
**Problem:** Many features require:
- LLM calls ($0.001-0.01 per video × 152 = $0.15-$1.50)
- Manual labeling (10-30 min per video × 152 = 25-75 hours)
- New code to extract features

### Challenge 3: Model Retraining
**Problem:** More features = more risk of overfitting with only 152 videos

**Recommendation:** Collect 500-1000 videos before retraining with 182 features

## Proposed MVP Approach

**Phase 1: Quick Wins (1 week)**
1. Add 8 FFmpeg features (easy - just run FFmpeg on videos)
2. Retrain with 127 features
3. Test if visual features improve predictions

**Phase 2: Video Style (2 weeks)**
4. Manually tag 152 videos with styles OR
5. Build simple style classifier using existing features
6. Add 26 style features
7. Retrain with 153 features

**Phase 3: Nine Attributes (3 weeks)**
8. Build LLM-based scorer for 9 attributes
9. Score all 152 videos (~$0.15 cost)
10. Add 9 attribute features
11. Retrain with 162 features

**Phase 4: Idea Legos Patterns (2 weeks)**
12. Define 20 binary pattern flags
13. Build pattern detector (rules-based or LLM)
14. Extract patterns from 152 videos
15. Add 20 pattern features
16. Retrain with 182 features

**Total time: 8 weeks for full expansion**

## Alternative: Kai Orchestration WITHOUT Retraining

Instead of cramming everything into one XGBoost model, build Kai as an orchestration layer:

1. **XGBoost Predictor** - Current 119 text features → base DPS
2. **Visual Analyzer** - FFmpeg features → visual quality score (0-100)
3. **Style Matcher** - Detect video style → style confidence scores
4. **Framework Detector** - Detect which frameworks used → framework list
5. **Attribute Scorer** - Score 9 attributes → attribute scores
6. **Pattern Extractor** - Extract idea legos → pattern flags

**Kai combines all outputs:**
```
Final DPS = (XGBoost base × 0.6) +
            (Visual score × 0.15) +
            (Style alignment × 0.10) +
            (Attribute average × 0.10) +
            (Pattern bonus × 0.05)
```

**Advantages:**
- Each component can be built/tested independently
- No retraining needed initially
- Can add/remove components easily
- Explainable (can see each component's contribution)

**This is probably what you want Kai to be.**

## Recommendation

**Build Kai Orchestration Layer first** (2-3 weeks), THEN consider full retraining later (8+ weeks).

Start with:
1. Create Kai orchestrator service
2. Wire up existing components (XGBoost, FFmpeg, GPT-4)
3. Add simple style/pattern detectors
4. Test on existing 152 videos
5. Iterate based on results

Would you like me to start building the Kai orchestrator?
