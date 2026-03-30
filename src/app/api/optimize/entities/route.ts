import { NextResponse } from 'next/server'

export async function GET() {
	const entities = [
		{ type: 'sound', name: 'Upbeat Synth 128bpm', velocity: 0.82 },
		{ type: 'hashtag', name: '#sidehustle', velocity: 0.74 },
		{ type: 'hashtag', name: '#ai', velocity: 0.91 }
	]
	return NextResponse.json({ entities })
}

