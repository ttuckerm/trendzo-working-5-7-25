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
    const templateId = searchParams.get('template_id');
    const frameworkId = searchParams.get('framework_id');

    if (!templateId && !frameworkId) {
      return NextResponse.json({ template: null, videos: [] });
    }

    let videoIds: string[] = [];
    let template: any = null;

    if (templateId) {
      const { data: t } = await supabase
        .from('templates')
        .select('*')
        .eq('template_id', templateId)
        .single();
      template = t || null;

      const { data: tv } = await supabase
        .from('template_videos')
        .select('video_id')
        .eq('template_id', templateId)
        .limit(100);
      videoIds = (tv || []).map((x: any) => x.video_id);
    } else if (frameworkId) {
      const { data: fs } = await supabase
        .from('framework_scores')
        .select('video_id')
        .eq('framework_id', frameworkId)
        .order('score', { ascending: false })
        .limit(100);
      videoIds = (fs || []).map((x: any) => x.video_id);
    }

    if (!videoIds.length) return NextResponse.json({ template: null, videos: [] });

    const { data: vids } = await supabase
      .from('videos')
      .select('id, platform, web_url, thumbnail_url, description, caption, duration_seconds, views, likes, comments, shares')
      .in('id', videoIds);

    const videos = (vids || []).map((v: any) => ({
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
      viral_score: null,
      success_rate: null,
      niches: [],
      template: null
    }));

    const shapedTemplate = template
      ? {
          template_id: template.template_id || template.id,
          name: template.name,
          success_rate: template.success_rate ?? null,
          avg_views: template.avg_views ?? 0,
          platform: template.platform || 'tiktok',
          hook_time_sec: template.hook_time ?? null,
          duration_range: template.min_duration_sec && template.max_duration_sec
            ? { min_sec: template.min_duration_sec, max_sec: template.max_duration_sec }
            : null,
          badges: template.badges || [],
          exampleVideos: [],
          updated_at: template.updated_at || null
        }
      : null;

    return NextResponse.json({ template: shapedTemplate, videos });
  } catch (e: any) {
    console.error('segments endpoint error', e?.message || e);
    return NextResponse.json({ template: null, videos: [] }, { status: 200 });
  }
}









