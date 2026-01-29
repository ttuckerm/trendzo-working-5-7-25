import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Fetch module health dashboard view
    const { data: modules, error } = await supabaseClient
      .from('module_health_dashboard')
      .select('*')
      .order('module_name');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch module statuses' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      modules: modules || []
    });

  } catch (error) {
    console.error('Mission Control modules API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update module status
export async function PATCH(request: NextRequest) {
  try {
    const { module_name, status, performance_metrics } = await request.json();

    if (!module_name) {
      return NextResponse.json(
        { success: false, error: 'Module name is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (performance_metrics) updateData.performance_metrics = performance_metrics;

    const { data, error } = await supabaseClient
      .from('module_status')
      .update(updateData)
      .eq('module_name', module_name)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update module status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      module: data?.[0] || null
    });

  } catch (error) {
    console.error('Mission Control module update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}