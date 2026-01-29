import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const now = new Date()
  const orders = 2
  const attributed = [ { order_id: 'o1', video_id: 'v1', sku_id: 'sku_123', weight: 1.0, revenue_cents: 2999 } ]
  const proof_file = `storage/proof/commerce_attr_${now.getTime()}.json`
  return NextResponse.json({ ok: true, orders, attributed, proof_file })
}


