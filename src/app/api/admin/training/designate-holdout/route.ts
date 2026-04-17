/**
 * POST /api/admin/training/designate-holdout
 *
 * One-time: locks a 200-video stratified holdout from scraped_videos where
 * training_eligible = true. Chairman/admin only. Refuses to re-run.
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-guard';
import { designateScrapedHoldout } from '@/lib/training/designate-scraped-holdout';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['chairman', 'admin', 'super_admin'];

export async function POST() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  if (!auth.profile?.role || !ALLOWED_ROLES.includes(auth.profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  try {
    const report = await designateScrapedHoldout({ force: true });
    return NextResponse.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = /already designated|Only \d+ eligible/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
