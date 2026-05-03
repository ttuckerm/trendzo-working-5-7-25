import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const KEY = process.env.SUPABASE_SERVICE_KEY as string

export async function GET() {
  try {
    const db = createClient(URL, KEY)
    const { data: runs } = await db.from('pipeline_runs').select('*').order('started_at', { ascending: false }).limit(10)
    const { data: counts } = await db.from('videos').select('id', { count: 'exact', head: true })
    return NextResponse.json({ runs: runs||[], totals: { videos: counts?.length || 0 } })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}


