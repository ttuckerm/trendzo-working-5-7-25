import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(_req: NextRequest) {
	try {
		const supabase = getDb()
		const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
		const { data: videos } = await supabase
			.from('videos')
			.select('viral_score, created_at')
			.gte('created_at', since)
			.limit(5000);

		const countHot = (videos || []).filter(v => v.viral_score >= 80).length;
		const countCold = (videos || []).filter(v => v.viral_score < 50).length;
		const countRising = (videos || []).filter(v => v.viral_score >= 50 && v.viral_score < 80).length;

		return NextResponse.json({
			new_templates_24h: (videos || []).length,
			tiers: { hot: { count: countHot }, cold: { count: countCold }, rising: { count: countRising } }
		});
	} catch (err: any) {
		return NextResponse.json({ error: 'recipes_summary_failed' }, { status: 500 });
	}
}


