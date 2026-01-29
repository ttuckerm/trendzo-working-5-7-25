// FEAT-071: Creator Workflow - AI Content Suggestions
// POST /api/creator-workflow/suggest

import { NextRequest, NextResponse } from 'next/server';
import { actSuggestContent } from '@/app/actions/creator-workflow';
import type { GoalId } from '@/types/creator-workflow';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workflowId, goalId, viralExamples, userNiche = 'general' } = body;

    if (!workflowId || !goalId || !viralExamples) {
      return NextResponse.json(
        { success: false, error: 'workflowId, goalId, and viralExamples are required' },
        { status: 400 }
      );
    }

    const result = await actSuggestContent(
      workflowId,
      goalId as GoalId,
      viralExamples,
      userNiche
    );

    if (!result.success) {
      return NextResponse.json(result, { status: result.partial ? 206 : 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate suggestions'
      },
      { status: 500 }
    );
  }
}
