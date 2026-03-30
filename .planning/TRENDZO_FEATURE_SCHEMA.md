# Trendzo Feature Schema for Simulation Intelligence

**Compiled:** 2026-02-05
**Purpose:** Complete feature schema for synthetic data generation / simulation-based training
**Target:** Enable MVP spec for trajectory simulation

---

## 1. Label Definition: DPS (Dynamic Percentile Score)

### What is DPS?
DPS is Trendzo's proprietary virality metric that normalizes engagement across niches. It's a **7-day prediction** of where a video will land in its niche's performance distribution.

### DPS Tiers
| Tier | DPS Range | Meaning |
|------|-----------|---------|
| `viral` | 70+ | Top 10% of niche |
| `good` | 50-69 | Above average |
| `average` | 30-49 | Middle of pack |
| `below_average` | 10-29 | Below average |
| `low` | 0-9 | Bottom 10% |

### Current Calibration Rules (Applied Post-Prediction)
1. **Confidence penalty for no-speech**: `confidence × 0.7` when transcription skipped
2. **Silent video DPS cap**: 55 (standard) or 65 (visual-first styles like ASMR, cooking)
3. **High DPS scaling**: 15-25% reduction for predictions >60 to counteract LLM over-prediction bias

### Database Storage
```sql
-- Label column in prediction_runs
predicted_dps_7d NUMERIC(5,2)  -- The final calibrated DPS
predicted_tier_7d VARCHAR(50)  -- The tier classification
confidence NUMERIC(5,4)        -- Model confidence 0-1
```

---

## 2. Component Registry (20 Active Components)

### Active Components by Type

#### Pattern Components (7)
| ID | Name | Reliability | Latency | Output |
|----|------|-------------|---------|--------|
| `9-attributes` | 9 Attributes Scorer | 0.85 | 500ms | 9 attribute scores (1-10) |
| `7-legos` | 7 Idea Legos Pattern Extraction | 0.90 | 1000ms | 7 boolean pattern flags |
| `niche-keywords` | Niche Keywords Analyzer | 0.85 | 200ms | keyword relevance score |
| `pattern-extraction` | Pattern Extraction Engine | 0.90 | 2000ms | structural patterns |
| `hook-scorer` | Hook Strength Scorer | 0.50 | 50ms | hook score (0-100) |
| `24-styles` | 24 Video Styles Classifier | 0.50 | 2000ms | style classification |
| `virality-indicator` | Virality Indicator Engine | 0.85 | 500ms | proprietary 6-factor score |

#### Quantitative Components (7)
| ID | Name | Reliability | Latency | Output |
|----|------|-------------|---------|--------|
| `ffmpeg` | FFmpeg Visual Analysis | 0.99 | 30000ms | 14 visual features |
| `whisper` | Whisper Transcription | 0.95 | 5000ms | transcript + word timestamps |
| `feature-extraction` | Feature Extraction Service | 0.99 | 60000ms | 152 features total |
| `audio-analyzer` | Audio Analysis Engine | 0.50 | 3000ms | audio signal features |
| `visual-scene-detector` | Visual Scene Detection | 0.50 | 25000ms | scene transitions |
| `thumbnail-analyzer` | Thumbnail Analyzer | 0.50 | 2000ms | thumbnail quality |
| `xgboost-virality-ml` | XGBoost Virality ML v5 | 0.85 | 12000ms | DPS prediction (41 features) |

#### Qualitative Components (6)
| ID | Name | Reliability | Latency | Output |
|----|------|-------------|---------|--------|
| `gpt4` | GPT-4 Qualitative Analysis | 0.92 | 3000ms | DPS prediction + reasoning |
| `gemini` | Gemini 3 Pro Preview | 0.92 | 35000ms | DPS prediction (video upload) |
| `claude` | Claude Analysis | 0.85 | 15000ms | DPS prediction + reasoning |
| `virality-matrix` | TikTok Virality Matrix | 0.80 | 15000ms | virality scoring |
| `unified-grading` | Pack 1 - Unified Grading | 0.90 | 8000ms | 9 attributes + 7 legos + hook |
| `editing-coach` | Pack 2 - Editing Coach | 0.88 | 5000ms | 3 improvement suggestions |

---

## 3. XGBoost v5 Feature Schema (41 Features)

The trained XGBoost model uses 41 features organized into 4 groups:

### 3.1 FFmpeg Features (14 features)
```typescript
{
  duration_seconds: number,      // Video length
  resolution_width: number,      // e.g., 1080
  resolution_height: number,     // e.g., 1920
  fps: number,                   // Frames per second
  motion_score: number,          // 0-1 motion intensity
  has_faces: boolean,            // Face detection
  face_time_ratio: number,       // % of video with faces
  has_music: boolean,            // Music detection
  avg_volume: number,            // Average audio volume
  brightness_avg: number,        // Average brightness
  contrast_ratio: number,        // Visual contrast
  saturation_avg: number,        // Color saturation
  visual_complexity: number,     // Scene complexity
  hook_scene_changes: number     // Cuts in first 3 seconds
}
```

### 3.2 Text Features (7 features)
Extracted from transcript:
```typescript
{
  text_word_count: number,       // Total words
  text_char_count: number,       // Total characters
  text_sentence_count: number,   // Sentence count
  text_avg_word_length: number,  // Average word length
  text_question_count: number,   // Questions in transcript
  text_exclamation_count: number,// Exclamations
  text_hashtag_count: number     // Hashtags mentioned
}
```

### 3.3 Component Predictions (18 features)
Each component produces a prediction and confidence:
```typescript
{
  hook_scorer_pred: number,      // 0-100
  hook_scorer_conf: number,      // 0-1
  '7_legos_pred': number,
  '7_legos_conf': number,
  '9_attributes_pred': number,
  '9_attributes_conf': number,
  '24_styles_pred': number,
  '24_styles_conf': number,
  niche_keywords_pred: number,
  niche_keywords_conf: number,
  virality_matrix_pred: number,
  virality_matrix_conf: number,
  pattern_extraction_pred: number,
  pattern_extraction_conf: number,
  trend_timing_pred: number,
  trend_timing_conf: number,
  posting_time_pred: number,
  posting_time_conf: number
}
```

### 3.4 LLM Predictions (2 features)
```typescript
{
  gpt4_score: number | undefined,    // GPT-4 DPS prediction
  claude_score: number | undefined   // Claude DPS prediction
}
```

---

## 4. Pack System Output Structures

### 4.1 Pack 1: Unified Grading Rubric
```typescript
interface UnifiedGradingResult {
  rubric_version: string;
  niche: string;
  goal: string;
  
  style_classification: {
    label: string;           // e.g., "talking_head", "meme_edit"
    confidence: number;      // 0-1
  };
  
  idea_legos: {
    lego_1: boolean;  // Clear topic identified
    lego_2: boolean;  // Relevant to target audience
    lego_3: boolean;  // Unique angle presented
    lego_4: boolean;  // Intriguing hook present
    lego_5: boolean;  // Story structure exists
    lego_6: boolean;  // Visual format matches content
    lego_7: boolean;  // Call-to-action present
    notes: string;
  };
  
  attribute_scores: Array<{
    attribute: 'tam_resonance' | 'shareability' | 'value_density' | 
               'emotional_journey' | 'hook_strength' | 'format_innovation' |
               'pacing_rhythm' | 'curiosity_gaps' | 'clear_payoff';
    score: number;      // 1-10
    evidence: string;
  }>;
  
  hook: {
    type: 'question' | 'statistic' | 'story' | 'claim' | 'visual' | 
          'contrast' | 'mystery' | 'direct' | 'weak';
    clarity_score: number;  // 1-10
    pattern: string;
    evidence: string;
    rewrite_options: string[];
  };
  
  pacing: { score: number; evidence: string };
  clarity: { score: number; evidence: string };
  novelty: { score: number; evidence: string };
  
  compliance_flags: string[];
  warnings: string[];
  grader_confidence: number;  // 0-1
  
  _meta: {
    source: 'real' | 'mock';
    provider: string;
    latency_ms: number;
  };
}
```

### 4.2 Pack 2: Editing Coach
```typescript
interface EditingCoachResult {
  pack: '2';
  predicted_before: number;          // Current DPS
  predicted_after_estimate: number;  // Potential DPS after changes
  
  changes: Array<{                   // Max 3 suggestions
    priority: 1 | 2 | 3;
    what_to_change: string;
    how_to_change: string;
    example: string;
    targets: string[];               // Rubric field paths
    estimated_lift: number;          // Expected DPS improvement
    confidence: number;              // 0-1
  }>;
  
  notes: string;
  _meta: { source: 'real' | 'mock'; provider: string; latency_ms: number };
}
```

### 4.3 Pack V: Visual Rubric (No transcript required)
```typescript
interface VisualRubricResult {
  pack: 'V';
  
  visual_hook_score: { score: number; evidence: string };      // 1-10
  pacing_score: { score: number; evidence: string };           // 1-10
  pattern_interrupts_score: { score: number; evidence: string };// 1-10
  visual_clarity_score: { score: number; evidence: string };   // 1-10
  style_fit_score: { score: number; evidence: string };        // 1-10
  
  overall_visual_score: number;  // 0-100 aggregate
  
  _meta: { source: 'real' | 'mock'; provider: string; latency_ms: number };
  
  signal_coverage?: {
    components: Array<{
      component: string;
      executed: boolean;
      fieldsAvailable: string[];
      fieldsConsumed: string[];
      status: 'used' | 'partial' | 'executed-but-unused' | 'not-executed';
    }>;
    summary: {
      total_components: number;
      executed_count: number;
      used_count: number;
      coverage_percent: number;
    };
    signals_used: Array<{
      field: string;
      source: string;
      value: string | number | boolean;
      used_in_score: string;
    }>;
  };
}
```

---

## 5. Database Schema

### 5.1 prediction_runs Table
```sql
CREATE TABLE prediction_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES video_files(id) ON DELETE SET NULL,
  mode VARCHAR(50) DEFAULT 'standard',  -- 'standard', 'fast', 'admin', 'validation'
  status VARCHAR(50) CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  latency_ms_total INTEGER,
  
  -- Prediction outputs
  predicted_dps_7d NUMERIC(5,2),       -- THE LABEL
  predicted_tier_7d VARCHAR(50),        -- 'viral', 'good', 'average', etc.
  confidence NUMERIC(5,4),              -- 0-1
  components_used TEXT[],               -- Array of component IDs that ran
  
  -- Full results
  raw_result JSONB,                     -- Complete orchestrator output
  error_message TEXT,
  
  -- Transcription metadata
  transcription_source VARCHAR(50),     -- 'user_provided', 'whisper', 'none'
  transcription_confidence NUMERIC(5,4),
  transcription_latency_ms INTEGER,
  transcription_skipped BOOLEAN DEFAULT FALSE,
  transcription_skip_reason TEXT,
  resolved_transcript_length INTEGER DEFAULT 0,
  
  -- Pack metadata
  pack1_meta JSONB,  -- {source, provider, latency_ms}
  pack2_meta JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 run_component_results Table
```sql
CREATE TABLE run_component_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES prediction_runs(id) ON DELETE CASCADE,
  video_id UUID REFERENCES video_files(id) ON DELETE SET NULL,
  component_id VARCHAR(100) NOT NULL,   -- e.g., 'gpt4', 'ffmpeg', 'unified-grading'
  
  success BOOLEAN DEFAULT FALSE,
  error TEXT,
  skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT,
  
  prediction NUMERIC(5,2),              -- Component's DPS prediction
  confidence NUMERIC(5,4),              -- Component's confidence
  features JSONB,                       -- Component-specific output
  insights TEXT[],                      -- Human-readable insights
  
  latency_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. 20 Supported Niches

The system is trained on these niches:
1. `personal_finance`
2. `side_hustles`
3. `beauty`
4. `fashion`
5. `fitness`
6. `food_cooking`
7. `travel`
8. `tech_reviews`
9. `gaming`
10. `entertainment`
11. `education`
12. `parenting`
13. `pets`
14. `home_decor`
15. `automotive`
16. `sports`
17. `music`
18. `art_creative`
19. `comedy`
20. `lifestyle`

---

## 7. Key Calibration Constants

```typescript
const CONFIDENCE_PENALTY_NO_SPEECH = 0.7;
const SILENT_VIDEO_DPS_CAP = 55;
const SILENT_VIDEO_DPS_CAP_VISUAL_FIRST = 65;
const SILENT_VIDEO_PACKV_THRESHOLD = 50;
const MIN_TRANSCRIPT_LENGTH = 10;
const HIGH_DPS_THRESHOLD = 60;
const HIGH_DPS_SCALING_FACTOR = 0.85;  // 15% reduction

// Visual-first styles (exempt from harsh silent video cap)
const VISUAL_FIRST_STYLES = [
  'meme_edit', 'satisfying', 'asmr', 'cooking_montage', 'product_demo',
  'timelapse', 'cinematic', 'tutorial_silent', 'art_process', 'transformation'
];
```

---

## 8. Feature Weights (from XGBoost importance)

Pack 2's estimated lift uses these weights:
```typescript
const RUBRIC_WEIGHTS = {
  hook_strength: 0.18,
  curiosity_gaps: 0.14,
  shareability: 0.12,
  tam_resonance: 0.11,
  value_density: 0.10,
  pacing_rhythm: 0.09,
  emotional_journey: 0.08,
  clear_payoff: 0.08,
  format_innovation: 0.05,
  novelty: 0.03,
  clarity: 0.02,
  hook: 0.15,
  pacing: 0.06,
};
```

---

## 9. Current Model Performance

XGBoost v5 accuracy (within ±5 DPS of actual):
- Side Hustles: 35.7%
- Personal Finance: 50.5%

Target: 80%+ accuracy

---

## 10. Data Collection Infrastructure Gaps

For trajectory-based simulation, you would need:
1. **First-hour trajectory data**: views/min, shares/min, retention at 5min/15min/30min/1hr
2. **Account context**: follower count, prior median views, posting history
3. **Time-series polling**: Currently only capture final state, not trajectory

Current data:
- Static feature snapshots at prediction time
- Final DPS outcome after 7 days
- No intermediate engagement trajectory

---

## Notes for Simulation MVP Spec

**What this schema enables:**
- Generate synthetic feature vectors for 41 XGBoost features
- Simulate Pack 1/2/V outputs conditioned on niche + style
- Rare event enrichment near DPS boundaries

**What this schema lacks:**
- First-hour trajectory data (views/min, retention curves)
- Account-level context (follower count, prior performance)
- Platform state (trending sounds, competitive feed composition)

**Recommendation from other LLM:**
Simulate early performance trajectories conditioned on:
1. Niche
2. Format class (talking head, meme edit, etc.)
3. Hook type / pacing bucket
4. Baseline account strength
