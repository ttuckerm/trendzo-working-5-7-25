// FEAT-071: Creator Workflow - Get Available Goals
// GET /api/creator-workflow/goals

import { NextResponse } from 'next/server';
import { GOALS } from '@/types/creator-workflow';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      goals: GOALS
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch goals'
      },
      { status: 500 }
    );
  }
}
