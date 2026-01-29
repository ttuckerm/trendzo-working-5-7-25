import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Get user from session to check access level
    const userId = 'demo-user'; // Replace with actual user ID from session

    const { data: user, error: userError } = await supabaseClient
      .from('limited_users')
      .select('features_enabled')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine how many templates user can access
    const templateAccess = user.features_enabled?.template_access || 'top5';
    let limit = 5; // default

    switch (templateAccess) {
      case 'top10':
        limit = 10;
        break;
      case 'all':
        limit = 50;
        break;
      default:
        limit = 5;
    }

    // Get templates from template intelligence with status filtering
    const { data: templates, error } = await supabaseClient
      .from('template_intelligence')
      .select(`
        template_id,
        status,
        temperature_score,
        viral_count_24h,
        success_rate_limited_users,
        template_library!inner(name, success_rate, niche)
      `)
      .in('status', ['HOT', 'NEW', 'STABLE'])
      .order('temperature_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const formattedTemplates = (templates || []).map(t => ({
      id: t.template_id,
      name: t.template_library?.name || 'Viral Template',
      viral_score: t.temperature_score / 100 || 0.5, // Convert to 0-1 scale
      success_rate: t.template_library?.success_rate || 0.5,
      status: t.status,
      niche: t.template_library?.niche || 'general',
      viral_count_24h: t.viral_count_24h || 0
    }));

    return NextResponse.json({
      success: true,
      templates: formattedTemplates,
      access_level: templateAccess,
      limit_reached: formattedTemplates.length >= limit
    });

  } catch (error) {
    console.error('User templates API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}