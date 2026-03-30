/**
 * Data Explorer - Videos API
 * 
 * FIXED: Now cross-references scraped_videos with video_analysis
 * to show Kai Orchestrator's predictions alongside raw scraped data.
 * 
 * DATA FLOW:
 *   scraped_videos (raw) + video_analysis (Kai predictions) = Complete picture
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Disable caching to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Parse filters
    const classification = searchParams.get('classification');
    const source = searchParams.get('source');
    const hasTranscript = searchParams.get('hasTranscript');
    const hasDPS = searchParams.get('hasDPS');
    const search = searchParams.get('search');

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
    );

    // Build query
    let query = supabase
      .from('scraped_videos')
      .select(`
        video_id,
        url,
        title,
        caption,
        creator_username,
        creator_nickname,
        creator_followers_count,
        views_count,
        likes_count,
        comments_count,
        shares_count,
        saves_count,
        duration_seconds,
        dps_score,
        dps_percentile,
        dps_classification,
        transcript_text,
        hashtags,
        source,
        niche,
        scraped_at,
        upload_timestamp
      `, { count: 'exact' });

    // Apply filters
    if (classification && classification !== 'all') {
      query = query.eq('dps_classification', classification);
    }

    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    if (hasTranscript === 'yes') {
      query = query.not('transcript_text', 'is', null);
    } else if (hasTranscript === 'no') {
      query = query.is('transcript_text', null);
    }

    if (hasDPS === 'yes') {
      query = query.not('dps_score', 'is', null);
    } else if (hasDPS === 'no') {
      query = query.is('dps_score', null);
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(
        `title.ilike.%${searchTerm}%,caption.ilike.%${searchTerm}%,creator_username.ilike.%${searchTerm}%,video_id.ilike.%${searchTerm}%`
      );
    }

    // Apply pagination and ordering
    query = query
      .range(from, to)
      .order('scraped_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch videos',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      videos: data || [],
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit)
    });

  } catch (error) {
    console.error('Videos API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}









