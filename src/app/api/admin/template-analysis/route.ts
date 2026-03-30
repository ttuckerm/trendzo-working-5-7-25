/**
 * Template Analysis and Optimization Backend API
 * 
 * Provides comprehensive template analysis, optimization, and performance tracking
 * capabilities integrated with Script Intelligence and viral prediction systems.
 */

import { NextRequest, NextResponse } from 'next/server'
import TemplateAnalysisBackend from '@/lib/services/templateAnalysisBackend'

export async function POST(req: NextRequest) {
  try {
    const { action, ...params } = await req.json()
    
    const templateBackend = TemplateAnalysisBackend.getInstance()
    
    switch (action) {
      case 'analyze_template':
        console.log(`🔬 Analyzing template: ${params.template_id}`)
        const analysisResult = await templateBackend.analyzeTemplate({
          template_id: params.template_id,
          analysis_type: params.analysis_type || 'full',
          include_ai_analysis: params.include_ai_analysis ?? true,
          analysis_depth: params.analysis_depth || 'comprehensive',
          comparison_templates: params.comparison_templates,
          context: params.context
        })
        
        return NextResponse.json({
          success: true,
          data: analysisResult,
          message: `Template analysis complete. Quality score: ${(analysisResult.quality_score * 100).toFixed(1)}%`
        })

      case 'optimize_template':
        console.log(`⚡ Optimizing template: ${params.template_id}`)
        const optimizationResult = await templateBackend.optimizeTemplate(
          params.template_id,
          params.optimization_goals
        )
        
        return NextResponse.json({
          success: true,
          data: optimizationResult,
          message: `Template optimization complete. Estimated improvement: +${(optimizationResult.performance_improvement * 100).toFixed(1)}%`
        })

      case 'get_analytics':
        console.log(`📊 Getting analytics for template: ${params.template_id}`)
        const analyticsResult = await templateBackend.getTemplateAnalytics(
          params.template_id,
          params.timeframe
        )
        
        return NextResponse.json({
          success: true,
          data: analyticsResult,
          message: 'Template analytics generated'
        })

      case 'batch_analyze':
        console.log(`🔬 Batch analyzing ${params.template_ids?.length} templates`)
        const batchResults = await templateBackend.batchAnalyzeTemplates(params.template_ids || [])
        
        return NextResponse.json({
          success: true,
          data: Object.fromEntries(batchResults),
          message: `Batch analysis complete. ${batchResults.size} templates analyzed`
        })

      case 'create_template':
        console.log('➕ Creating new template')
        const newTemplate = await templateBackend.createTemplate(params.template_data)
        
        return NextResponse.json({
          success: true,
          data: newTemplate,
          message: `Template created: ${newTemplate.template_name}`
        })

      case 'get_template':
        const template = await templateBackend.getTemplate(params.template_id)
        
        if (!template) {
          return NextResponse.json({
            success: false,
            error: 'Template not found'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          data: template,
          message: 'Template retrieved'
        })

      case 'get_all_templates':
        const allTemplates = await templateBackend.getAllTemplates()
        
        return NextResponse.json({
          success: true,
          data: allTemplates,
          message: `Retrieved ${allTemplates.length} templates`
        })

      case 'delete_template':
        const deleted = await templateBackend.deleteTemplate(params.template_id)
        
        if (!deleted) {
          return NextResponse.json({
            success: false,
            error: 'Template not found or could not be deleted'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          data: { deleted: true },
          message: 'Template deleted successfully'
        })

      case 'get_system_status':
        const systemStatus = templateBackend.getSystemStatus()
        
        return NextResponse.json({
          success: true,
          data: systemStatus,
          message: 'Template analysis system status'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available_actions: [
            'analyze_template',
            'optimize_template',
            'get_analytics',
            'batch_analyze',
            'create_template',
            'get_template',
            'get_all_templates',
            'delete_template',
            'get_system_status'
          ]
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Template Analysis Backend API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Template analysis operation failed',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const templateId = searchParams.get('template_id')
    
    const templateBackend = TemplateAnalysisBackend.getInstance()
    
    if (templateId) {
      // Get specific template
      const template = await templateBackend.getTemplate(templateId)
      
      if (!template) {
        return NextResponse.json({
          success: false,
          error: 'Template not found'
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        data: template,
        message: 'Template retrieved'
      })
    } else {
      // Get system status and all templates summary
      const systemStatus = templateBackend.getSystemStatus()
      const allTemplates = await templateBackend.getAllTemplates()
      
      const templatesSummary = allTemplates.map(template => ({
        template_id: template.template_id,
        template_name: template.template_name,
        template_type: template.template_type,
        viral_potential_score: template.metadata.viral_potential_score,
        success_rate: template.metadata.success_rate,
        usage_count: template.metadata.usage_count,
        last_updated: template.updated_at
      }))
      
      return NextResponse.json({
        success: true,
        data: {
          system_status: systemStatus,
          templates_summary: templatesSummary
        },
        message: 'Template analysis backend overview'
      })
    }

  } catch (error) {
    console.error('Template Analysis Backend GET error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get template data',
      details: error.message
    }, { status: 500 })
  }
}