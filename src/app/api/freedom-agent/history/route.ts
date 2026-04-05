import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  const { data: session, error } = await supabase
    .from('freedom_agent_sessions')
    .select('id, conversation_history, current_week, messages_this_session, last_message_at, freedom_os_plan, progress_state, created_at')
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Calculate messages remaining today
  const today = new Date().toISOString().split('T')[0];
  const lastMessageDay = session.last_message_at
    ? new Date(session.last_message_at).toISOString().split('T')[0]
    : null;
  const messagesToday = lastMessageDay === today ? session.messages_this_session : 0;

  return NextResponse.json({
    sessionId: session.id,
    conversationHistory: session.conversation_history || [],
    currentWeek: session.current_week,
    messagesRemaining: 5 - messagesToday,
    hasPlan: !!session.freedom_os_plan,
    progressState: session.progress_state || {},
    createdAt: session.created_at
  });
}
