import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(req: NextRequest) {
  try {
    // Read niches from data/niches.json
    const nichesPath = join(process.cwd(), 'data', 'niches.json');
    const nichesData = readFileSync(nichesPath, 'utf-8');
    const niches = JSON.parse(nichesData);

    return NextResponse.json({
      success: true,
      niches: niches
    });

  } catch (error: any) {
    console.error('Error fetching available niches:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
