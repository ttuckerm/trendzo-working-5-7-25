// FEAT-072: Validate Accuracy API
// POST /api/validation/validate-accuracy

import { NextRequest, NextResponse } from 'next/server';
import { actValidateAccuracy } from '@/app/actions/validation-workflow';
import type { ValidateAccuracyRequest } from '@/types/validation-workflow';

export async function POST(req: NextRequest) {
  try {
    const body: ValidateAccuracyRequest = await req.json();

    if (!body.run_id || !body.test_video_ids || !Array.isArray(body.test_video_ids)) {
      return NextResponse.json(
        { success: false, error: 'run_id and test_video_ids array are required' },
        { status: 400 }
      );
    }

    const result = await actValidateAccuracy(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to validate accuracy' },
      { status: 500 }
    );
  }
}
