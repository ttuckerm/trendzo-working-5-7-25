/**
 * GET /api/creator/list
 * Returns all creator profiles
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

export async function GET() {
  try {
    const { data: creators, error } = await supabase
      .from('creator_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      creators: creators || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
