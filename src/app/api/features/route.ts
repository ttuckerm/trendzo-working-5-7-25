import { NextResponse } from 'next/server';
import { isStarterPackEnabled, LIVE_STARTER_PACK_PATH } from '@/config/flags';

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    flags: {
      LIVE_STARTER_PACK_PATH,
      STARTER_PACK_ENABLED: isStarterPackEnabled(),
    }
  });
}



