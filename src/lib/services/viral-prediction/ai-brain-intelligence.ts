// AI Brain Intelligence System - Claude-powered expert analysis

import { createClient } from '@supabase/supabase-js';
import { llmWrapper } from '@/lib/llm/wrapper'
import { z } from 'zod'
import { randomUUID } from 'crypto'

interface AiBrainAnalysis {
  psychologicalInsights: {
    emotionalTriggers: string[];
    cognitiveLoad: number;
    memoryStickiness: number;
    shareabilityFactors: string[];
  };
  narrativeStructure: {
    storyArc: string;
    conflictType: string;
    resolutionType: string;
    narrativeHooks: string[];
  };
  culturalSignificance: {
    culturalReferences: string[];
    generationalAppeal: string[];
    subgroupResonance: string[];
    memePotential: number;
  };
  viralMechanics: {
    discussionStarters: string[];
    controversyLevel: number;
    imitationLikelihood: number;
    remixPotential: number;
  };
  expertRecommendations: string[];
  confidenceScore: number;
}

export class AiBrainIntelligenceSystem {
  private supabase;
  
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  async analyzeWithAiBrain(video: {
    id: string;
    caption: string;
    hashtags: string[];
    visual_features?: any;
    audio_features?: any;
    creator_followers: number;
    view_count: number;
    like_count: number;
    comment_count: number;
    share_count: number;
    duration_seconds: number;
  }): Promise<AiBrainAnalysis> {
    
    console.log(`AI Brain analyzing video: ${video.id}`);
    
    // Prepare comprehensive context for Claude
    const analysisPrompt = this.buildAnalysisPrompt(video);
    
    try {
      const AnalysisSchema = z.object({
        psychologicalInsights: z.object({
          emotionalTriggers: z.array(z.string()),
          cognitiveLoad: z.number(),
          memoryStickiness: z.number(),
          shareabilityFactors: z.array(z.string())
        }),
        narrativeStructure: z.object({
          storyArc: z.string(),
          conflictType: z.string(),
          resolutionType: z.string(),
          narrativeHooks: z.array(z.string())
        }),
        culturalSignificance: z.object({
          culturalReferences: z.array(z.string()),
          generationalAppeal: z.array(z.string()),
          subgroupResonance: z.array(z.string()),
          memePotential: z.number()
        }),
        viralMechanics: z.object({
          discussionStarters: z.array(z.string()),
          controversyLevel: z.number(),
          imitationLikelihood: z.number(),
          remixPotential: z.number()
        }),
        expertRecommendations: z.array(z.string()),
        confidenceScore: z.number()
      })

      const { data } = await llmWrapper.callLLM({
        ctx: {
          auditId: `llm_${randomUUID()}`,
          role: 'Teacher',
          model: { provider: 'anthropic', name: 'claude-3-5-sonnet-20240620' },
          budget: { maxOutputTokens: 4000 }
        },
        schema: AnalysisSchema,
        messages: [
          { role: 'user', content: analysisPrompt }
        ],
        maxTokens: 4000
      })

      const analysis = data as any
      // Store AI Brain analysis
      await this.storeAiBrainAnalysis(video.id, analysis);
      return analysis;
    } catch (error) {
      console.error('AI Brain analysis failed:', error);
      
      // Fallback to rule-based analysis
      return this.generateFallbackAnalysis(video);
    }
  }

  private buildAnalysisPrompt(video: any): string {
    return `
You are an expert viral content analyst with deep understanding of social psychology, cultural trends, and virality mechanics. Analyze this TikTok video for viral potential.

VIDEO DATA:
Caption: "${video.caption}"
Hashtags: ${video.hashtags.join(', ')}
Duration: ${video.duration_seconds} seconds
Creator Followers: ${video.creator_followers.toLocaleString()}
Current Stats: ${video.view_count} views, ${video.like_count} likes, ${video.comment_count} comments

ANALYSIS FRAMEWORK:

1. PSYCHOLOGICAL TRIGGERS
- What emotions does this content trigger?
- How high is the cognitive load? (0-1 scale)
- Memory stickiness factors?
- What makes people want to share this?

2. NARRATIVE STRUCTURE
- What's the story arc? (setup, conflict, resolution)
- Type of conflict presented?
- How does it resolve?
- What narrative hooks grab attention?

3. CULTURAL SIGNIFICANCE
- Cultural references or moments it taps into?
- Which generations would this appeal to?
- What subgroups would resonate with this?
- Meme potential (0-1 scale)?

4. VIRAL MECHANICS
- What discussion points does this create?
- Controversy level (0-1 scale)?
- How likely are people to imitate this?
- Remix/response potential (0-1 scale)?

5. EXPERT RECOMMENDATIONS
- Specific actionable improvements
- Timing optimization suggestions
- Content modification ideas

6. CONFIDENCE ASSESSMENT
- Overall confidence in viral prediction (0-1 scale)

Respond in this exact JSON format:
{
  "psychologicalInsights": {
    "emotionalTriggers": ["trigger1", "trigger2"],
    "cognitiveLoad": 0.3,
    "memoryStickiness": 0.8,
    "shareabilityFactors": ["factor1", "factor2"]
  },
  "narrativeStructure": {
    "storyArc": "description",
    "conflictType": "type",
    "resolutionType": "type",
    "narrativeHooks": ["hook1", "hook2"]
  },
  "culturalSignificance": {
    "culturalReferences": ["ref1", "ref2"],
    "generationalAppeal": ["gen1", "gen2"],
    "subgroupResonance": ["group1", "group2"],
    "memePotential": 0.7
  },
  "viralMechanics": {
    "discussionStarters": ["topic1", "topic2"],
    "controversyLevel": 0.2,
    "imitationLikelihood": 0.6,
    "remixPotential": 0.8
  },
  "expertRecommendations": ["rec1", "rec2", "rec3"],
  "confidenceScore": 0.85
}
`;
  }

  private parseClaudeResponse(response: string): AiBrainAnalysis {
    try {
      // Extract JSON from Claude's response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and ensure all required fields
      return {
        psychologicalInsights: {
          emotionalTriggers: parsed.psychologicalInsights?.emotionalTriggers || [],
          cognitiveLoad: Math.max(0, Math.min(1, parsed.psychologicalInsights?.cognitiveLoad || 0.5)),
          memoryStickiness: Math.max(0, Math.min(1, parsed.psychologicalInsights?.memoryStickiness || 0.5)),
          shareabilityFactors: parsed.psychologicalInsights?.shareabilityFactors || []
        },
        narrativeStructure: {
          storyArc: parsed.narrativeStructure?.storyArc || 'unknown',
          conflictType: parsed.narrativeStructure?.conflictType || 'none',
          resolutionType: parsed.narrativeStructure?.resolutionType || 'none',
          narrativeHooks: parsed.narrativeStructure?.narrativeHooks || []
        },
        culturalSignificance: {
          culturalReferences: parsed.culturalSignificance?.culturalReferences || [],
          generationalAppeal: parsed.culturalSignificance?.generationalAppeal || [],
          subgroupResonance: parsed.culturalSignificance?.subgroupResonance || [],
          memePotential: Math.max(0, Math.min(1, parsed.culturalSignificance?.memePotential || 0.3))
        },
        viralMechanics: {
          discussionStarters: parsed.viralMechanics?.discussionStarters || [],
          controversyLevel: Math.max(0, Math.min(1, parsed.viralMechanics?.controversyLevel || 0.1)),
          imitationLikelihood: Math.max(0, Math.min(1, parsed.viralMechanics?.imitationLikelihood || 0.3)),
          remixPotential: Math.max(0, Math.min(1, parsed.viralMechanics?.remixPotential || 0.3))
        },
        expertRecommendations: parsed.expertRecommendations || [],
        confidenceScore: Math.max(0, Math.min(1, parsed.confidenceScore || 0.5))
      };
      
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      throw new Error('Invalid AI Brain response format');
    }
  }

  private generateFallbackAnalysis(video: any): AiBrainAnalysis {
    const caption = video.caption.toLowerCase();
    
    // Basic rule-based analysis as fallback
    const emotionalTriggers: string[] = [];
    if (caption.includes('amazing') || caption.includes('incredible')) emotionalTriggers.push('awe');
    if (caption.includes('funny') || caption.includes('lol')) emotionalTriggers.push('humor');
    if (caption.includes('sad') || caption.includes('crying')) emotionalTriggers.push('empathy');
    if (caption.includes('angry') || caption.includes('mad')) emotionalTriggers.push('anger');
    
    const shareabilityFactors: string[] = [];
    if (caption.includes('you')) shareabilityFactors.push('personal_relevance');
    if (caption.includes('secret') || caption.includes('hack')) shareabilityFactors.push('exclusive_knowledge');
    if (video.hashtags.some(tag => tag.includes('challenge'))) shareabilityFactors.push('participation');
    
    return {
      psychologicalInsights: {
        emotionalTriggers,
        cognitiveLoad: 0.4,
        memoryStickiness: 0.6,
        shareabilityFactors
      },
      narrativeStructure: {
        storyArc: 'basic_narrative',
        conflictType: 'unknown',
        resolutionType: 'unknown',
        narrativeHooks: ['opening_hook']
      },
      culturalSignificance: {
        culturalReferences: [],
        generationalAppeal: ['gen_z'],
        subgroupResonance: ['general'],
        memePotential: 0.3
      },
      viralMechanics: {
        discussionStarters: ['content_topic'],
        controversyLevel: 0.1,
        imitationLikelihood: 0.3,
        remixPotential: 0.4
      },
      expertRecommendations: [
        'Add stronger emotional hooks',
        'Increase engagement prompts',
        'Optimize for shareability'
      ],
      confidenceScore: 0.4
    };
  }

  private async storeAiBrainAnalysis(videoId: string, analysis: AiBrainAnalysis) {
    await this.supabase.from('ai_brain_analysis').insert({
      video_id: videoId,
      emotional_triggers: analysis.psychologicalInsights.emotionalTriggers,
      cognitive_load_score: analysis.psychologicalInsights.cognitiveLoad,
      memory_stickiness_score: analysis.psychologicalInsights.memoryStickiness,
      shareability_factors: analysis.psychologicalInsights.shareabilityFactors,
      story_arc_type: analysis.narrativeStructure.storyArc,
      conflict_type: analysis.narrativeStructure.conflictType,
      resolution_type: analysis.narrativeStructure.resolutionType,
      narrative_hooks: analysis.narrativeStructure.narrativeHooks,
      cultural_references: analysis.culturalSignificance.culturalReferences,
      generational_appeal: analysis.culturalSignificance.generationalAppeal,
      subgroup_resonance: analysis.culturalSignificance.subgroupResonance,
      meme_potential_score: analysis.culturalSignificance.memePotential,
      discussion_starters: analysis.viralMechanics.discussionStarters,
      controversy_level: analysis.viralMechanics.controversyLevel,
      imitation_likelihood: analysis.viralMechanics.imitationLikelihood,
      remix_potential: analysis.viralMechanics.remixPotential,
      expert_recommendations: analysis.expertRecommendations,
      ai_confidence_score: analysis.confidenceScore,
      analyzed_at: new Date().toISOString()
    });
  }

  // Calculate accuracy boost from AI Brain insights
  calculateAccuracyBoost(analysis: AiBrainAnalysis): number {
    let boost = 0;

    // High confidence AI analysis boost
    if (analysis.confidenceScore > 0.8) boost += 0.05; // +5%
    
    // Strong psychological triggers boost
    if (analysis.psychologicalInsights.emotionalTriggers.length >= 2) boost += 0.03; // +3%
    
    // High shareability boost
    if (analysis.psychologicalInsights.shareabilityFactors.length >= 3) boost += 0.02; // +2%
    
    // Meme potential boost
    if (analysis.culturalSignificance.memePotential > 0.7) boost += 0.03; // +3%
    
    // Remix potential boost
    if (analysis.viralMechanics.remixPotential > 0.6) boost += 0.02; // +2%

    return Math.min(boost, 0.15); // Max 15% boost from AI Brain
  }

  // Batch analysis for trending content
  async analyzeBatchContent(videoIds: string[]): Promise<Map<string, AiBrainAnalysis>> {
    const results = new Map<string, AiBrainAnalysis>();
    
    // Process in chunks to avoid rate limits
    const chunkSize = 5;
    for (let i = 0; i < videoIds.length; i += chunkSize) {
      const chunk = videoIds.slice(i, i + chunkSize);
      
      const promises = chunk.map(async (videoId) => {
        try {
          const { data: video } = await this.supabase
            .from('videos')
            .select('*')
            .eq('id', videoId)
            .single();
            
          if (video) {
            const analysis = await this.analyzeWithAiBrain(video);
            results.set(videoId, analysis);
          }
        } catch (error) {
          console.error(`Failed to analyze video ${videoId}:`, error);
        }
      });
      
      await Promise.all(promises);
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  // Get historical AI Brain insights for patterns
  async getInsightPatterns(days: number = 30): Promise<{
    topEmotionalTriggers: Array<{ trigger: string; count: number; avgViralScore: number }>;
    bestNarrativeStructures: Array<{ structure: string; count: number; avgViralScore: number }>;
    topCulturalReferences: Array<{ reference: string; count: number; avgViralScore: number }>;
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const { data } = await this.supabase
      .from('ai_brain_analysis')
      .select(`
        *,
        videos!inner(viral_score)
      `)
      .gte('analyzed_at', since.toISOString());
    
    if (!data) return { topEmotionalTriggers: [], bestNarrativeStructures: [], topCulturalReferences: [] };
    
    // Analyze emotional trigger patterns
    const triggerCounts: { [key: string]: { count: number; totalScore: number } } = {};
    const structureCounts: { [key: string]: { count: number; totalScore: number } } = {};
    const referenceCounts: { [key: string]: { count: number; totalScore: number } } = {};
    
    data.forEach(analysis => {
      const viralScore = analysis.videos.viral_score || 0;
      
      // Count emotional triggers
      analysis.emotional_triggers?.forEach((trigger: string) => {
        if (!triggerCounts[trigger]) triggerCounts[trigger] = { count: 0, totalScore: 0 };
        triggerCounts[trigger].count++;
        triggerCounts[trigger].totalScore += viralScore;
      });
      
      // Count narrative structures
      if (analysis.story_arc_type) {
        if (!structureCounts[analysis.story_arc_type]) {
          structureCounts[analysis.story_arc_type] = { count: 0, totalScore: 0 };
        }
        structureCounts[analysis.story_arc_type].count++;
        structureCounts[analysis.story_arc_type].totalScore += viralScore;
      }
      
      // Count cultural references
      analysis.cultural_references?.forEach((reference: string) => {
        if (!referenceCounts[reference]) referenceCounts[reference] = { count: 0, totalScore: 0 };
        referenceCounts[reference].count++;
        referenceCounts[reference].totalScore += viralScore;
      });
    });
    
    return {
      topEmotionalTriggers: Object.entries(triggerCounts)
        .map(([trigger, data]) => ({
          trigger,
          count: data.count,
          avgViralScore: data.totalScore / data.count
        }))
        .sort((a, b) => b.avgViralScore - a.avgViralScore)
        .slice(0, 10),
        
      bestNarrativeStructures: Object.entries(structureCounts)
        .map(([structure, data]) => ({
          structure,
          count: data.count,
          avgViralScore: data.totalScore / data.count
        }))
        .sort((a, b) => b.avgViralScore - a.avgViralScore)
        .slice(0, 5),
        
      topCulturalReferences: Object.entries(referenceCounts)
        .map(([reference, data]) => ({
          reference,
          count: data.count,
          avgViralScore: data.totalScore / data.count
        }))
        .sort((a, b) => b.avgViralScore - a.avgViralScore)
        .slice(0, 10)
    };
  }
}