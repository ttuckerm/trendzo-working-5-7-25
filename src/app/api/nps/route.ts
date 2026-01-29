import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getDb()
    const body = await req.json()
    const score = Number(body.score)
    if (Number.isNaN(score) || score < 0 || score > 10) return NextResponse.json({ error: 'bad_score' }, { status: 400 })
    const { error } = await supabase
      .from('nps_response')
      .insert({ score, comment: body.comment || null, user_id: body.user_id || null } as any)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  }
}



