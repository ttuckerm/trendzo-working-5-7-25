/**
 * GET /api/admin/crons/status
 *
 * Returns the full cron registry with enabled flags and last-run timestamps.
 * Last-run times come from integration_job_runs (keyed by jobRunKey).
 *
 * Admin/chairman role required.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth/api-guard';
import { getCronRegistry } from '@/lib/cron/scheduler';

export const dynamic = 'force-dynamic';

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const allowedRoles = ['chairman', 'admin', 'super_admin'];
  if (!auth.profile?.role || !allowedRoles.includes(auth.profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  const registry = getCronRegistry();

  // Pull all last-run rows once so we can match by jobRunKey client-side.
  const lastRunByKey = new Map<string, string>();
  const db = getServiceDb();
  if (db) {
    try {
      const { data } = await db
        .from('integration_job_runs')
        .select('job, last_run');
      for (const r of (data || []) as Array<{ job: string; last_run: string }>) {
        lastRunByKey.set(r.job, r.last_run);
      }
    } catch {
      // Table may not exist in a fresh env — fall back to null lastRun.
    }
  }

  const jobs = registry.map((j) => ({
    name: j.name,
    schedule: j.schedule,
    enabled: j.enabled,
    description: j.description,
    lastRun: j.jobRunKey ? lastRunByKey.get(j.jobRunKey) ?? null : null,
  }));

  const enabledCount = jobs.filter((j) => j.enabled).length;

  return NextResponse.json({
    total: jobs.length,
    enabled: enabledCount,
    disabled: jobs.length - enabledCount,
    jobs,
  });
}
