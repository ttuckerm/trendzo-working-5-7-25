import { NextRequest, NextResponse } from 'next/server';
import { soundAnalysisService } from '@/lib/services/soundAnalysisService';
import { templateAnalysisService } from '@/lib/services/templateAnalysisService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const soundId = searchParams.get('soundId');
    const templateId = searchParams.get('templateId');
    
    // Collection for response data
    let unifiedScores = [];
    
    // If soundId is provided, get related templates
    if (soundId) {
      try {
        const templatePairings = await soundAnalysisService.findOptimalTemplatePairings(soundId);
        
        // Get detailed template data and calculate unified scores
        if (templatePairings && templatePairings.length > 0) {
          for (const pairing of templatePairings) {
            const templateData = await templateAnalysisService.getTemplateById(pairing.templateId);
            
            if (templateData) {
              unifiedScores.push({
                id: templateData.id,
                name: templateData.title,
                type: 'template',
                score: Math.round(pairing.correlationScore * 100), // Convert to 0-100 scale
                engagement: Math.round(pairing.engagementLift || 0),
                growth: Math.round(templateData.stats?.growthRate || 0),
                virality: Math.round(templateData.trendscore || 0),
                recommendation: getRecommendation(pairing.correlationScore, 'template'),
                category: templateData.category
              });
            }
          }
        }
      } catch (error) {
        console.error('Error getting template pairings:', error);
      }
    }
    
    // If templateId is provided, get related sounds
    if (templateId) {
      try {
        // We'll reuse the same service but in reverse direction
        const soundPairings = await templateAnalysisService.getSoundPairingsForTemplate(templateId);
        
        // Get detailed sound data and calculate unified scores
        if (soundPairings && soundPairings.length > 0) {
          for (const pairing of soundPairings) {
            const soundData = await soundAnalysisService.getSoundById(pairing.soundId);
            
            if (soundData) {
              unifiedScores.push({
                id: soundData.id,
                name: soundData.title,
                type: 'sound',
                score: Math.round(pairing.correlationScore * 100), // Convert to 0-100 scale
                engagement: Math.round(pairing.engagementLift || 0),
                growth: Math.round((soundData.stats?.growthVelocity7d || 0) * 10), // Convert to percentage
                virality: Math.round(soundData.viralityScore || 0),
                recommendation: getRecommendation(pairing.correlationScore, 'sound'),
                category: soundData.soundCategory
              });
            }
          }
        }
      } catch (error) {
        console.error('Error getting sound pairings:', error);
      }
    }
    
    // If neither is provided, return some of both
    if (!soundId && !templateId) {
      try {
        // Get top trending templates and sounds and create unified scores
        const trendingTemplates = await templateAnalysisService.getTrendingTemplates('7d', 5);
        const trendingSounds = await soundAnalysisService.getTrendingSounds('7d', 5);
        
        // Process templates
        for (const template of trendingTemplates) {
          unifiedScores.push({
            id: template.id,
            name: template.title,
            type: 'template',
            score: Math.round((template.trendscore || 0) * 10), // Normalize to 0-100
            engagement: Math.round(template.stats?.engagementRate || 0),
            growth: Math.round(template.stats?.growthRate || 0),
            virality: Math.round(template.trendscore || 0),
            recommendation: getRecommendation(template.trendscore / 10 || 0, 'template'),
            category: template.category
          });
        }
        
        // Process sounds
        for (const sound of trendingSounds) {
          unifiedScores.push({
            id: sound.id,
            name: sound.title,
            type: 'sound',
            score: Math.round((sound.viralityScore || 0) * 10), // Normalize to 0-100
            engagement: Math.round(sound.stats?.engagementRate || 0),
            growth: Math.round((sound.stats?.growthVelocity7d || 0) * 10), // Convert to percentage
            virality: Math.round(sound.viralityScore || 0),
            recommendation: getRecommendation(sound.viralityScore / 10 || 0, 'sound'),
            category: sound.soundCategory
          });
        }
      } catch (error) {
        console.error('Error getting trending items:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: unifiedScores
    });
  } catch (error) {
    console.error('Error generating unified scores:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate unified scores' 
      },
      { status: 500 }
    );
  }
}

// Helper function to generate recommendations
function getRecommendation(score: number, type: 'template' | 'sound'): string {
  if (score > 0.8) {
    return type === 'template' 
      ? 'Highly recommended for use with this sound'
      : 'Perfect match for your template';
  } else if (score > 0.6) {
    return type === 'template'
      ? 'Good choice for this sound'
      : 'Works well with your template';
  } else if (score > 0.4) {
    return type === 'template'
      ? 'Consider using with modifications'
      : 'Can work with some adjustments';
  } else {
    return type === 'template'
      ? 'Not recommended for this sound'
      : 'Not an ideal match for your template';
  }
} 