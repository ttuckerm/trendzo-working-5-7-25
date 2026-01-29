import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Fetch recent pipeline flows
    const { data: flows, error } = await supabaseClient
      .from('pipeline_flows')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pipeline flows' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flows: flows || []
    });

  } catch (error) {
    console.error('Mission Control pipeline API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new pipeline flow entry
export async function POST(request: Request) {
  try {
    const flowData = await request.json();

    const { data, error } = await supabaseClient
      .from('pipeline_flows')
      .insert({
        flow_id: flowData.flow_id || crypto.randomUUID(),
        source_module: flowData.source_module,
        target_module: flowData.target_module,
        data_type: flowData.data_type,
        records_processed: flowData.records_processed || 0,
        processing_time_ms: flowData.processing_time_ms || 0,
        status: flowData.status || 'processing'
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create pipeline flow' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flow: data?.[0] || null
    });

  } catch (error) {
    console.error('Mission Control pipeline creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}