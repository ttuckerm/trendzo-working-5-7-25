import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

function evaluateCarousel(video_id: string){
  const frames = 5 + (video_id.length % 5);
  const features = {
    frames,
    frame_decay: 0.12,
    hook_strength: 0.78,
    diversity: 0.64
  };
  const score = Math.max(0, Math.min(1, 0.5 + 0.1 * (features.hook_strength - features.frame_decay) + 0.05 * features.diversity));
  return { score, features };
}

function evaluateLongform(video_id: string){
  const features = {
    minute1_velocity: 0.72,
    mid_drop: 0.18,
    outro_retention: 0.61
  };
  const score = Math.max(0, Math.min(1, 0.4 + 0.3*features.minute1_velocity - 0.2*features.mid_drop + 0.2*features.outro_retention));
  return { score, features };
}

export async function POST(req: NextRequest){
  try {
    const supabase = getDb()
    const body = await req.json();
    const { video_id, type } = body || {};
    if (!video_id || !type) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    const result = type === 'carousel' ? evaluateCarousel(video_id) : evaluateLongform(video_id);
    await supabase.from('scoring_branch_run').insert({ video_id, type, score: result.score, features: result.features });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: 'evaluate_failed' }, { status: 500 });
  }
}


