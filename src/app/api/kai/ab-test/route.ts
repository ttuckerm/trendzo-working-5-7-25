import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { ABKaiIntegration } from '@/lib/services/ab-kai-integration';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const abKai = new ABKaiIntegration(supabase);

/**
 * GET /api/kai/ab-test
 * List all component A/B tests
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as 'running' | 'completed' | null;
    const componentId = searchParams.get('componentId');

    let query = supabase
      .from('kai_component_tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (componentId) {
      query = query.eq('component_id', componentId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      tests: data,
      count: data.length
    });

  } catch (error: any) {
    console.error('Error fetching A/B tests:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kai/ab-test
 * Create a new component A/B test
 *
 * Body:
 * {
 *   componentId: string,
 *   variantA: { name: string, config: Record<string, any> },
 *   variantB: { name: string, config: Record<string, any> }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { componentId, variantA, variantB } = body;

    if (!componentId || !variantA || !variantB) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: componentId, variantA, variantB' },
        { status: 400 }
      );
    }

    const test = await abKai.createComponentTest(
      componentId,
      variantA,
      variantB
    );

    return NextResponse.json({
      success: true,
      test
    });

  } catch (error: any) {
    console.error('Error creating A/B test:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/kai/ab-test/:testId
 * Update test status or promote winner
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { testId, action } = body;

    if (!testId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: testId, action' },
        { status: 400 }
      );
    }

    if (action === 'complete') {
      // Mark test as completed
      const { error } = await supabase
        .from('kai_component_tests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('test_id', testId);

      if (error) throw error;

      // Get results
      const results = await abKai.getComponentTestResults(testId);

      return NextResponse.json({
        success: true,
        results
      });

    } else if (action === 'promote') {
      // Promote winning variant
      const promoted = await abKai.promoteWinningVariant(testId);

      if (!promoted) {
        return NextResponse.json(
          { success: false, error: 'No clear winner to promote' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        promoted
      });

    } else if (action === 'pause') {
      // Pause test
      const { error } = await supabase
        .from('kai_component_tests')
        .update({ status: 'paused' })
        .eq('test_id', testId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Test paused'
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use: complete, promote, or pause' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error updating A/B test:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
