import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  await supabase
    .from('freedom_agent_sessions')
    .update({ email_unsubscribed: true })
    .eq('email', email.toLowerCase().trim());

  return new NextResponse(
    `<!DOCTYPE html>
<html>
<body style="background:#08080d;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <h2 style="font-size:20px;margin:0 0 12px 0;">Unsubscribed</h2>
    <p style="color:#a0a0a0;font-size:14px;margin:0;">You won't receive any more check-in emails.</p>
  </div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}
