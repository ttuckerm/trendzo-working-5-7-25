import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({})) as any
  const template_id = String(body?.template_id || '')
  if (!template_id) return NextResponse.json({ error: 'missing_template_id' }, { status: 400 })
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('template_definitions').select('framework_id,genes,format').eq('template_id', template_id).limit(1)
  const row = (data||[])[0]
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const payload = {
    N: 5,
    platform: body?.platform || 'tiktok',
    niche: body?.niche || 'general',
    tokens: Object.keys((row as any).genes || {}),
    video_features: { hookStrength: 0.6, durationSeconds: (row as any).format === '3min' ? 180 : 22 },
    frameworkProfile: { overallScore: 0.6 }
  }
  return NextResponse.json({ payload })
}


