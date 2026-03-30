import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}
const supabase = new Proxy({}, { get(_t, p){ return (getDb() as any)[p as any] } }) as any;

export async function GET(_req: NextRequest) {
  try {
    // Prefer existing tables if present; otherwise return an empty array to keep UI stable
    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .order('success_rate', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('templates table not available or query failed:', error.message);
      return NextResponse.json([]);
    }

    const items = (templates || []).map((t: any) => ({
      template_id: t.template_id || t.id,
      name: t.name,
      success_rate: t.success_rate ?? null,
      avg_views: t.avg_views ?? 0,
      platform: t.platform || 'tiktok',
      hook_time_sec: t.hook_time ?? null,
      duration_range: t.min_duration_sec && t.max_duration_sec ? { min_sec: t.min_duration_sec, max_sec: t.max_duration_sec } : null,
      badges: t.badges || [],
      exampleVideos: [],
      updated_at: t.updated_at || null
    }));

    return NextResponse.json(items);
  } catch (e: any) {
    console.error('recipe-book endpoint error', e?.message || e);
    return NextResponse.json([], { status: 200 });
  }
}









