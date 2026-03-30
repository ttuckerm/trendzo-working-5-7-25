# API Pack Responses

**Last Updated:** 2026-01-18
**Purpose:** Document the Pack response structure for all prediction API endpoints

---

## Overview

All prediction endpoints return pack results via the `qualitative_analysis` object. This provides structured analysis from four distinct packs:

| Pack | Name | Type | Purpose |
|------|------|------|---------|
| Pack 1 | Unified Grading | LLM-based | Content scoring with 9 attributes, idea legos, hook analysis |
| Pack 2 | Editing Coach | LLM-based | Improvement suggestions with DPS lift estimation |
| Pack 3 | Viral Mechanics | Rule-based | Viral trigger detection from existing signals |
| Pack V | Visual Rubric | Rule-based | Frame-based visual analysis |

---

## Response Structure

All prediction endpoints (`/api/predict`, `/api/kai/predict`, etc.) return:

```json
{
  "run_id": "uuid",
  "success": true,
  "predicted_dps_7d": 65.5,
  "predicted_tier_7d": "good",
  "confidence": 0.85,

  "qualitative_analysis": {
    "pack1": { /* Unified Grading */ },
    "pack2": { /* Editing Coach */ },
    "pack3": { /* Viral Mechanics */ },
    "packV": { /* Visual Rubric */ }
  },

  // Backward-compatibility fields (deprecated, use qualitative_analysis instead)
  "unified_grading": { /* same as qualitative_analysis.pack1 */ },
  "editing_suggestions": { /* same as qualitative_analysis.pack2 */ }
}
```

---

## Pack Metadata (`_meta`)

Each pack includes a `_meta` object with execution metadata:

```typescript
{
  _meta: {
    source: "real" | "mock",    // "real" = executed, "mock" = stub/fallback
    provider: string,            // LLM provider or "rule-based"
    latency_ms: number           // Execution time in milliseconds
  }
}
```

**Source Values:**
- `"real"` - Pack executed successfully with actual data
- `"mock"` - Pack returned a stub/fallback (missing required inputs)

---

## Pack 1: Unified Grading Rubric

LLM-based content scoring that analyzes transcript and video metadata.

### Requirements
- Requires transcript (minimum 10 characters)
- Requires niche to be set

### Output Schema

```typescript
interface UnifiedGradingResult {
  // 9 attribute scores (1-10 each)
  attribute_scores: Array<{
    attribute: string;     // e.g., "relatability", "emotional_appeal"
    score: number;         // 1-10
    evidence: string;      // Supporting text from transcript
  }>;

  // 7 idea legos (boolean markers)
  idea_legos: {
    lego_1: boolean;       // Pattern interrupt
    lego_2: boolean;       // Curiosity gap
    lego_3: boolean;       // Emotional trigger
    lego_4: boolean;       // Social proof
    lego_5: boolean;       // Trend alignment
    lego_6: boolean;       // Call to action
    lego_7: boolean;       // Replay value
    notes: string;         // Summary of detected legos
  };

  // Hook analysis
  hook: {
    type: string;          // e.g., "question", "statement", "visual"
    clarity_score: number; // 1-10
    pattern: string;       // Detected hook pattern
  };

  // Content dimension scores (1-10 each)
  pacing: { score: number; evidence: string };
  clarity: { score: number; evidence: string };
  novelty: { score: number; evidence: string };

  // Confidence and warnings
  grader_confidence: number;  // 0-1
  warnings: string[];         // Any issues detected

  // Metadata
  _meta: {
    source: "real" | "mock";
    provider: string;
    latency_ms: number;
  };
}
```

### Example Response

```json
{
  "attribute_scores": [
    { "attribute": "relatability", "score": 8, "evidence": "Uses common phrases like 'we all know...'" },
    { "attribute": "emotional_appeal", "score": 7, "evidence": "Creates FOMO with 'don't miss out'" }
  ],
  "idea_legos": {
    "lego_1": true,
    "lego_2": true,
    "lego_3": false,
    "lego_4": false,
    "lego_5": true,
    "lego_6": true,
    "lego_7": false,
    "notes": "Strong hook with curiosity gap, trend-aligned content"
  },
  "hook": {
    "type": "question",
    "clarity_score": 9,
    "pattern": "Controversial question hook"
  },
  "pacing": { "score": 8, "evidence": "Good rhythm, 2-3 second beats" },
  "clarity": { "score": 7, "evidence": "Clear message but some tangents" },
  "novelty": { "score": 6, "evidence": "Common topic with slight twist" },
  "grader_confidence": 0.85,
  "warnings": [],
  "_meta": { "source": "real", "provider": "openai-gpt-4", "latency_ms": 1250 }
}
```

---

## Pack 2: Editing Coach

LLM-based improvement suggestions that analyze Pack 1 output and generate actionable changes.

### Requirements
- Requires Pack 1 output (will not run if Pack 1 failed)
- Requires current DPS prediction

### Output Schema

```typescript
interface EditingCoachResult {
  pack: "editing-coach";

  // DPS estimates
  predicted_before: number;       // Current DPS
  predicted_after_estimate: number; // Potential DPS after changes

  // Max 3 prioritized suggestions
  changes: Array<{
    target_field: string;    // Which aspect to improve
    suggestion: string;      // Specific actionable advice
    estimated_lift: number;  // Estimated DPS increase
    priority: 1 | 2 | 3;     // 1 = highest priority
  }>;

  notes: string;  // Summary of improvement potential

  _meta: {
    source: "real" | "mock";
    provider: string;
    latency_ms: number;
  };
}
```

### Example Response

```json
{
  "pack": "editing-coach",
  "predicted_before": 55,
  "predicted_after_estimate": 72,
  "changes": [
    {
      "target_field": "hook",
      "suggestion": "Replace statement hook with a question to increase curiosity gap",
      "estimated_lift": 8,
      "priority": 1
    },
    {
      "target_field": "pacing",
      "suggestion": "Trim middle section by 15% - losing viewers at 12-second mark",
      "estimated_lift": 5,
      "priority": 2
    },
    {
      "target_field": "clarity",
      "suggestion": "Add one more concrete example to support the main claim",
      "estimated_lift": 4,
      "priority": 3
    }
  ],
  "notes": "Good foundation. Hook improvement has highest ROI.",
  "_meta": { "source": "real", "provider": "openai-gpt-4", "latency_ms": 890 }
}
```

---

## Pack 3: Viral Mechanics

Rule-based analysis that synthesizes signals from Pack 1, Pack 2, Pack V, and other components to identify viral triggers.

### Requirements
- Best results with Pack 1 and Pack V available
- Runs in "limited signal mode" if inputs missing

### Output Schema

```typescript
interface ViralMechanicsResult {
  pack: "3";

  // Top viral mechanics detected (max 5)
  mechanics: Array<{
    name: string;          // e.g., "Pattern Interrupt", "Curiosity Gap"
    strength: number;      // 0-100
    evidence: string[];    // Supporting evidence
    signals_used: string[]; // Which signals contributed
  }>;

  summary: string;         // Max 500 chars, overall viral potential
  confidence: number;      // 0-1
  limited_signal_mode: boolean; // True if key signals missing
  missing_signals?: string[];   // List of unavailable signals

  _meta: {
    source: "real" | "mock";
    provider: string;       // "rule-based"
    latency_ms: number;
  };
}
```

### Known Viral Mechanics

Pack 3 can detect these mechanics:

| Mechanic | Description |
|----------|-------------|
| Pattern Interrupt | Content that breaks expected patterns |
| Curiosity Gap | Creates desire to know more |
| Emotional Trigger | Evokes strong emotional response |
| Social Proof | References others' actions/opinions |
| Trend Alignment | Aligns with current platform trends |
| Visual Hook | Strong visual opening frame |
| Audio-Visual Sync | Music/beat alignment |
| Optimal Pacing | Well-timed content delivery |
| Style-Platform Fit | Matches platform aesthetics |
| Posting Time Advantage | Optimal publishing timing |

### Example Response

```json
{
  "pack": "3",
  "mechanics": [
    {
      "name": "Curiosity Gap",
      "strength": 85,
      "evidence": ["Strong hook question", "Withheld reveal until end"],
      "signals_used": ["pack1.hook.type", "pack1.idea_legos.lego_2"]
    },
    {
      "name": "Pattern Interrupt",
      "strength": 72,
      "evidence": ["Quick scene changes", "Unexpected visual"],
      "signals_used": ["packV.pattern_interrupts_score", "packV.pacing_score"]
    },
    {
      "name": "Trend Alignment",
      "strength": 68,
      "evidence": ["Uses trending format"],
      "signals_used": ["detected_style", "pack1.idea_legos.lego_5"]
    }
  ],
  "summary": "High viral potential due to strong curiosity gap and pattern interrupts. Content aligns well with current platform trends.",
  "confidence": 0.82,
  "limited_signal_mode": false,
  "_meta": { "source": "real", "provider": "rule-based", "latency_ms": 45 }
}
```

---

## Pack V: Visual Rubric

Rule-based visual analysis that runs even without a transcript, using FFmpeg-derived signals and visual component outputs.

### Requirements
- Best results with video file available for FFmpeg analysis
- Can run with partial signals

### Output Schema

```typescript
interface VisualRubricResult {
  pack: "V";

  // Visual scores (1-10 each)
  visual_hook_score: { score: number; evidence: string };
  pacing_score: { score: number; evidence: string };
  pattern_interrupts_score: { score: number; evidence: string };
  visual_clarity_score: { score: number; evidence: string };
  style_fit_score: { score: number; evidence: string };

  // Aggregate score (0-100)
  overall_visual_score: number;

  _meta: {
    source: "real" | "mock";
    provider: string;
    latency_ms: number;
  };

  // Optional debug block
  signal_coverage?: PackVSignalCoverage;
}
```

### Example Response

```json
{
  "pack": "V",
  "visual_hook_score": { "score": 8, "evidence": "High contrast opening frame" },
  "pacing_score": { "score": 7, "evidence": "Scene changes every 2.5 seconds" },
  "pattern_interrupts_score": { "score": 6, "evidence": "3 distinct visual breaks detected" },
  "visual_clarity_score": { "score": 8, "evidence": "High resolution, good lighting" },
  "style_fit_score": { "score": 7, "evidence": "Matches 'meme_edit' style conventions" },
  "overall_visual_score": 72,
  "_meta": { "source": "real", "provider": "rule-based", "latency_ms": 120 }
}
```

---

## Endpoints Returning Pack Data

All these endpoints return the full `qualitative_analysis` object:

| Endpoint | Purpose |
|----------|---------|
| `POST /api/predict` | Standard prediction |
| `POST /api/kai/predict` | Main prediction endpoint (used by upload-test) |
| `POST /api/admin/predict` | Admin mode prediction |
| `POST /api/admin/super-admin/quick-predict` | Quick prediction |
| `POST /api/bulk-download/predict` | Bulk prediction |

---

## Error Handling

When a pack fails to execute, it may return:

1. **Mock/Stub Response** - `_meta.source: "mock"` with default values
2. **Null** - Pack entirely absent from response (rare)

Check `_meta.source` to determine if results are real or fallback:

```typescript
if (response.qualitative_analysis.pack1?._meta?.source === 'real') {
  // Use Pack 1 results confidently
} else {
  // Display warning or hide Pack 1 panel
}
```

---

## UI Integration

The `/admin/upload-test` page displays all packs with:

- **Source Badges** - Shows "real" (green) or "mock" (gray) for each pack
- **Loading Skeletons** - Animated placeholders during prediction
- **Strength Bars** - Pack 3 mechanics use color-coded bars (green/yellow/red)
- **Fallback Messages** - Explains why a pack returned mock data

---

## Version History

- **2026-01-18:** Verified as part of Phase 06 documentation update
- **2026-01-17:** Initial documentation for Pack 1/2/3/V response format
- All packs verified working with 26/26 tests passing
