/**
 * Thumbnail Resolution API
 * 
 * GET /api/thumbnails/resolve?url=<tiktok_url>
 * 
 * Resolves a TikTok video URL to its thumbnail image URL using oembed.
 * Caches results in the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface OembedResponse {
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  title?: string;
  author_name?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const videoId = searchParams.get('video_id');
  
  if (!url && !videoId) {
    return NextResponse.json(
      { success: false, error: 'url or video_id parameter required' },
      { status: 400 }
    );
  }
  
  try {
    // If video_id provided, look up the URL
    let tiktokUrl = url;
    
    const force = searchParams.get('force') === 'true';
    
    if (videoId && !url) {
      const { data: video } = await supabase
        .from('scraped_videos')
        .select('url, thumbnail_url')
        .eq('video_id', videoId)
        .single();
      
      if (!video) {
        return NextResponse.json(
          { success: false, error: 'Video not found' },
          { status: 404 }
        );
      }
      
      // If we already have a real thumbnail URL (not oembed placeholder) and NOT forcing refresh, return it
      if (!force && video.thumbnail_url && !video.thumbnail_url.includes('/oembed?')) {
        return NextResponse.json({
          success: true,
          thumbnail_url: video.thumbnail_url,
          cached: true
        });
      }
      
      tiktokUrl = video.url;
    }
    
    // Fetch oembed data
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(tiktokUrl!)}`;
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `TikTok oembed failed: ${response.status}` },
        { status: 502 }
      );
    }
    
    const oembed: OembedResponse = await response.json();
    
    if (!oembed.thumbnail_url) {
      return NextResponse.json(
        { success: false, error: 'No thumbnail in oembed response' },
        { status: 404 }
      );
    }
    
    // Cache the result if we have a video_id
    if (videoId) {
      await supabase
        .from('scraped_videos')
        .update({ thumbnail_url: oembed.thumbnail_url })
        .eq('video_id', videoId);
    }
    
    return NextResponse.json({
      success: true,
      thumbnail_url: oembed.thumbnail_url,
      thumbnail_width: oembed.thumbnail_width,
      thumbnail_height: oembed.thumbnail_height,
      title: oembed.title,
      author: oembed.author_name,
      cached: false
    });
    
  } catch (error: any) {
    console.error('Thumbnail resolution error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/thumbnails/resolve
 * 
 * Batch resolve thumbnails for multiple videos
 * Body: { video_ids: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { video_ids } = await request.json();
    
    if (!Array.isArray(video_ids) || video_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'video_ids array required' },
        { status: 400 }
      );
    }
    
    // Limit batch size
    const limitedIds = video_ids.slice(0, 20);
    
    // Get videos that need thumbnail resolution
    const { data: videos } = await supabase
      .from('scraped_videos')
      .select('video_id, url, thumbnail_url')
      .in('video_id', limitedIds);
    
    const results: Record<string, string | null> = {};
    
    for (const video of videos || []) {
      // Skip if already has real thumbnail
      if (video.thumbnail_url && !video.thumbnail_url.includes('/oembed?')) {
        results[video.video_id] = video.thumbnail_url;
        continue;
      }
      
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(video.url)}`;
        const response = await fetch(oembedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          const oembed: OembedResponse = await response.json();
          if (oembed.thumbnail_url) {
            results[video.video_id] = oembed.thumbnail_url;
            
            // Cache it
            await supabase
              .from('scraped_videos')
              .update({ thumbnail_url: oembed.thumbnail_url })
              .eq('video_id', video.video_id);
          } else {
            results[video.video_id] = null;
          }
        } else {
          results[video.video_id] = null;
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 200));
        
      } catch {
        results[video.video_id] = null;
      }
    }
    
    return NextResponse.json({
      success: true,
      thumbnails: results,
      resolved: Object.values(results).filter(v => v !== null).length,
      failed: Object.values(results).filter(v => v === null).length
    });
    
  } catch (error: any) {
    console.error('Batch thumbnail resolution error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}














