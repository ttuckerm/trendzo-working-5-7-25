/**
 * Gemini 3.0 Pro Video Analyzer
 * Uses Google's Gemini 3.0 Pro multimodal capabilities to analyze video content
 * Provides deep visual, audio, and contextual understanding of TikTok videos
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

export interface GeminiVideoAnalysis {
  // Visual Analysis
  visual: {
    sceneBreakdown: string[];
    dominantColors: string[];
    visualStyle: string;
    composition: string;
    cameraMovements: string[];
    textOnScreen: string[];
    facialExpressions: string[];
    visualTransitions: string[];
  };

  // Audio Analysis
  audio: {
    backgroundMusic: string;
    voiceoverTone: string;
    soundEffects: string[];
    musicGenre: string;
    audioQuality: string;
    speechCadence: string;
  };

  // Content Analysis
  content: {
    mainTopic: string;
    keyMessages: string[];
    emotionalTone: string;
    targetAudience: string;
    contentType: string; // tutorial, entertainment, story, etc.
    viralElements: string[];
  };

  // Engagement Predictions
  engagement: {
    hookStrength: number; // 0-1
    retentionPotential: number; // 0-1
    shareability: number; // 0-1
    emotionalImpact: number; // 0-1
    viralPotential: number; // 0-1
  };

  // Transcript & Dialogue
  transcript: {
    fullText: string;
    keyPhrases: string[];
    callToAction: string;
    dialogue: Array<{
      timestamp: string;
      text: string;
      speaker?: string;
    }>;
  };

  // Raw Gemini Response
  rawAnalysis: string;
}

export class GeminiVideoAnalyzer {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor(modelName: string = 'gemini-2.5-flash') {
    // Use Gemini 2.5 Flash for multimodal capability
    // Alternative models: 'gemini-2.5-pro', 'gemini-2.5-flash-lite'
    const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY ||
                   process.env.GOOGLE_AI_API_KEY ||
                   process.env.GEMINI_API_KEY || '';
    this.modelName = modelName;
    this.ai = new GoogleGenAI({ apiKey });
    console.log('[GeminiVideoAnalyzer] Initializing with model:', modelName);
  }

  /**
   * Analyze a video file using Gemini 3.0 Pro's multimodal capabilities
   */
  async analyzeVideo(videoPath: string): Promise<GeminiVideoAnalysis> {
    try {
      // Read video file
      const videoBuffer = fs.readFileSync(videoPath);
      const videoBase64 = videoBuffer.toString('base64');

      // Prepare the prompt for comprehensive analysis
      const prompt = this.buildAnalysisPrompt();

      // Send to Gemini with video
      const result = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'video/mp4', data: videoBase64 } },
            { text: prompt },
          ],
        }],
      });

      const analysisText = result.text || '';

      // Parse the structured response
      const analysis = this.parseGeminiResponse(analysisText);

      return analysis;

    } catch (error: any) {
      console.error('[GeminiVideoAnalyzer] ❌ Video analysis failed:', error.message);
      console.error('[GeminiVideoAnalyzer] Error code:', error.code || 'N/A');
      console.error('[GeminiVideoAnalyzer] Model used:', this.modelName);
      
      // Provide specific guidance
      let errorMessage = error.message;
      if (error.message?.includes('not found') || error.status === 404) {
        errorMessage = `Model "${this.modelName}" not found. Try: gemini-2.5-flash, gemini-2.5-pro, or gemini-2.5-flash-lite`;
      }
      
      throw new Error(`Video analysis failed: ${errorMessage}`);
    }
  }

  /**
   * Analyze multiple videos in batch
   */
  async analyzeVideoBatch(videoPaths: string[]): Promise<GeminiVideoAnalysis[]> {
    const analyses: GeminiVideoAnalysis[] = [];

    for (const videoPath of videoPaths) {
      try {
        const analysis = await this.analyzeVideo(videoPath);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze ${videoPath}:`, error);
        // Continue with other videos
      }
    }

    return analyses;
  }

  /**
   * Build comprehensive analysis prompt
   */
  private buildAnalysisPrompt(): string {
    return `Analyze this TikTok/short-form video in extreme detail. Provide a comprehensive JSON response with the following structure:

{
  "visual": {
    "sceneBreakdown": ["array of scenes with timestamps and descriptions"],
    "dominantColors": ["list of main colors used"],
    "visualStyle": "overall aesthetic (modern, vintage, minimalist, etc.)",
    "composition": "framing and visual composition details",
    "cameraMovements": ["list of camera techniques used"],
    "textOnScreen": ["all text visible in the video"],
    "facialExpressions": ["emotional expressions detected"],
    "visualTransitions": ["types of cuts and transitions"]
  },
  "audio": {
    "backgroundMusic": "description of music/sound",
    "voiceoverTone": "tone of voice (energetic, calm, excited, etc.)",
    "soundEffects": ["list of sound effects used"],
    "musicGenre": "genre of background music",
    "audioQuality": "quality assessment",
    "speechCadence": "speaking rhythm and pace"
  },
  "content": {
    "mainTopic": "what is this video about",
    "keyMessages": ["main points communicated"],
    "emotionalTone": "overall emotional feeling",
    "targetAudience": "who this is for",
    "contentType": "category (tutorial, story, comedy, etc.)",
    "viralElements": ["elements that make it shareable"]
  },
  "engagement": {
    "hookStrength": 0.8,
    "retentionPotential": 0.9,
    "shareability": 0.75,
    "emotionalImpact": 0.85,
    "viralPotential": 0.8
  },
  "transcript": {
    "fullText": "complete transcription of all spoken words",
    "keyPhrases": ["memorable phrases or catchphrases"],
    "callToAction": "what action the video asks viewers to take",
    "dialogue": [
      {"timestamp": "0:00", "text": "spoken text", "speaker": "person speaking"}
    ]
  }
}

Be extremely detailed and thorough. Extract every possible insight from visual, audio, and contextual elements. This analysis will be used to predict viral potential and optimize content creation.

Return ONLY valid JSON, no additional text.`;
  }

  /**
   * Parse Gemini's JSON response
   */
  private parseGeminiResponse(responseText: string): GeminiVideoAnalysis {
    try {
      // Clean up response (remove markdown code blocks if present)
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanedText);

      return {
        visual: parsed.visual || {},
        audio: parsed.audio || {},
        content: parsed.content || {},
        engagement: parsed.engagement || {},
        transcript: parsed.transcript || {},
        rawAnalysis: responseText
      };

    } catch (error) {
      console.error('Failed to parse Gemini response:', error);

      // Return fallback analysis
      return {
        visual: {
          sceneBreakdown: [],
          dominantColors: [],
          visualStyle: 'unknown',
          composition: 'unknown',
          cameraMovements: [],
          textOnScreen: [],
          facialExpressions: [],
          visualTransitions: []
        },
        audio: {
          backgroundMusic: 'unknown',
          voiceoverTone: 'unknown',
          soundEffects: [],
          musicGenre: 'unknown',
          audioQuality: 'unknown',
          speechCadence: 'unknown'
        },
        content: {
          mainTopic: 'unknown',
          keyMessages: [],
          emotionalTone: 'unknown',
          targetAudience: 'unknown',
          contentType: 'unknown',
          viralElements: []
        },
        engagement: {
          hookStrength: 0.5,
          retentionPotential: 0.5,
          shareability: 0.5,
          emotionalImpact: 0.5,
          viralPotential: 0.5
        },
        transcript: {
          fullText: '',
          keyPhrases: [],
          callToAction: '',
          dialogue: []
        },
        rawAnalysis: responseText
      };
    }
  }

  /**
   * Quick analysis for single aspect (e.g., just transcript)
   */
  async quickTranscript(videoPath: string): Promise<string> {
    try {
      const videoBuffer = fs.readFileSync(videoPath);
      const videoBase64 = videoBuffer.toString('base64');

      const prompt = 'Transcribe all spoken words in this video. Return only the transcript text, nothing else.';

      const result = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'video/mp4', data: videoBase64 } },
            { text: prompt },
          ],
        }],
      });

      return result.text || '';

    } catch (error: any) {
      console.error('Transcript extraction failed:', error);
      throw new Error(`Transcript failed: ${error.message}`);
    }
  }

  /**
   * Analyze visual elements only (faster than full analysis)
   */
  async quickVisualAnalysis(videoPath: string): Promise<any> {
    try {
      const videoBuffer = fs.readFileSync(videoPath);
      const videoBase64 = videoBuffer.toString('base64');

      const prompt = `Analyze only the visual elements of this video. Return JSON with:
{
  "sceneBreakdown": ["scene descriptions"],
  "dominantColors": ["colors"],
  "textOnScreen": ["visible text"],
  "visualStyle": "style description"
}`;

      const result = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'video/mp4', data: videoBase64 } },
            { text: prompt },
          ],
        }],
      });

      const text = result.text || '';

      // Parse JSON
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      return JSON.parse(cleaned);

    } catch (error: any) {
      console.error('Visual analysis failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const geminiAnalyzer = new GeminiVideoAnalyzer();
