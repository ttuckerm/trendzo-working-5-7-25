import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'validation-online', metrics: '/api/validation/metrics' });
}



