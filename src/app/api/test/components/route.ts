/**
 * Component Test API
 * 
 * POST /api/test/components
 * 
 * Tests each Kai Orchestrator component individually and returns detailed results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { KaiOrchestrator } from '@/lib/orchestration/kai-orchestrator';

export async function POST(request: NextRequest) {
  try {
    const { transcript, niche = 'personal-finance' } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: 'transcript is required' },
        { status: 400 }
      );
    }

    console.log('\n' + '='.repeat(60));
    console.log('COMPONENT TEST SUITE');
    console.log('='.repeat(60));
    console.log(`Transcript length: ${transcript.length} chars`);
    console.log(`Niche: ${niche}`);
    console.log('='.repeat(60) + '\n');

    // Initialize Kai Orchestrator
    const kai = new KaiOrchestrator();

    // Run full prediction to get all component results
    const predictionResult = await kai.predict(
      {
        videoId: 'test-component-suite',
        transcript,
        niche,
        goal: 'Build engaged following',
        accountSize: '10k-50k'
      },
      'immediate-analysis'
    );

    // Extract individual component results from paths
    const componentResults: Record<string, any> = {};
    
    for (const path of predictionResult.paths) {
      for (const result of path.results) {
        const score = result.prediction;
        const isHardcoded = isLikelyHardcoded(score);
        
        componentResults[result.componentId] = {
          score: score !== undefined ? Math.round(score * 10) / 10 : null,
          confidence: result.confidence ? Math.round(result.confidence * 100) / 100 : null,
          success: result.success,
          isReal: result.success && !isHardcoded,
          isHardcoded,
          latency: result.latency ? `${result.latency}ms` : null,
          insights: result.insights || [],
          features: result.features || null,
          error: result.error || null,
          path: path.path
        };
      }
    }

    // Calculate component statistics
    const componentCount = Object.keys(componentResults).length;
    const successCount = Object.values(componentResults).filter(c => c.success).length;
    const realAnalysisCount = Object.values(componentResults).filter(c => c.isReal).length;
    const hardcodedCount = Object.values(componentResults).filter(c => c.isHardcoded).length;

    // Score distribution analysis
    const scores = Object.values(componentResults)
      .filter(c => c.score !== null)
      .map(c => c.score as number);
    
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 
      : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const scoreSpread = maxScore - minScore;

    // Determine if results look suspicious (all similar scores = likely hardcoded)
    const isSuspicious = scoreSpread < 15 && scores.length > 5;

    // Build response
    const response = {
      success: true,
      
      // Final prediction
      finalScore: predictionResult.dps,
      confidence: Math.round(predictionResult.confidence * 100),
      viralPotential: predictionResult.viralPotential,
      range: predictionResult.range,
      
      // Component analysis
      components: componentResults,
      
      // Statistics
      stats: {
        totalComponents: componentCount,
        successfulComponents: successCount,
        realAnalysisComponents: realAnalysisCount,
        hardcodedComponents: hardcodedCount,
        avgScore,
        minScore,
        maxScore,
        scoreSpread,
        isSuspicious
      },
      
      // Path results
      paths: predictionResult.paths.map(p => ({
        name: p.path,
        score: p.aggregatedPrediction ? Math.round(p.aggregatedPrediction * 10) / 10 : null,
        confidence: p.aggregatedConfidence ? Math.round(p.aggregatedConfidence * 100) / 100 : null,
        weight: p.weight,
        success: p.success,
        componentCount: p.results.length
      })),
      
      // Warnings
      warnings: [
        ...(predictionResult.warnings || []),
        ...(isSuspicious ? ['⚠️ Score spread is very narrow - components may not be differentiating content'] : []),
        ...(hardcodedCount > 3 ? [`⚠️ ${hardcodedCount} components appear to return hardcoded values`] : [])
      ],
      
      // Recommendations
      recommendations: predictionResult.recommendations || [],
      
      // Metadata
      metadata: {
        transcriptLength: transcript.length,
        wordCount: transcript.split(/\s+/).length,
        niche,
        processingTime: predictionResult.latency
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Component test error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Check if a score is likely hardcoded based on common placeholder values
 */
function isLikelyHardcoded(score: number | undefined): boolean {
  if (score === undefined || score === null) return false;
  
  // Known hardcoded values that were used in the past
  const knownHardcoded = [50, 62, 65, 68, 70];
  
  // Check if score is exactly one of the known hardcoded values
  const roundedScore = Math.round(score);
  return knownHardcoded.includes(roundedScore);
}

/**
 * GET endpoint - Return test info
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/test/components',
    description: 'Test all Kai Orchestrator components with a sample transcript',
    usage: {
      method: 'POST',
      body: {
        transcript: 'string (required) - The video transcript to analyze',
        niche: 'string (optional) - The content niche, default: personal-finance'
      }
    },
    sampleTranscripts: {
      good_viral: "Want to retire early? Here's the secret nobody talks about! Most people think it's about saving every penny, but it's really about making your money work FOR YOU! Invest in assets like stocks or real estate that generate passive income. Your money should be earning money! Hit follow for more tips!",
      bad_boring: "Today I want to talk about some financial concepts. First, there's saving money. Second, there's investing. Third, there's budgeting. These are important topics. Thank you for watching.",
      medium_decent: "Here's a quick tip that changed my finances. Instead of buying coffee every day, I started making it at home. That's $5 a day, $150 a month, $1800 a year. Put that in an index fund and in 10 years you'll have over $25,000. Small changes, big results."
    },
    expectedScores: {
      good_viral: '75-95 (should score high)',
      bad_boring: '25-45 (should score low)',
      medium_decent: '50-70 (should score medium)'
    }
  });
}














