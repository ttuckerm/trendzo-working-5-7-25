import { NextRequest, NextResponse } from 'next/server';
import { scrapeTikTokBatch } from '@/lib/services/apifyScraper';

function envNumber(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.SCRAPING_LOCKDOWN === 'true') {
      return NextResponse.json({ ok: false, error: 'LOCKED: SCRAPING_LOCKDOWN is enabled' }, { status: 423 });
    }
    // Safe-scrape is allowed even when global scraping is off, because it is capped
    // We still require a green self-test below.

    // Quick self-test: call our own endpoint
    try {
      const origin = req.nextUrl.origin;
      const res = await fetch(new URL('/api/admin/self-test', origin), { cache: 'no-store' });
      const json = await res.json();
      if (!json?.ok) {
        return NextResponse.json({ ok: false, error: 'SELF_TEST_FAILED', details: json?.checks }, { status: 412 });
      }
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: 'SELF_TEST_UNREACHABLE', details: e?.message }, { status: 412 });
    }

    const body = await req.json().catch(() => ({} as any));
    const keywords: string[] = Array.isArray(body?.keywords) && body.keywords.length
      ? body.keywords
      : ['viral', 'fyp', 'trend'];

    // Caps from env with safe defaults
    const budgetUsd = envNumber('APIFY_BUDGET_USD', 1.0);
    const maxItems = envNumber('APIFY_MAX_ITEMS', 25);
    const maxRunMin = envNumber('APIFY_MAX_RUN_TIME_MIN', 5);

    // Enforce small batch
    const limited = keywords.slice(0, 1); // single capped seed

    // Pass caps down (actor honors maxVideos; budget/time should be set in the Task config on Apify; here we limit volume client-side)
    const run = await scrapeTikTokBatch(limited, { maxVideos: Math.min(5, maxItems), resultsPerPage: Math.min(5, maxItems) });

    return NextResponse.json({ ok: true, limited, caps: { budgetUsd, maxItems, maxRunMin }, run });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'UNKNOWN' }, { status: 500 });
  }
}


