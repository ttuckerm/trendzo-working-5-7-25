/**
 * POST /api/admin/training/quality-gate
 *
 * Runs the data quality gate over prediction_runs, marking rows as
 * training_eligible = false with a disqualification reason. Chairman-only.
 * Refuses to re-run if a significant number of rows are already marked
 * ineligible, to prevent accidental compounding.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth/api-guard';
import { diagnoseDataQualityGate, runDataQualityGate } from '@/lib/training/data-quality-gate';

export const dynamic = 'force-dynamic';

const ALREADY_RUN_THRESHOLD = 10;

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Read-only: same logic as the gate, plus join/height diagnostics (no DB updates). */
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const allowedRoles = ['chairman', 'admin', 'super_admin'];
  if (!auth.profile?.role || !allowedRoles.includes(auth.profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  const db = getServiceDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const diagnosis = await diagnoseDataQualityGate();
    return NextResponse.json(diagnosis);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const allowedRoles = ['chairman', 'admin', 'super_admin'];
  if (!auth.profile?.role || !allowedRoles.includes(auth.profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  const db = getServiceDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { count, error: countErr } = await db
    .from('prediction_runs')
    .select('id', { count: 'exact', head: true })
    .eq('training_eligible', false);

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }

  if ((count ?? 0) > ALREADY_RUN_THRESHOLD) {
    return NextResponse.json(
      {
        error:
          'Quality gate has already been run. To re-run, first reset training_eligible to true on all rows.',
        alreadyIneligible: count,
      },
      { status: 400 },
    );
  }

  try {
    const report = await runDataQualityGate();
    return NextResponse.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
