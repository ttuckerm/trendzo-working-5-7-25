import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env';

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
}

function buildDemoTemplates(count: number) {
  const base = [
    {
      template_id: 'demo_1',
      name: 'API Demo: POV Experience',
      success_rate: 0.91,
      avg_views: 2400000,
      platform: 'tiktok',
      hook_time_sec: 3,
      min_duration_sec: 15,
      max_duration_sec: 35,
      badges: ['storytelling', 'viral'],
    },
    {
      template_id: 'demo_2',
      name: 'API Demo: Transformation Reveal',
      success_rate: 0.88,
      avg_views: 1800000,
      platform: 'tiktok',
      hook_time_sec: 2,
      min_duration_sec: 12,
      max_duration_sec: 40,
      badges: ['visual', 'trend'],
    },
    {
      template_id: 'demo_3',
      name: 'API Demo: Quick Tutorial',
      success_rate: 0.86,
      avg_views: 1500000,
      platform: 'tiktok',
      hook_time_sec: 4,
      min_duration_sec: 20,
      max_duration_sec: 60,
      badges: ['education', 'saves'],
    },
    {
      template_id: 'demo_4',
      name: 'API Demo: Authority Breakdown',
      success_rate: 0.83,
      avg_views: 1200000,
      platform: 'tiktok',
      hook_time_sec: 5,
      min_duration_sec: 25,
      max_duration_sec: 55,
      badges: ['authority'],
    },
    {
      template_id: 'demo_5',
      name: 'API Demo: Comparison Carousel',
      success_rate: 0.84,
      avg_views: 1300000,
      platform: 'tiktok',
      hook_time_sec: 3,
      min_duration_sec: 18,
      max_duration_sec: 50,
      badges: ['comparison'],
    },
  ];
  return base.slice(0, Math.max(1, Math.min(count, base.length))).map((t) => ({
    ...t,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }));
}

export async function GET(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Seeding disabled in production' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const count = Number(searchParams.get('count') || '5');

    const demo = buildDemoTemplates(count);

    const { data, error } = await getDb().from('templates').upsert(demo, {
      onConflict: 'template_id',
    });
    if (error) throw error;

    return NextResponse.json({ inserted: data?.length ?? demo.length, items: demo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}


