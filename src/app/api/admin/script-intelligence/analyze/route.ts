/**
 * Script Intelligence Analysis API Endpoint
 * Analyzes what creators SAY with framework-based analysis
 * Provides comprehensive script analysis and improvement suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { ScriptIntelligenceEngine } from '@/lib/services/viral-prediction/script-intelligence-engine';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env';

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const body = await request.json();

    // Validate request body
    if (!body.transcript && !body.script) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required transcript or script content' 
        },
        { status: 400 }
      );
    }

    const scriptEngine = new ScriptIntelligenceEngine();
    const transcript = body.transcript || body.script;
    const scriptId = body.scriptId || `script_${Date.now()}`;

    // Analyze script content
    const analysis = await scriptEngine.analyzeScript(
      scriptId,
      transcript,
      body.audioFeatures
    );

    const processingTime = Date.now() - startTime;

    // Store analysis in database
    if (body.saveToDatabase !== false) {
      try {
        await getDb()
          .from('script_analyses')
          .insert({
            script_id: scriptId,
            transcript,
            analysis_data: JSON.stringify(analysis),
            viral_potential: analysis.viralPotential,
            script_score: analysis.scriptScore,
            confidence: analysis.confidence,
            processing_time_ms: processingTime,
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.warn('Failed to save script analysis to database:', dbError);
      }
    }

    const response = {
      success: true,
      scriptId,
      processingTime,
      
      // Core analysis results
      analysis: {
        viralPotential: analysis.viralPotential,
        scriptScore: analysis.scriptScore,
        confidence: analysis.confidence,
        
        // Framework detection
        frameworkCount: analysis.detectedFrameworks.length,
        detectedFrameworks: analysis.detectedFrameworks.map(f => ({
          name: f.frameworkName,
          confidence: f.confidence,
          category: f.category,
          tier: f.tier,
          matchedPatterns: f.matchedPatterns
        })),
        
        // Emotional analysis
        emotionalArc: {
          type: analysis.emotionalArc.overall,
          score: analysis.emotionalArc.arcScore,
          peak: analysis.emotionalArc.peak,
          keyMoments: analysis.emotionalArc.keyMoments.length
        },
        
        // Hook analysis
        hookAnalysis: {
          type: analysis.hookAnalysis.hookType,
          strength: analysis.hookAnalysis.strength,
          timeToHook: analysis.hookAnalysis.timeToHook,
          retentionProbability: analysis.hookAnalysis.retentionProbability,
          frameworks: analysis.hookAnalysis.frameworks
        },
        
        // Narrative structure
        narrativeStructure: {
          type: analysis.narrativeStructure.structure,
          completeness: analysis.narrativeStructure.completeness,
          clarity: analysis.narrativeStructure.clarity,
          engagement: analysis.narrativeStructure.engagement
        },
        
        // Persuasion techniques
        persuasionTechniques: analysis.persuasionTechniques.map(t => ({
          technique: t.technique,
          strength: t.strength,
          location: t.location,
          effectiveness: t.effectiveness
        })),
        
        // Linguistic patterns
        linguisticPatterns: analysis.linguisticPatterns.map(p => ({
          pattern: p.pattern,
          frequency: p.frequency,
          viralCorrelation: p.viralCorrelation
        })),
        
        // Improvement suggestions
        improvements: analysis.improvements
      },
      
      // Evidence for proof of concept
      evidence: {
        scriptIntelligenceActive: true,
        frameworksAnalyzed: analysis.detectedFrameworks.length,
        analysisSpeed: `${processingTime}ms`,
        confidenceLevel: analysis.confidence,
        improvementSuggestions: analysis.improvements.length,
        
        // System capabilities demonstration
        capabilities: {
          speechAnalysis: 'Framework-based script analysis',
          emotionalDetection: 'Multi-dimensional emotional arc tracking',
          persuasionAnalysis: 'Psychological technique identification',
          narrativeStructure: 'Story structure optimization',
          linguisticPatterns: 'Viral language pattern detection'
        }
      },
      
      // Metadata
      metadata: {
        timestamp: new Date().toISOString(),
        engine: 'Script Intelligence Engine v1.0',
        frameworkLibrary: '40+ viral frameworks',
        analysisDepth: 'Deep linguistic and emotional analysis',
        separateTracking: 'Script vs Visual performance isolation'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Script intelligence analysis error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Script analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get recent script analyses
    const { data: analyses, error } = await getDb()
      .from('script_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get summary statistics
    const { data: stats } = await getDb()
      .from('script_analyses')
      .select('viral_potential, script_score, confidence')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const summary = {
      totalAnalyses: analyses?.length || 0,
      averageViralPotential: stats ? stats.reduce((sum, s) => sum + (s.viral_potential || 0), 0) / stats.length : 0,
      averageScriptScore: stats ? stats.reduce((sum, s) => sum + (s.script_score || 0), 0) / stats.length : 0,
      averageConfidence: stats ? stats.reduce((sum, s) => sum + (s.confidence || 0), 0) / stats.length : 0,
      last7Days: stats?.length || 0
    };

    return NextResponse.json({
      success: true,
      analyses: analyses?.map(analysis => ({
        scriptId: analysis.script_id,
        viralPotential: analysis.viral_potential,
        scriptScore: analysis.script_score,
        confidence: analysis.confidence,
        processingTime: analysis.processing_time_ms,
        createdAt: analysis.created_at
      })) || [],
      summary,
      pagination: {
        limit,
        offset,
        hasMore: (analyses?.length || 0) === limit
      }
    });

  } catch (error) {
    console.error('Get script analyses error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve script analyses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}