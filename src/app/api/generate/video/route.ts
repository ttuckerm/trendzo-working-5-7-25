import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { klingService } from '@/lib/services/kling-service';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface VideoGenerationRequest {
  script: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  length: 15 | 30 | 60;
  niche: string;
  predictedDps?: number;
}

/**
 * POST /api/generate/video
 * Start async video generation job
 */
export async function POST(req: NextRequest) {
  try {
    const body: VideoGenerationRequest = await req.json();
    const { script, platform, length, niche, predictedDps } = body;

    // Validate input
    if (!script || !platform || !length || !niche) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if Kling API is configured (uses Access Key + Secret Key)
    const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
    const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;
    if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Kling API not configured',
        fallback: true,
        message: 'Video generation requires Kling API credentials. Your script has been generated successfully - you can film it yourself or use external AI video tools like Runway, Sora, or Kling directly!',
        scriptPreserved: true,
      }, { status: 503 });
    }

    // Generate unique job ID
    const jobId = uuidv4();

    // Create job record in database
    const { data: job, error: insertError } = await supabase
      .from('video_generation_jobs')
      .insert({
        job_id: jobId,
        status: 'pending',
        script_text: script,
        platform,
        length,
        niche,
        predicted_dps: predictedDps,
        metadata: {
          created_by: 'bloomberg_terminal',
          user_agent: req.headers.get('user-agent'),
        },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Start async video generation (don't await - let it run in background)
    processVideoGeneration(jobId, script, platform, length, niche).catch((error) => {
      console.error(`Background video generation failed for job ${jobId}:`, error);
    });

    return NextResponse.json({
      success: true,
      jobId,
      estimatedTimeSeconds: 120, // Kling typically takes 2-3 minutes
      message: 'Video generation started. Use jobId to poll for status.',
    });

  } catch (error: any) {
    console.error('Error starting video generation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate/video?jobId=xxx
 * Poll for video generation status
 */
export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Missing jobId parameter' },
        { status: 400 }
      );
    }

    // Fetch job from database
    const { data: job, error } = await supabase
      .from('video_generation_jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Calculate progress percentage
    const progress = calculateProgress(job.status, job.created_at, job.completed_at);

    return NextResponse.json({
      success: true,
      job: {
        jobId: job.job_id,
        status: job.status,
        progress,
        videoUrl: job.video_url,
        thumbnailUrl: job.thumbnail_url,
        duration: job.duration_seconds,
        error: job.error_message,
        createdAt: job.created_at,
        completedAt: job.completed_at,
        metadata: {
          platform: job.platform,
          length: job.length,
          niche: job.niche,
          predictedDps: job.predicted_dps,
        },
      },
    });

  } catch (error: any) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Background async function to process video generation
 */
async function processVideoGeneration(
  jobId: string,
  script: string,
  platform: 'tiktok' | 'instagram' | 'youtube',
  length: 15 | 30 | 60,
  niche: string
) {
  try {
    // Update status to submitted
    await supabase
      .from('video_generation_jobs')
      .update({
        status: 'submitted',
        started_at: new Date().toISOString(),
      })
      .eq('job_id', jobId);

    // Call Kling API
    const result = await klingService.generateVideoFromScript(script, {
      platform,
      length,
      niche,
      onProgress: async (status, progress) => {
        console.log(`Job ${jobId}: ${status} (${progress}%)`);

        // Update database with progress
        await supabase
          .from('video_generation_jobs')
          .update({
            status: status === 'succeed' ? 'completed' : 'processing',
            metadata: {
              progress,
              last_status: status,
            },
          })
          .eq('job_id', jobId);
      },
    });

    // Update job with completed video
    await supabase
      .from('video_generation_jobs')
      .update({
        status: 'completed',
        kling_task_id: result.taskId,
        video_url: result.videoUrl,
        duration_seconds: result.duration,
        completed_at: new Date().toISOString(),
      })
      .eq('job_id', jobId);

    console.log(`Job ${jobId} completed successfully`);

  } catch (error: any) {
    console.error(`Job ${jobId} failed:`, error);

    // Update job with error
    await supabase
      .from('video_generation_jobs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq('job_id', jobId);
  }
}

/**
 * Calculate progress percentage based on status and timing
 */
function calculateProgress(
  status: string,
  createdAt: string,
  completedAt: string | null
): number {
  if (status === 'completed') return 100;
  if (status === 'failed' || status === 'cancelled') return 0;

  const statusProgress: Record<string, number> = {
    pending: 10,
    submitted: 25,
    processing: 60,
  };

  const baseProgress = statusProgress[status] || 0;

  // Add time-based progress estimate (2 minutes expected)
  if (status === 'processing') {
    const elapsed = Date.now() - new Date(createdAt).getTime();
    const expectedDuration = 120000; // 2 minutes
    const timeProgress = Math.min((elapsed / expectedDuration) * 40, 35); // Max 35% from time
    return Math.min(baseProgress + timeProgress, 95); // Cap at 95% until truly complete
  }

  return baseProgress;
}
