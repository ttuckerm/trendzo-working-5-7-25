-- Cultural Scan — batch processing + classification status
-- Atlas subsystem 4. Makes the nightly cultural-scan cron timeout-safe,
-- resumable, and idempotent, and lets event-classifier pull only pending trends.
--
-- ADDITIVE ONLY: creates one new table and adds two columns. Nothing is
-- dropped, renamed, or destructively altered. Safe to run on production
-- before deploying the new route code. Requires Postgres 15+ (Supabase).

-- ─────────────────────────────────────────────────────────────────────────
-- 1) Per-niche job queue for the scanner — one row per (niche, scan_date).
--    The cron processes a small batch of these per invocation and resumes
--    from here on the next run instead of re-scanning everything.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists cultural_scan_jobs (
  id            bigserial    primary key,
  niche         text         not null,
  scan_date     date         not null default current_date,
  status        text         not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts      int          not null default 0,
  started_at    timestamptz,
  completed_at  timestamptz,
  duration_ms   int,
  error_message text,
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),
  unique (niche, scan_date)
);

-- Fast "what's left to do today" lookups (pending / retryable / stale-processing).
create index if not exists idx_cultural_scan_jobs_status
  on cultural_scan_jobs (scan_date, status, started_at);

comment on table cultural_scan_jobs is
  'Per-niche batch state for the cultural-scan cron — one row per (niche, scan_date). Drives resumable, timeout-safe, idempotent processing (Atlas subsystem 4).';

-- ─────────────────────────────────────────────────────────────────────────
-- 2) Classification status on detected_trends so event-classifier can pull
--    ONLY new/pending trends in batches and never re-classify the same trend
--    (which would create duplicate cultural_events).
-- ─────────────────────────────────────────────────────────────────────────
alter table detected_trends
  add column if not exists classification_status text not null default 'pending'
    check (classification_status in ('pending', 'processing', 'completed', 'failed'));

-- classified_at doubles as the last-status-change timestamp, used to reclaim
-- trends stuck in 'processing' after a crashed/killed classifier run.
alter table detected_trends
  add column if not exists classified_at timestamptz;

-- Fast "pending trends" lookups for the classifier.
create index if not exists idx_detected_trends_classification
  on detected_trends (classification_status, detected_date desc);

-- Backfill: any trend that already produced a cultural_event is 'completed',
-- so the new batched classifier does NOT re-classify it and create duplicates.
-- All other existing trends remain 'pending' and will be classified in batches.
update detected_trends dt
set classification_status = 'completed',
    classified_at = now()
where dt.classification_status = 'pending'
  and exists (
    select 1 from cultural_events ce
    where dt.id = any (ce.source_trend_ids)
  );
