import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { getCalibrationVersion } from '@/lib/calibration/calibration'

export async function GET(_req: NextRequest) {
  const enc = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      async function tick() {
        try {
          const since30 = new Date(Date.now()-30*24*3600*1000).toISOString()
          const { data } = await db
            .from('accuracy_metrics')
            .select('n,auroc,precision_at_100,ece,computed_at,heated_excluded_count')
            .gte('computed_at', since30)
            .order('computed_at', { ascending: false })
            .limit(1)
          const ver = await getCalibrationVersion()
          const row = Array.isArray(data)&&data.length?data[0]:null
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ cohort_version: ver, last_30d: row, ts: new Date().toISOString() })}\n\n`))
        } catch {}
      }
      const iv = setInterval(tick, 10000)
      await tick()
      // no close handler: client closes
    }
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
}


