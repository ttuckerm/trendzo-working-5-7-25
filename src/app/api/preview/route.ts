import { NextRequest, NextResponse } from 'next/server'

interface PreviewBody {
  templateId: string
  input?: any
  reason?: string
}

export async function POST(req: NextRequest) {
  try {
    const { templateId } = (await req.json()) as PreviewBody
    if (!templateId) return NextResponse.json({ error: 'missing templateId' }, { status: 400 })

    if (templateId === 'relume-landing') {
      const apiKey = process.env.FIRECRAWL_API_KEY || process.env.NEXT_PUBLIC_FIRECRAWL_API_KEY
      if (!apiKey) return NextResponse.json({ error: 'FIRECRAWL_API_KEY missing' }, { status: 500 })

      const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ url: 'https://www.relume.io/', formats: ['html'] }),
        cache: 'no-store',
      })

      if (!resp.ok) {
        const txt = await resp.text()
        return NextResponse.json({ error: `firecrawl_failed_${resp.status}`, meta: txt }, { status: 502 })
      }
      const data = await resp.json()
      const html = (data?.html || data?.data?.[0]?.html || data?.data?.html || '') as string
      return NextResponse.json({ html: sanitize(html), meta: { source: 'relume.io' } })
    }

    return NextResponse.json({ html: `<div style="padding:16px;color:#ddd">Unknown templateId: ${templateId}</div>`, meta: {} })
  } catch (e: any) {
    return NextResponse.json({ error: 'preview_exception', message: String(e?.message || e) }, { status: 500 })
  }
}

function sanitize(raw: string): string {
  try {
    return String(raw).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
  } catch {
    return ''
  }
}


