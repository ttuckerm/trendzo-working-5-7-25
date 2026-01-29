import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch recent HIGH-PERFORMING videos directly from scraped_videos
    // Filter for videos with high DPS (>= 60) to show what's working across platform
    const { data: videos, error: videosError } = await supabase
      .from('scraped_videos')
      .select('video_id, url, title, thumbnail_url, creator_username, views_count, likes_count, dps_score, scraped_at')
      .gte('dps_score', 60) // Only show viral/high-performing videos
      .not('title', 'is', null)
      .order('scraped_at', { ascending: false })
      .limit(limit);

    if (videosError) {
      console.error('Error fetching feed videos:', videosError);
      throw videosError;
    }

    // If we have videos, try to get their niches from viral_genomes
    let nicheMap = new Map<string, string>();
    if (videos && videos.length > 0) {
      const videoIds = videos.map(v => v.video_id);
      
      // Try to find matching viral_genomes by video_id in example_videos
      const { data: genomes } = await supabase
        .from('viral_genomes')
        .select('niche, example_videos')
        .not('example_videos', 'is', null);

      // Build a map of video_id -> niche
      genomes?.forEach(genome => {
        if (genome.example_videos && Array.isArray(genome.example_videos)) {
          genome.example_videos.forEach((vid: string) => {
            if (!nicheMap.has(vid)) {
              nicheMap.set(vid, genome.niche);
            }
          });
        }
      });
    }

    // Format response
    const feed = videos?.map(video => {
      return {
        id: video.video_id,
        videoId: video.video_id,
        url: video.url,
        title: video.title || 'Untitled Video',
        thumbnail: video.thumbnail_url || null,
        creator: video.creator_username || 'Unknown',
        niche: formatNiche(nicheMap.get(video.video_id) || null),
        views: video.views_count || 0,
        likes: video.likes_count || 0,
        dps: video.dps_score || 0,
        timestamp: video.scraped_at,
        timeAgo: getTimeAgo(video.scraped_at)
      };
    }) || [];

    // If no high-DPS videos found, fetch any recent videos
    if (feed.length === 0) {
      const { data: fallbackVideos } = await supabase
        .from('scraped_videos')
        .select('video_id, url, title, thumbnail_url, creator_username, views_count, likes_count, dps_score, scraped_at')
        .not('title', 'is', null)
        .order('dps_score', { ascending: false, nullsFirst: false })
        .limit(limit);

      const fallbackFeed = fallbackVideos?.map(video => ({
        id: video.video_id,
        videoId: video.video_id,
        url: video.url,
        title: video.title || 'Untitled Video',
        thumbnail: video.thumbnail_url || null,
        creator: video.creator_username || 'Unknown',
        niche: 'General', // Default niche for fallback
        views: video.views_count || 0,
        likes: video.likes_count || 0,
        dps: video.dps_score || 0,
        timestamp: video.scraped_at,
        timeAgo: getTimeAgo(video.scraped_at)
      })) || [];

      return NextResponse.json({
        success: true,
        feed: fallbackFeed,
        total: fallbackFeed.length,
        source: 'scraped_videos',
        note: 'Showing top videos by DPS (no videos above 60 DPS threshold)'
      });
    }

    return NextResponse.json({
      success: true,
      feed,
      total: feed.length,
      source: 'scraped_videos'
    });

  } catch (error: any) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function formatNiche(niche: string | null): string {
  if (!niche) return 'General';
  return niche.charAt(0).toUpperCase() + niche.slice(1).replace(/-/g, ' ');
}

function getTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
