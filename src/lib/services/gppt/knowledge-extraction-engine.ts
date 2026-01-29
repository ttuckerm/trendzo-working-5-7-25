/**
 * FEAT-060: GPT Knowledge Extraction Pipeline
 * Multi-LLM consensus engine for extracting structured knowledge from viral videos
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface VideoInput {
  video_id: string;
  transcript: string;
  caption: string;
  dps_score: number;
  classification: 'mega-viral' | 'viral' | 'normal';
  engagement_metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  creator_metadata: {
    followers: number;
    username?: string; // Optional - not sent to LLMs for privacy
  };
  // FFmpeg Visual Intelligence (Enhancement: FEAT-001 Integration)
  visual_analysis?: {
    duration_ms?: number;
    resolution?: string; // e.g., "1080x1920"
    fps?: number;
    hook_scene_changes?: number;
    quality_score?: number;
  };
}

export interface ViralInsights {
  viral_hooks: string[];
  emotional_triggers: string[];
  content_structure: string;
  value_proposition: string;
  call_to_action: string;
  viral_coefficient_factors: string[];
  pattern_match: string;
  novelty_score: number; // 0-10
  confidence: number; // 0-1
}

export interface LLMAnalysis {
  insights: ViralInsights;
  model: string;
  tokens_used: number;
  latency_ms: number;
}

export interface ConsensusResult {
  consensus_insights: ViralInsights;
  agreement_score: number; // 0-1
  confidence_score: number; // 0-1
  gpt4_analysis: LLMAnalysis | null;
  claude_analysis: LLMAnalysis | null;
  gemini_analysis: LLMAnalysis | null;
  processing_time_ms: number;
}

// ═══════════════════════════════════════════════════════════════
// PROMPT TEMPLATE
// ═══════════════════════════════════════════════════════════════

function buildPrompt(video: VideoInput): string {
  // Build visual analysis section if available
  const visualSection = video.visual_analysis ? `
Visual Quality Analysis:
- Resolution: ${video.visual_analysis.resolution || 'unknown'}
- Frame Rate: ${video.visual_analysis.fps ? video.visual_analysis.fps + ' fps' : 'unknown'}
- Duration: ${video.visual_analysis.duration_ms ? Math.round(video.visual_analysis.duration_ms / 1000) + ' seconds' : 'unknown'}
- Hook Scene Changes (first 3s): ${video.visual_analysis.hook_scene_changes !== undefined ? video.visual_analysis.hook_scene_changes + ' cuts' : 'unknown'}
- Overall Quality Score: ${video.visual_analysis.quality_score !== undefined ? (video.visual_analysis.quality_score * 100).toFixed(0) + '%' : 'unknown'}
` : '';

  return `Analyze this TikTok video that achieved ${video.classification} status (DPS score: ${video.dps_score.toFixed(2)}).

VIDEO DATA:
Transcript: ${video.transcript || 'Not available'}
Caption: ${video.caption || 'Not available'}
Views: ${video.engagement_metrics.views.toLocaleString()} | Likes: ${video.engagement_metrics.likes.toLocaleString()} | Comments: ${video.engagement_metrics.comments.toLocaleString()} | Shares: ${video.engagement_metrics.shares.toLocaleString()}
${visualSection}
${visualSection ? '**USE VISUAL QUALITY DATA**: Consider how production quality (resolution, FPS, hook cuts) contributes to viral success. High-quality videos (1080p+, 60fps) and optimal hook pacing (2-4 cuts in first 3s) are key viral factors.\n' : ''}
Extract the following in JSON format:

{
  "viral_hooks": ["specific hook phrases that grabbed attention"],
  "emotional_triggers": ["fear of missing out", "curiosity gap", etc.],
  "content_structure": "description of narrative flow",
  "value_proposition": "what viewer gains from watching",
  "call_to_action": "what viewer is prompted to do",
  "viral_coefficient_factors": ["shareability reasons, including visual quality factors if relevant"],
  "pattern_match": "which existing viral pattern this resembles",
  "novelty_score": 0-10 (how unique vs derivative),
  "confidence": 0-1 (how confident in analysis)
}

Be specific. Quote exact phrases from the transcript/caption. Explain WHY elements work.
Return ONLY valid JSON, no markdown formatting.`;
}

// ═══════════════════════════════════════════════════════════════
// LLM CLIENTS
// ═══════════════════════════════════════════════════════════════

class LLMClients {
  private static openai: OpenAI | null = null;
  private static anthropic: Anthropic | null = null;
  private static google: GoogleGenerativeAI | null = null;

  static getOpenAI(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY not found');
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  static getAnthropic(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY not found');
      this.anthropic = new Anthropic({ apiKey });
    }
    return this.anthropic;
  }

  static getGoogle(): GoogleGenerativeAI {
    if (!this.google) {
      // Check all possible Gemini API key env var names (priority: paid tier key first)
      const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key not found. Set GOOGLE_GEMINI_AI_API_KEY in .env.local');
      this.google = new GoogleGenerativeAI(apiKey);
    }
    return this.google;
  }
}

// ═══════════════════════════════════════════════════════════════
// INDIVIDUAL LLM EXTRACTORS
// ═══════════════════════════════════════════════════════════════

async function extractWithGPT4(
  video: VideoInput,
  retries = 2
): Promise<LLMAnalysis | null> {
  const startTime = Date.now();

  try {
    const openai = LLMClients.getOpenAI();
    const prompt = buildPrompt(video);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a viral content analyst. Extract structured insights from video data.
CRITICAL: Your response MUST be valid JSON with ALL of these fields:
{
  "viral_hooks": ["array of strings"],
  "emotional_triggers": ["array of strings"],
  "content_structure": "string",
  "value_proposition": "string",
  "call_to_action": "string",
  "viral_coefficient_factors": ["array of strings"],
  "pattern_match": "string",
  "novelty_score": 0-10,
  "confidence": 0.0-1.0
}
Do not add any text before or after the JSON. Output ONLY the JSON object.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from GPT-4');

    const parsed = JSON.parse(content);

    // Validate required fields
    const requiredFields = ['viral_hooks', 'emotional_triggers', 'novelty_score', 'confidence'];
    for (const field of requiredFields) {
      if (!(field in parsed)) {
        console.warn(`⚠️  GPT-4 response missing ${field}, using default`);
        if (field === 'novelty_score') parsed[field] = 5;
        if (field === 'confidence') parsed[field] = 0.7;
        if (field.endsWith('s')) parsed[field] = []; // Arrays default to empty
        else parsed[field] = ''; // Strings default to empty
      }
    }


    return {
      insights: parsed as ViralInsights,
      model: 'gpt-4o-mini',
      tokens_used: response.usage?.total_tokens || 0,
      latency_ms: Date.now() - startTime
    };
  } catch (error) {
    console.error('GPT-4 extraction failed:', error);
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return extractWithGPT4(video, retries - 1);
    }
    return null;
  }
}

async function extractWithClaude(
  video: VideoInput,
  retries = 2
): Promise<LLMAnalysis | null> {
  const startTime = Date.now();

  try {
    const anthropic = LLMClients.getAnthropic();
    const prompt = buildPrompt(video);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `You are a viral content analyst. ${prompt}`
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type from Claude');

    // Claude sometimes wraps JSON in markdown, strip it
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const insights = JSON.parse(jsonText) as ViralInsights;

    return {
      insights,
      model: 'claude-3-5-sonnet-20241022',
      tokens_used: response.usage.input_tokens + response.usage.output_tokens,
      latency_ms: Date.now() - startTime
    };
  } catch (error) {
    console.error('Claude extraction failed:', error);
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return extractWithClaude(video, retries - 1);
    }
    return null;
  }
}

async function extractWithGemini(
  video: VideoInput,
  retries = 2
): Promise<LLMAnalysis | null> {
  const startTime = Date.now();

  try {
    const genAI = LLMClients.getGoogle();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const prompt = buildPrompt(video);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500,
        responseMimeType: 'application/json'
      }
    });

    const content = result.response.text();
    if (!content) throw new Error('Empty response from Gemini');

    const insights = JSON.parse(content) as ViralInsights;

    return {
      insights,
      model: 'gemini-1.5-pro',
      tokens_used: result.response.usageMetadata?.totalTokenCount || 0,
      latency_ms: Date.now() - startTime
    };
  } catch (error) {
    console.error('Gemini extraction failed:', error);
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return extractWithGemini(video, retries - 1);
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// CONSENSUS LOGIC
// ═══════════════════════════════════════════════════════════════

function calculateAgreementScore(analyses: LLMAnalysis[]): number {
  if (analyses.length < 2) return 1;

  let totalOverlap = 0;
  let comparisons = 0;

  // Compare pairwise
  for (let i = 0; i < analyses.length; i++) {
    for (let j = i + 1; j < analyses.length; j++) {
      const a1 = analyses[i].insights;
      const a2 = analyses[j].insights;

      // Check overlap in viral_hooks
      const hooksOverlap = calculateArrayOverlap(a1.viral_hooks, a2.viral_hooks);
      const triggersOverlap = calculateArrayOverlap(a1.emotional_triggers, a2.emotional_triggers);
      const factorsOverlap = calculateArrayOverlap(a1.viral_coefficient_factors, a2.viral_coefficient_factors);

      // Average overlap for this pair
      const pairOverlap = (hooksOverlap + triggersOverlap + factorsOverlap) / 3;
      totalOverlap += pairOverlap;
      comparisons++;
    }
  }

  return comparisons > 0 ? totalOverlap / comparisons : 0;
}

function calculateArrayOverlap(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1;
  if (arr1.length === 0 || arr2.length === 0) return 0;

  // Simple Jaccard similarity
  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

function mergeInsights(responses: Array<{ response: any, source: string, weight: number }>): any {
  // Helper to safely get field with default
  const safeGet = (obj: any, field: string, defaultValue: any) => {
    return obj?.insights?.[field] ?? defaultValue
  }

  // Merge arrays with weighted deduplication
  const mergeArrays = (field: string) => {
    const allItems = responses.flatMap(({ response, weight }) => {
      const items = safeGet(response, field, [])
      return Array.isArray(items) ? items : []
    })
    return [...new Set(allItems)] // Deduplicate
  }

  // Weighted average for numeric fields
  const weightedAverage = (field: string) => {
    const values = responses.map(({ response, weight }) => ({
      value: safeGet(response, field, 0),
      weight
    }))
    const sum = values.reduce((acc, { value, weight }) => acc + (value * weight), 0)
    return Math.round(sum * 100) / 100 // Round to 2 decimals
  }

  // Weighted vote for string fields (most common)
  const weightedVote = (field: string) => {
    const votes = new Map<string, number>()
    responses.forEach(({ response, weight }) => {
      const value = safeGet(response, field, '')
      if (value) {
        votes.set(value, (votes.get(value) || 0) + weight)
      }
    })
    return [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || ''
  }

  return {
    viral_hooks: mergeArrays('viral_hooks'),
    emotional_triggers: mergeArrays('emotional_triggers'),
    content_structure: weightedVote('content_structure'),
    value_proposition: weightedVote('value_proposition'),
    call_to_action: weightedVote('call_to_action'),
    viral_coefficient_factors: mergeArrays('viral_coefficient_factors'),
    pattern_match: weightedVote('pattern_match'),
    novelty_score: weightedAverage('novelty_score'), // ✅ Now handles missing values
    confidence: weightedAverage('confidence'),
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXTRACTION FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function extractKnowledge(video: VideoInput): Promise<ConsensusResult> {
  const startTime = Date.now();

  console.log(`[FEAT-060] Starting knowledge extraction for video ${video.video_id}`);

  // STEP 1: Parallel LLM calls
  const llmPromises = [
    extractWithGPT4(video).catch(e => ({ error: e.message, source: 'gpt4' })),
    extractWithClaude(video).catch(e => ({ error: e.message, source: 'claude' })),
    extractWithGemini(video).catch(e => ({ error: e.message, source: 'gemini' })),
  ];

  const [gpt4Response, claudeResponse, geminiResponse] = await Promise.all(llmPromises);

  // Filter out failed LLMs
  const validResponses = [
    { response: gpt4Response, source: 'gpt4', weight: 0.4 },
    { response: claudeResponse, source: 'claude', weight: 0.35 },
    { response: geminiResponse, source: 'gemini', weight: 0.25 },
  ].filter(({ response }) => response && !response.error);

  if (validResponses.length === 0) {
    throw new Error('All LLM extractions failed');
  }

  console.log(`✅ ${validResponses.length}/3 LLMs succeeded`);

  // Normalize weights (if only 1 LLM works, it gets 100%)
  const totalWeight = validResponses.reduce((sum, { weight }) => sum + weight, 0);
  const normalizedResponses = validResponses.map(({ response, source, weight }) => ({
    response,
    source,
    weight: weight / totalWeight
  }));

  const successfulAnalyses = validResponses.map(r => r.response as LLMAnalysis);

  // STEP 2: Calculate consensus
  const agreementScore = calculateAgreementScore(successfulAnalyses);
  const consensusInsights = mergeInsights(normalizedResponses);
  const confidenceScore = consensusInsights.confidence;

  const processingTime = Date.now() - startTime;

  console.log(`[FEAT-060] Extraction complete in ${processingTime}ms | Agreement: ${(agreementScore * 100).toFixed(1)}% | Confidence: ${(confidenceScore * 100).toFixed(1)}%`);

  return {
    consensus_insights: consensusInsights,
    agreement_score: agreementScore,
    confidence_score: confidenceScore,
    gpt4_analysis: gpt4Response && !gpt4Response.error ? gpt4Response : null,
    claude_analysis: claudeResponse && !claudeResponse.error ? claudeResponse : null,
    gemini_analysis: geminiResponse && !geminiResponse.error ? geminiResponse : null,
    processing_time_ms: processingTime
  };
}

// ═══════════════════════════════════════════════════════════════
// PATTERN MATCHING (placeholder - to be integrated with FEAT-003)
// ═══════════════════════════════════════════════════════════════

export interface PatternMatchResult {
  matched_patterns: string[];
  pattern_match_confidence: number;
  is_novel_pattern: boolean;
}

export async function matchPatterns(insights: ViralInsights): Promise<PatternMatchResult> {
  // TODO: Integrate with existing viral_patterns table from FEAT-003
  // For now, return mock data

  console.log('[FEAT-060] matchPatterns called with insights:', JSON.stringify(insights, null, 2));

  if (typeof insights.novelty_score === 'undefined') {
    console.error('[FEAT-060] ERROR: insights.novelty_score is undefined!', insights);
    throw new Error('novelty_score is not defined in insights');
  }

  const isNovel = insights.novelty_score >= 7;

  return {
    matched_patterns: isNovel ? [] : ['hook-pattern-curiosity-gap', 'structure-problem-solution'],
    pattern_match_confidence: isNovel ? 0.1 : 0.75,
    is_novel_pattern: isNovel
  };
}
