# Baseline Reproduction Report

**Date:** 2026-03-22
**Config:** baseline-v1
**Snapshot:** 2026-03-22 (54 labeled runs)

---

## 1. Exported Sample Counts

| Metric | Value |
|---|---|
| Total labeled runs | 54 |
| Component result rows | 992 |
| Avg components per run | 18.4 |
| Truncated raw_result | 0 |
| Runs missing components | 1 |

## 2. Niche Distribution

| Niche | Count |
|---|---|
| unknown | 29 |
| side-hustles | 24 |
| side_hustles | 1 |

**Note:** 29 runs have no niche in cohort_key (stored as "unknown:unknown"). These are
older runs created before cohort_key was populated. The `side_hustles` vs `side-hustles`
variant is a normalization artifact (underscore vs hyphen).

## 3. Replay Coverage

| Metric | Value |
|---|---|
| Replayed | 40 / 54 (74%) |
| Skipped | 14 |
| Skip reason | 14 runs had no scoreable components (0 successful predictions) |

The 14 skipped runs had components that all returned null predictions or failed entirely.
74% coverage passes the 50% minimum gate.

## 4. Replay Fidelity (Replayed VPS vs Production Predicted VPS)

| Metric | Value |
|---|---|
| MAE | 8.54 VPS |
| Max single-run delta | 27.0 VPS |
| Rank correlation | 0.308 |

### Fidelity Gap Analysis

The replay produces VPS close to `raw_result.adjustments.rawScore` (the pre-niche/account
orchestrator output). The stored `predicted_dps_7d` includes **pipeline calibrator** adjustments
that the replay does not fully replicate.

**Root cause of largest mismatches (20-27 VPS):**
- Runs from 2026-03-09 to 2026-03-14 were computed when **Rule 4 (high VPS scaling)** was
  still active. Rule 4 applied a 15-25% multiplicative reduction to scores above 60.
- Rule 4 was disabled on 2026-03-11 ("Scoring Rescue"). The current baseline config
  correctly reflects the disabled state.
- These runs also show the niche factor was applied (side-hustles: 0.85), compounding
  with Rule 4 to produce the ~25 VPS gap.

**Older runs (Jan-Feb) have small negative gaps (-5 to -6 VPS):**
- These show predicted > rawScore, suggesting a different calibration path was active
  (possibly pattern boost or earlier calibration logic).

**This fidelity gap is expected and acceptable** because:
1. The replay faithfully implements the *current* production logic
2. Historical `predicted_dps_7d` values were computed with *different* code versions
3. For optimization, what matters is rank-ordering vs actuals, not matching historical predictions

## 5. Baseline Sandbox Eval (Replayed VPS vs Actual VPS)

| Metric | Value |
|---|---|
| N | 40 |
| Spearman rho | -0.396 |
| p-value | 0.011 |
| MAE vs actuals | 18.31 VPS |
| Within range | 0% |
| Bootstrap 95% CI | [-0.677, -0.061] |
| CI width | 0.615 |

### Interpretation

- **Negative Spearman rho (-0.396):** The current scoring system's rank ordering is
  **inversely correlated** with actual performance. This means higher-predicted videos
  tend to perform worse, and vice versa. This is a strong signal that the weighting
  parameters need adjustment.
- **p-value 0.011:** The negative correlation is statistically significant (p < 0.05).
- **Wide CI (0.615):** With only 40 data points, precision is limited. Any optimization
  improvement less than ~0.25 rho cannot be distinguished from noise.
- **MAE 18.31:** Average absolute error is 18 VPS points — substantial room for improvement.
- **Within range 0%:** No actual outcomes fell within the predicted confidence intervals.

### Per-Niche Breakdown

| Niche | N | Spearman rho | MAE |
|---|---|---|---|
| side-hustles | 24 | -0.030 | 14.30 |
| unknown | 15 | -0.734 | 25.77 |
| side_hustles | 1 | N/A | 2.79 |

The "unknown" niche group has severely negative rho (-0.734), driving the overall negative
correlation. This group likely contains diverse content without proper niche labeling.

## 6. Go/No-Go Recommendation

### **GO — Proceed to Prompt 4 Optimization**

All three validation gates passed:
- [PASS] MIN_LABELED_ROWS: 54 >= 5
- [PASS] REPLAY_COVERAGE: 74% >= 50%
- [PASS] BASELINE_FIDELITY: MAE 8.54 <= 15

### Caveats for Optimization

1. **Small dataset.** 40 replayable runs is enough to detect large improvements but not
   fine-grained tuning. Bootstrap CI width of 0.615 means only improvements > 0.25 rho
   should be trusted.

2. **Niche concentration.** 24/40 runs are side-hustles, 15 are unknown. Optimization
   results will be biased toward side-hustles performance.

3. **Negative baseline.** Starting from rho = -0.396 means even a random config might
   improve. The optimization target should be rho > 0 (positive correlation), not just
   "better than baseline."

4. **Code version heterogeneity.** Historical predictions were made with different code
   versions. The replay uses current logic, so optimization will tune for the current
   system — which is the right approach.

5. **14 skipped runs.** These runs cannot be included in optimization. Improving component
   reliability to reduce the skip rate is a separate concern.
