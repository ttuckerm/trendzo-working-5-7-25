import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { loadFreedomPlanById } from '@/lib/freedom-agent/load-plan-for-session';

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, planId } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check for existing session with this email
    const { data: existing } = await supabase
      .from('freedom_agent_sessions')
      .select('id, current_week, created_at')
      .eq('email', email.toLowerCase().trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      // Return existing session
      return NextResponse.json({
        sessionId: existing.id,
        currentWeek: existing.current_week,
        isReturning: true
      });
    }

    // Fetch Freedom OS plan: freedom_os_plans (Claude) or freedom_os_saved_plans (legacy email flow)
    let plan: unknown = null;
    let segment: string | null = null;
    if (planId && typeof planId === 'string') {
      const loaded = await loadFreedomPlanById(supabase, planId);
      if (loaded) {
        plan = loaded.freedom_os_plan;
        segment = loaded.segment;
      }
    }

    // Create new session
    const { data: newSession, error } = await supabase
      .from('freedom_agent_sessions')
      .insert({
        email: email.toLowerCase().trim(),
        freedom_os_plan: plan,
        segment: segment,
        conversation_history: [],
        current_week: 1,
        progress_state: {},
        messages_this_session: 0
      })
      .select('id, current_week')
      .single();

    if (error) {
      console.error('Session creation error:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: newSession.id,
      currentWeek: newSession.current_week,
      isReturning: false
    });

  } catch (err) {
    console.error('Session creation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
