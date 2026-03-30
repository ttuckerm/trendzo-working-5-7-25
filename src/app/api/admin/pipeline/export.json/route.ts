import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const res = await fetch(new URL('/api/admin/pipeline/export?format=json', url.origin), { headers: req.headers as any })
  const payload = await res.json()
  return NextResponse.json(payload)
}



