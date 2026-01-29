import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export type ContentFormat = 'short_video' | 'carousel' | 'long_video_3m'

export function detectFormat(input: any, apifyItem?: any, dbRow?: any): ContentFormat {
	// long video (hard rule)
	const duration = Number((input?.durationSeconds ?? input?.duration_seconds ?? dbRow?.duration_seconds) || 0)
	if (duration >= 150) return 'long_video_3m'

	// carousel signals
	const ap = apifyItem || {}
	const isCarouselApify = Boolean(ap.imagePost || ap.images?.length >= 2 || ap.shouldDownloadSlideshowImages)
	const isCarouselDB = Boolean(dbRow?.is_slideshow || Number(dbRow?.frame_count || 0) >= 2)
	const caption: string = String(input?.caption || dbRow?.caption || '').toLowerCase()
	const hashTags: string = (Array.isArray(input?.hashtags) ? (input.hashtags as string[]).join(' ') : String(input?.hashtags || '')).toLowerCase()
	const carWords = ['photo mode','carousel','slideshow']
	const carTags = ['#photomode','#carousel','#slideshow']
	const textHit = carWords.some(w => caption.includes(w)) || carTags.some(t => hashTags.includes(t))
	if (isCarouselApify || isCarouselDB || textHit) return 'carousel'

	return 'short_video'
}

export async function ensureFormatColumns(): Promise<void> {
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	const sql = `
	alter table if exists viral_predictions add column if not exists format text;
	alter table if exists prediction_validation add column if not exists format text;
	alter table if exists videos add column if not exists format text;
	-- factors snapshot
	alter table if exists prediction_validation add column if not exists prediction_factors jsonb;
	-- indexes
	create index if not exists idx_validation_created_format on prediction_validation (created_at, format);
	create index if not exists idx_predictions_created_format on viral_predictions (created_at, format);
	`;
	try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}


