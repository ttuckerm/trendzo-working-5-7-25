import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const KEY = process.env.SUPABASE_SERVICE_KEY as string

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()
    if (!['start','stop','retry','cancel'].includes(action)) return NextResponse.json({ error: 'invalid action' }, { status: 400 })
    const db = createClient(URL, KEY)
    await db.from('pipeline_control').upsert({ id: 1, is_running: action === 'start', desired_action: action })
    return NextResponse.json({ ok: true })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}


