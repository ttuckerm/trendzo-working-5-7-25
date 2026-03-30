import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
	try {
		const filePath = path.join(process.cwd(), 'config', 'objectives.matrix.json');
		const contents = await fs.readFile(filePath, 'utf8');
		const json = JSON.parse(contents);
		return NextResponse.json(json);
	} catch (err: any) {
		return NextResponse.json({ error: 'Objectives matrix not found' }, { status: 404 });
	}
}


