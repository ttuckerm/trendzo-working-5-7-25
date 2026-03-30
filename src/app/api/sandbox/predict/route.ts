import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { video_id, user_content, workspace_context, niche, variation } = body;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!video_id || !user_content) {
      return NextResponse.json({
        error: 'Video ID and user content required',
        success: false
      }, { status: 400 });
    }

    // Calculate viral score based on content completeness
    let baseScore = 50;
    
    // Hook analysis
    if (user_content.hook?.trim()) {
      baseScore += 15;
      if (user_content.hook.length > 30) baseScore += 5;
      if (/\d+/.test(user_content.hook)) baseScore += 8; // Numbers boost
    }
    
    // Authority signal
    if (user_content.authority?.trim()) {
      baseScore += 12;
      if (user_content.authority.length > 50) baseScore += 5;
    }
    
    // Value points
    const valuePoints = user_content.valuePoints?.filter((p: string) => p.trim()) || [];
    baseScore += valuePoints.length * 4;
    
    // Visual proof
    if (user_content.visualProof?.trim()) {
      baseScore += 8;
    }
    
    // CTA
    if (user_content.cta?.trim()) {
      baseScore += 6;
    }

    // Variation modifier
    const variationModifiers = [0, 2, -1, 3, 1]; // Different variations perform differently
    const variationBonus = variationModifiers[variation] || 0;
    
    const finalScore = Math.min(Math.max(baseScore + variationBonus, 0), 95);
    
    // Generate prediction data
    const prediction = {
      viralScore: finalScore,
      confidence: Math.min(finalScore * 1.2, 95),
      recommendations: generateRecommendations(user_content, finalScore),
      estimatedViews: formatViews(finalScore * 28000),
      estimatedEngagement: `${(finalScore * 0.15).toFixed(1)}%`,
      breakdown: {
        hookPower: user_content.hook ? Math.min(user_content.hook.length * 2, 85) : 0,
        authoritySignal: user_content.authority ? 75 : 20,
        valueDelivery: valuePoints.length > 0 ? 80 : 30,
        trustFactors: user_content.visualProof ? 70 : 25,
        ctaStrength: user_content.cta ? 65 : 15
      },
      variationAnalysis: {
        currentVariation: variation,
        bestVariation: getBestVariation(finalScore),
        improvements: getVariationImprovements(variation)
      },
      creatorFingerprint: {
        personalizedScore: finalScore + 5, // Slightly higher with personalization
        audienceMatch: 87,
        historicalContext: `Based on your ${Math.floor(Math.random() * 20) + 10} previous videos`
      }
    };

    return NextResponse.json({
      success: true,
      data: prediction,
      message: 'Viral prediction generated successfully'
    });

  } catch (error) {
    console.error('Prediction API error:', error);
    return NextResponse.json({
      error: 'Failed to generate prediction',
      success: false
    }, { status: 500 });
  }
}

function generateRecommendations(content: any, score: number): string[] {
  const recommendations = [];
  
  if (!content.hook || content.hook.length < 20) {
    recommendations.push('Strengthen your hook with specific numbers or results');
  }
  
  if (!content.authority || content.authority.length < 30) {
    recommendations.push('Add more credibility signals to build trust');
  }
  
  const valuePoints = content.valuePoints?.filter((p: string) => p.trim()) || [];
  if (valuePoints.length < 3) {
    recommendations.push('Complete all 3 value points for maximum impact');
  }
  
  if (!content.visualProof) {
    recommendations.push('Add visual proof to increase retention by 34%');
  }
  
  if (!content.cta) {
    recommendations.push('Include a clear CTA to maximize engagement');
  }
  
  if (score > 80) {
    recommendations.push('Excellent content structure! Consider posting at optimal time');
  }
  
  return recommendations.slice(0, 4); // Limit to 4 recommendations
}

function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${Math.round(views / 1000)}K`;
  }
  return views.toString();
}

function getBestVariation(currentScore: number): number {
  // Mock analysis - in reality this would be based on actual performance data
  const variations = [
    { id: 0, expectedScore: currentScore },
    { id: 1, expectedScore: currentScore + 2 },
    { id: 2, expectedScore: currentScore - 1 },
    { id: 3, expectedScore: currentScore + 3 },
    { id: 4, expectedScore: currentScore + 1 }
  ];
  
  return variations.reduce((best, current) => 
    current.expectedScore > best.expectedScore ? current : best
  ).id;
}

function getVariationImprovements(variation: number): string[] {
  const improvements = [
    ['Add more authority signals', 'Include specific numbers'],
    ['Strengthen emotional connection', 'Add personal story elements'],
    ['Increase curiosity gap', 'Add more intrigue'],
    ['Enhance problem-solution fit', 'Add urgency'],
    ['Improve teaching clarity', 'Add more examples']
  ];
  
  return improvements[variation] || improvements[0];
} 