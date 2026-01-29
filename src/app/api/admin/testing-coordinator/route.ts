/**
 * Testing Coordination API Endpoint
 * Provides HTTP interface for coordinating testing workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { testingCoordinator } from '@/lib/services/testing-coordination-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const scenarioId = searchParams.get('scenarioId');

  try {
    switch (action) {
      case 'scenarios':
        return NextResponse.json({
          success: true,
          data: testingCoordinator.getAllTestScenarios()
        });

      case 'scenario':
        if (!scenarioId) {
          return NextResponse.json({
            success: false,
            error: 'scenarioId parameter is required'
          }, { status: 400 });
        }
        
        const scenario = testingCoordinator.getTestScenario(scenarioId);
        if (!scenario) {
          return NextResponse.json({
            success: false,
            error: 'Scenario not found'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: scenario
        });

      case 'results':
        return NextResponse.json({
          success: true,
          data: testingCoordinator.getTestResults()
        });

      case 'report':
        return NextResponse.json({
          success: true,
          data: {
            report: testingCoordinator.generateTestReport(),
            timestamp: new Date().toISOString()
          }
        });

      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            isRunning: testingCoordinator.isTestingInProgress(),
            totalScenarios: testingCoordinator.getAllTestScenarios().length,
            completedTests: Object.keys(testingCoordinator.getTestResults()).length
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available actions: scenarios, scenario, results, report, status'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Testing Coordinator GET error:', error);
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
      case 'execute-scenario':
        if (!payload?.scenarioId) {
          return NextResponse.json({
            success: false,
            error: 'scenarioId is required in payload'
          }, { status: 400 });
        }

        const scenarioResult = await testingCoordinator.executeTestScenario(payload.scenarioId);
        return NextResponse.json({
          success: true,
          data: scenarioResult,
          message: `Test scenario ${payload.scenarioId} executed successfully`
        });

      case 'execute-all':
        const allResults = await testingCoordinator.executeAllTestScenarios();
        const totalTests = Object.keys(allResults).length;
        const passedTests = Object.values(allResults).filter(r => r.success).length;

        return NextResponse.json({
          success: true,
          data: allResults,
          message: `All test scenarios executed: ${passedTests}/${totalTests} passed`
        });

      case 'execute-daily-validation':
        const dailyResult = await testingCoordinator.executeDailyValidation();
        return NextResponse.json({
          success: true,
          data: dailyResult,
          message: 'Daily validation workflow executed successfully'
        });

      case 'reset':
        testingCoordinator.reset();
        return NextResponse.json({
          success: true,
          message: 'Testing coordinator reset successfully'
        });

      case 'quick-test':
        // Execute a quick test with core objectives
        const quickTestResult = await testingCoordinator.executeTestScenario('discovery-analysis-test');
        return NextResponse.json({
          success: true,
          data: quickTestResult,
          message: 'Quick test completed'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available actions: execute-scenario, execute-all, execute-daily-validation, reset, quick-test'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Testing Coordinator POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}