import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

interface RouteContext {
  params: Promise<{ id: string; phase: string }>;
}

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

// GET /api/creator-workflows/[id]/steps/[phase]
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id, phase } = await context.params;
    const phaseNumber = parseInt(phase, 10);

    if (isNaN(phaseNumber) || phaseNumber < 1 || phaseNumber > 6) {
      return NextResponse.json(
        { data: null, error: 'Invalid phase number (must be 1-6)' },
        { status: 400 }
      );
    }

    const userId = await getDevUserId();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Verify workflow ownership
    const { data: workflow, error: workflowError } = await supabase
      .from('workflow_runs')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { data: null, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Fetch step
    const { data: step, error: stepError } = await supabase
      .from('workflow_run_steps')
      .select('*')
      .eq('workflow_run_id', id)
      .eq('phase_number', phaseNumber)
      .single();

    if (stepError) {
      if (stepError.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Step not found' },
          { status: 404 }
        );
      }
      throw stepError;
    }

    return NextResponse.json({ data: step, error: null });

  } catch (err) {
    console.error('Error in GET /api/creator-workflows/[id]/steps/[phase]:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/creator-workflows/[id]/steps/[phase] - Update step data
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id, phase } = await context.params;
    const phaseNumber = parseInt(phase, 10);

    if (isNaN(phaseNumber) || phaseNumber < 1 || phaseNumber > 6) {
      return NextResponse.json(
        { data: null, error: 'Invalid phase number (must be 1-6)' },
        { status: 400 }
      );
    }

    const userId = await getDevUserId();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Verify workflow ownership and get current_phase
    const { data: workflow, error: workflowError } = await supabase
      .from('workflow_runs')
      .select('id, current_phase')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { data: null, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Back-navigation rule: Cannot edit phases beyond current_phase
    if (phaseNumber > workflow.current_phase) {
      return NextResponse.json(
        { data: null, error: 'Cannot edit future phases. Complete current phase first.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { input_data, output_data, status } = body;

    // Build update object
    const updates: Record<string, unknown> = {
      last_edited_at: new Date().toISOString(),
    };

    if (input_data !== undefined) updates.input_data = input_data;
    if (output_data !== undefined) updates.output_data = output_data;
    if (status) updates.status = status;

    // Set started_at if transitioning to in_progress
    if (status === 'in_progress') {
      const { data: currentStep } = await supabase
        .from('workflow_run_steps')
        .select('started_at')
        .eq('workflow_run_id', id)
        .eq('phase_number', phaseNumber)
        .single();

      if (currentStep && !currentStep.started_at) {
        updates.started_at = new Date().toISOString();
      }
    }

    // Set completed_at if marking as completed
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data: step, error: updateError } = await supabase
      .from('workflow_run_steps')
      .update(updates)
      .eq('workflow_run_id', id)
      .eq('phase_number', phaseNumber)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ data: step, error: null });

  } catch (err) {
    console.error('Error in PUT /api/creator-workflows/[id]/steps/[phase]:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
