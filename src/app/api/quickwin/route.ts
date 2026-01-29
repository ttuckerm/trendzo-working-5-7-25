import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tpl = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/templates?range=30d`, { cache: 'no-store' }).then(r=> r.ok? r.json(): []);
    const analysisOnline = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/analyze`, { method:'GET' }).then(r=> r.ok).catch(()=>false);
    return NextResponse.json({ templates: Array.isArray(tpl)? tpl.slice(0,12): [], analyzer: analysisOnline });
  } catch (e: any) {
    return NextResponse.json({ templates: [], analyzer: false, error: String(e?.message||e) }, { status: 200 });
  }
}



