import { NextRequest, NextResponse } from 'next/server'
import { source } from '@/lib/data'
import { computeViral } from '@/lib/vit/compute'
import { ensureFixtures } from '@/lib/data/init-fixtures'

// Add detailed logging for debugging
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    if (process.env.MOCK === '1') {
      await ensureFixtures();
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor') ?? undefined
    const limit = Number(searchParams.get('limit') ?? '20')
    const platform = searchParams.get('platform') ?? undefined
    const niche = searchParams.get('niche') ?? undefined
    const order = (searchParams.get('order') as any) ?? 'recent'

    // Add specific try/catch around the database call
    let items, nextCursor;
    try {
      ({ items, nextCursor } = await source.list({ cursor, limit, platform, niche, order }));
    } catch (dbError: any) {
      logger.error('Failed to fetch videos from data source', {
        error: dbError.message,
        stack: dbError.stack,
        query: { cursor, limit, platform, niche, order }
      });
      // Return a more specific error response
      return NextResponse.json({ error: 'Failed to retrieve videos from database.' }, { status: 503 });
    }

    if (!items) {
      // Handle cases where the source returns no items
      return NextResponse.json({ items: [], nextCursor: null });
    }

    const dto = items.map(v => {
      const { viral } = computeViral(v)
      const m48 = v.metrics.find(m => m.window === '48h')
      return {
        id: v.id,
        platform: v.platform,
        creatorId: v.creatorId,
        caption: v.caption,
        niche: v.niche,
        publishTs: v.publishTs,
        views48h: m48?.views ?? 0,
        viral,
        templateState: v.template?.state ?? null
      }
    })
    return NextResponse.json({ items: dto, nextCursor })
  } catch (e:any) {
    logger.error('An unexpected error occurred in GET /api/videos', {
      error: e.message,
      stack: e.stack,
    });
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 })
  }
}

