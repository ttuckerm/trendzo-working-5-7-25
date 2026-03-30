import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

// Module restart functionality
export async function POST(request: NextRequest) {
  try {
    const { module_name } = await request.json();

    if (!module_name) {
      return NextResponse.json(
        { success: false, error: 'Module name is required' },
        { status: 400 }
      );
    }

    // Simulate module restart process
    // In production, this would trigger actual module restart logic
    
    // Update module status to indicate restart
    const { data, error } = await supabaseClient
      .from('module_status')
      .update({
        status: 'running',
        error_count: 0,
        last_success: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('module_name', module_name)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to restart module' },
        { status: 500 }
      );
    }

    // Log the restart action
    await supabaseClient
      .from('pipeline_flows')
      .insert({
        flow_id: crypto.randomUUID(),
        source_module: 'MissionControl',
        target_module: module_name,
        data_type: 'restart_command',
        records_processed: 1,
        processing_time_ms: 500,
        status: 'completed'
      });

    return NextResponse.json({
      success: true,
      message: `Module ${module_name} restart initiated`,
      module: data?.[0] || null
    });

  } catch (error) {
    console.error('Mission Control restart error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}