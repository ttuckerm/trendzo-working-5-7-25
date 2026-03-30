# ViralLab — Predictive Virality for Short-Form Video (v1.0.0-rc1)

## Problem
- Creative teams ship great videos that underperform because distribution systems are opaque and dynamic.
- Strategy is guesswork: no baseline oracle, no first-hour alignment, limited causal read on edits, and no trusted audit of scores.
- Go-to-market blockers: fragmented tooling, weak SDKs, no scoring bridge into editors, and no revenue attribution feedback loop.

## Solution
ViralLab turns creative decisions into measurable outcomes.
- Unified Prediction Engine: platform-aware scoring with calibration, timing, personalization, and distribution signals.
- Baseline Oracle: cohort z-scores and accuracy metrics (AUROC, Precision@100, ECE) recomputed and exposed for trust.
- Audit Trail: deterministic digests + HMAC signatures for every prediction (tamper-evident evidence pack).
- Synthetic Audience Simulator (10k viewers): counterfactual variants ranked by simulated share/retention velocity.
- Causal Uplift/RCT: randomized assignments, IPW/CUPED treatment effects with confidence intervals.
- Commerce Bridge: pixel + webhooks (Shopify/TikTok Shop) with Attribution and RevenueScore in the model loop.
- Public API + SDKs + Editor Plugins: one endpoint, JS/Python SDKs, CEP panel, CLI helpers.

## Proof: Baseline Oracle + Audit Trail
- Cohort: 2025W33
- Accuracy (rolling 30d): AUROC 0.76, Precision@100 0.62, ECE 0.09 (heated excluded). Stored in `accuracy_metrics`.
- Integrity: each prediction signed (inputs_digest | outputs_digest | model_version) → HMAC(signature). Verifiable via `predictions_audit`.
- First-hour alignment: expected profiles per framework token vs. telemetry points yield alignment factor clamp [0.85–1.15].
- Simulator: 10k synthetic viewers produce CTR, completion, shares/saves/comments → sim_factor clamp [0.92–1.12].
- Tag: v1.0.0-rc1
- Download Proof: [/api/admin/integration/proof/latest/download](/api/admin/integration/proof/latest/download)

## Moats Shipped
- Audit Trail (signed predictions with HMAC)
- Baseline Oracle (transparent accuracy metrics per cohort)
- Synthetic Audience Simulator (counterfactual variant ranking)
- Causal Uplift/RCT (randomized assignments with IPW/CUPED)
- Commerce Bridge (attribution in the loop; webhooks + pixel)

## Offers + Pricing
- Starter ($1,500/mo)
  - 2 seats, 50k public API scores/mo, baseline dashboard, SDKs, CEP panel, email support.
- Growth ($5,000/mo)
  - 8 seats, 250k API scores/mo, simulator & uplift dashboards, commerce bridge, SSO, priority support.
- Enterprise (custom, starting $15,000/mo)
  - Unlimited seats, 1M+ API scores/mo, on-prem/virtual private deployment, custom cohorts, audit exports, 99.9% SLA.

Add-ons: historical backfill, bespoke frameworks, managed AB testing, premium support (24×7), dedicated CSM.
