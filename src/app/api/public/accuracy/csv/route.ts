import { NextRequest, NextResponse } from 'next/server'
import { readAllValidations } from '@/lib/validation/store'

export async function GET(_req: NextRequest) {
  try {
    // Always return CSV content directly; safe in MOCK and live
    const rows = readAllValidations()
    const header = 'predictionId,videoId,platform,madeAtISO,maturedAtISO,probability,actualViral,predictedViral\n'
    const body = rows.map(r=>[
      r.predictionId,
      r.videoId||'',
      r.platform,
      r.madeAtISO,
      r.maturedAtISO,
      (r.probability??0).toFixed(4),
      r.actualViral?1:0,
      r.predictedViral?1:0
    ].join(',')).join('\n')
    return new NextResponse(header+body, { headers: { 'content-type': 'text/csv', 'access-control-allow-origin': '*' } })
  } catch {
    return new NextResponse('predictionId,videoId,platform,madeAtISO,maturedAtISO,probability,actualViral,predictedViral\n', { headers: { 'content-type': 'text/csv', 'access-control-allow-origin': '*' } })
  }
}
