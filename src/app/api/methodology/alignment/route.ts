import { NextRequest, NextResponse } from 'next/server';
import { generateAlignmentReport, loadCachedReport, isCacheFresh } from '@/lib/methodology/alignment';
import { checkAdminAuth } from '@/lib/auth/admin-auth-options';

export async function GET(req: NextRequest) {
  // Admin guard
  const auth = await checkAdminAuth(req);
  if (!auth?.success) {
    return new NextResponse(JSON.stringify({ error: auth?.error || 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';
  const maxAgeMin = Number(searchParams.get('maxAgeMin') || '15');

  let report = null;
  if (!force && isCacheFresh(maxAgeMin * 60 * 1000)) {
    report = loadCachedReport();
  }
  if (!report) {
    report = generateAlignmentReport(process.cwd());
  }
  return new Response(JSON.stringify(report, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}


