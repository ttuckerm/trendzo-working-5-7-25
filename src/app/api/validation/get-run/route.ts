// FEAT-072: Get Validation Run API
// GET /api/validation/get-run?run_id=xxx

import { NextRequest, NextResponse } from 'next/server';
import { actGetRun } from '@/app/actions/validation-workflow';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const runId = searchParams.get('run_id');

    if (!runId) {
      return NextResponse.json(
        { success: false, error: 'run_id query parameter is required' },
        { status: 400 }
      );
    }

    const result = await actGetRun(runId);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get validation run' },
      { status: 500 }
    );
  }
}
