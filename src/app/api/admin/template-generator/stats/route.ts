import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/admin/template-generator/stats
 * 
 * Returns aggregated statistics for the TemplateGenerator dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    // Get template statistics
    const { data: templateStats, error: templateError } = await supabase
      .from('template_library')
      .select('success_rate, cluster_size');

    if (templateError) {
      console.error('Error fetching template stats:', templateError);
    }

    // Get total videos processed (sum of all cluster sizes)
    const totalVideos = templateStats?.reduce((sum, template) => sum + (template.cluster_size || 0), 0) || 0;
    
    // Calculate average success rate
    const avgSuccessRate = templateStats?.length > 0 
      ? templateStats.reduce((sum, template) => sum + (template.success_rate || 0), 0) / templateStats.length
      : 0;

    // Get last run timestamp
    const { data: lastRun, error: runError } = await supabase
      .from('template_generation_runs')
      .select('run_timestamp')
      .order('run_timestamp', { ascending: false })
      .limit(1)
      .single();

    if (runError && runError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching last run:', runError);
    }

    const stats = {
      totalTemplates: templateStats?.length || 0,
      totalVideos,
      avgSuccessRate,
      lastRun: lastRun?.run_timestamp || null
    };

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('API: Error in stats endpoint:', errorMessage);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: errorMessage,
      stats: {
        totalTemplates: 0,
        totalVideos: 0,
        avgSuccessRate: 0,
        lastRun: null
      }
    }, { status: 500 });
  }
}