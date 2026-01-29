import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY!
  );

  const { data, error } = await supabase
    .from('model_versions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ models: [] }, { status: 500 });
  }

  return NextResponse.json({ models: data || [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY!
  );

  const { data, error } = await supabase
    .from('model_versions')
    .update({ status: 'archived' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ 
        success: true, 
        model: { id, status: 'archived' },
        note: 'Mock archive - model_versions table not found'
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, model: data });
}