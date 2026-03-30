# BMAD A++ Scorecard (Authoritative)

Version: 1.0  
Owner: System Architect (Algo)  
Reviewers: PM, ML Lead, Backend Lead, QA Lead, SRE  
Flag: `FF-AlgoAplusplus`

Scope: Defines acceptance gates and monitoring required to certify the recommender as A++.

North Star Objective: Maximize user minutes without regret while maintaining policy/safety and operational SLOs.

Acceptance Gates (go/no‑go)
- Predictability
  - Early watch‑time prediction MAPE ≤ 10% by 1,000 impressions (per cohort)
  - Expected Calibration Error (ECE) ≤ 0.03 (per cohort)
  - 90% CI relative width ≤ 20% by 1,000 impressions
  - Impressions‑to‑lock‑in (stable rank) reduced ≥ 40% vs baseline
- Performance
  - Average View Duration (AVD) +15–25% on exposed cohort
  - Share rate +15–30%
- Satisfaction / Safety
  - Regret/negative feedback rate −30%
  - 7‑day return‑visit uplift ≥ 5–10%
  - Policy violations ≤ baseline (no increase)
- Reliability (Serving)
  - p95 scoring latency ≤ 120ms; error rate ≤ 0.3%; availability ≥ 99.9%

Cohorts (Calibration & Reporting)
- By device (ios/android/web), country/region, platform placement, content category.
- All acceptance gates evaluated per cohort and overall.

Dashboards (single pane of glass)
- Predictability: MAPE@1k, ECE, CI width, impressions‑to‑confidence.
- Performance: AVD, share rate, completion, session continuation.
- Satisfaction: regret/NI rate, return‑visit delta, comment sentiment.
- Reliability: latency, error rate, saturation/novelty decay.
- Exploration: promotion/demotion counts, exposure by uncertainty, cold‑start budget spend.

Alerting (Pager/Slack)
- Drift: ECE or MAPE degradation > 15% week‑over‑week per cohort.
- Calibration: CI miscoverage outside 85–95% band on 90% CI.
- Regret: +20% over 24h in any cohort triggers auto‑cap rule.
- Latency: p95 > 120ms for 15 minutes.

Instrumentation & Contracts
- Every scoring call logs: `auditId`, `alg_version`, `cohort_id`, `request_id`, `user_id` (hashed), `item_id`, `scores.{watch,share,regret}`, `score_ci`, `calibration_version`.
- Events: `EVT.Rec.ScoreServed`, `EVT.Rec.ItemPromoted`, `EVT.Rec.ItemDemoted`, `EVT.Rec.RegretCapped`.

Rollout Policy
- Canary 5% → 25% → 50% → 100% with switchback tests for calibration validation.
- Auto‑rollback if: regret +15% for 2h, ECE > 0.05, or p95 latency > 150ms sustained.

Verification (QA)
- Offline replay parity: ΔAUC < 0.5 pts; calibration parity within ±0.01 ECE.
- Online: CUPED or switchback; power ≥ 80% at δ set by gates.

Ownership
- ML Lead: calibration pipeline, multi‑head training.
- Backend Lead: serving, feature store, exploration policy.
- PM: success criteria and experiment design.
- QA Lead: acceptance tests, smoke, rollback drills.
- SRE: SLOs, alert routing, incident runbooks.

Change Control
- Any change affecting the above gates requires ADR and sign‑off from Owner + ML + SRE.


