import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { TemporalConsistencyMonitor } from '@/lib/services/temporal-consistency-monitor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const monitor = new TemporalConsistencyMonitor(supabase);

/**
 * GET /api/kai/drift
 * Get latest drift metrics for all components
 *
 * Query params:
 * - alertLevel: Filter by alert level (green, yellow, red)
 * - componentId: Filter by specific component
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const alertLevel = searchParams.get('alertLevel');
    const componentId = searchParams.get('componentId');

    let query = supabase
      .from('kai_drift_metrics')
      .select('*')
      .order('analyzed_at', { ascending: false })
      .limit(100);

    if (alertLevel) {
      query = query.eq('alert_level', alertLevel);
    }

    if (componentId) {
      query = query.eq('component_id', componentId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get components with active alerts
    const { data: alertsData } = await supabase
      .rpc('get_components_with_alerts');

    return NextResponse.json({
      success: true,
      metrics: data,
      alerts: alertsData || [],
      count: data.length
    });

  } catch (error: any) {
    console.error('Error fetching drift metrics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kai/drift/analyze
 * Trigger drift analysis for specified components
 *
 * Body:
 * {
 *   componentIds?: string[] // If not provided, analyzes all components
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { componentIds } = body;

    // If no component IDs provided, get all registered components
    if (!componentIds || componentIds.length === 0) {
      // Get all unique component IDs from kai_learning_loop
      const { data, error } = await supabase
        .from('kai_learning_loop')
        .select('component_id')
        .order('component_id');

      if (error) throw error;

      componentIds = [...new Set(data.map((row: any) => row.component_id))];
    }

    console.log('[Drift Analysis] Starting analysis for', componentIds.length, 'components');

    // Run drift analysis
    await monitor.runFullDriftAnalysis(componentIds);

    // Get latest results
    const latestMetrics = await monitor.getLatestDriftMetrics();

    // Count alerts
    const alertCounts = {
      green: latestMetrics.filter(m => m.alertLevel === 'green').length,
      yellow: latestMetrics.filter(m => m.alertLevel === 'yellow').length,
      red: latestMetrics.filter(m => m.alertLevel === 'red').length
    };

    return NextResponse.json({
      success: true,
      message: `Analyzed ${componentIds.length} components`,
      metrics: latestMetrics,
      alertCounts,
      componentsAnalyzed: componentIds.length
    });

  } catch (error: any) {
    console.error('Error running drift analysis:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
