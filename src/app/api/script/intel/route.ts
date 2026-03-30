import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { text = '' } = await req.json().catch(()=>({}))
  const words = String(text).split(/\s+/).filter(Boolean)
  const beats = [
    { id: 'hook', start: 0, end: 3.2 },
    { id: 'promise', start: 3.2, end: 7.8 },
    { id: 'value', start: 7.8, end: 18.5 },
    { id: 'cta', start: 18.5, end: 22.0 }
  ]
  return NextResponse.json({
    success: true,
    script: {
      probScript: 0.74,
      matchedPatterns: [
        { id: 'HOOK_QUESTION', score: 0.92 },
        { id: 'CTA_FOLLOW', score: 0.81 }
      ],
      breakdown: { hook: 0.91, clarity: 0.82, pacing: 0.77, authority: 0.69 }
    },
    beats,
    hooks: [{ text: 'Stop scrolling—try this now.', tone: 'authority' }],
    ctas: [{ text: 'Follow for proven playbooks.', position: 0.8 }]
  })
}

export async function GET() {
  return NextResponse.json({ success: true, status: 'ready' })
}


