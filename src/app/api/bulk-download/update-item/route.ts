import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, followerCount } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'itemId required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (followerCount !== undefined) {
      updates.follower_count = followerCount === '' || followerCount === null ? null : parseInt(followerCount, 10);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: 'Nothing to update' });
    }

    const { error } = await supabase
      .from('bulk_download_items')
      .update(updates)
      .eq('id', itemId);

    if (error) {
      console.error('[Update Item] Failed:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
