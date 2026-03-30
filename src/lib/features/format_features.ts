export type CarouselFeatures = {
	slide_count: number
	est_avg_text_density: number
	cover_text_presence: boolean
	swipe_linger_proxy: number
	cta_presence: boolean
}

export type Long3mFeatures = {
	ret_30s: number|null
	ret_60s: number|null
	ret_180s: number|null
	hook_under_3s: boolean
	cut_rate_per_min: number|null
	section_ctas: number
}

export type FormatFeatures = { carousel?: CarouselFeatures; long3m?: Long3mFeatures }

export function extractCarouselFeatures(input: any, apifyItem?: any): CarouselFeatures {
	const slide_count = Number(apifyItem?.images?.length || input?.slideCount || input?.slide_count || 0)
	const caption: string = String(input?.caption || '').toLowerCase()
	const cover_text_presence = /text|title|headline/.test(caption)
	const views = Number(input?.viewCount || input?.views || 0)
	const saves = Number(input?.saves || 0)
	const comments = Number(input?.commentCount || input?.comments || 0)
	const swipe_linger_proxy = views>0 ? Math.min(1, (saves/Math.max(1,views)) * 0.7 + (comments/Math.max(1,views)) * 0.3) : 0
	const cta_presence = /save|swipe|carousel|slide|tap/.test(caption)
	const est_avg_text_density = Math.min(1, (caption.replace(/\s+/g,' ').length / Math.max(1, 200)))
	return { slide_count, est_avg_text_density, cover_text_presence, swipe_linger_proxy, cta_presence }
}

export function extractLong3mFeatures(input: any): Long3mFeatures {
	const ret_30s = input?.ret_30s ?? null
	const ret_60s = input?.ret_60s ?? null
	const ret_180s = input?.ret_180s ?? null
	const duration = Number(input?.durationSeconds || input?.duration_seconds || 0)
	const hook_under_3s = Number(input?.hookLengthSeconds || input?.hook_length_seconds || 0) < 3
	const cuts = Number(input?.cutCount || input?.cut_count || 0)
	const cut_rate_per_min = duration>0 ? (cuts / (duration/60)) : null
	const section_ctas = Number(input?.sectionCtas || input?.section_ctas || 0)
	// Fallback retention from engagement per minute
	if (ret_30s===null || ret_60s===null || ret_180s===null) {
		const likes = Number(input?.likeCount || 0)
		const comments = Number(input?.commentCount || 0)
		const shares = Number(input?.shareCount || 0)
		const perMin = duration>0 ? (likes+comments+shares) / (duration/60) : 0
		const proxy = Math.max(0, Math.min(1, perMin / 200))
		return { ret_30s: ret_30s ?? proxy, ret_60s: ret_60s ?? Math.max(0, proxy*0.8), ret_180s: ret_180s ?? Math.max(0, proxy*0.6), hook_under_3s, cut_rate_per_min, section_ctas }
	}
	return { ret_30s, ret_60s, ret_180s, hook_under_3s, cut_rate_per_min, section_ctas }
}


