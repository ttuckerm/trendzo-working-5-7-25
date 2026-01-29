import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}
const supabase = new Proxy({}, { get(_t, p){ return (getDb() as any)[p as any] } }) as any;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const niche = searchParams.get('niche') || undefined;
    const limit = Math.min(Number(searchParams.get('limit') || 30), 100);

    let query = supabase
      .from('videos')
      .select('id, platform, web_url, thumbnail_url, description, caption, duration_seconds, views, likes, comments, shares, niches, viral_score')
      .order('views', { ascending: false })
      .limit(limit);

    if (niche) {
      // Postgres array contains
      query = query.contains('niches', [niche] as any);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('videos query failed:', error.message);
      // Fallback demo items so UI is immediately usable without DB wiring
      const demo = buildDemoItems();
      return NextResponse.json(demo);
    }

    const items = (data || []).map((v: any) => ({
      id: v.id,
      platform: v.platform || 'tiktok',
      title: v.description || null,
      caption: v.caption || null,
      thumbnail_url: v.thumbnail_url || '',
      web_url: v.web_url || '',
      duration_sec: v.duration_seconds || 0,
      badges: [],
      stats: {
        views: v.views ?? v.view_count ?? 0,
        likes: v.likes ?? v.like_count ?? 0,
        comments: v.comments ?? v.comment_count ?? 0,
        shares: v.shares ?? v.share_count ?? 0
      },
      viral_score: v.viral_score ?? null,
      success_rate: null,
      niches: v.niches || [],
      template: null
    }));

    return NextResponse.json(items);
  } catch (e: any) {
    console.error('proving-grounds endpoint error', e?.message || e);
    // Return demo data on unexpected error as well
    return NextResponse.json(buildDemoItems(), { status: 200 });
  }
}

function buildDemoItems() {
  const make = (over: Partial<any> = {}) => ({
    id: cryptoRandomId(),
    platform: 'tiktok',
    title: 'Demo Video',
    caption: 'Demo caption',
    thumbnail_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=640&h=800&fit=crop',
    web_url: 'https://www.tiktok.com/@demo/video/1000000001',
    duration_sec: 24,
    badges: [],
    stats: { views: 2500000, likes: 182000, comments: 6400, shares: 9100 },
    viral_score: 0.9,
    success_rate: null,
    niches: [],
    template: null,
    ...over,
  });
  return [
    make({ title: 'POV Experience', stats: { views: 2450000, likes: 182000, comments: 6400, shares: 9100 } }),
    make({ title: 'Transformation Reveal', stats: { views: 1800000, likes: 120000, comments: 3500, shares: 5200 } }),
    make({ title: 'Quick Tutorial', stats: { views: 1250000, likes: 83000, comments: 2400, shares: 4100 } }),
    make({ title: 'Comedy Sketch', stats: { views: 980000, likes: 76000, comments: 3100, shares: 6200 } }),
    make({ title: 'Behind the Scenes', stats: { views: 730000, likes: 52000, comments: 2100, shares: 2800 } }),
    make({ title: 'Comparison Carousel', stats: { views: 690000, likes: 47000, comments: 1900, shares: 2600 } }),
  ];
}

function cryptoRandomId(): string {
  try {
    const { randomUUID } = require('crypto');
    return randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}


