// FEAT-071: Creator Workflow - Get Available Goals
// GET /api/creator-workflow/goals

import { NextResponse } from 'next/server';
import { GOALS } from '@/types/creator-workflow';

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

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
