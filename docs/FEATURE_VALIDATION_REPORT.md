# Feature Validation Report — New Pre-Publication Features

**Date:** 2026-03-19
**Total training rows:** 963
**Videos with DPS:** 863
**Videos with creator deviation:** 863

---

## specificity_score

- **Non-null count:** 0
- *No data available*

## instructional_density

- **Non-null count:** 0
- *No data available*

## has_step_structure

- **Non-null count:** 0
- *No data available*

## hedge_word_density

- **Non-null count:** 0
- *No data available*

## vocal_confidence_composite

- **Non-null count:** 962
- **Min:** 0.0000
- **Max:** 0.9760
- **Mean:** 0.3140
- **Median:** 0.2500
- **Spearman r (DPS):** 0.1470 (n=862)
- **Spearman r (deviation):** 0.0759 (n=862)

## visual_proof_ratio

- **Non-null count:** 936
- **Min:** 0.0000
- **Max:** 1.0000
- **Mean:** 0.1892
- **Median:** 0.0000
- **Spearman r (DPS):** 0.3981 (n=843)
- **Spearman r (deviation):** 0.2222 (n=843)

## talking_head_ratio

- **Non-null count:** 936
- **Min:** 0.0000
- **Max:** 1.0000
- **Mean:** 0.6382
- **Median:** 0.8889
- **Spearman r (DPS):** -0.1096 (n=843)
- **Spearman r (deviation):** 0.0140 (n=843)
- **FLAG: weak — consider dropping before retrain**

## visual_to_verbal_ratio

- **Non-null count:** 0
- *No data available*

## text_overlay_density

- **Non-null count:** 936
- **Min:** 0.0000
- **Max:** 9.0000
- **Mean:** 0.2848
- **Median:** 0.0000
- **Spearman r (DPS):** 0.4551 (n=843)
- **Spearman r (deviation):** 0.4422 (n=843)

---

## Summary Table

| Feature | N | r(DPS) | r(deviation) | Status |
|---------|---|--------|-------------|--------|
| specificity_score | 0 | 0.000 | 0.000 | WEAK |
| instructional_density | 0 | 0.000 | 0.000 | WEAK |
| has_step_structure | 0 | 0.000 | 0.000 | WEAK |
| hedge_word_density | 0 | 0.000 | 0.000 | WEAK |
| vocal_confidence_composite | 962 | 0.147 | 0.076 | MODERATE |
| visual_proof_ratio | 936 | 0.398 | 0.222 | STRONG |
| talking_head_ratio | 936 | -0.110 | 0.014 | WEAK |
| visual_to_verbal_ratio | 0 | 0.000 | 0.000 | WEAK |
| text_overlay_density | 936 | 0.455 | 0.442 | STRONG |

---

## Recommendation: Proceed to retrain?

**Y — Proceed to retrain with caution.**

2 strong + 1 moderate features.

Consider dropping before retrain:
- talking_head_ratio: r(dev)=0.014
