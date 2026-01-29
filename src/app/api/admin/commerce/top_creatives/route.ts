import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const limit = Math.min(100, Number(searchParams.get('limit') || 20))
  const since = searchParams.get('since') || new Date(Date.now() - 7*24*3600*1000).toISOString()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('attribution_results').select('video_id,sku_id,revenue_cents,created_at').gte('created_at', since)
  const agg: Record<string,{ video_id:string; sku_id:string; revenue_cents:number; orders:number; last_order_at:string|null }> = {}
  for (const r of (data||[])){
    const k = `${(r as any).video_id}|${(r as any).sku_id}`
    if (!agg[k]) agg[k] = { video_id: (r as any).video_id, sku_id: (r as any).sku_id, revenue_cents:0, orders:0, last_order_at:null }
    agg[k].revenue_cents += Number((r as any).revenue_cents||0)
    agg[k].orders++
    const ts = (r as any).created_at
    if (!agg[k].last_order_at || ts > agg[k].last_order_at!) agg[k].last_order_at = ts
  }
  const items = Object.values(agg).sort((a,b)=> b.revenue_cents - a.revenue_cents).slice(0, limit)
  return NextResponse.json({ since, items })
}


