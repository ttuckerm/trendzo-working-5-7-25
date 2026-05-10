import { NextResponse } from 'next/server'
import { getFlags } from '@/lib/moat/flags'
export const dynamic = 'force-dynamic';

export async function GET() {
	try { return NextResponse.json(getFlags()) } catch { return NextResponse.json({ publicApi: true, insights: true }) }
}


