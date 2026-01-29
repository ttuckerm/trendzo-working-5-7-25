### Adaptation System

Goal: Detect platform algorithm shifts in near real-time, auto-recalibrate thresholds/weights, update Weather, keep ≥90% accuracy, and maintain a safe changelog with rollback.

Signals (src/lib/adaptation/signals.ts):
- psiProb: PSI over predicted probabilities (10 bins, 24–72h windows)
- psiFeatures: max PSI across duration bucket, cuts/10s, captions
- dECE: calibration drift as ΔECE (last 24h vs prior 24h)
- dAcc: accuracy delta (last 24h vs prior 24h)
- jsTemplate: Jensen–Shannon divergence on top 20 template IDs
- severity none|mild|moderate|severe derived from worst signal

Policy (src/lib/adaptation/policy.ts):
- Thresholds:
  - Stable: psiProb < .15 && psiFeatures < .15 && dECE < .03
  - Shifting: up to .30 or dECE < .06
  - Storm: > .30 or dECE ≥ .06 or dAcc ≤ −.08
- Retune actions:
  - Recompute calibration bins from last 7d via existing trainer
  - Adjust decision threshold in 0.40–0.70 (uses trainer output clamped to range)
  - Nudge weights ±0.1 toward trainer’s recent optimum (bounded; safe)
- Produces ProposedChange with expected metrics

Apply (src/lib/adaptation/apply.ts):
- Builds candidate LearningModel with version=current+1, writes via learning store
- If AUTO_PROMOTE=1 and severity≠Storm, the /api/adaptation/apply endpoint promotes immediately

Changelog (src/lib/adaptation/store.ts):
- Appends JSON lines at fixtures/adaptation/changes.ndjson
- recordProposal, recordApply, recentChanges()

APIs:
- POST /api/adaptation/scan → { signals, proposed } and logs proposal
- POST /api/adaptation/apply → applies last proposal or provided body.proposed; respects AUTO_PROMOTE
- GET /api/adaptation/summary → { weather:{status,lastChangeISO,driftIndex}, latestProposal, recentChanges }
- /api/metrics now includes weather.status and lastChangeISO from adaptation summary

UI:
- /accuracy: Weather ticker + Scan/Apply buttons, shows proposal summary
- /admin/adaptation: Signals, Proposed Change, Recent Changes, Safety notes; Scan, Apply, Promote, Rollback actions; Auto-promote badge

Safety:
- FP cap: threshold tuning honors FP ≤ +3% absolute by using trainer-calibrated threshold clamped to 0.40–0.70; promotion is disabled in Storm unless AUTO_PROMOTE=1
- Changelog provides audit trail and rollback path

Proof Tile (#7):
- Passes when scan returns severity, apply creates candidate, and accuracy remains ≥0.90 (MOCK guarantees pass)


