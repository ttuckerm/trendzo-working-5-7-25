# Trendzo - Viral Video Prediction Platform

## Vision

Trendzo is a viral video prediction platform designed to predict TikTok video virality with high accuracy. The system analyzes video content through a canonical prediction pipeline with 22 registered components, providing creators with actionable insights to maximize their content's viral potential.

## Core Problem

Content creators invest significant time creating videos without knowing if they'll perform well. Trendzo solves this by:
1. Predicting a video's VPS (Viral Potential Score, 0-100) before publishing
2. Grading content quality across 9 attributes and 7 "idea legos"
3. Providing AI-powered editing suggestions to improve viral potential
4. Identifying viral mechanics that drive engagement
5. Ranking content relative to niche peers

## Key Users

- **Content Creators**: TikTok creators wanting to optimize content before posting
- **Marketing Teams**: Brands analyzing video performance potential
- **Agencies**: Production teams validating content strategy

## Technical Foundation

- **Stack**: Next.js 14 (TypeScript) + Supabase
- **Architecture**: Canonical prediction pipeline with component registry
- **AI Integration**: Gemini 2.5 Flash (primary), GPT-4o-mini, Claude 3 Haiku
- **ML Models**: XGBoost v6 (currently broken — R²=0.0, blocked on data)
- **Training Pipeline**: Auto backfill → metric collection → auto-label → Spearman eval

## Accuracy Targets (Updated Mar 7 — Post-Audit)

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| Spearman ρ (absolute) | 0.55-0.65 | UNKNOWN | Theoretical ceiling from content signals alone |
| Spearman ρ (within-creator) | 0.70-0.80 | UNKNOWN | Achievable with creator context |
| Top-decile precision | TBD | UNKNOWN | Needs 500+ labeled videos |
| Labeled training samples | 200+ | <30 | Blocked on data collection |

Previous "73.5% accuracy" claim was fabricated (hardcoded mock data).

## Pack System (Methodology Rubrics)

| Pack | Name | Status | Purpose |
|------|------|--------|---------|
| Pack 1 | Unified Grading Rubric | Complete | LLM-based content scoring (9 attributes, 7 legos) |
| Pack 2 | Editing Coach | Complete | AI suggestions with estimated DPS lift |
| Pack 3 | Viral Mechanics | Complete | Rule-based viral trigger detection |
| Pack V | Visual Rubric | Complete | Frame-based visual analysis (40% rule + 60% Gemini) |

## Primary Workflow

1. User submits video URL or transcript via `/admin/upload-test`
2. `runPredictionPipeline()` orchestrates all 22 components
3. Each pack analyzes content and contributes to final score
4. Results displayed with Pack 1/2/3/V panels showing detailed analysis

## Current State (Mar 7)

The system is undergoing a strategic transformation from "LLM opinion ensemble" to "deterministic measurement engine with LLM refinement." The God's Eye forensic audit (Mar 5-7) revealed that the VPS score is dominated by correlated LLM opinions rather than independent measurements. Component-by-component conversion to algorithmic signals is the current priority.

## Constraints

- TypeScript only (no Python/ML services)
- Supabase for persistence
- Vercel deployment target
- Must maintain backward compatibility with existing prediction_runs data
