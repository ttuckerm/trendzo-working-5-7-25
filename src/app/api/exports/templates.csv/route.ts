import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('template_metric_snapshot').select('template_id,title,window,metric,metric_value,rank,tier').limit(1000)
  const rows = (data||[]).map((r:any)=>[
    r.template_id,r.title,r.window,r.metric,r.metric_value,r.rank,r.tier
  ])
  const header = ['template_id','title','window','metric','metric_value','rank','tier']
  const csv = [header, ...rows].map(cols => cols.map(v => String(v).replaceAll('"','""')).map(v=>`"${v}"`).join(',')).join('\n')
  return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv' } })
}


