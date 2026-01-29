/**
 * Algorithm IQ - Insights Endpoint
 * GET /api/algorithm-iq/insights
 * 
 * Returns learning insights:
 * - Recent learning moments
 * - Improvement trends
 * - Deficiency alerts
 * - Component-specific insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'learned', 'deficiency', 'improvement', 'anomaly', or null for all
    const limit = parseInt(searchParams.get('limit') || '20');
    const days = parseInt(searchParams.get('days') || '30');
    const componentId = searchParams.get('component');
    const niche = searchParams.get('niche');

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Build query
    let query = supabase
      .from('algorithm_learning_insights')
      .select('*')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (type) {
      query = query.eq('insight_type', type);
    }
    if (componentId) {
      query = query.eq('component_id', componentId);
    }
    if (niche) {
      query = query.eq('niche', niche);
    }

    const { data: insights, error: insightsError } = await query;

    if (insightsError) {
      console.error('[Algorithm IQ] Error fetching insights:', insightsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch insights' },
        { status: 500 }
      );
    }

    // Get insight type counts
    const { data: typeCounts } = await supabase
      .from('algorithm_learning_insights')
      .select('insight_type')
      .gte('created_at', startDate);

    const counts = {
      learned: 0,
      deficiency: 0,
      improvement: 0,
      anomaly: 0,
      total: 0
    };

    typeCounts?.forEach(t => {
      counts[t.insight_type as keyof typeof counts]++;
      counts.total++;
    });

    // Get trending improvements (positive impact insights)
    const { data: improvements } = await supabase
      .from('algorithm_learning_insights')
      .select('*')
      .eq('insight_type', 'improvement')
      .eq('impact_direction', 'positive')
      .gte('created_at', startDate)
      .order('impact_value', { ascending: false })
      .limit(5);

    // Get unaddressed deficiencies (alerts)
    const { data: alerts } = await supabase
      .from('algorithm_learning_insights')
      .select('*')
      .eq('insight_type', 'deficiency')
      .eq('is_addressed', false)
      .order('created_at', { ascending: false })
      .limit(5);

    // Generate summary statistics
    const summary = {
      totalInsights: counts.total,
      unaddressedDeficiencies: alerts?.length || 0,
      recentImprovements: improvements?.length || 0,
      insightsByType: counts
    };

    // Format insights for display
    const formattedInsights = (insights || []).map(i => ({
      id: i.id,
      type: i.insight_type,
      title: i.title,
      description: i.description,
      impact: i.impact_value,
      impactDirection: i.impact_direction,
      component: i.component_id,
      niche: i.niche,
      isAddressed: i.is_addressed,
      createdAt: i.created_at,
      // Icon suggestion based on type
      icon: getInsightIcon(i.insight_type),
      // Color suggestion based on type
      color: getInsightColor(i.insight_type)
    }));

    return NextResponse.json({
      success: true,
      data: {
        insights: formattedInsights,
        improvements: improvements || [],
        alerts: alerts || [],
        summary,
        filters: {
          type,
          componentId,
          niche,
          days,
          limit
        }
      }
    });

  } catch (error: any) {
    console.error('[Algorithm IQ] Insights error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST to create a new insight manually
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { type, title, description, impactValue, impactDirection, componentId, niche, evidence } = body;

    if (!type || !title || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, title, description' },
        { status: 400 }
      );
    }

    if (!['learned', 'deficiency', 'improvement', 'anomaly'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid insight type' },
        { status: 400 }
      );
    }

    const { data: insight, error } = await supabase
      .from('algorithm_learning_insights')
      .insert({
        insight_type: type,
        title,
        description,
        impact_value: impactValue,
        impact_direction: impactDirection || 'neutral',
        component_id: componentId,
        niche,
        evidence: evidence || {}
      })
      .select()
      .single();

    if (error) {
      console.error('[Algorithm IQ] Error creating insight:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create insight' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: insight
    });

  } catch (error: any) {
    console.error('[Algorithm IQ] POST insights error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH to mark an insight as addressed
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isAddressed } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing insight id' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('algorithm_learning_insights')
      .update({
        is_addressed: isAddressed !== false,
        addressed_at: isAddressed !== false ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Algorithm IQ] Error updating insight:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update insight' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('[Algorithm IQ] PATCH insights error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function getInsightIcon(type: string): string {
  switch (type) {
    case 'learned':
      return '💡';
    case 'deficiency':
      return '⚠️';
    case 'improvement':
      return '📈';
    case 'anomaly':
      return '🔍';
    default:
      return '📝';
  }
}

function getInsightColor(type: string): string {
  switch (type) {
    case 'learned':
      return 'blue';
    case 'deficiency':
      return 'red';
    case 'improvement':
      return 'green';
    case 'anomaly':
      return 'yellow';
    default:
      return 'gray';
  }
}
















