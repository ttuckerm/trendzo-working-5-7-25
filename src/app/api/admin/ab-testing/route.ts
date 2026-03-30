/**
 * A/B Testing Data Storage and Analytics API
 * 
 * Comprehensive A/B testing framework API for viral content optimization,
 * statistical analysis, and performance tracking.
 */

import { NextRequest, NextResponse } from 'next/server'
import ABTestingSystem from '@/lib/services/abTestingSystem'

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json()
    
    const abTestingSystem = ABTestingSystem.getInstance()
    
    switch (action) {
      case 'create_test':
        console.log(`🧪 Creating A/B test: ${params.test_name}`)
        const newTest = await abTestingSystem.createABTest({
          test_name: params.test_name,
          test_type: params.test_type,
          hypothesis: params.hypothesis,
          control_content: params.control_content,
          variant_configurations: params.variant_configurations || [],
          test_configuration: params.test_configuration || {},
          created_by: params.created_by || 'system'
        })
        
        return NextResponse.json({
          success: true,
          data: newTest,
          message: `A/B test created: ${newTest.test_name} with ${newTest.test_variants.length} variants`
        })

      case 'start_test':
        console.log(`🚀 Starting A/B test: ${params.test_id}`)
        const startResult = await abTestingSystem.startTest(params.test_id)
        
        return NextResponse.json({
          success: true,
          data: startResult,
          message: `A/B test started successfully. Target participants: ${startResult.test.test_configuration.sample_size_target}`
        })

      case 'update_test_data':
        console.log(`📊 Updating test data for: ${params.test_id}`)
        await abTestingSystem.updateTestData(
          params.test_id,
          params.variant_id,
          params.performance_data
        )
        
        return NextResponse.json({
          success: true,
          data: { updated: true },
          message: 'Test data updated successfully'
        })

      case 'analyze_results':
        console.log(`📈 Analyzing results for test: ${params.test_id}`)
        const analysisResults = await abTestingSystem.analyzeTestResults(params.test_id)
        
        return NextResponse.json({
          success: true,
          data: analysisResults,
          message: `Analysis complete. Winner: ${analysisResults.winner_variant}, Confidence: ${(analysisResults.confidence_level_achieved * 100).toFixed(1)}%`
        })

      case 'get_analytics':
        console.log(`📊 Getting analytics for test: ${params.test_id}`)
        const analytics = await abTestingSystem.getTestAnalytics(params.test_id)
        
        return NextResponse.json({
          success: true,
          data: analytics,
          message: 'Test analytics generated successfully'
        })

      case 'get_test':
        const test = await abTestingSystem.getTest(params.test_id)
        
        if (!test) {
          return NextResponse.json({
            success: false,
            error: 'Test not found'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          data: test,
          message: 'Test retrieved successfully'
        })

      case 'get_all_tests':
        const allTests = await abTestingSystem.getAllTests()
        
        return NextResponse.json({
          success: true,
          data: allTests,
          message: `Retrieved ${allTests.length} tests`
        })

      case 'get_test_results':
        const testResults = await abTestingSystem.getTestResults(params.test_id)
        
        if (!testResults) {
          return NextResponse.json({
            success: false,
            error: 'Test results not found or test not completed'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          data: testResults,
          message: 'Test results retrieved successfully'
        })

      case 'pause_test':
        console.log(`⏸️  Pausing test: ${params.test_id}`)
        await abTestingSystem.pauseTest(params.test_id)
        
        return NextResponse.json({
          success: true,
          data: { paused: true },
          message: 'Test paused successfully'
        })

      case 'resume_test':
        console.log(`▶️  Resuming test: ${params.test_id}`)
        await abTestingSystem.resumeTest(params.test_id)
        
        return NextResponse.json({
          success: true,
          data: { resumed: true },
          message: 'Test resumed successfully'
        })

      case 'cancel_test':
        console.log(`❌ Cancelling test: ${params.test_id}`)
        await abTestingSystem.cancelTest(params.test_id)
        
        return NextResponse.json({
          success: true,
          data: { cancelled: true },
          message: 'Test cancelled successfully'
        })

      case 'get_system_status':
        const systemStatus = abTestingSystem.getSystemStatus()
        
        return NextResponse.json({
          success: true,
          data: systemStatus,
          message: 'A/B testing system status'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available_actions: [
            'create_test',
            'start_test',
            'update_test_data',
            'analyze_results',
            'get_analytics',
            'get_test',
            'get_all_tests',
            'get_test_results',
            'pause_test',
            'resume_test',
            'cancel_test',
            'get_system_status'
          ]
        }, { status: 400 })
    }

  } catch (error) {
    console.error('A/B Testing System API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'A/B testing operation failed',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const testId = searchParams.get('test_id')
    const action = searchParams.get('action') || 'status'
    
    const abTestingSystem = ABTestingSystem.getInstance()
    
    switch (action) {
      case 'status':
        const systemStatus = abTestingSystem.getSystemStatus()
        const allTests = await abTestingSystem.getAllTests()
        
        const testsSummary = allTests.map(test => ({
          test_id: test.test_id,
          test_name: test.test_name,
          test_type: test.test_type,
          test_status: test.test_status,
          variants_count: test.test_variants.length,
          participants: test.test_metrics.total_participants,
          created_at: test.created_at,
          winner_variant: test.test_results?.winner_variant
        }))
        
        return NextResponse.json({
          success: true,
          data: {
            system_status: systemStatus,
            tests_summary: testsSummary
          },
          message: 'A/B testing system overview'
        })

      case 'test':
        if (!testId) {
          return NextResponse.json({
            success: false,
            error: 'test_id parameter required'
          }, { status: 400 })
        }
        
        const test = await abTestingSystem.getTest(testId)
        
        if (!test) {
          return NextResponse.json({
            success: false,
            error: 'Test not found'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          data: test,
          message: 'Test retrieved successfully'
        })

      case 'results':
        if (!testId) {
          return NextResponse.json({
            success: false,
            error: 'test_id parameter required'
          }, { status: 400 })
        }
        
        const testResults = await abTestingSystem.getTestResults(testId)
        
        if (!testResults) {
          return NextResponse.json({
            success: false,
            error: 'Test results not found'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          data: testResults,
          message: 'Test results retrieved successfully'
        })

      case 'analytics':
        if (!testId) {
          return NextResponse.json({
            success: false,
            error: 'test_id parameter required'
          }, { status: 400 })
        }
        
        const analytics = await abTestingSystem.getTestAnalytics(testId)
        
        return NextResponse.json({
          success: true,
          data: analytics,
          message: 'Test analytics retrieved successfully'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available_actions: ['status', 'test', 'results', 'analytics']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('A/B Testing System GET error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get A/B testing data',
      details: error.message
    }, { status: 500 })
  }
}