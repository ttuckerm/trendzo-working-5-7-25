import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function ensureTemplateTables(): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const sql = `
  create table if not exists template_definitions (
    template_id text primary key,
    framework_id text,
    genes jsonb,
    format text,
    created_at timestamptz default now()
  );

  create table if not exists template_stats_daily (
    template_id text,
    date date,
    platform text,
    niche text,
    instances int,
    median_score numeric,
    p95_score numeric,
    success_rate numeric,
    median_views int,
    median_saves int,
    median_shares int,
    velocity numeric,
    heated_excluded int,
    safety_high int
  );
  create index if not exists idx_template_stats_daily on template_stats_daily (date, platform, niche, template_id);

  create table if not exists template_leaderboard (
    template_id text,
    window text,
    platform text,
    niche text,
    format text,
    instances int,
    success_rate numeric,
    median_score numeric,
    velocity numeric,
    avg_lift numeric,
    updated_at timestamptz
  );
  create index if not exists idx_template_leaderboard_window on template_leaderboard (window, niche, platform, format);
  create index if not exists idx_template_leaderboard_id on template_leaderboard (template_id);
  `
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}


