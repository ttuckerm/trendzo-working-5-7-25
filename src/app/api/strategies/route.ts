import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/strategies
 * List all content strategies for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error in GET /api/strategies:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch strategies for this user
    const { data: strategies, error } = await supabase
      .from('content_strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching strategies:', error);
      return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 });
    }

    return NextResponse.json({ strategies: strategies || [] });
  } catch (error) {
    console.error('GET /api/strategies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/strategies
 * Create a new content strategy
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Debug: Log cookies received
    const allCookies = request.cookies.getAll();
    console.log('[POST /api/strategies] Cookies received:', allCookies.map(c => c.name));

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Debug: Log auth result
    console.log('[POST /api/strategies] Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      authError: authError?.message
    });

    if (authError || !user) {
      console.error('Auth error in POST /api/strategies:', authError);
      return NextResponse.json({
        error: 'Unauthorized',
        debug: {
          authError: authError?.message,
          cookiesPresent: allCookies.map(c => c.name)
        }
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, niche, audience_age_band, content_purpose, keywords, goals, exemplar_ids } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!niche) {
      return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
    }
    if (!content_purpose || !['KNOW', 'LIKE', 'TRUST'].includes(content_purpose)) {
      return NextResponse.json({ error: 'Valid content purpose is required (KNOW, LIKE, or TRUST)' }, { status: 400 });
    }

    // Create the strategy
    const { data: strategy, error } = await supabase
      .from('content_strategies')
      .insert({
        user_id: user.id,
        name: name.trim(),
        niche,
        audience_age_band: audience_age_band || null,
        content_purpose,
        keywords: keywords || [],
        goals: goals || {},
        exemplar_ids: exemplar_ids || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating strategy:', error);
      return NextResponse.json({ error: 'Failed to create strategy' }, { status: 500 });
    }

    return NextResponse.json({ strategy }, { status: 201 });
  } catch (error) {
    console.error('POST /api/strategies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
