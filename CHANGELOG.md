v0.5.0-verified — Seven changes PASS; cohort=2025W33

- Baselines: weekly cohort recompute returns version (e.g., 2025W33) and validates table/view wiring via `recomputeCohortStats`
- Incubation: unified engine persists `incubation_label` and `cohort_version` to `viral_predictions` and verifies the latest row
- Metrics: nightly computation or on-demand run writes `accuracy_metrics` with fields `n`, `auroc`, `precision_at_100`, `ece`, and `heated_excluded_count`
- Artifacts: training flow persists model artifacts under `storage/models/<platform>/<version>.json` and logs to `experiment_runs`
- Heating: exclusion count tracked as `heated_excluded_count` in metrics
- Thresholds centralized: engines import configuration from `src/config/viral-thresholds.ts`
- Apify retry: all Apify calls wrapped by `withRetry(...)`

All seven checks pass against the live system.


v0.7.0-moat2 — Moat #2: First-Hour Telemetry & Alignment

- API/DB: Added POST /api/telemetry/first_hour with token auth; created table first_hour_telemetry(video_id text, ts timestamptz, views int, unique_viewers int, avg_watch_pct numeric, completion_rate numeric, rewatches int, shares int, saves int, comments int, source text, created_at timestamptz default now(), primary key(video_id, ts)) with index on (video_id, ts)
- Mapping: Extended expected first-hour profiles per token and merge logic in src/lib/frameworks/mapping_guide.ts
- Scoring: UnifiedPredictionEngine applies alignment_factor from latest first-hour telemetry vs expected profile; clamped to [0.85, 1.15]; persisted telemetry_snapshot
- Simulator: /api/simulate/edits accepts telemetry_override and returns alignment_factor-aware new_score
- UI: Prediction detail adds Telemetry panel with alignment badge
- Status: /api/admin/integration/status includes telemetry_sample_rate_7d and telemetry_last_ingest; health card notes alignment factor applied (0.85–1.15)
- Dry-run: GET /api/admin/integration/dryrun_telemetry seeds points, computes alignment_factor, updates score/confidence, returns JSON proof

v0.8.0-moat3 — Moat #3: Public Baseline Oracle

- Endpoint: Public sanitized GET /status/baseline with 5-minute cache and rate limit
- Page: /baseline renders cohort, N, AUROC, Precision@100, ECE with methods note
- Job: Daily baseline_public_metrics computation; surfaced baseline_last_run in status
- Security: CORS for GET, rate-limit, no IDs

v0.9.0-moat4 — Moat #4: Cultural Timing Intelligence

- Ingest: trend_signals and trend_nowcast schemas; dry-run seeding route
- Nowcast: velocity, acceleration, half-life, strength computation
- Scoring: TimingScore integrated into UnifiedPredictionEngine; persisted timing_snapshot
- API/UI: /api/algorithm_weather and dashboard Algorithm Weather card

v0.10.0-moat5 — Moat #5: Creator Fingerprinting 2.0

- DB: creator_profiles, creator_token_coeffs
- Builder: 32-dim style_embedding, baselines, smoothed per-token coeffs, cold-start priors
- Scoring: personalizationFactor blended 70/30, clamped, persisted in creatorSnapshot
- APIs/UI: rebuild/get profile endpoints; Creator Profile panel

v0.11.0-moat6 — Moat #6: Data Trust & Audit Trail

- Append-only audit tables and events
- Deterministic digests + HMAC signatures on predictions
- Evidence pack endpoint and storage
- Public integrity status with caching & rate limit

v0.16.0-moatA-simulator — Moat A: Synthetic Audience Simulator

- Engine: 10k-agent Synthetic Audience Simulator using tokens, framework profile, timing score, and creator fingerprint to sample CTR, completion, rewatch, share/save/comment, and bounce; outputs sim_score
- Scoring integration: sim_factor derived from sim_score clamped to [0.92–1.12]; persisted simulatorSnapshot in prediction meta/factors
- APIs: POST /api/simulator/run and POST /api/simulator/variants (top-N counterfactuals ranked by sim_score)
- UI: “Simulator” tab on Advanced Prediction detail showing outcomes and top variant
- Status: added simulator_last_run and sim_variants_generated_24h in integration status
- Dry-run: GET /api/admin/integration/dryrun_simulator returns sample payload for verification

v0.17.0-moatB-uplift — Moat B: Causal Uplift/RCT

- DB: experiments, experiment_arms, assignments, outcomes, treatment_effects
- API: POST /api/experiments/assign for randomized arm assignment with persisted propensity and edits
- Estimator: CUPED/IPW-inspired uplift in src/lib/experiments/uplift.ts writing effects with CIs
- UI: Experiments dashboard listing experiments, arms, and treatment effects
- Status: experiments_active and last_uplift_compute included in integration status
- Dry-run: GET /api/admin/integration/dryrun_experiments seeds data and computes uplift

v0.18.0-moatC-commerce — Moat C: Commerce Bridge

- APIs: pixel ingest and Shopify/TikTok Shop webhooks secured with x-api-key (telemetry keys)
- DB: commerce_events, orders, attribution with aggregates
- Model: RevenueScore integrated into UnifiedPredictionEngine; persisted commerceSnapshot
- UI: Commerce panel on prediction detail with clicks, orders, revenue, RevenueScore, lift
- Status: commerce_events_24h, orders_24h, revenue_24h added
- Dry-run: GET /api/admin/integration/dryrun_commerce seeds clicks/orders and returns proof payload

v0.19.0-moatD-publicapi — Moat D: Public Scoring API + SDKs + editor plugin stubs + status + dry-run

- Public API: POST /public/score secured by telemetry x-api-key, CORS, JSON errors, metering
- SDKs: JS and Python helpers to call public scoring
- Plugins: Premiere/AE CEP panel, Descript CLI, CapCut helper stubs wired to API
- Status: public_api_requests_24h and plugins_installed_count in integration status
- Dry-run: GET /api/admin/integration/dryrun_public_api loads modules in-process and returns sample

