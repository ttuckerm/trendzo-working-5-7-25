import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

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

// GET /api/creator-workflows - List user's workflows
export async function GET(request: NextRequest) {
  try {
    const userId = await getDevUserId();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let query = supabase
      .from('workflow_runs')
      .select(`
        id,
        workflow_type,
        status,
        current_phase,
        started_at,
        completed_at,
        metadata
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: workflows, error: queryError } = await query;

    if (queryError) {
      console.error('Error fetching workflows:', queryError);
      return NextResponse.json(
        { data: null, error: 'Failed to fetch workflows' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: workflows, error: null });

  } catch (err) {
    console.error('Unexpected error in GET /api/creator-workflows:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/creator-workflows - Create new workflow
export async function POST(request: NextRequest) {
  try {
    const userId = await getDevUserId();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Optional: Check active workflow limit
    const { count, error: countError } = await supabase
      .from('workflow_runs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (countError) {
      console.error('Error counting workflows:', countError);
    } else if ((count || 0) >= 5) {
      return NextResponse.json(
        { data: null, error: 'Maximum active workflows limit (5) reached. Complete or abandon an existing workflow first.' },
        { status: 409 }
      );
    }

    // Parse optional metadata from body
    let metadata = {};
    try {
      const body = await request.json();
      metadata = body.metadata || {};
    } catch {
      // Empty body is fine
    }

    // Create workflow (trigger will auto-create 6 steps)
    const { data: workflow, error: insertError } = await supabase
      .from('workflow_runs')
      .insert({
        user_id: userId,
        workflow_type: 'viral_content_creator',
        status: 'active',
        current_phase: 1,
        metadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating workflow:', insertError);
      return NextResponse.json(
        { data: null, error: insertError.message || 'Failed to create workflow' },
        { status: 500 }
      );
    }

    // Fetch auto-created steps
    const { data: steps, error: stepsError } = await supabase
      .from('workflow_run_steps')
      .select('*')
      .eq('workflow_run_id', workflow.id)
      .order('phase_number', { ascending: true });

    if (stepsError) {
      console.error('Error fetching steps:', stepsError);
    }

    return NextResponse.json({
      data: { workflow, steps: steps || [] },
      error: null
    }, { status: 201 });

  } catch (err) {
    console.error('Unexpected error in POST /api/creator-workflows:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
