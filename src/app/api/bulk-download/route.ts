/**
 * Bulk TikTok Download API
 * 
 * POST /api/bulk-download - Start a new bulk download job
 * GET /api/bulk-download - List all download jobs
 * 
 * Downloads RAW videos only - NO metrics (views, likes, etc.)
 * Metrics would distort prediction testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TikTokDownloader } from '@/lib/services/tiktok-downloader';
import { analyzeVideoImmediately } from '@/lib/services/immediate-video-analyzer';
import { zScoreToDisplayDps, classifyDpsV2 } from '@/lib/training/dps-v2';
import { generateDpsInsights } from '@/lib/training/dps-insights';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

interface BulkDownloadRequest {
  urls?: string[];       // Array of TikTok URLs
  urlText?: string;      // Raw text with URLs (one per line)
  csvContent?: string;   // CSV file content
  jobName?: string;
}

/**
 * POST - Start a new bulk download job
 */
export async function POST(request: NextRequest) {
  try {
    const body: BulkDownloadRequest = await request.json();
    
    // Parse URLs from various input formats
    let urls: string[] = [];
    
    if (body.urls && body.urls.length > 0) {
      urls = body.urls.filter(url => TikTokDownloader.isValidTikTokUrl(url));
    } else if (body.urlText) {
      urls = TikTokDownloader.parseUrls(body.urlText);
    } else if (body.csvContent) {
      urls = TikTokDownloader.parseCSV(body.csvContent);
    }

    // Validate we have URLs
    if (urls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid TikTok URLs provided' },
        { status: 400 }
      );
    }

    // Deduplicate URLs
    urls = [...new Set(urls)];

    // Create the job
    const { data: job, error: jobError } = await supabase
      .from('bulk_download_jobs')
      .insert({
        job_name: body.jobName || `Download Job ${new Date().toLocaleString()}`,
        total_urls: urls.length,
        processed_count: 0,
        success_count: 0,
        failed_count: 0,
        status: 'processing',
        started_at: new Date().toISOString(),
        source: body.csvContent ? 'csv_upload' : 'manual'
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('[Bulk Download] Job creation failed:', jobError);
      return NextResponse.json(
        { success: false, error: 'Failed to create download job' },
        { status: 500 }
      );
    }

    // Create download items for each URL
    const downloadItems = urls.map(url => ({
      job_id: job.id,
      tiktok_url: url,
      video_id: TikTokDownloader.extractVideoId(url),
      status: 'pending'
    }));

    const { error: itemsError } = await supabase
      .from('bulk_download_items')
      .insert(downloadItems);

    if (itemsError) {
      console.error('[Bulk Download] Items creation failed:', itemsError);
      // Mark job as failed
      await supabase
        .from('bulk_download_jobs')
        .update({ status: 'failed', error_message: 'Failed to create download items' })
        .eq('id', job.id);
      
      return NextResponse.json(
        { success: false, error: 'Failed to create download queue' },
        { status: 500 }
      );
    }

    // Start processing in background (non-blocking)
    processDownloadJob(job.id).catch(err => {
      console.error('[Bulk Download] Background processing error:', err);
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        totalUrls: urls.length,
        status: 'processing',
        message: `Started downloading ${urls.length} videos`
      }
    });

  } catch (error: any) {
    console.error('[Bulk Download] POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - List download jobs and their status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (jobId) {
      // Get specific job with items
      const { data: job, error: jobError } = await supabase
        .from('bulk_download_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }

      // Get all items for this job
      const { data: items, error: itemsError } = await supabase
        .from('bulk_download_items')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      // Overlay canonical DPS v2 from prediction_runs when available.
      // bulk_download_items.actual_dps can go stale if the auto-labeler
      // or a manual re-label updates prediction_runs.actual_dps independently.
      const enrichedItems = items ? await Promise.all(items.map(async (item) => {
        if (!item.prediction_id) return item;
        const { data: run } = await supabase
          .from('prediction_runs')
          .select('actual_dps, actual_tier, dps_v2_breakdown, dps_v2_display_score')
          .eq('id', item.prediction_id)
          .single();
        if (run?.actual_dps != null) {
          const enriched = { ...item, actual_dps: run.actual_dps, actual_tier: run.actual_tier ?? null };
          // Generate insights from breakdown if available and not already in comparison_data
          if (run.dps_v2_breakdown && (!enriched.comparison_data?.insights)) {
            const displayScore = run.dps_v2_display_score ?? zScoreToDisplayDps(run.actual_dps);
            const tier = run.actual_tier ?? classifyDpsV2(run.actual_dps).classification;
            const insights = generateDpsInsights({
              breakdown: run.dps_v2_breakdown,
              display_score: displayScore,
              tier,
            });
            enriched.comparison_data = {
              ...(enriched.comparison_data ?? {}),
              insights,
              dps_v2_breakdown: run.dps_v2_breakdown,
            };
          }
          return enriched;
        }
        return item;
      })) : [];

      // Calculate actual progress from items (more reliable than job counters)
      const completedItems = enrichedItems.filter(i => i.status === 'completed');
      const failedItems = enrichedItems.filter(i => i.status === 'failed');
      const processedCount = completedItems.length + failedItems.length;

      return NextResponse.json({
        success: true,
        data: {
          job: {
            ...job,
            // Override with calculated values for accuracy
            processed_count: processedCount,
            success_count: completedItems.length,
            failed_count: failedItems.length
          },
          items: enrichedItems,
          progress: {
            total: job.total_urls,
            processed: processedCount,
            success: completedItems.length,
            failed: failedItems.length,
            pending: job.total_urls - processedCount,
            percentage: job.total_urls > 0 
              ? Math.round((processedCount / job.total_urls) * 100) 
              : 0
          }
        }
      });

    } else {
      // List all jobs - also recalculate progress for each
      const { data: jobs, error } = await supabase
        .from('bulk_download_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch jobs' },
          { status: 500 }
        );
      }

      // Recalculate progress for each job from items
      const jobsWithProgress = await Promise.all((jobs || []).map(async (job) => {
        const { data: items } = await supabase
          .from('bulk_download_items')
          .select('status')
          .eq('job_id', job.id);
        
        const completedCount = items?.filter(i => i.status === 'completed').length || 0;
        const failedCount = items?.filter(i => i.status === 'failed').length || 0;
        
        return {
          ...job,
          processed_count: completedCount + failedCount,
          success_count: completedCount,
          failed_count: failedCount
        };
      }));

      return NextResponse.json({
        success: true,
        data: {
          jobs: jobsWithProgress,
          total: jobsWithProgress.length
        }
      });
    }

  } catch (error: any) {
    console.error('[Bulk Download] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Background processor for download jobs
 * Downloads RAW videos only - no metrics extraction
 */
async function processDownloadJob(jobId: string) {
  console.log(`[Bulk Download] Starting job ${jobId}`);

  try {
    // Get pending items
    const { data: items, error } = await supabase
      .from('bulk_download_items')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error || !items || items.length === 0) {
      console.log('[Bulk Download] No pending items found');
      // Mark job as complete if no pending items
      await supabase
        .from('bulk_download_jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
      return;
    }

    let successCount = 0;
    let failedCount = 0;

    // Process each item
    for (const item of items) {
      console.log(`[Bulk Download] Processing ${item.tiktok_url}`);

      // Update status to downloading
      await supabase
        .from('bulk_download_items')
        .update({ status: 'downloading' })
        .eq('id', item.id);

      try {
        // Download the video (RAW - no metrics)
        const result = await TikTokDownloader.downloadVideo(item.tiktok_url);

        if (result.success) {
          // Update with success - ONLY file info, NO metrics
          await supabase
            .from('bulk_download_items')
            .update({
              status: 'completed',
              local_path: result.localPath,
              file_size_bytes: result.fileSizeBytes,
              duration_seconds: result.durationSeconds,
              downloaded_at: new Date().toISOString()
              // NO: author_username, views, likes, comments, shares
              // Those would contaminate prediction testing
            })
            .eq('id', item.id);

          // =====================================================
          // IMMEDIATE FFmpeg ANALYSIS on downloaded file
          // =====================================================
          if (item.video_id) {
            try {
              console.log(`[Bulk Download] Running FFmpeg for ${item.video_id}...`);
              const ffmpegResult = await analyzeVideoImmediately(
                item.tiktok_url, 
                item.video_id, 
                '' // No transcript available
              );
              if (ffmpegResult.success) {
                console.log(`[Bulk Download] ✅ FFmpeg ${item.video_id}: ${ffmpegResult.analysis?.height}p`);
              } else {
                console.warn(`[Bulk Download] ⚠️ FFmpeg ${item.video_id}: ${ffmpegResult.error}`);
              }
            } catch (ffmpegError: any) {
              console.warn(`[Bulk Download] FFmpeg error ${item.video_id}: ${ffmpegError.message}`);
              // Continue - FFmpeg failure shouldn't stop download job
            }
          }

          successCount++;
          console.log(`[Bulk Download] ✓ Downloaded ${item.video_id} (${successCount}/${items.length})`);

        } else {
          // Update with failure
          await supabase
            .from('bulk_download_items')
            .update({
              status: 'failed',
              error_message: result.error,
              retry_count: (item.retry_count || 0) + 1
            })
            .eq('id', item.id);

          failedCount++;
          console.log(`[Bulk Download] ✗ Failed ${item.video_id}: ${result.error}`);
        }

        // Update job progress counters directly after each item
        await supabase
          .from('bulk_download_jobs')
          .update({
            processed_count: successCount + failedCount,
            success_count: successCount,
            failed_count: failedCount
          })
          .eq('id', jobId);

        // Small delay between downloads to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (downloadError: any) {
        await supabase
          .from('bulk_download_items')
          .update({
            status: 'failed',
            error_message: downloadError.message,
            retry_count: (item.retry_count || 0) + 1
          })
          .eq('id', item.id);

        failedCount++;
        
        // Update job counters
        await supabase
          .from('bulk_download_jobs')
          .update({
            processed_count: successCount + failedCount,
            success_count: successCount,
            failed_count: failedCount
          })
          .eq('id', jobId);
      }
    }

    // Mark job as complete with final counts
    await supabase
      .from('bulk_download_jobs')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_count: successCount + failedCount,
        success_count: successCount,
        failed_count: failedCount
      })
      .eq('id', jobId);

    console.log(`[Bulk Download] Job ${jobId} completed: ${successCount} success, ${failedCount} failed`);

  } catch (error: any) {
    console.error(`[Bulk Download] Job ${jobId} failed:`, error);
    
    await supabase
      .from('bulk_download_jobs')
      .update({ 
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}
