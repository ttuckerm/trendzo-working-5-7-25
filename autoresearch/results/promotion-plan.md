# Promotion Readiness Plan

**Date:** 2026-03-22
**Source:** Autoresearch optimization (1,500 experiments, 3 seeds, 5-fold CV, 40 runs)
**Status:** Ready for human review

---

## Parameter-by-Parameter Assessment

### 1. `extremeScoreBoost`: 1.5 → 2.0

**Cross-seed consistency:** YES. All 3 seeds found values > 1.5 (1.564, 2.086, 1.915).
The direction is unanimous.

**Mechanism interpretable:** YES. Components that predict extreme outcomes (VPS < 30 or
VPS > 80) have taken a strong position. Middling predictions (40-70) carry less
discriminating information — they mean "maybe." Increasing the weight on decisive
signals is a well-understood technique (analogous to boosting high-confidence classifiers
in ensemble methods).

**Statistically meaningful:** PARTIALLY. The improvement (+0.164 avg val rho) exceeds
0.3× fold standard deviation (effect size = 0.39), passing the effect size gate. However,
with 8 runs per fold and fold rhos ranging from -0.34 to +0.85, the signal is real but
imprecise. The specific optimal value (2.086 vs 1.5 vs 1.9) cannot be distinguished at
this sample size.

**Verdict: PROMOTE — with conservative value (2.0 round number, not 2.086)**

Rationale: Use 2.0 instead of 2.086. The three seeds converged on the range 1.56-2.09,
with the median at ~1.9. Rounding to 2.0 is conservative, avoids false precision, and
captures the directional finding. The difference between 2.0 and 2.086 is not
distinguishable at n=40.

---

### 2. `componentWeightMultipliers.24-styles`: 1.0 → 1.116

**Cross-seed consistency:** NO. Each seed changed a different component:
- Seed 42: viral-mechanics × 1.603
- Seed 123: 24-styles × 1.116
- Seed 999: visual-rubric × 0.609, thumbnail-analyzer × 0.876

Three seeds, three different components, three different directions. This is textbook noise.

**Mechanism interpretable:** WEAK. The 24-Styles classifier (hybrid keyword + GPT-4o-mini)
classifies video format. A 12% weight increase means "trust format classification slightly
more." This is not unreasonable in theory, but the inconsistency across seeds means the
finding is not about 24-styles specifically.

**Statistically meaningful:** NO. The improvement from this change alone cannot be isolated
from the extreme score boost that accompanied it. The optimizer accepted it as a
noise-neutral tag-along, not as an independently validated improvement.

**Verdict: DO NOT PROMOTE**

Reason: Inconsistent across seeds. The signal is indistinguishable from random walk noise
with 40 data points. Promoting it would embed a spurious preference that cannot be
validated or falsified.

---

### 3. `nicheDifficultyFactors.personal-finance`: 0.90 → 0.871

**Cross-seed consistency:** NO. Only seed 123 changed this.

**Mechanism interpretable:** N/A. Zero runs in the dataset use niche/account calibration
(35/40 are raw VPS mode with no account_size). This change has literally zero effect on
any prediction in the current dataset.

**Statistically meaningful:** NO. Zero observable effect.

**Verdict: DO NOT PROMOTE**

Reason: Untestable — no data exists to evaluate this change. It was accepted only because
it was noise-neutral alongside the extreme boost.

---

### 4. `nicheDifficultyFactors.productivity`: 0.92 → 0.901

**Verdict: DO NOT PROMOTE** (same reasoning as personal-finance above)

---

## Promotion Instructions

### Change #1: Extreme Score Boost (PROMOTE)

**Production file:**
`src/lib/orchestration/kai-orchestrator.ts`

**Location:** Line 1936-1937 (inside `applyLLMConsensusGate`, the re-aggregation loop)

**Current code:**
```typescript
const score = result.prediction || 50;
if (score < 30 || score > 80) {
  weight *= 1.5;
}
```

**Proposed code:**
```typescript
const score = result.prediction || 50;
if (score < 30 || score > 80) {
  weight *= 2.0;
}
```

**What this does in plain English:**
When the LLM consensus gate re-computes path aggregations, non-LLM components that
predict extreme scores (below 30 or above 80 VPS) currently get 1.5× their confidence
as weight. This change increases that to 2.0×. The effect is that decisive predictions
("this video will clearly flop" or "this video will clearly go viral") carry more
influence relative to cautious middle-of-the-road predictions.

**Important context:**
- This boost exists ONLY in the LLM consensus gate re-aggregation (line 1936).
- The first-pass aggregation (line 1428-1431) does NOT have this boost — it was explicitly
  removed as CCI-L3-007 ("was inflating pre-gate values").
- Do NOT add this boost to the first-pass aggregation.

### Rollback Instructions

If the change causes degradation in prediction quality after deployment:

1. Revert line 1937 of `kai-orchestrator.ts` from `weight *= 2.0;` to `weight *= 1.5;`
2. No database changes needed — this is a pure computation parameter
3. No migration needed — the change only affects future predictions
4. Previous predictions stored in `prediction_runs` are not affected

**Monitoring checklist after promotion:**
- Watch the Spearman evaluation (`/api/cron/training-pipeline?step=eval`) for rho changes
- Compare predictions made after the change to pre-change predictions on similar content
- Check that the Pack Health Dashboard shows no new component failures
- If rho drops by > 0.1 compared to the pre-change evaluation, revert immediately

### Re-Validation Trigger

Re-run the autoresearch sandbox when ANY of these conditions are met:

1. **Labeled data reaches 80+ runs** (currently 54, 40 replayable)
2. **Creator-facing predictions** generate 20+ runs with account_size populated
3. **Niche labeling** is backfilled so < 20% of runs are "unknown"
4. **3 months** have elapsed since this optimization (2026-06-22)

To re-run:
```bash
cd C:\Projects\CleanCopy
npx tsx autoresearch/export-snapshot.ts          # Fresh export
npx tsx autoresearch/sandbox/baseline-check.ts   # Verify replay
npx tsx autoresearch/sandbox/optimize-weights.ts --experiments 500 --seed 7
npx tsx autoresearch/sandbox/optimize-weights.ts --experiments 500 --seed 42
npx tsx autoresearch/sandbox/optimize-weights.ts --experiments 500 --seed 123
```

---

## Sandbox Health Assessment

### Is the infrastructure working as designed?

**YES.** The system performed exactly as intended:

- **Export** correctly pulled 54 labeled runs + 992 component results
- **Replay** faithfully reproduced current production logic (fidelity MAE 8.54)
- **Evaluation** computed Spearman rho, MAE, per-niche, and bootstrap CIs
- **Guardrails** rejected 99.8% of experiments — correctly refusing to accept noise
- **Cross-seed validation** distinguished real signal (extreme boost) from noise
  (component multipliers)

The 0.2% acceptance rate looks low but is the right behavior. With 40 data points and
fold std of 0.42, most perturbations are genuinely indistinguishable from noise.

### What would make the next round more useful?

In priority order:

1. **More labeled data** (highest leverage). 40→100 runs would cut fold variance
   roughly in half, enabling the optimizer to detect smaller improvements.
2. **Consistent niche labeling**. 29/54 runs are "unknown" niche, blocking all
   niche-specific optimization.
3. **Creator-facing prediction runs** with account_size populated. Currently 35/40
   replayable runs are raw VPS mode, making niche/account factors untestable.
4. **Multiple active paths**. All scoring components land in `pattern_based`. Until
   quantitative or qualitative paths have contributing components, path weights and
   context weights are inert.

### Single highest-leverage action before running again

**Label more videos.** Specifically: get 60+ more prediction runs through the pipeline
with post-publication actuals attached, ensuring the niche field in cohort_key is
populated. This single action would:
- Increase replayable runs from 40 to ~80-100
- Reduce fold variance by ~40%
- Enable the optimizer to detect improvements with effect size 0.15 (vs 0.3 today)
- Make per-niche guardails meaningful (multiple niches with n >= 10)
