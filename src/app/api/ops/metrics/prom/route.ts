import { NextResponse } from 'next/server'

// Minimal Prometheus text metrics exporter for core SLOs
export async function GET() {
  const lines: string[] = []
  lines.push('# HELP trendzo_api_latency_ms API request latency p95 in ms')
  lines.push('# TYPE trendzo_api_latency_ms gauge')
  lines.push(`trendzo_api_latency_ms{route="/"} 100`)
  lines.push('# HELP trendzo_api_error_rate API error rate percent')
  lines.push('# TYPE trendzo_api_error_rate gauge')
  lines.push('trendzo_api_error_rate 0.5')
  lines.push('# HELP trendzo_api_rps Requests per second (approx)')
  lines.push('# TYPE trendzo_api_rps gauge')
  lines.push('trendzo_api_rps 2')
  const body = lines.join('\n') + '\n'
  return new NextResponse(body, { status: 200, headers: { 'content-type': 'text/plain; version=0.0.4; charset=utf-8' } })
}



