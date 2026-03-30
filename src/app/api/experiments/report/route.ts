import { NextRequest, NextResponse } from 'next/server'
import { appendReport } from '@/lib/experiments/store'

export async function POST(req: NextRequest){
  try{
    const body = await req.json()
    const experimentId = String(body?.experimentId||'')
    const variantId = String(body?.variantId||'')
    await appendReport(experimentId, { experimentId, variantId, impressions: body?.impressions, clicks: body?.clicks, views48h: body?.views48h, viral: !!body?.viral })
    return NextResponse.json({ ok:true })
  }catch{
    return NextResponse.json({ ok:false })
  }
}


