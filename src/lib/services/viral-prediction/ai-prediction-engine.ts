/**
 * AI Prediction Engine Integration
 * Enhanced viral prediction using OpenAI/Claude for advanced content analysis
 */

import { createClient } from '@supabase/supabase-js';
import { llmWrapper } from '@/lib/llm/wrapper'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { runJudge } from '@/lib/llm/judge'

interface VideoData {
  id: string;
  description: string;
  hashtags: string[];
  author: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  duration: number;
  niche?: string;
}

interface AIAnalysisResult {
  viral_probability: number;
  confidence_score: number;
  hook_analysis: {
    hook_type: string;
    effectiveness_score: number;
    psychological_triggers: string[];
  };
  content_analysis: {
    emotional_appeal: number;
    authenticity_score: number;
    shareability_factors: string[];
    trending_elements: string[];
  };
  recommendations: string[];
  predicted_peak_time: string;
  audience_match: number;
  framework_scores: Array<{
    framework: string;
    score: number;
    reasoning: string;
  }>;
}

export class AIPredictionEngine {
  private openaiApiKey: string;
  private claudeApiKey: string;
  private supabase: any;
  private defaultModel: 'openai' | 'claude';

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY || '';
    this.defaultModel = this.openaiApiKey ? 'openai' : 'claude';
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Main prediction method - analyzes video content using AI
   */
  async predictViralPotential(videoData: VideoData): Promise<AIAnalysisResult> {
    try {
      console.log(`🤖 AI analyzing video for viral potential: ${videoData.id}`);
      
      const startTime = Date.now();
      
      // Get framework data for context
      const frameworks = await this.getFrameworkData();
      
      // Analyze using preferred AI model
      const analysis = this.defaultModel === 'openai' 
        ? await this.analyzeWithOpenAI(videoData, frameworks)
        : await this.analyzeWithClaude(videoData, frameworks);

      const processingTime = Date.now() - startTime;
      
      // Store AI analysis results
      await this.storeAIAnalysis(videoData.id, analysis, processingTime);
      
      console.log(`✅ AI analysis completed in ${processingTime}ms`);
      // Judge critique: use Doer output assembled from analysis result
      try {
        const prediction = {
          score: Math.round((analysis.viral_probability || 0) * 100),
          probability: analysis.viral_probability || 0,
          confidence: analysis.confidence_score || 0
        }
        const features = {
          hook_analysis: analysis.hook_analysis,
          content_analysis: analysis.content_analysis,
          framework_scores: analysis.framework_scores
        }
        const auditId = `judge_${randomUUID()}`
        await runJudge({
          auditId,
          model: this.defaultModel === 'openai' ? { provider: 'openai', name: 'gpt-4o' } : { provider: 'anthropic', name: 'claude-3-5-sonnet-20240620' },
          doerOutput: { prediction, features },
          rubric: [],
          constraints: { safety: true, alignment: true },
          predictionId: String(videoData.id || '')
        })
      } catch {}
      return analysis;

    } catch (error) {
      console.error('❌ AI prediction failed:', error);
      return this.getFallbackAnalysis(videoData);
    }
  }

  /**
   * Analyze content using OpenAI GPT-4
   */
  private async analyzeWithOpenAI(videoData: VideoData, frameworks: any[]): Promise<AIAnalysisResult> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildAnalysisPrompt(videoData, frameworks);

    const AnalysisSchema = z.object({
      viral_probability: z.number(),
      confidence_score: z.number(),
      hook_analysis: z.object({
        hook_type: z.string(),
        effectiveness_score: z.number(),
        psychological_triggers: z.array(z.string())
      }),
      content_analysis: z.object({
        emotional_appeal: z.number(),
        authenticity_score: z.number(),
        shareability_factors: z.array(z.string()),
        trending_elements: z.array(z.string())
      }),
      recommendations: z.array(z.string()),
      predicted_peak_time: z.string(),
      audience_match: z.number(),
      framework_scores: z.array(z.object({ framework: z.string(), score: z.number(), reasoning: z.string() }))
    })

    const { data } = await llmWrapper.callLLM({
      ctx: {
        auditId: `llm_${randomUUID()}`,
        role: 'Judge',
        model: { provider: 'openai', name: 'gpt-4-turbo-preview' },
        budget: { maxOutputTokens: 2000 }
      },
      schema: AnalysisSchema,
      messages: [
        { role: 'system', content: 'You are an expert viral content analyst with deep knowledge of social media psychology, engagement patterns, and trending factors. Analyze content for viral potential with high accuracy.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      maxTokens: 2000
    })

    return this.formatAIAnalysis(data as any, videoData);
  }

  /**
   * Analyze content using Claude
   */
  private async analyzeWithClaude(videoData: VideoData, frameworks: any[]): Promise<AIAnalysisResult> {
    if (!this.claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    const prompt = this.buildAnalysisPrompt(videoData, frameworks);

    const AnalysisSchema = z.object({
      viral_probability: z.number(),
      confidence_score: z.number(),
      hook_analysis: z.object({
        hook_type: z.string(),
        effectiveness_score: z.number(),
        psychological_triggers: z.array(z.string())
      }),
      content_analysis: z.object({
        emotional_appeal: z.number(),
        authenticity_score: z.number(),
        shareability_factors: z.array(z.string()),
        trending_elements: z.array(z.string())
      }),
      recommendations: z.array(z.string()),
      predicted_peak_time: z.string(),
      audience_match: z.number(),
      framework_scores: z.array(z.object({ framework: z.string(), score: z.number(), reasoning: z.string() }))
    })

    const { data } = await llmWrapper.callLLM({
      ctx: {
        auditId: `llm_${randomUUID()}`,
        role: 'Judge',
        model: { provider: 'anthropic', name: 'claude-3-opus-20240229' },
        budget: { maxOutputTokens: 2000 }
      },
      schema: AnalysisSchema,
      messages: [
        { role: 'user', content: `You are an expert viral content analyst. ${prompt}\n\nRespond with valid JSON only.` }
      ],
      temperature: 0.3,
      maxTokens: 2000
    })

    return this.formatAIAnalysis(data as any, videoData);
  }

  /**
   * Build comprehensive analysis prompt
   */
  private buildAnalysisPrompt(videoData: VideoData, frameworks: any[]): string {
    const frameworkList = frameworks.map(f => `${f.name} (${f.success_rate}% success rate)`).join(', ');

    return `
Analyze this TikTok video for viral potential:

VIDEO DATA:
- Description: "${videoData.description}"
- Hashtags: ${videoData.hashtags.join(', ')}
- Creator: ${videoData.author}
- Current metrics: ${videoData.views} views, ${videoData.likes} likes, ${videoData.comments} comments, ${videoData.shares} shares
- Duration: ${videoData.duration} seconds
- Niche: ${videoData.niche || 'unknown'}

AVAILABLE VIRAL FRAMEWORKS: ${frameworkList}

Analyze and provide detailed assessment in the following JSON format:
{
  "viral_probability": 0.85,
  "confidence_score": 0.92,
  "hook_analysis": {
    "hook_type": "POV Hook",
    "effectiveness_score": 0.89,
    "psychological_triggers": ["relatability", "curiosity", "emotional resonance"]
  },
  "content_analysis": {
    "emotional_appeal": 0.87,
    "authenticity_score": 0.91,
    "shareability_factors": ["relatable scenario", "clear value proposition"],
    "trending_elements": ["current hashtag", "popular format"]
  },
  "framework_scores": [
    {
      "framework": "POV Hook",
      "score": 0.89,
      "reasoning": "Strong POV opener creates immediate relatability"
    }
  ],
  "recommendations": ["Optimize opening 3 seconds", "Add trending hashtag"],
  "predicted_peak_time": "within 6 hours",
  "audience_match": 0.93
}

Consider:
1. Hook strength and psychological appeal
2. Content authenticity and production quality
3. Cultural timing and trend alignment
4. Audience engagement potential
5. Shareability factors
6. Framework effectiveness based on success rates

Provide realistic scores based on actual viral content patterns.
`;
  }

  /**
   * Format AI analysis into standardized result
   */
  private formatAIAnalysis(aiData: any, videoData: VideoData): AIAnalysisResult {
    return {
      viral_probability: Math.min(Math.max(aiData.viral_probability || 0.5, 0), 1),
      confidence_score: Math.min(Math.max(aiData.confidence_score || 0.7, 0), 1),
      hook_analysis: {
        hook_type: aiData.hook_analysis?.hook_type || 'General Hook',
        effectiveness_score: Math.min(Math.max(aiData.hook_analysis?.effectiveness_score || 0.6, 0), 1),
        psychological_triggers: aiData.hook_analysis?.psychological_triggers || ['engagement']
      },
      content_analysis: {
        emotional_appeal: Math.min(Math.max(aiData.content_analysis?.emotional_appeal || 0.6, 0), 1),
        authenticity_score: Math.min(Math.max(aiData.content_analysis?.authenticity_score || 0.7, 0), 1),
        shareability_factors: aiData.content_analysis?.shareability_factors || ['content quality'],
        trending_elements: aiData.content_analysis?.trending_elements || []
      },
      recommendations: aiData.recommendations || ['Optimize hook strength', 'Improve engagement'],
      predicted_peak_time: aiData.predicted_peak_time || 'within 12 hours',
      audience_match: Math.min(Math.max(aiData.audience_match || 0.7, 0), 1),
      framework_scores: (aiData.framework_scores || []).map(f => ({
        framework: f.framework || 'Unknown',
        score: Math.min(Math.max(f.score || 0.5, 0), 1),
        reasoning: f.reasoning || 'Standard analysis'
      }))
    };
  }

  /**
   * Get framework data for analysis context
   */
  private async getFrameworkData(): Promise<any[]> {
    try {
      const { data: frameworks } = await this.supabase
        .from('hook_frameworks')
        .select('*')
        .order('success_rate', { ascending: false })
        .limit(15);

      return frameworks || [];
    } catch (error) {
      console.error('Failed to get framework data:', error);
      return [];
    }
  }

  /**
   * Store AI analysis results in database
   */
  private async storeAIAnalysis(videoId: string, analysis: AIAnalysisResult, processingTime: number): Promise<void> {
    try {
      // Store main prediction
      await this.supabase.from('video_predictions').upsert({
        video_id: videoId,
        predicted_viral_score: analysis.viral_probability * 100,
        confidence: analysis.confidence_score * 100,
        prediction_factors: {
          hook_analysis: analysis.hook_analysis,
          content_analysis: analysis.content_analysis,
          audience_match: analysis.audience_match
        },
        predicted_metrics: {
          peak_time: analysis.predicted_peak_time,
          recommendations: analysis.recommendations
        },
        ai_model_used: this.defaultModel,
        processing_time_ms: processingTime
      }, { onConflict: 'video_id' });

      // Store framework scores
      for (const framework of analysis.framework_scores) {
        await this.supabase.from('framework_scores').upsert({
          video_id: videoId,
          framework_name: framework.framework,
          score: framework.score,
          reasoning: framework.reasoning,
          confidence: analysis.confidence_score
        });
      }

      // Store hook detection
      await this.supabase.from('hook_detections').upsert({
        video_id: videoId,
        hook_type: analysis.hook_analysis.hook_type,
        confidence_score: analysis.hook_analysis.effectiveness_score * 100,
        effectiveness_score: analysis.hook_analysis.effectiveness_score * 100
      });

      // Update system metrics
      await this.updateSystemMetrics(processingTime, analysis.confidence_score);

    } catch (error) {
      console.error('Failed to store AI analysis:', error);
    }
  }

  /**
   * Update system metrics after AI analysis
   */
  private async updateSystemMetrics(processingTime: number, confidence: number): Promise<void> {
    try {
      // Update processing time metric
      await this.supabase.from('system_metrics').upsert({
        metric_type: 'processing',
        metric_name: 'ai_processing_time_ms',
        metric_value: processingTime,
        metric_data: { model: this.defaultModel, confidence }
      });

      // Update prediction count
      const today = new Date().toISOString().split('T')[0];
      const { data: todayCount } = await this.supabase
        .from('system_metrics')
        .select('metric_value')
        .eq('metric_type', 'usage')
        .eq('metric_name', 'ai_predictions_today')
        .gte('recorded_at', today + 'T00:00:00')
        .single();

      const newCount = (todayCount?.metric_value || 0) + 1;

      await this.supabase.from('system_metrics').upsert({
        metric_type: 'usage',
        metric_name: 'ai_predictions_today',
        metric_value: newCount,
        metric_data: { date: today }
      });

    } catch (error) {
      console.error('Failed to update system metrics:', error);
    }
  }

  /**
   * Fallback analysis when AI fails
   */
  private getFallbackAnalysis(videoData: VideoData): AIAnalysisResult {
    console.log('🔄 Using fallback analysis');

    // Calculate basic scores based on existing metrics
    const engagementRate = videoData.views > 0 
      ? (videoData.likes + videoData.comments + videoData.shares) / videoData.views 
      : 0;

    const viral_probability = Math.min(engagementRate * 2 + 0.3, 0.95);
    const confidence_score = 0.6; // Lower confidence for fallback

    return {
      viral_probability,
      confidence_score,
      hook_analysis: {
        hook_type: 'General Hook',
        effectiveness_score: 0.6,
        psychological_triggers: ['engagement']
      },
      content_analysis: {
        emotional_appeal: 0.6,
        authenticity_score: 0.7,
        shareability_factors: ['content quality'],
        trending_elements: []
      },
      recommendations: [
        'Enhance hook strength in first 3 seconds',
        'Optimize for higher engagement rate',
        'Consider trending hashtags'
      ],
      predicted_peak_time: 'within 12 hours',
      audience_match: 0.7,
      framework_scores: [
        {
          framework: 'General Analysis',
          score: 0.6,
          reasoning: 'Fallback analysis based on engagement metrics'
        }
      ]
    };
  }

  /**
   * Batch analyze multiple videos
   */
  async batchAnalyze(videoIds: string[]): Promise<{ [videoId: string]: AIAnalysisResult }> {
    const results: { [videoId: string]: AIAnalysisResult } = {};

    for (const videoId of videoIds.slice(0, 10)) { // Limit batch size
      try {
        // Get video data
        const { data: video } = await this.supabase
          .from('videos')
          .select('*')
          .eq('id', videoId)
          .single();

        if (video) {
          const analysis = await this.predictViralPotential(video);
          results[videoId] = analysis;
        }

        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Failed to analyze video ${videoId}:`, error);
      }
    }

    return results;
  }

  /**
   * Get current AI model status and capabilities
   */
  getModelStatus(): any {
    return {
      available_models: {
        openai: !!this.openaiApiKey,
        claude: !!this.claudeApiKey
      },
      active_model: this.defaultModel,
      capabilities: [
        'Hook effectiveness analysis',
        'Psychological trigger detection',
        'Framework scoring',
        'Viral probability prediction',
        'Content optimization recommendations'
      ]
    };
  }
}