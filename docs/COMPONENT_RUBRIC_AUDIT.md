# Component Rubric Audit

**Last Updated:** 2026-01-18
**Purpose:** Document the status of all prediction components in the KaiOrchestrator
**Source:** `src/lib/orchestration/kai-orchestrator.ts`

---

## Overview

The Trendzo prediction system uses a modular component architecture orchestrated by `KaiOrchestrator`. Each component contributes signals to the final prediction.

**Total Components:** 31 defined (20 active, 11 disabled)

---

## Component Status Legend

| Status | Icon | Description |
|--------|------|-------------|
| Active | ✅ | Component is enabled and executing in production |
| Disabled | ❌ | Component is commented out or disabled |
| Pack | 📦 | Part of the Pack system (qualitative analysis) |

---

## Active Components (20)

### Pattern Components (7)

| # | ID | Name | Reliability | Avg Latency | Notes |
|---|----|----|-------------|-------------|-------|
| 1 | `9-attributes` | 9 Attributes Scorer | 0.85 | 500ms | Core content scoring |
| 5 | `7-legos` | 7 Idea Legos Pattern Extraction | 0.90 | 1000ms | Viral pattern detection |
| 8 | `niche-keywords` | Niche Keywords Analyzer | 0.85 | 200ms | Keyword relevance |
| 11 | `pattern-extraction` | Pattern Extraction Engine | 0.90 | 2000ms | General patterns |
| 17 | `hook-scorer` | Hook Strength Scorer | 0.50 | 50ms | Opening hook analysis |
| 22 | `24-styles` | 24 Video Styles Classifier | 0.50 | 2000ms | Style classification for Pack V |
| 26 | `virality-indicator` | Virality Indicator Engine | 0.85 | 500ms | Proprietary 6-factor algorithm |

### Quantitative Components (7)

| # | ID | Name | Reliability | Avg Latency | Notes |
|---|----|----|-------------|-------------|-------|
| 4 | `ffmpeg` | FFmpeg Visual Analysis | 0.99 | 30000ms | Direct video file analysis |
| 6 | `whisper` | Whisper Transcription | 0.95 | 5000ms | Audio-to-text |
| 10 | `feature-extraction` | Feature Extraction Service | 0.99 | 60000ms | 152 features (FFmpeg + LLM) |
| 15 | `audio-analyzer` | Audio Analysis Engine | 0.50 | 3000ms | Audio signal extraction |
| 16 | `visual-scene-detector` | Visual Scene Detection | 0.50 | 25000ms | Scene analysis for Pack V |
| 20 | `thumbnail-analyzer` | Thumbnail Analyzer | 0.50 | 2000ms | Thumbnail quality for Pack V |
| 27 | `xgboost-virality-ml` | XGBoost Virality ML Predictor v5 | 0.85 | 12000ms | Trained Python model (41 features) |

### Qualitative Components (6)

| # | ID | Name | Reliability | Avg Latency | Notes |
|---|----|----|-------------|-------------|-------|
| 7a | `gpt4` | GPT-4 Qualitative Analysis | 0.92 | 3000ms | OpenAI GPT-4 |
| 7c | `gemini` | Gemini 3 Pro Preview Analysis | 0.92 | 35000ms | Google Gemini (video upload) |
| 23 | `virality-matrix` | TikTok Virality Matrix | 0.80 | 15000ms | GPT-4 based virality scoring |
| 24 | `claude` | Claude Analysis | 0.85 | 15000ms | Anthropic Claude |

### Pack System Components (4)

| # | ID | Name | Pack | Type | Reliability | Avg Latency | Notes |
|---|----|----|------|------|-------------|-------------|-------|
| 📦 28 | `unified-grading` | Unified Grading Rubric | **Pack 1** | LLM-based | 0.90 | 8000ms | 9 attributes, 7 legos, hook analysis |
| 📦 29 | `editing-coach` | Editing Coach | **Pack 2** | LLM-based | 0.88 | 5000ms | Max 3 improvement suggestions |
| 📦 30 | `visual-rubric` | Visual Rubric | **Pack V** | Rule-based | 0.85 | 100ms | Runs without transcript |
| 📦 31 | `viral-mechanics` | Viral Mechanics | **Pack 3** | Rule-based | 0.80 | 50ms | Synthesizes all signals |

---

## Disabled Components (11)

| # | ID | Name | Reason for Disabling |
|---|----|----|---------------------|
| 3 | `xgboost` | XGBoost 118 Features | **FAKE** - was heuristic-based placeholder, not real XGBoost. Replaced by `xgboost-virality-ml` (Component 27) |
| 9 | `dps-engine` | DPS Calculation Engine | Logic moved to pipeline directly |
| 12 | `historical` | Historical Comparison | Zero variance - returns niche average DPS |
| 18 | `trend-timing-analyzer` | Trend Timing Analyzer | Content-independent, same score regardless of video |
| 21 | `posting-time-optimizer` | Posting Time Optimizer | Content-independent, useful for timing but not prediction |
| 25 | `python-analysis` | Python Enhanced Analysis | Superseded by individual components |

---

## Pack System Integration

The Pack system provides qualitative analysis that runs through `runPredictionPipeline()`:

```
Pipeline Flow:
1. Components execute (feature extraction, transcription, etc.)
2. Pack 1 (Unified Grading) runs if transcript available
3. Pack V (Visual Rubric) runs with FFmpeg signals
4. Pack 2 (Editing Coach) runs if Pack 1 succeeded
5. Pack 3 (Viral Mechanics) synthesizes all signals
6. Results returned via `qualitative_analysis` object
```

### Pack Dependencies

| Pack | Requires | Optional |
|------|----------|----------|
| Pack 1 | Transcript (10+ chars), Niche | Video metadata |
| Pack 2 | Pack 1 output, DPS prediction | - |
| Pack V | - | FFmpeg features, Style features, Thumbnail features |
| Pack 3 | - | Pack 1, Pack 2, Pack V, Component outputs |

---

## Component Types

| Type | Description | Example Components |
|------|-------------|-------------------|
| `pattern` | Extracts patterns from content | 9-attributes, 7-legos, hook-scorer |
| `quantitative` | Produces numerical features | ffmpeg, whisper, feature-extraction |
| `qualitative` | Produces descriptive analysis | gpt4, gemini, claude, pack components |
| `historical` | Uses historical data | (all currently disabled) |

---

## Reliability Tiers

| Tier | Range | Components |
|------|-------|------------|
| High | 0.90+ | 9-attributes, 7-legos, ffmpeg, whisper, feature-extraction, gpt4, gemini, unified-grading |
| Medium | 0.80-0.89 | niche-keywords, pattern-extraction, virality-indicator, xgboost-virality-ml, claude, editing-coach, visual-rubric, virality-matrix, viral-mechanics |
| Low | < 0.80 | hook-scorer, audio-analyzer, visual-scene-detector, thumbnail-analyzer, 24-styles |

---

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/orchestration/kai-orchestrator.ts` | Component registry and execution |
| `src/lib/prediction/runPredictionPipeline.ts` | Canonical pipeline entry point |
| `src/lib/rubric-engine/` | Pack 1/2/3/V implementation |
| `docs/API_PACK_RESPONSES.md` | Pack response format documentation |

---

## Changelog

- **2026-01-18:** Initial audit document created during Phase 06 documentation
- **Active:** 20 components (including Pack 1/2/3/V)
- **Disabled:** 11 components (mostly historical or superseded)
