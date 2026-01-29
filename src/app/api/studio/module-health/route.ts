import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: modules, error } = await supabase
      .from('module_health')
      .select('*')
      .order('module_name');

    if (error) {
      console.error('Error fetching module health:', error);
      return NextResponse.json({ error: 'Failed to fetch module health' }, { status: 500 });
    }

    // Transform data for the UI
    const healthData = {
      modules: modules || [],
      summary: {
        total: modules?.length || 0,
        healthy: modules?.filter(m => m.status === 'green').length || 0,
        warning: modules?.filter(m => m.status === 'yellow').length || 0,
        critical: modules?.filter(m => m.status === 'red').length || 0,
        totalProcessed: modules?.reduce((sum, m) => sum + (m.processed_count || 0), 0) || 0
      }
    };

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}