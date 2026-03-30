import { NextRequest, NextResponse } from 'next/server'
import v1 from '../../../../openapi/public_v1.json'
import v2 from '../../../../openapi/public_v2.json'

export async function GET(_req: NextRequest) {
  const spec = { openapi: '3.0.3', info: { title: 'Trendzo Public API', version: 'v2' }, paths: { ...((v1 as any).paths||{}), ...((v2 as any).paths||{}) } }
  return NextResponse.json(spec)
}


