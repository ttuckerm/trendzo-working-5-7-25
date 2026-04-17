/**
 * POST /api/admin/holdout/designate
 *
 * One-time-only endpoint that designates the 200-video stratified holdout set.
 * Chairman-only. Refuses if any row has is_holdout = true already.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth/api-guard';
import { designateHoldout } from '@/lib/training/designate-holdout';

export const dynamic = 'force-dynamic';

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
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
    .eq('is_holdout', true);

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Holdout already designated. This operation is one-time only.' },
      { status: 400 },
    );
  }

  try {
    const report = await designateHoldout();
    return NextResponse.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
