/**
 * POST /api/admin/backfill/run
 *
 * Runs one or all of the three training-data backfill steps:
 *   - followers:   copies creator_followers from scraped_videos into onboarding_profiles
 *   - performance: copies views_count from scraped_videos into prediction_runs.actual_performance
 *   - features:    computes + caches the 20 context features per prediction_run
 *
 * Body: { step: 'followers' | 'performance' | 'features' | 'all' }
 * Admin/chairman role required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-guard';
import { backfillFollowerCounts } from '@/lib/backfill/backfill-follower-counts';
import { backfillActualPerformance } from '@/lib/backfill/backfill-actual-performance';
import { backfillTrainingFeatures } from '@/lib/backfill/backfill-training-features';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Feature backfill can be long-running.

type Step = 'followers' | 'performance' | 'features' | 'all';

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const allowedRoles = ['chairman', 'admin', 'super_admin'];
  if (!auth.profile?.role || !allowedRoles.includes(auth.profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  let body: { step?: Step } = {};
  try {
    body = (await req.json()) as { step?: Step };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const step: Step = body.step ?? 'all';
  if (!['followers', 'performance', 'features', 'all'].includes(step)) {
    return NextResponse.json(
      { error: "step must be one of 'followers', 'performance', 'features', 'all'" },
      { status: 400 },
    );
  }

  const result: Record<string, unknown> = { step };

  try {
    if (step === 'followers' || step === 'all') {
      result.followers = await backfillFollowerCounts();
    }
    if (step === 'performance' || step === 'all') {
      result.performance = await backfillActualPerformance();
    }
    if (step === 'features' || step === 'all') {
      result.features = await backfillTrainingFeatures();
    }
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, partial: result }, { status: 500 });
  }
}
