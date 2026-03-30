import { NextResponse } from 'next/server';
import { isStarterPackEnabled, LIVE_STARTER_PACK_PATH } from '@/config/flags';

export async function GET() {
  return NextResponse.json({
    flags: {
      LIVE_STARTER_PACK_PATH,
      STARTER_PACK_ENABLED: isStarterPackEnabled(),
    }
  });
}



