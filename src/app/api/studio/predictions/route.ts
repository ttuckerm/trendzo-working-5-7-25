import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export async function GET(request: Request) {
  try {
    // Get query parameters for optional limit
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Query videos table which contains the viral prediction data
    const supabase = getDb()
    const { data: videos, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Transform the data to match the frontend interface
    const transformedData = (videos || []).map(video => {
      return {
        id: video.id,
        title: video.caption || 'Untitled Video',
        creator: video.creator_username || 'Unknown Creator',
        thumbnail: `https://picsum.photos/320/180?random=${video.id}`,
        viralScore: Math.round((video.viral_probability || 0) * 100),
        predictedViews: video.view_count || 0,
        currentViews: video.view_count || 0,
        likes: video.like_count || 0,
        shares: video.share_count || 0,
        engagement: ((video.like_count || 0) + (video.comment_count || 0) + (video.share_count || 0)) / Math.max(video.view_count || 1, 1),
        tags: video.hashtags || [],
        platform: 'tiktok', // All videos in this table appear to be TikTok
        uploadDate: video.created_at,
        predictionDate: video.created_at
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: transformedData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch studio predictions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch predictions',
        data: [],
        total: 0
      },
      { status: 500 }
    );
  }
} 