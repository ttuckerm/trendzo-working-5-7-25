# Phase 81: Training Pipeline v2 — Implementation Charter

## Context

Training Pipeline v1 established data-readiness: labeled training data, feature extraction (96+ features across 14 groups), and the training jobs infrastructure. **v2 adds three critical capabilities:**

1. **Contamination Firewall** — Prevents post-execution metrics (views, likes, engagement rates) from leaking into pre-execution prediction models.
2. **Model Versioning** — Semantic versioning for score and coach models with lineage tracking.
3. **Audit Infrastructure** — Every training job produces a contamination audit record; no model reaches production without a passing audit.

All v2 functionality is gated behind the `TRAINING_V2_ENABLED` feature flag (`process.env.TRAINING_V2_ENABLED === 'true'`). When disabled, the system behaves exactly as v1.

---

## UI Placement

All UI additions live on the existing `/admin/operations/training` pages.

| Component | Location | Description |
|---|---|---|
| Feature Matrix Table | Training Readiness tab (new section) | Read-only table of all features with pre/post availability, category, and contamination status |
| Contamination Audit Badge | Training Jobs list (inline) | Green/red badge on each job row showing audit pass/fail |
| Audit Detail Modal | Training Jobs list (click badge) | Modal with full audit details: features checked, contaminated features found, pass/fail |
| Model Version History | Model Versions tab (existing) | Enhanced with contamination_audit_id link, versioning scheme display |
| Performance Segments | Model detail view (new section) | Per-niche MAE, RMSE, correlation, bias, sample count |
| Deploy Gate Indicator | Model detail view (inline) | Visual indicator showing all 3 gates (feature matrix, audit, deploy) status |

---

## API Boundaries

### Existing Endpoints (no changes)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/training/readiness` | GET | Training data readiness summary |
| `/api/training/data` | GET | Training data listing with filters |
| `/api/training/labels` | POST | Label/relabel training data rows |

### Fixed Endpoints

| Endpoint | Method | Change |
|---|---|---|
| `/api/training/jobs` | POST | Add pre-training contamination audit; reject job if audit fails |

### New Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/training/validate-features` | POST | Accepts feature key array, returns contamination check result |
| `/api/training/models/[id]/performance` | GET | Per-niche performance segments for a model version |

---

## Database Tables

### Existing (unchanged schema)

| Table | Role in v2 |
|---|---|
| `prediction_runs` | Source of labeled outcomes for training data |
| `run_component_results` | Per-component scores feeding feature extraction |
| `training_data` | Labeled rows consumed by training jobs |
| `training_jobs` | Job records; v2 adds contamination audit check before execution |
| `model_versions` | Gets new `contamination_audit_id` FK column |

### New Tables

| Table | Purpose |
|---|---|
| `feature_availability_matrix` | Catalogs every feature with pre/post availability flags |
| `contamination_audit_log` | Audit trail of contamination checks per training job |
| `model_performance_segments` | Per-niche performance metrics per model version |

Migration: `supabase/migrations/20260212_training_pipeline_v2.sql`

---

## "God-like Certainty" Definition

A model version achieves deployment certainty when it passes all three gates:

### Gate 1: Feature Matrix Validation
- Every feature used in training exists in `feature_availability_matrix`.
- Every feature marked `available_pre = false` is excluded from the training feature set.
- Zero contaminated features present in the input vector.

### Gate 2: Pre-Training Contamination Audit
- Before a training job executes, the system runs `getContaminatedFromKeys()` against the feature set.
- Result is persisted to `contamination_audit_log` with `passed = true/false`.
- If `passed = false`, the training job is rejected and the audit record shows which features were contaminated.

### Gate 3: Deploy Gate
- A model version can only be promoted to production if:
  - `contamination_audit_id` is non-null on the `model_versions` row.
  - The referenced `contamination_audit_log` record has `passed = true`.
  - Performance segments exist for at least the model's target niche.
- All three conditions are checked atomically at deploy time.

---

## Versioning Scheme

| Model Type | Format | Example | Bump Rules |
|---|---|---|---|
| Score model | `score-v{major}.{minor}` | `score-v2.3` | Major: new feature groups or architecture change. Minor: retraining with same features. |
| Coach model | `coach-v{major}.{minor}` | `coach-v1.0` | Major: new coaching dimensions. Minor: weight/threshold updates. |
| General | `{type}-v{major}.{minor}.{patch}` | `score-v2.3.1` | Patch: config-only changes, no retraining. |

Version strings are stored in `model_versions.version` and follow strict semver parsing. The contamination audit is tied to the specific version — retraining always produces a new minor (or major) version.

---

## Acceptance Test Checklist

- [ ] `TRAINING_V2_ENABLED=false`: all v1 behavior unchanged, no new UI sections visible, no audit checks run.
- [ ] `TRAINING_V2_ENABLED=true`: Feature Matrix Table renders on Training Readiness tab with all 96+ features.
- [ ] Feature Matrix correctly marks all Group 3 (actual_*, engagement_*, viral_coefficient, etc.) as `available_pre = false`.
- [ ] POST `/api/training/jobs` with contaminated features in the feature set returns 400 with audit details.
- [ ] POST `/api/training/jobs` with clean features creates job AND creates passing `contamination_audit_log` record.
- [ ] POST `/api/training/validate-features` returns `{ passed: false, contaminated: [...] }` for a feature set containing `actual_views`.
- [ ] POST `/api/training/validate-features` returns `{ passed: true, contaminated: [] }` for a clean feature set.
- [ ] `model_versions` row created by a training job has `contamination_audit_id` set.
- [ ] GET `/api/training/models/[id]/performance` returns per-niche segments after training completes.
- [ ] Deploy gate prevents promotion of a model with null or failing `contamination_audit_id`.
- [ ] Migration `20260212_training_pipeline_v2.sql` applies cleanly on a fresh database with existing tables present.
- [ ] All new tables have appropriate indexes and comments.
- [ ] Version strings follow `{type}-v{major}.{minor}` format in all created model_versions rows.
