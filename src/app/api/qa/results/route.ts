import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(req: NextRequest) {
	try {
		const supabase = getDb()
		const { searchParams } = new URL(req.url);
		const objectiveId = searchParams.get('objective_id');
		let query = supabase.from('objective_results').select('*').order('created_at', { ascending: false }).limit(50);
		if (objectiveId) query = query.eq('objective_id', objectiveId).limit(1);
		const { data, error } = await query;
		if (error) throw error;
		return NextResponse.json({ results: data || [] });
	} catch (err: any) {
		return NextResponse.json({ error: 'qa_results_fetch_failed' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const supabase = getDb()
		const body = await req.json();
		const { objective_id, status, summary } = body || {};
		if (!objective_id || !status || !summary) {
			return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
		}
		const { data, error } = await supabase.from('objective_results').insert({
			objective_id,
			status,
			summary_json: summary,
			created_at: new Date().toISOString()
		}).select('*').single();
		if (error) throw error;
		return NextResponse.json({ result: data });
	} catch (err: any) {
		return NextResponse.json({ error: 'qa_results_insert_failed' }, { status: 500 });
	}
}


