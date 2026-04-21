-- Fix: .upsert({ onConflict: 'niche,source,subreddit,scan_date' }) at
-- src/app/api/cron/cultural-scan/route.ts failed because the existing unique index
-- used a function-based expression (coalesce(subreddit, '_none_')) which Postgres
-- ON CONFLICT column lists cannot target. Replace with a plain unique constraint
-- using NULLS NOT DISTINCT so Twitter rows (subreddit IS NULL) still conflict.
-- Requires Postgres 15+.

drop index if exists idx_cultural_scan_unique;

alter table cultural_scan_results
  add constraint cultural_scan_results_unique_scan
  unique nulls not distinct (niche, source, subreddit, scan_date);
