import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { ABKaiIntegration } from '@/lib/services/ab-kai-integration';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const abKai = new ABKaiIntegration(supabase);

/**
 * GET /api/kai/ab-test/:testId
 * Get detailed results for a specific A/B test
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;

    const results = await abKai.getComponentTestResults(testId);

    if (!results) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
