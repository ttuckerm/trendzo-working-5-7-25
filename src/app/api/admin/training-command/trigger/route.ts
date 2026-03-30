/**
 * Training Command Center — Manual Trigger API
 *
 * POST /api/admin/training-command/trigger
 *   { action: 'scan' | 'collect' | 'label' | 'evaluate' | 'pause_all', niche_key?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

const VALID_ACTIONS = ['scan', 'collect', 'label', 'evaluate', 'pause_all'] as const;
type Action = typeof VALID_ACTIONS[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as Action;
    const nicheKey = body.niche_key as string | undefined;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 },
      );
    }

    const startTime = Date.now();
    let result: any;

    switch (action) {
      case 'scan': {
        const { runDiscoveryScan } = await import('@/lib/training/fresh-video-scanner');
        result = await runDiscoveryScan({ nicheKey: nicheKey || undefined });
        break;
      }
      case 'collect': {
        const { runMetricCollectorNow } = await import('@/lib/cron/scheduler');
        result = await runMetricCollectorNow();
        break;
      }
      case 'label': {
        const { runAutoLabelerNow } = await import('@/lib/cron/scheduler');
        result = await runAutoLabelerNow();
        break;
      }
      case 'evaluate': {
        const { runSpearmanEvalNow } = await import('@/lib/cron/scheduler');
        result = await runSpearmanEvalNow();
        break;
      }
      case 'pause_all': {
        const supabase = getSupabase();
        const { error } = await supabase
          .from('discovery_scan_config')
          .update({ enabled: false, updated_at: new Date().toISOString() })
          .eq('enabled', true);
        result = { paused: !error, error: error?.message };
        break;
      }
    }

    return NextResponse.json({
      success: true,
      action,
      niche_key: nicheKey || null,
      elapsed_ms: Date.now() - startTime,
      result,
    });
  } catch (error: any) {
    console.error('[TrainingCommand:Trigger] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
