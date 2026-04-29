import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/stripe/verify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ valid: false, reason: 'missing' }, { status: 400 });
  }
  const result = await verifySession(sessionId);
  return NextResponse.json(result);
}
