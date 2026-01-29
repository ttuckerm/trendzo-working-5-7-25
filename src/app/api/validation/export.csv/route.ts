import { NextResponse } from 'next/server'
import { readAllValidations } from '@/lib/validation/store'

export async function GET() {
  const rows = readAllValidations()
  const header = 'predictionId,videoId,platform,madeAtISO,maturedAtISO,probability,actualViral,predictedViral\n'
  const body = rows.map(r=>[
    r.predictionId,
    r.videoId||'',
    r.platform,
    r.madeAtISO,
    r.maturedAtISO,
    r.probability.toFixed(4),
    r.actualViral?1:0,
    r.predictedViral?1:0
  ].join(',')).join('\n')
  return new NextResponse(header+body, { headers: { 'content-type': 'text/csv' } })
}


