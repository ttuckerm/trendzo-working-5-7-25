import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface WatchlistItem {
  id: string;
  niche: string;
  avgDps: number;
  change: string;
  videoCount: number;
  genomeCount: number;
  createdAt: string;
}

// In-memory watchlist storage (since the watchlist table doesn't exist)
// In production, this should be stored in a database table
const watchlistStore = new Map<string, { id: string; niche: string; created_at: string }[]>();

// Initialize with some default niches based on available data
const defaultNiches = ['personal-finance', 'fitness', 'tech', 'lifestyle', 'business'];

// GET - Fetch user's watchlist with stats from scraped_videos and viral_genomes
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId') || 'default_user';

    // Get or initialize user's watchlist
    let userWatchlist = watchlistStore.get(creatorId);
    if (!userWatchlist) {
      // Initialize with default niches
      userWatchlist = defaultNiches.map((niche, index) => ({
        id: `${creatorId}-${niche}`,
        niche,
        created_at: new Date().toISOString()
      }));
      watchlistStore.set(creatorId, userWatchlist);
    }

    if (userWatchlist.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
        source: 'scraped_videos + viral_genomes'
      });
    }

    // Calculate stats for each niche from real data
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const itemsWithStats: WatchlistItem[] = await Promise.all(
      userWatchlist.map(async (item) => {
        // Query scraped_videos matching this niche
        const { data: thisWeekVideos } = await supabase
          .from('scraped_videos')
          .select('video_id, dps_score, scraped_at')
          .ilike('niche', `%${item.niche}%`)
          .gte('scraped_at', sevenDaysAgo.toISOString())
          .not('dps_score', 'is', null);

        const { data: lastWeekVideos } = await supabase
          .from('scraped_videos')
          .select('video_id, dps_score, scraped_at')
          .ilike('niche', `%${item.niche}%`)
          .gte('scraped_at', fourteenDaysAgo.toISOString())
          .lt('scraped_at', sevenDaysAgo.toISOString())
          .not('dps_score', 'is', null);

        // Query viral_genomes for pattern count
        const { count: genomeCount } = await supabase
          .from('viral_genomes')
          .select('id', { count: 'exact', head: true })
          .ilike('niche', `%${item.niche}%`);

        // Calculate averages
        const thisWeekAvg = thisWeekVideos && thisWeekVideos.length > 0
          ? thisWeekVideos.reduce((sum, v) => sum + (v.dps_score || 0), 0) / thisWeekVideos.length
          : 0;

        const lastWeekAvg = lastWeekVideos && lastWeekVideos.length > 0
          ? lastWeekVideos.reduce((sum, v) => sum + (v.dps_score || 0), 0) / lastWeekVideos.length
          : thisWeekAvg;

        // Calculate change percentage
        const changePercent = lastWeekAvg > 0
          ? ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100
          : 0;

        return {
          id: item.id,
          niche: item.niche.charAt(0).toUpperCase() + item.niche.slice(1).replace(/-/g, ' '),
          avgDps: Math.round(thisWeekAvg * 10) / 10,
          change: changePercent >= 0 ? `+${Math.round(changePercent)}%` : `${Math.round(changePercent)}%`,
          videoCount: thisWeekVideos?.length || 0,
          genomeCount: genomeCount || 0,
          createdAt: item.created_at
        };
      })
    );

    return NextResponse.json({
      success: true,
      items: itemsWithStats,
      source: 'scraped_videos + viral_genomes'
    });

  } catch (error: any) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Add new niche to watchlist
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { niche, creatorId = 'default_user' } = body;

    if (!niche || typeof niche !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Niche is required' },
        { status: 400 }
      );
    }

    // Get or initialize user's watchlist
    let userWatchlist = watchlistStore.get(creatorId) || [];

    // Check for duplicate
    if (userWatchlist.some(item => item.niche.toLowerCase() === niche.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Niche already in watchlist' },
        { status: 409 }
      );
    }

    // Add new item
    const newItem = {
      id: `${creatorId}-${niche.toLowerCase().replace(/\s+/g, '-')}`,
      niche: niche.toLowerCase().replace(/\s+/g, '-'),
      created_at: new Date().toISOString()
    };

    userWatchlist.push(newItem);
    watchlistStore.set(creatorId, userWatchlist);

    return NextResponse.json({
      success: true,
      item: newItem
    });

  } catch (error: any) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove niche from watchlist
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const creatorId = searchParams.get('creatorId') || 'default_user';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    // Get user's watchlist
    let userWatchlist = watchlistStore.get(creatorId) || [];

    // Remove item
    userWatchlist = userWatchlist.filter(item => item.id !== id);
    watchlistStore.set(creatorId, userWatchlist);

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
