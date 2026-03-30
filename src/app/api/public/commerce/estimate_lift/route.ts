import { NextRequest, NextResponse } from 'next/server'
import { corsHeaders } from '@/lib/commerce/utils'
import { enforceTelemetryQuota } from '@/lib/security/telemetry-keys'
import { estimateLift } from '@/lib/commerce/lift'

export async function OPTIONS() { return new NextResponse(null, { headers: corsHeaders() }) }

export async function POST(req: NextRequest) {
  const quota = await enforceTelemetryQuota(req, '/public/commerce/estimate_lift', 'commerce/public')
  if (!quota.allowed) return new NextResponse(null, { status: quota.status, headers: corsHeaders() })
  const body = await req.json().catch(()=>({})) as any
  const out = await estimateLift(body)
  return NextResponse.json(out, { headers: corsHeaders() })
}


