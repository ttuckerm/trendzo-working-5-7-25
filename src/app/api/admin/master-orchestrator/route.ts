/**
 * Master Agent Orchestrator API Endpoint
 * Provides HTTP interface for coordinating all viral prediction subagents
 */

import { NextRequest, NextResponse } from 'next/server';
import { masterOrchestrator, getDailyWorkflowRecommendation, createTestWorkflow } from '@/lib/services/master-agent-orchestrator';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: masterOrchestrator.getWorkflowStatus()
        });

      case 'health':
        return NextResponse.json({
          success: true,
          data: masterOrchestrator.getSystemHealth()
        });

      case 'daily-workflow':
        return NextResponse.json({
          success: true,
          data: {
            recommendedObjectives: getDailyWorkflowRecommendation(),
            totalObjectives: 15,
            estimatedDuration: '45-60 minutes'
          }
        });

      case 'test-workflow':
        return NextResponse.json({
          success: true,
          data: createTestWorkflow()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available actions: status, health, daily-workflow, test-workflow'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Master Orchestrator GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      case 'execute-complete-workflow':
        const completeResult = await masterOrchestrator.executeCompleteWorkflow();
        return NextResponse.json({
          success: true,
          data: completeResult,
          message: 'Complete workflow executed successfully'
        });

      case 'execute-specific-objectives':
        if (!payload?.objectiveIds || !Array.isArray(payload.objectiveIds)) {
          return NextResponse.json({
            success: false,
            error: 'objectiveIds array is required in payload'
          }, { status: 400 });
        }
        
        const specificResult = await masterOrchestrator.executeSpecificObjectives(payload.objectiveIds);
        return NextResponse.json({
          success: true,
          data: specificResult,
          message: `Executed ${payload.objectiveIds.length} objectives`
        });

      case 'execute-objective':
        if (!payload?.objectiveId) {
          return NextResponse.json({
            success: false,
            error: 'objectiveId is required in payload'
          }, { status: 400 });
        }

        const objectiveResult = await masterOrchestrator.executeObjective(payload.objectiveId);
        return NextResponse.json({
          success: true,
          data: objectiveResult,
          message: `Objective ${payload.objectiveId} executed successfully`
        });

      case 'execute-daily-workflow':
        const dailyObjectives = getDailyWorkflowRecommendation();
        const dailyResult = await masterOrchestrator.executeSpecificObjectives(dailyObjectives);
        return NextResponse.json({
          success: true,
          data: dailyResult,
          message: 'Daily workflow executed successfully'
        });

      case 'reset':
        masterOrchestrator.reset();
        return NextResponse.json({
          success: true,
          message: 'Master Orchestrator reset successfully'
        });

      case 'test-coordination':
        // Test the coordination system with a minimal workflow
        const testResult = await masterOrchestrator.executeSpecificObjectives([
          'content-discovery',
          'dna-analysis',
          'viral-prediction'
        ]);
        return NextResponse.json({
          success: true,
          data: testResult,
          message: 'Coordination test completed'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available actions: execute-complete-workflow, execute-specific-objectives, execute-objective, execute-daily-workflow, reset, test-coordination'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Master Orchestrator POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}