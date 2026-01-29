import { NextRequest, NextResponse } from 'next/server';
import { runEvolutionEngine } from '@/lib/services/evolutionEngine';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Starting EvolutionEngine run via API...');
    
    const startTime = Date.now();
    
    // Run the evolution engine
    await runEvolutionEngine();
    
    const duration = Date.now() - startTime;
    
    // Get summary from the database (latest run)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: latestRun, error: runError } = await supabase
      .from('evolution_runs')
      .select('*')
      .order('run_ts', { ascending: false })
      .limit(1)
      .single();

    if (runError) {
      console.warn('Could not fetch latest run data:', runError.message);
    }

    // Get template status counts from template_library
    const { data: templates, error: templatesError } = await supabase
      .from('template_library')
      .select('status');

    let summary = { HOT: 0, COOLING: 0, NEW: 0, STABLE: 0 };
    if (!templatesError && templates) {
      summary = templates.reduce((acc, template) => {
        const status = template.status || 'STABLE';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, { HOT: 0, COOLING: 0, NEW: 0, STABLE: 0 });
    }

    const response = {
      success: true,
      message: 'EvolutionEngine completed successfully',
      duration,
      templatesAnalyzed: latestRun?.total_templates_analyzed || templates?.length || 0,
      summary,
      runId: latestRun?.run_id,
      timestamp: new Date().toISOString()
    };

    console.log('✅ EvolutionEngine API run completed:', response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ EvolutionEngine API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'EvolutionEngine run failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}