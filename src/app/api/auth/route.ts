import { NextResponse } from 'next/server';

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ status: 'auth-endpoints-available', signIn: '/api/auth/signin' });
}



