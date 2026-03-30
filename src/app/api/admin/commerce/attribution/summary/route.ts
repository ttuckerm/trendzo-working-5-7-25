import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const window_h = Number(searchParams.get('window_h') || 168)
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const since = new Date(Date.now() - window_h*3600*1000).toISOString()
  const { data: rows } = await db.from('attribution_results').select('video_id,sku_id,revenue_cents,created_at').gte('created_at', since)
  const groups: Record<string, { video_id:string; sku_id:string; orders:number; revenue_cents:number; last_order_at:string|null }> = {}
  for (const r of (rows||[])){
    const k = `${(r as any).video_id}|${(r as any).sku_id}`
    if (!groups[k]) groups[k] = { video_id: (r as any).video_id, sku_id: (r as any).sku_id, orders:0, revenue_cents:0, last_order_at: null }
    groups[k].orders++
    groups[k].revenue_cents += Number((r as any).revenue_cents||0)
    const ts = (r as any).created_at
    if (!groups[k].last_order_at || ts > groups[k].last_order_at!) groups[k].last_order_at = ts
  }
  return NextResponse.json({ window_h, items: Object.values(groups).sort((a,b)=> b.revenue_cents - a.revenue_cents) })
}


