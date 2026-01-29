import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
	return NextResponse.json({
		lang: 'es',
		country: 'MX',
		tokens: ['AUTORIDAD@<3s>','CORTES>=3/5s'],
		pivot: ['AUTHORITY@<3s>','CUTS>=3/5s'],
		locale_factor: 1.03,
		old_score: 71,
		new_score: 73
	})
}












