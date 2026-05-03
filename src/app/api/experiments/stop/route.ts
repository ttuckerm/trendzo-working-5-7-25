import { NextRequest, NextResponse } from 'next/server'
import { setStatus } from '@/lib/experiments/store'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest){
  try{
    const body = await req.json()
    await setStatus(String(body?.experimentId||''), 'stopped')
    return NextResponse.json({ ok:true })
  }catch{ return NextResponse.json({ ok:false }) }
}


