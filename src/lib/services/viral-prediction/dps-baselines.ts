import { createClient } from '@supabase/supabase-js';
import { startOfISOWeek, format } from 'date-fns';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, logSupabaseRuntimeEnv } from '@/lib/env';

export async function recomputeCohortStats() {
  logSupabaseRuntimeEnv();
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const week = format(startOfISOWeek(new Date()), "yyyy'W'II");

  // Create a minimal weekly cohort table (for test/demo) and point the view to it
  const tableName = `cohort_stats_${week}`;
  const sql = `
    create table if not exists ${tableName} (
      platform text,
      follower_bucket text,
      niche text,
      median_views double precision,
      p90_views double precision,
      p95_views double precision,
      p99_views double precision
    );
    create or replace view cohort_stats_current as select * from ${tableName};
  `;
  try {
    // Requires exec_sql helper on DB; used elsewhere in repo
    await (db as any).rpc('exec_sql', { query: sql });
  } catch (e) {
    // Fallback snapshot when RPC/view not available
    try {
      await db.from(tableName as any).select('*').limit(1);
      const snap = `cohort_stats_current_snapshot`;
      await (db as any).rpc?.('exec_sql', { query: `create table if not exists ${snap} as select * from ${tableName} with no data; truncate ${snap}; insert into ${snap} select * from ${tableName};` });
    } catch {}
  }

  return { version: week, rowsWritten: 0 };
}


