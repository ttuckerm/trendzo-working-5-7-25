import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/admin/template-generator/runs
 * 
 * Returns generation run history from the template_generation_runs table.
 */
export async function GET(request: NextRequest) {
  try {
    const { data: runs, error } = await supabase
      .from('template_generation_runs')
      .select('*')
      .order('run_timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching template generation runs:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch generation runs from database',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      runs: runs || [],
      count: runs?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('API: Error in runs endpoint:', errorMessage);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 });
  }
}