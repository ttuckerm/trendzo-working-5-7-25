import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/admin/template-generator/templates
 * 
 * Returns all generated templates from the template_library table.
 */
export async function GET(request: NextRequest) {
  try {
    const { data: templates, error } = await supabase
      .from('template_library')
      .select('*')
      .order('success_rate', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch templates from database',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
      count: templates?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('API: Error in templates endpoint:', errorMessage);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 });
  }
}