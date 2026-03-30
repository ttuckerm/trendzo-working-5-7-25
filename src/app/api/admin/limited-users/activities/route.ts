import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data: activities, error } = await supabaseClient
      .from('user_analytics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      activities: activities || []
    });

  } catch (error) {
    console.error('User activities API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}