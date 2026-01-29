import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

interface RouteContext {
  params: Promise<{ id: string }>;
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

// GET /api/creator-workflows/[id] - Fetch workflow with steps
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getDevUserId();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflow_runs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (workflowError) {
      if (workflowError.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Workflow not found' },
          { status: 404 }
        );
      }
      throw workflowError;
    }

    // Fetch steps
    const { data: steps, error: stepsError } = await supabase
      .from('workflow_run_steps')
      .select('*')
      .eq('workflow_run_id', id)
      .order('phase_number', { ascending: true });

    if (stepsError) throw stepsError;

    return NextResponse.json({
      data: { workflow, steps: steps || [] },
      error: null
    });

  } catch (err) {
    console.error('Error in GET /api/creator-workflows/[id]:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/creator-workflows/[id] - Update workflow
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getDevUserId();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const body = await request.json();
    const { status, current_phase, metadata } = body;

    // Build update object
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (current_phase) updates.current_phase = current_phase;
    if (metadata) updates.metadata = metadata;

    // Handle completion
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { data: null, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: workflow, error: updateError } = await supabase
      .from('workflow_runs')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Workflow not found' },
          { status: 404 }
        );
      }
      throw updateError;
    }

    return NextResponse.json({ data: workflow, error: null });

  } catch (err) {
    console.error('Error in PATCH /api/creator-workflows/[id]:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/creator-workflows/[id] - Delete workflow (or mark as abandoned)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = await getDevUserId();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    if (hardDelete) {
      // Permanent deletion (cascades to steps, artifacts)
      const { error: deleteError } = await supabase
        .from('workflow_runs')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      return NextResponse.json({ data: { deleted: true }, error: null });
    } else {
      // Soft delete (mark as abandoned)
      const { data: workflow, error: updateError } = await supabase
        .from('workflow_runs')
        .update({ status: 'abandoned' })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({ data: workflow, error: null });
    }

  } catch (err) {
    console.error('Error in DELETE /api/creator-workflows/[id]:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
