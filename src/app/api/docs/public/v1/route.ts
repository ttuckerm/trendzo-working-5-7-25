import { NextRequest, NextResponse } from 'next/server'

const openapi = {
  openapi: '3.0.3',
  info: { title: 'ViralLab Public API', version: 'v1' },
  paths: {
    '/public/score': {
      post: {
        summary: 'Score predicted virality',
        headers: { 'x-api-key': { schema: { type: 'string' } } },
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'OK' }, '429': { description: 'Rate limited' } }
      }
    }
  }
}

export async function GET(_req: NextRequest) {
  return NextResponse.json(openapi)
}


