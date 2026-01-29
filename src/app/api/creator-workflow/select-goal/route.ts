// FEAT-071: Creator Workflow - Select Goal
// POST /api/creator-workflow/select-goal

import { NextRequest, NextResponse } from 'next/server';
import { actSelectGoal } from '@/app/actions/creator-workflow';
import type { GoalId } from '@/types/creator-workflow';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { goalId } = body;

    if (!goalId) {
      return NextResponse.json(
        { success: false, error: 'goalId is required' },
        { status: 400 }
      );
    }

    const result = await actSelectGoal(goalId as GoalId);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to select goal'
      },
      { status: 500 }
    );
  }
}
