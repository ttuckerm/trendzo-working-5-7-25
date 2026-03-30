import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ChatMessage[]>> {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    let query = supabase
      .from('brain_chat')
      .select('id, role, text, created_at')
      .order('created_at', { ascending: true });

    if (since) {
      query = query.gte('created_at', since);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json([], { status: 500 });
    }

    const messages: ChatMessage[] = (data || []).map(row => ({
      id: row.id,
      role: row.role as 'user' | 'assistant',
      text: row.text,
      timestamp: row.created_at,
    }));

    return NextResponse.json(messages);
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}