import { NextRequest, NextResponse } from 'next/server'

const HOOK_TEMPLATES = [
  'The 3-second fix that 3x’d our views',
  'Stop scrolling: try this counter-intuitive trick',
  'I tested 5 hooks—here’s the winner',
  'Everyone misses this in the first 3 seconds',
  'This one change made the algorithm notice'
]

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({})) as any
  const base = Number(body?.base_score || 70)
  const variants = Array.from({ length: 5 }, (_, i) => {
    const id = `v${i+1}`
    const text = HOOK_TEMPLATES[i % HOOK_TEMPLATES.length]
    const predicted_delta_score = Math.max(1, 5 - i) // descending uplift 5..1
    return { id, hook: text, predicted_delta_score }
  })
  return NextResponse.json({ variants })
}


