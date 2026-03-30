import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('release_channel').select('channel,version_id')
  const canary = data?.find(r => (r as any).channel === 'canary')?.version_id || null
  const stable = data?.find(r => (r as any).channel === 'stable')?.version_id || null
  return NextResponse.json({ canary, stable })
}


