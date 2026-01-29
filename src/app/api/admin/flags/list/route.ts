import { NextRequest, NextResponse } from 'next/server'
import { listFlags } from '@/lib/flags'

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || null
  const { rows } = await listFlags(tenantId)
  return NextResponse.json({ flags: rows })
}







