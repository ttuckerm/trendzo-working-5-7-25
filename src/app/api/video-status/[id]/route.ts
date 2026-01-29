/**
 * GET /api/video-status/[id]
 * Check the status of a video generation job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
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
    });

  } catch (error: any) {
    console.error('Error fetching video status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
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




