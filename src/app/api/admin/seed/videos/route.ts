import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

type DemoVideo = {
  id: string;
  tiktok_id?: string;
  platform: string;
  web_url: string;
  thumbnail_url: string;
  caption: string;
  description?: string;
  duration_seconds: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  niches: string[];
  viral_score?: number | null;
  created_at?: string;
  upload_timestamp?: string;
};

function buildDemoVideos(): DemoVideo[] {
  const now = new Date().toISOString();
  const tid = (u: string) => deriveTikTokId(u);
  return [
    {
      id: randomUUID(),
      tiktok_id: tid('https://www.tiktok.com/@demo/video/1000000001'),
      platform: 'tiktok',
      web_url: 'https://www.tiktok.com/@demo/video/1000000001',
      thumbnail_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=640&h=800&fit=crop',
      caption: 'POV Experience: First-person story that hooks fast',
      description: 'POV Experience template demo',
      duration_seconds: 24,
      views: 2450000,
      likes: 182000,
      comments: 6400,
      shares: 9100,
      niches: ['Personal Finance/Investing'],
      viral_score: 0.91,
      created_at: now,
      upload_timestamp: now,
    },
    {
      id: randomUUID(),
      tiktok_id: tid('https://www.tiktok.com/@demo/video/1000000002'),
      platform: 'tiktok',
      web_url: 'https://www.tiktok.com/@demo/video/1000000002',
      thumbnail_url: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=640&h=800&fit=crop',
      caption: 'Transformation Reveal in 30 seconds',
      description: 'Before/after visual payoff',
      duration_seconds: 30,
      views: 1800000,
      likes: 120000,
      comments: 3500,
      shares: 5200,
      niches: ['Fitness/Weight Loss'],
      viral_score: 0.88,
      created_at: now,
      upload_timestamp: now,
    },
    {
      id: randomUUID(),
      tiktok_id: tid('https://www.tiktok.com/@demo/video/1000000003'),
      platform: 'tiktok',
      web_url: 'https://www.tiktok.com/@demo/video/1000000003',
      thumbnail_url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=640&h=800&fit=crop',
      caption: 'Quick Tutorial: 3 steps in 20s',
      description: 'Educational micro-tutorial',
      duration_seconds: 20,
      views: 1250000,
      likes: 83000,
      comments: 2400,
      shares: 4100,
      niches: ['Business/Entrepreneurship'],
      viral_score: 0.86,
      created_at: now,
      upload_timestamp: now,
    },
    {
      id: randomUUID(),
      tiktok_id: tid('https://www.tiktok.com/@demo/video/1000000004'),
      platform: 'tiktok',
      web_url: 'https://www.tiktok.com/@demo/video/1000000004',
      thumbnail_url: 'https://images.unsplash.com/photo-1553969420-fb915ada4cf0?w=640&h=800&fit=crop',
      caption: 'Comedy Sketch: relatable scenario',
      description: 'Relatable humor with share potential',
      duration_seconds: 28,
      views: 980000,
      likes: 76000,
      comments: 3100,
      shares: 6200,
      niches: ['Entertainment'],
      viral_score: 0.84,
      created_at: now,
      upload_timestamp: now,
    },
    {
      id: randomUUID(),
      tiktok_id: tid('https://www.tiktok.com/@demo/video/1000000005'),
      platform: 'tiktok',
      web_url: 'https://www.tiktok.com/@demo/video/1000000005',
      thumbnail_url: 'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=640&h=800&fit=crop',
      caption: 'Behind the Scenes: authentic connection',
      description: 'BTS building trust',
      duration_seconds: 32,
      views: 730000,
      likes: 52000,
      comments: 2100,
      shares: 2800,
      niches: ['Tech Reviews/Tutorials'],
      viral_score: 0.82,
      created_at: now,
      upload_timestamp: now,
    },
    {
      id: randomUUID(),
      tiktok_id: tid('https://www.tiktok.com/@demo/video/1000000006'),
      platform: 'tiktok',
      web_url: 'https://www.tiktok.com/@demo/video/1000000006',
      thumbnail_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&h=800&fit=crop',
      caption: 'Comparison Carousel: A vs B vs C',
      description: 'Comparison format driving comments',
      duration_seconds: 26,
      views: 690000,
      likes: 47000,
      comments: 1900,
      shares: 2600,
      niches: ['Food/Nutrition Comparisons'],
      viral_score: 0.83,
      created_at: now,
      upload_timestamp: now,
    },
  ];
}

export async function GET(_req: NextRequest) {
  try {
    const items = buildDemoVideos();

    // Attempt 1: plain insert
    let { data, error } = await supabase.from('videos').upsert(items, { onConflict: 'id' });

    // Attempt 2: include only creator_id if NOT NULL constraint exists
    if (error) {
      const attemptWithCreator = items.map((v) => ({
        ...v,
        creator_id: 'demo_creator',
      }));
      const res2 = await supabase.from('videos').upsert(attemptWithCreator, { onConflict: 'id' });
      data = res2.data as any;
      error = res2.error as any;
    }

    // Attempt 3: if type mismatch on creator_id, try UUID zero
    if (error) {
      const attemptWithUuid = items.map((v) => ({
        ...v,
        creator_id: '00000000-0000-0000-0000-000000000000',
      }));
      const res3 = await supabase.from('videos').upsert(attemptWithUuid, { onConflict: 'id' });
      data = res3.data as any;
      error = res3.error as any;
    }

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint:
            'Your existing public.videos has extra NOT NULL columns (e.g., creator_id). Seeder tried fallback shapes and still failed. Consider relaxing NOT NULL or adding defaults for creator_id/author_id.'.
              concat('\nThen re-run this seed.'),
          itemsAttempted: items.length,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ inserted: data?.length ?? items.length, ids: items.map((v) => v.id) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}

function deriveTikTokId(url: string): string {
  try {
    const m = url.match(/\/video\/(\d+)/);
    if (m && m[1]) return m[1];
  } catch {}
  return randomUUID();
}


