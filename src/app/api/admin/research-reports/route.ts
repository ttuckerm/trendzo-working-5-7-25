import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const reportsDir = path.join(process.cwd(), 'research-reports');

    // Check if directory exists
    if (!fs.existsSync(reportsDir)) {
      return NextResponse.json({ reports: [] });
    }

    // Read all JSON files in the directory
    const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json') && f !== 'master-summary.json');

    const reports = files.map(file => {
      const filePath = path.join(reportsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error loading research reports:', error);
    return NextResponse.json({ error: 'Failed to load reports', reports: [] }, { status: 500 });
  }
}
