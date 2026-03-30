### Experiments (A/B + Bandit Autopilot)

Concepts
- Experiments contain 2+ variants and a primary objective (viral48h).
- Modes: ab (fixed split) or bandit (Thompson Sampling with Beta priors).
- Guardrails: maxImpressions, minSamples, minLift, maxDays.
- Status: running, paused, stopped, winner; Autopilot optionally marks deployed=true when winner chosen.

Storage
- All data under fixtures/experiments/: experiment JSON and reports NDJSON.
- Atomic writes via tmp+rename; MOCK seeds a demo bandit experiment.

APIs
- POST /api/experiments/create { name, mode, variants, guardrails?, autopilot? }
- POST /api/experiments/assign { experimentId, subjectId?, videoId? } → { variantId }
- POST /api/experiments/report { experimentId, variantId, impressions?, clicks?, views48h?, viral? }
- POST /api/experiments/stop { experimentId }
- GET /api/experiments/[id]/summary
- GET /api/experiments/leaderboard
- POST /api/experiments/simulate (MOCK only) { experimentId?, ticks? }

Autopilot
- When winner determined and autopilot enabled, applyWinner() marks winnerVariantId and deployed=true (no side effects).

Simulator (MOCK)
- Seeds impressions and viral outcomes with per-variant biases so the winner emerges.

Usage
- Create → Assign in your flows → Report outcomes → Summary picks winner → Apply if autopilot.

## Experiments & Shadow Mode

Endpoints:
- POST `/api/experiments/start` { variant, cohort_rules }
- GET `/api/experiments/status?id=...` → { samples, lift, sig_p, stop }

Shadow divergence logs in `shadow_divergence`.

