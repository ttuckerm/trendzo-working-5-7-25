import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const PHASE_NAMES = ['Research', 'Plan', 'Create', 'Optimize', 'Publish', 'Engage'];

// TEMPORARY: Auth bypass helper for local dev
// TODO: Fix Supabase cookie auth and remove this
// Using a valid UUID format for the bypass user
const DEV_BYPASS_USER_ID = '00000000-0000-0000-0000-000000000000';

async function getDevUserId(): Promise<string> {
  try {
    const authClient = createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    // Auth failed, use bypass
  }
  console.log('[DEV] Auth bypassed - using dev UUID');
  return DEV_BYPASS_USER_ID;
}

// GET /api/creator-workflows/recent - Get 10 most recent workflows for picker
export async function GET(request: NextRequest) {
  try {
    const userId = await getDevUserId();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: workflows, error: queryError } = await supabase
      .from('workflow_runs')
      .select(`
        id,
        status,
        current_phase,
        started_at,
        completed_at,
        metadata
      `)
      .eq('user_id', userId)
      .neq('status', 'abandoned')
      .order('started_at', { ascending: false })
      .limit(10);

    if (queryError) {
      console.error('Error fetching recent workflows:', queryError);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch workflows' },
        { status: 500 }
      );
    }

    // Transform for picker display
    const pickerItems = (workflows || []).map(w => ({
      id: w.id,
      status: w.status,
      currentPhase: w.current_phase,
      currentPhaseName: PHASE_NAMES[w.current_phase - 1] || 'Unknown',
      title: w.metadata?.title || w.metadata?.niche || 'Untitled Workflow',
      startedAt: w.started_at,
      completedAt: w.completed_at,
      lastEditedLabel: getLastEditedLabel(w.started_at),
    }));

    return NextResponse.json({ data: pickerItems, error: null });

  } catch (err) {
    console.error('Unexpected error in GET /api/creator-workflows/recent:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper: Format relative time for picker
function getLastEditedLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
