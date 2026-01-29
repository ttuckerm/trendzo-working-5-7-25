// FEAT-072: Lock Predictions API
// POST /api/validation/lock-predictions

import { NextRequest, NextResponse } from 'next/server';
import { actLockPredictions } from '@/app/actions/validation-workflow';
import type { LockPredictionsRequest } from '@/types/validation-workflow';

export async function POST(req: NextRequest) {
  try {
    const body: LockPredictionsRequest = await req.json();

    if (!body.run_id || !body.video_ids || !Array.isArray(body.video_ids)) {
      return NextResponse.json(
        { success: false, error: 'run_id and video_ids array are required' },
        { status: 400 }
      );
    }

    const result = await actLockPredictions(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to lock predictions' },
      { status: 500 }
    );
  }
}
