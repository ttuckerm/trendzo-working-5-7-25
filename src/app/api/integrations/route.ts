import { NextResponse } from 'next/server';

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET() {
  const available = {
    apify: !!process.env.APIFY_API_TOKEN,
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY,
    openai: !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY
  };
  return NextResponse.json({ status: 'ok', available });
}



