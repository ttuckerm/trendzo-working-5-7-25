/**
 * Rubric Pack Runner
 *
 * Main entry point for running rubric pack evaluations.
 * Implements LLM calls via Gemini API (Ticket R2 - COMPLETED).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  RubricPackInput,
  RubricPackResult,
  RubricPackConfig,
  PACK_A_CRITERIA
} from './types';

/**
 * Pack A configuration: Content Quality
 */
export const PACK_A_CONFIG: RubricPackConfig = {
  packId: 'content-quality',
  version: '1.0.0',
  name: 'Content Quality Pack',
  description: 'Evaluates content quality across 11 criteria including TAM resonance, shareability, and value density',
  model: 'gpt-4o-mini',
  requiredCriteria: [...PACK_A_CRITERIA],
  systemPrompt: 'You are a viral content evaluator. Evaluate videos for content quality.',
  userPrompt: 'Evaluate this video:\n\nTranscript: {{transcript}}\n\nMetadata: {{metadata}}',
  responseSchema: {
    type: 'object',
    required: ['packId', 'packVersion', 'criteria', 'summary', 'overallConfidence']
  }
};

/**
 * Available pack configurations
 */
const PACK_CONFIGS: Record<string, RubricPackConfig> = {
  'content-quality': PACK_A_CONFIG
};

/**
 * Get list of available pack IDs
 */
export function getAvailablePacks(): string[] {
  return Object.keys(PACK_CONFIGS);
}

/**
 * Get configuration for a specific pack
 */
export function getPackConfig(packId: string): RubricPackConfig {
  const config = PACK_CONFIGS[packId];
  if (!config) {
    throw new Error(`Unknown pack ID: ${packId}`);
  }
  return config;
}

/**
 * Fill template variables in a prompt
 */
function fillTemplate(template: string, input: RubricPackInput): string {
  let filled = template;
  filled = filled.replace(/{{transcript}}/g, input.transcript);
  const metadataStr = input.metadata ? JSON.stringify(input.metadata, null, 2) : 'No metadata provided';
  filled = filled.replace(/{{metadata}}/g, metadataStr);
  filled = filled.replace(/{{videoId}}/g, input.videoId);
  return filled;
}

/**
 * Call LLM for rubric evaluation via Gemini API
 * Ticket R2 - IMPLEMENTED
 */
async function callLLMForRubric(
  config: RubricPackConfig,
  input: RubricPackInput
): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set GOOGLE_GEMINI_AI_API_KEY in environment.');
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: config.model || 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
    systemInstruction: config.systemPrompt
  });

  const userPrompt = fillTemplate(config.userPrompt, input);

  console.log('[RubricRunner] Calling LLM with pack:', config.packId);
  const startTime = Date.now();

  const result = await model.generateContent(userPrompt);
  const response = result.response;
  const text = response.text();

  console.log('[RubricRunner] LLM response received in', Date.now() - startTime, 'ms');

  return text;
}

/**
 * Parse LLM response text, removing markdown code blocks if present
 */
function parseRubricResponse(text: string): unknown {
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
  return JSON.parse(cleanText);
}

/**
 * Run a rubric pack evaluation (MAIN ENTRY POINT)
 */
export async function runRubricPack(
  packId: string,
  input: RubricPackInput
): Promise<RubricPackResult> {
  const config = getPackConfig(packId);
  const startTime = Date.now();

  const rawOutput = await callLLMForRubric(config, input);
  const latencyMs = Date.now() - startTime;

  let parsed: Record<string, unknown>;
  try {
    parsed = parseRubricResponse(rawOutput) as Record<string, unknown>;
  } catch (parseError: any) {
    console.error('[RubricRunner] Failed to parse LLM response:', parseError.message);
    console.error('[RubricRunner] Raw output:', rawOutput.substring(0, 500));
    throw new Error(`Failed to parse rubric response: ${parseError.message}`);
  }

  const result: RubricPackResult = {
    packId: (parsed.packId as string) || packId,
    packVersion: (parsed.packVersion as string) || config.version,
    criteria: parsed.criteria as RubricPackResult['criteria'],
    summary: (parsed.summary as string) || 'No summary provided',
    overallConfidence: (parsed.overallConfidence as number) || 0.5,
    strengths: parsed.strengths as string[] | undefined,
    weaknesses: parsed.weaknesses as string[] | undefined,
    metadata: {
      model: config.model,
      evaluatedAt: new Date().toISOString(),
      latencyMs
    }
  };
  return result;
}
