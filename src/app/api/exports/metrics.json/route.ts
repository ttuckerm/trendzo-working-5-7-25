import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const window = req.nextUrl.searchParams.get('window') || '7d'
  const since = new Date(Date.now() - (/^\d+d$/.test(window) ? Number(window.replace('d','')) : 7) * 24 * 3600 * 1000).toISOString()
  const { data: val } = await db.from('prediction_validation').select('id,created_at,accuracy_percentage').gte('created_at', since).limit(1000)
  const { data: lift } = await db.from('treatment_effects').select('metric,effect,computed_at').gte('computed_at', since).limit(1000)
  return NextResponse.json({ window, validation: val||[], effects: lift||[] })
}


