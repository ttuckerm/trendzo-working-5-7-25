import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const limit = parseInt(searchParams.get('limit') || '3');

    if (!niche) {
      return NextResponse.json(
        { success: false, error: 'Niche parameter required' },
        { status: 400 }
      );
    }

    // Fetch apps matching the niche category (with some fuzzy matching)
    const { data: apps, error } = await supabase
      .from('mini_apps')
      .select('*')
      .eq('status', 'active')
      .or(`category.ilike.%${niche}%,name.ilike.%${niche}%,description.ilike.%${niche}%`)
      .order('install_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recommended apps:', error);
      // Fallback: return all active apps sorted by popularity
      const { data: fallbackApps } = await supabase
        .from('mini_apps')
        .select('*')
        .eq('status', 'active')
        .order('install_count', { ascending: false })
        .limit(limit);

      return NextResponse.json({
        success: true,
        apps: fallbackApps || [],
        fallback: true,
      });
    }

    return NextResponse.json({
      success: true,
      apps: apps || [],
      niche,
    });
  } catch (error) {
    console.error('Error in recommended apps API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
