/**
 * Gemini 3 Pro Service
 *
 * Google AI's latest multimodal model with enhanced capabilities:
 * - Advanced video understanding
 * - Multimodal analysis (video + audio + text)
 * - Thinking mode for complex reasoning
 * - Context window: 2M tokens
 * - Native video processing (no frame extraction needed)
 * - Knowledge cutoff: January 2025
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import * as fs from 'fs';

// =============================================================================
// VIRAL SCORING CALIBRATION GUIDELINES
// =============================================================================
const VIRAL_SCORING_GUIDELINES = `
CRITICAL SCORING CALIBRATION - Read carefully:

You must score based on VIRAL POTENTIAL, not personal taste or quality standards.
TikTok viral content often breaks traditional "quality" rules.

SCORING SCALE (be accurate, not conservative):

85-100: EXCEPTIONAL VIRAL POTENTIAL
- Scroll-stopping hook in first 2 seconds
- Multiple viral triggers (curiosity, emotion, controversy, relatability)
- High shareability ("I need to send this to someone")
- Clear value or entertainment payoff
- Strong CTA or engagement driver

70-84: STRONG VIRAL POTENTIAL
- Good hook that creates curiosity
- At least 2-3 viral triggers present
- Decent shareability factor
- Clear structure and payoff
- Some engagement drivers

55-69: MODERATE POTENTIAL
- Average hook (doesn't strongly stop scroll)
- 1-2 viral triggers present
- Limited shareability
- Content delivers value but isn't compelling

40-54: BELOW AVERAGE
- Weak or missing hook
- Few engagement triggers
- Low shareability
- Unclear value proposition

Below 40: POOR VIRAL POTENTIAL (Reserve for truly bad content)
- No hook whatsoever
- Zero engagement triggers
- No value, entertainment, or emotional impact
- Would actively make someone scroll past

IMPORTANT CALIBRATION RULES:
1. If the content has a QUESTION or BOLD STATEMENT in the first line = minimum 55
2. If the content has CURIOSITY GAPS ("here's what happened", "the secret is") = minimum 60
3. If the content has EMOTIONAL TRIGGERS (relatable problem, surprising fact) = minimum 65
4. If the content has CLEAR VALUE + HOOK + CTA = minimum 70
5. If the content has ALL viral factors well-executed = 80+

DO NOT default to middle scores (50-60) out of uncertainty.
DO NOT be conservative just because content isn't "high production."
TikTok rewards authentic, engaging content over polished content.
Analyze the ACTUAL viral indicators present, then score accordingly.
`;

export interface GeminiAnalysisResult {
  success: boolean;
  viralPotential: number; // 0-100 DPS prediction
  confidence: number; // 0-1
  insights: string[];
  analysis: {
    hookStrength?: number; // 0-10
    contentStructure?: number; // 0-10
    emotionalAppeal?: number; // 0-10
    valueProposition?: number; // 0-10
    narrativeFlow?: number; // 0-10
    visualEngagement?: number; // 0-10
    audioQuality?: number; // 0-10
    pacing?: 'slow' | 'moderate' | 'fast' | 'dynamic';
    toneAnalysis?: string;
    targetAudience?: string;
    contentType?: string;
    // New calibrated fields
    curiosityGaps?: number; // 0-10
    emotionalTriggers?: number; // 0-10
    valueDelivery?: number; // 0-10
    shareability?: number; // 0-10
    engagementDrivers?: number; // 0-10
    authenticity?: number; // 0-10
    platformFit?: number; // 0-10
    executionQuality?: number; // 0-10 (video analysis only)
    audioEnergy?: number; // 0-10
    hookType?: string;
    viralFactorsPresent?: string[];
    viralFactorsMissing?: string[];
    executionNotes?: string;
  };
  recommendations: string[];
  error?: string;
}

export class GeminiService {
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private fileManager: GoogleAIFileManager | null = null;
  private modelName = 'gemini-3-pro-preview'; // Gemini 3 Pro Preview (Paid Tier)

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Check for API key in multiple possible env variable names
    // Priority: GOOGLE_GEMINI_AI_API_KEY (paid tier) > GOOGLE_AI_API_KEY > GEMINI_API_KEY
    const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || 
                   process.env.GOOGLE_AI_API_KEY || 
                   process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('[Gemini Init] ❌ API key not found. Set GOOGLE_GEMINI_AI_API_KEY in .env.local');
      return;
    }

    // Log which env var is being used (helpful for debugging)
    const keySource = process.env.GOOGLE_GEMINI_AI_API_KEY ? 'GOOGLE_GEMINI_AI_API_KEY' :
                      process.env.GOOGLE_AI_API_KEY ? 'GOOGLE_AI_API_KEY' : 'GEMINI_API_KEY';
    
    console.log('[Gemini Init] 🔑 API key found from:', keySource, '(length:', apiKey.length, ')');
    console.log('[Gemini Init] 📦 Loading model:', this.modelName);

    try {
      this.client = new GoogleGenerativeAI(apiKey);
      this.fileManager = new GoogleAIFileManager(apiKey);
      this.model = this.client.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });
      console.log('[Gemini Init] ✅ Successfully initialized Gemini client with model:', this.modelName);
    } catch (error: any) {
      console.error('[Gemini Init] ❌ Failed to initialize Gemini client:', error.message);
      console.error('[Gemini Init] Full error:', JSON.stringify(error, null, 2));
    }
  }

  /**
   * Analyze video transcript for viral potential
   */
  async analyzeTranscript(
    transcript: string,
    niche?: string,
    goal?: string,
    videoMetadata?: {
      duration?: number;
      title?: string;
      description?: string;
      hashtags?: string[];
    }
  ): Promise<GeminiAnalysisResult> {
    if (!this.model) {
      return this.getFallbackAnalysis('Gemini API not initialized');
    }

    if (!transcript || transcript.length < 10) {
      return this.getFallbackAnalysis('Insufficient transcript data');
    }

    try {
      console.log('[Gemini Transcript] 📝 Starting analysis with model:', this.modelName);
      console.log('[Gemini Transcript] 📊 Transcript length:', transcript.length, 'chars');
      
      const prompt = this.buildAnalysisPrompt(transcript, niche, goal, videoMetadata);

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      console.log('[Gemini Transcript] ✅ Received response, length:', text.length);

      return this.parseGeminiResponse(text);
    } catch (error: any) {
      console.error('[Gemini Transcript] ❌ Analysis error:', error.message);
      console.error('[Gemini Transcript] Error code:', error.code || 'N/A');
      console.error('[Gemini Transcript] Error status:', error.status || 'N/A');
      if (error.response) {
        console.error('[Gemini Transcript] Response error:', JSON.stringify(error.response, null, 2));
      }
      return this.getFallbackAnalysis(error.message);
    }
  }

  /**
   * Build comprehensive analysis prompt for Gemini with calibrated scoring
   */
  private buildAnalysisPrompt(
    transcript: string,
    niche?: string,
    goal?: string,
    metadata?: any
  ): string {
    const nicheContext = niche ? `\nContent Niche: ${niche}` : '';
    const goalContext = goal ? `\nCreator Goal: ${goal}` : '';
    const durationContext = metadata?.duration ? `\nVideo Duration: ${metadata.duration} seconds` : '';

    return `You are an expert TikTok viral content analyst. Your job is to predict viral potential accurately.

${VIRAL_SCORING_GUIDELINES}
${nicheContext}${goalContext}${durationContext}

TRANSCRIPT TO ANALYZE:
"""
${transcript.substring(0, 4000)}
"""

Analyze this content for TikTok viral potential. Consider:
1. Hook Strength - Does the opening stop the scroll?
2. Curiosity Gaps - Are there open loops that demand closure?
3. Emotional Triggers - Does it make viewers FEEL something?
4. Value Delivery - Is there clear takeaway or entertainment?
5. Shareability - Would someone send this to a friend?
6. Engagement Drivers - Does it prompt comments/saves/follows?

Provide your analysis in JSON format ONLY (no markdown):
{
  "viralPotential": <number 0-100 using the scoring guidelines above>,
  "confidence": <number 0.0-1.0>,
  "hookStrength": <number 0-10>,
  "curiosityGaps": <number 0-10>,
  "emotionalTriggers": <number 0-10>,
  "valueDelivery": <number 0-10>,
  "shareability": <number 0-10>,
  "engagementDrivers": <number 0-10>,
  "contentStructure": <number 0-10>,
  "pacing": "<slow|moderate|fast|dynamic>",
  "contentType": "<educational|entertainment|inspirational|controversial|storytelling|tutorial|other>",
  "viralFactorsPresent": ["list", "of", "specific", "factors", "found"],
  "viralFactorsMissing": ["list", "of", "missing", "factors"],
  "toneAnalysis": "<brief description>",
  "targetAudience": "<description>",
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

Remember: Score based on VIRAL POTENTIAL using the calibration guidelines, not personal quality judgment.`;
  }

  /**
   * Parse Gemini's JSON response with execution quality adjustment
   */
  private parseGeminiResponse(text: string): GeminiAnalysisResult {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();

      const parsed = JSON.parse(cleanText);

      // Apply execution quality adjustment if present (video analysis only)
      let adjustedViralPotential = parsed.viralPotential || 50;
      
      if (parsed.executionQuality !== undefined) {
        // If execution quality is low (< 5), reduce viral potential
        // If execution quality is high (> 7), boost viral potential slightly
        const executionFactor = (parsed.executionQuality - 5) * 3; // -15 to +15 adjustment
        adjustedViralPotential = Math.max(0, Math.min(100, adjustedViralPotential + executionFactor));
        console.log(`[Gemini] Execution quality adjustment: ${parsed.executionQuality}/10 → ${executionFactor > 0 ? '+' : ''}${executionFactor} DPS`);
      }

      // Log the viral potential score
      console.log(`[Gemini] ✅ Analysis successful - DPS: ${adjustedViralPotential}`);

      return {
        success: true,
        viralPotential: Math.max(0, Math.min(100, adjustedViralPotential)),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        analysis: {
          hookStrength: parsed.hookStrength,
          contentStructure: parsed.contentStructure,
          emotionalAppeal: parsed.emotionalAppeal,
          valueProposition: parsed.valueProposition,
          narrativeFlow: parsed.narrativeFlow,
          visualEngagement: parsed.visualEngagement,
          audioQuality: parsed.audioQuality,
          pacing: parsed.pacing,
          toneAnalysis: parsed.toneAnalysis,
          targetAudience: parsed.targetAudience,
          contentType: parsed.contentType,
          // New fields from calibrated prompts
          curiosityGaps: parsed.curiosityGaps,
          emotionalTriggers: parsed.emotionalTriggers,
          valueDelivery: parsed.valueDelivery,
          shareability: parsed.shareability,
          engagementDrivers: parsed.engagementDrivers,
          authenticity: parsed.authenticity,
          platformFit: parsed.platformFit,
          executionQuality: parsed.executionQuality,
          audioEnergy: parsed.audioEnergy,
          hookType: parsed.hookType,
          viralFactorsPresent: parsed.viralFactorsPresent,
          viralFactorsMissing: parsed.viralFactorsMissing,
          executionNotes: parsed.executionNotes
        },
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
      };
    } catch (parseError: any) {
      console.error('Failed to parse Gemini response:', parseError.message);
      console.error('Raw response:', text);

      // Fallback: Extract insights from unstructured response
      return this.extractInsightsFromText(text);
    }
  }

  /**
   * Extract insights from unstructured Gemini response
   */
  private extractInsightsFromText(text: string): GeminiAnalysisResult {
    const insights: string[] = [];

    // Look for numbered points or bullet points
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[\d\-\*•]/)) {
        insights.push(trimmed.replace(/^[\d\-\*•.\)]\s*/, ''));
      }
    }

    // Estimate viral potential from text
    const positiveWords = ['viral', 'engaging', 'strong', 'excellent', 'great', 'good'];
    const negativeWords = ['weak', 'poor', 'lacks', 'missing', 'needs improvement'];

    let score = 60; // Baseline
    positiveWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score += 5;
    });
    negativeWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score -= 5;
    });

    return {
      success: true,
      viralPotential: Math.max(30, Math.min(90, score)),
      confidence: 0.65,
      insights: insights.slice(0, 5),
      analysis: {},
      recommendations: []
    };
  }

  /**
   * Get fallback analysis when Gemini is unavailable
   */
  private getFallbackAnalysis(reason: string): GeminiAnalysisResult {
    return {
      success: false,
      viralPotential: 55,
      confidence: 0.3,
      insights: ['Gemini analysis unavailable - using fallback analysis'],
      analysis: {},
      recommendations: ['Configure GOOGLE_AI_API_KEY to enable Gemini analysis'],
      error: reason
    };
  }

  /**
   * Analyze video file directly using Gemini 3 Pro multimodal capabilities
   * Uploads video to Gemini File API and performs multimodal analysis
   */
  async analyzeVideoFile(
    videoPath: string,
    niche?: string,
    goal?: string
  ): Promise<GeminiAnalysisResult> {
    if (!this.model || !this.fileManager) {
      return {
        success: false,
        viralPotential: 60,
        confidence: 0.3,
        insights: [],
        analysis: {},
        recommendations: ['Configure GOOGLE_AI_API_KEY to enable video analysis'],
        error: 'Gemini not configured'
      };
    }

    if (!fs.existsSync(videoPath)) {
      return {
        success: false,
        viralPotential: 60,
        confidence: 0.3,
        insights: [],
        analysis: {},
        recommendations: ['Provide valid video file path'],
        error: `Video file not found: ${videoPath}`
      };
    }

    try {
      console.log('[Gemini 3 Pro] Uploading video file:', videoPath);

      // Upload video file to Gemini File API
      const uploadResult = await this.fileManager.uploadFile(videoPath, {
        mimeType: 'video/mp4',
        displayName: `Video analysis ${Date.now()}`
      });

      console.log('[Gemini 3 Pro] Video uploaded:', uploadResult.file.name);

      // Wait for video processing to complete
      let file = uploadResult.file;
      while (file.state === FileState.PROCESSING) {
        console.log('[Gemini 3 Pro] Video processing... waiting 5s');
        await new Promise(resolve => setTimeout(resolve, 5000));
        file = await this.fileManager.getFile(file.name);
      }

      if (file.state === FileState.FAILED) {
        throw new Error('Video processing failed');
      }

      console.log('[Gemini 3 Pro] Video ready for analysis');

      // Build analysis prompt
      const prompt = this.buildVideoAnalysisPrompt(niche, goal);

      // Analyze video with multimodal input
      const result = await this.model.generateContent([
        {
          fileData: {
            mimeType: file.mimeType,
            fileUri: file.uri
          }
        },
        { text: prompt }
      ]);

      const response = result.response;
      const text = response.text();

      console.log('[Gemini 3 Pro] Video analysis complete');
      console.log('[Gemini 3 Pro] Raw response length:', text.length);

      // Parse the structured response (using parseGeminiResponse which handles JSON extraction)
      const analysis = this.parseGeminiResponse(text);

      // Clean up: delete the uploaded file
      try {
        await this.fileManager.deleteFile(file.name);
        console.log('[Gemini 3 Pro] Uploaded file deleted');
      } catch (deleteError) {
        console.warn('[Gemini 3 Pro] Failed to delete uploaded file:', deleteError);
      }

      return analysis;

    } catch (error: any) {
      console.error('[Gemini Video] ❌ Video analysis error:', error.message);
      console.error('[Gemini Video] Error code:', error.code || 'N/A');
      console.error('[Gemini Video] Error status:', error.status || 'N/A');
      
      // Check for specific error types
      let errorDetails = error.message;
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        errorDetails = `Model "${this.modelName}" may not exist or be inaccessible. Try 'gemini-2.0-flash-exp' as fallback.`;
        console.error('[Gemini Video] ⚠️ MODEL NOT FOUND - The model name may be incorrect');
      } else if (error.message?.includes('quota') || error.message?.includes('429')) {
        errorDetails = 'API quota exceeded. Check your Google AI billing/limits.';
      } else if (error.message?.includes('permission') || error.message?.includes('403')) {
        errorDetails = 'API key lacks permission for this model. Verify key permissions.';
      }

      return {
        success: false,
        viralPotential: 60,
        confidence: 0.3,
        insights: ['Video analysis failed - see error'],
        analysis: {},
        recommendations: ['Ensure video file is valid MP4 format', 'Check API quota limits', 'Verify model name is correct'],
        error: errorDetails
      };
    }
  }

  /**
   * Build prompt specifically for video file analysis with calibrated scoring
   */
  private buildVideoAnalysisPrompt(niche?: string, goal?: string): string {
    return `You are an expert TikTok viral content analyst with access to the actual video.

${VIRAL_SCORING_GUIDELINES}

${niche ? `Content Niche: ${niche}` : ''}
${goal ? `Creator Goal: ${goal}` : ''}

Analyze this video for TikTok viral potential. You can see:
- Visual elements (composition, movement, text overlays, transitions)
- Audio elements (voice, music, sound effects, energy level)
- Pacing and editing style
- Hook execution (not just words, but delivery)
- Overall production and authenticity

VIDEO ANALYSIS CHECKLIST:
1. HOOK (0-3 seconds): Does it STOP the scroll? How?
2. VISUAL ENGAGEMENT: Movement, colors, text, face presence
3. AUDIO ENERGY: Voice tonality, music choice, sound design
4. PACING: Does it maintain attention throughout?
5. AUTHENTICITY: Does it feel real/relatable or overly produced?
6. SHAREABILITY: Would someone share this? Why?
7. PLATFORM FIT: Is it optimized for vertical short-form?

Provide your analysis in JSON format ONLY (no markdown):
{
  "viralPotential": <number 0-100 using the scoring guidelines above>,
  "confidence": <number 0.0-1.0>,
  "hookStrength": <number 0-10>,
  "visualEngagement": <number 0-10>,
  "audioEnergy": <number 0-10>,
  "contentStructure": <number 0-10>,
  "emotionalAppeal": <number 0-10>,
  "valueProposition": <number 0-10>,
  "narrativeFlow": <number 0-10>,
  "authenticity": <number 0-10>,
  "shareability": <number 0-10>,
  "platformFit": <number 0-10>,
  "executionQuality": <number 0-10>,
  "audioQuality": <number 0-10>,
  "pacing": "<slow|moderate|fast|dynamic>",
  "hookType": "<question|statement|visual|sound|action|story>",
  "contentType": "<educational|entertainment|inspirational|controversial|storytelling|tutorial|other>",
  "viralFactorsPresent": ["list", "specific", "factors"],
  "viralFactorsMissing": ["list", "missing", "factors"],
  "toneAnalysis": "<description>",
  "targetAudience": "<description>",
  "executionNotes": "<specific observations about delivery quality>",
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

CRITICAL: When analyzing the actual video, pay attention to EXECUTION QUALITY.
- A great script delivered poorly = lower score
- A simple script delivered with energy and authenticity = higher score
- Production quality matters less than engagement quality on TikTok

Score based on ACTUAL viral potential using the calibration guidelines.`;
  }

  /**
   * Check if Gemini is properly configured
   */
  isConfigured(): boolean {
    return this.model !== null;
  }

  /**
   * Get current model name
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Test the Gemini API connection with a simple prompt
   * Use this to verify the API is working before running predictions
   */
  async testConnection(): Promise<{
    success: boolean;
    model: string;
    error?: string;
    response?: string;
  }> {
    console.log('[Gemini Test] 🔍 Testing API connection...');
    console.log('[Gemini Test] Model:', this.modelName);
    
    if (!this.model) {
      return {
        success: false,
        model: this.modelName,
        error: 'Gemini model not initialized - check API key configuration'
      };
    }

    try {
      const testPrompt = 'Respond with exactly: "Gemini API is working correctly."';
      const result = await this.model.generateContent(testPrompt);
      const response = result.response.text();
      
      console.log('[Gemini Test] ✅ API Response received:', response.substring(0, 100));
      
      return {
        success: true,
        model: this.modelName,
        response: response
      };
    } catch (error: any) {
      console.error('[Gemini Test] ❌ API test failed:', error.message);
      
      // Provide specific guidance based on error
      let errorMessage = error.message;
      if (error.message?.includes('not found') || error.status === 404) {
        errorMessage = `Model "${this.modelName}" does not exist. Valid models include: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash`;
      } else if (error.message?.includes('API key') || error.status === 401) {
        errorMessage = 'Invalid API key. Check GOOGLE_AI_API_KEY in .env.local';
      } else if (error.message?.includes('quota') || error.status === 429) {
        errorMessage = 'API quota exceeded. Check your Google AI Studio quota.';
      }
      
      return {
        success: false,
        model: this.modelName,
        error: errorMessage
      };
    }
  }

  /**
   * Reinitialize with a different model name
   * Useful if the default model fails and you need to try an alternative
   */
  reinitializeWithModel(newModelName: string): void {
    console.log('[Gemini] 🔄 Reinitializing with model:', newModelName);
    this.modelName = newModelName;
    this.model = null;
    this.client = null;
    this.fileManager = null;
    this.initialize();
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
