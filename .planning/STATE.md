# State

## Current Phase

**Milestone**: Component Algorithmic Conversion (Post-God's Eye Audit)
**Phase**: Component-by-component audit and conversion
**Status**: Framework established, Component 1 (FFmpeg) ready for deep-dive

## Context

God's Eye Forensic Audit (Mar 5-7) revealed the 22-component prediction system is effectively "what do 3-4 LLMs think about this transcript?" — not a true ensemble. The 73.5% accuracy claim is fabricated (hardcoded mock data). XGBoost v6 is broken (R²=0.0). Feature extraction is orphaned. Historical dimension is disabled.

The strategic direction is now:
1. Convert LLM-dependent components to deterministic/algorithmic measurements
2. Wire those measurements into the scoring formula
3. Collect real outcomes (DPS) and learn which measurements matter
4. Train model only after components produce repeatable signals

A research-validated onboarding overhaul was also completed (Mar 6), introducing:
- Two-mode prediction: Quality Gate + Distribution Potential
- 10-type hook taxonomy with 5 psychological clusters
- Delivery baseline (4 prosodic features)
- Creator story, subtopic scope, audience enrichment
- Quality discernment scoring
- Delivery hard gate

## Completed Milestones

- [x] v1.0 Production Readiness (Jan 13-18) — Pack 1/2/3/V integrated
- [x] Bucket 1: Prediction System Audit (Feb 27) — 15 locked decisions
- [x] Bucket 2: Code Fixes (Feb 28) — system-registry.ts, integrity tests
- [x] Bucket 3: Training Pipeline Automation (Mar 1-3) — 10 items
- [x] Bucket 4: Creator Intelligence Layer (Mar 4) — 6 prompts
- [x] God's Eye Forensic Audit (Mar 5-7) — 6-phase system diagnosis
- [x] Onboarding Pipeline Overhaul (Mar 6) — research-validated redesign
- [x] v1.1 Workflow wiring (Jan 19-21) — Phases 71-78 (2/4 plans)

## 22-Component Classification (Mar 7)

| Category | Count | Components |
|----------|-------|------------|
| Fully LLM-dependent | 8 | gpt4, gemini, claude, 9-attributes, 7-legos, pattern-extraction, virality-matrix, unified-grading |
| Broken/Disabled | 2 | xgboost-virality-ml (R²=0.0), niche-keywords (disabled) |
| Partial algorithmic | 5 | ffmpeg (placeholders), audio-analyzer, visual-scene-detector, thumbnail-analyzer, feature-extraction (orphaned) |
| Fully algorithmic | 4 | whisper, virality-indicator, viral-mechanics, 24-styles (baseline 50) |
| Hybrid | 3 | hook-scorer, editing-coach, visual-rubric |

## Key Decisions

- **Strategic reframe:** "Predict absolute virality" → "Predict within-niche ranking" + "Empirically validated coaching"
- **Chicken-and-egg resolution:** Components must become deterministic before model training is meaningful
- **Theoretical ceiling:** Content-only ρ ≈ 0.55-0.65 (literature). Within-creator ρ ≈ 0.70-0.80 (achievable)
- **XGBoost retrain:** Blocked on 100+ labeled videos
- **Rule 4 concern:** High-VPS scaling compresses scores into 35-60 range — may be destroying signal

## Blockers

- XGBoost retrain requires 100+ labeled prediction runs (currently <30)
- Component conversion is foundational work that must precede meaningful model training
- Real Spearman baseline is UNKNOWN — cannot measure improvement without it

## Next Actions

1. **Component 1: FFmpeg Video Analysis** — deep-dive audit (concept → reality → feasibility)
2. Work through remaining 21 components systematically
3. For each: determine keep/remove/fix/merge and what should be algorithmic vs. LLM
4. After conversion: wire deterministic features, collect outcomes, train model

---

*Last Updated: 2026-03-07 (God's Eye audit complete, component conversion framework established)*
