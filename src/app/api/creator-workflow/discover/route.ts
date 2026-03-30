// FEAT-071: Creator Workflow - Discover Viral Videos
// POST /api/creator-workflow/discover

import { NextRequest, NextResponse } from 'next/server';
import { actDiscoverViralVideos } from '@/app/actions/creator-workflow';
import type { GoalId } from '@/types/creator-workflow';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workflowId, goalId, niche = 'general', limit = 10 } = body;

    if (!workflowId || !goalId) {
      return NextResponse.json(
        { success: false, error: 'workflowId and goalId are required' },
        { status: 400 }
      );
    }

    const result = await actDiscoverViralVideos(
      workflowId,
      goalId as GoalId,
      niche,
      limit
    );

    if (!result.success) {
      return NextResponse.json(result, { status: result.cached ? 200 : 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to discover viral videos'
      },
      { status: 500 }
    );
  }
}
