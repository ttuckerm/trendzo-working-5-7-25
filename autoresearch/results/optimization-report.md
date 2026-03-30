# Autoresearch Optimization Report

**Date:** 2026-03-22
**Total experiments:** 1,500 across 3 seeds (42, 123, 999)
**Best seed:** 123 (accepted experiment at iteration 2)

---

## 1. Executive Summary

The optimization loop ran 1,500 bounded experiments across 3 seeds using 5-fold
chronological cross-validation on 40 replayable labeled runs. 3 experiments were
accepted (1 per seed), all sharing a common pattern: **increasing the extreme score
boost factor from 1.5 to ~2.0** is the primary lever that improves rank correlation.

| Metric | Baseline | Best (seed 123) | Delta |
|---|---|---|---|
| Avg val rho (5-fold) | -0.075 | +0.089 | **+0.164** |
| Avg val MAE (5-fold) | 18.31 | 18.17 | -0.14 |
| Full dataset rho | -0.396 | -0.199 | +0.197 |
| side-hustles rho (n=24) | -0.030 | +0.140 | +0.170 |
| unknown rho (n=15) | -0.735 | -0.735 | 0.000 |

## 2. What Changed (Best Config vs Baseline)

Only 3 parameters differ from baseline:

| Parameter | Baseline | Best | Interpretation |
|---|---|---|---|
| `extremeScoreBoost` | 1.5 | **2.086** | Components with extreme scores (< 30 or > 80) get more weight |
| `componentWeightMultipliers.24-styles` | 1.0 | **1.116** | 24-Styles classifier gets 12% more weight |
| `nicheDifficultyFactors.personal-finance` | 0.90 | **0.871** | Marginal, only affects 0/40 replayable runs |
| `nicheDifficultyFactors.productivity` | 0.92 | **0.901** | Marginal, only affects 0/40 replayable runs |

The niche factor changes have **zero effect** on the current dataset (all runs are raw VPS mode
with no account_size). They were accepted as noise-neutral tag-alongs.

### The Real Finding: Extreme Score Boost

In production, components scoring < 30 or > 80 VPS get 1.5x weight (`kai-orchestrator.ts:1936`).
The optimization consistently found that **increasing this to ~2.0** improves rank correlation:

- Seed 42: accepted boost = 1.564
- Seed 123: accepted boost = **2.086** (best)
- Seed 999: accepted boost = 1.915

**Interpretation:** Components that predict extreme outcomes (very viral or very weak) are
more discriminating than those predicting middling scores. Giving their signal more weight
improves the system's ability to rank-order videos correctly.

## 3. Cross-Seed Consistency

| Seed | Accepted at | Avg val rho | Extreme boost | Key changes |
|---|---|---|---|---|
| 42 | iter 51 | +0.054 | 1.564 | viral-mechanics ×1.6 |
| **123** | **iter 2** | **+0.089** | **2.086** | 24-styles ×1.12 |
| 999 | iter 77 | +0.084 | 1.915 | visual-rubric ×0.6, thumbnail ×0.88 |

All 3 seeds agree that extremeScoreBoost > 1.5 improves rho. The specific component weight
changes are NOT consistent across seeds (one boosts viral-mechanics, another boosts 24-styles,
another reduces visual-rubric). This suggests component multiplier changes are noise at this
sample size, but the extreme boost finding is robust.

## 4. Overfit Signals

| Signal | Value | Assessment |
|---|---|---|
| Fold std (best) | 0.466 | HIGH — individual fold rhos range -0.34 to +0.85 |
| Fold std (baseline) | 0.424 | Also high — the data itself is very noisy |
| Fold std increase | +0.042 | Minor — not a strong overfit signal |
| Accepted rate | 0.2% (3/1500) | Very conservative — guardrails are working |
| Component weight changes | Inconsistent across seeds | Likely noise |
| Extreme boost direction | Consistent across seeds | Likely real signal |

**Verdict:** The extreme score boost increase is a tentative real finding. The component
weight multiplier changes should be treated as noise until validated on more data.

## 5. Guardrail Performance

The guardrails rejected 1,497/1,500 experiments. Rejection breakdown (from research log):

- **rho_insufficient:** Most common — perturbation didn't change avg fold rho by >= 0.01
- **effect_size_too_small:** Second most common — delta was < 0.3× fold std
- **fold_variance_high:** Candidate had much higher fold variance than best
- **mae_degraded:** Rare — most changes don't affect MAE much
- **niche_degraded:** Rare — "unknown" niche is stable across all experiments

The conservative acceptance rate is appropriate given 40 data points. The system refused
to accept noise as improvement, which is the correct behavior.

## 6. Limitations

1. **40 replayable runs** is very small for optimization. Bootstrap CI width > 0.6.
2. **29/54 runs have no niche label.** The "unknown" niche group dominates negative rho.
3. **All contributing components land in `pattern_based` path.** Path weights, component
   reliability, and context weights have zero effect on the current data.
4. **35/40 runs are raw VPS mode.** Niche and account factors cannot be optimized.
5. **Code version heterogeneity.** Historical runs were made with different pipeline versions.
   The optimization tuned current logic against mixed-era ground truth.

## 7. Recommended Production Changes

### Safe to Apply (with monitoring):

1. **extremeScoreBoost: 1.5 → 2.0** in `kai-orchestrator.ts:1936`
   - Consistent finding across 3 seeds
   - Mechanism is interpretable (extreme predictions are more discriminating)
   - Easy to revert if monitoring shows degradation

### Do NOT Apply (insufficient evidence):

- Component weight multipliers — inconsistent across seeds
- Niche factor changes — zero effect on current data
- Any changes to path weights, context weights, or component reliability

## 8. Next Steps for Better Optimization

1. **Label more videos.** 40 runs is the minimum viable. 100+ would dramatically reduce noise.
2. **Tag niche consistently.** 29 "unknown" niche runs cannot be used for niche-specific tuning.
3. **Run creator-facing predictions** to generate data with account_size populated (unlocks
   niche/account factor optimization).
4. **Activate quantitative/qualitative paths** with real components to make path weights meaningful.
5. **Re-run optimization** after each data milestone (50, 100, 200 labeled runs).
