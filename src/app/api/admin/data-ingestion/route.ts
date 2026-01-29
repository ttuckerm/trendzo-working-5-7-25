/**
 * Data Ingestion API Endpoints
 * 
 * Admin endpoints for managing data ingestion jobs and monitoring pipeline status
 */

import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { DataIngestionPipeline } from '@/lib/services/data-ingestion-pipeline'

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()

    switch (action) {
      case 'start_job':
        return await handleStartJob(params)
      
      case 'cancel_job':
        return await handleCancelJob(params)
      
      case 'schedule_regular':
        return await handleScheduleRegular(params)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Data ingestion API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    const jobId = searchParams.get('jobId')

    switch (endpoint) {
      case 'job_status':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID required' },
            { status: 400 }
          )
        }
        return await handleGetJobStatus(jobId)
      
      case 'active_jobs':
        return await handleGetActiveJobs()
      
      case 'metrics':
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        return await handleGetMetrics(startDate, endDate)
      
      default:
        return NextResponse.json(
          { error: 'Invalid endpoint' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Get data ingestion info error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleStartJob(params: any) {
  const { type, source, parameters } = params

  if (!type || !source) {
    return NextResponse.json(
      { error: 'Type and source are required' },
      { status: 400 }
    )
  }

  console.log(`🚀 Starting ${type} ingestion job for ${source}`)

  const job = await DataIngestionPipeline.startIngestionJob(type, source, parameters || {})

  return NextResponse.json({
    success: true,
    job: {
      id: job.id,
      type: job.type,
      source: job.source,
      status: job.status,
      parameters: job.parameters,
      progress: job.progress,
      startedAt: job.startedAt
    }
  })
}

async function handleCancelJob(params: any) {
  const { jobId } = params

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    )
  }

  const cancelled = DataIngestionPipeline.cancelJob(jobId)

  if (!cancelled) {
    return NextResponse.json(
      { error: 'Job not found or cannot be cancelled' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `Job ${jobId} cancelled successfully`
  })
}

async function handleScheduleRegular(params: any) {
  const {
    trendingFrequency = 6,
    hashtagRefreshFrequency = 12,
    popularHashtags = ['viral', 'trending', 'fyp', 'foryou', 'business', 'tips'],
    maxDailyVideos = 200
  } = params

  DataIngestionPipeline.scheduleRegularIngestion({
    trendingFrequency,
    hashtagRefreshFrequency,
    popularHashtags,
    maxDailyVideos
  })

  return NextResponse.json({
    success: true,
    message: 'Regular ingestion jobs scheduled',
    config: {
      trendingFrequency,
      hashtagRefreshFrequency,
      popularHashtags,
      maxDailyVideos
    }
  })
}

async function handleGetJobStatus(jobId: string) {
  const job = DataIngestionPipeline.getJobStatus(jobId)

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    job: {
      id: job.id,
      type: job.type,
      source: job.source,
      status: job.status,
      parameters: job.parameters,
      progress: job.progress,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
      results: job.results
    }
  })
}

async function handleGetActiveJobs() {
  const jobs = DataIngestionPipeline.getActiveJobs()

  return NextResponse.json({
    success: true,
    jobs: jobs.map(job => ({
      id: job.id,
      type: job.type,
      source: job.source,
      status: job.status,
      progress: job.progress,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
      results: job.results
    })),
    total: jobs.length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length
  })
}

async function handleGetMetrics(startDate: string | null, endDate: string | null) {
  const timeRange = startDate && endDate ? { startDate, endDate } : undefined
  const metrics = await DataIngestionPipeline.getIngestionMetrics(timeRange)

  return NextResponse.json({
    success: true,
    metrics: {
      totalVideosProcessed: metrics.totalVideosProcessed,
      averageProcessingTime: Math.round(metrics.averageProcessingTime / 1000), // Convert to seconds
      successRate: Math.round(metrics.successRate * 100) / 100,
      errorRate: Math.round(metrics.errorRate * 100) / 100,
      duplicateRate: Math.round(metrics.duplicateRate * 100) / 100,
      dataQualityScore: Math.round(metrics.dataQualityScore * 100) / 100
    },
    timeRange: timeRange || 'all_time'
  })
}