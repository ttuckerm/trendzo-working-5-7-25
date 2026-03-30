import { NextRequest, NextResponse } from 'next/server'
import { callJudge } from '@/lib/llm/judge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const isMock = (process.env.LLM_PROVIDER ?? 'mock') === 'mock';
    const safeMessages = isMock
      ? [{ role: 'user', content: 'return ok json 123' }]
      : body.messages;

    const data = await callJudge({ messages: safeMessages, maxTokens: body?.maxTokens ?? 128 })
    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    const code = e?.code || 'UNKNOWN'
    const message = e?.message || 'Error'
    return NextResponse.json({ code, message }, { status: 400 })
  }
}


