import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter required' },
        { status: 400 }
      );
    }

    // Fetch user's installed apps with app details
    const { data: installedApps, error } = await supabase
      .from('user_apps')
      .select(`
        installed_at,
        mini_apps (
          id,
          name,
          description,
          category,
          price,
          creator_id,
          creator_name,
          install_count,
          rating,
          icon,
          version,
          status
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching installed apps:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Flatten the data structure
    const apps = (installedApps || []).map((item: any) => ({
      ...item.mini_apps,
      installed_at: item.installed_at,
    }));

    return NextResponse.json({
      success: true,
      apps,
      total: apps.length,
    });
  } catch (error) {
    console.error('Error in installed apps API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
