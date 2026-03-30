import { NextResponse } from 'next/server';
import supabaseDefault from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = supabaseDefault.client;
    
    // Get real creator usernames from scraped data
    const { data: videos, error } = await supabase
      .from('scraped_data')
      .select('creator_username, views, title')
      .not('creator_username', 'is', null)
      .not('creator_username', 'eq', '')
      .order('views', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: true,
        creators: [],
        totalCreators: 0
      });
    }

    // Get unique creators
    const uniqueCreators = videos?.reduce((acc: any[], video: any) => {
      if (!acc.find(c => c.username === video.creator_username)) {
        acc.push({
          username: video.creator_username,
          topVideo: video.title,
          views: video.views
        });
      }
      return acc;
    }, []) || [];

    return NextResponse.json({
      success: true,
      creators: uniqueCreators,
      totalCreators: uniqueCreators.length
    });
  } catch (error) {
    console.error('Failed to fetch real creators:', error);
    return NextResponse.json({
      success: true,
      creators: [],
      totalCreators: 0
    });
  }
}