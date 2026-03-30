// FEAT-072: Build Cohort API
// POST /api/validation/build-cohort

import { NextRequest, NextResponse } from 'next/server';
import { actBuildCohort } from '@/app/actions/validation-workflow';
import type { BuildCohortRequest } from '@/types/validation-workflow';

export async function POST(req: NextRequest) {
  try {
    const body: BuildCohortRequest = await req.json();

    if (!body.run_id) {
      return NextResponse.json(
        { success: false, error: 'run_id is required' },
        { status: 400 }
      );
    }

    const result = await actBuildCohort(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to build cohort' },
      { status: 500 }
    );
  }
}
