/**
 * Batch Processing API for TikTok Data Ingestion
 * Handles large-scale video processing for algorithm training
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApifyTikTokIntegration } from '@/lib/services/viral-prediction/apify-integration';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}
const supabase = new Proxy({}, { get(_t, p){ return (getDb() as any)[p as any] } }) as any;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'start_daily_ingestion':
        return await startDailyIngestion(data);
      
      case 'process_trending_content':
        return await processTrendingContent(data);
      
      case 'batch_analyze_urls':
        return await batchAnalyzeUrls(data);
      
      case 'get_job_status':
        return await getJobStatus(data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Batch processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Batch processing failed',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');
    const status = searchParams.get('status');

    if (jobId) {
      return await getJobStatus({ job_id: jobId });
    }

    if (status) {
      return await getJobsByStatus(status);
    }

    // Get recent batch jobs
    return await getRecentJobs();

  } catch (error) {
    console.error('❌ Batch processing GET error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get batch processing data',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      },
      { status: 500 }
    );
  }
}

async function startDailyIngestion(data: any) {
  try {
    const { target_count = 1000, niches = ['all'] } = data;
    
    console.log(`🚀 Starting daily ingestion for ${target_count} videos across niches: ${niches.join(', ')}`);

    // Create a batch job record
    const jobId = `daily_${Date.now()}`;
    const estimatedCompletion = new Date(Date.now() + (target_count * 5000)); // ~5 seconds per video

    await supabase.from('tiktok_data_jobs').insert({
      job_id: jobId,
      status: 'pending',
      source: 'apify',
      videos_requested: target_count,
      job_data: {
        niches,
        job_type: 'daily_ingestion',
        started_by: 'batch_api'
      },
      started_at: new Date().toISOString()
    });

    // Start processing in background
    processInBackground(jobId, target_count, niches);

    return NextResponse.json({
      success: true,
      data: {
        job_id: jobId,
        status: 'pending',
        videos_requested: target_count,
        estimated_completion: estimatedCompletion.toISOString(),
        tracking_url: `/api/viral-prediction/batch-process?job_id=${jobId}`
      }
    });

  } catch (error) {
    console.error('❌ Failed to start daily ingestion:', error);
    return NextResponse.json({ error: 'Failed to start daily ingestion' }, { status: 500 });
  }
}

async function processTrendingContent(data: any) {
  try {
    const { niche, count = 100 } = data;
    
    console.log(`📈 Processing trending content for ${niche} (${count} videos)`);

    const jobId = `trending_${niche}_${Date.now()}`;

    await supabase.from('tiktok_data_jobs').insert({
      job_id: jobId,
      status: 'pending',
      source: 'apify',
      videos_requested: count,
      job_data: {
        niche,
        job_type: 'trending_content',
        started_by: 'batch_api'
      },
      started_at: new Date().toISOString()
    });

    // Start processing trending content
    processTrendingInBackground(jobId, niche, count);

    return NextResponse.json({
      success: true,
      data: {
        job_id: jobId,
        status: 'pending',
        niche,
        videos_requested: count,
        tracking_url: `/api/viral-prediction/batch-process?job_id=${jobId}`
      }
    });

  } catch (error) {
    console.error('❌ Failed to process trending content:', error);
    return NextResponse.json({ error: 'Failed to process trending content' }, { status: 500 });
  }
}

async function batchAnalyzeUrls(data: any) {
  try {
    const { urls = [] } = data;
    
    if (!urls.length) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 });
    }

    console.log(`🔍 Batch analyzing ${urls.length} URLs`);

    const jobId = `batch_urls_${Date.now()}`;

    await supabase.from('tiktok_data_jobs').insert({
      job_id: jobId,
      status: 'pending',
      source: 'manual',
      videos_requested: urls.length,
      job_data: {
        urls,
        job_type: 'url_batch',
        started_by: 'batch_api'
      },
      started_at: new Date().toISOString()
    });

    // Start batch URL processing
    processBatchUrlsInBackground(jobId, urls);

    return NextResponse.json({
      success: true,
      data: {
        job_id: jobId,
        status: 'pending',
        videos_requested: urls.length,
        tracking_url: `/api/viral-prediction/batch-process?job_id=${jobId}`
      }
    });

  } catch (error) {
    console.error('❌ Failed to batch analyze URLs:', error);
    return NextResponse.json({ error: 'Failed to batch analyze URLs' }, { status: 500 });
  }
}

async function getJobStatus(data: any) {
  try {
    const { job_id } = data;

    const { data: job, error } = await supabase
      .from('tiktok_data_jobs')
      .select('*')
      .eq('job_id', job_id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Calculate progress
    const progress = job.videos_requested > 0 
      ? (job.videos_processed / job.videos_requested) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        job_id: job.job_id,
        status: job.status,
        progress: Math.round(progress),
        videos_requested: job.videos_requested,
        videos_processed: job.videos_processed,
        videos_failed: job.videos_failed,
        started_at: job.started_at,
        completed_at: job.completed_at,
        error_message: job.error_message,
        job_data: job.job_data
      }
    });

  } catch (error) {
    console.error('❌ Failed to get job status:', error);
    return NextResponse.json({ error: 'Failed to get job status' }, { status: 500 });
  }
}

async function getJobsByStatus(status: string) {
  try {
    const { data: jobs } = await supabase
      .from('tiktok_data_jobs')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: jobs || []
    });

  } catch (error) {
    console.error('❌ Failed to get jobs by status:', error);
    return NextResponse.json({ error: 'Failed to get jobs' }, { status: 500 });
  }
}

async function getRecentJobs() {
  try {
    const { data: jobs } = await supabase
      .from('tiktok_data_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: jobs || []
    });

  } catch (error) {
    console.error('❌ Failed to get recent jobs:', error);
    return NextResponse.json({ error: 'Failed to get recent jobs' }, { status: 500 });
  }
}

// Background processing functions

async function processInBackground(jobId: string, targetCount: number, niches: string[]) {
  try {
    console.log(`🔄 Starting background processing for job ${jobId}`);

    // Update job status to processing
    await supabase.from('tiktok_data_jobs').update({
      status: 'processing'
    }).eq('job_id', jobId);

    const apifyIntegration = new ApifyTikTokIntegration();
    let totalProcessed = 0;
    let totalFailed = 0;

    // Process each niche
    for (const niche of niches) {
      if (niche === 'all') {
        // Get trending content across all niches
        const videosPerNiche = Math.floor(targetCount / 10); // Distribute across 10 popular niches
        const popularNiches = ['fitness', 'food', 'business', 'beauty', 'tech', 'education', 'entertainment', 'lifestyle', 'fashion', 'travel'];
        
        for (const specificNiche of popularNiches) {
          try {
            const nicheData = await apifyIntegration.scrapeTrendingContent(specificNiche, videosPerNiche);
            const processedIds = await apifyIntegration.processAndStoreBatch(nicheData);
            
            totalProcessed += processedIds.length;
            totalFailed += nicheData.length - processedIds.length;

            // Update progress
            await updateJobProgress(jobId, totalProcessed, totalFailed);

            if (totalProcessed >= targetCount) break;
          } catch (error) {
            console.error(`Error processing niche ${specificNiche}:`, error);
            totalFailed += videosPerNiche;
          }
        }
      } else {
        // Process specific niche
        try {
          const nicheData = await apifyIntegration.scrapeTrendingContent(niche, targetCount);
          const processedIds = await apifyIntegration.processAndStoreBatch(nicheData);
          
          totalProcessed += processedIds.length;
          totalFailed += nicheData.length - processedIds.length;
        } catch (error) {
          console.error(`Error processing niche ${niche}:`, error);
          totalFailed += targetCount;
        }
      }
    }

    // Update ingestion metrics
    await apifyIntegration.updateIngestionMetrics(totalProcessed + totalFailed, totalProcessed);

    // Mark job as completed
    await supabase.from('tiktok_data_jobs').update({
      status: 'completed',
      videos_processed: totalProcessed,
      videos_failed: totalFailed,
      completed_at: new Date().toISOString()
    }).eq('job_id', jobId);

    console.log(`✅ Completed job ${jobId}: ${totalProcessed} processed, ${totalFailed} failed`);

  } catch (error) {
    console.error(`❌ Background processing failed for job ${jobId}:`, error);
    
    await supabase.from('tiktok_data_jobs').update({
      status: 'failed',
      error_message: error.message,
      completed_at: new Date().toISOString()
    }).eq('job_id', jobId);
  }
}

async function processTrendingInBackground(jobId: string, niche: string, count: number) {
  try {
    await supabase.from('tiktok_data_jobs').update({
      status: 'processing'
    }).eq('job_id', jobId);

    const apifyIntegration = new ApifyTikTokIntegration();
    const trendingData = await apifyIntegration.scrapeTrendingContent(niche, count);
    const processedIds = await apifyIntegration.processAndStoreBatch(trendingData);

    const failed = trendingData.length - processedIds.length;

    await supabase.from('tiktok_data_jobs').update({
      status: 'completed',
      videos_processed: processedIds.length,
      videos_failed: failed,
      completed_at: new Date().toISOString()
    }).eq('job_id', jobId);

    console.log(`✅ Trending content job ${jobId} completed: ${processedIds.length} processed`);

  } catch (error) {
    console.error(`❌ Trending processing failed for job ${jobId}:`, error);
    
    await supabase.from('tiktok_data_jobs').update({
      status: 'failed',
      error_message: error.message,
      completed_at: new Date().toISOString()
    }).eq('job_id', jobId);
  }
}

async function processBatchUrlsInBackground(jobId: string, urls: string[]) {
  try {
    await supabase.from('tiktok_data_jobs').update({
      status: 'processing'
    }).eq('job_id', jobId);

    const apifyIntegration = new ApifyTikTokIntegration();
    const batchData = await apifyIntegration.scrapeTikTokBatch(urls);
    const processedIds = await apifyIntegration.processAndStoreBatch(batchData);

    const failed = urls.length - processedIds.length;

    await supabase.from('tiktok_data_jobs').update({
      status: 'completed',
      videos_processed: processedIds.length,
      videos_failed: failed,
      completed_at: new Date().toISOString()
    }).eq('job_id', jobId);

    console.log(`✅ Batch URL job ${jobId} completed: ${processedIds.length} processed`);

  } catch (error) {
    console.error(`❌ Batch URL processing failed for job ${jobId}:`, error);
    
    await supabase.from('tiktok_data_jobs').update({
      status: 'failed',
      error_message: error.message,
      completed_at: new Date().toISOString()
    }).eq('job_id', jobId);
  }
}

async function updateJobProgress(jobId: string, processed: number, failed: number) {
  try {
    await supabase.from('tiktok_data_jobs').update({
      videos_processed: processed,
      videos_failed: failed
    }).eq('job_id', jobId);
  } catch (error) {
    console.error('Failed to update job progress:', error);
  }
}