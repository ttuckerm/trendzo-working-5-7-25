import { NextRequest, NextResponse } from 'next/server'

function ok(data: any) { return NextResponse.json({ success: true, ...data }) }

export async function GET(_req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug || []
  const action = slug[0] || 'norm-24h'
  if (action === 'norm-24h') {
    return ok({ distribution: Array.from({ length: 20 }, (_, i) => ({ bin: i, pct: Math.random() })) })
  }
  return ok({ note: 'labels endpoint ready' })
}

export async function POST(_req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const action = (params.slug || [])[0]
  if (action === 'rebuild-baselines') {
    await new Promise(r => setTimeout(r, 300))
    return ok({ rebuilt: true, at: new Date().toISOString() })
  }
  return ok({ received: true })
}


