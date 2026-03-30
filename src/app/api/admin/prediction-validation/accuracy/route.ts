import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily';
    const engine = searchParams.get('engine') || 'all';

    let query = supabaseClient
      .from('accuracy_metrics')
      .select('*')
      .eq('time_period', period)
      .order('start_date', { ascending: false })
      .limit(30);

    if (engine !== 'all') {
      query = query.eq('engine_name', engine);
    }

    const { data: metrics, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch accuracy metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      metrics: metrics || []
    });

  } catch (error) {
    console.error('Prediction validation accuracy API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}