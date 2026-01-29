import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}
const supabase = new Proxy({}, { get(_t, p){ return (getDb() as any)[p as any] } }) as any;

export async function POST() {
  try {
    console.log('🔬 Template Discovery Engine: Starting analysis...');
    
    // Simulate template discovery process
    const discoveryStartTime = Date.now();
    
    // Step 1: Analyze recent viral patterns
    const { data: recentPatterns } = await supabase
      .from('viral_dna_sequences')
      .select('*')
      .gte('confidence_score', 0.8)
      .order('created_at', { ascending: false })
      .limit(50);

    // Step 2: Extract template patterns
    const discoveredTemplates = await analyzeViralPatterns(recentPatterns || []);
    
    // Step 3: Save new templates to database
    const savedTemplates = await saveTemplatestoDatabase(discoveredTemplates);
    
    // Step 4: Update template generators table
    await updateTemplateGenerators(savedTemplates);
    
    const discoveryTime = Date.now() - discoveryStartTime;
    
    const response = {
      success: true,
      templatesDiscovered: savedTemplates.length,
      processingTime: `${discoveryTime}ms`,
      newTemplates: savedTemplates,
      patternsAnalyzed: recentPatterns?.length || 0,
      confidence: calculateAverageConfidence(savedTemplates),
      timestamp: new Date().toISOString()
    };

    // Log the discovery to system health
    await supabase
      .from('system_health_logs')
      .insert({
        module_name: 'Template_Discovery_Engine',
        status: 'active',
        metrics: {
          templates_generated: savedTemplates.length,
          processing_time_ms: discoveryTime,
          patterns_analyzed: recentPatterns?.length || 0,
          accuracy: calculateAverageConfidence(savedTemplates)
        }
      });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Template Discovery Engine error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Template discovery failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallbackTemplates: generateFallbackTemplates()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Return current template discovery status
    const { data: templates } = await supabase
      .from('template_generators')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: recentRuns } = await supabase
      .from('system_health_logs')
      .select('*')
      .eq('module_name', 'Template_Discovery_Engine')
      .order('timestamp', { ascending: false })
      .limit(5);

    return NextResponse.json({
      currentTemplates: templates || [],
      recentRuns: recentRuns || [],
      totalTemplates: templates?.length || 0,
      lastRun: recentRuns?.[0]?.timestamp || null
    });

  } catch (error) {
    console.error('Error fetching template discovery status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}

// Helper functions
async function analyzeViralPatterns(patterns: any[]): Promise<any[]> {
  const discoveredTemplates = [];
  
  for (const pattern of patterns) {
    const viralIndicators = pattern.viral_indicators || {};
    const patternScores = pattern.pattern_scores || {};
    
    // Extract template if confidence is high enough
    if (pattern.confidence_score > 0.85) {
      const template = {
        name: generateTemplateName(viralIndicators),
        sourceVideoId: pattern.video_id,
        patternData: {
          hook: viralIndicators.hook_strength || 0,
          engagement: viralIndicators.engagement_pattern || 0,
          timing: viralIndicators.timing_optimization || 0,
          structure: patternScores.structural_elements || {}
        },
        successRate: pattern.confidence_score,
        category: classifyTemplate(viralIndicators),
        viralElements: extractViralElements(viralIndicators, patternScores)
      };
      
      discoveredTemplates.push(template);
    }
  }
  
  return discoveredTemplates;
}

async function saveTemplatestoDatabase(templates: any[]): Promise<any[]> {
  const savedTemplates = [];
  
  for (const template of templates) {
    try {
      const { data, error } = await supabase
        .from('template_generators')
        .insert({
          template_name: template.name,
          source_videos: [template.sourceVideoId],
          pattern_data: template.patternData,
          success_rate: template.successRate,
          status: 'active'
        })
        .select()
        .single();

      if (!error && data) {
        savedTemplates.push(data);
      }
    } catch (err) {
      console.warn('Failed to save template:', template.name, err);
    }
  }
  
  return savedTemplates;
}

async function updateTemplateGenerators(templates: any[]): Promise<void> {
  // Update usage counts and effectiveness scores
  for (const template of templates) {
    await supabase
      .from('template_generators')
      .update({
        usage_count: 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', template.id);
  }
}

function generateTemplateName(viralIndicators: any): string {
  const hookTypes = ['Authority Hook', 'Curiosity Gap', 'Story Hook', 'Transformation Hook'];
  const structures = ['POV Format', 'Tutorial Style', 'Behind Scenes', 'Quick Tips'];
  
  const hasStrongHook = viralIndicators.hook_strength > 0.8;
  const hasStructure = viralIndicators.structural_score > 0.7;
  
  if (hasStrongHook && hasStructure) {
    return `${hookTypes[Math.floor(Math.random() * hookTypes.length)]} + ${structures[Math.floor(Math.random() * structures.length)]}`;
  } else if (hasStrongHook) {
    return hookTypes[Math.floor(Math.random() * hookTypes.length)];
  } else {
    return structures[Math.floor(Math.random() * structures.length)];
  }
}

function classifyTemplate(viralIndicators: any): string {
  const engagement = viralIndicators.engagement_pattern || 0;
  const hook = viralIndicators.hook_strength || 0;
  const timing = viralIndicators.timing_optimization || 0;
  
  if (hook > 0.8) return 'Hook-Driven';
  if (engagement > 0.8) return 'Engagement-Driven';
  if (timing > 0.8) return 'Timing-Optimized';
  return 'Balanced';
}

function extractViralElements(viralIndicators: any, patternScores: any): any {
  return {
    hookStrength: viralIndicators.hook_strength || 0,
    engagementTriggers: viralIndicators.engagement_triggers || [],
    timingFactors: viralIndicators.timing_factors || {},
    structuralElements: patternScores.structural_elements || {},
    confidenceLevel: viralIndicators.confidence || 0
  };
}

function calculateAverageConfidence(templates: any[]): number {
  if (templates.length === 0) return 0;
  const total = templates.reduce((sum, t) => sum + (t.success_rate || 0), 0);
  return Math.round((total / templates.length) * 100) / 100;
}

function generateFallbackTemplates(): any[] {
  return [
    {
      name: 'POV Experience Template',
      category: 'Storytelling',
      successRate: 0.92,
      status: 'HOT'
    },
    {
      name: 'Quick Tutorial Format',
      category: 'Educational',
      successRate: 0.87,
      status: 'HOT'
    },
    {
      name: 'Transformation Reveal',
      category: 'Visual Impact',
      successRate: 0.83,
      status: 'COOLING'
    }
  ];
} 