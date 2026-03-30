import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Fetch template status summary
    const { data: templates, error } = await supabaseClient
      .from('template_status_summary')
      .select('*')
      .order('status');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch template statuses' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      templates: templates || []
    });

  } catch (error) {
    console.error('Mission Control templates API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}