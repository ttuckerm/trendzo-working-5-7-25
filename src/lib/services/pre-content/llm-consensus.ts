/**
 * FEAT-007: Multi-LLM Consensus Scoring Service
 * Calls GPT-4, Claude, and Gemini to score viral potential and calculate consensus
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { LLMScores, LLMConsensusResult } from '@/types/pre-content-prediction';

// ============================================================================
// Configuration
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Check all possible Gemini API key env var names (priority: paid tier key first)
const geminiApiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

// ============================================================================
// Scoring Prompt Template
// ============================================================================

const createScoringPrompt = (
  script: string,
  platform: string,
  niche: string,
  plannedVisuals?: { resolution?: string; fps?: number; plannedHookCuts?: number }
): string => {
  const visualSection = plannedVisuals ? `

PLANNED VISUAL QUALITY:
- Resolution: ${plannedVisuals.resolution || 'not specified'}
- Frame Rate: ${plannedVisuals.fps ? plannedVisuals.fps + ' fps' : 'not specified'}
- Hook Editing (first 3s): ${plannedVisuals.plannedHookCuts !== undefined ? plannedVisuals.plannedHookCuts + ' cuts' : 'not specified'}

${plannedVisuals.resolution || plannedVisuals.fps || plannedVisuals.plannedHookCuts !== undefined
  ? 'IMPORTANT: Factor in production quality. High-quality videos (1080p+, 60fps) and optimal hook pacing (2-4 cuts) correlate with viral success. Add +5-10 points for high production quality.'
  : ''}` : '';

  return `You are a viral content expert analyzing a ${platform} script in the ${niche} niche.

Rate this script's viral potential on a scale of 0-100 based on:
- Hook strength (first 3 seconds grab attention)
- Value delivery (educational, entertaining, or emotional payoff)
- Engagement triggers (questions, curiosity gaps, controversial takes, relatability)
- Niche fit (authenticity and relevance to the niche)
- Story structure (clear beginning, middle, end)
- Production quality (if visual specs provided)

Script:
"""
${script}
"""
${visualSection}

Return ONLY a number between 0 and 100. No explanation, just the score.`;
};

// ============================================================================
// Individual LLM Scorers
// ============================================================================

/**
 * Score script using GPT-4
 */
async function scoreWithGPT4(
  script: string,
  platform: string,
  niche: string,
  plannedVisuals?: { resolution?: string; fps?: number; plannedHookCuts?: number }
): Promise<number> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a viral content scoring expert. Return only a number between 0-100.',
        },
        {
          role: 'user',
          content: createScoringPrompt(script, platform, niche, plannedVisuals),
        },
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const scoreText = response.choices[0]?.message?.content?.trim() || '0';
    const score = parseInt(scoreText, 10);

    if (isNaN(score) || score < 0 || score > 100) {
      console.error(`GPT-4 returned invalid score: ${scoreText}`);
      throw new Error('Invalid score from GPT-4');
    }

    return score;
  } catch (error) {
    console.error('GPT-4 scoring failed:', error);
    throw error;
  }
}

/**
 * Score script using Claude (Anthropic)
 */
async function scoreWithClaude(
  script: string,
  platform: string,
  niche: string,
  plannedVisuals?: { resolution?: string; fps?: number; plannedHookCuts?: number }
): Promise<number> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: createScoringPrompt(script, platform, niche, plannedVisuals),
        },
      ],
    });

    const scoreText = response.content[0]?.type === 'text'
      ? response.content[0].text.trim()
      : '0';
    const score = parseInt(scoreText, 10);

    if (isNaN(score) || score < 0 || score > 100) {
      console.error(`Claude returned invalid score: ${scoreText}`);
      throw new Error('Invalid score from Claude');
    }

    return score;
  } catch (error) {
    console.error('Claude scoring failed:', error);
    throw error;
  }
}

/**
 * Score script using Gemini (Google)
 */
async function scoreWithGemini(
  script: string,
  platform: string,
  niche: string,
  plannedVisuals?: { resolution?: string; fps?: number; plannedHookCuts?: number }
): Promise<number> {
  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: createScoringPrompt(script, platform, niche, plannedVisuals) }] }],
      config: {
        temperature: 0.3,
        maxOutputTokens: 10,
      },
    });

    const scoreText = (result.text || '').trim();
    const score = parseInt(scoreText, 10);

    if (isNaN(score) || score < 0 || score > 100) {
      console.error(`Gemini returned invalid score: ${scoreText}`);
      throw new Error('Invalid score from Gemini');
    }

    return score;
  } catch (error) {
    console.error('Gemini scoring failed:', error);
    throw error;
  }
}

// ============================================================================
// Statistics Helpers
// ============================================================================

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = calculateMean(squaredDiffs);
  return Math.sqrt(variance);
}

// ============================================================================
// Main Consensus Service
// ============================================================================

/**
 * Get consensus score from multiple LLMs
 * Calls GPT-4, Claude, and Gemini in parallel
 * Handles partial failures (2-LLM consensus if one fails)
 */
export async function getLLMConsensusScore(
  script: string,
  platform: string,
  niche: string,
  plannedVisuals?: { resolution?: string; fps?: number; plannedHookCuts?: number }
): Promise<LLMConsensusResult> {
  const scores: LLMScores = {};
  const failedProviders: string[] = [];

  // Call all LLMs in parallel (with FFmpeg planned visuals if provided)
  const [gpt4Result, claudeResult, geminiResult] = await Promise.allSettled([
    scoreWithGPT4(script, platform, niche, plannedVisuals),
    scoreWithClaude(script, platform, niche, plannedVisuals),
    scoreWithGemini(script, platform, niche, plannedVisuals),
  ]);

  // Collect successful scores
  if (gpt4Result.status === 'fulfilled') {
    scores.gpt4 = gpt4Result.value;
  } else {
    failedProviders.push('gpt4');
    console.warn('GPT-4 failed, continuing with other models');
  }

  if (claudeResult.status === 'fulfilled') {
    scores.claude = claudeResult.value;
  } else {
    failedProviders.push('claude');
    console.warn('Claude failed, continuing with other models');
  }

  if (geminiResult.status === 'fulfilled') {
    scores.gemini = geminiResult.value;
  } else {
    failedProviders.push('gemini');
    console.warn('Gemini failed, continuing with other models');
  }

  // Calculate consensus from available scores
  const availableScores = Object.values(scores).filter((s): s is number => s !== undefined);

  if (availableScores.length === 0) {
    throw new Error('All LLM providers failed. Cannot calculate consensus.');
  }

  const consensusScore = calculateMean(availableScores);
  const stdDev = calculateStdDev(availableScores);

  // Confidence: 1 - (stddev / mean), clamped to [0, 1]
  // Higher confidence when scores are closer together
  const confidence = Math.max(0, Math.min(1, 1 - (stdDev / consensusScore)));

  return {
    scores,
    consensusScore: Math.round(consensusScore * 100) / 100, // Round to 2 decimals
    confidence: Math.round(confidence * 1000) / 1000, // Round to 3 decimals
    failedProviders,
  };
}

/**
 * Test connection to all LLM providers
 * Useful for health checks
 */
export async function testLLMConnections(): Promise<{
  gpt4: boolean;
  claude: boolean;
  gemini: boolean;
}> {
  const testScript = "This is a test script.";
  const testPlatform = "tiktok";
  const testNiche = "test";

  const [gpt4Result, claudeResult, geminiResult] = await Promise.allSettled([
    scoreWithGPT4(testScript, testPlatform, testNiche),
    scoreWithClaude(testScript, testPlatform, testNiche),
    scoreWithGemini(testScript, testPlatform, testNiche),
  ]);

  return {
    gpt4: gpt4Result.status === 'fulfilled',
    claude: claudeResult.status === 'fulfilled',
    gemini: geminiResult.status === 'fulfilled',
  };
}
