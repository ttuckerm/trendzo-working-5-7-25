/**
 * POST /api/admin/training/scraped-quality-gate
 *
 * Runs the scraped_videos data quality gate, marking rows as
 * training_eligible = false with a disqualification reason. Chairman/admin only.
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-guard';
import { runScrapedVideoQualityGate } from '@/lib/training/scraped-video-quality-gate';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['chairman', 'admin', 'super_admin'];

export async function POST() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  if (!auth.profile?.role || !ALLOWED_ROLES.includes(auth.profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  try {
    const report = await runScrapedVideoQualityGate();
    return NextResponse.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
