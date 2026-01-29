// FEAT-071: Creator Workflow - Viral Prediction
// POST /api/creator-workflow/predict

import { NextRequest, NextResponse } from 'next/server';
import { actPredictViral } from '@/app/actions/creator-workflow';
import type { GoalId, NineFields } from '@/types/creator-workflow';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workflowId, script, goalId, niche = 'general' } = body;

    if (!workflowId || !script || !goalId) {
      return NextResponse.json(
        { success: false, error: 'workflowId, script, and goalId are required' },
        { status: 400 }
      );
    }

    const result = await actPredictViral(
      workflowId,
      script as NineFields,
      goalId as GoalId,
      niche
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate prediction'
      },
      { status: 500 }
    );
  }
}
