import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: false,
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    }
  };

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('profiles').select('count').limit(1);
    checks.supabase = !error;
  } catch {
    checks.supabase = false;
  }

  const allGood = checks.supabase && Object.values(checks.env).every(Boolean);
  return NextResponse.json(checks, { status: allGood ? 200 : 503 });
}
