/**
 * POST /api/admin/training/retrain
 *
 * Runs the S6 retrain pipeline: 5 XGBoost variants with Optuna tuning,
 * evaluated against the locked holdout. All variants land in
 * training_experiments as v15/pending-approval (no auto-promotion).
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-guard';
import { runS6Retrain } from '@/lib/training/run-s6-retrain';

export const dynamic = 'force-dynamic';
export const maxDuration = 800;

export async function POST() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const allowed = ['chairman', 'admin', 'super_admin'];
  if (!auth.profile?.role || !allowed.includes(auth.profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  try {
    const result = await runS6Retrain();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
