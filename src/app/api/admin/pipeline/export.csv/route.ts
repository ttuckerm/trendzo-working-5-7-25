import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const json = await fetch(new URL('/api/admin/pipeline/export?format=csv', url.origin), { headers: req.headers as any })
  const body = await json.text()
  return new NextResponse(body, { status: 200, headers: { 'content-type': 'text/csv' } })
}



