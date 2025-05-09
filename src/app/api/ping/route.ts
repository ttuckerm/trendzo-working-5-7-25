import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Disable caching

export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    route: '/api/ping',
  });
} 