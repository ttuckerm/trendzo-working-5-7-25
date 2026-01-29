# Trendzo - Viral Video Prediction Platform

## Vision

Trendzo is a viral video prediction platform designed to predict TikTok video virality at 80%+ accuracy. The system analyzes video content through a canonical prediction pipeline with 27+ registered components, providing creators with actionable insights to maximize their content's viral potential.

## Core Problem

Content creators invest significant time creating videos without knowing if they'll perform well. Trendzo solves this by:
1. Predicting a video's "DPS" (Dollars Per Second) score before or after publishing
2. Grading content quality across 9 attributes and 7 "idea legos"
3. Providing AI-powered editing suggestions to improve viral potential
4. Identifying viral mechanics that drive engagement

## Key Users

- **Content Creators**: TikTok creators wanting to optimize content before posting
- **Marketing Teams**: Brands analyzing video performance potential
- **Agencies**: Production teams validating content strategy

## Technical Foundation

- **Stack**: Next.js 14 (TypeScript) + Python ML services + Supabase
- **Architecture**: Canonical prediction pipeline with component registry
- **AI Integration**: Claude, OpenAI, Deepgram for analysis
- **ML Models**: XGBoost for DPS prediction

## Pack System (Methodology Rubrics)

| Pack | Name | Status | Purpose |
|------|------|--------|---------|
| Pack 1 | Unified Grading Rubric | Complete | LLM-based content scoring (9 attributes, 7 legos) |
| Pack 2 | Editing Coach | Complete | AI suggestions with estimated DPS lift |
| Pack 3 | Viral Mechanics | Complete | Rule-based viral trigger detection |
| Pack V | Visual Rubric | Complete | Frame-based visual analysis |

## Primary Workflow

1. User submits video URL or transcript via `/admin/upload-test`
2. `runPredictionPipeline()` orchestrates all components
3. Each pack analyzes content and contributes to final score
4. Results displayed with Pack 1/2/3/V panels showing detailed analysis

## Success Metrics

- Prediction accuracy: Target 80%+ correlation with actual virality
- Component coverage: All 27 components executing without errors
- Pipeline reliability: `prediction_runs` completing with status='completed'

## Constraints

- Must maintain backward compatibility with existing API consumers
- All predictions must flow through canonical `runPredictionPipeline()`
- No direct database writes from route handlers to prediction tables

---

*Created: 2026-01-17*
*Based on codebase mapping from 2026-01-14*
