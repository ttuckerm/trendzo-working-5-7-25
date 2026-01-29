import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('job_id')
  const enc = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function send(ev: any) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`))
      }
      controller.enqueue(enc.encode('event: open\n' + 'data: ok\n\n'))
      // Poll DB for job state
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const interval = setInterval(async () => {
        try {
          if (!jobId) return
          const { data } = await db.from('job_runs').select('status,progress_pct,meta,finished_at').eq('id', jobId).limit(1)
          if (Array.isArray(data) && data.length) {
            const row = (data as any)[0]
            send({ type: 'progress', status: row.status, progress_pct: row.progress_pct, finished_at: row.finished_at, meta: row.meta })
            if (row.status === 'success' || row.status === 'error' || row.status === 'canceled') {
              clearInterval(interval)
              controller.close()
            }
          }
        } catch {}
      }, 1000)
    }
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
}


