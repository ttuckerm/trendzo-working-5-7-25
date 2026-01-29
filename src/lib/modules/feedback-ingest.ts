/**
 * FeedbackIngest - Real-World Metrics Collector
 * 
 * Polls external analytics API for performance metrics on processed videos.
 * Updates database with ground-truth numbers for downstream components.
 * 
 * Performance target: Pull 500 video metrics in < 60s
 * Scheduling: Every 15 minutes via cron
 */

import { createClient } from '@supabase/supabase-js';
// Using native fetch and date-fns for dependencies that are already available
// import got from 'got'; // Commented out - using fetch instead
// import pMap from 'p-map'; // Commented out - using Promise.allSettled instead
import dayjs from 'dayjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const metricsApiBase = process.env.METRICS_API_BASE || 'https://metrics.myproxy.com';
const supabase = createClient(supabaseUrl, supabaseKey);

// Types
interface VideoMetrics {
  views_1h: number;
  likes_1h: number;
  shares_1h: number;
  views_24h: number;
  likes_24h: number;
  shares_24h: number;
  views_72h: number;
  likes_72h: number;
  shares_72h: number;
}

interface VideoPrediction {
  video_id: string;
  created_at: string;
  last_metrics_pull_at: string | null;
  status: string;
}

interface MetricsApiResponse extends VideoMetrics {
  video_id?: string;
}

/**
 * Fetch metrics for a single video with retry logic
 */
async function fetchVideoMetrics(videoId: string, retries = 3): Promise<VideoMetrics | null> {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${metricsApiBase}/metrics/${videoId}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000), // 10s timeout
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrendzoFeedbackIngest/1.0'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Video ${videoId} not found (404) - marking as deleted`);
          
          // Mark video as deleted in video_predictions
          await supabase
            .from('video_predictions')
            .update({ status: 'deleted' })
            .eq('video_id', videoId);
          
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as MetricsApiResponse;
      
      // Validate response structure
      const requiredFields = [
        'views_1h', 'likes_1h', 'shares_1h',
        'views_24h', 'likes_24h', 'shares_24h', 
        'views_72h', 'likes_72h', 'shares_72h'
      ];

      for (const field of requiredFields) {
        if (typeof data[field as keyof MetricsApiResponse] !== 'number') {
          throw new Error(`Invalid response: missing or invalid field ${field}`);
        }
      }

      return {
        views_1h: data.views_1h,
        likes_1h: data.likes_1h,
        shares_1h: data.shares_1h,
        views_24h: data.views_24h,
        likes_24h: data.likes_24h,
        shares_24h: data.shares_24h,
        views_72h: data.views_72h,
        likes_72h: data.likes_72h,
        shares_72h: data.shares_72h
      };

    } catch (error: any) {
      // Retry on network errors
      if (attempt < retries) {
        const backoffMs = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Attempt ${attempt} failed for video ${videoId}, retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
        continue;
      }

      // Final attempt failed
      console.error(`Failed to fetch metrics for video ${videoId} after ${retries} attempts:`, error.message);
      return null;
    }
  }

  return null;
}

/**
 * Process a single video prediction record
 */
async function processVideoPrediction(prediction: VideoPrediction): Promise<void> {
  const { video_id } = prediction;
  
  try {
    // Fetch metrics from external API
    const metrics = await fetchVideoMetrics(video_id);
    
    if (!metrics) {
      // Either 404 (already handled) or network failure
      return;
    }

    // Upsert into video_metrics table
    const { error: upsertError } = await supabase
      .from('video_metrics')
      .upsert({
        video_id,
        ...metrics,
        pulled_at: new Date().toISOString()
      }, {
        onConflict: 'video_id'
      });

    if (upsertError) {
      console.error(`Failed to upsert metrics for video ${video_id}:`, upsertError);
      return;
    }

    // Update last_metrics_pull_at in video_predictions
    const { error: updateError } = await supabase
      .from('video_predictions')
      .update({ last_metrics_pull_at: new Date().toISOString() })
      .eq('video_id', video_id);

    if (updateError) {
      console.error(`Failed to update last_metrics_pull_at for video ${video_id}:`, updateError);
      return;
    }

    console.log(`✅ Successfully updated metrics for video ${video_id}`);

  } catch (error) {
    console.error(`Error processing video ${video_id}:`, error);
  }
}

/**
 * Main FeedbackIngest function
 */
export async function ingestMetrics(): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Starting FeedbackIngest metrics collection...');

    // Fetch videos that need metrics updates
    const cutoffTime = dayjs().subtract(72, 'hours').toISOString();
    const staleTime = dayjs().subtract(1, 'hour').toISOString();

    const { data: predictions, error } = await supabase
      .from('video_predictions')
      .select('video_id, created_at, last_metrics_pull_at, status')
      .gte('created_at', cutoffTime)
      .neq('status', 'deleted')
      .or(`last_metrics_pull_at.is.null,last_metrics_pull_at.lt.${staleTime}`);

    if (error) {
      throw new Error(`Failed to fetch video predictions: ${error.message}`);
    }

    if (!predictions || predictions.length === 0) {
      console.log('📊 No videos need metrics updates');
      return;
    }

    console.log(`📋 Found ${predictions.length} videos needing metrics updates`);

    // Process videos in parallel batches of 10 (simulating pMap concurrency)
    const batchSize = 10;
    for (let i = 0; i < predictions.length; i += batchSize) {
      const batch = predictions.slice(i, i + batchSize);
      const batchPromises = batch.map(prediction => 
        processVideoPrediction(prediction as VideoPrediction).catch(error => {
          console.error(`Error processing video ${prediction.video_id}:`, error);
          return null; // Continue with other videos
        })
      );
      
      await Promise.allSettled(batchPromises);
    }

    // Emit event for downstream systems
    try {
      await supabase.functions.invoke('metrics_ingested', {
        body: {
          videos_processed: predictions.length,
          timestamp: new Date().toISOString()
        }
      });
      console.log('📡 Emitted metrics_ingested event');
    } catch (eventError) {
      console.warn('Failed to emit metrics_ingested event:', eventError);
      // Don't fail the whole process for event emission
    }

    const duration = Date.now() - startTime;
    console.log(`✅ FeedbackIngest completed in ${duration}ms`);
    console.log(`📊 Performance: ${predictions.length} videos in ${duration}ms (${(predictions.length / (duration / 1000)).toFixed(1)} videos/sec)`);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ FeedbackIngest failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Health check function for monitoring
 */
export async function getFeedbackIngestStatus(): Promise<{
  status: string;
  last_run?: string;
  videos_processed?: number;
  next_run?: string;
}> {
  try {
    // Check recent metrics pulls
    const { data: recentMetrics, error } = await supabase
      .from('video_metrics')
      .select('pulled_at, video_id')
      .order('pulled_at', { ascending: false })
      .limit(10);

    if (error) {
      return { status: 'error' };
    }

    const mostRecent = recentMetrics?.[0];
    
    return {
      status: 'operational',
      last_run: mostRecent?.pulled_at || 'Never',
      videos_processed: recentMetrics?.length || 0,
      next_run: dayjs().add(15, 'minutes').toISOString() // Every 15 minutes
    };
  } catch (error) {
    return { status: 'error' };
  }
}