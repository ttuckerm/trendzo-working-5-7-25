import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/admin-auth-options';

export async function GET(req: NextRequest) {
  const auth = await checkAdminAuth(req);
  if (!auth?.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ status: 'admin-online' });
}



