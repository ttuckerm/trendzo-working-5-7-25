/**
 * Unified Testing Framework API Endpoint
 * 
 * Provides API access to the comprehensive testing system for validating
 * 90%+ viral prediction accuracy across all system components.
 */

import { NextRequest, NextResponse } from 'next/server'
import UnifiedTestingFramework from '@/lib/services/unifiedTestingFramework'

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json()
    
    const testingFramework = UnifiedTestingFramework.getInstance()
    
    switch (action) {
      case 'run_validation':
        console.log('🧪 Starting full system validation...')
        const validationResult = await testingFramework.runFullSystemValidation()
        
        return NextResponse.json({
          success: true,
          data: validationResult,
          message: `System validation complete. Overall accuracy: ${(validationResult.overall_accuracy * 100).toFixed(2)}%`
        })

      case 'get_test_results':
        const testResults = await testingFramework.getTestResults()
        
        return NextResponse.json({
          success: true,
          data: testResults,
          message: `Retrieved ${testResults.length} test results`
        })

      case 'get_accuracy_report':
        const accuracyReport = await testingFramework.getAccuracyReport()
        
        return NextResponse.json({
          success: true,
          data: accuracyReport,
          message: `Accuracy report generated. Overall accuracy: ${(accuracyReport.overall_accuracy * 100).toFixed(2)}%`
        })

      case 'get_validation_history':
        const validationHistory = await testingFramework.getValidationHistory()
        
        return NextResponse.json({
          success: true,
          data: validationHistory,
          message: `Retrieved ${validationHistory.length} validation records`
        })

      case 'get_framework_status':
        const frameworkStatus = testingFramework.getFrameworkStatus()
        
        return NextResponse.json({
          success: true,
          data: frameworkStatus,
          message: 'Framework status retrieved'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available_actions: [
            'run_validation',
            'get_test_results', 
            'get_accuracy_report',
            'get_validation_history',
            'get_framework_status'
          ]
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Unified Testing Framework API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Testing framework operation failed',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const testingFramework = UnifiedTestingFramework.getInstance()
    const frameworkStatus = testingFramework.getFrameworkStatus()
    
    return NextResponse.json({
      success: true,
      data: frameworkStatus,
      message: 'Unified Testing Framework status'
    })

  } catch (error) {
    console.error('Testing framework status error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get framework status',
      details: error.message
    }, { status: 500 })
  }
}