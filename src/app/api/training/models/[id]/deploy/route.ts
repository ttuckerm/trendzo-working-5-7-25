import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY!
  );

  // First, set all currently active models to 'testing'
  await supabase
    .from('model_versions')
    .update({ status: 'testing' })
    .eq('status', 'active');

  // Then, set the selected model to active
  const { data, error } = await supabase
    .from('model_versions')
    .update({ status: 'active' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, model: data });
}
