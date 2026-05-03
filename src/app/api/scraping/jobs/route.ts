import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * GET /api/scraping/jobs
 * List all scraping jobs
 */
export async function GET(req: NextRequest) {
  try {
    const { data: jobs, error } = await supabase
      .from('scraping_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      jobs: jobs || [],
    });

  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
