import { NextRequest, NextResponse } from 'next/server'

function ok(data: any) {
  return NextResponse.json({ success: true, ...data }, { status: 200 })
}

export async function GET(_req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug || []
  const action = slug[0] || 'coverage'
  if (action === 'coverage') {
    // Heatmap-style coverage for 1h/6h/24h/48h/7d
    return ok({
      windowBands: [
        { band: '1h', coverage: 0.82 },
        { band: '6h', coverage: 0.88 },
        { band: '24h', coverage: 0.94 },
        { band: '48h', coverage: 0.97 },
        { band: '7d', coverage: 0.99 }
      ],
      backlog: Math.floor(50 + Math.random() * 50)
    })
  }
  return ok({ note: 'windows endpoint ready' })
}

export async function POST(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug || []
  const action = slug[0]
  if (action === 'recompute') {
    // Simulate recompute action
    await new Promise(r => setTimeout(r, 200))
    return ok({ recomputed: true, at: new Date().toISOString() })
  }
  return ok({ received: true })
}


