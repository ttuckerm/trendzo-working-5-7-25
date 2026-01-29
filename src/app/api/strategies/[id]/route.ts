import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/strategies/[id]
 * Get a single content strategy by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: strategy, error } = await supabase
      .from('content_strategies')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
      }
      console.error('Error fetching strategy:', error);
      return NextResponse.json({ error: 'Failed to fetch strategy' }, { status: 500 });
    }

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error('GET /api/strategies/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/strategies/[id]
 * Update an existing content strategy
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, niche, audience_age_band, content_purpose, keywords, goals, exemplar_ids } = body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (niche !== undefined) updateData.niche = niche;
    if (audience_age_band !== undefined) updateData.audience_age_band = audience_age_band;
    if (content_purpose !== undefined) {
      if (!['KNOW', 'LIKE', 'TRUST'].includes(content_purpose)) {
        return NextResponse.json({ error: 'Invalid content purpose' }, { status: 400 });
      }
      updateData.content_purpose = content_purpose;
    }
    if (keywords !== undefined) updateData.keywords = keywords;
    if (goals !== undefined) updateData.goals = goals;
    if (exemplar_ids !== undefined) updateData.exemplar_ids = exemplar_ids;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: strategy, error } = await supabase
      .from('content_strategies')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
      }
      console.error('Error updating strategy:', error);
      return NextResponse.json({ error: 'Failed to update strategy' }, { status: 500 });
    }

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error('PUT /api/strategies/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/strategies/[id]
 * Delete a content strategy
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('content_strategies')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting strategy:', error);
      return NextResponse.json({ error: 'Failed to delete strategy' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/strategies/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
