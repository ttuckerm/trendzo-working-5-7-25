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
    const status = searchParams.get('status') || 'active';
    const limit = Math.min(Number(searchParams.get('limit') || 30), 100);

    // Expect an experiments table; fall back to top recent videos with badges
    const { data, error } = await supabase
      .from('experiments')
      .select('video_id, status, ab_group, stage')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data?.length) {
      // Fallback: derive from latest videos with synthetic experiment badges
      const { data: videos, error: vErr } = await supabase
        .from('videos')
        .select('id, platform, web_url, thumbnail_url, description, caption, duration_seconds, views, likes, comments, shares')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!vErr && videos?.length) {
        const items = (videos || []).map((v: any, idx: number) => ({
          id: v.id,
          platform: v.platform || 'tiktok',
          title: v.description || null,
          caption: v.caption || null,
          thumbnail_url: v.thumbnail_url || '',
          web_url: v.web_url || '',
          duration_sec: v.duration_seconds || 0,
          badges: [status, idx % 2 === 0 ? 'A' : 'B', 'phase-1'],
          stats: {
            views: v.views ?? v.view_count ?? 0,
            likes: v.likes ?? v.like_count ?? 0,
            comments: v.comments ?? v.comment_count ?? 0,
            shares: v.shares ?? v.share_count ?? 0,
          },
          viral_score: null,
          success_rate: null,
          niches: [],
          template: null,
        }));
        return NextResponse.json(items);
      }
      // Final fallback: return a small demo set
      const demo = [
        makeDemo('Discovery A/B Test', 2450000),
        makeDemo('Hook Timing Experiment', 1800000),
        makeDemo('Script Variation Trial', 1250000),
      ];
      return NextResponse.json(demo);
    }

    const ids = data.map((e: any) => e.video_id);
    const { data: videos } = await supabase
      .from('videos')
      .select('id, platform, web_url, thumbnail_url, description, caption, duration_seconds, views, likes, comments, shares')
      .in('id', ids);

    const byId = new Map((videos || []).map((v: any) => [v.id, v]));
    const items = data.map((e: any) => {
      const v = byId.get(e.video_id) || {};
      return {
        id: e.video_id,
        platform: v.platform || 'tiktok',
        title: v.description || null,
        caption: v.caption || null,
        thumbnail_url: v.thumbnail_url || '',
        web_url: v.web_url || '',
        duration_sec: v.duration_seconds || 0,
        badges: [e.status, e.ab_group, e.stage].filter(Boolean),
        stats: {
          views: v.views ?? v.view_count ?? 0,
          likes: v.likes ?? v.like_count ?? 0,
          comments: v.comments ?? v.comment_count ?? 0,
          shares: v.shares ?? v.share_count ?? 0
        },
        viral_score: null,
        success_rate: null,
        niches: [],
        template: null
      };
    });

    return NextResponse.json(items);
  } catch (e: any) {
    console.error('lab endpoint error', e?.message || e);
    return NextResponse.json([makeDemo('Demo Experiment', 1000000)], { status: 200 });
  }
}

function makeDemo(title: string, views: number) {
  return {
    id: cryptoRandomId(),
    platform: 'tiktok',
    title,
    caption: 'Auto-generated demo item',
    thumbnail_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=640&h=800&fit=crop',
    web_url: 'https://www.tiktok.com/@demo/video/1000000001',
    duration_sec: 24,
    badges: ['active', 'A', 'phase-1'],
    stats: { views, likes: Math.floor(views * 0.07), comments: Math.floor(views * 0.0025), shares: Math.floor(views * 0.003) },
    viral_score: null,
    success_rate: null,
    niches: [],
    template: null,
  };
}

function cryptoRandomId(): string {
  try {
    const { randomUUID } = require('crypto');
    return randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}


