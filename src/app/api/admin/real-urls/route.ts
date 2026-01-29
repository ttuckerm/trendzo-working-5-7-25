import { NextResponse } from 'next/server';
import supabaseDefault from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = supabaseDefault.client;
    
    // Get 5 real TikTok URLs from scraped data
    const { data: videos, error } = await supabase
      .from('scraped_data')
      .select('tiktok_url, title, views')
      .not('tiktok_url', 'is', null)
      .not('tiktok_url', 'eq', '')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch URLs' },
        { status: 500 }
      );
    }

    // Format URLs for testing
    const testUrls = videos?.map(video => video.tiktok_url) || [
      // Fallback URLs if no data available
      'https://www.tiktok.com/@creator1/video/7000000000000000001',
      'https://www.tiktok.com/@creator2/video/7000000000000000002',
      'https://www.tiktok.com/@creator3/video/7000000000000000003'
    ];

    return NextResponse.json({
      success: true,
      urls: testUrls,
      videos: videos || []
    });
  } catch (error) {
    console.error('Failed to fetch real URLs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch URLs' },
      { status: 500 }
    );
  }
}