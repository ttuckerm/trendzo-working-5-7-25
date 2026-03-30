import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveCanvasAuth } from '../_lib/auth';

/**
 * GET /api/canvas/projects
 * List all canvas projects for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const anonClient = await createServerSupabaseClient();
    const { userId, supabase, errorResponse } = await resolveCanvasAuth(anonClient);
    if (errorResponse) return errorResponse;

    let query = supabase
      .from('canvas_projects')
      .select('id, title, template_type, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (userId) query = query.eq('user_id', userId);

    const { data: projects, error } = await query;

    if (error) {
      console.error('Error fetching canvas projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    return NextResponse.json({ projects: projects || [] });
  } catch (error) {
    console.error('GET /api/canvas/projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/canvas/projects
 * Create a new canvas project
 */
export async function POST(request: NextRequest) {
  try {
    const anonClient = await createServerSupabaseClient();
    const { userId, supabase, errorResponse } = await resolveCanvasAuth(anonClient);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { title, template_type } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const insertRow: Record<string, unknown> = {
      title: title.trim(),
      template_type: template_type || null,
    };
    if (userId) insertRow.user_id = userId;

    const { data: project, error } = await supabase
      .from('canvas_projects')
      .insert(insertRow)
      .select('id, title')
      .single();

    if (error) {
      console.error('[canvas POST] insert error:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('POST /api/canvas/projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
