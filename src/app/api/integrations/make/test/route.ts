import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(()=>({}))
  const signature = Buffer.from(JSON.stringify(payload)).toString('base64')
  return new NextResponse(JSON.stringify({ delivered: true, app: 'make', echo: payload }), { status: 200, headers: { 'content-type': 'application/json', 'X-TZ-Signature': signature } })
}


