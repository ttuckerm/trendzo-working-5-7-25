import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { type, beat_timeline } = await req.json()
  if (type === 'srt') {
    const blocks = (Array.isArray(beat_timeline)? beat_timeline: []).map((b: any, i: number) => `${i+1}\n00:00:${String(i*3).padStart(2,'0')},000 --> 00:00:${String(i*3+3).padStart(2,'0')},000\n${b.text}\n`)
    const srt = blocks.join('\n')
    return new NextResponse(srt, { headers: { 'content-type': 'application/x-subrip' } })
  }
  if (type === 'shotlist') {
    const lines = (Array.isArray(beat_timeline)? beat_timeline: []).map((b: any) => `- ${b.element}: ${b.text}`).join('\n')
    return new NextResponse(lines, { headers: { 'content-type': 'text/plain' } })
  }
  if (type === 'teleprompter') {
    const text = (Array.isArray(beat_timeline)? beat_timeline: []).map((b: any) => b.text).join('\n\n')
    return new NextResponse(text, { headers: { 'content-type': 'text/plain' } })
  }
  return NextResponse.json({ error: 'unsupported_type' }, { status: 400 })
}


