import { NextRequest, NextResponse } from 'next/server'
import { buildICS } from '@/lib/services/schedule-service'

export async function POST(req: NextRequest) {
  const { plan } = await req.json()
  const ics = buildICS(Array.isArray(plan)? plan: [])
  return new NextResponse(ics, { headers: { 'content-type': 'text/calendar' } })
}


