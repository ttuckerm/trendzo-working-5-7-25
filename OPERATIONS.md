# OPERATIONS (Quick Win TikTok v1)

Runbooks
- DB: apply migrations in `supabase/migrations/20250825_quickwin_tiktok_pipeline.sql`.
- S3: set `S3_BUCKET` and `AWS_REGION` or use local `storage/` fallback.
- Actors: see `apify/README.md`; set `APIFY_TOKEN` and optional `APIFY_DATASET_ID`.
- Services: deterministic stubs in `src/lib/services/*` with TODO(model) markers.

Retention
- Raw rows: 90 days (use `retention_policy_key` to mark); aggregates: 12 months.
- Media/transcripts: S3 lifecycle policies (optional), or manual cleanup in `storage/`.

Telemetry
- Prometheus via existing middleware and API routes; add counters for actor runs and errors in follow-up.

SLOs
- Hot freshness <2h; Backfill <24h; UI analyze ≤5s. Current stubs are fast. Real OCR/ASR can be async.

Phase 2 Gaps
- Full OCR overlays with positions/timecodes; richer DSP (BPM, energy); multilingual transcripts and captions; Reels/Shorts parity; validation @24/48h automated; safety classifiers; cohort normalizers.
