import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { DRIFT_FEATURES, DriftFeature, DRIFT_THRESHOLDS } from '@/config/drift'
import { dispatchAlarm } from '@/lib/ops/notifier'

type ImportanceRow = {
	platform: string
	niche: string
	feature: DriftFeature
	delta_prob_mean: number
	delta_auroc: number | null
	n_samples: number
}

async function ensureTables(db: any): Promise<void> {
	const sql = `
	create table if not exists feature_importance_history (
	  id uuid primary key default gen_random_uuid(),
	  window_start timestamptz not null,
	  window_end timestamptz not null,
	  platform text not null,
	  niche text not null,
	  feature text not null,
	  delta_prob_mean numeric,
	  delta_auroc numeric,
	  n_samples int not null,
	  created_at timestamptz default now()
	);
	create index if not exists idx_feature_importance_hist on feature_importance_history (window_end, platform, niche, feature);

	create table if not exists feature_drift_alerts (
	  id uuid primary key default gen_random_uuid(),
	  detected_at timestamptz not null default now(),
	  platform text not null,
	  niche text not null,
	  feature text not null,
	  rel_change numeric not null,
	  abs_change numeric not null,
	  rank_shift int not null,
	  n_samples int not null,
	  message text,
	  delivered boolean default false
	);
	create index if not exists idx_feature_drift_alerts on feature_drift_alerts (detected_at, platform, niche, feature);
	`;
	try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

function neutralize(breakdown: any, feature: DriftFeature): any {
	const b = { ...breakdown }
	switch (feature) {
		case 'timingScore': b.timingScore = 1.0; break
		case 'personalizationFactor': b.personalizationFactor = 1.0; break
		case 'frameworkContribution': b.frameworkContribution = 0.0; break
		case 'distributionFactor': (b as any).distributionFactor = 1.0; break
		case 'simulatorFactor': (b as any).simulatorFactor = 1.0; break
		case 'telemetryAlignment': (b as any).telemetryAlignment = 1.0; break
		case 'zScoreNormalized': b.zScoreNormalized = 0.0; break
		case 'engagementScore': b.engagementScore = 0.0; break
		case 'platformWeight': b.platformWeight = 1.0; break
		case 'decayFactor': b.decayFactor = 1.0; break
		case 'transcriptFeatures': (b as any).transcriptFeatures = 0.0; break
		case 'qualityFactor': (b as any).qualityFactor = 1.0; break
		case 'safetyPenalty': (b as any).safetyPenalty = 0.0; break
		case 'calibrationImpact': /* handled in recalibration step */ break
	}
	return b
}

function recomputeCalibratedProbability(original: any, neutralizedBreakdown: any, platform: string, niche: string): number {
	// Approximate: scale original base probability by ratios of multiplicative factors and reapply calibration if available
	let base = Number(original.predicted_viral_probability || original.viralProbability || original.calibratedProbability || 0)
	const mults = ['timingScore','personalizationFactor','distributionFactor','simulatorFactor','platformWeight','decayFactor','qualityFactor']
	for (const m of mults) {
		const orig = Number((original.breakdown||{})[m] ?? 1)
		const neu = Number(neutralizedBreakdown[m] ?? 1)
		if (orig && neu && orig !== neu) {
			base = base * (neu / orig)
		}
	}
	// Additive-like
	const adds = ['frameworkContribution','zScoreNormalized','engagementScore','transcriptFeatures','safetyPenalty']
	for (const a of adds) {
		const orig = Number((original.breakdown||{})[a] ?? 0)
		const neu = Number(neutralizedBreakdown[a] ?? 0)
		base = Math.max(0, Math.min(1, base + (neu - orig) * 0.05))
	}
	return Math.max(0, Math.min(1, base))
}

function computeAUROCDelta(yTrue: number[], base: number[], neu: number[]): number | null {
	if (!yTrue.length) return null
	const paired = yTrue.map((y,i)=>({ y, b: base[i]||0, n: neu[i]||0 }))
	if (!paired.length) return null
	function auroc(scores: number[]): number {
		const sorted = paired.map((p,i)=>({ y:p.y, s: scores[i] })).sort((a,b)=> b.s - a.s)
		let tp=0, fp=0, tpPrev=0, fpPrev=0, auc=0
		const P = sorted.filter(x=>x.y===1).length
		const N = sorted.length - P
		for (const r of sorted){ if (r.y===1) tp++; else fp++; auc += (fp - fpPrev) * (tp + tpPrev) / 2; tpPrev=tp; fpPrev=fp }
		return P && N ? auc / (P * N) : null as any
	}
	const a0 = auroc(base)
	const a1 = auroc(neu)
	if (a0===null || a1===null) return null
	return Number(a1) - Number(a0)
}

export async function computeFeatureImportance(windowStart: string, windowEnd: string): Promise<{ inserted: number; alerts: number; top: ImportanceRow[] }> {
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	await ensureTables(db as any)
	// Pull predictions and labels if available
	const { data: preds } = await db
		.from('prediction_validation')
		.select('platform,niche,predicted_viral_probability,label_viral,metadata,created_at')
		.gte('created_at', windowStart)
		.lte('created_at', windowEnd)
	const rows = (preds || []).filter(r=> r && r.metadata && (r as any).metadata.breakdown)
	if (!rows.length) return { inserted: 0, alerts: 0, top: [] }
	// Group by platform|niche
	const groups = new Map<string, any[]>()
	for (const r of rows) {
		const k = `${(r as any).platform||'tiktok'}|${(r as any).niche||'general'}`
		if (!groups.has(k)) groups.set(k, [])
		groups.get(k)!.push(r)
	}
	const outRows: ImportanceRow[] = []
	for (const [key, arr] of groups.entries()) {
		const [platform, niche] = key.split('|')
		const yTrue = arr.map(r=> Number((r as any).label_viral ? 1 : 0))
		const base = arr.map(r=> Number((r as any).predicted_viral_probability || 0))
		for (const feature of DRIFT_FEATURES) {
			const deltas: number[] = []
			const neuScores: number[] = []
			for (const r of arr) {
				const bd = (r as any).metadata.breakdown || {}
				const nbd = neutralize(bd, feature)
				const neu = recomputeCalibratedProbability(r as any, nbd, platform, niche)
				neuScores.push(neu)
				deltas.push(Math.abs(neu - Number((r as any).predicted_viral_probability || 0)))
			}
			const delta_prob_mean = deltas.reduce((a,b)=>a+b,0) / Math.max(1, deltas.length)
			const delta_auroc = (yTrue.some(x=>x===1) ? computeAUROCDelta(yTrue, base, neuScores) : null)
			outRows.push({ platform, niche, feature, delta_prob_mean, delta_auroc: delta_auroc===null?null:Number(delta_auroc), n_samples: arr.length })
		}
	}
	// Insert current window
	const window_start = windowStart
	const window_end = windowEnd
	let inserted = 0
	for (const r of outRows) {
		try {
			await db.from('feature_importance_history').upsert({
				window_start, window_end,
				platform: r.platform, niche: r.niche, feature: r.feature,
				delta_prob_mean: r.delta_prob_mean, delta_auroc: r.delta_auroc, n_samples: r.n_samples
			} as any, { onConflict: 'window_end,platform,niche,feature' } as any)
			inserted++
		} catch {}
	}
	// Compare vs 30d baseline and alert
	let alerts = 0
	for (const r of outRows) {
		if (r.n_samples < DRIFT_THRESHOLDS.MIN_SUPPORT) continue
		let baseline: number | null = null
		try {
			const since30 = new Date(new Date(window_end).getTime() - 30*24*3600*1000).toISOString()
			const { data: hist } = await db
				.from('feature_importance_history')
				.select('delta_prob_mean')
				.gte('window_start', since30)
				.lte('window_end', window_end)
				.eq('platform', r.platform)
				.eq('niche', r.niche)
				.eq('feature', r.feature)
				.order('window_end', { ascending: false })
				.limit(30)
			baseline = (hist||[]).length ? ((hist||[]).reduce((a:any,b:any)=> a + Number(b.delta_prob_mean||0), 0) / Math.max(1,(hist||[]).length)) : null
		} catch {}
		if (baseline===null) continue
		const abs_change = r.delta_prob_mean - baseline
		const rel_change = baseline ? abs_change / baseline : 0
		// Rank shift compute: approximate rank in latest vs baseline by sorting features in group
		const groupLatest = outRows.filter(x=> x.platform===r.platform && x.niche===r.niche)
		const latestSorted = groupLatest.slice().sort((a,b)=> b.delta_prob_mean - a.delta_prob_mean)
		const baselineSorted = DRIFT_FEATURES.slice() // assume baseline ranks by baseline means equal
		const latestRank = latestSorted.findIndex(x=> x.feature===r.feature)
		const baselineRank = baselineSorted.findIndex(x=> x===r.feature)
		const rank_shift = baselineRank>=0 && latestRank>=0 ? Math.abs(latestRank - baselineRank) : 0
		if (Math.abs(rel_change) >= DRIFT_THRESHOLDS.REL_CHANGE || Math.abs(abs_change) >= DRIFT_THRESHOLDS.ABS_CHANGE || rank_shift >= DRIFT_THRESHOLDS.RANK_SHIFT) {
			// Dedupe: within 6h
			const sixAgo = new Date(new Date(window_end).getTime() - 6*3600*1000).toISOString()
			const { data: recent } = await db
				.from('feature_drift_alerts')
				.select('id')
				.gte('detected_at', sixAgo)
				.eq('platform', r.platform)
				.eq('niche', r.niche)
				.eq('feature', r.feature)
			if (!Array.isArray(recent) || !recent.length) {
				const pct = Math.round(rel_change*100)
				const msg = `⚠️ Feature drift: ${r.feature} importance ${pct>=0?'+':''}${pct}% (${r.platform}, ${r.niche}) — suggest review. (n=${r.n_samples})`
				let delivered = false
				try { const res = await dispatchAlarm('feature_drift', 'warn', { message: msg, cohort: `${r.platform}|${r.niche}` }); delivered = Boolean(res?.slack?.sent || res?.email?.sent) } catch {}
				try { await db.from('feature_drift_alerts').insert({ detected_at: window_end, platform: r.platform, niche: r.niche, feature: r.feature, rel_change, abs_change, rank_shift, n_samples: r.n_samples, message: msg, delivered } as any) } catch {}
				alerts++
			}
		}
	}
	return { inserted, alerts, top: outRows.sort((a,b)=> b.delta_prob_mean - a.delta_prob_mean).slice(0, 10) }
}


