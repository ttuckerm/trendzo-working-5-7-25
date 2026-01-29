// FEAT-072: Create Validation Run API
// POST /api/validation/create-run

import { NextRequest, NextResponse } from 'next/server';
import { actCreateValidationRun } from '@/app/actions/validation-workflow';
import type { CreateRunRequest } from '@/types/validation-workflow';

export async function POST(req: NextRequest) {
  try {
    const body: CreateRunRequest = await req.json();

    if (!body.name || !body.niche || !body.success_metric) {
      return NextResponse.json(
        { success: false, error: 'name, niche, and success_metric are required' },
        { status: 400 }
      );
    }

    const result = await actCreateValidationRun(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create validation run' },
      { status: 500 }
    );
  }
}
