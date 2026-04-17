/**
 * POST /api/admin/training/retrain/promote
 * Body: { experimentName: string, variant: string }
 *
 * Manually promote a single S6 variant. Updates status to 'promoted' and marks
 * sibling variants in the same experiment as 'rejected' so only one winner
 * exists per experiment. Chairman / admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth/api-guard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const allowed = ['chairman', 'admin', 'super_admin'];
  if (!auth.profile?.role || !allowed.includes(auth.profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    experimentName?: string;
    variant?: string;
  };
  if (!body.experimentName || !body.variant) {
    return NextResponse.json({ error: 'experimentName and variant required' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const db = createClient(url, key, { auth: { persistSession: false } });

  const now = new Date().toISOString();
  const promotedBy = auth.profile.id ?? null;

  const { error: e1 } = await db
    .from('s6_training_experiments')
    .update({ status: 'rejected' })
    .eq('experiment_name', body.experimentName)
    .eq('status', 'pending-approval');
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const { error: e2 } = await db
    .from('s6_training_experiments')
    .update({ status: 'promoted', promoted_at: now, promoted_by: promotedBy })
    .eq('experiment_name', body.experimentName)
    .eq('variant', body.variant);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  return NextResponse.json({ ok: true, experimentName: body.experimentName, variant: body.variant });
}
