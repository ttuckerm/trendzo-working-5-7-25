import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  const token = process.env.APIFY_API_TOKEN || process.env.TIKTOK_SCRAPER_TASK_ID || process.env.TIKTOK_SCRAPER_ACTOR_ID;
  const configured = Boolean(token);
  return NextResponse.json({ configured });
}


