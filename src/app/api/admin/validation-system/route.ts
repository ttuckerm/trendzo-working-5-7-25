/**
 * Validation System with Real Accuracy Tracking API
 * 
 * Comprehensive validation framework API for tracking real-world prediction accuracy,
 * validating system performance, and providing continuous learning feedback.
 */

import { NextRequest, NextResponse } from 'next/server'
import ValidationSystem from '@/lib/services/validationSystem'

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json()
    
    const validationSystem = ValidationSystem.getInstance()
    
    switch (action) {
      case 'register_prediction':
        console.log(`📝 Registering prediction for validation: ${params.prediction_id}`)
        const registeredRecord = await validationSystem.registerPrediction({
          prediction_id: params.prediction_id,
          video_id: params.video_id,
          script_text: params.script_text,
          platform: params.platform,
          niche: params.niche,
          predicted_metrics: params.predicted_metrics,
          prediction_confidence: params.prediction_confidence
        })
        
        return NextResponse.json({
          success: true,
          data: registeredRecord,
          message: `Prediction registered for validation: ${registeredRecord.validation_id}`
        })

      case 'validate_prediction':
        console.log(`🔍 Validating prediction: ${params.validation_id}`)
        const validatedRecord = await validationSystem.validatePrediction(
          params.validation_id,
          params.actual_metrics
        )
        
        return NextResponse.json({
          success: true,
          data: validatedRecord,
          message: `Prediction validated. Accuracy: ${(validatedRecord.accuracy_score * 100).toFixed(2)}%`
        })

      case 'batch_validate':
        console.log(`🔍 Batch validating ${params.validation_data?.length} predictions`)
        const batchResults = await validationSystem.batchValidate(params.validation_data || [])
        
        return NextResponse.json({
          success: true,
          data: batchResults,
          message: `Batch validation complete: ${batchResults.length} predictions validated`
        })

      case 'generate_report':
        console.log(`📊 Generating validation report for period: ${params.report_period}`)
        const validationReport = await validationSystem.generateValidationReport(
          params.report_period || '30_days'
        )
        
        return NextResponse.json({
          success: true,
          data: validationReport,
          message: `Validation report generated. Overall accuracy: ${(validationReport.overall_accuracy * 100).toFixed(2)}%`
        })

      case 'get_real_time_accuracy':
        const realTimeAccuracy = await validationSystem.getRealTimeAccuracy()
        
        return NextResponse.json({
          success: true,
          data: realTimeAccuracy,
          message: `Real-time accuracy: ${(realTimeAccuracy.current_accuracy * 100).toFixed(2)}%`
        })

      case 'get_validation_record':
        const validationRecord = await validationSystem.getValidationRecord(params.validation_id)
        
        if (!validationRecord) {
          return NextResponse.json({
            success: false,
            error: 'Validation record not found'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          data: validationRecord,
          message: 'Validation record retrieved'
        })

      case 'get_all_validations':
        const allValidations = await validationSystem.getAllValidationRecords()
        
        return NextResponse.json({
          success: true,
          data: allValidations,
          message: `Retrieved ${allValidations.length} validation records`
        })

      case 'get_validation_report':
        const report = await validationSystem.getValidationReport(params.report_id)
        
        if (!report) {
          return NextResponse.json({
            success: false,
            error: 'Validation report not found'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          data: report,
          message: 'Validation report retrieved'
        })

      case 'get_active_alerts':
        const activeAlerts = await validationSystem.getActiveAlerts()
        
        return NextResponse.json({
          success: true,
          data: activeAlerts,
          message: `${activeAlerts.length} active alerts found`
        })

      case 'get_system_status':
        const systemStatus = validationSystem.getSystemStatus()
        
        return NextResponse.json({
          success: true,
          data: systemStatus,
          message: 'Validation system status'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available_actions: [
            'register_prediction',
            'validate_prediction',
            'batch_validate',
            'generate_report',
            'get_real_time_accuracy',
            'get_validation_record',
            'get_all_validations',
            'get_validation_report',
            'get_active_alerts',
            'get_system_status'
          ]
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Validation System API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Validation system operation failed',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'status'
    const validationId = searchParams.get('validation_id')
    const reportId = searchParams.get('report_id')
    
    const validationSystem = ValidationSystem.getInstance()
    
    switch (action) {
      case 'status':
        const systemStatus = validationSystem.getSystemStatus()
        const realTimeAccuracy = await validationSystem.getRealTimeAccuracy()
        const activeAlerts = await validationSystem.getActiveAlerts()
        
        return NextResponse.json({
          success: true,
          data: {
            system_status: systemStatus,
            real_time_accuracy: realTimeAccuracy,
            active_alerts: activeAlerts.length,
            alert_summary: activeAlerts.reduce((summary, alert) => {
              summary[alert.severity] = (summary[alert.severity] || 0) + 1
              return summary
            }, {} as Record<string, number>)
          },
          message: 'Validation system overview'
        })

      case 'validation':
        if (!validationId) {
          return NextResponse.json({
            success: false,
            error: 'validation_id parameter required'
          }, { status: 400 })
        }
        
        const validationRecord = await validationSystem.getValidationRecord(validationId)
        
        if (!validationRecord) {
          return NextResponse.json({
            success: false,
            error: 'Validation record not found'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          data: validationRecord,
          message: 'Validation record retrieved'
        })

      case 'report':
        if (!reportId) {
          return NextResponse.json({
            success: false,
            error: 'report_id parameter required'
          }, { status: 400 })
        }
        
        const report = await validationSystem.getValidationReport(reportId)
        
        if (!report) {
          return NextResponse.json({
            success: false,
            error: 'Validation report not found'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          data: report,
          message: 'Validation report retrieved'
        })

      case 'real_time_accuracy':
        const realTimeData = await validationSystem.getRealTimeAccuracy()
        
        return NextResponse.json({
          success: true,
          data: realTimeData,
          message: 'Real-time accuracy data retrieved'
        })

      case 'alerts':
        const alerts = await validationSystem.getActiveAlerts()
        
        return NextResponse.json({
          success: true,
          data: alerts,
          message: `${alerts.length} active alerts retrieved`
        })

      case 'all_validations':
        const allValidations = await validationSystem.getAllValidationRecords()
        
        // Return summary for performance
        const validationsSummary = allValidations.map(validation => ({
          validation_id: validation.validation_id,
          prediction_id: validation.prediction_id,
          video_id: validation.video_id,
          platform: validation.platform,
          niche: validation.niche,
          accuracy_score: validation.accuracy_score,
          prediction_confidence: validation.prediction_confidence,
          validation_status: validation.validation_status,
          validation_timestamp: validation.validation_timestamp,
          time_to_validation: validation.time_to_validation
        }))
        
        return NextResponse.json({
          success: true,
          data: validationsSummary,
          message: `${validationsSummary.length} validation records retrieved`
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available_actions: ['status', 'validation', 'report', 'real_time_accuracy', 'alerts', 'all_validations']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Validation System GET error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get validation system data',
      details: error.message
    }, { status: 500 })
  }
}