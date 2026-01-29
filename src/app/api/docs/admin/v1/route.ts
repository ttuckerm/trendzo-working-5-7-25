import { NextRequest, NextResponse } from 'next/server'

const openapi = {
  openapi: '3.0.3',
  info: { title: 'ViralLab Admin API', version: 'v1' },
  paths: {
    '/api/admin/validation/summary': { get: { summary: 'Validation summary', responses: { '200': { description: 'OK' } } } },
    '/api/admin/baselines/summary': { get: { summary: 'Baselines summary', responses: { '200': { description: 'OK' } } } },
    '/api/admin/api-keys': { get: { summary: 'List API keys' }, post: { summary: 'Create API key' } }
  }
}

export async function GET(_req: NextRequest) {
  return NextResponse.json(openapi)
}


