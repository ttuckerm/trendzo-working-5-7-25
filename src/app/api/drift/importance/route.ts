import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = getDb()
    const { data } = await supabase.from('feature_importance_daily').select('feature, importance, delta_7d').order('created_at', { ascending: false }).limit(100);
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json([], { status: 200 });
  }
}


