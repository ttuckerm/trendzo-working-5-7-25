/**
 * POST /api/admin/training/export-data
 *
 * Exports training_eligible scraped_videos rows (training + holdout) to CSV
 * for the Python XGBoost trainer: engagement/metadata from scraped_videos,
 * plus a LEFT JOIN of training_features content columns on video_id.
 * Chairman/admin only. Read-only on scraped_videos and training_features.
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-guard';
import { exportScrapedTrainingData } from '@/lib/training/export-scraped-training-data';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['chairman', 'admin', 'super_admin'];

export async function POST() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  if (!auth.profile?.role || !ALLOWED_ROLES.includes(auth.profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
  }

  try {
    const result = await exportScrapedTrainingData();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
