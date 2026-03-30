// FEAT-072: Get Previous Validation Runs API
// GET /api/validation/get-previous-runs?limit=10

import { NextRequest, NextResponse } from 'next/server';
import { actGetPreviousRuns } from '@/app/actions/validation-workflow';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await actGetPreviousRuns(limit);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get previous runs' },
      { status: 500 }
    );
  }
}
